import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listArticles } from '../api/articles';
import { useAuth } from '../context/useAuth';
import Layout from '../components/Layout';
import Icon from '../components/icons';

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  under_review: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  published: 'bg-green-100 text-green-700 ring-1 ring-green-200',
  archived: 'bg-red-100 text-red-700 ring-1 ring-red-200',
};

function StatCard({ label, value }) {
  return (
    <div className="bg-slate-100 border border-slate-200 rounded-xl px-6 py-6 shadow-md">
      <p className="text-base text-slate-500 mb-1">{label}</p>
      <p className="text-4xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function ArticleList() {
  const [searchParams] = useSearchParams();
  const tagFilter = searchParams.get('tag');
  const statusFilter = searchParams.get('status');

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const canCreate = user && user.role === 'editor';

  useEffect(() => {
    setLoading(true);
    listArticles({ tag: tagFilter, status: statusFilter })
      .then(setArticles)
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to load articles');
      })
      .finally(() => setLoading(false));
  }, [tagFilter, statusFilter]);

  const published = articles.filter((a) => a.status === 'published').length;
  const drafts = articles.filter((a) => a.status === 'draft').length;
  const inReview = articles.filter((a) => a.status === 'under_review').length;
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

  return (
    <Layout>
      <div className="px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">Articles</h1>
            <p className="text-lg text-slate-600 leading-relaxed">Browse and manage knowledge base content</p>
          </div>

          {canCreate && (
            <Link
              to="/articles/new"
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-base font-medium rounded-xl px-6 py-3 hover:bg-blue-700 transition shadow-md"
            >
              <Icon name="plus" className="w-4 h-4" />
              New Article
            </Link>
          )}
        </div>

        {(tagFilter || statusFilter) && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">Filtered by:</span>
            <span className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
              {tagFilter ? `Tag: ${tagFilter}` : `Status: ${statusFilter}`}
            </span>
            <Link to="/articles" className="text-sm text-blue-600 hover:text-blue-800 underline">
              Clear
            </Link>
          </div>
        )}

        {!loading && !error && articles.length > 0 && !tagFilter && !statusFilter && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
            <StatCard label="Published" value={published} />
            <StatCard label="Drafts" value={drafts} />
            <StatCard label="In review" value={inReview} />
            <StatCard label="Total views" value={totalViews} />
          </div>
        )}

        {loading && <p className="text-lg text-slate-600 leading-relaxed">Loading…</p>}

        {error && (
          <div className="text-base text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
            {error}
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-16 bg-slate-100 border border-dashed border-slate-300 rounded-xl">
            <p className="text-lg text-slate-600 leading-relaxed">No articles yet.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/articles/${article.id}`}
              className="group block bg-slate-100 border border-slate-200 rounded-3xl p-8 shadow-md hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-150"
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <h3 className="font-semibold text-xl text-slate-900 group-hover:text-blue-700 transition-colors">
                  {article.title}
                </h3>
                <span
                  className={`text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                    STATUS_STYLES[article.status] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {article.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-base text-slate-500">
                <Icon name="activity" className="w-4 h-4" />
                {article.views} views
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}