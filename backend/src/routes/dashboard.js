import express from 'express';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';

export const dashboardRouter = express.Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get('/', (req, res) => {
  const businessId = req.user.business_id;
  const counts = {
    openMessages: db.prepare("SELECT COUNT(*) count FROM conversations WHERE business_id = ? AND status = 'open'").get(businessId).count,
    todayAppointments: db.prepare("SELECT COUNT(*) count FROM appointments WHERE business_id = ? AND date(start_at) = date('now')").get(businessId).count,
    openTasks: db.prepare("SELECT COUNT(*) count FROM tasks WHERE business_id = ? AND status != 'done'").get(businessId).count,
    aiSuggestions: db.prepare("SELECT COUNT(*) count FROM messages WHERE business_id = ? AND ai_suggestion IS NOT NULL AND status = 'suggested'").get(businessId).count
  };
  const tasks = db.prepare('SELECT * FROM tasks WHERE business_id = ? ORDER BY due_at LIMIT 5').all(businessId);
  const appointments = db.prepare('SELECT appointments.*, customers.name customer_name FROM appointments LEFT JOIN customers ON customers.id = appointments.customer_id WHERE appointments.business_id = ? ORDER BY start_at LIMIT 5').all(businessId);
  res.json({ counts, tasks, appointments });
});
