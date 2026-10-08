import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { studentAPI } from '@/api/services';

const NotificationContext = createContext({ unreadCount: 0, refresh: () => {} });

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchCount = useCallback(async () => {
    if (!user || user.role !== 'student') { setUnreadCount(0); return; }
    try {
      const data = await studentAPI.notes();
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent fail
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'student') { setUnreadCount(0); return; }

    const start = () => {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(fetchCount, 60_000); // poll every 60s
    };
    const stop = () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    // Poll only while the page is visible; pause in the background and
    // fetch once immediately when the user comes back.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') { fetchCount(); start(); }
      else { stop(); }
    };

    fetchCount();
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user, fetchCount]);

  const contextValue = useMemo(
    () => ({ unreadCount, refresh: fetchCount }),
    [unreadCount, fetchCount]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);