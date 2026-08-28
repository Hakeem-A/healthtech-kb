import { useEffect, useRef, useState, useCallback } from 'react';
import { sendChatMessage, getChatHistory, rateChatMessage } from '../api/chat';
import { useAuth } from '../context/useAuth';
import ChatHeader from './ChatHeader';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
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
  const [toast, setToast] = useState(null);
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem('chat_expanded') === 'true';
  });

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  useEffect(() => {
    localStorage.setItem('chat_expanded', isExpanded);
  }, [isExpanded]);

  // Handle escape key to close widget
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Auto focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [open]);

  const [prevUserEmail, setPrevUserEmail] = useState(user?.email);
  if (prevUserEmail !== user?.email) {
    setPrevUserEmail(user?.email);
    setSessionId(getOrCreateSessionId(user?.email));
    setMessages([]);
    setLoadedOnce(false);
  }

  // Load chat history
  useEffect(() => {
    if (!open || loadedOnce || isGuest) {
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
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, sending, open]);

  function handleNewConversation() {
    const freshId = `user-${user?.email || 'guest'}-${Date.now()}`;
    setSessionId(freshId);
    setMessages([]);
    setLoadedOnce(true);
    setError(null);
    showToast('Started new conversation');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleClearMessages() {
    setMessages([]);
    setError(null);
    showToast('Conversation cleared');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleExportChat() {
    if (messages.length === 0) return;

    let transcript = `# HealthTech Assistant Conversation\nDate: ${new Date().toLocaleString()}\nSession: ${sessionId}\n\n`;
    messages.forEach((m) => {
      const role = m.sender === 'bot' ? 'HealthTech Assistant' : 'User';
      const time = m.timestamp ? ` [${new Date(m.timestamp).toLocaleTimeString()}]` : '';
      transcript += `### ${role}${time}\n${m.message}\n\n`;
      if (m.primary_article) {
        transcript += `> **Source**: [${m.primary_article.title}](/articles/${m.primary_article.id})\n\n`;
      }
    });

    const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `healthtech-chat-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Transcript downloaded');
  }

  const executeSend = async (messageText) => {
    if (!messageText.trim() || sending) return;

    const userMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      message: messageText.trim(),
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
      setError(err.message || 'Failed to generate response. Please check connection and try again.');
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, isFailed: true } : msg
        )
      );
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  async function handleSend(e) {
    if (e && e.preventDefault) e.preventDefault();
    await executeSend(input);
  }

  async function handleSelectPrompt(promptText) {
    await executeSend(promptText);
  }

  async function handleRetry(failedMessage) {
    if (!failedMessage || !failedMessage.message) return;
    // Remove the failed flag and re-send
    setMessages((prev) => prev.filter((msg) => msg.id !== failedMessage.id));
    await executeSend(failedMessage.message);
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

    try {
      const feedbackCache = JSON.parse(localStorage.getItem('chat_feedback_cache') || '{}');
      if (targetHelpful === null) {
        delete feedbackCache[messageId];
      } else {
        feedbackCache[messageId] = targetHelpful;
      }
      localStorage.setItem('chat_feedback_cache', JSON.stringify(feedbackCache));

      if (
        typeof messageId === 'number' ||
        (!String(messageId).startsWith('temp-') && !String(messageId).startsWith('bot-'))
      ) {
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
        enterFrom="opacity-0 translate-y-4 scale-95"
        enterTo="opacity-100 translate-y-0 scale-100"
        leave="transition-transform transition-opacity ease-in duration-200"
        leaveFrom="opacity-100 translate-y-0 scale-100"
        leaveTo="opacity-0 translate-y-4 scale-95"
      >
        <div
          role="dialog"
          aria-label="HealthTech Assistant Chat"
          className={`mb-3 bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/90 transition-all duration-300 ease-in-out relative ${
            isExpanded
              ? 'w-[min(760px,94vw)] h-[640px] max-h-[85vh]'
              : 'w-[380px] sm:w-[410px] h-[540px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)]'
          }`}
        >
          {/* Toast alert banner */}
          {toast && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 text-white text-xs font-medium px-3.5 py-1.5 rounded-full shadow-lg border border-slate-700 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <Icon name="check" className="w-3.5 h-3.5 text-emerald-400" />
              <span>{toast}</span>
            </div>
          )}

          {/* Header */}
          <ChatHeader
            isGuest={isGuest}
            userName={user?.name || user?.email?.split('@')[0]}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
            onNewChat={handleNewConversation}
            onClearChat={handleClearMessages}
            onExportChat={handleExportChat}
            onClose={() => setOpen(false)}
            hasMessages={messages.length > 0}
          />

          {/* Message Stream */}
          <ChatHistory
            messages={messages}
            loading={loading}
            sending={sending}
            bottomRef={bottomRef}
            onThumbClick={handleThumb}
            onRetry={handleRetry}
            onSelectPrompt={handleSelectPrompt}
            isExpanded={isExpanded}
            userName={user?.name || user?.email?.split('@')[0]}
          />

          {/* Inline Error Notice */}
          {error && (
            <div className="mx-3.5 mb-2 text-xs text-rose-700 bg-rose-50/90 border border-rose-200 rounded-xl p-2.5 flex items-center justify-between gap-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <Icon name="alertTriangle" className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span className="leading-tight">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-500 hover:text-rose-800 p-1"
                aria-label="Dismiss error"
              >
                <Icon name="close" className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <ChatInput
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            sending={sending}
            inputRef={inputRef}
          />
        </div>
      </Transition>

      {/* Floating launcher trigger */}
      <div className="relative group flex items-center justify-end">
        {!open && (
          <div className="hidden sm:flex absolute right-16 bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-xl shadow-md whitespace-nowrap items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none transform translate-x-1 group-hover:translate-x-0 border border-slate-700">
            <Icon name="sparkles" className="w-3.5 h-3.5 text-blue-400" />
            <span>Ask HealthTech AI</span>
          </div>
        )}

        <button
          onClick={() => setOpen((o) => !o)}
          className={`text-white rounded-2xl w-14 h-14 shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
            open
              ? 'bg-slate-800 hover:bg-slate-700 shadow-slate-900/30'
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 ring-4 ring-blue-500/10'
          }`}
          aria-label={open ? 'Close knowledge assistant' : 'Open knowledge assistant'}
          title={open ? 'Close chat' : 'Open HealthTech Assistant'}
        >
          {open ? (
            <Icon name="close" className="w-5 h-5" />
          ) : (
            <div className="relative">
              <Icon name="bot" className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-blue-600"></span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}