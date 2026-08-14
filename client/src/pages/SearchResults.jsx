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
      <div className="max-w-3xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Search results
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-8">
          {q ? (
            <>
              Showing results for <span className="font-medium text-slate-700">"{q}"</span>
            </>
          ) : (
            'Enter a search term above'
          )}
        </p>

        {loading && <p className="text-lg text-slate-600 leading-relaxed">Searching…</p>}

        {error && (
          <div className="text-base text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
            {error}
          </div>
        )}

        {!loading && !error && q.trim() && results.length === 0 && (
          <div className="bg-slate-100 border border-dashed border-slate-300 rounded-xl p-8 text-center">
            <p className="text-lg font-medium text-slate-700 mb-2">
              No results for "{q}"
            </p>
            <p className="text-base text-slate-500 mb-4">
              Try different or fewer keywords, or browse categories from the sidebar instead.
            </p>
            <Link
              to="/articles"
              className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:text-blue-800"
            >
              ← Browse all articles
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {results.map((r) => (
            <Link
              key={r.id}
              to={`/articles/${r.id}`}
              className="group block bg-slate-100 border border-slate-200 rounded-xl p-6 shadow-md hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-150"
            >
              <div className="flex justify-between items-start gap-4 mb-2">
                <h3 className="font-semibold text-lg text-slate-900 group-hover:text-blue-700 transition-colors">
                  {highlight(r.title, q)}
                </h3>
                <span
                  className={`text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${STATUS_STYLES[r.status] || 'bg-slate-100 text-slate-700'}`}
                >
                  {r.status}
                </span>
              </div>
              <p className="text-base text-slate-500 leading-relaxed">
                {highlight(r.snippet, q)}
              </p>
              <div className="flex items-center gap-1.5 text-sm text-slate-400 mt-3">
                <Icon name="activity" className="w-3.5 h-3.5" />
                {r.views} views
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}