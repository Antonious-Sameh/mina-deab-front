import React, { useState, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Search, User, Activity, CreditCard, Award, Trophy, Star, BarChart2, Loader2, Folder, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input }  from '@/components/ui/input';
import { Badge }  from '@/components/ui/badge';
import { studentsAPI, attendanceAPI } from '@/api/services';
import { toast } from 'sonner';

function Stat({ label, value, color = '' }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

// ── تجميع درجات الامتحانات الورقية حسب القسم — عرض فقط، بدون أي لمسة للدرجات
// نفسها. نفس فكرة الفولدرات المستخدمة فعلاً وشغالة في صفحة الدرجات الأساسية
// (GradesPage.jsx) — هنا بس بنقسّم قائمة درجات طالب واحد بدل قائمة امتحانات.
// أي حاجة مش امتحان ورقي (إلكتروني، أو سجل قديم بدون exam مرتبط) بترجع زي ما
// هي في `other` وبتتعرض بنفس الشكل القديم تمامًا، من غير أي تغيير.
function groupPaperGradesBySection(list) {
  const sectionsMap = {};
  const order = [];
  const other = [];

  (list || []).forEach((g) => {
    if (g.exam?.examType === 'paper') {
      const key = g.exam?.section?._id || '__none__';
      if (!sectionsMap[key]) {
        sectionsMap[key] = { key, name: g.exam?.section?.name || 'بدون قسم', grades: [] };
        order.push(key);
      }
      sectionsMap[key].grades.push(g);
    } else {
      other.push(g);
    }
  });

  // "بدون قسم" آخر واحدة، زي نفس الترتيب المستخدم في GradesPage.jsx
  const sections = order
    .sort((a, b) => (a === '__none__' ? 1 : 0) - (b === '__none__' ? 1 : 0))
    .map((k) => sectionsMap[k]);

  return { sections, other };
}

function GradeRow({ g }) {
  return (
    <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3">
      <span className="font-medium text-sm">{g.exam?.title}</span>
      <span className="font-black text-lg text-primary">{g.score} <span className="text-xs text-muted-foreground font-normal">/ {g.exam?.maxScore}</span></span>
    </div>
  );
}

// ── تفاصيل الحضور (عرض فقط) — بتتطلب من السيرفر فقط لما المدرس يضغط الزر،
// ولطالب واحد بس، وبتتخزن في الـ cache عشان إعادة الفتح ما تعملش request تاني.
// بتستخدم endpoint الموجود أصلاً (GET /attendance/student/:id) بدون أي تعديل.
const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function groupAttendanceByMonth(records) {
  const map = {};
  (records || []).forEach((r) => {
    const [y, m, d] = String(r.date).split('-');
    const key = `${y}-${m}`;
    if (!map[key]) map[key] = { key, label: `${AR_MONTHS[Number(m) - 1] || m} ${y}`, days: [] };
    map[key].days.push({ id: r._id || `${r.date}-${r.status}`, day: Number(d), date: r.date, status: r.status, note: r.note });
  });
  return Object.values(map)
    .sort((a, b) => b.key.localeCompare(a.key))
    .map((g) => ({ ...g, days: g.days.sort((a, b) => a.date.localeCompare(b.date)) }));
}

function AttendanceDetails({ studentId, cacheRef }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [months, setMonths] = useState(() => cacheRef.current[studentId] || null);

  const toggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (months || loading) return;
    setLoading(true);
    try {
      const d = await attendanceAPI.getStudentHistory(studentId, { limit: 1000 });
      const grouped = groupAttendanceByMonth(d.records);
      cacheRef.current[studentId] = grouped;
      setMonths(grouped);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل تحميل تفاصيل الحضور');
      setOpen(false);
    } finally { setLoading(false); }
  };

  return (
    <div className="mt-4 pt-3 border-t">
      <button type="button" onClick={toggle}
        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
        تفاصيل الحضور
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {loading && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
          {!loading && months && months.length === 0 && (
            <p className="text-sm text-muted-foreground">لا توجد سجلات حضور لهذا الطالب</p>
          )}
          {!loading && months && months.map((m) => (
            <div key={m.key}>
              <p className="font-bold text-sm mb-2">{m.label}</p>
              <ul className="space-y-1">
                {m.days.map((r) => (
                  <li key={r.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 text-sm">
                    <span>{r.day} {AR_MONTHS[Number(r.date.split('-')[1]) - 1]}</span>
                    <span className={`font-bold ${r.status === 'present' ? 'text-green-600' : 'text-red-600'}`}>
                      {r.status === 'present' ? 'حاضر' : 'غائب'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const attendanceCache = useRef({}); // studentId → تفاصيل الحضور المجمّعة (للصفحة الحالية فقط)

  // تجميع عرض الدرجات حسب القسم — لا يُعاد حسابه إلا لما التقرير نفسه يتغيّر
  const { sections: paperSections, other: otherGrades } = useMemo(
    () => groupPaperGradesBySection(report?.grades?.list),
    [report]
  );

  const handleSearch = async (q) => {
    setQuery(q);
    setReport(null);
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const d = await studentsAPI.getAll({ search: q.trim(), limit: 10 });
      setResults(d.data || []);
    } catch { setResults([]); }
    finally { setSearching(false); }
  };

  const selectStudent = async (student) => {
    setQuery(student.name);
    setResults([]);
    setLoading(true);
    try {
      const d = await studentsAPI.getReport(student._id);
      setReport(d.report);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل تحميل التقرير');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Helmet><title>التقارير | نظام المعلم</title></Helmet>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold mb-1">تقرير الطالب الشامل</h2>
          <p className="text-muted-foreground text-sm">ابحث عن طالب لعرض تقريره المفصل</p>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="flex items-center gap-3 bg-card border rounded-xl px-4 shadow-sm">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input placeholder="ابحث باسم الطالب أو الكود..." value={query}
              onChange={e => handleSearch(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 h-12 text-base" />
            {searching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
          </div>
          {results.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-card border rounded-xl shadow-lg overflow-hidden">
              {results.map(s => (
                <button key={s._id} className="w-full text-right px-5 py-3 hover:bg-muted/60 flex justify-between gap-4"
                  onClick={() => selectStudent(s)}>
                  <div>
                    <p className="font-bold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.academicYearLabel}</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground shrink-0">{s.codePlain}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}

        {!report && !loading && (
          <div className="text-center p-16 bg-card border rounded-2xl border-dashed">
            <BarChart2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="text-lg font-bold">ابحث عن طالب</h3>
          </div>
        )}

        {report && !loading && (
          <div className="space-y-5">
            {/* Student info */}
            <Card className="border-2 border-primary/20">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold">{report.student.name}</h3>
                  <p className="text-muted-foreground text-sm">{report.student.academicYearLabel} — {report.student.group?.name || 'بدون مجموعة'}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{report.student.codePlain}</Badge>
                    {report.student.phone && <Badge variant="outline">{report.student.phone}</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/*
              <Card><CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-black">#{report.rank?.rank || '—'}</p>
                <p className="text-xs text-muted-foreground">الترتيب</p>
              </CardContent></Card>

              <Card><CardContent className="p-4 text-center">
                <Award className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-black">{report.grades?.totalScore || 0}</p>
                <p className="text-xs text-muted-foreground">إجمالي الدرجات</p>
              </CardContent></Card>
              */}
              <Card><CardContent className="p-4 text-center">
                <Star className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-black">{report.points?.balance || 0}</p>
                <p className="text-xs text-muted-foreground">النقاط</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <CreditCard className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className={`text-lg font-black ${report.payments?.totalRemaining === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {report.payments?.status || '—'}
                </p>
                <p className="text-xs text-muted-foreground">المدفوعات</p>
              </CardContent></Card>
            </div>

            {/* Attendance */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex gap-2"><Activity className="h-5 w-5 text-primary" />الحضور</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-8">
                  <Stat label="حضور"     value={report.attendance?.present || 0}    color="text-green-600" />
                  <Stat label="غياب"     value={report.attendance?.absent  || 0}    color="text-red-600" />
                  <Stat label="الإجمالي" value={report.attendance?.total   || 0} />
                  <Stat label="النسبة"   value={`${report.attendance?.percentage || 0}%`} color="text-primary" />
                </div>
                <AttendanceDetails key={report.student._id} studentId={report.student._id} cacheRef={attendanceCache} />
              </CardContent>
            </Card>

            
            {/* درجات الامتحانات الورقية — مجمّعة حسب القسم (عرض فقط) */}
            {paperSections.map(sec => (
              <Card key={sec.key}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex gap-2"><Folder className="h-5 w-5 text-primary" />{sec.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {sec.grades.map(g => <GradeRow key={g._id} g={g} />)}
                </CardContent>
              </Card>
            ))}

            {/* باقي الدرجات (إلكتروني/قديم) — بنفس الشكل القديم تمامًا، بدون تجميع */}
            {otherGrades.length > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex gap-2"><Award className="h-5 w-5 text-primary" />الدرجات</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {otherGrades.map(g => <GradeRow key={g._id} g={g} />)}
                </CardContent>
              </Card>
            )}
            
          </div>
        )}
      </div>
    </>
  );
}