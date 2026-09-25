import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = header.slice(7);
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token is invalid or expired' });
  }

  const user = await User.findById(decoded.id).select('isLocked lockReason role').lean();
  if (!user) {
    return res.status(401).json({ error: 'Token is invalid or expired' });
  }
  if (user.isLocked) {
    return res.status(403).json({
      error: 'Account suspended due to detected security violation. Contact compliance.',
      locked: true,
    });
  }

  req.user = { id: decoded.id, role: decoded.role };
  next();
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}
