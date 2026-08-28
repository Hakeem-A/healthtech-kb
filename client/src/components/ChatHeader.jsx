import Icon from './icons';

export default function ChatHeader({
  isGuest,
  userName,
  isExpanded,
  onToggleExpand,
  onNewChat,
  onClearChat,
  onExportChat,
  onClose,
  hasMessages,
}) {
  return (
    <header className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center flex-shrink-0 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Icon name="bot" className="w-4 h-4" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white leading-tight">HealthTech Assistant</h1>
            <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium rounded-md bg-blue-900/60 text-blue-300 border border-blue-700/50">
              AI Powered
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Online</span>
            <span className="text-slate-600">•</span>
            <span>{isGuest ? 'Guest Session' : (userName ? `User: ${userName}` : 'Authenticated')}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* New conversation */}
        <button
          type="button"
          onClick={onNewChat}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="New Conversation"
          title="Start new conversation"
        >
          <Icon name="plus" className="w-4 h-4" />
        </button>

        {/* Export / Download transcript */}
        {hasMessages && (
          <button
            type="button"
            onClick={onExportChat}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Export transcript"
            title="Download conversation transcript"
          >
            <Icon name="download" className="w-4 h-4" />
          </button>
        )}

        {/* Clear chat */}
        {hasMessages && (
          <button
            type="button"
            onClick={onClearChat}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-950/50 hover:text-rose-400 transition-colors"
            aria-label="Clear chat messages"
            title="Clear chat messages"
          >
            <Icon name="trash" className="w-4 h-4" />
          </button>
        )}

        {/* Expand / Collapse toggle */}
        <button
          type="button"
          onClick={onToggleExpand}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label={isExpanded ? 'Collapse chat view' : 'Expand chat view'}
          aria-expanded={isExpanded}
          title={isExpanded ? 'Collapse view' : 'Expand view'}
        >
          <Icon name={isExpanded ? 'arrowsPointingIn' : 'arrowsPointingOut'} className="w-4 h-4" />
        </button>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ml-0.5"
          aria-label="Close assistant"
          title="Close assistant (Esc)"
        >
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}