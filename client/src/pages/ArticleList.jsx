import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listArticles } from '../api/articles';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-700',
  under_review: 'bg-amber-100 text-amber-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-red-100 text-red-700',
};

export default function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();

  const canCreate = user.role === 'editor' || user.role === 'admin';

  useEffect(() => {
    listArticles()
      .then(setArticles)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-slate-800">HealthTech KB</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            {user.email} <span className="uppercase text-xs font-medium text-slate-400">({user.role})</span>
          </span>
          <button
            onClick={logout}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-slate-800">Articles</h2>
          {canCreate && (
            <Link
              to="/articles/new"
              className="bg-blue-600 text-white text-sm rounded px-4 py-2 hover:bg-blue-700"
            >
              New Article
            </Link>
          )}
        </div>

        {loading && <p className="text-slate-500">Loading…</p>}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
            {error}
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <p className="text-slate-500">No articles yet.</p>
        )}

        <ul className="space-y-3">
          {articles.map((article) => (
            <li key={article.id}>
              <Link
                to={`/articles/${article.id}`}
                className="block bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-slate-800">{article.title}</h3>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_STYLES[article.status] || 'bg-slate-100 text-slate-700'}`}
                  >
                    {article.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {article.views} views
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}