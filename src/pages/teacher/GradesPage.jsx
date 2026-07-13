import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  Loader2, Save, ClipboardList, Monitor, Users, ChevronLeft, Folder
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { Badge }  from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { gradesAPI, groupsAPI } from '@/api/services';
import api from '@/api/axios';
import { toast } from 'sonner';

const ACADEMIC_YEARS = [
  { value:'first-prep',  label:'الصف الأول الإعدادي'  },
  { value:'second-prep', label:'الصف الثاني الإعدادي' },
  { value:'third-prep',  label:'الصف الثالث الإعدادي' },
  { value:'first-sec',   label:'الصف الأول الثانوي'   },
  { value:'second-sec',  label:'الصف الثاني الثانوي'  },
  { value:'third-sec',   label:'الصف الثالث الثانوي'  },
];

const ALL_GROUPS = '__all__';

// ══════════════════════════════════════════════════════
// ELECTRONIC EXAMS TAB
// ══════════════════════════════════════════════════════
function ElectronicGrades() {
  const [year,       setYear]       = useState('');
  const [groups,        setGroups]        = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [group,      setGroup]      = useState('');
  const [exams,      setExams]      = useState([]);
  const [selectedEx, setSelectedEx] = useState('');
  const [sheet,      setSheet]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);

  // Load groups when year changes
  useEffect(() => {
    if (!year) { setGroups([]); return; }
    setLoadingGroups(true);
    groupsAPI.getAll({ year, active: true })
      .then(r => setGroups(r.groups || []))
      .catch(() => {})
      .finally(() => setLoadingGroups(false));
  }, [year]);

  // Load exams once year + group are chosen
  useEffect(() => {
    if (!year || !group) { setExams([]); return; }
    api.get('/exams', { params:{ year } })
      .then(r => setExams((r.data.data.exams||[]).filter(e=>(e.examType==='electronic'||!e.examType) && e.status!=='draft')))
      .catch(()=>{});
    setSelectedEx(''); setSheet(null);
  }, [year, group]);

  useEffect(() => {
    if (!selectedEx) { setSheet(null); return; }
    setLoading(true);
    api.get(`/grades?exam=${selectedEx}`)
      .then(r => setSheet(r.data.data))
      .catch(()=>toast.error('فشل تحميل الكشف'))
      .finally(()=>setLoading(false));
  }, [selectedEx]);

  const handleYearChange = (val) => { setYear(val); setGroup(''); setExams([]); setSelectedEx(''); setSheet(null); };
  const handleGroupChange = (val) => { setGroup(val); setSelectedEx(''); setSheet(null); };

  // اعرض طلاب المجموعة المختارة، أو كل الطلاب لو "كل المجموعات"
  const groupRows = group === ALL_GROUPS
    ? (sheet?.sheet || [])
    : (sheet?.sheet?.filter(row => row.student.group?._id === group) || []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>السنة الدراسية</Label>
          <Select value={year} onValueChange={handleYearChange}>
            <SelectTrigger><SelectValue placeholder="اختر السنة..."/></SelectTrigger>
            <SelectContent>{ACADEMIC_YEARS.map(y=><SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>المجموعة</Label>
          <Select value={group} onValueChange={handleGroupChange} disabled={!year || loadingGroups}>
            <SelectTrigger className="disabled:opacity-50"><SelectValue placeholder={loadingGroups?'جاري التحميل...':'اختر المجموعة...'}/></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_GROUPS}>كل المجموعات</SelectItem>
              {groups.map(g=><SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {group && (
        <div className="space-y-1.5">
          <Label>الامتحان</Label>
          <Select value={selectedEx} onValueChange={setSelectedEx} disabled={!exams.length}>
            <SelectTrigger><SelectValue placeholder={exams.length?'اختر امتحاناً...':'لا توجد امتحانات'}/></SelectTrigger>
            <SelectContent>{exams.map(e=><SelectItem key={e._id} value={e._id}>{e.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {!year && (
        <div className="text-center py-14 border-2 border-dashed rounded-2xl">
          <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30"/>
          <p className="text-muted-foreground font-medium">اختر السنة الدراسية</p>
        </div>
      )}

      {year && !group && !loadingGroups && (
        <div className="text-center py-14 border-2 border-dashed rounded-2xl">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30"/>
          <p className="text-muted-foreground font-medium">اختر المجموعة لعرض طلابها</p>
        </div>
      )}

      {loading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>}

      {sheet && !loading && (
        <Card className="border shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b flex items-center gap-3 flex-wrap">
            <span className="font-bold">{sheet.exam?.title}</span>
            <Badge variant="secondary">الدرجة الكلية: {sheet.exam?.maxScore}</Badge>
            <Badge variant="outline">{groupRows.filter(r=>r.entered).length} من {groupRows.length} أُدخلت</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">الطالب</th>
                  <th className="px-4 py-2.5">الدرجة</th>
                  <th className="px-4 py-2.5">النسبة</th>
                  <th className="px-4 py-2.5">تاريخ الحل</th>
                  <th className="px-4 py-2.5">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {groupRows.map((row,i)=>{
                  const pct = row.pct ?? (row.entered && sheet.exam?.maxScore>0 ? Math.round((row.score/sheet.exam.maxScore)*100) : null);
                  const dateStr = row.submittedAt
                    ? new Date(row.submittedAt).toLocaleDateString('ar-EG', {day:'2-digit',month:'2-digit',year:'numeric'})
                    : null;
                  return (
                    <tr key={row.student._id} className={`hover:bg-muted/20 ${!row.entered?'opacity-60':''}`}>
                      <td className="px-4 py-2.5 text-muted-foreground">{i+1}</td>
                      <td className="px-4 py-2.5">
                        <p className="font-bold">{row.student.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{row.student.codePlain}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        {row.entered
                          ? <span className="font-bold text-base">{row.score} <span className="text-muted-foreground text-xs font-normal">/ {sheet.exam?.maxScore}</span></span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        {pct!==null
                          ? <span className={`font-bold text-sm ${pct>=50?'text-green-600':'text-red-500'}`}>{pct}%</span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {dateStr || '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          row.entered ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {row.entered ? '✓ أدّى الامتحان' : 'لم يحل بعد'}
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
    </div>
  );
}

// ══════════════════════════════════════════════════════
// PAPER EXAMS TAB — الآن مبني على نفس نظام الامتحانات الحقيقي (Exam model)
// المستخدم في صفحة الامتحانات، بحيث الامتحان الورقي يتبع لقسم، ورصد
// الدرجات هنا بيستخدم نفس endpoints الامتحانات الإلكترونية (GET /grades?exam=
// و POST /grades/bulk) بدل الآلية القديمة المنفصلة.
// إنشاء/تعديل/حذف الامتحان الورقي نفسه يفضل من صفحة الامتحانات فقط.
// ══════════════════════════════════════════════════════

function PaperExamGradeSheet({ exam, year, group, onBack }) {
  const [sheet,   setSheet]   = useState(null);
  const [scores,  setScores]  = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`/grades?exam=${exam._id}`);
      setSheet(r.data.data);
      const initial = {};
      (r.data.data.sheet || []).forEach(row => { if (row.entered) initial[row.student._id] = row.score; });
      setScores(initial);
    } catch { toast.error('فشل تحميل الكشف'); }
    finally { setLoading(false); }
  }, [exam._id]);

  useEffect(() => { load(); }, [load]);

  // اعرض طلاب المجموعة المختارة، أو كل الطلاب لو "كل المجموعات"
  const groupRows = !sheet ? [] : (group === ALL_GROUPS
    ? sheet.sheet
    : sheet.sheet.filter(row => row.student.group?._id === group));

  const isClosed = sheet?.exam?.status === 'closed';

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const grades = groupRows.map(row => ({ studentId: row.student._id, score: Number(scores[row.student._id]) || 0 }));
      await api.post('/grades/bulk', { examId: exam._id, grades });
      toast.success('تم حفظ الدرجات ✓');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل الحفظ');
    } finally { setSaving(false); }
  };

  const filled = groupRows.filter(row => {
    const v = scores[row.student._id];
    return v !== undefined && v !== '';
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}><ChevronLeft className="h-4 w-4"/>رجوع للامتحانات</Button>
        <div className="flex-1">
          <h3 className="font-extrabold text-lg">{exam.title}</h3>
          <p className="text-sm text-muted-foreground">
            {ACADEMIC_YEARS.find(y=>y.value===year)?.label} — درجة كاملة: {exam.maxScore}
            {isClosed && <span className="text-red-500 font-medium"> — الامتحان مغلق</span>}
          </p>
        </div>
        <Button className="gap-2" onClick={handleSaveAll} disabled={saving || loading || isClosed}>
          {saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>}
          {saving?'جاري الحفظ...':`حفظ (${filled}/${groupRows.length})`}
        </Button>
      </div>

      {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div> : (
        <Card className="border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">الطالب</th>
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">الدرجة (من {exam.maxScore})</th>
                  <th className="px-4 py-2.5">النسبة</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {groupRows.map((row,i)=>{
                  const val = scores[row.student._id];
                  const pct = val!==undefined && val!=='' && exam.maxScore>0 ? Math.round((Number(val)/exam.maxScore)*100) : null;
                  return (
                    <tr key={row.student._id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 text-muted-foreground">{i+1}</td>
                      <td className="px-4 py-2.5 font-bold">{row.student.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.student.studentId ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <Input
                          type="number" min="0" max={exam.maxScore||999}
                          value={val ?? ''}
                          onChange={e => setScores(p=>({...p,[row.student._id]:e.target.value}))}
                          placeholder="—" className="w-24 h-8 text-sm text-center"
                          disabled={isClosed}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        {pct!==null && <span className={`font-bold text-sm ${pct>=50?'text-green-600':'text-red-500'}`}>{pct}%</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function PaperGrades() {
  const [year,       setYear]       = useState('');
  const [groups,        setGroups]        = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [group,      setGroup]      = useState('');

  const [allExams,    setAllExams]    = useState([]); // كل الامتحانات الورقية المنشورة/المغلقة لهذه السنة
  const [loadingExams, setLoadingExams] = useState(false);

  const [openSectionKey, setOpenSectionKey] = useState(null); // sectionId | '__none__' | null
  const [selectedExam,   setSelectedExam]   = useState(null);

  // Load groups when year changes
  useEffect(() => {
    if (!year) { setGroups([]); return; }
    setLoadingGroups(true);
    groupsAPI.getAll({ year, active: true })
      .then(r => setGroups(r.groups || []))
      .catch(() => {})
      .finally(() => setLoadingGroups(false));
  }, [year]);

  // Load all paper exams for the year (used to derive the section folders)
  useEffect(() => {
    if (!year) { setAllExams([]); return; }
    setLoadingExams(true);
    api.get('/exams', { params: { year } })
      .then(r => setAllExams((r.data.data.exams || []).filter(e => e.examType === 'paper' && e.status !== 'draft')))
      .catch(() => toast.error('فشل تحميل الامتحانات الورقية'))
      .finally(() => setLoadingExams(false));
  }, [year]);

  const handleYearChange = (val) => { setYear(val); setGroup(''); setOpenSectionKey(null); setSelectedExam(null); };
  const handleGroupChange = (val) => { setGroup(val); setOpenSectionKey(null); setSelectedExam(null); };

  // تقسيم الامتحانات لأقسام (فولدرات) حسب section المرتبط بكل امتحان
  const folders = (() => {
    const map = {};
    const order = [];
    allExams.forEach(e => {
      const key = e.section?._id || '__none__';
      if (!map[key]) { map[key] = { key, name: e.section?.name || 'بدون قسم', exams: [] }; order.push(key); }
      map[key].exams.push(e);
    });
    // "بدون قسم" آخر واحدة لو موجودة
    return order.sort((a,b) => (a==='__none__'?1:0) - (b==='__none__'?1:0)).map(k => map[k]);
  })();

  const openFolder = folders.find(f => f.key === openSectionKey) || null;

  if (selectedExam) {
    return (
      <PaperExamGradeSheet
        exam={selectedExam} year={year} group={group}
        onBack={() => setSelectedExam(null)}
      />
    );
  }

  if (openFolder) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setOpenSectionKey(null)}><ChevronLeft className="h-4 w-4"/>الأقسام</Button>
          <h3 className="font-extrabold text-lg">📁 {openFolder.name}</h3>
        </div>
        <div className="space-y-2">
          {openFolder.exams.map(ex => (
            <div key={ex._id} className="bg-card border rounded-xl p-4 flex items-center gap-4 hover:shadow-sm cursor-pointer" onClick={() => setSelectedExam(ex)}>
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <ClipboardList className="h-5 w-5 text-orange-600"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold">{ex.title}</p>
                <p className="text-xs text-muted-foreground">
                  درجة كاملة: {ex.maxScore}{ex.examDate ? ` — ${new Date(ex.examDate).toLocaleDateString('ar-EG')}` : ''}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0">رصد الدرجات</Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>السنة الدراسية</Label>
          <Select value={year} onValueChange={handleYearChange}>
            <SelectTrigger><SelectValue placeholder="اختر السنة الدراسية..."/></SelectTrigger>
            <SelectContent>{ACADEMIC_YEARS.map(y=><SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>المجموعة</Label>
          <Select value={group} onValueChange={handleGroupChange} disabled={!year || loadingGroups}>
            <SelectTrigger className="disabled:opacity-50"><SelectValue placeholder={loadingGroups?'جاري التحميل...':'اختر المجموعة...'}/></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_GROUPS}>كل المجموعات</SelectItem>
              {groups.map(g=><SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!year && (
        <div className="text-center py-14 border-2 border-dashed rounded-2xl">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30"/>
          <p className="text-muted-foreground font-medium">اختر السنة الدراسية</p>
        </div>
      )}

      {year && !group && !loadingGroups && (
        <div className="text-center py-14 border-2 border-dashed rounded-2xl">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30"/>
          <p className="text-muted-foreground font-medium">اختر المجموعة لعرض طلابها</p>
        </div>
      )}

      {group && loadingExams && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>}

      {group && !loadingExams && folders.length===0 && (
        <div className="text-center py-14 border-2 border-dashed rounded-2xl">
          <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30"/>
          <p className="text-muted-foreground font-medium">لا توجد امتحانات ورقية لهذه المرحلة بعد</p>
          <p className="text-xs text-muted-foreground mt-1">أضف امتحاناً ورقياً من صفحة الامتحانات أولاً</p>
        </div>
      )}

      {group && !loadingExams && folders.length>0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {folders.map(f => (
            <div key={f.key} className="bg-card border rounded-2xl p-4 flex items-center gap-3 hover:shadow-sm cursor-pointer transition-all" onClick={() => setOpenSectionKey(f.key)}>
              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <Folder className="h-5 w-5 text-orange-500"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.exams.length} امتحان</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════
export default function GradesPage() {
  return (
    <>
      <Helmet><title>الدرجات | نظام المعلم</title></Helmet>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <h2 className="text-2xl font-extrabold">الدرجات</h2>
          <p className="text-muted-foreground text-sm mt-0.5">إدارة درجات الامتحانات الإلكترونية والورقية</p>
        </div>

        <Tabs defaultValue="electronic">
          <TabsList className="w-full">
            <TabsTrigger value="electronic" className="flex-1 gap-2">
              <Monitor className="h-4 w-4"/> امتحانات إلكترونية
            </TabsTrigger>
            <TabsTrigger value="paper" className="flex-1 gap-2">
              <ClipboardList className="h-4 w-4"/> امتحانات ورقية
            </TabsTrigger>
          </TabsList>
          <TabsContent value="electronic" className="mt-4"><ElectronicGrades/></TabsContent>
          <TabsContent value="paper"      className="mt-4"><PaperGrades/></TabsContent>
        </Tabs>
      </div>
    </>
  );
}