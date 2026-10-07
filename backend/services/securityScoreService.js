import mongoose from 'mongoose';
import Document from '../models/Document.js';
import User from '../models/User.js';
import SecurityEvent from '../models/SecurityEvent.js';

async function computeE(userId) {
  const total = await Document.countDocuments({ clientId: userId });
  if (total === 0) return 100;
  const compliant = await Document.countDocuments({
    clientId: userId,
    encryptedBlob: { $ne: null },
    iv:            { $ne: null },
    authTag:       { $ne: null },
    encryptedAESKey: { $ne: null },
  });
  return Math.round((compliant / total) * 100);
}

async function computeP(userId) {
  const user = await User.findById(userId).select('createdAt passwordMetrics').lean();
  if (!user) return 0;
  if (!user.passwordMetrics || user.passwordMetrics.entropyScore === 0) return 30;
  const m = user.passwordMetrics;
  const strengthScore = m.entropyScore || 0;
  const ageInDays = (Date.now() - new Date(m.updatedAt || user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const ageScore = ageInDays <= 90 ? 20 : ageInDays <= 180 ? 10 : 0;
  return Math.min(100, Math.round(strengthScore * 0.8 + ageScore));
}

async function computeT(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const count = await SecurityEvent.countDocuments({
    $or: [
      { clientId: userObjectId },
      { userId: userObjectId },
    ],
    eventType: {
      $in: [
        'TAMPER_DETECTED_HASH',
        'TAMPER_DETECTED_CIPHERTEXT',
        'TAMPER_DETECTED',
        'tamper_detected_hash',
        'tamper_detected',
      ],
    },
  });
  return { score: Math.max(0, 100 - count * 25), incidents: count };
}

async function computeA(userId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const count = await SecurityEvent.countDocuments({
    userId,
    timestamp: { $gte: thirtyDaysAgo },
    eventType: { $in: ['AUTH_FAILURE', 'ACCESS_ANOMALY', 'CONCURRENT_SESSION_MISMATCH'] },
  });
  return Math.max(0, 100 - count * 15);
}

async function computeH(userId) {
  const count = await SecurityEvent.countDocuments({
    clientId: userId,
    eventType: 'HONEYPOT_TRIGGERED',
  });
  return count > 0 ? 0 : 100;
}

export async function calculateSecurityScore(userId) {
  const [E, P, tResult, A, H] = await Promise.all([
    computeE(userId),
    computeP(userId),
    computeT(userId),
    computeA(userId),
    computeH(userId),
  ]);

  const T = tResult.score;
  const compositeScore = Math.round(0.30 * E + 0.25 * P + 0.20 * T + 0.15 * A + 0.10 * H);

  return {
    compositeScore,
    factors: {
      encryption:      { score: E, weight: 0.30 },
      passwordHygiene: { score: P, weight: 0.25 },
      tamperHistory:   { score: T, weight: 0.20, incidentsDetected: tResult.incidents },
      accessAnomaly:   { score: A, weight: 0.15 },
      honeypot:        { score: H, weight: 0.10 },
    },
    status: compositeScore >= 80 ? 'OPTIMAL' : compositeScore >= 60 ? 'WARNING' : 'CRITICAL',
  };
}
