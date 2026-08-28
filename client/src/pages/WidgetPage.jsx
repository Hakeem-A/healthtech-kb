import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

const WIDGET_SUGGESTIONS = [
  'How do I submit an HMIS export batch?',
  'What are the mandatory patient data fields?',
  'How to troubleshoot clinical export sync errors?',
];

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
  const [copiedId, setCopiedId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open || loadedOnce || !apiKey) return;
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getWidgetHistory(apiKey, sessionId);
        if (!ignore) setMessages(data.messages || []);
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
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, sending, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const handleCopy = useCallback(async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  }, []);

  const executeSend = useCallback(async (messageText) => {
    if (!messageText.trim() || sending) return;

    const userMessage = messageText.trim();
    setInput('');
    setError(null);
    setSending(true);

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      sender: 'hmis_widget',
      message: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await sendWidgetMessage(apiKey, sessionId, userMessage);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          message: res.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to get reply. Please try again.');
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [apiKey, sessionId, sending]);

  const handleSend = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    await executeSend(input);
  }, [executeSend, input]);

  if (!apiKey) {
    return (
      <div className="p-6 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl m-4">
        Missing apiKey — embed this widget with <code className="font-bold">?apiKey=YOUR_KEY</code> in the URL.
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 font-sans z-50">
      {open && (
        <div className="mb-4 w-[380px] bg-white border border-slate-200/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold shadow-sm">
                <Icon name="bot" className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm leading-tight">Clinical Assistant</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-[10px] text-slate-400">HMIS Integrated Support</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              aria-label="Close chat"
              title="Close"
            >
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto min-h-[320px] max-h-[420px] flex flex-col gap-3 bg-slate-50/40">
            {loading && (
              <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading conversation history…</span>
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <Icon name="bot" className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-800 mb-0.5">How can I assist you today?</p>
                <p className="text-[11px] text-slate-500 mb-3">Ask about HMIS guidelines, dosages, or protocols.</p>

                <div className="flex flex-col gap-1.5 text-left mt-2">
                  {WIDGET_SUGGESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => executeSend(suggestion)}
                      className="text-left text-xs p-2 rounded-xl bg-white border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 hover:text-blue-600 transition shadow-2xs"
                    >
                      💡 {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const isUser = m.sender !== 'bot';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-xs font-medium'
                        : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{m.message}</p>
                    ) : (
                      <div className="prose-chat text-xs">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
                            li: ({ children }) => <li>{children}</li>,
                            strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                            code: ({ inline, children }) =>
                              inline ? (
                                <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-blue-700">
                                  {children}
                                </code>
                              ) : (
                                <pre className="bg-slate-900 text-slate-100 p-2 rounded-lg my-1.5 text-[11px] overflow-x-auto">
                                  <code>{children}</code>
                                </pre>
                              ),
                          }}
                        >
                          {m.message}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {!isUser && (
                    <div className="flex items-center gap-1 ml-1 text-[10px] text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleCopy(m.id, m.message)}
                        className="hover:text-slate-600 flex items-center gap-0.5 p-0.5"
                        title="Copy message"
                      >
                        <Icon name={copiedId === m.id ? 'check' : 'copy'} className="w-3 h-3 text-slate-400" />
                        <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {sending && (
              <div className="flex items-center gap-2 bg-white border border-slate-200/90 text-slate-500 text-xs px-3.5 py-2 rounded-2xl self-start shadow-2xs">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                </div>
                <span>Searching guidelines…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="mx-3.5 mb-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2 flex items-center justify-between">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
                <Icon name="close" className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSend} className="border-t border-slate-200/80 p-2.5 bg-white flex gap-2 items-center">
            <input
              ref={inputRef}
              id="widget-message"
              name="widget-message"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a clinical question…"
              disabled={sending}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl px-3.5 py-2 transition disabled:opacity-50 flex items-center gap-1 shadow-xs"
            >
              <span>Send</span>
              <Icon name="send" className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl w-14 h-14 shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95 shadow-blue-500/20"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? <Icon name="close" className="w-5 h-5" /> : <Icon name="message" className="w-6 h-6" />}
      </button>
    </div>
  );
}