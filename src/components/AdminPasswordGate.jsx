// src/components/AdminPasswordGate.jsx
// Wraps a page's content and blocks it behind a simple password prompt.
// Each protected page is independent: the password is required every single
// time you navigate into that page (no sessionStorage/localStorage, no
// shared "unlocked" flag across pages). Once entered correctly, you can move
// freely inside that page — but leaving it and opening it (or any other
// protected page) again asks again.
//
// The password itself is stored in the database (plain text, by design) and
// managed by the teacher from the Account page — see accountAPI.verifyAdminPassword.
//
// Usage:
//   <AdminPasswordGate><GroupsPage /></AdminPasswordGate>

import React, { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { accountAPI } from '@/api/services';

export default function AdminPasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  if (unlocked) return children;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (checking) return;
    setChecking(true);
    try {
      const { valid } = await accountAPI.verifyAdminPassword(input);
      if (valid) {
        setUnlocked(true);
      } else {
        setError('كلمة المرور غير صحيحة');
        setInput('');
      }
    } catch {
      setError('تعذر التحقق من كلمة المرور، حاول مرة أخرى');
      setInput('');
    } finally {
      setChecking(false);
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
            disabled={checking}
            className={`h-11 text-center ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
          {error && <p className="text-xs text-destructive text-center font-medium">{error}</p>}
          <Button type="submit" className="w-full h-11 gap-2" disabled={checking}>
            {checking && <Loader2 className="h-4 w-4 animate-spin" />}
            دخول
          </Button>
        </form>
      </div>
    </div>
  );
}