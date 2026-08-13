
export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
    </div>
  );
}