import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="bg-white border border-slate-200 rounded-xl px-6 py-5 shadow-sm">
      <p className="text-base text-slate-500 mb-1">{label}</p>
      <p className="text-4xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const canCreate = user && user.role === 'editor';

  useEffect(() => {
    listArticles()
      .then(setArticles)
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to load articles');
      })
      .finally(() => setLoading(false));
  }, []);

  const published = articles.filter((a) => a.status === 'published').length;
  const drafts = articles.filter((a) => a.status === 'draft').length;
  const inReview = articles.filter((a) => a.status === 'under_review').length;
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

  return (
    <Layout>
      <div className="px-10 py-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Articles</h1>
            <p className="text-lg text-slate-500">Browse and manage knowledge base content</p>
          </div>

          {canCreate && (
            <Link
              to="/articles/new"
              className="flex items-center gap-1.5 bg-blue-600 text-white text-base font-medium rounded-lg px-5 py-3 hover:bg-blue-700 transition shadow-sm"
            >
              <Icon name="plus" className="w-4 h-4" />
              New Article
            </Link>
          )}
        </div>

        {!loading && !error && articles.length > 0 && (
          <div className="grid grid-cols-4 gap-5 mb-10">
            <StatCard label="Published" value={published} />
            <StatCard label="Drafts" value={drafts} />
            <StatCard label="In review" value={inReview} />
            <StatCard label="Total views" value={totalViews} />
          </div>
        )}

        {loading && <p className="text-lg text-slate-500">Loading…</p>}

        {error && (
          <div className="text-base text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
            {error}
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-xl">
            <p className="text-lg text-slate-500">No articles yet.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-5">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/articles/${article.id}`}
              className="group block bg-white border border-slate-200 rounded-xl p-7 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-150"
            >
              <div className="flex justify-between items-start gap-3 mb-3">
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