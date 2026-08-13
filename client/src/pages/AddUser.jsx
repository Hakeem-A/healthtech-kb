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
      <div className="max-w-lg mx-auto px-8 py-10">
        <Link to="/users" className="text-base text-blue-600 font-medium mb-6 inline-block hover:text-blue-800">
          ← Users
        </Link>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-8">Add User</h1>

        <form onSubmit={handleSubmit} className="bg-slate-100 border border-slate-200 rounded-xl shadow-md p-8">
          {error && (
            <div className="mb-6 text-base text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
              {error}
            </div>
          )}

          <label htmlFor="full_name" className="block text-base font-medium text-slate-700 mb-2">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label htmlFor="email" className="block text-base font-medium text-slate-700 mb-2">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label htmlFor="password" className="block text-base font-medium text-slate-700 mb-2">
            Temporary password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label htmlFor="role" className="block text-base font-medium text-slate-700 mb-2">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg mb-7 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white text-lg font-medium rounded-lg py-3.5 hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create user'}
          </button>
        </form>
      </div>
    </Layout>
  );
}