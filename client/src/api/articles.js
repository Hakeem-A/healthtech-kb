import { api } from './client';

export function listArticles() {
  return api.get('/articles/');
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