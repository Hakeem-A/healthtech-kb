import { api } from './client';

export const getAuditLogs = async () => {
  const { data } = await api.get('/admin/audit-logs');
  return data;
};

export const getAssistantLogs = async () => {
  const { data } = await api.get('/admin/assistant-logs');
  return data;
};