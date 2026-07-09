import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import {
  Check, X, Save, ClipboardCheck, Loader2, AlertCircle,
  Calendar, Users, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { groupsAPI, attendanceAPI } from '@/api/services';

const ACADEMIC_YEARS = [
  { value: 'first-prep',  label: 'الصف الأول الإعدادي'  },
  { value: 'second-prep', label: 'الصف الثاني الإعدادي' },
  { value: 'third-prep',  label: 'الصف الثالث الإعدادي' },
  { value: 'first-sec',   label: 'الصف الأول الثانوي'   },
  { value: 'second-sec',  label: 'الصف الثاني الثانوي'  },
];

const toDateStr = (d) => d.toISOString().slice(0, 10);
const today = toDateStr(new Date());

function formatDateAr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function AttendancePage() {
  const [selectedYear,  setSelectedYear]  = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDate,  setSelectedDate]  = useState(today);
  const [attendance,    setAttendance]    = useState({});
  const [saving,        setSaving]        = useState(false);

  const [groups,        setGroups]        = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [sheet,         setSheet]         = useState([]);
  const [loadingSheet,  setLoadingSheet]  = useState(false);
  const [sheetError,    setSheetError]    = useState(null);

  // ── Load groups when year changes ─────────────────────────────────────────
  useEffect(() => {
    if (!selectedYear) { setGroups([]); return; }
    setLoadingGroups(true);
    groupsAPI.getAll({ year: selectedYear, active: true })
      .then((d) => setGroups(d.groups || []))
      .catch(() => toast.error('فشل تحميل المجموعات'))
      .finally(() => setLoadingGroups(false));
  }, [selectedYear]);

  // ── Load attendance sheet when group or date changes ─────────────────────
  useEffect(() => {
    if (!selectedGroup) { setSheet([]); setAttendance({}); return; }
    setLoadingSheet(true);
    setSheetError(null);
    attendanceAPI.getSheet(selectedGroup, selectedDate)
      .then((d) => {
        setSheet(d.sheet || []);
        const pre = {};
        (d.sheet || []).forEach((r) => {
          if (r.status) pre[r.student._id] = r.status;
        });
        setAttendance(pre);
      })
      .catch(() => setSheetError('فشل تحميل كشف الحضور'))
      .finally(() => setLoadingSheet(false));
  }, [selectedGroup, selectedDate]);

  const handleYearChange = (val) => {
    setSelectedYear(val);
    setSelectedGroup('');
    setSheet([]);
    setAttendance({});
  };

  const mark = (studentId, status) => {
    setAttendance((prev) => {
      // toggle: click same button again → unmark
      if (prev[studentId] === status) {
        const next = { ...prev };
        delete next[studentId];
        return next;
      }
      return { ...prev, [studentId]: status };
    });
  };

  const markAll = (status) => {
    const all = {};
    sheet.forEach(r => { all[r.student._id] = status; });
    setAttendance(all);
  };

  const handleSave = async () => {
    if (!selectedGroup) return;
    const records = sheet.map((r) => ({
      studentId: r.student._id,
      status:    attendance[r.student._id] || 'absent',
    }));
    setSaving(true);
    try {
      await attendanceAPI.bulkSubmit({ groupId: selectedGroup, date: selectedDate, records });
      toast.success('تم حفظ كشف الحضور بنجاح ✓');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل حفظ الكشف');
    } finally {
      setSaving(false);
    }
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    if (toDateStr(d) <= today) setSelectedDate(toDateStr(d));
  };

  const markedCount  = Object.keys(attendance).length;
  const presentCount = Object.values(attendance).filter((v) => v === 'present').length;
  const absentCount  = Object.values(attendance).filter((v) => v === 'absent').length;
  const unmarkedCount = sheet.length - markedCount;
  const allMarked = sheet.length > 0 && markedCount === sheet.length;

  const selectedGroupData = groups.find(g => g._id === selectedGroup);

  return (
    <>
      <Helmet><title>تسجيل الحضور | نظام المعلم</title></Helmet>

      <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-5 select-none" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-br from-card to-muted/30 p-4 sm:p-5 rounded-2xl border shadow-sm transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-1">كشف الحضور والغياب</h2>
              <p className="text-muted-foreground text-xs sm:text-sm">سجّل حضور الطلاب لكل مجموعة بسهولة</p>
            </div>
            {sheet.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto text-xs sm:text-sm border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                <span className="flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl px-3 py-1.5 font-bold border border-green-500/20 shadow-sm">
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" /> {presentCount} حضر
                </span>
                <span className="flex items-center gap-1.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl px-3 py-1.5 font-bold border border-red-500/20 shadow-sm">
                  <X className="h-3.5 w-3.5 stroke-[2.5]" /> {absentCount} غاب
                </span>
                {unmarkedCount > 0 && (
                  <span className="flex items-center gap-1.5 bg-muted text-muted-foreground rounded-xl px-3 py-1.5 font-bold border shadow-sm">
                    {unmarkedCount} لم يُسجَّل
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="border shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-foreground/80">السنة الدراسية</label>
                <Select value={selectedYear} onValueChange={handleYearChange}>
                  <SelectTrigger className="h-11 rounded-xl bg-background border-border/80 focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="اختر السنة الدراسية..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {ACADEMIC_YEARS.map((y) => (
                      <SelectItem key={y.value} value={y.value} className="text-right">{y.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-foreground/80">المجموعة</label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup} disabled={!selectedYear || loadingGroups}>
                  <SelectTrigger className="h-11 rounded-xl bg-background border-border/80 focus:ring-2 focus:ring-primary/20 disabled:opacity-50">
                    <SelectValue placeholder={loadingGroups ? 'جاري التحميل...' : 'اختر المجموعة...'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {groups.map((g) => (
                      <SelectItem key={g._id} value={g._id}>
                        <div className="flex items-center gap-2 justify-between w-full">
                          <span className="font-medium">{g.name}</span>
                          {g.studentCount > 0 && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs font-normal px-1.5 py-0 bg-muted/40">
                              {g.studentCount} طالب
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date selector */}
            {selectedGroup && (
              <div className="space-y-2 border-t pt-3 border-border/50">
                <label className="text-xs sm:text-sm font-bold text-foreground/80 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> تاريخ الكشف
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl border-border/80 active:scale-95 transition-transform"
                    onClick={() => changeDate(-1)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <input
                      type="date"
                      value={selectedDate}
                      max={today}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full h-11 border border-border/80 rounded-xl px-3 text-sm bg-background text-center font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    />
                  </div>
                  <Button
                    variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl border-border/80 active:scale-95 transition-transform"
                    onClick={() => changeDate(1)}
                    disabled={selectedDate >= today}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  {selectedDate !== today && (
                    <Button variant="secondary" size="sm" className="h-11 px-3 gap-1.5 shrink-0 rounded-xl font-bold active:scale-95 transition-transform text-xs" onClick={() => setSelectedDate(today)}>
                      <RefreshCw className="h-3.5 w-3.5" /> اليوم
                    </Button>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground font-medium pr-1">{formatDateAr(selectedDate)}</p>
              </div>
            )}
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
            <h3 className="text-sm sm:text-lg font-bold text-muted-foreground">اختر المجموعة لعرض الكشف</h3>
          </div>
        )}

        {/* Loading sheet */}
        {loadingSheet && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error */}
        {sheetError && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{sheetError}</p>
          </div>
        )}

        {/* Sheet */}
        {!loadingSheet && !sheetError && sheet.length > 0 && (
          <div className="space-y-3">
            {/* Controls bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 justify-between w-full sm:w-auto">
                <span className="font-black text-sm sm:text-base">{selectedGroupData?.name}</span>
                <Badge variant="secondary" className="rounded-lg font-bold px-2.5 py-0.5">{sheet.length} طالب</Badge>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  size="sm" variant="outline"
                  className="flex-1 sm:flex-initial gap-1 h-9 text-xs border-green-500/30 text-green-600 bg-green-500/5 hover:bg-green-500/10 rounded-xl font-bold transition-all"
                  onClick={() => markAll('present')}
                >
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" /> الكل حضر
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="flex-1 sm:flex-initial gap-1 h-9 text-xs border-red-500/30 text-red-600 bg-red-500/5 hover:bg-red-500/10 rounded-xl font-bold transition-all"
                  onClick={() => markAll('absent')}
                >
                  <X className="h-3.5 w-3.5 stroke-[2.5]" /> الكل غاب
                </Button>
                <Button
                  size="sm"
                  className="hidden sm:flex gap-1.5 h-9 text-xs rounded-xl font-bold shadow-sm"
                  disabled={saving || sheet.length === 0}
                  onClick={handleSave}
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {saving ? 'جاري الحفظ...' : `حفظ الكشف (${markedCount}/${sheet.length})`}
                </Button>
              </div>
            </div>

            {/* Student cards */}
            <div className="grid gap-2">
              {sheet.map(({ student }, idx) => {
                const status = attendance[student._id];
                const isPresent = status === 'present';
                const isAbsent  = status === 'absent';
                return (
                  <div
                    key={student._id}
                    className={`flex items-center rounded-xl border transition-all duration-200 overflow-hidden ${
                      isPresent ? 'border-green-500/40 bg-green-500/[0.04] dark:bg-green-500/[0.02] shadow-sm' :
                      isAbsent  ? 'border-red-500/40 bg-red-500/[0.04] dark:bg-red-500/[0.02] shadow-sm' :
                                  'border-border/80 bg-card hover:border-border'
                    }`}
                  >
                    {/* Index */}
                    <div className={`w-8 sm:w-10 shrink-0 flex items-center justify-center self-stretch text-xs sm:text-sm font-black transition-colors ${
                      isPresent ? 'bg-green-500 text-white' :
                      isAbsent  ? 'bg-red-500   text-white' :
                                  'bg-muted/60  text-muted-foreground border-l border-border/40'
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Name & Info */}
                    <div className="flex-1 px-3 sm:px-4 py-2.5 min-w-0">
                      <p className="font-bold text-sm sm:text-base text-foreground truncate leading-tight">{student.name}</p>
                      <p className="text-[10px] sm:text-xs font-mono text-muted-foreground/80 mt-0.5 tracking-wider">#{student.code}</p>
                    </div>

                    {/* Status badge - Hidden or subtle on mobile to save space */}
                    <div className="px-1 sm:px-2 shrink-0 hidden xs:block">
                      {isPresent && <span className="text-[10px] sm:text-xs font-extrabold text-green-600 bg-green-500/10 rounded-lg px-2 py-1 border border-green-500/10">حضر ✓</span>}
                      {isAbsent  && <span className="text-[10px] sm:text-xs font-extrabold text-red-600 bg-red-500/10 rounded-lg px-2 py-1 border border-red-500/10">غاب ✗</span>}
                    </div>

                    {/* Action buttons (Highly optimized for Mobile tap targets) */}
                    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-2 shrink-0">
                      <button
                        onClick={() => mark(student._id, 'present')}
                        className={`flex items-center justify-center gap-1 w-14 sm:w-20 h-9 sm:h-10 rounded-lg font-black text-xs transition-all active:scale-95 ${
                          isPresent
                            ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
                            : 'border border-green-500/30 text-green-600 bg-green-500/[0.02] hover:bg-green-500/10'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span className="hidden sm:inline">حضر</span>
                      </button>
                      <button
                        onClick={() => mark(student._id, 'absent')}
                        className={`flex items-center justify-center gap-1 w-14 sm:w-20 h-9 sm:h-10 rounded-lg font-black text-xs transition-all active:scale-95 ${
                          isAbsent
                            ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                            : 'border border-red-500/30 text-red-600 bg-red-500/[0.02] hover:bg-red-500/10'
                        }`}
                      >
                        <X className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span className="hidden sm:inline">غاب</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom save button (Enhanced Native App Sticky feel for Mobile) */}
            <div className="sticky bottom-3 sm:bottom-4 left-0 right-0 z-40 flex justify-center pt-4 pb-2 bg-gradient-to-t from-background via-background/90 to-transparent px-2 sm:px-0">
              <Button
                size="lg"
                className="w-full sm:w-auto gap-2 shadow-xl shadow-primary/20 px-8 py-6 sm:py-5 rounded-xl font-bold text-sm sm:text-base transition-transform active:scale-[0.98]"
                disabled={saving || sheet.length === 0}
                onClick={handleSave}
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                <span>{saving ? 'جاري حفظ البيانات...' : `حفظ كشف الحضور — ${markedCount} من ${sheet.length}`}</span>
                {!allMarked && markedCount > 0 && (
                  <span className="text-[10px] sm:text-xs opacity-80 font-normal border-r pr-1.5 border-white/20">
                    ({unmarkedCount} غائب تلقائياً)
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Empty group */}
        {!loadingSheet && !sheetError && selectedGroup && sheet.length === 0 && !loadingGroups && (
          <div className="text-center p-12 sm:p-14 bg-card border rounded-2xl border-dashed shadow-sm">
            <Users className="h-9 sm:h-10 w-9 sm:w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="font-bold text-muted-foreground text-sm sm:text-base">لا يوجد طلاب مسجلين في هذه المجموعة</p>
          </div>
        )}
      </div>
    </>
  );
}