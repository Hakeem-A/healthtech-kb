import { useEffect, useRef, useState } from 'react';
import { sendChatMessage, getChatHistory, rateChatMessage } from '../api/chat';
import { useAuth } from '../context/useAuth';
import ChatHeader from './ChatHeader';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import { Transition } from '@headlessui/react';
import Icon from './icons';


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
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem('chat_expanded') === 'true';
  });
  const bottomRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('chat_expanded', isExpanded);
  }, [isExpanded]);

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
    setMessages([]);
    setLoadedOnce(true); // Don't try to load history for a new conversation
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      message: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const history = messages.slice(-5).map((msg) => ({
      sender: msg.sender === 'dashboard_user' ? 'user' : msg.sender,
      message: msg.message,
      timestamp: msg.timestamp,
    }));

    setInput('');
    setError(null);
    setSending(true);
    setMessages((prev) => [...prev, userMessage]);

    try {
      const data = await sendChatMessage({
        session_id: sessionId,
        message: userMessage.message,
        widget_source: window.location.href,
        history,
      });

      const botMessage = {
        id: data.message_id ?? `bot-${Date.now()}`,
        sender: 'bot',
        message: data.reply,
        primary_article: data.primary_article,
        related_articles: data.related_articles,
        timestamp: new Date().toISOString(),
        helpful: null,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
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
    <div className="fixed bottom-4 right-4 z-50">
      <Transition
        show={open}
        enter="transition-transform transition-opacity ease-out duration-300"
        enterFrom="opacity-0 translate-y-4"
        enterTo="opacity-100 translate-y-0"
        leave="transition-transform transition-opacity ease-in duration-200"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-4"
      >
        <div
          className={`mb-2 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded
              ? 'w-[min(900px,90vw)] h-[85vh] md:w-[850px] md:h-[820px]'
              : 'w-[450px] h-[680px]'
          }`}
        >
          <header className="bg-slate-800 text-white p-4 flex justify-between items-center flex-shrink-0 border-b border-slate-700">
            <div className="flex items-center gap-4">
              <Icon name="logo" className="w-8 h-8" />
              <div>
                <h1 className="text-lg font-bold">HealthTech Assistant</h1>
                {isGuest && (
                  <p className="text-xs text-slate-300">Sign in to save your chat history</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewConversation}
                className="p-2 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                aria-label="New Conversation"
              >
                <Icon name="plus" className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
                aria-expanded={isExpanded}
              >
                <Icon name={isExpanded ? 'arrowsPointingIn' : 'arrowsPointingOut'} className="w-5 h-5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                aria-label="Close"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
          </header>

          <ChatHistory
            messages={messages}
            loading={loading}
            bottomRef={bottomRef}
            onThumbClick={handleThumb}
            isExpanded={isExpanded}
          />

          {sending && <TypingIndicator />}

          {error && (
            <div className="mx-4 mb-4 text-xs text-red-700 bg-red-100 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <ChatInput
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            sending={sending}
          />
        </div>
      </Transition>

      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 shadow-lg flex items-center justify-center text-3xl"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  );
}