import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { MOCK_USERS } from '../data/mockUsers';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [users, setUsers] = useLocalStorage('wm_users', MOCK_USERS);
  const [currentUser, setCurrentUser] = useLocalStorage('wm_currentUser', MOCK_USERS[0]);
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage('wm_isAuthenticated', true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Sync users with backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadServerUsers() {
      try {
        const res = await api.getUsers();
        if (isMounted && res.success && Array.isArray(res.users) && res.users.length > 0) {
          setUsers(res.users);
          // Refresh current user if needed
          setCurrentUser(curr => {
            if (!curr) return res.users[0];
            const fresh = res.users.find(u => u.id === curr.id || u.email.toLowerCase() === curr.email.toLowerCase());
            return fresh || curr;
          });
        }
      } catch (err) {
        console.info('[Auth] Server unreachable, using local cache:', err.message);
      }
    }
    loadServerUsers();
    return () => { isMounted = false; };
  }, [setUsers, setCurrentUser]);

  const login = useCallback(async (email) => {
    if (!email || !email.trim()) {
      return { success: false, error: 'Email is required' };
    }
    const cleanEmail = email.trim().toLowerCase();
    setIsLoadingAuth(true);

    try {
      // 1. Try Backend
      const res = await api.login(cleanEmail);
      if (res.success && res.user) {
        if (res.token) {
          localStorage.setItem('wm_auth_token', res.token);
        }
        // Add to users list if not present
        setUsers(prev => {
          const exists = prev.some(u => u.id === res.user.id || u.email.toLowerCase() === res.user.email.toLowerCase());
          if (!exists) {
            return [...prev, res.user];
          }
          return prev.map(u => u.id === res.user.id || u.email.toLowerCase() === res.user.email.toLowerCase() ? res.user : u);
        });
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        return { success: true, user: res.user };
      }
    } catch (err) {
      console.warn('[Auth] Server login failed:', err.message);
      // If server specifically returned 404 or 400
      if (err.status === 404 || err.status === 400) {
        const localUser = users.find(u => u.email.toLowerCase() === cleanEmail);
        if (localUser) {
          setCurrentUser(localUser);
          setIsAuthenticated(true);
          setIsLoadingAuth(false);
          return { success: true, user: localUser };
        }
        setIsLoadingAuth(false);
        return { success: false, error: err.message || 'User not found with this email' };
      }
    }

    // 2. Offline / Local Fallback
    const localUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    setIsLoadingAuth(false);
    if (localUser) {
      setCurrentUser(localUser);
      setIsAuthenticated(true);
      return { success: true, user: localUser };
    }
    return { success: false, error: 'User not found with this email' };
  }, [users, setUsers, setCurrentUser, setIsAuthenticated]);

  const signup = useCallback(async ({ name, email, role = 'Member', title = 'Product Team' }) => {
    if (!name || !email || !name.trim() || !email.trim()) {
      return { success: false, error: 'Name and email are required' };
    }
    const cleanEmail = email.trim().toLowerCase();
    setIsLoadingAuth(true);

    try {
      // 1. Try Backend
      const res = await api.signup({ name: name.trim(), email: cleanEmail, role, title });
      if (res.success && res.user) {
        if (res.token) {
          localStorage.setItem('wm_auth_token', res.token);
        }
        setUsers(prev => [
          ...prev.filter(u => u.id !== res.user.id && u.email.toLowerCase() !== cleanEmail),
          res.user
        ]);
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        return { success: true, user: res.user };
      }
    } catch (err) {
      console.warn('[Auth] Server signup error:', err.message);
      if (err.status === 409 || err.status === 400) {
        setIsLoadingAuth(false);
        return { success: false, error: err.message || 'Email already registered' };
      }
    }

    // 2. Offline / Local Fallback
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      setIsLoadingAuth(false);
      return { success: false, error: 'Email already exists' };
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      role,
      title,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
    return { success: true, user: newUser };
  }, [users, setUsers, setCurrentUser, setIsAuthenticated]);

  const switchUser = useCallback((userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  }, [users, setCurrentUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('wm_auth_token');
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, [setCurrentUser, setIsAuthenticated]);

  return (
    <AuthContext.Provider value={{
      users,
      currentUser,
      isAuthenticated,
      isLoadingAuth,
      login,
      signup,
      switchUser,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
