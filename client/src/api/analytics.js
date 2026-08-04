import { api } from './client';

export function getAnalyticsSummary() {
  return api.get('/admin/analytics/summary');
}