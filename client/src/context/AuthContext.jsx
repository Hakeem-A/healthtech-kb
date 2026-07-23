import { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin } from '../api/client';

const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    if (!payload) return null;
    return { email: payload.sub, role: payload.role };
  });

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    localStorage.setItem('access_token', data.access_token);
    const payload = decodeJwtPayload(data.access_token);
    setUser({ email: payload.sub, role: payload.role });
    return payload;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}