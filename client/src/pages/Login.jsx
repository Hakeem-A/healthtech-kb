import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Icon from '../components/icons';

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'admin@healthtech.com',
    password: 'AdminPass123!',
    tag: 'Full Access',
    color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/80',
    desc: 'Review queue, analytics, user management & audit logs',
  },
  {
    role: 'Editor',
    email: 'editor@healthtech.com',
    password: 'EditorPass123!',
    tag: 'Author',
    color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80',
    desc: 'Create, edit & submit clinical SOPs for review',
  },
  {
    role: 'Viewer',
    email: 'viewer@healthtech.com',
    password: 'ViewerPass123!',
    tag: 'Read Only',
    color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80',
    desc: 'Browse articles, rate SOPs & chat with clinical assistant',
  },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/articles');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(demo) {
    setEmail(demo.email);
    setPassword(demo.password);
    setError(null);
    setLoading(true);
    setActiveDemoRole(demo.role);
    try {
      await login(demo.email, demo.password);
      navigate('/articles');
    } catch (err) {
      setError(err.message || `Failed to sign in as ${demo.role}`);
    } finally {
      setLoading(false);
      setActiveDemoRole(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50/70 p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-2xl text-slate-900 tracking-tight mb-2">
            <span className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-base font-extrabold shadow-sm">
              H
            </span>
            <span>HealthTech <span className="text-blue-600">KB</span></span>
          </Link>
          <p className="text-sm text-slate-500 font-medium">
            Clinical Knowledge Base & Decision Support System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-8 sm:p-10 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-6 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Staff Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="staff@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl py-3.5 transition shadow-xs hover:shadow-md disabled:opacity-50 mt-2"
            >
              {loading && !activeDemoRole ? 'Authenticating…' : 'Sign in to Knowledge Base'}
            </button>
          </form>

          {/* Quick Demo 1-Click Logins */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1-Click Demo Logins
              </p>
              <span className="text-[11px] text-slate-400 font-medium">Instant Access</span>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin(d)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${d.color} ${
                    loading && activeDemoRole === d.role ? 'ring-2 ring-blue-500 animate-pulse' : ''
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm">{d.role}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white/80 border border-current opacity-80">
                        {d.tag}
                      </span>
                    </div>
                    <p className="text-xs opacity-75 truncate">{d.desc}</p>
                  </div>
                  <span className="text-xs font-bold whitespace-nowrap flex-shrink-0">
                    {loading && activeDemoRole === d.role ? 'Signing in…' : 'Login →'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Internal Hospital HMIS Knowledge Management Platform
        </p>
      </div>
    </div>
  );
}