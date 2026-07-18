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
    fetchCount();
    intervalRef.current = setInterval(fetchCount, 60_000); // poll every 60s
    return () => clearInterval(intervalRef.current);
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