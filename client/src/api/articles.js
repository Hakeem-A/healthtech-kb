import { api } from './client';

export function listArticles({ tag, status } = {}) {
  const params = new URLSearchParams();
  if (tag) params.set('tag', tag);
  if (status) params.set('status_filter', status);
  const qs = params.toString();
  return api.get(`/articles/${qs ? `?${qs}` : ''}`);
}

export function getArticle(id) {
  return api.get(`/articles/${id}`);
}

export function createArticle(data) {
  return api.post('/articles/', data);
}

export function updateArticle(id, data) {
  return api.put(`/articles/${id}`, data);
}

export function deleteArticle(id) {
  return api.del(`/articles/${id}`);
}

export function listCategories() {
  return api.get('/categories/');
}

export function listTags() {
  return api.get('/tags/');
}

export function searchArticles(q) {
  return api.get(`/articles/search?q=${encodeURIComponent(q)}`);
}
export function listReviewQueue() {
  return api.get('/articles/review-queue');
}

export function approveArticle(id) {
  return api.put(`/articles/${id}/approve`, {});
}

export function rejectArticle(id, reason) {
  return api.put(`/articles/${id}/reject`, { reason });
}

export function submitFeedback(articleId, rating, comment) {
  return api.post(`/articles/${articleId}/feedback`, { rating, comment });
}

export function getFeedbackSummary(articleId) {
  return api.get(`/articles/${articleId}/feedback/summary`);
}