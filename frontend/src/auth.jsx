'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import { toast } from './utils/toast.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    // One-time removal of obsolete credentials from the previous application version.
    try { localStorage.removeItem('nimkat_token'); } catch { /* Storage may be disabled. */ }
    const ended = () => setUser(null);
    window.addEventListener('nimkat:session-ended', ended);
    api('/auth/me').then((d) => { if (active) setUser(d.user); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; window.removeEventListener('nimkat:session-ended', ended); };
  }, []);
  const requestOtp = useCallback((mobile) => api('/auth/otp/request', { method: 'POST', body: { mobile } }), []);
  const verifyOtp = useCallback(async (mobile, code, role) => {
    const d = await api('/auth/otp/verify', { method: 'POST', body: { mobile, code, role } });
    setUser(d.user);
    return d.user;
  }, []);
  const logout = useCallback(async (all = false) => {
    try {
      await api(all === true ? '/auth/logout-all' : '/auth/logout', { method: 'POST' });
      setUser(null);
      return true;
    } catch (error) { toast(error.message || 'خروج از حساب موفق نبود.', 'err'); return false; }
  }, []);
  return <AuthContext.Provider value={{ user, loading, requestOtp, verifyOtp, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
