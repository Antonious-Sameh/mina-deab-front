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
// ── بصمة الصفحات المحمية (اختياري، إضافي) ───────────────────────────────────
// لو الجهاز الحالي عنده بصمة مسجّلة (من صفحة "حسابي")، بيبان زرار بصمة جنب
// كلمة المرور كبديل سريع لها — كلمة المرور تفضل شغالة دايمًا كـ fallback.
// تسجيل بصمة جديدة على جهاز مالوش واحدة بيحصل من صفحة "حسابي" بس (مش من
// هنا)، فمفيش أي طريقة حد يفعّل بصمة من غير ما يعرف كلمة المرور الأول.
//
// Usage:
//   <AdminPasswordGate><GroupsPage /></AdminPasswordGate>

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Lock, Loader2, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { accountAPI } from '@/api/services';
import { isGatePasskeySupported, getGatePasskeyStatus, unlockWithGatePasskey } from '@/lib/gatePasskey';

export default function AdminPasswordGate({ children }) {
  const location = useLocation();
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  // بصمة الصفحات المحمية — حالة منفصلة تمامًا عن كلمة المرور، بتتفحص من
  // جديد مع كل صفحة محمية (زي باقي حالة القفل بالظبط، مفيش أي كاش).
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [passkeyChecking,  setPasskeyChecking]  = useState(false);
  const [passkeyBusy,      setPasskeyBusy]      = useState(false);

  // إعادة القفل بشكل صريح مع أي تغيير في مسار الصفحة — حتى لو React قرر
  // يعيد استخدام نفس نسخة الكومبوننت بدل ما يعمل mount جديد (زي ما بيحصل
  // لما صفحتين محميتين مختلفتين بيبقوا بنفس شكل الشجرة)، الـ effect ده
  // بيتنفذ في كل الأحوال مع أي تغيير في location.pathname ويرجع unlocked
  // لـ false، فكل صفحة محمية لازم تتفتح بكلمة السر بشكل مستقل من غير أي استثناء.
  useEffect(() => {
    setUnlocked(false);
    setInput('');
    setError('');
  }, [location.pathname]);

  // فحص هل الجهاز الحالي عنده بصمة مسجّلة أصلاً — بس لو المتصفح بيدعم
  // WebAuthn من الأساس (تجنّب نداء شبكة بلا داعي على متصفحات مش بتدعمها).
  useEffect(() => {
    if (unlocked) return;
    if (!isGatePasskeySupported()) { setPasskeyAvailable(false); return; }
    setPasskeyChecking(true);
    getGatePasskeyStatus()
      .then(setPasskeyAvailable)
      .finally(() => setPasskeyChecking(false));
  }, [location.pathname, unlocked]);

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

  const handlePasskeyUnlock = async () => {
    if (passkeyBusy) return;
    setPasskeyBusy(true);
    setError('');
    const result = await unlockWithGatePasskey();
    setPasskeyBusy(false);
    if (result.ok && result.valid) {
      setUnlocked(true);
    } else if (result.ok && !result.valid) {
      setError('تعذّر التحقق من البصمة، استخدم كلمة المرور');
    } else if (result.reason !== 'cancelled') {
      setError(result.message || 'تعذّر التحقق من البصمة، استخدم كلمة المرور');
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

        {!passkeyChecking && passkeyAvailable && (
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 gap-2 mb-3"
            disabled={passkeyBusy || checking}
            onClick={handlePasskeyUnlock}
          >
            {passkeyBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
            فتح بالبصمة
          </Button>
        )}

        {!passkeyChecking && passkeyAvailable && (
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-muted-foreground">أو</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            value={input}
            autoFocus
            onChange={(e) => { setInput(e.target.value); setError(''); }}
            placeholder="كلمة المرور"
            disabled={checking || passkeyBusy}
            className={`h-11 text-center ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
          {error && <p className="text-xs text-destructive text-center font-medium">{error}</p>}
          <Button type="submit" className="w-full h-11 gap-2" disabled={checking || passkeyBusy}>
            {checking && <Loader2 className="h-4 w-4 animate-spin" />}
            دخول
          </Button>
        </form>
      </div>
    </div>
  );
}