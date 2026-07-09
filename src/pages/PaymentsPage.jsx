import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import {
  CreditCard, Plus, Edit, Trash2, History, CheckCircle,
  AlertCircle, Loader2, X, Save, TrendingUp, Wallet, Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button }  from '@/components/ui/button';
import { Badge }   from '@/components/ui/badge';
import { Input }   from '@/components/ui/input';
import { Label }   from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { paymentsAPI, groupsAPI } from '@/api/services';
import { toast } from 'sonner';

const ACADEMIC_YEARS = [
  { value: 'first-prep',  label: 'الصف الأول الإعدادي'  },
  { value: 'second-prep', label: 'الصف الثاني الإعدادي' },
  { value: 'third-prep',  label: 'الصف الثالث الإعدادي' },
  { value: 'first-sec',   label: 'الصف الأول الثانوي'   },
  { value: 'second-sec',  label: 'الصف الثاني الثانوي'  },
];

// Free-text period — no fixed months list

// ── Installment Modal ─────────────────────────────────────────────────────────
function InstallmentModal({ paymentId, installment, onClose, onSaved }) {
  const isEdit = !!installment;
  const [amount, setAmount] = useState(installment?.amount || '');
  const [note,   setNote]   = useState(installment?.note   || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) { toast.error('أدخل مبلغاً صحيحاً'); return; }
    setSaving(true);
    try {
      let data;
      if (isEdit) {
        data = await paymentsAPI.updateInstallment(paymentId, installment._id, { amount: Number(amount), note: note || null });
        toast.success('تم تعديل الدفعة');
      } else {
        data = await paymentsAPI.addInstallment(paymentId, { amount: Number(amount), note: note || null });
        toast.success('تم تسجيل الدفعة ✓');
      }
      onSaved(data.payment);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشلت العملية');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold">{isEdit ? 'تعديل الدفعة' : 'تسجيل دفعة جديدة'}</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>المبلغ المدفوع (ج.م) <span className="text-destructive">*</span></Label>
            <Input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="مثال: 500" autoFocus className="text-lg font-bold h-12" />
          </div>
          <div className="space-y-1.5">
            <Label>ملاحظة (اختياري)</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="مثال: دفع نقداً" />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'جاري الحفظ...' : 'تسجيل الدفعة'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Create Payment Modal ──────────────────────────────────────────────────────
function CreatePaymentModal({ student, groupMonthlyFee, onClose, onSaved }) {
  const [period,   setPeriod]   = useState('');
  const [required, setRequired] = useState(groupMonthlyFee || student?.group?.monthlyFee || '');
  const [saving,   setSaving]   = useState(false);

  const handleSave = async () => {
    if (!period.trim()) { toast.error('اكتب اسم الفترة أو الشهر'); return; }
    if (!required || Number(required) <= 0) { toast.error('أدخل المبلغ المطلوب'); return; }
    setSaving(true);
    try {
      const data = await paymentsAPI.create({ studentId: student._id, month: period.trim(), requiredAmount: Number(required), groupId: student.group?._id });
      toast.success('تم إنشاء السجل ✓');
      onSaved(data.payment);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشلت العملية');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="font-bold">إضافة شهر جديد</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{student.name}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>اسم الفترة / الشهر <span className="text-destructive">*</span></Label>
            <Input
              value={period}
              onChange={e => setPeriod(e.target.value)}
              placeholder="مثال: شهر 7 — أو — مراجعة نهائية — أو — دفعة أولى"
              autoFocus
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">اكتب أي اسم تريده للفترة</p>
          </div>
          <div className="space-y-1.5">
            <Label>
              المبلغ المطلوب (ج.م) <span className="text-destructive">*</span>
              {groupMonthlyFee > 0 && (
                <span className="text-xs text-green-600 mr-1">— سعر المجموعة: {groupMonthlyFee} ج.م</span>
              )}
            </Label>
            <Input
              type="number" min="0" value={required}
              onChange={e => setRequired(e.target.value)}
              placeholder="مثال: 1200"
              className="text-lg font-bold h-12"
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            إضافة
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Period Name Modal ────────────────────────────────────────────────────
function EditPeriodModal({ payment, onClose, onSaved }) {
  const [name, setName] = useState(payment.month || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('اكتب اسم الفترة'); return; }
    setSaving(true);
    try {
      await paymentsAPI.updatePeriod(payment._id, name.trim());
      toast.success('تم تعديل اسم الفترة ✓');
      onSaved();
    } catch (err) { 
      toast.error(err?.response?.data?.message || 'فشل التعديل'); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold">تعديل اسم الفترة</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-5 space-y-3">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: شهر 8 — أو — مراجعة" autoFocus className="h-11" />
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


// ── Student Payment Card ──────────────────────────────────────────────────────
function StudentPaymentCard({ studentData, groupMonthlyFee, onRefresh, onDeleteInstallment, onAddMonth, onUpdateMonth }) {
  const { student, totalRequired, totalPaid, totalRemaining, months } = studentData;
  const [instModal,   setInstModal]   = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [editPeriod,  setEditPeriod]  = useState(null); // payment object to rename

  const isPaid = totalRemaining === 0 && totalRequired > 0;

  const handleDeleteInstallment = async (paymentId, instId) => {
    if (!window.confirm('هل تريد حذف هذه الدفعة؟')) return;
    try {
      await paymentsAPI.deleteInstallment(paymentId, instId);
      toast.success('تم حذف الدفعة');
      // Update local state only — no full reload, no scroll reset
      onDeleteInstallment(student._id, paymentId, instId);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل الحذف');
    }
  };

  return (
    <AccordionItem value={student._id} className="bg-card border rounded-xl overflow-hidden shadow-sm mb-3">
      <AccordionTrigger className="px-4 sm:px-5 py-4 hover:no-underline hover:bg-muted/30">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full pr-2">
          {/* Name + status icon */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
              isPaid ? 'bg-green-100' : totalRemaining > 0 ? 'bg-red-100' : 'bg-muted'
            }`}>
              {isPaid
                ? <CheckCircle className="h-5 w-5 text-green-600" />
                : totalRemaining > 0
                ? <AlertCircle className="h-5 w-5 text-red-500" />
                : <Clock className="h-5 w-5 text-muted-foreground" />
              }
            </div>
            <div className="text-right min-w-0">
              <p className="font-bold truncate">{student.name}</p>
              <p className="text-xs font-mono text-muted-foreground">{student.codePlain}</p>
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex gap-2 shrink-0">
            <div className="text-center bg-muted/60 rounded-lg px-3 py-1.5 min-w-[64px]">
              <p className="text-[10px] text-muted-foreground leading-none mb-0.5">المطلوب</p>
              <p className="font-bold text-sm">{totalRequired.toLocaleString()}</p>
            </div>
            <div className="text-center bg-green-50 rounded-lg px-3 py-1.5 min-w-[64px]">
              <p className="text-[10px] text-green-700/70 leading-none mb-0.5">المدفوع</p>
              <p className="font-bold text-sm text-green-700">{totalPaid.toLocaleString()}</p>
            </div>
            <div className={`text-center rounded-lg px-3 py-1.5 min-w-[64px] ${totalRemaining > 0 ? 'bg-red-50' : 'bg-muted/60'}`}>
              <p className={`text-[10px] leading-none mb-0.5 ${totalRemaining > 0 ? 'text-red-700/70' : 'text-muted-foreground'}`}>المتبقي</p>
              <p className={`font-bold text-sm ${totalRemaining > 0 ? 'text-red-700' : ''}`}>{totalRemaining.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="bg-muted/10 border-t">
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold flex items-center gap-2 text-sm">
              <History className="h-4 w-4 text-primary" /> سجل الدفعات الشهرية
            </h4>
            <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setCreateModal(true)}>
              <Plus className="h-3.5 w-3.5" /> شهر جديد
            </Button>
          </div>

          {months.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-xl">
              لا توجد سجلات — أضف شهراً جديداً
            </div>
          ) : (
            <div className="space-y-3">
              {months.map(payment => {
                const remaining = payment.remainingAmount ?? (payment.requiredAmount - payment.paidAmount);
                const paidPct = payment.requiredAmount > 0 ? Math.min(100, Math.round(payment.paidAmount / payment.requiredAmount * 100)) : 0;
                return (
                  <div key={payment._id} className="bg-background border rounded-xl overflow-hidden">
                    {/* Month header */}
                    <div className="px-4 py-3 bg-muted/30 border-b">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm">{payment.month}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs">
                            <span className="text-green-600 font-bold">{payment.paidAmount.toLocaleString()}</span>
                            <span className="text-muted-foreground"> / {payment.requiredAmount.toLocaleString()} ج.م</span>
                          </span>
                          {remaining > 0 && (
                            <span className="text-xs font-bold text-red-600 bg-red-50 rounded-full px-2 py-0.5">
                              متبقي: {remaining.toLocaleString()}
                            </span>
                          )}
                          {remaining === 0 && payment.requiredAmount > 0 && (
                            <span className="text-xs font-bold text-green-600 bg-green-50 rounded-full px-2 py-0.5">
                              ✓ مسدد
                            </span>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            onClick={() => setEditPeriod(payment)} title="تعديل اسم الفترة">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1 h-7 text-xs"
                            onClick={() => setInstModal({ paymentId: payment._id })}>
                            <Plus className="h-3 w-3" /> دفعة
                          </Button>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${paidPct === 100 ? 'bg-green-500' : 'bg-primary'}`}
                          style={{ width: `${paidPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Installments */}
                    {payment.installments?.length > 0 ? (
                      <table className="w-full text-sm text-right">
                        <thead className="bg-muted/20 text-xs text-muted-foreground">
                          <tr>
                            <th className="px-4 py-2">التاريخ</th>
                            <th className="px-4 py-2">المبلغ</th>
                            <th className="px-4 py-2">ملاحظة</th>
                            <th className="px-4 py-2 text-left">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {payment.installments.map(inst => (
                            <tr key={inst._id} className="hover:bg-muted/20">
                              <td className="px-4 py-2.5 text-xs text-muted-foreground">
                                {new Date(inst.paidAt).toLocaleDateString('ar-EG')}
                              </td>
                              <td className="px-4 py-2.5 font-bold text-green-600">+ {inst.amount.toLocaleString()} ج.م</td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground">{inst.note || '—'}</td>
                              <td className="px-4 py-2.5 text-left">
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-primary"
                                    onClick={() => setInstModal({ paymentId: payment._id, installment: inst })}>
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-destructive"
                                    onClick={() => handleDeleteInstallment(payment._id, inst._id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">لا توجد دفعات مسجلة — اضغط "+ دفعة"</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AccordionContent>

      {instModal && (
        <InstallmentModal
          paymentId={instModal.paymentId}
          installment={instModal.installment}
          onClose={() => setInstModal(null)}
          onSaved={(payment) => {
            setInstModal(null);
            // Update local state only — no full reload, no scroll/accordion reset
            // (نفس سلوك حذف الشهر وإضافة الشهر بالظبط)
            if (payment) onUpdateMonth(student._id, payment);
            else onRefresh();
          }}
        />
      )}
      {createModal && (
        <CreatePaymentModal
          student={student}
          groupMonthlyFee={groupMonthlyFee}
          onClose={() => setCreateModal(false)}
          onSaved={(payment) => {
            setCreateModal(false);
            // Update local state only — no full reload, no scroll/accordion reset
            // (نفس سلوك حذف الدفعة بالظبط)
            if (payment) onAddMonth(student._id, payment);
            else onRefresh();
          }}
        />
      )}
      {editPeriod && (
        <EditPeriodModal
          payment={editPeriod}
          onClose={() => setEditPeriod(null)}
          onSaved={() => { setEditPeriod(null); onRefresh(); }}
        />
      )}
    </AccordionItem>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const [selectedYear,  setSelectedYear]  = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups,        setGroups]        = useState([]);
  const [payments,      setPayments]      = useState({ students: [], summary: {} });
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    if (!selectedYear) { setGroups([]); return; }
    groupsAPI.getAll({ year: selectedYear, active: true })
      .then(d => setGroups(d.groups || []))
      .catch(() => toast.error('فشل تحميل المجموعات'));
  }, [selectedYear]);

  const load = async () => {
    if (!selectedYear) return;
    setLoading(true); setError(null);
    try {
      const d = await paymentsAPI.getGroup({ year: selectedYear, group: selectedGroup || undefined });
      setPayments(d);
    } catch { setError('فشل تحميل المدفوعات'); }
    finally { setLoading(false); }
  };

  // Optimistic local delete — removes the installment from state without reload
  const handleDeleteInstallment = (studentId, paymentId, instId) => {
    setPayments(prev => {
      const students = prev.students.map(s => {
        if (s.student._id !== studentId) return s;
        const months = s.months.map(p => {
          if (p._id !== paymentId) return p;
          const installments = (p.installments || []).filter(i => i._id !== instId);
          const totalPaidMonth = installments.reduce((sum, i) => sum + (i.amount || 0), 0);
          return { ...p, installments, totalPaid: totalPaidMonth };
        });
        const totalPaid = months.reduce((sum, p) => sum + p.totalPaid, 0);
        const totalRemaining = Math.max(0, s.totalRequired - totalPaid);
        return { ...s, months, totalPaid, totalRemaining };
      });
      return { ...prev, students };
    });
  };

  // Optimistic local add — appends the new month/payment record to state
  // without a full reload (same behavior as delete: no refresh, no scroll reset)
  const handleAddMonth = (studentId, payment) => {
    setPayments(prev => {
      const students = prev.students.map(s => {
        if (s.student._id !== studentId) return s;
        const months = [...s.months, payment];
        const totalRequired = months.reduce((sum, p) => sum + (p.requiredAmount || 0), 0);
        const totalPaid = months.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
        const totalRemaining = Math.max(0, totalRequired - totalPaid);
        return { ...s, months, totalRequired, totalPaid, totalRemaining };
      });
      const summary = {
        ...prev.summary,
        totalRequired: students.reduce((s, r) => s + r.totalRequired, 0),
        totalPaid:     students.reduce((s, r) => s + r.totalPaid, 0),
        totalRemaining:students.reduce((s, r) => s + r.totalRemaining, 0),
        fullyPaid:     students.filter(r => r.totalRemaining === 0 && r.totalRequired > 0).length,
      };
      return { ...prev, students, summary };
    });
  };

  // Optimistic local update — replaces one month/payment record with the fresh
  // version returned by the server after adding/editing an installment,
  // without a full reload (same behavior as delete/add month: no refresh, no scroll reset)
  const handleUpdateMonth = (studentId, payment) => {
    setPayments(prev => {
      const students = prev.students.map(s => {
        if (s.student._id !== studentId) return s;
        const months = s.months.map(p => (p._id === payment._id ? payment : p));
        const totalRequired = months.reduce((sum, p) => sum + (p.requiredAmount || 0), 0);
        const totalPaid = months.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
        const totalRemaining = Math.max(0, totalRequired - totalPaid);
        return { ...s, months, totalRequired, totalPaid, totalRemaining };
      });
      const summary = {
        ...prev.summary,
        totalRequired: students.reduce((s, r) => s + r.totalRequired, 0),
        totalPaid:     students.reduce((s, r) => s + r.totalPaid, 0),
        totalRemaining:students.reduce((s, r) => s + r.totalRemaining, 0),
        fullyPaid:     students.filter(r => r.totalRemaining === 0 && r.totalRequired > 0).length,
      };
      return { ...prev, students, summary };
    });
  };

  useEffect(() => { if (selectedYear) load(); }, [selectedYear, selectedGroup]);

  const { students = [], summary = {} } = payments;

  const selectedGroupData = groups.find(g => g._id === selectedGroup);
  const groupMonthlyFee = selectedGroupData?.monthlyFee || 0;

  // Derived stats
  const paidCount    = students.filter(s => s.totalRemaining === 0 && s.totalRequired > 0).length;
  const pendingCount = students.filter(s => s.totalRemaining > 0).length;

  return (
    <>
      <Helmet><title>المدفوعات | نظام المعلم</title></Helmet>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-card p-5 rounded-2xl border shadow-sm">
          <h2 className="text-2xl font-extrabold mb-0.5">المدفوعات والأقساط</h2>
          <p className="text-muted-foreground text-sm">تتبع مدفوعات الطلاب وإدارة الأقساط الشهرية</p>
        </div>

        {/* Filters */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">السنة الدراسية</Label>
                <Select value={selectedYear} onValueChange={v => { setSelectedYear(v); setSelectedGroup(''); }}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="اختر السنة..." /></SelectTrigger>
                  <SelectContent>
                    {ACADEMIC_YEARS.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">المجموعة</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup} disabled={!selectedYear}>
                  <SelectTrigger className="h-11 disabled:opacity-50"><SelectValue placeholder="كل المجموعات" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">كل المجموعات</SelectItem>
                    {groups.map(g => (
                      <SelectItem key={g._id} value={g._id}>
                        <div className="flex items-center gap-2">
                          <span>{g.name}</span>
                          {g.monthlyFee > 0 && (
                            <span className="text-xs text-green-600 font-semibold">{g.monthlyFee} ج.م/شهر</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Group fee info banner */}
            {selectedGroupData && groupMonthlyFee > 0 && (
              <div className="mt-3 flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5">
                <Wallet className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">
                  سعر اشتراك <strong>{selectedGroupData.name}</strong>:
                  <strong className="text-primary mr-1">{groupMonthlyFee.toLocaleString()} ج.م / شهر</strong>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {!selectedYear && (
          <div className="text-center p-14 bg-card border rounded-2xl border-dashed">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-bold text-muted-foreground">اختر السنة الدراسية لعرض المدفوعات</h3>
          </div>
        )}

        {loading && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive flex gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />{error}
          </div>
        )}

        {!loading && !error && selectedYear && (
          <>
            {/* Summary cards */}
            {(summary.totalStudents > 0 || students.length > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-muted/60 to-muted/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">إجمالي المطلوب</p>
                    <p className="text-xl font-black">{(summary.totalRequired || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">ج.م</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-green-700/70 mb-1">المدفوع</p>
                    <p className="text-xl font-black text-green-700">{(summary.totalPaid || 0).toLocaleString()}</p>
                    <p className="text-xs text-green-700/70">ج.م</p>
                  </CardContent>
                </Card>
                <Card className={`border-0 shadow-sm bg-gradient-to-br ${(summary.totalRemaining || 0) > 0 ? 'from-red-50 to-red-100/50' : 'from-muted/60 to-muted/30'}`}>
                  <CardContent className="p-4 text-center">
                    <p className={`text-xs mb-1 ${(summary.totalRemaining || 0) > 0 ? 'text-red-700/70' : 'text-muted-foreground'}`}>المتبقي</p>
                    <p className={`text-xl font-black ${(summary.totalRemaining || 0) > 0 ? 'text-red-700' : ''}`}>
                      {(summary.totalRemaining || 0).toLocaleString()}
                    </p>
                    <p className={`text-xs ${(summary.totalRemaining || 0) > 0 ? 'text-red-700/70' : 'text-muted-foreground'}`}>ج.م</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-gradient-to-br from-muted/60 to-muted/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">حالة الطلاب</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-bold text-green-600">{paidCount} ✓</span>
                      <span className="text-muted-foreground text-xs">/</span>
                      <span className="text-sm font-bold text-red-500">{pendingCount} ✗</span>
                    </div>
                    <p className="text-xs text-muted-foreground">مسدد / متأخر</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {students.length === 0 ? (
              <div className="text-center py-14 bg-card border rounded-2xl border-dashed">
                <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground font-medium">لا يوجد طلاب في هذه المجموعة</p>
              </div>
            ) : (
              <>
                {/* Filter tabs: All / Pending / Paid */}
                <Accordion type="multiple" defaultValue={students.map(s => s.student._id)}>
                  {students.map(s => (
                    <StudentPaymentCard
                      key={s.student._id}
                      studentData={s}
                      groupMonthlyFee={groupMonthlyFee}
                      onRefresh={load}
                      onDeleteInstallment={handleDeleteInstallment}
                      onAddMonth={handleAddMonth}
                      onUpdateMonth={handleUpdateMonth}
                    />
                  ))}
                </Accordion>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}