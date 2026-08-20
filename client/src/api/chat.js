import { api } from './client';

export function sendChatMessage(payload) {
  return api.post('/chat/', payload);
}

export function getChatHistory(sessionId) {
  return api.get(`/chat/history?session_id=${encodeURIComponent(sessionId)}`);
}
export function rateChatMessage(messageId, helpful) {
  return api.put(`/chat/messages/${messageId}/feedback`, { helpful });
}