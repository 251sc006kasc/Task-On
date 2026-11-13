import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  LogOut,
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
  Check,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Zap,
  Users,
  User as UserIcon,
  Table as TableIcon,
  List as ListIcon
} from 'lucide-react';
import api from './api';
import iconImg from './assets/icon.avif';
import heroLogoImg from './assets/hero-logo.avif';
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

const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
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
  const [showPassword, setShowPassword] = useState(false);
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
  const [viewMode, setViewMode] = useState<'table' | 'list'>(() => {
    return (localStorage.getItem('task_on_view_mode') as 'table' | 'list') || 'table';
  });

  const handleSetViewMode = (mode: 'table' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('task_on_view_mode', mode);
  };

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
     1. AUTHENTICATION PAGE (Split Hero & Modern Card)
     ═══════════════════════════════════════════════ */
  if (!user) {
    return (
      <div className="auth-layout">
        {/* Left Side: Brand Story & Workspace Visual */}
        <div className="auth-hero-section">
          <div className="auth-hero-overlay" />
          <motion.div
            className="auth-hero-container"
            variants={heroContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Top Brand Logo */}
            <motion.div className="auth-hero-header" variants={heroItemVariants}>
              <img src={heroLogoImg} alt="Task-On Logo" className="hero-brand-icon-img" />
              <span className="hero-brand-title">Task-On</span>
            </motion.div>

            {/* Main Statement */}
            <div className="auth-hero-center">
              <motion.h1 className="hero-headline" variants={heroItemVariants}>
                Make room for<br />
                what <span className="hero-headline-highlight">matters.</span>
              </motion.h1>
              <motion.p className="hero-subheadline" variants={heroItemVariants}>
                Task-On helps you stay focused, organized and in control — every day.
              </motion.p>

              {/* Value Props */}
              <div className="hero-value-props">
                <motion.div
                  className="value-prop-item"
                  variants={heroItemVariants}
                  whileHover={{ x: 6 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                >
                  <div className="value-prop-icon">
                    <Zap size={20} strokeWidth={2.2} />
                  </div>
                  <div className="value-prop-content">
                    <h3 className="value-prop-title">Plan Smarter</h3>
                    <p className="value-prop-desc">Organize your tasks, set priorities and get things done.</p>
                  </div>
                </motion.div>

                <motion.div
                  className="value-prop-item"
                  variants={heroItemVariants}
                  whileHover={{ x: 6 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                >
                  <div className="value-prop-icon">
                    <CalendarIcon size={20} strokeWidth={2.2} />
                  </div>
                  <div className="value-prop-content">
                    <h3 className="value-prop-title">Stay On Track</h3>
                    <p className="value-prop-desc">Never miss a deadline with reminders and progress tracking.</p>
                  </div>
                </motion.div>

                <motion.div
                  className="value-prop-item"
                  variants={heroItemVariants}
                  whileHover={{ x: 6 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                >
                  <div className="value-prop-icon">
                    <Users size={20} strokeWidth={2.2} />
                  </div>
                  <div className="value-prop-content">
                    <h3 className="value-prop-title">Work Together</h3>
                    <p className="value-prop-desc">Collaborate and achieve more with your team.</p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Bottom visual breathing room */}
            <div className="auth-hero-footer" />
          </motion.div>
        </div>

        {/* Right Side: Auth Card Area */}
        <div className="auth-form-section">
          <motion.div
            className="auth-card-panel"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Centered Brand Mark */}
            <motion.div
              className="auth-card-brand"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.3, ease: 'easeOut' }}
            >
              <img src={iconImg} alt="Task-On Logo" className="auth-card-brand-img" />
              <span className="auth-card-logo-text">Task-On</span>
            </motion.div>

            {/* Heading with smooth crossfade */}
            <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AnimatePresence mode="wait">
                <motion.h2
                  key={authMode}
                  className="auth-card-title"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18 }}
                  style={{ marginBottom: 0 }}
                >
                  {authMode === 'signin' ? 'Sign in to your account' : 'Create your account'}
                </motion.h2>
              </AnimatePresence>
            </div>

            {/* Segmented Switch Tabs with smooth Framer Motion layout pill */}
            <div className="auth-segmented-pill" style={{ marginTop: '24px' }}>
              <button
                type="button"
                className={`auth-pill-btn ${authMode === 'signin' ? 'active' : ''}`}
                onClick={() => { setAuthMode('signin'); setAuthError(''); }}
              >
                {authMode === 'signin' && (
                  <motion.div
                    layoutId="authActivePill"
                    className="auth-pill-active-bg"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="auth-pill-text">Sign In</span>
              </button>
              <button
                type="button"
                className={`auth-pill-btn ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
              >
                {authMode === 'register' && (
                  <motion.div
                    layoutId="authActivePill"
                    className="auth-pill-active-bg"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="auth-pill-text">Register</span>
              </button>
            </div>

            {/* Error Message with shake and smooth enter/exit */}
            <AnimatePresence>
              {authError && (
                <motion.div
                  className="auth-error-banner"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    x: [0, -6, 6, -4, 4, -1, 1, 0],
                  }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{
                    opacity: { duration: 0.18 },
                    scale: { duration: 0.18 },
                    x: { duration: 0.38, ease: 'easeOut' },
                  }}
                >
                  {authError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form className="auth-form-fields" onSubmit={handleAuthSubmit}>
              <AnimatePresence initial={false}>
                {authMode === 'register' && (
                  <motion.div
                    key="register-name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="auth-field-group">
                      <label className="auth-field-label" htmlFor="auth-name">FULL NAME</label>
                      <div className="auth-input-container">
                        <UserIcon size={18} className="auth-input-leading-icon" />
                        <input
                          id="auth-name"
                          type="text"
                          className="auth-text-input with-icon"
                          required
                          placeholder="Jane Doe"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="auth-email">EMAIL</label>
                <div className="auth-input-container">
                  <Mail size={18} className="auth-input-leading-icon" />
                  <input
                    id="auth-email"
                    type="email"
                    className="auth-text-input with-icon"
                    required
                    placeholder="name@company.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label" htmlFor="auth-password">PASSWORD</label>
                <div className="auth-input-container">
                  <Lock size={18} className="auth-input-leading-icon" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-text-input with-icon with-trailing"
                    required
                    placeholder="Enter your password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                  <motion.button
                    type="button"
                    className="auth-password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.88 }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </motion.button>
                </div>
              </div>

              {/* Dark Green Submit Button */}
              <motion.button
                type="submit"
                className="auth-primary-submit-btn"
                disabled={isAuthLoading}
                whileHover={!isAuthLoading ? { scale: 1.015 } : {}}
                whileTap={!isAuthLoading ? { scale: 0.985 } : {}}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              >
                <span>{isAuthLoading ? 'Processing…' : authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                <motion.span
                  animate={isAuthLoading ? { rotate: 360 } : { rotate: 0 }}
                  transition={isAuthLoading ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <ArrowRight size={17} strokeWidth={2.4} />
                </motion.span>
              </motion.button>
            </form>

            {/* OR Divider */}
            <div className="auth-line-divider">
              <span>OR</span>
            </div>

            {/* Continue as Guest Button */}
            <motion.button
              type="button"
              className="auth-guest-btn"
              onClick={handleContinueAsGuest}
              whileHover={{ scale: 1.015, borderColor: '#CBD5E1' }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            >
              Continue as Guest
            </motion.button>
          </motion.div>
        </div>
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
            <img src={iconImg} alt="Task-On Logo" className="brand-logo-img" />
            <span className="brand-logo-text">Task-On</span>
          </div>
        </div>

        <div className="header-right">
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
            title="Log out of account"
          >
            <LogOut size={13} strokeWidth={2.2} />
            <span>Log out</span>
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

                <div className="filter-controls-right">
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

                  <div className="view-mode-toggle" role="group" aria-label="Task layout view">
                    <button
                      type="button"
                      className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
                      onClick={() => handleSetViewMode('table')}
                      title="Switch to Visual Table View"
                      aria-pressed={viewMode === 'table'}
                    >
                      <TableIcon size={13} strokeWidth={2} />
                      <span>Table</span>
                    </button>
                    <button
                      type="button"
                      className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => handleSetViewMode('list')}
                      title="Switch to Compact List View"
                      aria-pressed={viewMode === 'list'}
                    >
                      <ListIcon size={13} strokeWidth={2} />
                      <span>List</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* 6. Task List & Table View */}
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
                  ) : viewMode === 'table' ? (
                    <motion.div
                      key="tasks-table-view"
                      className="tasks-table-container"
                      layout
                      {...subtleFade}
                    >
                      <table className="tasks-table">
                        <thead>
                          <tr>
                            <th className="th-col-check">Done</th>
                            <th className="th-col-title">Task Title</th>
                            <th className="th-col-status">Status</th>
                            <th className="th-col-priority">Priority</th>
                            <th className="th-col-date">Due Date</th>
                            <th className="th-col-actions">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTasks.map((task) => (
                            <tr
                              key={task._id}
                              className={`tasks-table-row ${task.status === 'Completed' ? 'is-completed' : ''}`}
                            >
                              <td className="td-col-check">
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
                              </td>
                              <td className="td-col-title">
                                <span className="table-task-title">{task.title}</span>
                              </td>
                              <td className="td-col-status">
                                <span className={`table-status-pill status-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                  <span className="status-dot-indicator" />
                                  {task.status}
                                </span>
                              </td>
                              <td className="td-col-priority">
                                <span className={`priority-tag priority-${task.priority.toLowerCase()}`}>
                                  {task.priority}
                                </span>
                              </td>
                              <td className="td-col-date">
                                {task.dueDate ? (
                                  <span className="table-date-badge">
                                    <CalendarIcon size={12} strokeWidth={1.8} />
                                    {task.dueDate}
                                  </span>
                                ) : (
                                  <span className="table-empty-val">—</span>
                                )}
                              </td>
                              <td className="td-col-actions">
                                <div className="table-actions-cell">
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
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="tasks-list-view"
                      className="tasks-container-card"
                      layout
                      {...subtleFade}
                    >
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
                    </motion.div>
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
                <button
                  type="button"
                  className="btn-logout"
                  onClick={handleLogout}
                  title="Log out of account"
                >
                  <LogOut size={13} strokeWidth={2.2} />
                  <span>Log out</span>
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
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title-wrap">
                  <Edit3 size={18} className="modal-header-icon" />
                  <h3 className="modal-title">Edit Task</h3>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setEditingTask(null)}
                  aria-label="Close modal"
                >
                  <X size={17} />
                </button>
              </div>

              <form onSubmit={handleUpdateTask} className="modal-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-task-title">Task Title</label>
                  <input
                    id="edit-task-title"
                    type="text"
                    className="form-input"
                    required
                    placeholder="Enter task title"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-task-priority">Priority</label>
                    <select
                      id="edit-task-priority"
                      className="form-input form-select"
                      value={editingTask.priority}
                      onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-task-status">Status</label>
                    <select
                      id="edit-task-status"
                      className="form-input form-select"
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
                  <label className="form-label" htmlFor="edit-task-date">Due Date</label>
                  <input
                    id="edit-task-date"
                    type="date"
                    className="form-input form-date"
                    value={editingTask.dueDate ? editingTask.dueDate.split('T')[0] : ''}
                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  />
                </div>

                <div className="modal-buttons">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setEditingTask(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-save"
                  >
                    <Check size={16} strokeWidth={2.4} />
                    <span>Save Changes</span>
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
