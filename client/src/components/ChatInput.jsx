

export default function ChatInput({ input, setInput, handleSend, sending }) {
  return (
    <form onSubmit={handleSend} className="p-4 border-t border-slate-200 flex items-center gap-4 bg-white flex-shrink-0 mt-auto">
      <input
        id="chat-message"
        name="chat-message"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask a question…"
        className="flex-1 border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={sending || !input.trim()}
        className="bg-blue-600 text-white rounded-lg p-2.5 hover:bg-blue-700 disabled:opacity-50"
        aria-label="Send message"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </form>
  );
}