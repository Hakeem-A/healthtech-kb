import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { listUsers, deleteUser } from '../api/users';
import { useAuth } from '../context/useAuth';
import Layout from '../components/Layout';
import Icon from '../components/icons';

const ROLE_STYLES = {
  admin: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/80',
  editor: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80',
  viewer: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/80',
};

function initials(name, email) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : 'U';
}

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listUsers();
        if (!ignore) setUsers(data);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleDelete(u) {
    if (u.email === currentUser.email) {
      alert("You cannot delete your own active administrator account.");
      return;
    }
    if (!window.confirm(`Delete user ${u.full_name} (${u.email})? This action cannot be undone.`)) return;
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

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const lower = search.toLowerCase();
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        u.role.toLowerCase().includes(lower)
    );
  }, [users, search]);

  return (
    <Layout>
      <div className="px-6 sm:px-10 py-10 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1.5">
              Users & Access Control
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Manage clinical staff accounts, assign roles, and administer permissions.
            </p>
          </div>
          <Link
            to="/users/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-base font-bold rounded-xl px-6 py-3 hover:bg-blue-700 transition shadow-sm hover:shadow-md flex-shrink-0"
          >
            <Icon name="plus" className="w-5 h-5" />
            Add Staff Member
          </Link>
        </div>

        {users.length > 0 && (
          <div className="mb-6 max-w-md">
            <div className="relative">
              <Icon
                name="search"
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter users by name, email, or role…"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
              />
            </div>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white border border-slate-200 rounded-2xl p-6 h-24" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-base text-red-700 bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 font-medium">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex justify-between items-center hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-2xs">
                    {initials(u.full_name, u.email)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-base text-slate-900 truncate">{u.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider ${
                      ROLE_STYLES[u.role] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {u.role}
                  </span>
                  {u.email !== currentUser.email && (
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={busyId === u.id}
                      className="text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5 transition disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}