import express from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { aiProvider } from '../services/ai/index.js';
import { notFound } from '../utils/http.js';

export const messagesRouter = express.Router();
messagesRouter.use(requireAuth);

const incomingSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().optional(),
  channel: z.enum(['sms', 'email', 'web']).default('sms'),
  body: z.string().min(2)
});

messagesRouter.get('/', (req, res) => {
  const businessId = req.user.business_id;
  const conversations = db.prepare(`
    SELECT c.*, cu.name customer_name, cu.email customer_email, cu.phone customer_phone,
      (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) last_message,
      (SELECT ai_suggestion FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) ai_suggestion,
      (SELECT intent FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) intent
    FROM conversations c
    JOIN customers cu ON cu.id = c.customer_id
    WHERE c.business_id = ?
    ORDER BY c.last_message_at DESC
  `).all(businessId);
  res.json({ conversations });
});

messagesRouter.get('/:conversationId', (req, res, next) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ? AND business_id = ?').get(req.params.conversationId, req.user.business_id);
  if (!conversation) return next(notFound('Conversation not found'));
  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at').all(req.params.conversationId);
  res.json({ conversation, messages });
});

messagesRouter.post('/incoming', async (req, res, next) => {
  try {
    const input = incomingSchema.parse(req.body);
    const businessId = req.user.business_id;
    const customerId = nanoid();
    const conversationId = nanoid();
    const messageId = nanoid();

    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);
    const settings = db.prepare('SELECT * FROM ai_settings WHERE business_id = ?').get(businessId);
    const analysis = await aiProvider.analyzeMessage({ message: input.body, business, settings });

    db.transaction(() => {
      db.prepare('INSERT INTO customers (id, business_id, name, email, phone) VALUES (?, ?, ?, ?, ?)').run(
        customerId,
        businessId,
        input.customerName,
        input.customerEmail || null,
        input.customerPhone || null
      );
      db.prepare('INSERT INTO conversations (id, business_id, customer_id, channel, status) VALUES (?, ?, ?, ?, ?)').run(
        conversationId,
        businessId,
        customerId,
        input.channel,
        'open'
      );
      db.prepare('INSERT INTO messages (id, conversation_id, business_id, sender_type, body, intent, ai_suggestion, confidence, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        messageId,
        conversationId,
        businessId,
        'customer',
        input.body,
        analysis.intent,
        analysis.reply,
        analysis.confidence,
        'suggested'
      );
      if (settings.auto_create_tasks && analysis.actions?.createTask) {
        db.prepare("INSERT INTO tasks (id, business_id, customer_id, title, description, priority, source_message_id, due_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+4 hours'))").run(
          nanoid(),
          businessId,
          customerId,
          analysis.actions.task.title,
          analysis.actions.task.description,
          analysis.actions.task.priority,
          messageId
        );
      }
      if (settings.auto_schedule && analysis.actions?.appointment) {
        db.prepare("INSERT INTO appointments (id, business_id, customer_id, title, description, start_at, end_at, source_message_id) VALUES (?, ?, ?, ?, ?, datetime('now', '+1 day'), datetime('now', '+1 day', '+2 hours'), ?)").run(
          nanoid(),
          businessId,
          customerId,
          analysis.actions.appointment.title,
          analysis.actions.appointment.description,
          messageId
        );
      }
    })();

    res.status(201).json({ conversationId, messageId, analysis });
  } catch (error) {
    next(error);
  }
});

messagesRouter.post('/:messageId/approve', (req, res, next) => {
  const { body } = z.object({ body: z.string().min(1) }).parse(req.body);
  const message = db.prepare('SELECT * FROM messages WHERE id = ? AND business_id = ?').get(req.params.messageId, req.user.business_id);
  if (!message) return next(notFound('Message not found'));
  const sentId = nanoid();
  db.transaction(() => {
    db.prepare("UPDATE messages SET status = 'approved' WHERE id = ?").run(message.id);
    db.prepare('INSERT INTO messages (id, conversation_id, business_id, sender_type, body, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      sentId,
      message.conversation_id,
      req.user.business_id,
      'user',
      body,
      'sent'
    );
    db.prepare('UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?').run(message.conversation_id);
  })();
  res.status(201).json({ id: sentId });
});
