import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getAnalyticsSummary } from '../api/analytics';
import Layout from '../components/Layout';
import Icon from '../components/icons';


const STATUS_COLORS = {
  published: '#10b981',
  draft: '#64748b',
  under_review: '#f59e0b',
  archived: '#ef4444',
};

function StatCard({ label, value, icon, color = 'blue' }) {
  const iconColors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-500">{label}</span>
        {icon && (
          <span className={`p-2 rounded-xl ${iconColors[color] || 'bg-slate-100 text-slate-600'}`}>
            <Icon name={icon} className="w-4 h-4" />
          </span>
        )}
      </div>
      <p className="text-3xl font-extrabold text-slate-900">{value}</p>
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
        .map(([status, count]) => ({ name: status.replace('_', ' '), value: count }))
    : [];

  return (
    <Layout>
      <div className="px-6 sm:px-10 py-10 max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1.5">
            Knowledge Base Analytics
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Track reader engagements, search frequency, satisfaction ratings, and publishing velocity.
          </p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white border border-slate-200 rounded-2xl p-6 h-32" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-base text-red-700 bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 font-medium">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <StatCard label="Published Articles" value={data.published_count} icon="articles" color="emerald" />
              <StatCard label="Pending Review" value={data.pending_review_count} icon="inbox" color="amber" />
              <StatCard label="Total Views" value={data.total_views.toLocaleString()} icon="activity" color="blue" />
              <StatCard
                label="Average Reader Rating"
                value={data.rating_count > 0 ? `${data.average_rating} ★` : '—'}
                icon="star"
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
                <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Icon name="activity" className="w-4 h-4 text-blue-600" />
                  Top Viewed SOPs & Protocols
                </h2>
                {data.top_articles.length === 0 ? (
                  <p className="text-sm text-slate-400">No published articles yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.top_articles} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" allowDecimals={false} stroke="#94a3b8" />
                      <YAxis
                        type="category"
                        dataKey="title"
                        width={160}
                        tick={{ fontSize: 12, fill: '#334155' }}
                        tickFormatter={(t) => (t.length > 20 ? t.slice(0, 20) + '…' : t)}
                      />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                      <Bar dataKey="views" fill="#2563eb" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
                <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Icon name="articles" className="w-4 h-4 text-emerald-600" />
                  Article Status Distribution
                </h2>
                {pieData.length === 0 ? (
                  <p className="text-sm text-slate-400">No articles yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name.toLowerCase().replace(' ', '_')] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Icon name="search" className="w-4 h-4 text-purple-600" />
                Staff Search Inquiries (Last 7 Days)
              </h2>
              <p className="text-4xl font-extrabold text-slate-900 mb-1">
                {data.searches_this_week}
              </p>
              <p className="text-sm text-slate-500">Searches executed across all clinical topics</p>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}