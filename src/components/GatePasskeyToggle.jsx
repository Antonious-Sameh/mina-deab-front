import React, { useEffect, useState } from 'react';
import { Fingerprint, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  isGatePasskeySupported,
  getGatePasskeyStatus,
  registerGatePasskey,
  removeGatePasskey,
} from '@/lib/gatePasskey';

/**
 * GatePasskeyToggle — بطاقة "بصمة الصفحات المحمية" على الجهاز الحالي، في
 * صفحة "حسابي". مستقلة تمامًا عن PasskeyToggle (بصمة تسجيل الدخول).
 *
 * `adminPassword` هي القيمة الحالية لكلمة مرور الصفحات المحمية (محمّلة
 * أصلاً في AccountPage.jsx) — بنستخدمها مباشرة وقت التفعيل بدل ما نطلب من
 * المستخدم يكتبها تاني، لأن الوصول لصفحة "حسابي" نفسها أصلاً محمي بنفس
 * الـ AdminPasswordGate، يعني وصوله هنا معناه أثبت إنه عارف كلمة المرور (أو
 * عنده بصمة مفعّلة بالفعل) من الأساس.
 */
export default function GatePasskeyToggle({ adminPassword }) {
  const [supported, setSupported] = useState(false);
  const [checking,  setChecking]  = useState(true);
  const [enabled,   setEnabled]   = useState(false);
  const [busy,      setBusy]      = useState(false);

  useEffect(() => {
    if (!isGatePasskeySupported()) { setChecking(false); return; }
    setSupported(true);
    getGatePasskeyStatus().then((v) => { setEnabled(v); setChecking(false); });
  }, []);

  if (!supported || checking) return null;

  const handleEnable = async () => {
    if (!adminPassword?.trim()) {
      toast.error('لازم تحفظ كلمة مرور الصفحات الخاصة الأول');
      return;
    }
    setBusy(true);
    const result = await registerGatePasskey(adminPassword.trim());
    setBusy(false);
    if (result.ok) {
      setEnabled(true);
      toast.success('تم تفعيل بصمة الصفحات المحمية على هذا الجهاز');
    } else if (result.reason === 'already-registered') {
      setEnabled(true);
    } else if (result.reason !== 'cancelled') {
      toast.error(result.message);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    const result = await removeGatePasskey();
    setBusy(false);
    if (result.ok) {
      setEnabled(false);
      toast.success('تم إلغاء تفعيل بصمة الصفحات المحمية على هذا الجهاز');
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
          <p className="font-semibold">بصمة الصفحات المحمية</p>
          <p className="text-xs text-muted-foreground">
            {enabled ? 'مُفعّلة على هذا الجهاز — تقدر تستخدمها بدل كلمة المرور' : 'افتح الصفحات المحمية بالبصمة بدل كتابة كلمة المرور، على هذا الجهاز فقط'}
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
