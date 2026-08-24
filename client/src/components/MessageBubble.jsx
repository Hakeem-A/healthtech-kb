import ArticleLink from './ArticleLink';
import Icon from './icons';

export default function MessageBubble({ message, onThumbClick, isExpanded }) {
  const { id, sender, message: text, helpful, primary_article, related_articles } = message;
  const isUser = sender !== 'bot';

  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`flex gap-3 items-end ${isUser ? 'flex-row-reverse' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
          } ${isExpanded ? 'md:max-w-2xl text-base' : 'max-w-[88%] text-sm'}`}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
        </div>

        {!isUser && (
          <div className="flex gap-1 mb-1 px-1 self-end items-center">
            <button
              onClick={() => onThumbClick(id, true)}
              className={`p-1.5 rounded-lg transition-all ${
                helpful === true
                  ? 'text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200'
                  : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
              }`}
              aria-label="Helpful"
              title="Helpful"
            >
              <Icon name="thumbsUp" className="w-4 h-4" />
            </button>
            <button
              onClick={() => onThumbClick(id, false)}
              className={`p-1.5 rounded-lg transition-all ${
                helpful === false
                  ? 'text-rose-600 bg-rose-50 ring-1 ring-rose-200'
                  : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
              }`}
              aria-label="Not helpful"
              title="Not helpful"
            >
              <Icon name="thumbsDown" className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {primary_article && (
        <div className={`w-full ${isExpanded ? 'md:max-w-2xl' : 'max-w-[88%]'} mt-1`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Source
          </p>
          <ArticleLink article={primary_article} variant={isExpanded ? 'card' : 'compact'} isExpanded={isExpanded} />
        </div>
      )}

      {related_articles && related_articles.length > 0 && (
        <div className={`w-full ${isExpanded ? 'md:max-w-2xl' : 'max-w-[88%]'} flex flex-col gap-2 mt-2`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Related Articles
          </p>
          {related_articles.map((article) => (
            <ArticleLink
              key={article.id}
              article={article}
              variant={isExpanded ? 'card' : 'compact'}
              isExpanded={isExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}