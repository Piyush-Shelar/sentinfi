import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { seedClientHoneypot } from '../services/honeypotService.js';
import { getAdvisorPublicKey } from '../services/keyService.js';

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function analysePassword(password) {
  const len = password.length;
  const hasUpper   = /[A-Z]/.test(password);
  const hasLower   = /[a-z]/.test(password);
  const hasNum     = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const lengthScore = len >= 12 ? 40 : len >= 8 ? 20 : 10;
  const varietyScore = (hasUpper ? 10 : 0) + (hasLower ? 10 : 0) +
                       (hasNum   ? 10 : 0) + (hasSpecial ? 10 : 0);
  const baseScore = lengthScore + varietyScore;
  const bonus = len >= 14 && hasUpper && hasLower && hasNum && hasSpecial ? 20 : 0;
  const entropyScore = Math.min(100, baseScore + bonus);

  return {
    length:         len,
    hasUpperCase:   hasUpper,
    hasLowerCase:   hasLower,
    hasNumber:      hasNum,
    hasSpecialChar: hasSpecial,
    entropyScore,
    updatedAt:      new Date(),
  };
};

function generateRsaKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding:  { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });
}

function signAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!['client', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be client or admin' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hash = await bcrypt.hash(password, 12);
    const passwordMetrics = analysePassword(password);
    let rsaPublicKeyPem = null;
    let rsaPrivateKeyPem = null;
    if (role === 'admin') {
      const kp = generateRsaKeyPair();
      rsaPublicKeyPem = kp.publicKey;
      rsaPrivateKeyPem = kp.privateKey;
    }
    const user = await User.create({ name, email: email.toLowerCase(), password: hash, role, rsaPublicKeyPem, rsaPrivateKeyPem, passwordMetrics });

    if (role === 'client') {
      const vaultPublicKey = getAdvisorPublicKey();
      seedClientHoneypot(user._id, vaultPublicKey).catch(() => {});
    }

    return res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch {
    return res.status(500).json({ error: 'Server error during signup' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isLocked) {
      return res.status(403).json({
        error: 'Account suspended due to detected security violation. Contact compliance.',
        locked: true,
      });
    }

    if (user.role === 'admin' && !user.rsaPublicKeyPem) {
      const kp = generateRsaKeyPair();
      user.rsaPublicKeyPem = kp.publicKey;
      user.rsaPrivateKeyPem = kp.privateKey;
      await user.save();
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Server error during login' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Refresh token is invalid or expired' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    if (user.isLocked) {
      return res.status(403).json({
        error: 'Account suspended due to detected security violation. Contact compliance.',
        locked: true,
      });
    }

    const accessToken = signAccessToken(user);
    return res.status(200).json({ accessToken });
  } catch {
    return res.status(500).json({ error: 'Server error during token refresh' });
  }
});

export default router;
