import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listArticles } from '../api/articles';
import { useAuth } from '../context/useAuth';
import Layout from '../components/Layout';
import Icon from '../components/icons';

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  under_review: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  published: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  archived: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
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

function ArticleCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-xs animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-6 bg-slate-200 rounded-lg w-3/4" />
        <div className="h-5 bg-slate-200 rounded-full w-20" />
      </div>
      <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
      <div className="h-4 bg-slate-100 rounded w-24" />
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
  const [filterText, setFilterText] = useState('');

  const { user } = useAuth();
  const canCreate = user && user.role === 'editor';

  useEffect(() => {
    setLoading(true);
    setError(null);
    listArticles({ tag: tagFilter, status: statusFilter })
      .then(setArticles)
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to load articles');
      })
      .finally(() => setLoading(false));
  }, [tagFilter, statusFilter]);

  const filteredArticles = useMemo(() => {
    if (!filterText.trim()) return articles;
    const lower = filterText.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(lower) ||
        (a.status && a.status.toLowerCase().includes(lower))
    );
  }, [articles, filterText]);

  const published = articles.filter((a) => a.status === 'published').length;
  const drafts = articles.filter((a) => a.status === 'draft').length;
  const inReview = articles.filter((a) => a.status === 'under_review').length;
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

  return (
    <Layout>
      <div className="px-6 sm:px-10 py-10 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1.5">
              Articles Hub
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Explore clinical operating procedures, system guides, and clinical manuals.
            </p>
          </div>

          {canCreate && (
            <Link
              to="/articles/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white text-base font-bold rounded-xl px-6 py-3 hover:bg-blue-700 transition shadow-sm hover:shadow-md flex-shrink-0"
            >
              <Icon name="plus" className="w-5 h-5" />
              New Article
            </Link>
          )}
        </div>

        {/* Filter Badges */}
        {(tagFilter || statusFilter) && (
          <div className="mb-6 flex flex-wrap items-center gap-2.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4">
            <span className="text-sm font-semibold text-blue-950">Active Filter:</span>
            <span className="text-sm font-bold bg-white text-blue-700 px-3.5 py-1 rounded-xl shadow-2xs border border-blue-200">
              {tagFilter ? `Tag: #${tagFilter}` : `Status: ${statusFilter.replace('_', ' ')}`}
            </span>
            <Link
              to="/articles"
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 ml-2"
            >
              Clear filter
            </Link>
          </div>
        )}

        {/* Overview Stats */}
        {!loading && !error && articles.length > 0 && !tagFilter && !statusFilter && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
            <StatCard label="Published" value={published} icon="articles" color="emerald" />
            <StatCard label="In Review" value={inReview} icon="inbox" color="amber" />
            <StatCard label="Drafts" value={drafts} icon="clipboard" color="blue" />
            <StatCard label="Total Views" value={totalViews.toLocaleString()} icon="activity" color="purple" />
          </div>
        )}

        {/* In-page Search / Filter Bar */}
        {articles.length > 0 && (
          <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Icon
                name="search"
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              />
              <input
                type="search"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter articles in this list…"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
              />
            </div>
            <div className="text-sm font-medium text-slate-500">
              Showing <span className="font-bold text-slate-900">{filteredArticles.length}</span> of {articles.length} articles
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-base text-red-700 bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 font-medium">
            {error}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <ArticleCardSkeleton key={n} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredArticles.length === 0 && (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Icon name="articles" className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Articles Found</h3>
            <p className="text-base text-slate-500 max-w-md mx-auto mb-6">
              {filterText ? `No articles matching "${filterText}".` : 'There are currently no articles in this section.'}
            </p>
            {canCreate && !filterText && (
              <Link
                to="/articles/new"
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold rounded-xl px-5 py-2.5 hover:bg-blue-700 transition"
              >
                <Icon name="plus" className="w-4 h-4" /> Create First Article
              </Link>
            )}
          </div>
        )}

        {/* Articles Grid */}
        {!loading && !error && filteredArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.id}`}
                className="group flex flex-col justify-between bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-150"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {article.title}
                    </h3>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider whitespace-nowrap flex-shrink-0 ${
                        STATUS_STYLES[article.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {article.status ? article.status.replace('_', ' ') : 'Draft'}
                    </span>
                  </div>

                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {article.tags.slice(0, 3).map((tag, idx) => {
                        const tagName = typeof tag === 'string' ? tag : tag.name;
                        return (
                          <span
                            key={idx}
                            className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                          >
                            #{tagName}
                          </span>
                        );
                      })}
                      {article.tags.length > 3 && (
                        <span className="text-[11px] text-slate-400 font-medium self-center">
                          +{article.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-4 mt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Icon name="activity" className="w-4 h-4 text-slate-400" />
                    <span>{article.views || 0} views</span>
                  </div>
                  <span className="font-semibold text-blue-600 group-hover:underline">
                    Read Article →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}