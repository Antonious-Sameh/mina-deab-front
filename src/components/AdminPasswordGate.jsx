// src/components/AdminPasswordGate.jsx
// Wraps a page's content and blocks it behind a simple password prompt.
// Once unlocked, it stays unlocked for the rest of the browser session
// (sessionStorage) — closing the tab/browser or a fresh visit asks again,
// but refreshing the page or navigating between protected pages does not.
//
// Purely client-side, no backend/database involved. Change the password in
// src/config/adminPassword.js.
//
// Usage:
//   <AdminPasswordGate><GroupsPage /></AdminPasswordGate>

import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ADMIN_PAGES_PASSWORD } from '@/config/adminPassword';

const SESSION_KEY = 'teacher_admin_pages_unlocked';

export default function AdminPasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  );
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  if (unlocked) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === ADMIN_PAGES_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setUnlocked(true);
    } else {
      setError('كلمة المرور غير صحيحة');
      setInput('');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-card border rounded-2xl shadow-lg w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-bold text-lg">صفحة محمية</h3>
          <p className="text-sm text-muted-foreground mt-1">أدخل كلمة المرور للمتابعة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            value={input}
            autoFocus
            onChange={(e) => { setInput(e.target.value); setError(''); }}
            placeholder="كلمة المرور"
            className={`h-11 text-center ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
          {error && <p className="text-xs text-destructive text-center font-medium">{error}</p>}
          <Button type="submit" className="w-full h-11">دخول</Button>
        </form>
      </div>
    </div>
  );
}