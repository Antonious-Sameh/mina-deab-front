import React, { useEffect, useState } from 'react';
import { Fingerprint, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  isPasskeySupported,
  getPasskeyStatus,
  registerPasskey,
  removePasskey,
} from '@/lib/passkey';

/**
 * PasskeyToggle — بطاقة "تفعيل الدخول بالبصمة" على الجهاز الحالي.
 * صامت تمامًا على الأجهزة/المتصفحات اللي مش بتدعم WebAuthn (بيرجع null،
 * ملوش أي أثر في الصفحة).
 */
export default function PasskeyToggle() {
  const [supported, setSupported] = useState(false);
  const [checking,  setChecking]  = useState(true);
  const [enabled,   setEnabled]   = useState(false);
  const [busy,      setBusy]      = useState(false);

  useEffect(() => {
    if (!isPasskeySupported()) { setChecking(false); return; }
    setSupported(true);
    getPasskeyStatus().then((v) => { setEnabled(v); setChecking(false); });
  }, []);

  if (!supported || checking) return null;

  const handleEnable = async () => {
    setBusy(true);
    const result = await registerPasskey();
    setBusy(false);
    if (result.ok) {
      setEnabled(true);
      toast.success('تم تفعيل الدخول بالبصمة على هذا الجهاز');
    } else if (result.reason === 'already-registered') {
      setEnabled(true);
    } else if (result.reason !== 'cancelled') {
      toast.error(result.message);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    const result = await removePasskey();
    setBusy(false);
    if (result.ok) {
      setEnabled(false);
      toast.success('تم إلغاء تفعيل الدخول بالبصمة على هذا الجهاز');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Fingerprint className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">الدخول بالبصمة</p>
          <p className="text-xs text-muted-foreground">
            {enabled ? 'مُفعّل على هذا الجهاز' : 'ادخل بدون كتابة الكود، على هذا الجهاز فقط'}
          </p>
        </div>
        <Button
          size="sm"
          variant={enabled ? 'outline' : 'default'}
          disabled={busy}
          onClick={enabled ? handleDisable : handleEnable}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (enabled ? 'إلغاء' : 'تفعيل')}
        </Button>
      </CardContent>
    </Card>
  );
}