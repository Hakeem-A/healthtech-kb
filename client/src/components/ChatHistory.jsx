import MessageBubble from './MessageBubble';
import Icon from './icons';

export default function ChatHistory({ messages, loading, bottomRef, onThumbClick, isExpanded }) {
  return (
    <div className="flex-1 p-4 overflow-y-auto min-h-[320px] max-h-[400px] flex flex-col gap-4">
      {loading && (
        <div className="flex justify-center items-center h-full">
          <p className="text-slate-500">Loading conversation...</p>
        </div>
      )}

      {!loading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Icon name="bot" className="w-16 h-16 text-slate-300 mb-4" />
          <h4 className="font-semibold text-slate-700">No messages yet</h4>
          <p className="text-slate-500 text-sm">
            Start the conversation by typing a message below.
          </p>
        </div>
      )}

      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} onThumbClick={onThumbClick} isExpanded={isExpanded} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}