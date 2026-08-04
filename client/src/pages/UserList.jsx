import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listUsers, deleteUser } from '../api/users';
import { useAuth } from '../context/useAuth';
import Layout from '../components/Layout';
import Icon from '../components/icons';

const ROLE_STYLES = {
  admin: 'bg-purple-100 text-purple-800 ring-1 ring-purple-200',
  editor: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  viewer: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
};

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
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
    <Layout>
      <div className="px-10 py-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <Link to="/articles" className="text-base text-blue-600 font-medium mb-2 inline-block hover:text-blue-800">
              ← Articles
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Users</h1>
          </div>
          <Link
            to="/users/new"
            className="flex items-center gap-1.5 bg-blue-600 text-white text-base font-medium rounded-lg px-5 py-3 hover:bg-blue-700 transition shadow-sm"
          >
            <Icon name="plus" className="w-4 h-4" />
            Add User
          </Link>
        </div>

        {loading && <p className="text-lg text-slate-500">Loading…</p>}
        {error && (
          <div className="text-base text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 gap-4">
            {users.map((u) => (
              <div
                key={u.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-lg text-slate-900">{u.full_name}</p>
                  <p className="text-base text-slate-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full uppercase ${ROLE_STYLES[u.role] || 'bg-slate-100 text-slate-700'}`}
                  >
                    {u.role}
                  </span>
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={busyId === u.id}
                    className="text-base font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}