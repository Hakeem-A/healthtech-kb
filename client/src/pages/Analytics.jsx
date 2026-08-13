import { useEffect, useState } from 'react';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getAnalyticsSummary } from '../api/analytics';
import Layout from '../components/Layout';


const STATUS_COLORS = {
  published: '#22c55e',
  draft: '#94a3b8',
  under_review: '#f59e0b',
  archived: '#ef4444',
};

function StatCard({ label, value }) {
  return (
    <div className="bg-slate-100 border border-slate-200 rounded-xl px-6 py-6 shadow-md">
      <p className="text-base text-slate-500 mb-1">{label}</p>
      <p className="text-4xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const result = await getAnalyticsSummary();
        if (!ignore) setData(result);
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

  const pieData = data
    ? Object.entries(data.status_breakdown)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({ name: status, value: count }))
    : [];

  return (
    <Layout>
      <div className="px-10 py-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">Analytics</h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-8">
          Knowledge base performance at a glance
        </p>

        {loading && <p className="text-lg text-slate-600 leading-relaxed">Loading…</p>}
        {error && (
          <div className="text-base text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-4 gap-6 mb-10">
              <StatCard label="Published articles" value={data.published_count} />
              <StatCard label="Pending review" value={data.pending_review_count} />
              <StatCard label="Total views" value={data.total_views} />
              <StatCard
                label="Average rating"
                value={data.rating_count > 0 ? `${data.average_rating} ★` : '—'}
              />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 shadow-md">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Top viewed articles
                </h2>
                {data.top_articles.length === 0 ? (
                  <p className="text-base text-slate-400">No published articles yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data.top_articles} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="title"
                        width={140}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(t) => (t.length > 18 ? t.slice(0, 18) + '…' : t)}
                      />
                      <Tooltip />
                      <Bar dataKey="views" fill="#2563eb" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 shadow-md">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Article status breakdown
                </h2>
                {pieData.length === 0 ? (
                  <p className="text-base text-slate-400">No articles yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 shadow-md">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Search activity
              </h2>
              <p className="text-4xl font-bold text-slate-900 mb-1">
                {data.searches_this_week}
              </p>
              <p className="text-base text-slate-500">searches in the last 7 days</p>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}