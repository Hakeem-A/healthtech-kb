import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getArticle, deleteArticle, updateArticle, listArticles } from '../api/articles';
import { useAuth } from '../context/useAuth';
import Layout from '../components/Layout';
import Icon from '../components/icons';

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  under_review: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  published: 'bg-green-100 text-green-700 ring-1 ring-green-200',
  archived: 'bg-red-100 text-red-700 ring-1 ring-red-200',
};

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busy, setBusy] = useState(false);

  const canEdit = user.role === 'editor' || user.role === 'admin';
  const canPublish = user.role === 'admin';
  const canDelete = user.role === 'admin';

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const a = await getArticle(id);
        if (ignore) return;
        setArticle(a);
        const all = await listArticles();
        if (ignore) return;
        const scored = all
          .filter((item) => item.id !== a.id && item.status === 'published')
          .map((item) => ({
            article: item,
            score: item.category_id === a.category_id ? 1 : 0,
          }))
          .filter((entry) => entry.score > 0)
          .sort((x, y) => y.score - x.score)
          .slice(0, 4)
          .map((entry) => entry.article);
        setRelated(scored);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
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
    return (
      <Layout>
        <div className="p-10 text-lg text-slate-500">Loading…</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-8 py-10">
          <div className="text-base text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            {error}
          </div>
          <Link to="/articles" className="text-base text-blue-600 font-medium">
            ← Back to articles
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-10 py-10">
        <div className="max-w-6xl mx-auto grid grid-cols-[1fr_320px] gap-10">
          {/* Main content column */}
          <div className="max-w-3xl">
            <Link
              to="/articles"
              className="text-base text-blue-600 font-medium mb-6 inline-block hover:text-blue-800"
            >
              ← Back to articles
            </Link>

            <div className="flex justify-between items-start gap-4 mb-3">
              <h1 className="text-3xl font-bold text-slate-900">{article.title}</h1>
              <span
                className={`text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${STATUS_STYLES[article.status] || 'bg-slate-100 text-slate-700'}`}
              >
                {article.status}
              </span>
            </div>

            {/* Metadata row */}
            <div className="flex items-center gap-4 text-base text-slate-500 mb-6 pb-6 border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <Icon name="activity" className="w-4 h-4" />
                {article.views} views
              </span>
              <span className="text-slate-300">|</span>
              <span>Updated {formatDate(article.updated_at)}</span>
            </div>

            {article.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {article.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="flex items-center gap-1 text-sm bg-slate-100 text-slate-600 rounded-full px-3 py-1"
                  >
                    <Icon name="tag" className="w-3.5 h-3.5" />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl p-7 shadow-sm mb-6 whitespace-pre-wrap text-lg text-slate-700 leading-relaxed">
              {article.content}
            </div>

            {actionError && (
              <div className="text-base text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                {actionError}
              </div>
            )}

            {canEdit && (
              <div className="flex gap-3">
                <Link
                  to={`/articles/${id}/edit`}
                  className="bg-slate-800 text-white text-base font-medium rounded-lg px-5 py-3 hover:bg-slate-900 transition"
                >
                  Edit
                </Link>

                {canPublish && (
                  <button
                    onClick={handlePublishToggle}
                    disabled={busy}
                    className="bg-blue-600 text-white text-base font-medium rounded-lg px-5 py-3 hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {article.status === 'published' ? 'Archive' : 'Publish'}
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={busy}
                    className="bg-red-600 text-white text-base font-medium rounded-lg px-5 py-3 hover:bg-red-700 transition disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Icon name="clipboard" className="w-4 h-4 text-slate-400" />
                Related articles
              </h2>

              {related.length === 0 && (
                <p className="text-sm text-slate-400">No related articles found.</p>
              )}

              <ul className="space-y-3">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/articles/${r.id}`}
                      className="block group"
                    >
                      <p className="text-sm font-medium text-blue-600 group-hover:text-blue-800 leading-snug">
                        {r.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{r.views} views</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}