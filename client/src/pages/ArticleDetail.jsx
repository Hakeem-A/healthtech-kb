import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getArticle, deleteArticle, updateArticle } from '../api/articles';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-700',
  under_review: 'bg-amber-100 text-amber-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-red-100 text-red-700',
};

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);

  const canEdit = user.role === 'editor' || user.role === 'admin';
  const canPublish = user.role === 'admin';
  const canDelete = user.role === 'admin';

  useEffect(() => {
    setLoading(true);
    setError(null);
    getArticle(id)
      .then(setArticle)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!window.confirm('Delete this article? This cannot be undone.')) return;
    setBusy(true);
    setActionError(null);
    try {
      await deleteArticle(id);
      navigate('/articles');
    } catch (err) {
      setActionError(err.message);
      setBusy(false);
    }
  }

  async function handlePublishToggle() {
    const nextStatus = article.status === 'published' ? 'archived' : 'published';
    setBusy(true);
    setActionError(null);
    try {
      const updated = await updateArticle(id, { status: nextStatus });
      setArticle(updated);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500">Loading…</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 max-w-lg">
          {error}
        </div>
        <Link to="/articles" className="text-sm text-blue-600 mt-4 inline-block">
          ← Back to articles
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <Link to="/articles" className="text-sm text-blue-600">
          ← Back to articles
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-semibold text-slate-800">{article.title}</h1>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ml-4 ${STATUS_STYLES[article.status] || 'bg-slate-100 text-slate-700'}`}
          >
            {article.status}
          </span>
        </div>

        <p className="text-sm text-slate-500 mb-6">{article.views} views</p>

        {article.tags?.length > 0 && (
          <div className="flex gap-2 mb-6">
            {article.tags.map((tag) => (
              <span
                key={tag.id}
                className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-1"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6 whitespace-pre-wrap text-slate-700 leading-relaxed">
          {article.content}
        </div>

        {actionError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 mb-4">
            {actionError}
          </div>
        )}

        {canEdit && (
          <div className="flex gap-3">
            <Link
              to={`/articles/${id}/edit`}
              className="bg-slate-700 text-white text-sm rounded px-4 py-2 hover:bg-slate-800"
            >
              Edit
            </Link>

            {canPublish && (
              <button
                onClick={handlePublishToggle}
                disabled={busy}
                className="bg-blue-600 text-white text-sm rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
              >
                {article.status === 'published' ? 'Archive' : 'Publish'}
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={busy}
                className="bg-red-600 text-white text-sm rounded px-4 py-2 hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}