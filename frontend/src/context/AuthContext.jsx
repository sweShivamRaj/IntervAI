import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getCurrentUser,
  getStoredToken,
  loginUser,
  logoutUser,
  registerUser,
  setStoredToken,
} from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const data = await getCurrentUser();
        if (!cancelled) setUser(data.user);
      } catch {
        setStoredToken(null);
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    setLoading(true);
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user),
      async login(email, password) {
        const data = await loginUser({ email, password });
        setStoredToken(data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      async register(name, email, password) {
        const data = await registerUser({ name, email, password });
        setStoredToken(data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      async logout() {
        try {
          if (getStoredToken()) await logoutUser();
        } catch {
          // Still clear local session if the API call fails.
        }
        setStoredToken(null);
        setToken(null);
        setUser(null);
      },
      setUser,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
