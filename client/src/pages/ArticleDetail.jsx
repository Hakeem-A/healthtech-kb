import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getArticle, deleteArticle, updateArticle, listArticles } from '../api/articles';
import { useAuth } from '../context/useAuth';
import Layout from '../components/Layout';
import Icon from '../components/icons';
import { submitFeedback, getFeedbackSummary } from '../api/articles';
import StarRating from '../components/StarRating';
import DOMPurify from 'dompurify'; // ✅ added

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

  const [ratingSummary, setRatingSummary] = useState(null);
  const [ratingBusy, setRatingBusy] = useState(false);

  const canEdit = user.role === 'editor' || user.role === 'admin';
  const canPublish = user.role === 'admin';
  const canDelete = user.role === 'admin';

  useEffect(() => {
    if (article?.status === 'published') {
      getFeedbackSummary(id).then(setRatingSummary).catch(() => {});
    }
  }, [id, article?.status]);

  async function handleRate(stars) {
    setRatingBusy(true);
    try {
      await submitFeedback(id, stars);
      const summary = await getFeedbackSummary(id);
      setRatingSummary(summary);
    } catch (err) {
      alert(err.message);
    } finally {
      setRatingBusy(false);
    }
  }

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
        <div className="p-10 text-lg text-slate-600 leading-relaxed">Loading…</div>
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
      <div className="px-6 py-10">
        <div className="max-w-7xl mx-auto grid gap-10 xl:grid-cols-[1fr_320px]">
            
          {/* Main column */}
          <div className="max-w-[850px] w-full">
            <Link
              to="/articles"
              className="text-base text-blue-600 font-medium mb-6 inline-block hover:text-blue-800"
            >
              ← Back to articles
            </Link>

            <div className="mb-8 border-b border-slate-200 pb-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[article.status]}`}>
                  {article.status}
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.15]">
                {article.title}
              </h1>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-700">
                      U
                    </div>
                    <span>Author ID: {article.author_id || 'Unknown'}</span>
                  </div>
                  <span>•</span>
                  <span>Updated {formatDate(article.updated_at)}</span>
                  <span>•</span>
                  <span>{article.views || 0} views</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                  title="Copy Link"
                >
                  <Icon name="clipboard" className="w-4 h-4" />
                  Share
                </button>
              </div>

              {article.tags && article.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-6">
                  {article.tags.map(t => (
                    <span key={t.id} className="text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-full">
                      #{t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ✅ FIXED: Rich HTML rendering */}
            <div
              className="bg-slate-100 border border-slate-200 rounded-xl p-8 shadow-md mb-6 prose-content text-lg"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
            />

            {canEdit && (
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link to={`/articles/${id}/edit`} className="inline-flex items-center justify-center bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-900 transition">
                  Edit
                </Link>
 
                {canPublish && (
                  <button onClick={handlePublishToggle} className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                    {article.status === 'published' ? 'Archive' : 'Publish'}
                  </button>
                )}
 
                {canDelete && (
                  <button onClick={handleDelete} className="inline-flex items-center justify-center bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition">
                    Delete
                  </button>
                )}
              </div>
            )}

            {/* ✅ FIXED: Rating now inside main column */}
            {article.status === 'published' && (
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 shadow-md mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Was this helpful?</p>
                    {ratingSummary?.rating_count > 0 && (
                      <p className="text-sm text-slate-500">
                        {ratingSummary.average_rating} avg ({ratingSummary.rating_count})
                      </p>
                    )}
                  </div>
                  <StarRating
                    value={ratingSummary?.my_rating || 0}
                    onRate={handleRate}
                    readOnly={ratingBusy}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="xl:sticky xl:top-[96px] self-start space-y-6">
            <div className="bg-slate-300 border border-slate-200 rounded-xl p-6 shadow-md">
              <h2 className="font-semibold mb-4">Related articles</h2>
              {related.length > 0 ? (
                related.map((r) => (
                  <Link key={r.id} to={`/articles/${r.id}`} className="block text-blue-600 mb-2 hover:text-blue-800">
                    {r.title}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500">No related articles found.</p>
              )}
            </div>
          </aside>

        </div>
      </div>
    </Layout>
  );
}