import express from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';

export const appointmentsRouter = express.Router();
appointmentsRouter.use(requireAuth);

const appointmentSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  customerId: z.string().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']).default('scheduled')
});

appointmentsRouter.get('/', (req, res) => {
  const appointments = db.prepare(`
    SELECT appointments.*, customers.name customer_name
    FROM appointments
    LEFT JOIN customers ON customers.id = appointments.customer_id
    WHERE appointments.business_id = ?
    ORDER BY appointments.start_at
  `).all(req.user.business_id);
  res.json({ appointments });
});

appointmentsRouter.post('/', (req, res) => {
  const input = appointmentSchema.parse(req.body);
  const id = nanoid();
  db.prepare('INSERT INTO appointments (id, business_id, customer_id, title, description, start_at, end_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    id,
    req.user.business_id,
    input.customerId || null,
    input.title,
    input.description || null,
    input.startAt,
    input.endAt,
    input.status
  );
  res.status(201).json({ id });
});
