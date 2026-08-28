import { Link } from 'react-router-dom';
import Icon from './icons';

export default function ArticleLink({ article, variant = 'compact', isExpanded }) {
  if (!article) return null;

  const finalVariant = isExpanded ? 'card' : variant;

  if (finalVariant === 'card') {
    return (
      <Link
        to={`/articles/${article.id}`}
        className="group block bg-white hover:bg-blue-50/40 rounded-xl shadow-xs hover:shadow-md border border-slate-200 hover:border-blue-300 transition-all p-3.5"
      >
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0 mt-0.5">
            <Icon name="document" className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className={`font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate ${
                isExpanded ? 'text-[15px]' : 'text-sm'
              }`}
            >
              {article.title}
            </h4>

            {article.snippet && (
              <p
                className={`mt-1 text-slate-600 text-xs leading-relaxed ${
                  isExpanded ? 'line-clamp-3' : 'line-clamp-2'
                }`}
              >
                {article.snippet}
              </p>
            )}

            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-xs">
              <span className="font-semibold text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
                <span>Read Full Article</span>
                <Icon name="arrowRight" className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
              {article.updated_at && (
                <span className="text-[11px] text-slate-400">
                  {new Date(article.updated_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Compact variant
  return (
    <Link
      to={`/articles/${article.id}`}
      className="group inline-flex items-center gap-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors text-xs font-medium max-w-full truncate"
    >
      <Icon name="document" className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
      <span className="truncate">{article.title}</span>
      <Icon name="arrowRight" className="w-3 h-3 text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
    </Link>
  );
}