import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from sessionStorage (unique per tab, so multiple accounts work on separate tabs)
  useEffect(() => {
    const storedToken = sessionStorage.getItem('seapedia_token');
    const storedUser = sessionStorage.getItem('seapedia_user');
    const storedRole = sessionStorage.getItem('seapedia_active_role');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setActiveRole(storedRole || null);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await authService.login({ username, password });
    const { user: userData, token: newToken, activeRole: role } = res.data.data;

    sessionStorage.setItem('seapedia_token', newToken);
    sessionStorage.setItem('seapedia_user', JSON.stringify(userData));
    if (role) sessionStorage.setItem('seapedia_active_role', role);

    setToken(newToken);
    setUser(userData);
    setActiveRole(role);

    return { user: userData, activeRole: role };
  }, []);

  const register = useCallback(async (data) => {
    const res = await authService.register(data);
    return res.data.data;
  }, []);

  const selectRole = useCallback(async (role) => {
    const res = await authService.selectRole(role);
    const { user: userData, token: newToken, activeRole: newRole } = res.data.data;

    sessionStorage.setItem('seapedia_token', newToken);
    sessionStorage.setItem('seapedia_user', JSON.stringify(userData));
    sessionStorage.setItem('seapedia_active_role', newRole);

    setToken(newToken);
    setUser(userData);
    setActiveRole(newRole);

    return { user: userData, activeRole: newRole };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('seapedia_token');
    sessionStorage.removeItem('seapedia_user');
    sessionStorage.removeItem('seapedia_active_role');
    setToken(null);
    setUser(null);
    setActiveRole(null);
  }, []);

  const value = {
    user,
    activeRole,
    token,
    loading,
    isAuthenticated: !!token,
    hasRole: (role) => user?.roles?.includes(role) || false,
    login,
    register,
    selectRole,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

