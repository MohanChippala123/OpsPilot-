import express from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound } from '../utils/http.js';

export const tasksRouter = express.Router();
tasksRouter.use(requireAuth);

const taskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueAt: z.string().datetime().optional()
});

tasksRouter.get('/', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks WHERE business_id = ? ORDER BY created_at DESC').all(req.user.business_id);
  res.json({ tasks });
});

tasksRouter.post('/', (req, res) => {
  const input = taskSchema.parse(req.body);
  const id = nanoid();
  db.prepare('INSERT INTO tasks (id, business_id, title, description, status, priority, due_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id,
    req.user.business_id,
    input.title,
    input.description || null,
    input.status,
    input.priority,
    input.dueAt || null
  );
  res.status(201).json({ id });
});

tasksRouter.patch('/:id', (req, res, next) => {
  const input = z.object({ status: z.enum(['todo', 'in_progress', 'done']) }).parse(req.body);
  const result = db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND business_id = ?').run(input.status, req.params.id, req.user.business_id);
  if (!result.changes) return next(notFound('Task not found'));
  res.json({ ok: true });
});
