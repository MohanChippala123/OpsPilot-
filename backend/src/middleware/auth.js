import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { db } from '../db/client.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = db.prepare('SELECT id, business_id, name, email, role FROM users WHERE id = ?').get(payload.sub);
    if (!user) return res.status(401).json({ error: 'Invalid auth token' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid auth token' });
  }
}
