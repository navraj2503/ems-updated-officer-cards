import React, { useState, useCallback, useEffect } from 'react';

// ===== NOTIFICATION CONTEXT & COMPONENT =====
// Provides a toast notification system.
// Wrap the app in <NotificationProvider> and call useNotif() to show toasts.

import { createContext, useContext } from 'react';

const NotifContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const showNotif = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);

    // Auto-remove after 2.8 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 2800);
  }, []);

  return (
    <NotifContext.Provider value={showNotif}>
      {children}
      <NotificationContainer notifications={notifications} />
    </NotifContext.Provider>
  );
}

/** Hook to trigger a notification: notif('message', 'success' | 'error' | 'info') */
export function useNotif() {
  return useContext(NotifContext);
}

// ===== NOTIFICATION CONTAINER =====
// Renders all active toast notifications in the bottom-right corner.
function NotificationContainer({ notifications }) {
  return (
    <div style={{ position: 'fixed', bottom: 22, right: 22, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {notifications.map(n => (
        <ToastItem key={n.id} message={n.message} type={n.type} />
      ))}
    </div>
  );
}

// ===== SINGLE TOAST ITEM =====
function ToastItem({ message, type }) {
  const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';

  return (
    <div className={`notif ${type}`}>
      <span>{icon}</span>
      {message}
    </div>
  );
}
