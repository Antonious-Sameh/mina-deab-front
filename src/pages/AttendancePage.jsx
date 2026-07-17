import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  Check, X, Save, ClipboardCheck, Loader2, AlertCircle,
  Users, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Plus, Pencil, Trash2, CalendarDays, BookOpenCheck, CheckCircle2, Wallet,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { groupsAPI, monthsAPI, sessionsAPI, paymentsAPI } from '@/api/services';

const ACADEMIC_YEARS = [
  { value: 'first-prep',  label: 'الصف الأول الإعدادي'  },
  { value: 'second-prep', label: 'الصف الثاني الإعدادي' },
  { value: 'third-prep',  label: 'الصف الثالث الإعدادي' },
  { value: 'first-sec',   label: 'الصف الأول الثانوي'   },
  { value: 'second-sec',  label: 'الصف الثاني الثانوي'  },
  { value: 'third-sec',   label: 'الصف الثالث الثانوي'  },
];

function formatDateAr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ══════════════════════════════════════════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════════════════════════════════════════

function MonthModal({ month, groupId, onClose, onSaved }) {
  const isEdit = !!month;
  const [name,   setName]   = useState(month?.name || '');
  const [price,  setPrice]  = useState(month?.price ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('اكتب اسم الشهر'); return; }
    if (price === '' || Number(price) < 0) { toast.error('أدخل سعر الشهر'); return; }
    setSaving(true);
    try {
      let data;
      if (isEdit) {
        data = await monthsAPI.update(month._id, { name: name.trim(), price: Number(price) });
        toast.success('تم تعديل الشهر ✓');
      } else {
        data = await monthsAPI.create({ groupId, name: name.trim(), price: Number(price) });
        toast.success('تم إضافة الشهر ✓');
      }
      onSaved(data.month);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشلت العملية');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold">{isEdit ? 'تعديل الشهر' : 'إضافة شهر جديد'}</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>اسم الشهر <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: أكتوبر — أو — مراجعة — أو — شهر 1" autoFocus className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label>سعر الشهر (ج.م) <span className="text-destructive">*</span></Label>
            <Input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="مثال: 300" className="h-11 text-lg font-bold" />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ
          </Button>
        </div>
      </div>
    </div>
  );
}

function SessionModal({ session, monthId, onClose, onSaved }) {
  const isEdit = !!session;
  const [name,   setName]   = useState(session?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('اكتب اسم الحصة'); return; }
    setSaving(true);
    try {
      let data;
      if (isEdit) {
        data = await sessionsAPI.update(session._id, { name: name.trim() });
        toast.success('تم تعديل اسم الحصة ✓');
      } else {
        data = await sessionsAPI.create({ monthId, name: name.trim() });
        toast.success('تم إضافة الحصة ✓');
      }
      onSaved(data.session);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشلت العملية');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold">{isEdit ? 'تعديل اسم الحصة' : 'إضافة حصة جديدة'}</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-5 space-y-3">
          <Label>اسم الحصة <span className="text-destructive">*</span></Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: حصة 1 — أو — مراجعة — أو — امتحان" autoFocus className="h-11" />
        </div>
        <div className="flex gap-3 p-5 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ
          </Button>
        </div>
      </div>
    </div>
  );
}

// Review / edit / delete a student's recorded installments for this month —
// this is the only way to add a new payment once the month is already fully
// paid (matches: "المدرس يعدل البيانات بنفسه").
function PaymentEditModal({ studentId, studentName, monthName, onClose, onChanged }) {
  const [loading,     setLoading]     = useState(true);
  const [payment,     setPayment]     = useState(null);
  const [editingInst, setEditingInst] = useState(null);
  const [amount,      setAmount]      = useState('');
  const [saving,      setSaving]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await paymentsAPI.getStudent(studentId);
      const p = (data.payments || []).find(pp => pp.month === monthName);
      setPayment(p || null);
    } catch { toast.error('فشل تحميل بيانات الدفع'); }
    finally { setLoading(false); }
  }, [studentId, monthName]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (instId) => {
    if (!window.confirm('حذف هذه الدفعة؟')) return;
    try {
      await paymentsAPI.deleteInstallment(payment._id, instId);
      toast.success('تم الحذف');
      await load();
      onChanged();
    } catch (err) { toast.error(err?.response?.data?.message || 'فشل الحذف'); }
  };

  const startEdit = (inst) => { setEditingInst(inst); setAmount(String(inst.amount)); };

  const handleSaveEdit = async () => {
    if (!amount || Number(amount) <= 0) { toast.error('أدخل مبلغاً صحيحاً'); return; }
    setSaving(true);
    try {
      await paymentsAPI.updateInstallment(payment._id, editingInst._id, { amount: Number(amount) });
      toast.success('تم التعديل ✓');
      setEditingInst(null);
      await load();
      onChanged();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل التعديل');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div>
            <h3 className="font-bold">دفعات {studentName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{monthName}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto">
          {loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
          {!loading && (!payment || !payment.installments?.length) && (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد دفعات مسجلة بعد</p>
          )}
          {!loading && payment?.installments?.map((inst) => (
            <div key={inst._id} className="border rounded-xl p-3">
              {editingInst?._id === inst._id ? (
                <div className="flex items-center gap-2">
                  <Input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} className="h-9" autoFocus />
                  <Button size="sm" className="h-9 gap-1" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="outline" className="h-9" onClick={() => setEditingInst(null)}>إلغاء</Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{inst.amount} ج.م</p>
                    <p className="text-xs text-muted-foreground">{new Date(inst.paidAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => startEdit(inst)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(inst._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LEVEL 3 — MONTHS
// ══════════════════════════════════════════════════════════════════════════════

// أقل عدد حصص لازم يكون اتسجل في آخر شهر قبل ما نظهر تنبيه "عليهم فلوس"
// (متأخرين عن الدفع) — يعني التنبيه يبدأ يظهر مع/بعد الحصة الخامسة، مش من
// أول حصة في الشهر. عايز تغيّر الرقم؟ غيّر القيمة دي بس.
const MIN_SESSIONS_BEFORE_UNPAID_ALERT = 5;

function MonthsView({ group, onOpenMonth }) {
  const [months,       setMonths]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [monthModal,   setMonthModal]   = useState(null); // 'new' | monthObj | null
  const [unpaid,       setUnpaid]       = useState([]);
  const [loadingUnpaid,setLoadingUnpaid]= useState(true);
  const [unpaidOpen,   setUnpaidOpen]   = useState(false);

  // الطلاب اللي معملوش أي دفعة خالص للشهر الحالي (لسه صفر ج.م) — قائمة منفصلة
  // عن "باقي عليهم" (اللي دفعوا جزء ولسه ناقصهم مبلغ)
  const [notPaid,        setNotPaid]        = useState([]);
  const [loadingNotPaid, setLoadingNotPaid] = useState(true);
  const [notPaidOpen,    setNotPaidOpen]    = useState(false);

  // بدل ما نعتمد على "آخر شهر" بس (اللي ممكن يسبب مشاكل لو الترتيب مش
  // مضبوط)، بنجيب عدد الحصص في كل شهر، ونحدد الشهور اللي "استحقت" تنبيه
  // الدفع (وصلت لعدد الحصص المطلوب) — ده هو اللي بيتحكم في ظهور القائمتين
  const [hasEligibleMonth, setHasEligibleMonth] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadingNotPaid(true);
    try {
      const data = await monthsAPI.getAll(group._id);
      const monthsList = data.months || [];
      setMonths(monthsList);

      if (monthsList.length === 0) {
        setHasEligibleMonth(false);
        setNotPaid([]);
        setLoadingNotPaid(false);
        return;
      }

      // عدد الحصص المسجلة في كل شهر
      const monthsWithCounts = await Promise.all(
        monthsList.map(async (m) => {
          try {
            const sData = await sessionsAPI.getAll(m._id);
            return { month: m, sessionsCount: (sData.sessions || []).length };
          } catch { return { month: m, sessionsCount: 0 }; }
        })
      );

      // الشهور اللي وصلت لعدد الحصص المطلوب (يبقى استحق فيها تنبيه الدفع)
      const eligibleMonths = monthsWithCounts.filter(x => x.sessionsCount >= MIN_SESSIONS_BEFORE_UNPAID_ALERT);
      setHasEligibleMonth(eligibleMonths.length > 0);

      if (eligibleMonths.length === 0) {
        setNotPaid([]);
        setLoadingNotPaid(false);
        return;
      }

      // الطلاب اللي معملوش أي دفعة خالص في أي شهر من الشهور المستحقة —
      // بنجمعهم من كل الشهور المستحقة مع منع تكرار نفس الطالب
      try {
        const results = await Promise.all(
          eligibleMonths.map(({ month: m }) =>
            paymentsAPI.getGroup({ group: group._id, month: m.name }).catch(() => ({ students: [] }))
          )
        );
        const map = new Map();
        results.forEach((r) => {
          (r.students || []).forEach((s) => {
            if (s.totalPaid === 0) map.set(s.student._id, s);
          });
        });
        setNotPaid(Array.from(map.values()));
      } catch { /* اختياري — لا نزعج المدرس برسالة خطأ هنا */ }
      finally { setLoadingNotPaid(false); }
    } catch { toast.error('فشل تحميل الشهور'); }
    finally { setLoading(false); }
  }, [group._id]);

  const loadUnpaid = useCallback(async () => {
    setLoadingUnpaid(true);
    try {
      const data = await monthsAPI.getUnpaid(group._id);
      setUnpaid(data.students || []);
    } catch { /* اختياري — لا نزعج المدرس برسالة خطأ هنا */ }
    finally { setLoadingUnpaid(false); }
  }, [group._id]);

  useEffect(() => { load(); loadUnpaid(); }, [load, loadUnpaid]);

  // نتأكد إن فيه شهر وصل بالفعل لعدد الحصص المطلوب قبل عرض تنبيهات الدفع
  const canShowUnpaidAlert = hasEligibleMonth;

  const handleDelete = async (month) => {
    if (!window.confirm(`حذف شهر "${month.name}"؟ سيتم حذف كل الحصص بداخله (بيانات الحضور والمدفوعات القديمة تفضل محفوظة).`)) return;
    try {
      await monthsAPI.remove(month._id);
      toast.success('تم حذف الشهر');
      setMonths(prev => prev.filter(m => m._id !== month._id));
    } catch (err) { toast.error(err?.response?.data?.message || 'فشل الحذف'); }
  };

  const totalUnpaid = unpaid.reduce((s, u) => s + u.totalRemaining, 0);

  return (
    <div className="space-y-4">
      {!loadingNotPaid && notPaid.length > 0 && canShowUnpaidAlert && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl overflow-hidden">
          <button className="w-full flex items-center justify-between gap-3 p-4" onClick={() => setNotPaidOpen(o => !o)}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-700 text-sm sm:text-base">{notPaid.length} طالب لسه مدفعش خالص</p>
                <p className="text-xs text-orange-600/80">لم يقم بأي دفعة للشهر الحالي</p>
              </div>
            </div>
            {notPaidOpen ? <ChevronUp className="h-5 w-5 text-orange-500 shrink-0" /> : <ChevronDown className="h-5 w-5 text-orange-500 shrink-0" />}
          </button>
          {notPaidOpen && (
            <div className="border-t border-orange-200 divide-y divide-orange-100 max-h-64 overflow-y-auto">
              {notPaid.map(s => (
                <div key={s.student._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="font-medium">{s.student.name}</span>
                  <span className="font-bold text-orange-600">لم يدفع</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loadingUnpaid && unpaid.length > 0 && canShowUnpaidAlert && (
        <div className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden">
          <button className="w-full flex items-center justify-between gap-3 p-4" onClick={() => setUnpaidOpen(o => !o)}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-right">
                <p className="font-bold text-red-700 text-sm sm:text-base">{unpaid.length} طالب لسه عليهم فلوس</p>
                <p className="text-xs text-red-600/80">إجمالي المتبقي: {totalUnpaid} ج.م</p>
              </div>
            </div>
            {unpaidOpen ? <ChevronUp className="h-5 w-5 text-red-500 shrink-0" /> : <ChevronDown className="h-5 w-5 text-red-500 shrink-0" />}
          </button>
          {unpaidOpen && (
            <div className="border-t border-red-200 divide-y divide-red-100 max-h-64 overflow-y-auto">
              {unpaid.map(u => (
                <div key={u.student._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="font-medium">{u.student.name}</span>
                  <span className="font-bold text-red-600">{u.totalRemaining} ج.م</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-lg truncate">شهور {group.name}</h3>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setMonthModal('new')}><Plus className="h-4 w-4" />إضافة شهر</Button>
      </div>

      {loading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}

      {!loading && months.length === 0 && (
        <div className="text-center py-14 bg-card border rounded-2xl border-dashed">
          <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">لا توجد شهور بعد — ابدأ بإضافة شهر جديد</p>
        </div>
      )}

      {!loading && months.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {months.map(m => (
            <div
              key={m._id}
              className="bg-card border rounded-2xl p-4 flex items-center gap-3 hover:shadow-sm cursor-pointer transition-all"
              onClick={() => onOpenMonth(m)}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.price} ج.م / شهر</p>
              </div>
              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setMonthModal(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(m)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      )}

      {monthModal && (
        <MonthModal
          month={monthModal === 'new' ? null : monthModal}
          groupId={group._id}
          onClose={() => setMonthModal(null)}
          onSaved={(month) => {
            setMonthModal(null);
            setMonths(prev => {
              const exists = prev.some(m => m._id === month._id);
              return exists ? prev.map(m => (m._id === month._id ? month : m)) : [...prev, month];
            });
          }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LEVEL 4 — SESSIONS (حصص)
// ══════════════════════════════════════════════════════════════════════════════

function SessionsView({ month, group, onBack, onOpenSession }) {
  const [sessions,     setSessions]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [sessionModal, setSessionModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sessionsAPI.getAll(month._id);
      setSessions(data.sessions || []);
    } catch { toast.error('فشل تحميل الحصص'); }
    finally { setLoading(false); }
  }, [month._id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (session) => {
    if (!window.confirm(`حذف حصة "${session.name}"؟`)) return;
    try {
      await sessionsAPI.remove(session._id);
      toast.success('تم حذف الحصة');
      setSessions(prev => prev.filter(s => s._id !== session._id));
    } catch (err) { toast.error(err?.response?.data?.message || 'فشل الحذف'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}><ChevronRight className="h-4 w-4" />الشهور</Button>
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-lg truncate">{month.name}</h3>
          <p className="text-xs text-muted-foreground">{month.price} ج.م / شهر — {group.name}</p>
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setSessionModal('new')}><Plus className="h-4 w-4" />إضافة حصة</Button>
      </div>

      {loading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}

      {!loading && sessions.length === 0 && (
        <div className="text-center py-14 bg-card border rounded-2xl border-dashed">
          <BookOpenCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">لا توجد حصص بعد — ابدأ بإضافة حصة جديدة</p>
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <div className="space-y-2">
          {sessions.map(s => (
            <div
              key={s._id}
              className="bg-card border rounded-xl p-4 flex items-center gap-3 hover:shadow-sm cursor-pointer transition-all"
              onClick={() => onOpenSession(s)}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <BookOpenCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{formatDateAr(s.date)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSessionModal(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(s)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      )}

      {sessionModal && (
        <SessionModal
          session={sessionModal === 'new' ? null : sessionModal}
          monthId={month._id}
          onClose={() => setSessionModal(null)}
          onSaved={(session) => {
            setSessionModal(null);
            setSessions(prev => {
              const exists = prev.some(s => s._id === session._id);
              return exists ? prev.map(s => (s._id === session._id ? session : s)) : [...prev, session];
            });
          }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LEVEL 5 — SESSION SHEET (الطالب | ID | حضور | غياب | دفع | باقي)
// ══════════════════════════════════════════════════════════════════════════════

function SessionSheetView({ session, month, group, onBack }) {
  const [sheet,      setSheet]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [savingId,   setSavingId]   = useState(null);
  const [payAmounts, setPayAmounts] = useState({});
  const [payingId,   setPayingId]   = useState(null);
  const [editPayment,setEditPayment]= useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sessionsAPI.getSheet(session._id);
      setSheet(data.sheet || []);
    } catch { toast.error('فشل تحميل الكشف'); }
    finally { setLoading(false); }
  }, [session._id]);

  useEffect(() => { load(); }, [load]);

  const mark = async (studentId, status) => {
    setSavingId(studentId);
    setSheet(prev => prev.map(r => (r.student._id === studentId ? { ...r, status } : r)));
    try {
      await sessionsAPI.submitAttendance(session._id, [{ studentId, status }]);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل حفظ الحضور');
      load();
    } finally { setSavingId(null); }
  };

  const handlePay = async (row) => {
    const amountStr = payAmounts[row.student._id];
    const amount = Number(amountStr);
    if (!amountStr || amount <= 0) { toast.error('أدخل مبلغاً صحيحاً'); return; }
    setPayingId(row.student._id);
    try {
      let paymentId = row.payment.paymentId;
      if (!paymentId) {
        const createdData = await paymentsAPI.create({
          studentId: row.student._id, month: month.name,
          requiredAmount: month.price, groupId: group._id,
        });
        paymentId = createdData.payment._id;
      }
      const data = await paymentsAPI.addInstallment(paymentId, { amount });
      const p = data.payment;
      setSheet(prev => prev.map(r => (r.student._id === row.student._id ? {
        ...r,
        payment: {
          paymentId:       p._id,
          requiredAmount:  p.requiredAmount,
          paidAmount:      p.paidAmount,
          remainingAmount: Math.max(0, p.requiredAmount - p.paidAmount),
          isPaid:          p.paidAmount >= p.requiredAmount,
        },
      } : r)));
      setPayAmounts(prev => ({ ...prev, [row.student._id]: '' }));
      toast.success('تم تسجيل الدفعة ✓');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل تسجيل الدفعة');
    } finally { setPayingId(null); }
  };

  const presentCount = sheet.filter(r => r.status === 'present').length;
  const absentCount  = sheet.filter(r => r.status === 'absent').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}><ChevronRight className="h-4 w-4" />الحصص</Button>
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-lg truncate">{session.name}</h3>
          <p className="text-xs text-muted-foreground">{month.name} — {formatDateAr(session.date)}</p>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm shrink-0">
          <span className="flex items-center gap-1 bg-green-500/10 text-green-600 rounded-lg px-2.5 py-1 font-bold"><Check className="h-3.5 w-3.5" />{presentCount}</span>
          <span className="flex items-center gap-1 bg-red-500/10 text-red-600 rounded-lg px-2.5 py-1 font-bold"><X className="h-3.5 w-3.5" />{absentCount}</span>
        </div>
      </div>

      {loading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}

      {!loading && sheet.length === 0 && (
        <div className="text-center py-14 bg-card border rounded-2xl border-dashed">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">لا يوجد طلاب في هذه المجموعة</p>
        </div>
      )}

      {!loading && sheet.length > 0 && (
        <Card className="border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">الطالب</th>
                  <th className="px-3 py-2.5">ID</th>
                  <th className="px-3 py-2.5 text-center">حضور</th>
                  <th className="px-3 py-2.5 text-center">غياب</th>
                  <th className="px-3 py-2.5">دفع</th>
                  <th className="px-3 py-2.5">باقي</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sheet.map((row, i) => {
                  const isPresent = row.status === 'present';
                  const isAbsent  = row.status === 'absent';
                  const isPaid    = row.payment.isPaid;
                  const busy      = savingId === row.student._id;
                  return (
                    <tr key={row.student._id} className="hover:bg-muted/20">
                      <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2.5 font-bold">{row.student.name}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{row.student.studentId ?? '—'}</td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          disabled={busy}
                          onClick={() => mark(row.student._id, 'present')}
                          className={`w-9 h-9 rounded-lg inline-flex items-center justify-center transition-all disabled:opacity-50 ${
                            isPresent ? 'bg-green-500 text-white shadow-sm' : 'border border-green-500/30 text-green-600 hover:bg-green-500/10'
                          }`}
                        ><Check className="h-4 w-4 stroke-[2.5]" /></button>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          disabled={busy}
                          onClick={() => mark(row.student._id, 'absent')}
                          className={`w-9 h-9 rounded-lg inline-flex items-center justify-center transition-all disabled:opacity-50 ${
                            isAbsent ? 'bg-red-500 text-white shadow-sm' : 'border border-red-500/30 text-red-600 hover:bg-red-500/10'
                          }`}
                        ><X className="h-4 w-4 stroke-[2.5]" /></button>
                      </td>
                      <td className="px-3 py-2.5">
                        {isPaid ? (
                          <button
                            className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 rounded-lg px-2.5 py-1.5 hover:bg-green-100 transition-colors"
                            onClick={() => setEditPayment({ studentId: row.student._id, studentName: row.student.name })}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> مدفوع بالكامل
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number" min="1" placeholder="المبلغ"
                              value={payAmounts[row.student._id] || ''}
                              onChange={e => setPayAmounts(prev => ({ ...prev, [row.student._id]: e.target.value }))}
                              className="w-24 h-8 text-xs"
                            />
                            <Button
                              size="sm" className="h-8 px-2.5 text-xs gap-1"
                              disabled={payingId === row.student._id}
                              onClick={() => handlePay(row)}
                            >
                              {payingId === row.student._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wallet className="h-3 w-3" />}
                              دفع
                            </Button>
                            {row.payment.paidAmount > 0 && (
                              <button
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => setEditPayment({ studentId: row.student._id, studentName: row.student.name })}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`font-bold text-sm ${row.payment.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {row.payment.remainingAmount} ج.م
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {editPayment && (
        <PaymentEditModal
          studentId={editPayment.studentId}
          studentName={editPayment.studentName}
          monthName={month.name}
          onClose={() => setEditPayment(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function AttendancePage() {
  const [selectedYear,  setSelectedYear]  = useState('');
  const [groups,        setGroups]        = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');

  const [openMonth,   setOpenMonth]   = useState(null);
  const [openSession, setOpenSession] = useState(null);

  useEffect(() => {
    if (!selectedYear) { setGroups([]); return; }
    setLoadingGroups(true);
    groupsAPI.getAll({ year: selectedYear, active: true })
      .then((d) => setGroups(d.groups || []))
      .catch(() => toast.error('فشل تحميل المجموعات'))
      .finally(() => setLoadingGroups(false));
  }, [selectedYear]);

  const handleYearChange = (val) => {
    setSelectedYear(val);
    setSelectedGroup('');
    setOpenMonth(null);
    setOpenSession(null);
  };

  const handleGroupChange = (val) => {
    setSelectedGroup(val);
    setOpenMonth(null);
    setOpenSession(null);
  };

  const groupObj = groups.find(g => g._id === selectedGroup);

  return (
    <>
      <Helmet><title>الحضور والفلوس | نظام المعلم</title></Helmet>

      <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-5" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-br from-card to-muted/30 p-4 sm:p-5 rounded-2xl border shadow-sm">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-1">الحضور والفلوس</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">سجّل حضور الطلاب ومدفوعاتهم لكل مجموعة بسهولة</p>
        </div>

        {/* Filters */}
        <Card className="border shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-bold text-foreground/80">السنة الدراسية</Label>
                <Select value={selectedYear} onValueChange={handleYearChange}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="اختر السنة الدراسية..." /></SelectTrigger>
                  <SelectContent>
                    {ACADEMIC_YEARS.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm font-bold text-foreground/80">المجموعة</Label>
                <Select value={selectedGroup} onValueChange={handleGroupChange} disabled={!selectedYear || loadingGroups}>
                  <SelectTrigger className="h-11 disabled:opacity-50"><SelectValue placeholder={loadingGroups ? 'جاري التحميل...' : 'اختر المجموعة...'} /></SelectTrigger>
                  <SelectContent>
                    {groups.map(g => <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty states */}
        {!selectedYear && (
          <div className="text-center p-10 sm:p-14 bg-card border rounded-2xl border-dashed shadow-sm">
            <ClipboardCheck className="h-10 sm:h-12 w-10 sm:w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <h3 className="text-sm sm:text-lg font-bold text-muted-foreground">ابدأ باختيار السنة الدراسية</h3>
          </div>
        )}

        {selectedYear && !selectedGroup && !loadingGroups && (
          <div className="text-center p-10 sm:p-14 bg-card border rounded-2xl border-dashed shadow-sm">
            <Users className="h-10 sm:h-12 w-10 sm:w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <h3 className="text-sm sm:text-lg font-bold text-muted-foreground">اختر المجموعة للمتابعة</h3>
          </div>
        )}

        {/* Levels 3 → 5 */}
        {selectedGroup && groupObj && !openMonth && (
          <MonthsView group={groupObj} onOpenMonth={setOpenMonth} />
        )}
        {selectedGroup && groupObj && openMonth && !openSession && (
          <SessionsView month={openMonth} group={groupObj} onBack={() => setOpenMonth(null)} onOpenSession={setOpenSession} />
        )}
        {selectedGroup && groupObj && openMonth && openSession && (
          <SessionSheetView session={openSession} month={openMonth} group={groupObj} onBack={() => setOpenSession(null)} />
        )}
      </div>
    </>
  );
}