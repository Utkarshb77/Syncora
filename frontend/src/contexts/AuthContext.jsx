import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuthToken } from '../utils/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('syncora_user') || 'null'); }
    catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('syncora_token'));

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    localStorage.removeItem('syncora_user');
  };

  // Listen for unauthorized events to smoothly log out stale sessions
  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('syncora:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('syncora:unauthorized', handleUnauthorized);
  }, []);

  // On mount, verify the token against MongoDB Atlas
  useEffect(() => {
    if (!token) return;
    api.getMe()
      .then((res) => {
        if (res?.user) {
          setUser(res.user);
          localStorage.setItem('syncora_user', JSON.stringify(res.user));
        }
      })
      .catch(() => {
        // Token is expired, invalid, or user was deleted from Atlas
        logout();
      });
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res?.token) {
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.user) localStorage.setItem('syncora_user', JSON.stringify(res.user));
    }
    return res;
  };

  const register = async (email, password, displayName) => {
    const res = await api.register({ email, password, displayName });
    if (res?.token) {
      setAuthToken(res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.user) localStorage.setItem('syncora_user', JSON.stringify(res.user));
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthed: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}
