import ArticleLink from './ArticleLink';
import Icon from './icons';

export default function MessageBubble({ message, onThumbClick, isExpanded, showAvatar }) {
  const { id, sender, message: text, helpful, primary_article, related_articles } = message;
  const isUser = sender !== 'bot';

  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        {!isUser && (
          <div className="w-8 h-8 flex-shrink-0">
            {showAvatar && (
              <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center">
                <Icon name="bot" className="w-5 h-5 text-slate-500" />
              </div>
            )}
          </div>
        )}
        <div
          className={`rounded-xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
          } ${isExpanded ? 'md:max-w-2xl text-base' : 'max-w-[85%] text-sm'}`}
        >
          <p className="whitespace-pre-wrap">{text}</p>
        </div>

        {!isUser && helpful !== null && (
          <div className="flex gap-2 mt-1 px-1 self-center">
            <button
              onClick={() => onThumbClick(id, true)}
              className={`transition-colors ${
                helpful === true ? 'text-green-600' : 'text-slate-400 hover:text-green-600'
              }`}
              aria-label="Helpful"
            >
              <Icon name="thumbsUp" className="w-4 h-4" />
            </button>
            <button
              onClick={() => onThumbClick(id, false)}
              className={`transition-colors ${
                helpful === false ? 'text-red-600' : 'text-slate-400 hover:text-red-600'
              }`}
              aria-label="Not helpful"
            >
              <Icon name="thumbsDown" className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {primary_article && (
        <div className={`w-full ${isExpanded ? 'md:max-w-2xl' : 'max-w-[85%]'} ml-11`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Source
          </p>
          <ArticleLink article={primary_article} variant={isExpanded ? 'card' : 'compact'} isExpanded={isExpanded} />
        </div>
      )}
      {related_articles && related_articles.length > 0 && (
        <div className={`w-full ${isExpanded ? 'md:max-w-2xl' : 'max-w-[85%]'} ml-11 flex flex-col gap-3 mt-4`}>
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