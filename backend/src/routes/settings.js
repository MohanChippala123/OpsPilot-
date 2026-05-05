import express from 'express';
import { z } from 'zod';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';

export const settingsRouter = express.Router();
settingsRouter.use(requireAuth);

const settingsSchema = z.object({
  businessName: z.string().min(2),
  industry: z.string().min(2),
  phone: z.string().optional(),
  assistantName: z.string().min(2),
  tone: z.string().min(2),
  autoCreateTasks: z.boolean(),
  autoSchedule: z.boolean(),
  escalationRules: z.string().min(2)
});

settingsRouter.get('/', (req, res) => {
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.business_id);
  const ai = db.prepare('SELECT * FROM ai_settings WHERE business_id = ?').get(req.user.business_id);
  res.json({ business, ai });
});

settingsRouter.put('/', (req, res) => {
  const input = settingsSchema.parse(req.body);
  db.transaction(() => {
    db.prepare('UPDATE businesses SET name = ?, industry = ?, phone = ? WHERE id = ?').run(
      input.businessName,
      input.industry,
      input.phone || null,
      req.user.business_id
    );
    db.prepare('UPDATE ai_settings SET assistant_name = ?, tone = ?, auto_create_tasks = ?, auto_schedule = ?, escalation_rules = ? WHERE business_id = ?').run(
      input.assistantName,
      input.tone,
      input.autoCreateTasks ? 1 : 0,
      input.autoSchedule ? 1 : 0,
      input.escalationRules,
      req.user.business_id
    );
  })();
  res.json({ ok: true });
});
