import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kc_user')); }
    catch { return null; }
  });

  const login = useCallback((userData) => {
    localStorage.setItem('kc_token', userData.token);
    localStorage.setItem('kc_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('kc_token');
    localStorage.removeItem('kc_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(current => {
      if (!current) return current;
      const updated = { ...current, ...updates };
      localStorage.setItem('kc_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, login, logout, updateUser,
      isFarmer: user?.role === 'FARMER',
      isBuyer:  user?.role === 'BUYER',
      isAdmin:  user?.role === 'ADMIN',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
