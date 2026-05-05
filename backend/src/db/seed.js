import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { env } from '../config/env.js';
import { migrate } from './migrate.js';
import { db } from './client.js';

if (env.NODE_ENV === 'production') {
  console.error('Refusing to seed demo data while NODE_ENV=production.');
  process.exit(1);
}

migrate();

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('owner@brightlinehvac.com');
if (existing) {
  console.log('Seed data already exists.');
  process.exit(0);
}

const businessId = nanoid();
const userId = nanoid();
const customerIds = [nanoid(), nanoid(), nanoid()];
const conversationIds = [nanoid(), nanoid(), nanoid()];
const messageIds = [nanoid(), nanoid(), nanoid()];

db.transaction(() => {
  db.prepare('INSERT INTO businesses (id, name, industry, timezone, phone) VALUES (?, ?, ?, ?, ?)').run(
    businessId,
    'Brightline HVAC',
    'HVAC services',
    'America/New_York',
    '(555) 019-4481'
  );
  db.prepare('INSERT INTO users (id, business_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)').run(
    userId,
    businessId,
    'Sam Owner',
    'owner@brightlinehvac.com',
    bcrypt.hashSync('password123', 10),
    'owner'
  );
  db.prepare('INSERT INTO ai_settings (business_id, assistant_name, tone, auto_create_tasks, auto_schedule) VALUES (?, ?, ?, ?, ?)').run(
    businessId,
    'Ava',
    'warm, efficient, and professional',
    1,
    0
  );

  const customers = [
    ['Maria Chen', 'maria@example.com', '(555) 010-2233'],
    ['The Mason Group', 'ops@mason.example', '(555) 010-8841'],
    ['Dr. Patel Dental', 'frontdesk@patel.example', '(555) 010-4412']
  ];
  customers.forEach((customer, index) => {
    db.prepare('INSERT INTO customers (id, business_id, name, email, phone) VALUES (?, ?, ?, ?, ?)').run(customerIds[index], businessId, ...customer);
    db.prepare("INSERT INTO conversations (id, business_id, customer_id, channel, status, last_message_at) VALUES (?, ?, ?, ?, ?, datetime('now', ?))").run(
      conversationIds[index],
      businessId,
      customerIds[index],
      index === 1 ? 'email' : 'sms',
      'open',
      `-${index + 1} hours`
    );
  });

  const messages = [
    ['customer', 'Hi, our AC stopped working last night. Can someone come by tomorrow morning?', 'booking', 'I can help schedule that. We have openings tomorrow between 9-11am or 1-3pm. Which window works best?', 0.94],
    ['customer', 'Please remind tenants in unit 4B about the filter replacement on Friday.', 'reminder', 'Absolutely. I can create a reminder task for unit 4B filter replacement this Friday.', 0.88],
    ['customer', 'A patient says the waiting room is too cold again.', 'complaint', 'Thanks for flagging this. I recommend escalating to the team and scheduling a thermostat check.', 0.82]
  ];
  messages.forEach((message, index) => {
    db.prepare('INSERT INTO messages (id, conversation_id, business_id, sender_type, body, intent, ai_suggestion, confidence, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      messageIds[index],
      conversationIds[index],
      businessId,
      ...message,
      'suggested'
    );
  });

  db.prepare("INSERT INTO appointments (id, business_id, customer_id, title, description, start_at, end_at, status, source_message_id) VALUES (?, ?, ?, ?, ?, datetime('now', '+1 day', 'start of day', '+10 hours'), datetime('now', '+1 day', 'start of day', '+12 hours'), ?, ?)").run(
    nanoid(),
    businessId,
    customerIds[0],
    'AC diagnostic visit',
    'Check failed air conditioning system.',
    'scheduled',
    messageIds[0]
  );

  const tasks = [
    ['Confirm tomorrow morning availability', 'Call Maria and confirm 9-11am appointment window.', 'todo', 'high', '+4 hours', customerIds[0], messageIds[0]],
    ['Send filter replacement reminder', 'Notify tenants in unit 4B about Friday filter replacement.', 'in_progress', 'medium', '+1 day', customerIds[1], messageIds[1]],
    ['Review waiting room temperature complaint', 'Escalate and dispatch thermostat check if needed.', 'todo', 'high', '+2 hours', customerIds[2], messageIds[2]],
    ['Close out completed maintenance logs', 'Attach notes for jobs completed this week.', 'done', 'low', '-1 day', null, null]
  ];
  tasks.forEach(([title, description, status, priority, due, customerId, sourceMessageId]) => {
    db.prepare("INSERT INTO tasks (id, business_id, customer_id, title, description, status, priority, due_at, source_message_id) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?), ?)").run(
      nanoid(),
      businessId,
      customerId,
      title,
      description,
      status,
      priority,
      due,
      sourceMessageId
    );
  });
})();

console.log('Seeded demo data.');
