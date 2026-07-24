import { api } from './client';

export function listUsers() {
  return api.get('/users/');
}

export function createUser(data) {
  return api.post('/users/', data);
}

export function updateUser(id, data) {
  return api.put(`/users/${id}`, data);
}

export function deleteUser(id) {
  return api.del(`/users/${id}`);
}