import { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../lib/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    api.aget('/auth/me').then((r) => setAdmin(r.admin)).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    tokenStore.set(r.token);
    setAdmin(r.admin);
  };
  const logout = () => {
    tokenStore.clear();
    setAdmin(null);
  };

  return <Ctx.Provider value={{ admin, loading, login, logout }}>{children}</Ctx.Provider>;
}
