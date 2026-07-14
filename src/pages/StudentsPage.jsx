import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import {
  Plus, Edit, KeyRound, Users, Ban, CheckCircle2, Trash2,
  MoreVertical, GraduationCap, Loader2, AlertCircle, X, Save,
  Search, Copy, Check, ShieldCheck
} from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Badge }    from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { studentsAPI, groupsAPI } from '@/api/services';
import { toast } from 'sonner';

const ACADEMIC_YEARS = [
  { value: 'first-prep',  label: 'الصف الأول الإعدادي'  },
  { value: 'second-prep', label: 'الصف الثاني الإعدادي' },
  { value: 'third-prep',  label: 'الصف الثالث الإعدادي' },
  { value: 'first-sec',   label: 'الصف الأول الثانوي'   },
  { value: 'second-sec',  label: 'الصف الثاني الثانوي'  },
  { value: 'third-sec',   label: 'الصف الثالث الثانوي'  },
];

const YEAR_LABEL = Object.fromEntries(ACADEMIC_YEARS.map(y => [y.value, y.label]));

// ── Code Display Modal (after adding new student) ─────────────────────────────
function NewStudentCodeModal({ studentName, code, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).catch(() => {});
    } else {
      try { 
        const t = document.createElement('textarea');
        t.value = code;
        document.body.appendChild(t);
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t); 
      } catch {}
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-2">
            <ShieldCheck className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="font-extrabold text-lg">تم إضافة الطالب بنجاح!</h3>
          <p className="text-muted-foreground text-sm">كود دخول الطالب <strong>{studentName}</strong></p>
        </div>

        <div className="bg-primary/10 border-2 border-primary/30 rounded-2xl p-5 text-center space-y-2">
          <p className="text-xs text-muted-foreground font-medium">كود الدخول</p>
          <p className="text-4xl font-black font-mono tracking-widest text-primary">{code}</p>
          <p className="text-xs text-orange-600 font-semibold">⚠ احفظ هذا الكود وسلّمه للطالب — لن يظهر مرة أخرى</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="gap-2" onClick={copy}>
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'تم النسخ!' : 'نسخ الكود'}
          </Button>
          <Button className="gap-2" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Student Form Modal ────────────────────────────────────────────────────────
function StudentModal({ student, groups, onClose, onSaved }) {
  const isEdit = !!student;
  const [form, setForm] = useState({
    name:         student?.name         || '',
    academicYear: student?.academicYear || '',
    group:        student?.group?._id   || '',
    phone:        student?.phone        || '',
    parentPhone:  student?.parentPhone  || '',
    studentId:    student?.studentId ?? '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filteredGroups = useMemo(
    () => groups.filter(g => g.academicYear === form.academicYear),
    [groups, form.academicYear]
  );

  const handleYearChange = (v) => { set('academicYear', v); set('group', ''); };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('اسم الطالب مطلوب');
      return;
    }
    if (!form.academicYear) {
      toast.error('السنة الدراسية مطلوبة');
      return;
    }
    if (!form.group) {
      toast.error('يجب اختيار مجموعة للطالب');
      return;
    }
    if (!isEdit && String(form.studentId).trim() === '') {
      toast.error('ID الطالب مطلوب');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        academicYear: form.academicYear,
        group:       form.group,
        phone:       form.phone.trim() || null,
        parentPhone: form.parentPhone.trim() || null,
      };
      if (!isEdit) payload.studentId = form.studentId;
      if (isEdit) {
        await studentsAPI.update(student._id, payload);
        toast.success('تم تعديل بيانات الطالب');
        onSaved();
      } else {
        const data = await studentsAPI.create(payload);
        onSaved(data.plainCode, form.name.trim());
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشلت العملية');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-lg">{isEdit ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>اسم الطالب <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="الاسم رباعي" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>ID {!isEdit && <span className="text-destructive">*</span>}</Label>
            {isEdit ? (
              <Input value={form.studentId} disabled className="font-mono bg-muted/40" />
            ) : (
              <>
                <Input
                  value={form.studentId}
                  onChange={e => set('studentId', e.target.value)}
                  placeholder="اكتب ID الطالب"
                  inputMode="numeric"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">لازم يكون فريد داخل نفس السنة الدراسية، ومش هينفع تغييره بعد الحفظ</p>
              </>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>السنة الدراسية <span className="text-destructive">*</span></Label>
            <Select value={form.academicYear} onValueChange={handleYearChange}>
              <SelectTrigger><SelectValue placeholder="اختر السنة..." /></SelectTrigger>
              <SelectContent>
                {ACADEMIC_YEARS.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>
              المجموعة <span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground mr-1">(إجباري)</span>
            </Label>
            <Select value={form.group} onValueChange={v => set('group', v)} disabled={!form.academicYear}>
              <SelectTrigger className={!form.group && form.academicYear ? 'border-orange-400 ring-1 ring-orange-400/30' : ''}>
                <SelectValue placeholder={!form.academicYear ? 'اختر السنة أولاً' : 'اختر المجموعة...'} />
              </SelectTrigger>
              <SelectContent>
                {filteredGroups.length === 0 ? (
                  <div className="text-center py-3 text-sm text-muted-foreground">لا توجد مجموعات لهذه السنة</div>
                ) : (
                  filteredGroups.map(g => (
                    <SelectItem key={g._id} value={g._id}>
                      <div className="flex items-center gap-2">
                        <span>{g.name}</span>
                        {g.monthlyFee > 0 && (
                          <span className="text-xs text-muted-foreground">({g.monthlyFee} ج.م/شهر)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!form.group && form.academicYear && (
              <p className="text-xs text-orange-500">⚠ يجب اختيار مجموعة</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>هاتف الطالب</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label>هاتف ولي الأمر</Label>
              <Input value={form.parentPhone} onChange={e => set('parentPhone', e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Reset Code Modal ──────────────────────────────────────────────────────────
function ResetCodeModal({ student, onClose }) {
  const [loading,   setLoading]   = useState(false);
  const [newCode,   setNewCode]   = useState(null);
  const [copied,    setCopied]    = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      const data = await studentsAPI.resetCode(student._id);
      setNewCode(data.plainCode);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل إعادة تعيين الكود');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(newCode).catch(() => {});
    } else {
      try { 
        const t = document.createElement('textarea');
        t.value = newCode;
        document.body.appendChild(t);
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t); 
      } catch {}
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={!newCode ? onClose : undefined}>
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> تغيير كود الدخول</h3>

        {!newCode ? (
          <>
            <p className="text-muted-foreground text-sm">
              سيتم إنشاء كود جديد للطالب <strong>{student.name}</strong>.
              الكود القديم سيتوقف عن العمل فوراً.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>إلغاء</Button>
              <Button className="flex-1 gap-2" onClick={handleReset} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                تغيير الكود
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center space-y-2">
              <p className="text-xs text-muted-foreground">الكود الجديد للطالب</p>
              <p className="text-3xl font-black font-mono tracking-widest text-primary">{newCode}</p>
              <p className="text-xs text-orange-600 font-semibold">احفظ هذا الكود وسلّمه للطالب — لن يظهر مرة أخرى</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={copy}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {copied ? 'تم النسخ' : 'نسخ الكود'}
              </Button>
              <Button className="flex-1" onClick={onClose}>إغلاق</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Confirm Delete ────────────────────────────────────────────────────────────
function ConfirmDelete({ student, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    try {
      await studentsAPI.remove(student._id);
      toast.success('تم حذف الطالب');
      onDeleted();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل الحذف');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg text-destructive">تأكيد الحذف</h3>
        <p className="text-muted-foreground">هل تريد حذف الطالب <strong>{student.name}</strong>؟ البيانات التاريخية ستُحفظ.</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>إلغاء</Button>
          <Button variant="destructive" className="flex-1 gap-2" onClick={handle} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            حذف
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentsPage() {
  const [students,  setStudents]  = useState([]);
  const [groups,    setGroups]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState(null); // null | 'add' | { student }
  const [resetting, setResetting] = useState(null);
  const [deleting,  setDeleting]  = useState(null);
  const [newCodeInfo, setNewCodeInfo] = useState(null); // { code, name }

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // ملحوظة: الـ backend بيحدد أقصى limit للصفحة الواحدة (100)، فمينفعش
      // نجيب كل الطلاب بطلب واحد لو عددهم أكبر من كده. عشان كده بنلف على
      // كل الصفحات ونجمعها، عشان صفحة الطلاب تعرض كل الطلاب فعلاً
      // (وده اللي كان بيسبب اختفاء الطالب الجديد لما يتخطى العدد الإجمالي الـ 100).
      let allStudents = [];
      let page = 1;
      let totalPages = 1;
      do {
        const sData = await studentsAPI.getAll({ limit: 100, page });
        allStudents = allStudents.concat(sData.data || []);
        totalPages = sData.pagination?.pages || 1;
        page += 1;
      } while (page <= totalPages);

      const gData = await groupsAPI.getAll();
      setStudents(allStudents);
      setGroups(gData.groups || []);
    } catch {
      setError('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (student) => {
    try {
      await studentsAPI.toggleStatus(student._id);
      toast.success(student.isActive ? 'تم تعليق الحساب' : 'تم تفعيل الحساب');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشلت العملية');
    }
  };

  // Filter + group
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? students.filter(s => s.name.toLowerCase().includes(q) || s.codePlain?.toLowerCase().includes(q))
      : students;
  }, [students, search]);

  const byYear = useMemo(() => filtered.reduce((acc, s) => {
    const yr = s.academicYear || 'unknown';
    if (!acc[yr]) acc[yr] = {};
    const grp = s.group?.name || 'بدون مجموعة';
    if (!acc[yr][grp]) acc[yr][grp] = [];
    acc[yr][grp].push(s);
    return acc;
  }, {}), [filtered]);

  const handleStudentSaved = (plainCode, name) => {
    setModal(null);
    load();
    if (plainCode) {
      setNewCodeInfo({ code: plainCode, name });
    }
  };

  return (
    <>
      <Helmet><title>إدارة الطلاب | نظام المعلم</title></Helmet>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
          <div>
            <h2 className="text-2xl font-extrabold mb-1">إدارة الطلاب</h2>
            <p className="text-muted-foreground text-sm">
              {loading ? '...' : `${students.length} طالب مسجل`}
            </p>
          </div>
          <Button className="gap-2 shadow-md whitespace-nowrap" onClick={() => setModal('add')}>
            <Plus className="h-5 w-5" /> إضافة طالب جديد
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pr-9"
            placeholder="بحث باسم الطالب أو الكود..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
            <Button variant="ghost" size="sm" className="mr-auto" onClick={load}>إعادة المحاولة</Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && students.length === 0 && (
          <div className="text-center py-20 bg-card border rounded-2xl border-dashed">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-bold">لا يوجد طلاب بعد</h3>
            <p className="text-muted-foreground text-sm mt-1">ابدأ بإضافة أول طالب</p>
          </div>
        )}

        {/* Students by year → group */}
        {!loading && !error && (
          <div className="space-y-6">
            {ACADEMIC_YEARS.filter(y => byYear[y.value]).map(year => (
              <section key={year.value} className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                <div className="bg-muted/30 px-6 py-4 border-b flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">{year.label}</h3>
                  <Badge variant="secondary" className="mr-auto">
                    {Object.values(byYear[year.value]).flat().length} طالب
                  </Badge>
                </div>

                <div className="p-4 sm:p-6">
                  <Accordion type="multiple" className="space-y-4">
                    {Object.entries(byYear[year.value]).map(([groupName, grpStudents]) => (
                      <AccordionItem key={groupName} value={groupName} className="border rounded-xl bg-background overflow-hidden">
                        <AccordionTrigger className="px-5 hover:no-underline hover:bg-muted/40 transition-colors">
                          <div className="flex items-center justify-between w-full pr-4">
                            <span className="font-bold text-lg">{groupName}</span>
                            <Badge variant="outline">{grpStudents.length} طلاب</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-0 border-t bg-muted/10">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                              <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                  <th className="px-6 py-3 font-semibold">اسم الطالب</th>
                                  <th className="px-6 py-3 font-semibold">ID</th>
                                  <th className="px-6 py-3 font-semibold">الكود</th>
                                  <th className="px-6 py-3 font-semibold">الحالة</th>
                                  <th className="px-6 py-3 font-semibold text-left">إجراءات</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/50">
                                {grpStudents.map(student => (
                                  <tr key={student._id} className="hover:bg-background transition-colors">
                                    <td className="px-6 py-4 font-bold">{student.name}</td>
                                    <td className="px-6 py-4 font-mono text-muted-foreground text-xs">{student.studentId ?? '—'}</td>
                                    <td className="px-6 py-4 font-mono text-muted-foreground text-xs">{student.codePlain}</td>
                                    <td className="px-6 py-4">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                        student.isActive
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        {student.isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                                        {student.isActive ? 'نشط' : 'معطل'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-left">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                          <DropdownMenuLabel>خيارات الطالب</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setModal({ student })}>
                                            <Edit className="h-4 w-4" /> تعديل البيانات
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setResetting(student)}>
                                            <KeyRound className="h-4 w-4" /> تغيير الكود
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            className={`gap-2 cursor-pointer ${student.isActive ? 'text-orange-600 focus:text-orange-600' : 'text-green-600 focus:text-green-600'}`}
                                            onClick={() => handleToggle(student)}
                                          >
                                            {student.isActive ? <><Ban className="h-4 w-4" /> تعليق الحساب</> : <><CheckCircle2 className="h-4 w-4" /> تفعيل الحساب</>}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive cursor-pointer" onClick={() => setDeleting(student)}>
                                            <Trash2 className="h-4 w-4" /> حذف نهائي
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'add' && (
        <StudentModal
          groups={groups}
          onClose={() => setModal(null)}
          onSaved={handleStudentSaved}
        />
      )}
      {modal?.student && (
        <StudentModal
          student={modal.student}
          groups={groups}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
      {resetting && <ResetCodeModal student={resetting} onClose={() => { setResetting(null); load(); }} />}
      {deleting  && <ConfirmDelete  student={deleting}  onClose={() => setDeleting(null)} onDeleted={() => { setDeleting(null); load(); }} />}
      {newCodeInfo && (
        <NewStudentCodeModal
          studentName={newCodeInfo.name}
          code={newCodeInfo.code}
          onClose={() => setNewCodeInfo(null)}
        />
      )}
    </>
  );
}