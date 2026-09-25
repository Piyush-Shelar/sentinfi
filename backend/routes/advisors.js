import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

function generateRsaKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding:  { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });
}

router.get('/', authenticate, requireRole('client'), async (req, res) => {
  try {
    const advisors = await User.find({ role: 'admin' })
      .select('_id name email rsaPublicKeyPem rsaPrivateKeyPem')
      .lean();

    const provisioned = [];
    for (const advisor of advisors) {
      if (!advisor.rsaPublicKeyPem) {
        const kp = generateRsaKeyPair();
        await User.findByIdAndUpdate(advisor._id, {
          rsaPublicKeyPem: kp.publicKey,
          rsaPrivateKeyPem: kp.privateKey,
        });
        advisor.rsaPublicKeyPem = kp.publicKey;
      }
      provisioned.push({
        id: advisor._id,
        name: advisor.name,
        email: advisor.email,
        rsaPublicKeyPem: advisor.rsaPublicKeyPem,
      });
    }

    return res.status(200).json(provisioned);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch advisors' });
  }
});

export default router;
