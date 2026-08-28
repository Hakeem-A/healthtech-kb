import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ArticleLink from './ArticleLink';
import Icon from './icons';

function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const codeText = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative group my-2.5 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 text-slate-100">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 text-[11px] text-slate-400 font-mono border-b border-slate-700">
        <span>Code</span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 hover:text-white transition-colors"
          title="Copy code"
          aria-label="Copy code"
        >
          <Icon name={copied ? 'check' : 'copy'} className="w-3.5 h-3.5" />
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs font-mono leading-relaxed">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export default function MessageBubble({ message, onThumbClick, onRetry, isExpanded }) {
  const {
    id,
    sender,
    message: text,
    helpful,
    primary_article,
    related_articles,
    timestamp,
    error,
    isFailed,
  } = message;

  const isUser = sender === 'user' || sender === 'dashboard_user' || sender === 'hmis_widget';
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy message failed:', err);
    }
  };

  const formattedTime = formatTimestamp(timestamp);

  return (
    <div
      className={`group flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
    >
      <div
        className={`flex items-end gap-2.5 max-w-full ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Avatar */}
        {!isUser ? (
          <div
            className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mb-1"
            title="HealthTech Assistant"
          >
            <Icon name="bot" className="w-4 h-4" />
          </div>
        ) : (
          <div
            className="w-7 h-7 rounded-xl bg-slate-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm mb-1"
            title="You"
          >
            <Icon name="user" className="w-4 h-4" />
          </div>
        )}

        {/* Message Container */}
        <div
          className={`relative rounded-2xl px-4 py-3 shadow-xs transition-all ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-xs selection:bg-blue-800'
              : error || isFailed
              ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-bl-xs'
              : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
          } ${
            isExpanded ? 'md:max-w-2xl text-[15px]' : 'max-w-[85%] text-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed break-words">{text}</p>
          ) : (
            <div className="chat-markdown prose-chat break-words leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-800">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 mb-2.5 space-y-1 text-slate-800">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 mb-2.5 space-y-1 text-slate-800">{children}</ol>
                  ),
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  strong: ({ children }) => (
                    <strong className="font-bold text-slate-900">{children}</strong>
                  ),
                  em: ({ children }) => <em className="italic text-slate-800">{children}</em>,
                  h1: ({ children }) => (
                    <h1 className="text-base font-bold text-slate-900 mt-3 mb-1.5">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-sm font-bold text-slate-900 mt-2.5 mb-1">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xs font-bold text-slate-700 mt-2 mb-1 uppercase tracking-wider">
                      {children}
                    </h3>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-3 border-blue-500 pl-3 my-2 text-slate-600 bg-blue-50/60 py-1.5 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  code: ({ inline, className, children, ...props }) => {
                    if (inline) {
                      return (
                        <code
                          className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded text-[12px] font-mono border border-slate-200"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return <CodeBlock className={className}>{children}</CodeBlock>;
                  },
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline font-medium inline-flex items-center gap-1"
                    >
                      {children}
                      <Icon name="externalLink" className="w-3 h-3 inline" />
                    </a>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-2.5 border border-slate-200 rounded-xl shadow-xs">
                      <table className="min-w-full text-xs divide-y divide-slate-200">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 bg-slate-50 text-left font-semibold text-slate-700">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-1.5 border-t border-slate-100 text-slate-600">
                      {children}
                    </td>
                  ),
                }}
              >
                {text}
              </ReactMarkdown>
            </div>
          )}

          {/* Failure / Retry prompt if failed */}
          {(error || isFailed) && onRetry && (
            <div className="mt-2 pt-2 border-t border-rose-200/80 flex items-center justify-between gap-2">
              <span className="text-xs text-rose-700 font-medium">Failed to receive response.</span>
              <button
                type="button"
                onClick={() => onRetry(message)}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 shadow-xs"
              >
                <Icon name="refresh" className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer (Timestamps, Copy, Feedback) */}
      <div
        className={`flex items-center gap-2 px-1 text-[11px] text-slate-400 ${
          isUser ? 'mr-9 flex-row-reverse' : 'ml-9 flex-row'
        }`}
      >
        {formattedTime && <span>{formattedTime}</span>}

        {!isUser && !error && !isFailed && (
          <div className="flex items-center gap-1 ml-1 opacity-80 group-hover:opacity-100 transition-opacity">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyMessage}
              className={`p-1 rounded-md transition-colors flex items-center gap-1 ${
                copied
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={copied ? 'Copied to clipboard' : 'Copy message'}
              aria-label="Copy message"
            >
              <Icon name={copied ? 'check' : 'copy'} className="w-3.5 h-3.5" />
              {copied && <span className="text-[10px] font-medium">Copied</span>}
            </button>

            {/* Thumbs Up */}
            <button
              type="button"
              onClick={() => onThumbClick && onThumbClick(id, true)}
              className={`p-1 rounded-md transition-all ${
                helpful === true
                  ? 'text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200'
                  : 'hover:text-emerald-600 hover:bg-slate-100'
              }`}
              aria-label="Helpful"
              title="Helpful response"
            >
              <Icon name="thumbsUp" className="w-3.5 h-3.5" />
            </button>

            {/* Thumbs Down */}
            <button
              type="button"
              onClick={() => onThumbClick && onThumbClick(id, false)}
              className={`p-1 rounded-md transition-all ${
                helpful === false
                  ? 'text-rose-600 bg-rose-50 ring-1 ring-rose-200'
                  : 'hover:text-rose-600 hover:bg-slate-100'
              }`}
              aria-label="Not helpful"
              title="Not helpful response"
            >
              <Icon name="thumbsDown" className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Primary Source Citation */}
      {primary_article && (
        <div
          className={`w-full ${
            isExpanded ? 'md:max-w-2xl' : 'max-w-[88%]'
          } ml-9 mt-1 pr-4`}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Primary Verified Source
            </p>
          </div>
          <ArticleLink
            article={primary_article}
            variant={isExpanded ? 'card' : 'compact'}
            isExpanded={isExpanded}
          />
        </div>
      )}

      {/* Related Articles Citation */}
      {related_articles && related_articles.length > 0 && (
        <div
          className={`w-full ${
            isExpanded ? 'md:max-w-2xl' : 'max-w-[88%]'
          } ml-9 flex flex-col gap-2 mt-1 pr-4`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Related Knowledge Base Guides
            </p>
          </div>
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