import { Link } from 'react-router-dom';
import Icon from './icons';

export default function ArticleLink({ article, variant = 'compact', isExpanded }) {
  if (!article) return null;

  // In expanded mode, always render the card variant for a richer experience.
  const finalVariant = isExpanded ? 'card' : variant;

  if (finalVariant === 'card') {
    return (
      <Link
        to={`/articles/${article.id}`}
        className="block bg-white hover:bg-slate-50 rounded-xl shadow-sm border-l-4 border-blue-500 transition-colors"
      >
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Icon name="document" className="w-5 h-5 text-slate-500 flex-shrink-0" />
            <h4 className={`font-semibold text-slate-800 truncate ${isExpanded ? 'text-base' : 'text-sm'}`}>{article.title}</h4>
          </div>
          {article.snippet && (
            <p className={`mt-2 text-slate-600 ${isExpanded ? 'text-sm line-clamp-3' : 'text-sm line-clamp-2'}`}>{article.snippet}</p>
          )}
          <div className="flex items-center justify-between mt-4">
            <div className={`font-semibold text-blue-600 hover:underline ${isExpanded ? 'text-sm' : 'text-sm'}`}>
              Read Article →
            </div>
            {article.updated_at && (
              <div className="text-xs text-slate-400">
                Updated {new Date(article.updated_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Compact variant
  return (
    <Link
      to={`/articles/${article.id}`}
      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
    >
      <Icon name="document" className="w-4 h-4" />
      <span>{article.title}</span>
    </Link>
  );
}