'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from './api.js';
import { toast } from './utils/toast.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionError,setSessionError]=useState('');
  const [loading, setLoading] = useState(true);
  const revision = useRef(0);
  useEffect(() => {
    const started = revision.current;
    let active = true;
    // One-time removal of obsolete credentials from the previous application version.
    try { localStorage.removeItem('nimkat_token'); } catch { /* Storage may be disabled. */ }
    const ended = () => { revision.current++; setUser(null); };
    window.addEventListener('nimkat:session-ended', ended);
    api('/auth/me').then((d) => { if (active && started === revision.current) setUser(d.user); })
      .catch((e) => { if(active && started===revision.current){if(e.status===401)setUser(null);else setSessionError('بررسی نشست ممکن نشد؛ اتصال را بررسی و دوباره تلاش کنید.');} })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; window.removeEventListener('nimkat:session-ended', ended); };
  }, []);
  const requestOtp = useCallback((mobile) => api('/auth/otp/request', { method: 'POST', body: { mobile } }), []);
  const verifyOtp = useCallback(async (mobile, code, role) => {
    revision.current++;
    const d = await api('/auth/otp/verify', { method: 'POST', body: { mobile, code, role } });
    // Never navigate on the OTP response alone: confirm the browser actually retained the cookie.
    const checked=await api('/auth/me');
    if(checked.user?.id!==d.user.id) throw new Error('مرورگر کوکی ورود را ذخیره نکرد. پیش‌نمایش را در زبانهٔ مستقل باز کنید یا اجازهٔ ذخیره‌سازی مرورگر را بدهید.');
    revision.current++;
    setSessionError('');
    setLoading(false);
    setUser(checked.user);
    return d.user;
  }, []);
  const logout = useCallback(async (all = false) => {
    try {
      await api(all === true ? '/auth/logout-all' : '/auth/logout', { method: 'POST' });
      revision.current++;
      setUser(null);
      return true;
    } catch (error) { toast(error.message || 'خروج از حساب موفق نبود.', 'err'); return false; }
  }, []);
  return <AuthContext.Provider value={{ user, loading, sessionError, requestOtp, verifyOtp, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
