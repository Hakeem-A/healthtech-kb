import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getArticle, deleteArticle, updateArticle, listArticles, approveArticle, rejectArticle } from '../api/articles';
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

function estimateReadingTime(html) {
  if (!html) return '1 min read';
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
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
  const [copied, setCopied] = useState(false);

  const [ratingSummary, setRatingSummary] = useState(null);
  const [ratingBusy, setRatingBusy] = useState(false);

  const canEdit = user && user.role === 'editor';
  const canPublish = user && user.role === 'admin';
  const canDelete = user && user.role === 'admin';
  const canReview = user && user.role === 'admin' && article?.status === 'under_review';

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
      setActionError(err.message);
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
    if (!window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) return;
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

  async function handleApprove() {
    setBusy(true);
    setActionError(null);
    try {
      const updated = await approveArticle(id);
      setArticle(updated);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    const reasonPrompt = window.prompt('Please provide a clinical feedback / rejection reason:');
    if (!reasonPrompt || !reasonPrompt.trim()) return;
    setBusy(true);
    setActionError(null);
    try {
      const updated = await rejectArticle(id, reasonPrompt.trim());
      setArticle(updated);
    } catch (err) {
      setActionError(err.message);
    } finally {
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

  function handleCopyShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <Layout>
        <div className="px-6 sm:px-10 py-10 max-w-[1600px] mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-10 max-w-4xl animate-pulse space-y-6">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-10 bg-slate-200 rounded-xl w-3/4" />
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-64 bg-slate-50 rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-8 py-10">
          <div className="text-base text-red-700 bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 font-medium">
            {error}
          </div>
          <Link to="/articles" className="text-base text-blue-600 font-bold hover:underline">
            ← Back to all articles
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-6 sm:px-10 py-10 max-w-[1600px] mx-auto">
        <div className="grid gap-10 xl:grid-cols-[1fr_340px]">
          {/* Main article content column */}
          <div className="w-full">
            <Link
              to="/articles"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition mb-6 no-print"
            >
              ← Back to articles
            </Link>

            {actionError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 font-medium">
                {actionError}
              </div>
            )}

            {/* Rejection Feedback Banner */}
            {article.rejection_reason && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 text-rose-900">
                <span className="text-lg leading-none mt-0.5">💬</span>
                <div>
                  <h4 className="font-bold text-sm">Reviewer Revision Feedback</h4>
                  <p className="text-sm text-rose-700 mt-1">
                    {article.rejection_reason}
                  </p>
                </div>
              </div>
            )}

            {/* Clinical Status Callout Banner */}
            {article.status === 'under_review' && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-amber-800">
                <span className="text-lg leading-none mt-0.5">⚠️</span>
                <div>
                  <h4 className="font-bold text-sm">Under Clinical Review</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    This procedure is currently pending review and validation by clinical leadership.
                  </p>
                </div>
              </div>
            )}
            {article.status === 'draft' && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-start gap-3 text-slate-700">
                <span className="text-lg leading-none mt-0.5">📝</span>
                <div>
                  <h4 className="font-bold text-sm">Draft SOP Document</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    This article is in draft state and is not yet approved for operational clinical use.
                  </p>
                </div>
              </div>
            )}
            {article.status === 'archived' && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800">
                <span className="text-lg leading-none mt-0.5">⛔</span>
                <div>
                  <h4 className="font-bold text-sm">Archived Clinical Procedure</h4>
                  <p className="text-xs text-rose-700 mt-0.5">
                    This procedure has been archived and superseded. Verify the latest active SOP.
                  </p>
                </div>
              </div>
            )}

            <article className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-xs mb-8">
              {/* Header Meta */}
              <div className="border-b border-slate-100 pb-8 mb-8">
                <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider ${
                      STATUS_STYLES[article.status] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {article.status ? article.status.replace('_', ' ') : 'Draft'}
                  </span>

                  <div className="flex items-center gap-2 no-print">
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs"
                      title="Print Clinical SOP"
                    >
                      <span>🖨️</span>
                      Print SOP
                    </button>
                    <button
                      onClick={handleCopyShare}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs"
                      title="Copy Article URL"
                    >
                      <Icon name="clipboard" className="w-3.5 h-3.5" />
                      {copied ? '✓ Link Copied!' : 'Share'}
                    </button>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                  {article.title}
                </h1>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                      U
                    </span>
                    <span>Author #{article.author_id || '1'}</span>
                  </div>
                  <span>•</span>
                  <span>Updated {formatDate(article.updated_at)}</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-600">
                    ⏱ {estimateReadingTime(article.content)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Icon name="activity" className="w-3.5 h-3.5 text-slate-400" />
                    {article.views || 0} views
                  </span>
                </div>

                {article.tags && article.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-6">
                    {article.tags.map((t) => (
                      <span
                        key={t.id}
                        className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl"
                      >
                        #{t.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Rich HTML Content Body */}
              <div
                className="prose-content text-lg leading-relaxed text-slate-800"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
              />

              {/* Article Actions Bar */}
              {(canEdit || canPublish || canDelete) && (
                <div className="flex items-center gap-3 pt-8 mt-10 border-t border-slate-100 flex-wrap">
                  {canEdit && (
                    <Link
                      to={`/articles/${id}/edit`}
                      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-xs"
                    >
                      <Icon name="clipboard" className="w-4 h-4" />
                      Edit Article
                    </Link>
                  )}

                  {canReview && (
                    <>
                      <button
                        onClick={handleApprove}
                        disabled={busy}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50"
                      >
                        ✓ Approve & Publish
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={busy}
                        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50"
                      >
                        ✕ Reject with Reason
                      </button>
                    </>
                  )}

                  {canPublish && article.status !== 'under_review' && (
                    <button
                      onClick={handlePublishToggle}
                      disabled={busy}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow-xs disabled:opacity-50"
                    >
                      {article.status === 'published' ? 'Archive Article' : 'Publish Article'}
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={busy}
                      className="inline-flex items-center gap-2 text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-sm px-5 py-2.5 rounded-xl transition disabled:opacity-50 ml-auto"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </article>

            {/* Rating / Feedback Section */}
            {article.status === 'published' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Was this clinical article helpful?</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ratingSummary?.rating_count > 0
                      ? `Average rating: ${ratingSummary.average_rating} ★ (${ratingSummary.rating_count} submissions)`
                      : 'Be the first to rate this article.'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StarRating
                    value={ratingSummary?.my_rating || 0}
                    onRate={handleRate}
                    readOnly={ratingBusy}
                  />
                  {ratingBusy && <span className="text-xs text-slate-400">Saving…</span>}
                </div>
              </div>
            )}
          </div>

          {/* Related Articles Column */}
          <aside className="xl:sticky xl:top-[85px] self-start space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                <Icon name="articles" className="w-4 h-4 text-blue-600" />
                Related Clinical SOPs
              </h3>
              {related.length > 0 ? (
                <div className="space-y-3">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      to={`/articles/${r.id}`}
                      className="block p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition group"
                    >
                      <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">
                        {r.title}
                      </h4>
                      <span className="text-xs text-slate-400 mt-1 block">
                        {r.views || 0} views
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No related articles found in this category.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}