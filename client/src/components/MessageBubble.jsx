import Icon from './icons';

export default function MessageBubble({ message, onThumbClick }) {
  const { id, sender, message: text, helpful } = message;
  const isUser = sender !== 'bot';

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
          <Icon name="bot" className="w-5 h-5 text-slate-500" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none'
        }`}
      >
        <p className="whitespace-pre-wrap">{text}</p>
      </div>

      {!isUser && (
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
  );
}