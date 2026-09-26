import React, { useEffect, useState } from 'react';
import { Smartphone, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { accountAPI } from '@/api/services';

/**
 * DeviceTransitionToggle — بطاقة "وضع الانتقال المؤقت لجهاز الطالب" في صفحة
 * "حسابي". طول ما مفعّل، فحص "جهاز واحد للطالب" (auth.controller.js) بيتوقف
 * مؤقتًا — مفيد وقت انتقال الطلاب لاستخدام تطبيق الأندرويد. لازم يتقفل يدويًا
 * لما الانتقال يخلص، فبيتعرض بشكل واضح (لون تحذيري) طول ما هو شغال، عشان ميتنساش.
 */
export default function DeviceTransitionToggle() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [busy,    setBusy]    = useState(false);

  useEffect(() => {
    accountAPI.getDeviceTransitionMode()
      .then(d => setEnabled(!!d.enabled))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const handleToggle = async () => {
    setBusy(true);
    try {
      const next = !enabled;
      const d = await accountAPI.updateDeviceTransitionMode(next);
      setEnabled(!!d.enabled);
      toast.success(d.enabled ? 'تم تفعيل وضع الانتقال — الطلاب يقدروا يدخلوا من أي جهاز مؤقتًا' : 'تم إيقاف وضع الانتقال — رجع فحص الجهاز الواحد يعمل عادي');
    } catch {
      toast.error('حصل خطأ، حاول تاني');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={`border shadow-sm ${enabled ? 'border-amber-400/60 bg-amber-50 dark:bg-amber-950/20' : ''}`}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${enabled ? 'bg-amber-400/20' : 'bg-primary/10'}`}>
          {enabled ? <AlertTriangle className="h-5 w-5 text-amber-600" /> : <Smartphone className="h-5 w-5 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold flex items-center gap-2">
            وضع الانتقال المؤقت لجهاز الطالب
            {enabled && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-700 dark:text-amber-400">شغّال دلوقتي</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {enabled
              ? 'أي طالب يقدر يدخل من أي جهاز (كروم، PWA، أو التطبيق) من غير ما يتقفل عليه — أوقفه أول ما الطلاب كلهم يخلصوا انتقالهم للتطبيق'
              : 'فعّله مؤقتًا وقت ما الطلاب بينتقلوا لاستخدام تطبيق الأندرويد الجديد، عشان محدش يتقفل عليه'}
          </p>
        </div>
        <Button
          size="sm"
          variant={enabled ? 'destructive' : 'default'}
          disabled={busy}
          onClick={handleToggle}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (enabled ? 'إيقاف' : 'تفعيل')}
        </Button>
      </CardContent>
    </Card>
  );
}