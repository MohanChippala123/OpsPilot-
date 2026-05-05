const DB_KEY = 'opspilot_local_db';

const now = () => new Date().toISOString();
const id = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

function defaultDb() {
  const businessId = id();
  const userId = id();
  const customers = [
    { id: id(), business_id: businessId, name: 'Maria Chen', email: 'maria@example.com', phone: '(555) 010-2233' },
    { id: id(), business_id: businessId, name: 'The Mason Group', email: 'ops@mason.example', phone: '(555) 010-8841' },
    { id: id(), business_id: businessId, name: 'Dr. Patel Dental', email: 'frontdesk@patel.example', phone: '(555) 010-4412' }
  ];
  const conversations = customers.map((customer, index) => ({
    id: id(),
    business_id: businessId,
    customer_id: customer.id,
    channel: index === 1 ? 'email' : 'sms',
    status: 'open',
    last_message_at: now()
  }));
  const messages = [
    ['customer', 'Hi, our AC stopped working last night. Can someone come by tomorrow morning?', 'booking', 'I can help schedule that. We have openings tomorrow between 9-11am or 1-3pm. Which window works best?', 0.94],
    ['customer', 'Please remind tenants in unit 4B about the filter replacement on Friday.', 'reminder', 'Absolutely. I can create a reminder task for unit 4B filter replacement this Friday.', 0.88],
    ['customer', 'A patient says the waiting room is too cold again.', 'complaint', 'Thanks for flagging this. I recommend escalating to the team and scheduling a thermostat check.', 0.82]
  ].map(([sender_type, body, intent, ai_suggestion, confidence], index) => ({
    id: id(),
    conversation_id: conversations[index].id,
    business_id: businessId,
    sender_type,
    body,
    intent,
    ai_suggestion,
    confidence,
    status: 'suggested',
    created_at: now()
  }));

  return {
    businesses: [{ id: businessId, name: 'Brightline HVAC', industry: 'HVAC services', phone: '(555) 019-4481', timezone: 'America/New_York' }],
    users: [{ id: userId, business_id: businessId, name: 'Sam Owner', email: 'owner@brightlinehvac.com', password: 'password123', role: 'owner' }],
    aiSettings: [{ business_id: businessId, assistant_name: 'Ava', tone: 'warm, efficient, and professional', auto_create_tasks: 1, auto_schedule: 0, escalation_rules: 'Complaints, billing disputes, and emergencies should be reviewed by a human.' }],
    customers,
    conversations,
    messages,
    appointments: [{ id: id(), business_id: businessId, customer_id: customers[0].id, customer_name: customers[0].name, title: 'AC diagnostic visit', description: 'Check failed air conditioning system.', start_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), end_at: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(), status: 'scheduled', created_at: now() }],
    tasks: [
      { id: id(), business_id: businessId, customer_id: customers[0].id, title: 'Confirm tomorrow morning availability', description: 'Call Maria and confirm 9-11am appointment window.', status: 'todo', priority: 'high', due_at: now(), created_at: now() },
      { id: id(), business_id: businessId, customer_id: customers[1].id, title: 'Send filter replacement reminder', description: 'Notify tenants in unit 4B about Friday filter replacement.', status: 'in_progress', priority: 'medium', due_at: now(), created_at: now() },
      { id: id(), business_id: businessId, customer_id: customers[2].id, title: 'Review waiting room temperature complaint', description: 'Escalate and dispatch thermostat check if needed.', status: 'todo', priority: 'high', due_at: now(), created_at: now() }
    ]
  };
}

function loadDb() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      const db = JSON.parse(raw);
      if (db?.users?.length && db?.businesses?.length) return db;
    } catch {
      localStorage.removeItem(DB_KEY);
    }
  }
  const db = defaultDb();
  saveDb(db);
  return db;
}

function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function currentUser(db) {
  let session = null;
  try {
    session = JSON.parse(localStorage.getItem('ops_session') || 'null');
  } catch {
    localStorage.removeItem('ops_session');
    localStorage.removeItem('ops_token');
  }
  return db.users.find((user) => user.id === session?.user?.id) || db.users[0];
}

function analysisFor(message, business, settings) {
  const isBooking = /(schedule|book|appointment|come by|visit|available|tomorrow|today|maintenance)/i.test(message);
  const isComplaint = /(complaint|angry|upset|broken|too cold|too hot|again|refund)/i.test(message);
  const isReminder = /(remind|reminder|follow up|notify)/i.test(message);
  const intent = isBooking ? 'booking' : isComplaint ? 'complaint' : isReminder ? 'reminder' : 'question';
  const tail = intent === 'booking'
    ? 'I can help find the next available appointment window and have the team confirm it shortly.'
    : intent === 'complaint'
      ? 'I am flagging this for quick review so the team can make it right.'
      : intent === 'reminder'
        ? 'I will help turn this into a reminder so it does not slip through the cracks.'
        : 'I will get this to the right person and follow up with the next step.';
  return { intent, confidence: isBooking || isComplaint || isReminder ? 0.88 : 0.72, reply: `Hi, this is ${settings.assistant_name} with ${business.name}. Thanks for reaching out. ${tail}` };
}

function conversationList(db, businessId) {
  return db.conversations
    .filter((conversation) => conversation.business_id === businessId)
    .map((conversation) => {
      const customer = db.customers.find((item) => item.id === conversation.customer_id);
      const last = db.messages.filter((message) => message.conversation_id === conversation.id).at(-1);
      return { ...conversation, customer_name: customer?.name, customer_email: customer?.email, customer_phone: customer?.phone, last_message: last?.body, ai_suggestion: last?.ai_suggestion, intent: last?.intent };
    })
    .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
}

export async function localApi(path, options = {}) {
  await new Promise((resolve) => setTimeout(resolve, 180));
  const db = loadDb();
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : {};
  const user = currentUser(db);
  const businessId = user.business_id;

  if (path === '/auth/login' && method === 'POST') {
    const found = db.users.find((item) => item.email.toLowerCase() === body.email.toLowerCase() && item.password === body.password);
    if (!found) throw new Error('Invalid email or password');
    return { token: `local-${found.id}`, user: { id: found.id, business_id: found.business_id, name: found.name, email: found.email, role: found.role } };
  }

  if (path === '/auth/signup' && method === 'POST') {
    if (db.users.some((item) => item.email.toLowerCase() === body.email.toLowerCase())) throw new Error('Email already exists');
    const newBusinessId = id();
    const newUser = { id: id(), business_id: newBusinessId, name: body.name, email: body.email.toLowerCase(), password: body.password, role: 'owner' };
    db.businesses.push({ id: newBusinessId, name: body.businessName, industry: body.industry, phone: '', timezone: 'America/New_York' });
    db.aiSettings.push({ business_id: newBusinessId, assistant_name: 'Ava', tone: 'friendly and concise', auto_create_tasks: 1, auto_schedule: 0, escalation_rules: 'Escalate complaints, billing disputes, and emergencies.' });
    db.users.push(newUser);
    saveDb(db);
    return { token: `local-${newUser.id}`, user: { id: newUser.id, business_id: newUser.business_id, name: newUser.name, email: newUser.email, role: newUser.role } };
  }

  if (path === '/dashboard') {
    const conversations = conversationList(db, businessId);
    const tasks = db.tasks.filter((task) => task.business_id === businessId);
    const appointments = db.appointments.filter((item) => item.business_id === businessId);
    return { counts: { openMessages: conversations.filter((item) => item.status === 'open').length, todayAppointments: appointments.filter((item) => new Date(item.start_at).toDateString() === new Date().toDateString()).length, openTasks: tasks.filter((task) => task.status !== 'done').length, aiSuggestions: db.messages.filter((message) => message.business_id === businessId && message.ai_suggestion && message.status === 'suggested').length }, tasks: tasks.slice(0, 5), appointments: appointments.slice(0, 5) };
  }

  if (path === '/messages' && method === 'GET') return { conversations: conversationList(db, businessId) };

  const conversationMatch = path.match(/^\/messages\/([^/]+)$/);
  if (conversationMatch && method === 'GET') {
    const conversation = db.conversations.find((item) => item.id === conversationMatch[1] && item.business_id === businessId);
    return { conversation, messages: db.messages.filter((message) => message.conversation_id === conversation?.id) };
  }

  if (path === '/messages/incoming' && method === 'POST') {
    const business = db.businesses.find((item) => item.id === businessId);
    const settings = db.aiSettings.find((item) => item.business_id === businessId);
    const customer = { id: id(), business_id: businessId, name: body.customerName, email: body.customerEmail, phone: body.customerPhone };
    const conversation = { id: id(), business_id: businessId, customer_id: customer.id, channel: body.channel || 'sms', status: 'open', last_message_at: now() };
    const analysis = analysisFor(body.body, business, settings);
    const message = { id: id(), conversation_id: conversation.id, business_id: businessId, sender_type: 'customer', body: body.body, intent: analysis.intent, ai_suggestion: analysis.reply, confidence: analysis.confidence, status: 'suggested', created_at: now() };
    db.customers.push(customer);
    db.conversations.push(conversation);
    db.messages.push(message);
    if (settings.auto_create_tasks) db.tasks.push({ id: id(), business_id: businessId, customer_id: customer.id, title: analysis.intent === 'booking' ? 'Schedule service appointment' : 'Follow up with customer', description: body.body, status: 'todo', priority: analysis.intent === 'booking' || analysis.intent === 'complaint' ? 'high' : 'medium', due_at: now(), created_at: now() });
    saveDb(db);
    return { conversationId: conversation.id, messageId: message.id, analysis };
  }

  const approveMatch = path.match(/^\/messages\/([^/]+)\/approve$/);
  if (approveMatch && method === 'POST') {
    const message = db.messages.find((item) => item.id === approveMatch[1] && item.business_id === businessId);
    if (!message) throw new Error('Message not found');
    message.status = 'approved';
    db.messages.push({ id: id(), conversation_id: message.conversation_id, business_id: businessId, sender_type: 'user', body: body.body, status: 'sent', created_at: now() });
    saveDb(db);
    return { id: id() };
  }

  if (path === '/appointments') return { appointments: db.appointments.filter((item) => item.business_id === businessId) };
  if (path === '/tasks' && method === 'GET') return { tasks: db.tasks.filter((task) => task.business_id === businessId) };

  const taskMatch = path.match(/^\/tasks\/([^/]+)$/);
  if (taskMatch && method === 'PATCH') {
    const task = db.tasks.find((item) => item.id === taskMatch[1] && item.business_id === businessId);
    if (!task) throw new Error('Task not found');
    task.status = body.status;
    saveDb(db);
    return { ok: true };
  }

  if (path === '/settings' && method === 'GET') return { business: db.businesses.find((item) => item.id === businessId), ai: db.aiSettings.find((item) => item.business_id === businessId) };

  if (path === '/settings' && method === 'PUT') {
    const business = db.businesses.find((item) => item.id === businessId);
    const settings = db.aiSettings.find((item) => item.business_id === businessId);
    Object.assign(business, { name: body.businessName, industry: body.industry, phone: body.phone });
    Object.assign(settings, { assistant_name: body.assistantName, tone: body.tone, auto_create_tasks: body.autoCreateTasks ? 1 : 0, auto_schedule: body.autoSchedule ? 1 : 0, escalation_rules: body.escalationRules });
    saveDb(db);
    return { ok: true };
  }

  throw new Error(`Local route not found: ${method} ${path}`);
}
