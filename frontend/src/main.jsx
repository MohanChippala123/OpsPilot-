import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { format, parseISO } from 'date-fns';
import {
  ArrowUpRight,
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardList,
  Inbox,
  Loader2,
  LogOut,
  MessageSquareText,
  PlayCircle,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap
} from 'lucide-react';
import './styles.css';
import { localApi } from './localApi.js';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');
const FORCE_LOCAL_APP = import.meta.env.VITE_LOCAL_APP === 'true';

function api(path, options = {}) {
  if (FORCE_LOCAL_APP) return localApi(path, options);
  const token = localStorage.getItem('ops_token');
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  }).then(async (res) => {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) throw new Error('Backend unavailable');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }).catch(() => {
    return localApi(path, options);
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}

const nav = [
  ['dashboard', 'Dashboard', Sparkles],
  ['messages', 'Messages', Inbox],
  ['calendar', 'Calendar', CalendarDays],
  ['tasks', 'Jobs', ClipboardList],
  ['settings', 'Settings', Settings]
];

function validSession(saved) {
  return Boolean(saved?.token && saved?.user?.id && saved?.user?.business_id && saved?.user?.email && saved?.user?.name);
}

function App() {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem('ops_session');
      const saved = raw ? JSON.parse(raw) : null;
      if (!saved) return null;
      if (!validSession(saved) || saved.user.email === 'owner@brightlinehvac.com') {
        localStorage.removeItem('ops_session');
        localStorage.removeItem('ops_token');
        return null;
      }
      return saved;
    } catch {
      localStorage.removeItem('ops_session');
      localStorage.removeItem('ops_token');
      return null;
    }
  });
  const [page, setPage] = useState('dashboard');

  if (!session) return <AuthScreen onAuth={setSession} />;

  return (
    <Shell page={page} setPage={setPage} session={session} setSession={setSession}>
      {page === 'dashboard' && <Dashboard setPage={setPage} />}
      {page === 'messages' && <Messages />}
      {page === 'calendar' && <CalendarPage />}
      {page === 'tasks' && <Tasks />}
      {page === 'settings' && <SettingsPage session={session} />}
    </Shell>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    businessName: '',
    industry: '',
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      businessName: '',
      industry: '',
      name: '',
      email: '',
      password: ''
    });
  }, [mode]);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(mode === 'login' ? { email: form.email, password: form.password } : form)
      });
      localStorage.setItem('ops_token', data.token);
      localStorage.setItem('ops_session', JSON.stringify(data));
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function startDemo() {
    const stamp = Date.now();
    setLoading(true);
    setError('');
    try {
      const data = await api('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          businessName: 'Launch Preview Co.',
          industry: 'Home services',
          name: 'Founder Preview',
          email: `founder-${stamp}@opspilot.local`,
          password: `preview-${stamp}`
        })
      });
      localStorage.setItem('ops_token', data.token);
      localStorage.setItem('ops_session', JSON.stringify(data));
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-canvas min-h-screen overflow-hidden text-ink">
      <section className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-7 px-5 py-7 lg:grid-cols-[1fr_460px] lg:gap-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="mesh-glow left-[6%] top-[12%]" />
          <div className="mesh-glow mesh-glow-alt right-[12%] top-[54%]" />
        </div>
        <div className="animate-rise space-y-6 lg:space-y-8">
          <div className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm">
            <Sparkles size={16} className="text-brand animate-pulse-soft" />
            AI operations assistant for local service teams
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-bold tracking-normal text-ink sm:text-6xl xl:text-7xl">Run the front desk without hiring another front desk.</h1>
            <p className="max-w-2xl text-lg leading-8 text-muted">
              Capture messages, draft replies, schedule appointments, and turn requests into trackable work from one calm dashboard.
            </p>
          </div>
          <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              ['Classifies customer intent', Bot],
              ['Drafts receptionist replies', MessageSquareText],
              ['Creates tasks and bookings', Zap]
            ].map(([item, Icon], index) => (
              <div key={item} className="feature-tile rounded-xl p-4 text-sm" style={{ animationDelay: `${index * 90}ms` }}>
                <Icon size={18} className="mb-3 text-brand" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <HeroMockDashboard />
        </div>
        <form onSubmit={submit} autoComplete="off" className="animate-rise form-card rounded-2xl p-5 sm:p-6" style={{ animationDelay: '120ms' }}>
          <input className="hidden" type="text" name="opspilot-no-autofill-email" autoComplete="username" tabIndex="-1" aria-hidden="true" />
          <input className="hidden" type="password" name="opspilot-no-autofill-password" autoComplete="current-password" tabIndex="-1" aria-hidden="true" />
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Welcome to</p>
              <p className="text-xl font-bold">OpsPilot</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-white shadow-soft"><Sparkles size={19} /></div>
          </div>
          <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
            {['login', 'signup'].map((item) => (
              <button key={item} type="button" onClick={() => setMode(item)} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${mode === item ? 'bg-white shadow-sm' : 'text-muted'}`}>
                {item === 'login' ? 'Login' : 'Signup'}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {mode === 'signup' && (
              <>
                <Input required label="Business name" name="opspilot-business-name" autoComplete="off" value={form.businessName} onChange={(businessName) => setForm({ ...form, businessName })} />
                <Input required label="Industry" name="opspilot-industry" autoComplete="off" value={form.industry} onChange={(industry) => setForm({ ...form, industry })} />
                <Input required label="Your name" name="opspilot-owner-name" autoComplete="off" value={form.name} onChange={(name) => setForm({ ...form, name })} />
              </>
            )}
            <Input required label="Email" name={`opspilot-${mode}-email`} autoComplete="off" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
            <Input required label="Password" name={`opspilot-${mode}-password`} autoComplete="new-password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
          </div>
          {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button className="button-primary mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            Continue
          </button>
          <button type="button" onClick={startDemo} disabled={loading} className="button-secondary mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold">
            <PlayCircle size={16} />
            Preview the app
          </button>
          <InstallButton className="mt-3 w-full justify-center" />
        </form>
      </section>
    </main>
  );
}

function Shell({ children, page, setPage, session, setSession }) {
  function logout() {
    localStorage.removeItem('ops_token');
    localStorage.removeItem('ops_session');
    setSession(null);
  }

  return (
    <div className="app-canvas min-h-screen text-ink lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="sidebar-shell border-b border-line lg:sticky lg:top-0 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-4 lg:block">
          <div className="flex items-center gap-3">
            <div className="brand-mark grid h-10 w-10 place-items-center rounded-xl text-white"><Sparkles size={18} /></div>
            <div>
              <p className="font-bold">OpsPilot</p>
              <p className="text-xs text-muted">AI desk assistant</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={logout}><LogOut size={18} /></button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1">
          {nav.map(([id, label, Icon]) => (
            <button key={id} onClick={() => setPage(id)} className={`nav-item flex min-w-fit items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold lg:w-full ${page === id ? 'is-active text-ink' : 'text-muted'}`}>
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <div className="mx-4 mt-4 hidden rounded-2xl border border-teal-200 bg-teal-50/70 p-4 lg:block">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand"><ShieldCheck size={16} /> AI guardrails active</div>
          <p className="text-xs leading-5 text-muted">Complaints, billing issues, and emergencies are routed for human review.</p>
        </div>
        <div className="mt-auto hidden border-t border-line p-4 lg:block">
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <UserRound size={18} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{session.user.name}</p>
              <p className="truncate text-xs text-muted">{session.user.email}</p>
            </div>
            <button onClick={logout} title="Log out"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
      <main className="px-4 py-5 sm:px-6 lg:px-8">
        <TopBar setPage={setPage} />
        <div className="page-enter">{children}</div>
      </main>
    </div>
  );
}

function TopBar({ setPage }) {
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');

  function flash(message) {
    setNotice(message);
    window.clearTimeout(window.__opspilotNoticeTimer);
    window.__opspilotNoticeTimer = window.setTimeout(() => setNotice(''), 2600);
  }

  function search(event) {
    event.preventDefault();
    const value = query.trim().toLowerCase();
    if (!value) {
      flash('Type what you want to find first.');
      return;
    }
    const target = value.includes('calendar') || value.includes('appointment') || value.includes('schedule')
      ? 'calendar'
      : value.includes('job') || value.includes('task')
        ? 'tasks'
        : 'messages';
    setPage(target);
    flash(`Opened ${target} for "${query.trim()}".`);
  }

  return (
    <div className="relative mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-white/78 p-3 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
      <form onSubmit={search} className="flex items-center gap-3 rounded-xl bg-gray-100 px-3 py-2 text-sm text-muted md:min-w-[340px]">
        <Search size={16} />
        <input className="w-full bg-transparent text-sm outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search messages, jobs, customers" />
        <button type="submit" className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink shadow-sm">Search</button>
      </form>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => flash('No new notifications right now.')} className="icon-button" title="Notifications"><Bell size={17} /></button>
        <InstallButton />
        <button type="button" onClick={() => { setPage('messages'); flash('Opened Messages. Add an incoming message to start a workflow.'); }} className="button-secondary inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold">
          <Plus size={16} />
          New workflow
        </button>
      </div>
      {notice && <div className="absolute right-3 top-full z-20 mt-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold shadow-soft">{notice}</div>}
    </div>
  );
}

function InstallButton({ className = '' }) {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(window.matchMedia?.('(display-mode: standalone)').matches);
  const [message, setMessage] = useState('');

  useEffect(() => {
    function beforeInstall(event) {
      event.preventDefault();
      setPrompt(event);
    }
    function appInstalled() {
      setInstalled(true);
      setPrompt(null);
    }
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', appInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', appInstalled);
    };
  }, []);

  async function install() {
    if (installed) return;
    if (!prompt) {
      setMessage('Use your browser menu and choose Install app or Add to home screen.');
      return;
    }
    prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  }

  return (
    <span className={`inline-flex flex-col gap-2 ${className}`}>
      <button type="button" onClick={install} disabled={installed} className="button-secondary inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold">
        <ArrowUpRight size={16} />
        {installed ? 'Installed' : 'Install app'}
      </button>
      {message && <span className="text-xs font-medium text-muted">{message}</span>}
    </span>
  );
}

function Dashboard({ setPage }) {
  const { data, loading, error, reload } = useApi('/dashboard');
  if (loading) return <PageSkeleton title="Dashboard" />;
  if (error || !data?.counts) return <PageError title="Dashboard" error={error} onRetry={reload} />;
  const cards = [
    ['Open messages', data.counts.openMessages, MessageSquareText, 'messages'],
    ['AI suggestions', data.counts.aiSuggestions, Sparkles, 'messages'],
    ['Today appointments', data.counts.todayAppointments, CalendarDays, 'calendar'],
    ['Open jobs', data.counts.openTasks, ClipboardList, 'tasks']
  ];
  return (
    <Page title="Dashboard" subtitle="A live morning view of messages, appointments, and work that needs attention.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon, target], index) => <Metric key={label} label={label} value={value} Icon={Icon} index={index} onClick={() => setPage(target)} />)}
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <OperationsPulse counts={data.counts} />
        <Panel title="AI activity stream" action={<span className="live-dot text-xs font-semibold text-brand">Live</span>}>
          {['Classified Maria Chen as booking intent', 'Created a high priority follow-up task', 'Prepared a tenant reminder draft'].map((item, index) => (
            <div key={item} className="activity-row flex items-center gap-3 rounded-xl border border-line bg-white p-3" style={{ animationDelay: `${index * 110}ms` }}>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-50 text-brand"><Sparkles size={15} /></div>
              <p className="text-sm">{item}</p>
            </div>
          ))}
        </Panel>
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <Panel title="Upcoming appointments">{data.appointments.map((item) => <AppointmentRow key={item.id} item={item} />)}</Panel>
        <Panel title="Priority jobs">{data.tasks.map((task) => <TaskRow key={task.id} task={task} />)}</Panel>
      </div>
    </Page>
  );
}

function Messages() {
  const { data, loading, error, reload } = useApi('/messages');
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState('');
  const [actionError, setActionError] = useState('');
  const [incoming, setIncoming] = useState({ customerName: 'Jordan Lee', customerEmail: 'jordan@example.com', customerPhone: '(555) 019-9191', channel: 'sms', body: 'Can we book a maintenance visit for tomorrow afternoon?' });
  const conversations = data?.conversations || [];
  const active = selected || conversations[0];

  useEffect(() => {
    if (active?.ai_suggestion) setDraft(active.ai_suggestion);
  }, [active?.id]);

  async function createIncoming(event) {
    event.preventDefault();
    setActionError('');
    try {
      await api('/messages/incoming', { method: 'POST', body: JSON.stringify(incoming) });
      await reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function approve() {
    setActionError('');
    try {
      if (!active) throw new Error('Select a conversation first.');
      const detail = await api(`/messages/${active.id}`);
      const latest = detail.messages.filter((m) => m.ai_suggestion && m.status === 'suggested').at(-1);
      if (!latest) throw new Error('No AI suggestion is ready for this conversation yet.');
      await api(`/messages/${latest.id}/approve`, { method: 'POST', body: JSON.stringify({ body: draft }) });
      await reload();
      setSelected(null);
      setDraft('');
    } catch (err) {
      setActionError(err.message);
    }
  }

  if (loading) return <PageSkeleton title="Messages" />;
  if (error || !data) return <PageError title="Messages" error={error} onRetry={reload} />;
  return (
    <Page title="Messages" subtitle="Review customer conversations, AI intent, and suggested replies.">
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <Panel title="Inbox" action={<span className="text-xs text-muted">{conversations.length} open</span>}>
          {conversations.length === 0 ? <EmptyState text="No customer conversations yet." /> : conversations.map((item) => (
            <button key={item.id} onClick={() => setSelected(item)} className={`w-full rounded-lg border p-3 text-left ${active?.id === item.id ? 'border-brand bg-teal-50' : 'border-line bg-white'}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{item.customer_name}</p>
                <Intent intent={item.intent} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{item.last_message}</p>
            </button>
          ))}
        </Panel>
        <div className="space-y-5">
          <Panel title={active?.customer_name || 'Conversation'} action={active && <span className="text-xs uppercase text-muted">{active.channel}</span>}>
            {active ? (
              <div className="space-y-4">
                <Bubble from="customer">{active.last_message}</Bubble>
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand"><Sparkles size={16} /> AI suggestion</div>
                  <textarea className="min-h-32 w-full rounded-lg border border-line bg-white p-3 text-sm outline-none focus:border-brand" value={draft} onChange={(event) => setDraft(event.target.value)} />
                  <button onClick={approve} className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Approve and send</button>
                </div>
              </div>
            ) : <EmptyState text="No conversation selected." />}
            {actionError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
          </Panel>
          <Panel title="Simulate incoming message">
            <form onSubmit={createIncoming} className="grid gap-3 md:grid-cols-2">
              <Input label="Customer" value={incoming.customerName} onChange={(customerName) => setIncoming({ ...incoming, customerName })} />
              <Input label="Email" value={incoming.customerEmail} onChange={(customerEmail) => setIncoming({ ...incoming, customerEmail })} />
              <textarea className="md:col-span-2 rounded-lg border border-line p-3 text-sm" value={incoming.body} onChange={(event) => setIncoming({ ...incoming, body: event.target.value })} />
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white md:w-fit"><Plus size={16} /> Add message</button>
            </form>
          </Panel>
        </div>
      </div>
    </Page>
  );
}

function CalendarPage() {
  const { data, loading, error, reload } = useApi('/appointments');
  const [actionError, setActionError] = useState('');
  const slots = ['9:00 AM', '11:30 AM', '2:00 PM', '4:30 PM'];

  async function bookSlot(slot) {
    setActionError('');
    try {
      await api('/appointments', { method: 'POST', body: JSON.stringify({ slot }) });
      await reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  if (loading) return <PageSkeleton title="Calendar" />;
  if (error || !data?.appointments) return <PageError title="Calendar" error={error} onRetry={reload} />;
  return (
    <Page title="Calendar" subtitle="Appointment requests and scheduled service windows.">
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Panel title="Schedule">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.appointments.map((item) => <div key={item.id} className="rounded-lg border border-line bg-white p-4"><AppointmentRow item={item} /></div>)}
          </div>
        </Panel>
        <Panel title="Empty slots">
          {slots.map((slot) => <button type="button" key={slot} onClick={() => bookSlot(slot)} className="w-full rounded-lg border border-dashed border-line p-3 text-left text-sm text-muted hover:border-brand hover:bg-teal-50">Available today at {slot}</button>)}
          {actionError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
        </Panel>
      </div>
    </Page>
  );
}

function Tasks() {
  const { data, loading, error, reload } = useApi('/tasks');
  const [actionError, setActionError] = useState('');
  const columns = [
    ['todo', 'To do'],
    ['in_progress', 'In progress'],
    ['done', 'Done']
  ];
  async function move(id, status) {
    setActionError('');
    try {
      await api(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await reload();
    } catch (err) {
      setActionError(err.message);
    }
  }
  if (loading) return <PageSkeleton title="Jobs" />;
  if (error || !data?.tasks) return <PageError title="Jobs" error={error} onRetry={reload} />;
  return (
    <Page title="Jobs" subtitle="Kanban-style workflow for service requests, reminders, and follow-ups.">
      {actionError && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map(([status, title]) => (
          <Panel key={status} title={title}>
            {(data.tasks.filter((task) => task.status === status)).map((task) => (
              <div key={task.id} className="rounded-lg border border-line bg-white p-4">
                <TaskRow task={task} />
                <div className="mt-3 flex gap-2">
                  {columns.map(([next]) => <button key={next} type="button" disabled={task.status === next} onClick={() => move(task.id, next)} className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:bg-gray-50 disabled:bg-gray-100">{next.replace('_', ' ')}</button>)}
                </div>
              </div>
            ))}
          </Panel>
        ))}
      </div>
    </Page>
  );
}

function SettingsPage() {
  const { data, loading, error, reload } = useApi('/settings');
  const [saved, setSaved] = useState(false);
  const [actionError, setActionError] = useState('');
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (data && !form) setForm({
      businessName: data.business.name,
      industry: data.business.industry,
      phone: data.business.phone || '',
      assistantName: data.ai.assistant_name,
      tone: data.ai.tone,
      autoCreateTasks: Boolean(data.ai.auto_create_tasks),
      autoSchedule: Boolean(data.ai.auto_schedule),
      escalationRules: data.ai.escalation_rules
    });
  }, [data, form]);

  async function save(event) {
    event.preventDefault();
    setSaved(false);
    setActionError('');
    try {
      await api('/settings', { method: 'PUT', body: JSON.stringify(form) });
      setSaved(true);
      await reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  if (loading) return <PageSkeleton title="Settings" />;
  if (error || !data) return <PageError title="Settings" error={error} onRetry={reload} />;
  if (!form) return <PageSkeleton title="Settings" />;
  return (
    <Page title="Settings" subtitle="Configure the business profile and assistant behavior.">
      <form onSubmit={save} className="grid max-w-4xl gap-5 lg:grid-cols-2">
        <Panel title="Business">
          <Input label="Business name" value={form.businessName} onChange={(businessName) => setForm({ ...form, businessName })} />
          <Input label="Industry" value={form.industry} onChange={(industry) => setForm({ ...form, industry })} />
          <Input label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
        </Panel>
        <Panel title="AI behavior">
          <Input label="Assistant name" value={form.assistantName} onChange={(assistantName) => setForm({ ...form, assistantName })} />
          <Input label="Tone" value={form.tone} onChange={(tone) => setForm({ ...form, tone })} />
          <Toggle label="Auto-create tasks from messages" checked={form.autoCreateTasks} onChange={(autoCreateTasks) => setForm({ ...form, autoCreateTasks })} />
          <Toggle label="Auto-schedule booking requests" checked={form.autoSchedule} onChange={(autoSchedule) => setForm({ ...form, autoSchedule })} />
          <label className="block text-sm font-medium">Escalation rules
            <textarea className="mt-1 min-h-24 w-full rounded-lg border border-line p-3 text-sm" value={form.escalationRules} onChange={(event) => setForm({ ...form, escalationRules: event.target.value })} />
          </label>
        </Panel>
        <button type="submit" className="rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white lg:w-fit">Save settings</button>
        {saved && <p className="self-center text-sm text-brand">Saved</p>}
        {actionError && <p className="self-center rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
      </form>
    </Page>
  );
}

function useApi(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const load = async () => {
    setState((current) => ({ ...current, loading: true }));
    try {
      setState({ data: await api(path), loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error });
    }
  };
  useEffect(() => { load(); }, [path]);
  return { ...state, reload: load };
}

function Page({ title, subtitle, children }) {
  return <section><div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><h1 className="text-3xl font-bold tracking-normal md:text-4xl">{title}</h1><p className="mt-1 text-muted">{subtitle}</p></div><div className="hidden items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-sm text-muted shadow-sm md:flex"><Clock3 size={15} /> Updated just now</div></div>{children}</section>;
}

function PageSkeleton({ title }) {
  return <Page title={title} subtitle="Loading workspace data..."><div className="grid gap-3 sm:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}</div></Page>;
}

function PageError({ title, error, onRetry }) {
  return (
    <Page title={title} subtitle="OpsPilot could not load this workspace view.">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
        <p className="font-semibold">Something went wrong while loading the app.</p>
        <p className="mt-2 text-sm">{error?.message || 'Refresh the page or reset the local app data.'}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={onRetry} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Retry</button>
          <button
            onClick={() => {
              localStorage.removeItem('ops_session');
              localStorage.removeItem('ops_token');
              localStorage.removeItem('opspilot_local_db');
              window.location.reload();
            }}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold"
          >
            Reset app data
          </button>
        </div>
      </div>
    </Page>
  );
}

function Panel({ title, action, children }) {
  return <section className="panel-card rounded-2xl p-4"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-bold">{title}</h2>{action}</div><div className="space-y-3">{children}</div></section>;
}

function Metric({ label, value, Icon, index = 0, onClick }) {
  return <button type="button" onClick={onClick} className="metric-card rounded-2xl p-5 text-left" style={{ animationDelay: `${index * 70}ms` }}><div className="flex items-center justify-between"><Icon size={20} className="text-brand" /><ArrowUpRight size={16} className="text-muted" /></div><p className="mt-4 text-4xl font-bold">{value}</p><p className="text-sm text-muted">{label}</p></button>;
}

function Input({ label, value, onChange, type = 'text', name, autoComplete = 'off', required = false }) {
  return <label className="block text-sm font-medium">{label}<input required={required} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand" name={name} autoComplete={autoComplete} type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Toggle({ label, checked, onChange }) {
  return <label className="flex items-center justify-between gap-3 rounded-lg border border-line p-3 text-sm"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>;
}

function Intent({ intent }) {
  return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-muted">{intent || 'new'}</span>;
}

function Bubble({ children }) {
  return <div className="max-w-2xl rounded-xl rounded-tl-sm bg-gray-100 p-4 text-sm leading-6">{children}</div>;
}

function AppointmentRow({ item }) {
  return <div><p className="font-semibold">{item.title}</p><p className="text-sm text-muted">{item.customer_name || 'Unassigned'} · {format(parseISO(item.start_at), 'MMM d, h:mm a')}</p><p className="mt-1 text-xs font-bold uppercase text-brand">{item.status}</p></div>;
}

function TaskRow({ task }) {
  return <div><div className="flex items-start justify-between gap-3"><p className="font-medium">{task.title}</p><span className={`rounded-full px-2 py-1 text-xs ${task.priority === 'high' ? 'bg-amber-50 text-amber' : 'bg-gray-100 text-muted'}`}>{task.priority}</span></div><p className="mt-1 text-sm text-muted">{task.description}</p></div>;
}

function EmptyState({ text }) {
  return <div className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">{text}</div>;
}

function HeroMockDashboard() {
  return (
    <div className="hero-console hidden max-w-2xl rounded-2xl p-4 shadow-soft md:block">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Today’s command center</p>
          <p className="text-xs text-muted">3 AI actions ready for approval</p>
        </div>
        <span className="live-dot rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-brand">Live</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Messages', '12', Inbox],
          ['Booked', '4', CalendarDays],
          ['Saved hrs', '7.5', Clock3]
        ].map(([label, value, Icon]) => (
          <div key={label} className="rounded-xl border border-line bg-white p-3">
            <Icon size={16} className="mb-3 text-brand" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OperationsPulse({ counts }) {
  const total = Math.max(1, counts.openMessages + counts.aiSuggestions + counts.openTasks);
  return (
    <Panel title="Operations pulse" action={<span className="text-xs text-muted">Automation health</span>}>
      {[
        ['Inbox pressure', counts.openMessages, 'bg-teal-500'],
        ['AI review queue', counts.aiSuggestions, 'bg-amber-500'],
        ['Open job load', counts.openTasks, 'bg-ink']
      ].map(([label, value, color]) => (
        <div key={label}>
          <div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold">{label}</span><span className="text-muted">{value}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${color} progress-fill`} style={{ width: `${Math.min(100, (value / total) * 100)}%` }} /></div>
        </div>
      ))}
    </Panel>
  );
}

createRoot(document.getElementById('root')).render(<App />);
