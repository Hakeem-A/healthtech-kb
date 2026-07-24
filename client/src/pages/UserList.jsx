import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listUsers, deleteUser } from '../api/users';
import { useAuth } from '../context/AuthContext';

const ROLE_STYLES = {
  admin: 'bg-purple-100 text-purple-800',
  editor: 'bg-blue-100 text-blue-800',
  viewer: 'bg-slate-100 text-slate-700',
};

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const { user: currentUser } = useAuth();

  function load() {
    setLoading(true);
    listUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(u) {
    if (u.email === currentUser.email) {
      alert("You can't delete your own account.");
      return;
    }
    if (!window.confirm(`Delete ${u.full_name} (${u.email})? This cannot be undone.`)) return;
    setBusyId(u.id);
    try {
      await deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/articles" className="text-sm text-blue-600">
            ← Articles
          </Link>
          <h1 className="text-xl font-semibold text-slate-800">Users</h1>
        </div>
        <Link
          to="/users/new"
          className="bg-blue-600 text-white text-sm rounded px-4 py-2 hover:bg-blue-700"
        >
          Add User
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading && <p className="text-slate-500">Loading…</p>}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
            {error}
          </div>
        )}

        {!loading && !error && (
          <ul className="space-y-3">
            {users.map((u) => (
              <li
                key={u.id}
                className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-slate-800">{u.full_name}</p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded uppercase ${ROLE_STYLES[u.role] || 'bg-slate-100 text-slate-700'}`}
                  >
                    {u.role}
                  </span>
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={busyId === u.id}
                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}