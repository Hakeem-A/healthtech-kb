import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUser } from '../api/users';
import Layout from '../components/Layout';

export default function AddUser() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createUser({ full_name: fullName, email, password, role });
      navigate('/users');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-6 sm:px-10 py-10">
        <Link
          to="/users"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition mb-6"
        >
          ← Back to Users
        </Link>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Add Staff Member
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          Create a new user profile with role-based access controls for the knowledge base.
        </p>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200/90 rounded-3xl shadow-xs p-8 sm:p-10 space-y-6">
          {error && (
            <div className="text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-4">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="full_name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="e.g. Dr. Sarah Jenkins"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="sarah.jenkins@hospital.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Temporary Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Access Role
            </label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            >
              <option value="viewer">Viewer (Read-only access to published articles & chatbot)</option>
              <option value="editor">Editor (Author & submit new SOPs for review)</option>
              <option value="admin">Admin (Full access, approve review queue, manage users & audit)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              to="/users"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-5 py-3 rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl px-6 py-3 transition shadow-xs hover:shadow-md disabled:opacity-50"
            >
              {loading ? 'Creating Account…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}