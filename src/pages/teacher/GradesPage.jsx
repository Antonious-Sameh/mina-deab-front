import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  Award, Loader2, AlertCircle, Plus, Edit, Trash2, Save,
  X, ClipboardList, Monitor, Users, ChevronLeft
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
// PAPER EXAMS TAB
// ══════════════════════════════════════════════════════
function CreatePaperExamModal({ onClose, onSaved }) {
  const [title,    setTitle]    = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [year,     setYear]     = useState('');
  const [saving,   setSaving]   = useState(false);

  const handleSave = async () => {
    if (!title.trim()||!year) { toast.error('الاسم والمرحلة مطلوبان'); return; }
    setSaving(true);
    try {
      await api.post('/grades/paper-exam', { title:title.trim(), maxScore:Number(maxScore)||0, academicYear:year });
      toast.success('تم إنشاء الامتحان الورقي ✓');
      onSaved();
    } catch (err) { toast.error(err?.response?.data?.message||'فشلت العملية'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold">امتحان ورقي جديد</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4"/></Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5"><Label>اسم الامتحان <span className="text-destructive">*</span></Label>
            <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="مثال: امتحان الفصل الأول" autoFocus/>
          </div>
          <div className="space-y-1.5"><Label>المرحلة الدراسية <span className="text-destructive">*</span></Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue placeholder="اختر..."/></SelectTrigger>
              <SelectContent>{ACADEMIC_YEARS.map(y=><SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>الدرجة الكلية</Label>
            <Input type="number" min="0" value={maxScore} onChange={e=>setMaxScore(e.target.value)} placeholder="مثال: 50"/>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
            {saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>} إنشاء
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaperExamSheet({ title, year, group, maxScore, onBack, onDeleted }) {
  const [sheet,   setSheet]   = useState([]);
  const [scores,  setScores]  = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    const r = await api.get(`/grades/paper-exam-sheet?year=${year}&title=${encodeURIComponent(title)}`);
    const s = r.data.data.sheet || [];
    setSheet(s);
    const initial = {};
    s.forEach(row => { if(row.entered) initial[row.student._id] = row.score; });
    setScores(initial);
    setLoading(false);
  }, [year, title]);

  useEffect(() => { load(); }, [load]);

  // اعرض طلاب المجموعة المختارة، أو كل الطلاب لو "كل المجموعات"
  const groupSheet = group === ALL_GROUPS ? sheet : sheet.filter(row => row.student.group?._id === group);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const grades = groupSheet.map(row => ({ studentId:row.student._id, score: scores[row.student._id] ?? 0 }));
      await api.post('/grades/paper-exam-bulk', { title, maxScore, academicYear:year, grades });
      toast.success('تم حفظ الدرجات ✓');
      load();
    } catch { toast.error('فشل الحفظ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if(!window.confirm(`حذف امتحان "${title}" وجميع درجاته؟`)) return;
    try {
      await api.delete(`/grades/paper-exam?title=${encodeURIComponent(title)}&year=${year}`);
      toast.success('تم الحذف');
      onDeleted();
    } catch { toast.error('فشل الحذف'); }
  };

  const filled = Object.entries(scores).filter(([sid,v]) => groupSheet.some(r=>r.student._id===sid) && v!==''&&v!==undefined).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}><ChevronLeft className="h-4 w-4"/>رجوع</Button>
        <div className="flex-1">
          <h3 className="font-extrabold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{ACADEMIC_YEARS.find(y=>y.value===year)?.label} — درجة كاملة: {maxScore}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive gap-1.5" onClick={handleDelete}><Trash2 className="h-4 w-4"/>حذف</Button>
          <Button className="gap-2" onClick={handleSaveAll} disabled={saving}>
            {saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>}
            {saving?'جاري الحفظ...':`حفظ (${filled}/${groupSheet.length})`}
          </Button>
        </div>
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
                  <th className="px-4 py-2.5">الدرجة (من {maxScore})</th>
                  <th className="px-4 py-2.5">النسبة</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {groupSheet.map((row,i)=>{
                  const val = scores[row.student._id];
                  const pct = val!==undefined&&val!==''&&maxScore>0 ? Math.round((Number(val)/maxScore)*100) : null;
                  return (
                    <tr key={row.student._id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 text-muted-foreground">{i+1}</td>
                      <td className="px-4 py-2.5 font-bold">{row.student.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.student.studentId ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <Input
                          type="number" min="0" max={maxScore||999}
                          value={val ?? ''}
                          onChange={e => setScores(p=>({...p,[row.student._id]:e.target.value}))}
                          placeholder="—" className="w-24 h-8 text-sm text-center"
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
  const [paperExams, setPaperExams] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [modal,      setModal]      = useState(false);
  const [viewing,    setViewing]    = useState(null);

  // Load groups when year changes
  useEffect(() => {
    if (!year) { setGroups([]); return; }
    setLoadingGroups(true);
    groupsAPI.getAll({ year, active: true })
      .then(r => setGroups(r.groups || []))
      .catch(() => {})
      .finally(() => setLoadingGroups(false));
  }, [year]);

  const load = useCallback(async () => {
    if (!year || !group) return;
    setLoading(true);
    api.get(`/grades/paper-exams?year=${year}`)
      .then(r => setPaperExams(r.data.data.paperExams||[]))
      .catch(()=>toast.error('فشل تحميل الامتحانات الورقية'))
      .finally(()=>setLoading(false));
  }, [year, group]);

  useEffect(() => { load(); }, [load]);

  const handleYearChange = (val) => { setYear(val); setGroup(''); setPaperExams([]); };
  const handleGroupChange = (val) => { setGroup(val); setPaperExams([]); };

  if (viewing) return (
    <PaperExamSheet
      title={viewing._id} year={year} group={group} maxScore={viewing.maxScore}
      onBack={()=>setViewing(null)} onDeleted={()=>{setViewing(null);load();}}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
          <Select value={year} onValueChange={handleYearChange}>
            <SelectTrigger><SelectValue placeholder="اختر السنة الدراسية..."/></SelectTrigger>
            <SelectContent>{ACADEMIC_YEARS.map(y=><SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={group} onValueChange={handleGroupChange} disabled={!year || loadingGroups}>
            <SelectTrigger className="disabled:opacity-50"><SelectValue placeholder={loadingGroups?'جاري التحميل...':'اختر المجموعة...'}/></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_GROUPS}>كل المجموعات</SelectItem>
              {groups.map(g=><SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button className="gap-2" onClick={()=>setModal(true)}><Plus className="h-4 w-4"/>امتحان ورقي جديد</Button>
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

      {loading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>}

      {!loading && group && paperExams.length===0 && (
        <div className="text-center py-14 border-2 border-dashed rounded-2xl">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30"/>
          <p className="text-muted-foreground font-medium">لا توجد امتحانات ورقية لهذه المرحلة</p>
        </div>
      )}

      {!loading && group && paperExams.length>0 && (
        <div className="space-y-2">
          {paperExams.map(ex=>(
            <div key={ex._id} className="bg-card border rounded-xl p-4 flex items-center gap-4 hover:shadow-sm cursor-pointer" onClick={()=>setViewing(ex)}>
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <ClipboardList className="h-5 w-5 text-orange-600"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold">{ex._id}</p>
                <p className="text-xs text-muted-foreground">{ex.studentCount} طالب — درجة كاملة: {ex.maxScore}</p>
              </div>
              <Badge variant="outline" className="shrink-0">عرض الدرجات</Badge>
            </div>
          ))}
        </div>
      )}

      {modal && <CreatePaperExamModal onClose={()=>setModal(false)} onSaved={()=>{setModal(false);load();}}/>}
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