import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const NotificationContext = createContext();

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Mentioned in Task",
    message: "Bilal Ahmed mentioned you in 'Architecture review: API Gateway & Auth tokens'",
    type: "mention",
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: "notif-2",
    title: "New Task Assigned",
    message: "You have been assigned to 'Interactive Kanban Board with drag-and-drop'",
    type: "assignment",
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: "notif-3",
    title: "Approaching Due Date",
    message: "Task 'Offline Sync Engine & IndexedDB Rehydration' is due in 3 days",
    type: "due_date",
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  }
];

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useLocalStorage('wm_notifications', INITIAL_NOTIFICATIONS);
  const [preferences, setPreferences] = useLocalStorage('wm_notification_prefs', {
    mentions: true,
    assignments: true,
    dueDates: true,
    simulatedActivity: true
  });

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const addToast = useCallback(({ title, description, type = 'info', action, duration = 4000 }) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, description, type, action }]);
    
    if (!action) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addNotification = useCallback(({ title, message, type = 'system' }) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      read: false,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, [setNotifications]);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, [setNotifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [setNotifications]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, [setPreferences]);

  return (
    <NotificationContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
      preferences,
      updatePreferences
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
