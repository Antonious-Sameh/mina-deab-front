import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { safeLocalStorage } from '@/lib/safe-storage';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // FIXED: كان بيقرأ localStorage مباشرة في useState initializer
  // لو localStorage throw (Private Mode / Samsung Browser) التطبيق كان يقع هنا قبل ما يعرض أي حاجة
  const [theme, setTheme] = useState(() => {
    return safeLocalStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      safeLocalStorage.setItem('theme', theme);
    } catch {
      // Silent fail — التطبيق يشتغل حتى لو مقدرش يحفظ الثيم
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const contextValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}