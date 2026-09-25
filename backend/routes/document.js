import express from 'express';
import multer from 'multer';
import Document from '../models/Document.js';
import User from '../models/User.js';
import SecurityEvent from '../models/SecurityEvent.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { computeSHA256, encryptDocument, decryptDocument, verifyIntegrity } from '../services/cryptoService.js';
import { getAdvisorPublicKey, getAdvisorPrivateKey } from '../services/keyService.js';
import crypto from 'crypto';

const router = express.Router();

const ALLOWED_TYPES = ['PAN', 'AADHAAR', 'ITR', 'SALARY_SLIP', 'PORTFOLIO'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, and PNG files are accepted'));
    }
  },
});

router.post(
  '/upload',
  authenticate,
  requireRole('client'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file attached' });
      }

      const { documentType } = req.body;
      if (!documentType || !ALLOWED_TYPES.includes(documentType)) {
        return res.status(400).json({
          error: `documentType must be one of: ${ALLOWED_TYPES.join(', ')}`,
        });
      }

      const sha256Hash = computeSHA256(req.file.buffer);
      const vaultPublicKeyPem = getAdvisorPublicKey();
      const { encryptedBlob, iv, authTag, encryptedAESKey } = encryptDocument(
        req.file.buffer,
        vaultPublicKeyPem
      );

      req.file.buffer = null;

      const doc = await Document.create({
        clientId: req.user.id,
        documentType,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        encryptedBlob,
        iv,
        authTag,
        encryptedAESKey,
        sha256Hash,
      });

      return res.status(201).json({
        message: 'Document encrypted and stored securely',
        documentId: doc._id,
        sha256Hash: doc.sha256Hash,
        createdAt: doc.createdAt,
      });
    } catch (err) {
      if (err.message && err.message.includes('File too large')) {
        return res.status(413).json({ error: 'File exceeds 10 MB limit' });
      }
      return res.status(500).json({ error: 'Upload failed: ' + err.message });
    }
  }
);

router.get('/my-documents', authenticate, async (req, res) => {
  try {
    const docs = await Document.find({ clientId: req.user.id, isHoneypot: { $ne: true } })
      .select('_id documentType originalFilename fileSize sha256Hash createdAt accessGrants')
      .sort({ createdAt: -1 })
      .populate('accessGrants.advisorId', 'name email')
      .lean();

    const result = docs.map(doc => ({
      ...doc,
      accessGrants: (doc.accessGrants || [])
        .filter(g => g.status === 'ACTIVE')
        .map(g => ({
          advisorId: g.advisorId?._id || g.advisorId,
          advisorName: g.advisorId?.name || '',
          advisorEmail: g.advisorId?.email || '',
          grantedAt: g.grantedAt,
          status: g.status,
        })),
    }));

    return res.status(200).json(result);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.post('/:id/grant-access', authenticate, requireRole('client'), async (req, res) => {
  try {
    const { advisorEmail, advisorId } = req.body;

    if (!advisorEmail && !advisorId) {
      return res.status(400).json({ error: 'advisorEmail or advisorId is required' });
    }

    const doc = await Document.findById(req.params.id).select('+isHoneypot');
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (doc.isHoneypot) {
      await SecurityEvent.create({
        userId: req.user.id,
        clientId: doc.clientId,
        documentId: doc._id,
        eventType: 'HONEYPOT_TRIGGERED',
        severity: 'CRITICAL',
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
        details: { message: 'Unauthorized interaction with trapped decoy asset (grant-access attempt)', filename: doc.originalFilename },
      });
      await User.findByIdAndUpdate(req.user.id, {
        isLocked: true,
        lockReason: 'Automated containment: Honeypot tripwire triggered',
      });
      return res.status(403).json({ error: 'Access denied: Security verification failed' });
    }

    if (doc.clientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this document' });
    }

    const query = advisorEmail
      ? { email: advisorEmail.toLowerCase(), role: 'admin' }
      : { _id: advisorId, role: 'admin' };

    const advisor = await User.findOne(query).select('_id name email rsaPublicKeyPem');
    if (!advisor) {
      return res.status(404).json({ error: 'Advisor not found or is not an admin' });
    }
    if (!advisor.rsaPublicKeyPem) {
      return res.status(422).json({ error: 'Advisor has no registered RSA public key' });
    }

    const existingGrant = doc.accessGrants.find(
      g => g.advisorId.toString() === advisor._id.toString() && g.status === 'ACTIVE'
    );
    if (existingGrant) {
      return res.status(409).json({ error: 'Access has already been granted to this advisor' });
    }

    const vaultPrivateKeyPem = getAdvisorPrivateKey();
    let rawAESKey;
    try {
      rawAESKey = crypto.privateDecrypt(
        {
          key: vaultPrivateKeyPem,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.isBuffer(doc.encryptedAESKey) ? doc.encryptedAESKey : Buffer.from(doc.encryptedAESKey)
      );
    } catch {
      return res.status(500).json({ error: 'Failed to recover document key from vault' });
    }

    let advisorEncryptedAESKey;
    try {
      advisorEncryptedAESKey = crypto.publicEncrypt(
        {
          key: advisor.rsaPublicKeyPem,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        rawAESKey
      );
    } finally {
      rawAESKey.fill(0);
    }

    const revokedIndex = doc.accessGrants.findIndex(
      g => g.advisorId.toString() === advisor._id.toString() && g.status === 'REVOKED'
    );

    if (revokedIndex !== -1) {
      doc.accessGrants[revokedIndex].encryptedAESKey = advisorEncryptedAESKey;
      doc.accessGrants[revokedIndex].status = 'ACTIVE';
      doc.accessGrants[revokedIndex].grantedAt = new Date();
    } else {
      doc.accessGrants.push({
        advisorId: advisor._id,
        encryptedAESKey: advisorEncryptedAESKey,
        status: 'ACTIVE',
      });
    }

    await doc.save();

    return res.status(200).json({
      message: 'Access granted successfully',
      advisor: {
        id: advisor._id,
        name: advisor.name,
        email: advisor.email,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Grant access failed: ' + err.message });
  }
});

router.post('/:id/revoke-access', authenticate, requireRole('client'), async (req, res) => {
  try {
    const { advisorId } = req.body;
    if (!advisorId) {
      return res.status(400).json({ error: 'advisorId is required' });
    }

    const doc = await Document.findById(req.params.id).select('+isHoneypot');
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (doc.isHoneypot) {
      await SecurityEvent.create({
        userId: req.user.id,
        clientId: doc.clientId,
        documentId: doc._id,
        eventType: 'HONEYPOT_TRIGGERED',
        severity: 'CRITICAL',
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
        details: { message: 'Unauthorized interaction with trapped decoy asset (revoke-access attempt)', filename: doc.originalFilename },
      });
      await User.findByIdAndUpdate(req.user.id, {
        isLocked: true,
        lockReason: 'Automated containment: Honeypot tripwire triggered',
      });
      return res.status(403).json({ error: 'Access denied: Security verification failed' });
    }

    if (doc.clientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this document' });
    }

    const grant = doc.accessGrants.find(
      g => g.advisorId.toString() === advisorId && g.status === 'ACTIVE'
    );
    if (!grant) {
      return res.status(404).json({ error: 'Active grant for this advisor not found' });
    }

    grant.status = 'REVOKED';
    await doc.save();

    return res.status(200).json({ message: 'Access revoked successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Revoke access failed: ' + err.message });
  }
});

router.get('/:id/verify-and-view', authenticate, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).select('+isHoneypot');
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (doc.isHoneypot) {
      await SecurityEvent.create({
        userId: req.user.id,
        clientId: doc.clientId,
        documentId: doc._id,
        eventType: 'HONEYPOT_TRIGGERED',
        severity: 'CRITICAL',
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
        details: { message: 'Unauthorized interaction with trapped decoy asset', filename: doc.originalFilename },
      });
      await User.findByIdAndUpdate(req.user.id, {
        isLocked: true,
        lockReason: 'Automated containment: Honeypot tripwire triggered',
      });
      return res.status(403).json({ error: 'Access denied: Security verification failed' });
    }

    let encryptedKeyEnvelope;
    let privateKeyPem;

    if (req.user.role === 'client') {
      if (doc.clientId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      encryptedKeyEnvelope = doc.encryptedAESKey;
      privateKeyPem = getAdvisorPrivateKey();
    } else if (req.user.role === 'admin') {
      const grant = doc.accessGrants.find(
        g => g.advisorId.toString() === req.user.id && g.status === 'ACTIVE'
      );
      if (!grant) {
        return res.status(403).json({
          error: 'Access denied: Document not shared with your advisor account',
        });
      }
      encryptedKeyEnvelope = grant.encryptedAESKey;
      const advisor = await User.findById(req.user.id).select('rsaPrivateKeyPem');
      if (!advisor || !advisor.rsaPrivateKeyPem) {
        return res.status(500).json({ error: 'Advisor private key not found' });
      }
      privateKeyPem = advisor.rsaPrivateKeyPem;
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    let decryptedBuffer;
    try {
      decryptedBuffer = decryptDocument(
        doc.encryptedBlob,
        doc.iv,
        doc.authTag,
        encryptedKeyEnvelope,
        privateKeyPem
      );
    } catch (err) {
      if (err.code === 'CIPHERTEXT_AUTH_FAILED') {
        return res.status(400).json({
          error: 'GCM authentication tag mismatch. Ciphertext corrupted or altered in storage.',
          tamperDetected: true,
        });
      }
      return res.status(500).json({ error: 'Decryption failed: ' + err.message });
    }

    const { isValid, computedHash } = verifyIntegrity(decryptedBuffer, doc.sha256Hash);

    if (!isValid) {
      return res.status(400).json({
        error: 'SHA-256 baseline digest mismatch. Document integrity compromised.',
        tamperDetected: true,
        storedHash: doc.sha256Hash,
        computedHash,
      });
    }

    return res.status(200).json({
      status: 'VERIFIED',
      tamperDetected: false,
      sha256: doc.sha256Hash,
      fileBase64: decryptedBuffer.toString('base64'),
      mimeType: doc.mimeType,
      originalFilename: doc.originalFilename,
      documentType: doc.documentType,
      fileSize: doc.fileSize,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Verify and view failed: ' + err.message });
  }
});

export default router;
