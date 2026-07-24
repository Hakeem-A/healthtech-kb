import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sendWidgetMessage, getWidgetHistory } from '../api/widgetClient';

function getOrCreateSessionId() {
  const key = 'kb_widget_session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `widget-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

export default function WidgetPage() {
  const [searchParams] = useSearchParams();
  const apiKey = searchParams.get('apiKey');

  const [open, setOpen] = useState(false);
  const [sessionId] = useState(getOrCreateSessionId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!open || loadedOnce || !apiKey) return;
    setLoading(true);
    getWidgetHistory(apiKey, sessionId)
      .then((data) => setMessages(data.messages))
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false);
        setLoadedOnce(true);
      });
  }, [open, loadedOnce, apiKey, sessionId]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  if (!apiKey) {
    return (
      <div className="p-4 text-sm text-red-600">
        Missing apiKey — embed this widget with ?apiKey=YOUR_KEY in the src URL.
      </div>
    );
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setSending(true);

    setMessages((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, sender: 'hmis_widget', message: userMessage, timestamp: new Date().toISOString() },
    ]);

    try {
      const res = await sendWidgetMessage(apiKey, sessionId, userMessage);
      setMessages((prev) => [
        ...prev,
        { id: `bot-${Date.now()}`, sender: 'bot', message: res.reply, timestamp: new Date().toISOString() },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4">
      {open && (
        <div className="mb-3 w-80 bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col overflow-hidden">
          <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
            <span className="font-medium text-sm">KB Assistant</span>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white text-lg leading-none"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto min-h-[300px] max-h-[380px] flex flex-col gap-2">
            {loading && <p className="text-slate-500 text-sm">Loading history…</p>}
            {!loading && messages.length === 0 && (
              <p className="text-slate-400 text-sm">Ask a question to get started.</p>
            )}
            {messages.map((m) => {
              const isUser = m.sender !== 'bot';
              return (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    isUser ? 'bg-blue-600 text-white self-end' : 'bg-slate-100 text-slate-800 self-start'
                  }`}
                >
                  {m.message}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mx-3 mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSend} className="border-t border-slate-200 p-2 flex gap-2">
            <input
              id="widget-message"
              name="widget-message"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-blue-600 text-white text-sm rounded px-3 py-1.5 hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? '…' : 'Send'}
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center text-2xl"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  );
}