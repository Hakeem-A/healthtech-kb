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
        <div className="mb-2 w-96 bg-slate-100 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <ChatHeader
            isGuest={isGuest}
            onNewConversation={handleNewConversation}
            onClose={() => setOpen(false)}
          />

          <ChatHistory messages={messages} loading={loading} bottomRef={bottomRef} onThumbClick={handleThumb} />

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