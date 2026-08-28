import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import Icon from './icons';

const SUGGESTED_PROMPTS = [
  {
    icon: 'document',
    title: 'HMIS Claims & Exports',
    prompt: 'How do I submit and troubleshoot HMIS data exports?',
  },
  {
    icon: 'shield',
    title: 'Roles & Permissions',
    prompt: 'What are the different user roles and their permission levels?',
  },
  {
    icon: 'users',
    title: 'Password & User Management',
    prompt: 'How can an administrator reset user passwords and invite new staff?',
  },
  {
    icon: 'chart',
    title: 'Analytics & Reports',
    prompt: 'Where can I see article ratings, search queries, and usage analytics?',
  },
];

export default function ChatHistory({
  messages,
  loading,
  sending,
  bottomRef,
  onThumbClick,
  onRetry,
  onSelectPrompt,
  isExpanded,
  userName,
}) {
  return (
    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3.5 bg-slate-50/40">
      {loading && (
        <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
          <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Loading conversation history…</p>
        </div>
      )}

      {!loading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center my-auto py-6 text-center max-w-lg mx-auto">
          <div className="relative mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Icon name="bot" className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>

          <h3 className="text-base font-bold text-slate-800 tracking-tight">
            {userName ? `Hi, ${userName}!` : 'Hello there!'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
            I am your HealthTech Knowledge Assistant. Ask anything about clinical protocols, HMIS, or platform workflows.
          </p>

          {/* Quick Prompt Cards */}
          <div className="w-full mt-5">
            <div className="flex items-center justify-center gap-1.5 mb-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <Icon name="sparkles" className="w-3.5 h-3.5 text-blue-500" />
              <span>Suggested Questions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left w-full">
              {SUGGESTED_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectPrompt(item.prompt)}
                  className="group flex items-start gap-2.5 p-2.5 bg-white hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-300 rounded-xl transition-all shadow-2xs hover:shadow-xs text-left"
                >
                  <div className="p-1.5 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 rounded-lg transition-colors flex-shrink-0 mt-0.5">
                    <Icon name={item.icon} className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {item.prompt}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          onThumbClick={onThumbClick}
          onRetry={onRetry}
          isExpanded={isExpanded}
        />
      ))}

      {sending && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}