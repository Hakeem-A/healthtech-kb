import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listReviewQueue, approveArticle, rejectArticle } from '../api/articles';
import Layout from '../components/Layout';
import Icon from '../components/icons';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';


function daysWaiting(updatedAt) {
  if (!updatedAt) return 0;
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

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
      <div className="px-6 sm:px-10 py-10 max-w-[1400px] mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1.5">
            Review Queue
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Review, verify, and approve pending clinical submissions before publishing.
          </p>
        </div>

        {/* Days Waiting Chart */}
        {!loading && !error && articles.length > 0 && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Icon name="activity" className="w-4 h-4 text-amber-500" />
              Days Awaiting Clinical Verification
            </h2>

            <ResponsiveContainer width="100%" height={Math.max(160, articles.length * 48)}>
              <BarChart
                data={articles.map((a) => ({
                  title: a.title,
                  days: daysWaiting(a.updated_at),
                }))}
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} stroke="#94a3b8" />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={200}
                  tick={{ fontSize: 13, fill: '#334155' }}
                  tickFormatter={(t) => (t.length > 25 ? t.slice(0, 25) + '…' : t)}
                />
                <Tooltip
                  formatter={(value) => [`${value} day${value !== 1 ? 's' : ''}`, 'Waiting']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="days" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {loading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-slate-200 rounded-2xl p-7 h-28" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-base text-red-700 bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 font-medium">
            {error}
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Icon name="inbox" className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Review Queue Is Clear</h3>
            <p className="text-base text-slate-500 max-w-md mx-auto">
              All submitted articles have been reviewed and processed.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex justify-between items-start gap-4 mb-4 flex-wrap">
                <div>
                  <Link
                    to={`/articles/${article.id}`}
                    className="font-bold text-xl text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    {article.title}
                  </Link>
                  <p className="text-xs text-slate-400 mt-1">
                    Waiting for {daysWaiting(article.updated_at)} day(s) • Submitted by Author #{article.author_id || '1'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/articles/${article.id}`}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl transition"
                  >
                    Inspect Article
                  </Link>
                </div>
              </div>

              {rejectingId === article.id ? (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Feedback for Author (Reason for Rejection)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="E.g. Please specify the updated dosage guidelines in Section 2…"
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl p-3.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRejectSubmit(article.id)}
                      disabled={busyId === article.id || !reason.trim()}
                      className="bg-rose-600 text-white text-xs font-bold rounded-xl px-5 py-2.5 hover:bg-rose-700 disabled:opacity-50 transition shadow-2xs"
                    >
                      {busyId === article.id ? 'Rejecting…' : 'Confirm Rejection'}
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(null);
                        setReason('');
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 px-4 py-2.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleApprove(article.id)}
                    disabled={busyId === article.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-5 py-2.5 transition shadow-2xs disabled:opacity-50"
                  >
                    {busyId === article.id ? 'Approving…' : 'Approve & Publish'}
                  </button>
                  <button
                    onClick={() => setRejectingId(article.id)}
                    disabled={busyId === article.id}
                    className="text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl px-5 py-2.5 transition disabled:opacity-50"
                  >
                    Request Revisions / Reject
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