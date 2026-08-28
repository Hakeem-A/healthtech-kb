
import Icon from './icons';

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 my-1.5 animate-in fade-in duration-200">
      <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
        <Icon name="bot" className="w-4 h-4" />
      </div>
      <div className="bg-white border border-slate-200/90 rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 py-0.5">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
        </div>
        <span className="text-xs font-medium text-slate-500">Searching knowledge base…</span>
      </div>
    </div>
  );
}