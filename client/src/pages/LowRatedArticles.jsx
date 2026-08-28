import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { listLowRatedArticles } from '../api/articles';
import Layout from '../components/Layout';
import Icon from '../components/icons';

function StarDisplay({ rating }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className="text-base">
          {star <= rounded ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function LowRatedArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maxRating, setMaxRating] = useState(3.5);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticleFeedback, setSelectedArticleFeedback] = useState(null);

  const [prevRating, setPrevRating] = useState(maxRating);
  if (prevRating !== maxRating) {
    setPrevRating(maxRating);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    let ignore = false;
    listLowRatedArticles(maxRating)
      .then((data) => {
        if (!ignore) {
          setArticles(data || []);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load low-rated articles.');
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [maxRating]);

  const fetchLowRated = async (threshold) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLowRatedArticles(threshold);
      setArticles(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load low-rated articles.');
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = useMemo(() => {
    if (!searchTerm) return articles;
    const lower = searchTerm.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(lower) ||
        a.category_name?.toLowerCase().includes(lower)
    );
  }, [articles, searchTerm]);

  // Overall metrics
  const totalCount = articles.length;
  const avgScore =
    totalCount > 0
      ? (
          articles.reduce((acc, curr) => acc + curr.average_rating, 0) /
          totalCount
        ).toFixed(1)
      : null;
  const totalFeedbackCount = articles.reduce(
    (acc, curr) => acc + curr.rating_count,
    0
  );

  return (
    <Layout>
      <div className="px-6 sm:px-10 py-10 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3.5 mb-2">
              <span className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl shadow-sm">
                <Icon name="alertTriangle" className="w-8 h-8" />
              </span>
              Low-Rated Articles
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              Identify clinical articles with low reader satisfaction and review user feedback to prioritize content updates.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => fetchLowRated(maxRating)}
              disabled={loading}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-base transition shadow-sm disabled:opacity-50"
            >
              <Icon
                name="activity"
                className={`w-5 h-5 ${loading ? 'animate-spin text-blue-600' : ''}`}
              />
              Refresh List
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-md transition-all hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-slate-500">
                Flagged Articles
              </span>
              <span className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Icon name="alertTriangle" className="w-6 h-6" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900">{totalCount}</div>
              <div className="text-sm text-slate-500 mt-1">
                Articles rated ≤ {maxRating} stars
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-md transition-all hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-slate-500">
                Average Flagged Score
              </span>
              <span className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <span className="text-rose-600 font-bold text-lg">★</span>
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-rose-600">
                {avgScore ? `${avgScore} / 5.0` : '—'}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Average rating across flagged content
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-md transition-all hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-slate-500">
                Total Reader Ratings
              </span>
              <span className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Icon name="clipboard" className="w-6 h-6" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900">
                {totalFeedbackCount}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Total feedback entries recorded
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden mb-10">
          {/* Controls Bar */}
          <div className="border-b border-slate-200 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="text-base font-bold text-slate-700">Rating Threshold:</span>
              <select
                value={maxRating}
                onChange={(e) => setMaxRating(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              >
                <option value={2.0}>≤ 2.0 Stars (Critical)</option>
                <option value={3.0}>≤ 3.0 Stars (Needs Review)</option>
                <option value={3.5}>≤ 3.5 Stars (Below Target)</option>
                <option value={4.0}>≤ 4.0 Stars (All Moderate)</option>
              </select>
            </div>

            <div className="relative min-w-[300px] flex-1 max-w-md">
              <Icon
                name="search"
                className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search article title or category…"
                className="w-full pl-12 pr-5 py-2.5 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>
          </div>

          {/* List Content */}
          {error && (
            <div className="p-6 bg-red-50 border-b border-red-200 text-red-700 text-base font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-16 text-center text-slate-500 text-lg">
              <Icon
                name="activity"
                className="w-10 h-10 mx-auto mb-4 animate-spin text-amber-500"
              />
              Loading low-rated articles…
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                ✓
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                No Low-Rated Articles Found
              </h3>
              <p className="text-slate-500 text-base max-w-md mx-auto">
                Great job! There are currently no published articles with an average rating below {maxRating} stars.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 text-sm font-bold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-8 py-4">Article Title</th>
                    <th className="px-8 py-4">Category</th>
                    <th className="px-8 py-4">Average Rating</th>
                    <th className="px-8 py-4">Feedback Count</th>
                    <th className="px-8 py-4 text-center">User Comments</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-base">
                  {filteredArticles.map((article) => (
                    <tr
                      key={article.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <Link
                          to={`/articles/${article.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition hover:underline"
                        >
                          {article.title}
                        </Link>
                        <div className="text-xs text-slate-400 mt-1">
                          Article #{article.id} • {article.views} views
                        </div>
                      </td>

                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {article.category_name || 'General'}
                        </span>
                      </td>

                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                            ★ {article.average_rating.toFixed(1)}
                          </span>
                          <StarDisplay rating={article.average_rating} />
                        </div>
                      </td>

                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="text-slate-700 font-semibold">
                          {article.rating_count} {article.rating_count === 1 ? 'rating' : 'ratings'}
                        </span>
                      </td>

                      <td className="px-8 py-5 whitespace-nowrap text-center">
                        {article.recent_feedback?.length > 0 ? (
                          <button
                            onClick={() => setSelectedArticleFeedback(article)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-sm transition"
                          >
                            <Icon name="message" className="w-4 h-4" />
                            View Feedback ({article.recent_feedback.length})
                          </button>
                        ) : (
                          <span className="text-sm text-slate-400">No comments</span>
                        )}
                      </td>

                      <td className="px-8 py-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/articles/${article.id}`}
                            className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                          >
                            View
                          </Link>
                          <Link
                            to={`/articles/${article.id}/edit`}
                            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs"
                          >
                            Edit & Improve
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Feedback Inspection Modal */}
        {selectedArticleFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                    <Icon name="message" className="w-6 h-6" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xl">
                      Reader Feedback & Comments
                    </h3>
                    <p className="text-sm text-slate-500 truncate max-w-md">
                      {selectedArticleFeedback.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedArticleFeedback(null)}
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200 text-xl font-bold transition"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-4">
                {selectedArticleFeedback.recent_feedback.map((fb) => (
                  <div
                    key={fb.id}
                    className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900">
                          ★ {fb.rating} / 5
                        </span>
                        <StarDisplay rating={fb.rating} />
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {formatDate(fb.created_at)}
                      </span>
                    </div>
                    {fb.comment ? (
                      <p className="text-slate-800 text-base leading-relaxed font-medium">
                        "{fb.comment}"
                      </p>
                    ) : (
                      <p className="text-slate-400 text-sm italic">
                        Rating submitted without written comment.
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="px-8 py-5 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                <Link
                  to={`/articles/${selectedArticleFeedback.id}/edit`}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-bold transition shadow-xs"
                >
                  Edit Article Now
                </Link>
                <button
                  onClick={() => setSelectedArticleFeedback(null)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-base font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
