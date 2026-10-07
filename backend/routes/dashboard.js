import express from 'express';
import Document from '../models/Document.js';
import User from '../models/User.js';
import SecurityEvent from '../models/SecurityEvent.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { calculateSecurityScore } from '../services/securityScoreService.js';

const router = express.Router();

router.get('/dashboard-summary', authenticate, requireRole('client'), async (req, res) => {
  try {
    const userId = req.user.id;

    const [documents, honeypotEvents, userRecord, securityHealth] = await Promise.all([
      Document.find({ clientId: userId, isHoneypot: { $ne: true } })
        .select('_id documentType originalFilename fileSize sha256Hash createdAt accessGrants')
        .sort({ createdAt: -1 })
        .lean(),
      SecurityEvent.find({ clientId: userId, eventType: 'HONEYPOT_TRIGGERED' })
        .sort({ timestamp: -1 })
        .lean(),
      User.findById(userId).select('isLocked lockReason').lean(),
      calculateSecurityScore(userId),
    ]);

    const totalDocuments = documents.length;
    const honeypotTriggered = honeypotEvents.length > 0;

    const recentDocActivity = documents.slice(0, 8).map(d => ({
      id: d._id,
      type: 'upload',
      message: `Uploaded ${d.originalFilename} (${d.documentType})`,
      timestamp: d.createdAt,
    }));

    const recentSecurityEvents = honeypotEvents.slice(0, 3).map(e => ({
      id: e._id,
      type: 'alert',
      message: `Security incident detected — ${e.details?.message || e.eventType}`,
      timestamp: e.timestamp,
      severity: e.severity,
      ipAddress: e.ipAddress,
    }));

    const recentActivity = [...recentSecurityEvents, ...recentDocActivity]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    const activeGrantsCount = documents.reduce((acc, doc) => {
      return acc + (doc.accessGrants || []).filter(g => g.status === 'ACTIVE').length;
    }, 0);

    return res.status(200).json({
      totalDocuments,
      activeGrantsCount,
      securityScore: securityHealth.compositeScore,
      securityHealth,
      documents,
      recentActivity,
      honeypotStatus: {
        tripsWireActive: true,
        triggered: honeypotTriggered,
        eventCount: honeypotEvents.length,
        events: honeypotEvents.slice(0, 5).map(e => ({
          id: e._id,
          timestamp: e.timestamp,
          severity: e.severity,
          ipAddress: e.ipAddress,
          details: e.details,
        })),
      },
      accountStatus: {
        isLocked: userRecord?.isLocked || false,
        lockReason: userRecord?.lockReason || null,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load dashboard: ' + err.message });
  }
});

router.get('/advisor-dashboard-summary', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const advisorId = req.user.id;

    const accessibleDocs = await Document.find({
      isHoneypot: { $ne: true },
      accessGrants: {
        $elemMatch: {
          advisorId: advisorId,
          status: 'ACTIVE',
        },
      },
    })
      .select('_id documentType originalFilename fileSize sha256Hash createdAt clientId accessGrants')
      .sort({ createdAt: -1 })
      .lean();

    const uniqueClientIds = [...new Set(accessibleDocs.map(d => d.clientId?.toString()).filter(Boolean))];

    const clientRecords = uniqueClientIds.length > 0
      ? await User.find({ _id: { $in: uniqueClientIds } })
          .select('_id name email createdAt')
          .lean()
      : [];

    const clientMap = {};
    for (const c of clientRecords) {
      clientMap[c._id.toString()] = c;
    }

    const enrichedDocs = accessibleDocs.map(d => ({
      ...d,
      clientName:  clientMap[d.clientId?.toString()]?.name  || 'Unknown',
      clientEmail: clientMap[d.clientId?.toString()]?.email || '',
    }));

    const assignedClients = uniqueClientIds
      .map(id => clientMap[id])
      .filter(Boolean)
      .map(c => ({
        id: c._id,
        name: c.name,
        email: c.email,
        documentCount: accessibleDocs.filter(d => d.clientId?.toString() === c._id.toString()).length,
        joinDate: c.createdAt,
      }));

    return res.status(200).json({
      assignedClientsCount:      assignedClients.length,
      accessibleDocumentsCount:  accessibleDocs.length,
      pendingReviewsCount:       0,
      documents:                 enrichedDocs,
      assignedClients,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load advisor dashboard: ' + err.message });
  }
});


export default router;
