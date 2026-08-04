import { useEffect, useRef, useState } from 'react';
import { sendChatMessage, getChatHistory, rateChatMessage } from '../api/chat';
import { useAuth } from '../context/useAuth';
import Icon from '../components/icons';

function getOrCreateSessionId(userEmail) {
  if (userEmail) {
    return `user-${userEmail}`;
  }
  const key = 'chat_session_guest';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

export default function ChatWidget() {
  const { user } = useAuth();
  const isGuest = !user;

  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState(() => getOrCreateSessionId(user?.email));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    setSessionId(getOrCreateSessionId(user?.email));
    setMessages([]);
    setLoadedOnce(false);
  }, [user?.email]);

  useEffect(() => {
    if (!open || loadedOnce || isGuest) {
      if (isGuest) setLoadedOnce(true);
      return;
    }
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getChatHistory(sessionId);
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
  }, [open, loadedOnce, sessionId, isGuest]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  function handleNewConversation() {
    const freshId = `user-${user?.email || 'guest'}-${Date.now()}`;
    setSessionId(freshId);
    if (user?.email) {
      sessionStorage.setItem(`chat_session_${user.email}`, freshId);
    }
    setMessages([]);
    setLoadedOnce(true);
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
      { id: `temp-${Date.now()}`, sender: 'dashboard_user', message: userMessage, timestamp: new Date().toISOString() },
    ]);

    try {
      const res = await sendChatMessage(sessionId, userMessage);
      setMessages((prev) => [
        ...prev,
        {
          id: res.message_id ?? `bot-${Date.now()}`,
          sender: 'bot',
          message: res.reply,
          timestamp: new Date().toISOString(),
          helpful: null,
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleThumb(messageId, helpful) {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, helpful } : m))
    );
    try {
      await rateChatMessage(messageId, helpful);
    } catch {
      // best-effort
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col overflow-hidden">
          <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
            <div>
              <span className="font-medium text-sm block">KB Assistant</span>
              <span className="text-xs text-blue-100">
                {isGuest ? "You're chatting as a guest" : 'Welcome back — continuing your conversation'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isGuest && (
                <button
                  onClick={handleNewConversation}
                  className="text-white/80 hover:text-white text-xs underline"
                >
                  New
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white text-lg leading-none"
                aria-label="Close chat"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 p-3 overflow-y-auto min-h-[320px] max-h-[400px] flex flex-col gap-2">
            {loading && <p className="text-slate-500 text-sm">Loading history…</p>}

            {!loading && messages.length === 0 && (
              <p className="text-slate-400 text-sm">
                Ask a question about the knowledge base to get started.
              </p>
            )}

            {messages.map((m) => {
              const isUser = m.sender !== 'bot';
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                      isUser ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {m.message}
                  </div>

                  {!isUser && (
                    <div className="flex gap-2 mt-1 px-1">
                      <button
                        onClick={() => handleThumb(m.id, true)}
                        className={`transition-colors ${
                          m.helpful === true ? 'text-green-600' : 'text-slate-400 hover:text-green-600'
                        }`}
                        aria-label="Helpful"
                      >
                        <Icon name="thumbsUp" className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleThumb(m.id, false)}
                        className={`transition-colors ${
                          m.helpful === false ? 'text-red-600' : 'text-slate-400 hover:text-red-600'
                        }`}
                        aria-label="Not helpful"
                      >
                        <Icon name="thumbsDown" className="w-4 h-4" />
                      </button>
                    </div>
                  )}
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
              id="chat-message"
              name="chat-message"
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