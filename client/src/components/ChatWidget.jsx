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
        const feedbackCache = JSON.parse(localStorage.getItem('chat_feedback_cache') || '{}');
        const mergedMessages = (data.messages || []).map((m) => {
          if (m.helpful !== null && m.helpful !== undefined) return m;
          if (feedbackCache[m.id] !== undefined) {
            return { ...m, helpful: feedbackCache[m.id] };
          }
          return m;
        });
        if (!ignore) setMessages(mergedMessages);
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
    if (!messageId) return;

    let targetHelpful = helpful;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          targetHelpful = m.helpful === helpful ? null : helpful;
          return { ...m, helpful: targetHelpful };
        }
        return m;
      })
    );

    // Persist in localStorage cache
    try {
      const feedbackCache = JSON.parse(localStorage.getItem('chat_feedback_cache') || '{}');
      if (targetHelpful === null) {
        delete feedbackCache[messageId];
      } else {
        feedbackCache[messageId] = targetHelpful;
      }
      localStorage.setItem('chat_feedback_cache', JSON.stringify(feedbackCache));

      // Call backend API if it's a persisted message ID
      if (typeof messageId === 'number' || (!String(messageId).startsWith('temp-') && !String(messageId).startsWith('bot-'))) {
        await rateChatMessage(messageId, targetHelpful);
      }
    } catch (err) {
      console.warn('Feedback rating persistence error:', err);
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
          className={`mb-3 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 transition-all duration-300 ease-in-out ${
            isExpanded
              ? 'w-[min(720px,92vw)] h-[620px] max-h-[82vh]'
              : 'w-[370px] sm:w-[390px] h-[520px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)]'
          }`}
        >
          <header className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center flex-shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">
                <Icon name="message" className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">HealthTech Assistant</h1>
                {isGuest && (
                  <p className="text-[11px] text-slate-400">Guest Session</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewConversation}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                aria-label="New Conversation"
                title="New Conversation"
              >
                <Icon name="plus" className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
                aria-expanded={isExpanded}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <Icon name={isExpanded ? 'arrowsPointingIn' : 'arrowsPointingOut'} className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                aria-label="Close"
                title="Close"
              >
                <Icon name="close" className="w-4 h-4" />
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
            <div className="mx-4 mb-3 text-xs text-red-700 bg-red-100 border border-red-200 rounded-lg p-2.5">
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
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl w-14 h-14 shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-blue-500/20"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? <Icon name="close" className="w-5 h-5" /> : <Icon name="bot" className="w-6 h-6" />}
      </button>
    </div>
  );
}