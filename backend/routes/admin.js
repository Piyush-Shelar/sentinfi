import express from 'express';
import SecurityEvent from '../models/SecurityEvent.js';
import User from '../models/User.js';
import Document from '../models/Document.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/security-events', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { eventType, severity, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (severity) filter.severity = severity;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [events, total] = await Promise.all([
      SecurityEvent.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email role')
        .populate('clientId', 'name email')
        .populate('documentId', 'originalFilename documentType')
        .lean(),
      SecurityEvent.countDocuments(filter),
    ]);

    const formatted = events.map(e => ({
      id: e._id,
      eventType: e.eventType,
      severity: e.severity,
      timestamp: e.timestamp,
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
      details: e.details,
      actor: {
        id: e.userId?._id,
        name: e.userId?.name || 'Unknown',
        email: e.userId?.email || '',
        role: e.userId?.role || '',
      },
      client: {
        id: e.clientId?._id,
        name: e.clientId?.name || 'Unknown',
        email: e.clientId?.email || '',
      },
      document: e.documentId
        ? {
            id: e.documentId._id,
            filename: e.documentId.originalFilename,
            type: e.documentId.documentType,
          }
        : null,
    }));

    return res.status(200).json({
      events: formatted,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load security events: ' + err.message });
  }
});

router.get('/security-summary', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const [
      totalEvents,
      honeypotCount,
      tamperCount,
      criticalCount,
      recentEvents,
      lockedUsers,
    ] = await Promise.all([
      SecurityEvent.countDocuments({}),
      SecurityEvent.countDocuments({ eventType: 'HONEYPOT_TRIGGERED' }),
      SecurityEvent.countDocuments({ eventType: 'TAMPER_DETECTED' }),
      SecurityEvent.countDocuments({ severity: 'CRITICAL' }),
      SecurityEvent.find({})
        .sort({ timestamp: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .populate('clientId', 'name email')
        .populate('documentId', 'originalFilename')
        .lean(),
      User.find({ isLocked: true }).select('name email lockReason createdAt').lean(),
    ]);

    return res.status(200).json({
      totalEvents,
      honeypotCount,
      tamperCount,
      criticalCount,
      lockedAccountCount: lockedUsers.length,
      lockedUsers: lockedUsers.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        lockReason: u.lockReason,
      })),
      recentEvents: recentEvents.map(e => ({
        id: e._id,
        eventType: e.eventType,
        severity: e.severity,
        timestamp: e.timestamp,
        ipAddress: e.ipAddress,
        details: e.details,
        actor: { name: e.userId?.name || 'Unknown', email: e.userId?.email || '' },
        client: { name: e.clientId?.name || 'Unknown', email: e.clientId?.email || '' },
        document: e.documentId ? { filename: e.documentId.originalFilename } : null,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load security summary: ' + err.message });
  }
});

router.post('/unlock-user/:userId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isLocked = false;
    user.lockReason = null;
    await user.save();

    return res.status(200).json({ message: `Account for ${user.email} has been unlocked.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to unlock user: ' + err.message });
  }
});

export default router;
