import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sendWidgetMessage, getWidgetHistory } from '../api/widgetClient';
import Icon from '../components/icons';

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
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getWidgetHistory(apiKey, sessionId);
        if (!ignore) setMessages(data.messages);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) {
          setLoading(false);
          setLoadedOnce(true);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [open, loadedOnce, apiKey, sessionId]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  if (!apiKey) {
    return (
      <div className="p-6 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl m-4">
        Missing apiKey — embed this widget with <code className="font-bold">?apiKey=YOUR_KEY</code> in the URL.
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
    <div className="fixed bottom-6 right-6 font-sans z-50">
      {open && (
        <div className="mb-4 w-[370px] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold">H</span>
              <span className="font-bold text-sm">Clinical Assistant</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Close chat"
            >
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto min-h-[300px] max-h-[400px] flex flex-col gap-3 bg-slate-50/50">
            {loading && <p className="text-slate-400 text-xs text-center py-4">Loading conversation history…</p>}
            {!loading && messages.length === 0 && (
              <div className="text-center py-10">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                  <Icon name="bot" className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700 mb-1">How can I assist you today?</p>
                <p className="text-[11px] text-slate-400">Ask about HMIS guidelines, dosages, or protocols.</p>
              </div>
            )}
            {messages.map((m) => {
              const isUser = m.sender !== 'bot';
              return (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-2xs ${
                    isUser
                      ? 'bg-blue-600 text-white self-end rounded-br-xs font-medium'
                      : 'bg-white border border-slate-200/80 text-slate-800 self-start rounded-bl-xs'
                  }`}
                >
                  {m.message}
                </div>
              );
            })}
            {sending && (
              <div className="bg-white border border-slate-200/80 text-slate-400 text-xs px-4 py-2 rounded-2xl self-start">
                Thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mx-4 mb-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
              {error}
            </div>
          )}

          <form onSubmit={handleSend} className="border-t border-slate-100 p-3 bg-white flex gap-2">
            <input
              id="widget-message"
              name="widget-message"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a clinical question…"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl px-4 py-2 transition disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl w-14 h-14 shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? <Icon name="close" className="w-5 h-5" /> : <Icon name="message" className="w-6 h-6" />}
      </button>
    </div>
  );
}