import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const ACCOUNT_LOCKED_MSG = 'Account suspended due to detected security violation. Contact compliance.';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountLocked, setAccountLocked] = useState(false);

  const logout = useCallback((locked = false) => {
    setUser(null);
    setAccessToken(null);
    sessionStorage.removeItem('sentinfi_rt');
    if (locked) setAccountLocked(true);
  }, []);

  const login = useCallback((userData, tokens) => {
    setAccountLocked(false);
    setUser(userData);
    setAccessToken(tokens.accessToken);
    sessionStorage.setItem('sentinfi_rt', tokens.refreshToken);
  }, []);

  const handleLockedResponse = useCallback((data) => {
    if (data?.locked || data?.error === ACCOUNT_LOCKED_MSG) {
      logout(true);
      return true;
    }
    return false;
  }, [logout]);

  useEffect(() => {
    const rt = sessionStorage.getItem('sentinfi_rt');
    if (!rt) {
      setLoading(false);
      return;
    }
    fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (data?.locked) {
          sessionStorage.removeItem('sentinfi_rt');
          setAccountLocked(true);
          return;
        }
        if (!res.ok) throw new Error();
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
        setAccessToken(data.accessToken);
        setUser({ id: payload.id, role: payload.role });
      })
      .catch(() => {
        sessionStorage.removeItem('sentinfi_rt');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, accountLocked, login, logout, handleLockedResponse }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
