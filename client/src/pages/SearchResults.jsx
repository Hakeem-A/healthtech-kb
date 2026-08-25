import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchArticles } from '../api/articles';
import Layout from '../components/Layout';
import Icon from '../components/icons';

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  under_review: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  published: 'bg-green-100 text-green-700 ring-1 ring-green-200',
  archived: 'bg-red-100 text-red-700 ring-1 ring-red-200',
};

function highlight(text, query) {
  if (!query.trim()) return text;
  const terms = query.trim().split(/\s+/).filter((t) => t.length > 1);
  if (terms.length === 0) return text;

  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, i) =>
    terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i} className="bg-yellow-200 text-slate-900 rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!q.trim()) {
        if (!ignore) {
          setResults([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await searchArticles(q);
        if (!ignore) setResults(data);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [q]);

  return (
    <Layout>
      <div className="px-6 sm:px-10 py-10 max-w-[1400px] mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1.5">
            Search Results
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            {q ? (
              <>
                Showing matching clinical articles for{' '}
                <span className="font-bold text-slate-900 bg-blue-50 text-blue-700 px-3 py-1 rounded-xl border border-blue-200 inline-block ml-1">
                  "{q}"
                </span>
              </>
            ) : (
              'Enter clinical keywords or article titles in the search bar above.'
            )}
          </p>
        </div>

        {loading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-slate-200 rounded-2xl p-7 h-32" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-base text-red-700 bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 font-medium">
            {error}
          </div>
        )}

        {!loading && !error && q.trim() && results.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Icon name="search" className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Matching Articles Found</h3>
            <p className="text-base text-slate-500 max-w-md mx-auto mb-6">
              We couldn't find any articles matching "{q}". Try searching for broader terms or browse clinical topics from the sidebar.
            </p>
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold text-sm rounded-xl px-5 py-2.5 hover:bg-blue-700 transition"
            >
              ← Browse All Articles
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {results.map((r) => (
            <Link
              key={r.id}
              to={`/articles/${r.id}`}
              className="group block bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-150"
            >
              <div className="flex justify-between items-start gap-4 mb-2">
                <h3 className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">
                  {highlight(r.title, q)}
                </h3>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider whitespace-nowrap flex-shrink-0 ${
                    STATUS_STYLES[r.status] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {r.status ? r.status.replace('_', ' ') : 'Draft'}
                </span>
              </div>
              <p className="text-base text-slate-600 leading-relaxed mb-4">
                {highlight(r.snippet, q)}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 font-medium">
                  <Icon name="activity" className="w-4 h-4 text-slate-400" />
                  <span>{r.views || 0} views</span>
                </div>
                <span className="font-bold text-blue-600 group-hover:underline">
                  Read Article →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}