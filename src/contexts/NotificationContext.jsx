import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { notesAPI } from '@/api/services';

const NotificationContext = createContext({ unreadCount: 0, refresh: () => {} });

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  // Depend on the user's identity (id + role), not the whole `user` object:
  // AuthContext replaces the object (cached user -> fresh /me result, avatar
  // updates, ...) without the identity changing, which used to re-run the
  // effect below and fire a redundant request each time.
  const userId   = user?._id;
  const userRole = user?.role;

  const fetchCount = useCallback(async () => {
    if (!userId || userRole !== 'student') { setUnreadCount(0); return; }
    try {
      // Lightweight endpoint: returns counts only, not the full notes list.
      const data = await notesAPI.unreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent fail
    }
  }, [userId, userRole]);

  useEffect(() => {
    if (!userId || userRole !== 'student') { setUnreadCount(0); return; }

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
  }, [userId, userRole, fetchCount]);

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