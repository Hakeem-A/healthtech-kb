import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listReviewQueue, approveArticle, rejectArticle } from '../api/articles';
import Layout from '../components/Layout';
import Icon from '../components/icons';

export default function ReviewQueue() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listReviewQueue();
        if (!ignore) setArticles(data);
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

  async function handleApprove(id) {
    setBusyId(id);
    try {
      await approveArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRejectSubmit(id) {
    if (!reason.trim()) return;
    setBusyId(id);
    try {
      await rejectArticle(id, reason.trim());
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setRejectingId(null);
      setReason('');
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Review queue</h1>
        <p className="text-lg text-slate-500 mb-8">
          Articles awaiting approval before publishing
        </p>

        {loading && <p className="text-lg text-slate-500">Loading…</p>}
        {error && (
          <div className="text-base text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
            {error}
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl">
            <p className="text-lg text-slate-500">Nothing waiting for review right now.</p>
          </div>
        )}

        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex justify-between items-start gap-4 mb-3">
                <Link
                  to={`/articles/${article.id}`}
                  className="font-semibold text-lg text-slate-900 hover:text-blue-700"
                >
                  {article.title}
                </Link>
                <span className="text-sm text-slate-400 flex items-center gap-1.5 flex-shrink-0">
                  <Icon name="activity" className="w-3.5 h-3.5" />
                  {article.views} views
                </span>
              </div>

              {rejectingId === article.id ? (
                <div className="mt-3">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for rejection…"
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-base mb-3 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRejectSubmit(article.id)}
                      disabled={busyId === article.id || !reason.trim()}
                      className="bg-red-600 text-white text-base font-medium rounded-lg px-4 py-2 hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirm reject
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setReason(''); }}
                      className="text-base font-medium text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(article.id)}
                    disabled={busyId === article.id}
                    className="bg-blue-600 text-white text-base font-medium rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectingId(article.id)}
                    disabled={busyId === article.id}
                    className="text-base font-medium text-slate-500 border border-slate-200 rounded-lg px-4 py-2 hover:border-red-200 hover:text-red-600 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}