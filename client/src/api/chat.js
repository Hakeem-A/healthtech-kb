import { api } from './client';

export function sendChatMessage(sessionId, message) {
  return api.post('/chat/', { session_id: sessionId, message });
}

export function getChatHistory(sessionId) {
  return api.get(`/chat/history?session_id=${encodeURIComponent(sessionId)}`);
}