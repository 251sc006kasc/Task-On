import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Home,
  CheckSquare,
  Calendar as CalendarIcon,
  BarChart3,
  Settings,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  ClipboardList,
  Edit3,
  Trash2,
  X,
  Menu,
  Check
} from 'lucide-react';
import api from './api';
import './App.css';

/* ─── Types ─── */
interface Task {
  _id: string;
  title: string;
  dueDate?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  createdAt?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

type NavSection = 'home' | 'tasks' | 'calendar' | 'analytics' | 'settings';

/* ─── Encrypted LocalStorage Helpers ─── */
const STORAGE_KEY = 'task_on_enc_';

function encryptData(data: unknown): string {
  const json = JSON.stringify(data);
  return btoa(
    Array.from(new TextEncoder().encode(json))
      .map((b) => String.fromCharCode(b ^ 0x5a))
      .join('')
  );
}

function decryptData<T>(cipher: string): T | null {
  try {
    const raw = atob(cipher);
    const bytes = Array.from(raw).map((c) => c.charCodeAt(0) ^ 0x5a);
    const json = new TextDecoder().decode(new Uint8Array(bytes));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function secureGet<T>(key: string): T | null {
  const v = localStorage.getItem(STORAGE_KEY + key);
  return v ? decryptData<T>(v) : null;
}

function secureSet(key: string, data: unknown) {
  localStorage.setItem(STORAGE_KEY + key, encryptData(data));
}

function secureRemove(key: string) {
  localStorage.removeItem(STORAGE_KEY + key);
}

/* ─── Fast Subtle Motion Variants ─── */
const subtleFade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
};

const rowTransition = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export default function App() {
  /* Auth State */
  const [user, setUser] = useState<User | null>(() => secureGet<User>('user'));
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  /* Backend Connection */
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  /* Tasks – Clean by default, no default dummy data */
  const [tasks, setTasks] = useState<Task[]>(() => secureGet<Task[]>('tasks') || []);

  /* Navigation Sidebar */
  const [activeNav, setActiveNav] = useState<NavSection>('tasks');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /* Task Creation Input */
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [quickDueDate, setQuickDueDate] = useState('');
  const quickInputRef = useRef<HTMLInputElement>(null);

  /* Task Filters */
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  /* Edit Modal */
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  /* Backend Connectivity Check */
  useEffect(() => {
    api.get('/api')
      .then(() => setBackendStatus('connected'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  /* Load Tasks when Authenticated */
  useEffect(() => {
    if (user && backendStatus === 'connected') {
      api.get('/api/tasks')
        .then((r) => {
          if (Array.isArray(r.data)) setTasks(r.data);
        })
        .catch(() => {});
    }
  }, [user, backendStatus]);

  /* Persist Encrypted Tasks */
  useEffect(() => {
    secureSet('tasks', tasks);
  }, [tasks]);

  /* Auth Submit */
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);

    try {
      if (backendStatus === 'offline') {
        const localUser: User = {
          id: 'local-' + Date.now(),
          name: authName.trim() || authEmail.split('@')[0],
          email: authEmail,
        };
        setUser(localUser);
        secureSet('user', localUser);
        secureSet('token', 'local_session');
        setIsAuthLoading(false);
        return;
      }

      const endpoint = authMode === 'signin' ? '/api/auth/login' : '/api/auth/register';
      const payload = authMode === 'signin'
        ? { email: authEmail, password: authPassword }
        : { name: authName, email: authEmail, password: authPassword };

      const res = await api.post(endpoint, payload);
      if (res.data.token && res.data.user) {
        secureSet('token', res.data.token);
        secureSet('user', res.data.user);
        localStorage.setItem('task_on_token', res.data.token);
        setUser(res.data.user);
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  /* Guest Mode */
  const handleContinueAsGuest = () => {
    const guestUser: User = { id: 'guest', name: 'Guest', email: 'guest@taskon.app' };
    setUser(guestUser);
    secureSet('user', guestUser);
  };

  /* Logout */
  const handleLogout = () => {
    secureRemove('user');
    secureRemove('token');
    secureRemove('tasks');
    localStorage.removeItem('task_on_token');
    setUser(null);
    setTasks([]);
  };

  /* Create Task */
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const newTask: Task = {
      _id: 'task-' + Date.now(),
      title: quickTitle.trim(),
      priority: quickPriority,
      status: 'Pending',
      dueDate: quickDueDate || undefined,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setQuickTitle('');
    setQuickDueDate('');

    if (user && backendStatus === 'connected') {
      try {
        const res = await api.post('/api/tasks', {
          title: newTask.title,
          priority: newTask.priority,
          status: newTask.status,
          dueDate: newTask.dueDate,
        });
        if (res.data?._id) {
          setTasks((prev) => prev.map((item) => (item._id === newTask._id ? res.data : item)));
        }
      } catch {}
    }
  };

  /* Toggle Completed Status */
  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status: nextStatus } : t)));

    if (backendStatus === 'connected' && !task._id.startsWith('task-')) {
      try {
        await api.put(`/api/tasks/${task._id}`, { status: nextStatus });
      } catch {}
    }
  };

  /* Delete Task */
  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t._id !== id));
    if (backendStatus === 'connected' && !id.startsWith('task-')) {
      try {
        await api.delete(`/api/tasks/${id}`);
      } catch {}
    }
  };

  /* Update Task from Modal */
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? editingTask : t)));
    if (backendStatus === 'connected' && !editingTask._id.startsWith('task-')) {
      try {
        await api.put(`/api/tasks/${editingTask._id}`, editingTask);
      } catch {}
    }
    setEditingTask(null);
  };

  /* Filtered Task Set */
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (currentFilter === 'pending' && t.status !== 'Pending') return false;
      if (currentFilter === 'in_progress' && t.status !== 'In Progress') return false;
      if (currentFilter === 'completed' && t.status !== 'Completed') return false;
      if (searchQuery.trim()) {
        if (!t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [tasks, currentFilter, searchQuery]);

  /* Task Stats */
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'Completed').length;
    const pending = tasks.filter((t) => t.status === 'Pending').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const active = pending + inProgress;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pending, inProgress, active, rate };
  }, [tasks]);

  /* ═══════════════════════════════════════════════
     1. REGISTRATION / LOGIN PAGE (Centered Card)
     ═══════════════════════════════════════════════ */
  if (!user) {
    return (
      <div className="auth-container">
        <motion.div className="auth-card" {...subtleFade}>
          {/* Logo at the top-left of the card */}
          <div className="auth-card-header">
            <div className="brand-logo-wrap">
              <span className="brand-logo-mark">T</span>
              <span className="brand-logo-text">Task-On</span>
            </div>
          </div>

          {/* Heading */}
          <h2 className="auth-heading">
            {authMode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </h2>

          {/* Segmented Sign In / Register Tabs */}
          <div className="auth-segmented-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${authMode === 'signin' ? 'active' : ''}`}
              onClick={() => { setAuthMode('signin'); setAuthError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
            >
              Register
            </button>
          </div>

          {authError && (
            <motion.div className="auth-error-box" {...subtleFade}>
              {authError}
            </motion.div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-name">Full Name</label>
                <input
                  id="auth-name"
                  type="text"
                  className="form-input"
                  required
                  placeholder="Your name"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                className="form-input"
                required
                placeholder="name@company.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                className="form-input"
                required
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>

            {/* Dark green Submit Button with small arrow icon */}
            <button
              type="submit"
              className="btn-primary-green"
              disabled={isAuthLoading}
            >
              <span>{isAuthLoading ? 'Processing…' : authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight size={15} strokeWidth={2.2} />
            </button>
          </form>

          {/* OR Divider */}
          <div className="auth-divider">
            <span>OR</span>
          </div>

          {/* Continue as Guest Button */}
          <button
            type="button"
            className="btn-secondary-guest"
            onClick={handleContinueAsGuest}
          >
            Continue as Guest
          </button>

          {/* API Status */}
          <div className="auth-footer-status">
            <span className={`status-dot ${backendStatus === 'connected' ? 'connected' : 'offline'}`} />
            <span className="status-text">
              {backendStatus === 'connected' ? 'API Connected' : 'Local Mode'}
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     2. DASHBOARD (Header + Sidebar + Content)
     ═══════════════════════════════════════════════ */
  return (
    <div className="dashboard-layout">
      {/* ─── Header ─── */}
      <header className="dashboard-header">
        <div className="header-left">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle Navigation"
          >
            <Menu size={18} />
          </button>
          <div className="brand-logo-wrap">
            <span className="brand-logo-mark">T</span>
            <span className="brand-logo-text">Task-On</span>
          </div>
        </div>

        <div className="header-right">
          <div className="synced-indicator">
            <span className={`status-dot ${backendStatus === 'connected' ? 'connected' : 'offline'}`} />
            <span>{backendStatus === 'connected' ? 'Synced' : 'Local'}</span>
          </div>

          <div className="user-profile">
            <div className="avatar-circle">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{user.name}</span>
          </div>

          <button
            type="button"
            className="btn-logout"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </header>

      {/* ─── Body: Sidebar + Main Content ─── */}
      <div className="dashboard-body">
        {/* Simple Left Sidebar */}
        <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <nav className="sidebar-nav">
            <button
              type="button"
              className={`nav-item ${activeNav === 'home' ? 'active' : ''}`}
              onClick={() => { setActiveNav('home'); setIsSidebarOpen(false); }}
            >
              <Home size={17} strokeWidth={1.8} />
              <span>Home</span>
            </button>

            <button
              type="button"
              className={`nav-item ${activeNav === 'tasks' ? 'active' : ''}`}
              onClick={() => { setActiveNav('tasks'); setIsSidebarOpen(false); }}
            >
              <CheckSquare size={17} strokeWidth={1.8} />
              <span>My Tasks</span>
            </button>

            <button
              type="button"
              className={`nav-item ${activeNav === 'calendar' ? 'active' : ''}`}
              onClick={() => { setActiveNav('calendar'); setIsSidebarOpen(false); }}
            >
              <CalendarIcon size={17} strokeWidth={1.8} />
              <span>Calendar</span>
            </button>

            <button
              type="button"
              className={`nav-item ${activeNav === 'analytics' ? 'active' : ''}`}
              onClick={() => { setActiveNav('analytics'); setIsSidebarOpen(false); }}
            >
              <BarChart3 size={17} strokeWidth={1.8} />
              <span>Analytics</span>
            </button>

            <button
              type="button"
              className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveNav('settings'); setIsSidebarOpen(false); }}
            >
              <Settings size={17} strokeWidth={1.8} />
              <span>Settings</span>
            </button>
          </nav>
        </aside>

        {/* Mobile overlay for sidebar */}
        {isSidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* ─── Main Content Area ─── */}
        <main className="dashboard-main">
          {activeNav === 'tasks' && (
            <motion.div className="tasks-view" {...subtleFade}>
              {/* 3. Statistics Cards */}
              <section className="stats-grid">
                {/* Active Card */}
                <div className="stat-card">
                  <div className="stat-icon-wrap">
                    <Clock size={16} strokeWidth={1.8} className="stat-icon" />
                  </div>
                  <div className="stat-number">{stats.active}</div>
                  <div className="stat-label">ACTIVE</div>
                </div>

                {/* Done Card */}
                <div className="stat-card">
                  <div className="stat-icon-wrap">
                    <CheckCircle2 size={16} strokeWidth={1.8} className="stat-icon" />
                  </div>
                  <div className="stat-number">{stats.done}</div>
                  <div className="stat-label">DONE</div>
                </div>

                {/* Rate Card */}
                <div className="stat-card">
                  <div className="stat-icon-wrap">
                    <TrendingUp size={16} strokeWidth={1.8} className="stat-icon" />
                  </div>
                  <div className="stat-number">{stats.rate}%</div>
                  <div className="stat-label">RATE</div>
                </div>
              </section>

              {/* 4. Add Task Bar */}
              <section className="add-task-section">
                <form className="add-task-bar" onSubmit={handleCreateTask}>
                  <div className="task-input-wrap">
                    <Plus size={16} strokeWidth={2} className="add-plus-icon" />
                    <input
                      ref={quickInputRef}
                      type="text"
                      className="task-text-input"
                      placeholder="New task…"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                    />
                  </div>

                  <div className="task-bar-controls">
                    <select
                      className="task-select"
                      value={quickPriority}
                      onChange={(e) => setQuickPriority(e.target.value as any)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>

                    <input
                      type="date"
                      className="task-date-input"
                      value={quickDueDate}
                      onChange={(e) => setQuickDueDate(e.target.value)}
                    />

                    <button
                      type="submit"
                      className="btn-add-task"
                      disabled={!quickTitle.trim()}
                    >
                      Add
                    </button>
                  </div>
                </form>
              </section>

              {/* 5. Task Filters + Search */}
              <section className="filters-section">
                <div className="filter-tabs">
                  <button
                    type="button"
                    className={`filter-tab ${currentFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setCurrentFilter('all')}
                  >
                    <span>All</span>
                    <span className="count-badge">{stats.total}</span>
                  </button>

                  <button
                    type="button"
                    className={`filter-tab ${currentFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setCurrentFilter('pending')}
                  >
                    <span>Pending</span>
                    <span className="count-badge">{stats.pending}</span>
                  </button>

                  <button
                    type="button"
                    className={`filter-tab ${currentFilter === 'in_progress' ? 'active' : ''}`}
                    onClick={() => setCurrentFilter('in_progress')}
                  >
                    <span>Active</span>
                    <span className="count-badge">{stats.inProgress}</span>
                  </button>

                  <button
                    type="button"
                    className={`filter-tab ${currentFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => setCurrentFilter('completed')}
                  >
                    <span>Done</span>
                    <span className="count-badge">{stats.done}</span>
                  </button>
                </div>

                <div className="filter-search-box">
                  <Search size={14} strokeWidth={1.8} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Filter…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </section>

              {/* 6. Task List & Empty State */}
              <section className="task-list-section">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.length === 0 ? (
                    <motion.div
                      key="empty-state"
                      className="empty-state-card"
                      {...subtleFade}
                    >
                      <ClipboardList size={38} strokeWidth={1.3} className="empty-icon" />
                      <h3 className="empty-title">No tasks yet</h3>
                      <p className="empty-subtitle">Use the bar above to create one.</p>
                    </motion.div>
                  ) : (
                    <div className="tasks-container-card">
                      {filteredTasks.map((task) => (
                        <motion.div
                          key={task._id}
                          className={`task-item-row ${task.status === 'Completed' ? 'is-completed' : ''}`}
                          layout
                          variants={rowTransition}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          {/* Checkbox */}
                          <button
                            type="button"
                            className={`task-checkbox ${task.status === 'Completed' ? 'checked' : ''}`}
                            onClick={() => handleToggleTask(task)}
                            aria-label={task.status === 'Completed' ? 'Mark pending' : 'Mark completed'}
                          >
                            {task.status === 'Completed' && (
                              <Check size={12} strokeWidth={2.8} />
                            )}
                          </button>

                          {/* Task Title */}
                          <span className="task-title-text">{task.title}</span>

                          {/* Task Metadata & Actions on the Right */}
                          <div className="task-meta-right">
                            <span className={`priority-tag priority-${task.priority.toLowerCase()}`}>
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="date-tag">
                                {task.dueDate}
                              </span>
                            )}
                            <div className="task-actions-wrap">
                              <button
                                type="button"
                                className="action-icon-btn edit-btn"
                                onClick={() => setEditingTask(task)}
                                title="Edit task"
                              >
                                <Edit3 size={14} strokeWidth={1.8} />
                              </button>
                              <button
                                type="button"
                                className="action-icon-btn delete-btn"
                                onClick={() => handleDeleteTask(task._id)}
                                title="Delete task"
                              >
                                <Trash2 size={14} strokeWidth={1.8} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </section>
            </motion.div>
          )}

          {/* Secondary Views (Clean & Calm Placeholders) */}
          {activeNav === 'home' && (
            <motion.div className="subview-card" {...subtleFade}>
              <h2 className="subview-title">Welcome back, {user.name}</h2>
              <p className="subview-desc">
                You have <strong>{stats.active}</strong> active tasks requiring your attention today.
              </p>
              <div className="subview-actions">
                <button
                  type="button"
                  className="btn-primary-green subview-btn"
                  onClick={() => setActiveNav('tasks')}
                >
                  <span>Go to My Tasks</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </motion.div>
          )}

          {activeNav === 'calendar' && (
            <motion.div className="subview-card" {...subtleFade}>
              <h2 className="subview-title">Calendar Schedule</h2>
              <p className="subview-desc">
                Organize your scheduled milestones and due dates in a clean timeline.
              </p>
              <div className="subview-grid">
                <div className="calendar-stat-pill">
                  <strong>{tasks.filter((t) => t.dueDate).length}</strong> dated tasks
                </div>
              </div>
            </motion.div>
          )}

          {activeNav === 'analytics' && (
            <motion.div className="subview-card" {...subtleFade}>
              <h2 className="subview-title">Productivity Analytics</h2>
              <p className="subview-desc">
                Completion rate: <strong>{stats.rate}%</strong> ({stats.done} of {stats.total} total tasks completed)
              </p>
              <div className="analytics-bar-track">
                <div className="analytics-bar-fill" style={{ width: `${stats.rate}%` }} />
              </div>
            </motion.div>
          )}

          {activeNav === 'settings' && (
            <motion.div className="subview-card" {...subtleFade}>
              <h2 className="subview-title">Workspace Settings</h2>
              <div className="settings-item">
                <div className="settings-item-info">
                  <strong>Signed in as</strong>
                  <p>{user.email}</p>
                </div>
                <button type="button" className="btn-secondary-guest" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            </motion.div>
          )}
        </main>
      </div>

      {/* ─── Edit Task Modal ─── */}
      <AnimatePresence>
        {editingTask && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingTask(null)}
          >
            <motion.div
              className="modal-box"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title">Edit Task</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setEditingTask(null)}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUpdateTask} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-input"
                      value={editingTask.priority}
                      onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-input"
                      value={editingTask.status}
                      onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as any })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  />
                </div>

                <div className="modal-buttons">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setEditingTask(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-green"
                    style={{ width: 'auto', padding: '0 18px', height: '36px' }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
