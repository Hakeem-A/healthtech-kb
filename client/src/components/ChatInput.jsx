

import { useRef, useEffect } from 'react';
import Icon from './icons';

export default function ChatInput({ input, setInput, handleSend, sending, inputRef }) {
  const localRef = useRef(null);
  const activeRef = inputRef || localRef;

  // Auto-resize the textarea height based on content
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.style.height = 'auto';
      activeRef.current.style.height = `${Math.min(activeRef.current.scrollHeight, 120)}px`;
    }
  }, [input, activeRef]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !sending) {
        handleSend(e);
      }
    }
  };

  const handleClear = () => {
    setInput('');
    if (activeRef.current) {
      activeRef.current.focus();
    }
  };

  return (
    <form
      onSubmit={handleSend}
      className="p-3 border-t border-slate-200/90 bg-slate-50/50 flex-shrink-0 mt-auto"
    >
      <div className="relative flex items-end gap-2 bg-white border border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-2xl p-1.5 transition-all shadow-2xs">
        <textarea
          ref={activeRef}
          id="chat-message"
          name="chat-message"
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
          disabled={sending}
          className="flex-1 bg-transparent px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none max-h-32 min-h-[38px] leading-relaxed"
          aria-label="Chat question"
        />

        {/* Clear input button */}
        {input.trim().length > 0 && !sending && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors self-center mb-0.5"
            title="Clear text"
            aria-label="Clear input text"
          >
            <Icon name="close" className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Send Button */}
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl p-2.5 flex items-center justify-center transition-all duration-150 shadow-xs hover:shadow-sm disabled:cursor-not-allowed flex-shrink-0 mb-0.5"
          aria-label="Send message"
          title="Send message (Enter)"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Icon name="send" className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] text-slate-400">
        <span>Grounded in verified clinical & admin articles</span>
        <span className="hidden sm:inline">Press Enter ↵ to send</span>
      </div>
    </form>
  );
}