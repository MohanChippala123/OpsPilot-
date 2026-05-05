import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '../db/client.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = express.Router();

const signupSchema = z.object({
  businessName: z.string().min(2),
  industry: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function tokenFor(user) {
  return jwt.sign({ sub: user.id, businessId: user.business_id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

authRouter.post('/signup', (req, res) => {
  const input = signupSchema.parse(req.body);
  const businessId = nanoid();
  const userId = nanoid();
  const passwordHash = bcrypt.hashSync(input.password, 10);

  db.transaction(() => {
    db.prepare('INSERT INTO businesses (id, name, industry) VALUES (?, ?, ?)').run(businessId, input.businessName, input.industry);
    db.prepare('INSERT INTO ai_settings (business_id) VALUES (?)').run(businessId);
    db.prepare('INSERT INTO users (id, business_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)').run(
      userId,
      businessId,
      input.name,
      input.email.toLowerCase(),
      passwordHash,
      'owner'
    );
  })();

  const user = { id: userId, business_id: businessId, name: input.name, email: input.email.toLowerCase(), role: 'owner' };
  res.status(201).json({ token: tokenFor(user), user });
});

authRouter.post('/login', (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = db.prepare('SELECT id, business_id, name, email, password_hash, role FROM users WHERE email = ?').get(input.email.toLowerCase());
  if (!user || !bcrypt.compareSync(input.password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({
    token: tokenFor(user),
    user: { id: user.id, business_id: user.business_id, name: user.name, email: user.email, role: user.role }
  });
});

authRouter.get('/me', requireAuth, (req, res) => {
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.business_id);
  res.json({ user: req.user, business });
});
