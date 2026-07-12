import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Trophy, Medal, Loader2, Monitor, ClipboardList } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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

function RankIcon({ rank }) {
  if (rank===1) return <Trophy className="h-5 w-5 text-yellow-500"/>;
  if (rank===2) return <Medal  className="h-5 w-5 text-slate-400"/>;
  if (rank===3) return <Medal  className="h-5 w-5 text-orange-400"/>;
  return <span className="text-sm font-black text-muted-foreground">{rank}</span>;
}

export default function RankingsPage() {
  const [year,      setYear]      = useState('');
  const [examType,  setExamType]  = useState('');
  const [exams,     setExams]     = useState([]);  // list of available exams
  const [selectedExam, setSelectedExam] = useState(null); // { id?, title, maxScore }
  const [rankings,  setRankings]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);

  // Load exam list when year + type selected
  useEffect(() => {
    setExams([]); setSelectedExam(null); setRankings([]);
    if (!year || !examType) return;
    setLoadingExams(true);

    const fetchExams = async () => {
      try {
        if (examType === 'electronic') {
          const r = await api.get('/exams', { params: { year } });
          const list = (r.data.data.exams || []).filter(e =>
            (e.examType === 'electronic' || !e.examType) && e.status !== 'draft'
          );
          setExams(list.map(e => ({ id: e._id, title: e.title, maxScore: e.maxScore })));
        } else {
          // Paper: get distinct exam titles from grades
          const r = await api.get('/grades/paper-exams', { params: { year } });
          setExams((r.data.data.paperExams || []).map(e => ({ title: e._id, maxScore: e.maxScore })));
        }
      } catch { toast.error('فشل تحميل قائمة الامتحانات'); }
      finally { setLoadingExams(false); }
    };
    fetchExams();
  }, [year, examType]);

  // Load rankings when exam selected
  useEffect(() => {
    setRankings([]);
    if (!year || !examType || !selectedExam) return;
    setLoading(true);

    const params = { year, examType };
    if (examType === 'electronic') params.examId    = selectedExam.id;
    else                           params.examTitle = selectedExam.title;

    api.get('/grades/exam-rankings', { params })
      .then(r => setRankings(r.data.data.rankings || []))
      .catch(() => toast.error('فشل تحميل الترتيب'))
      .finally(() => setLoading(false));
  }, [selectedExam]);

  const enteredRankings = rankings.filter(r => r.entered);
  const maxScore = selectedExam?.maxScore || enteredRankings[0]?.maxScore || 0;

  return (
    <>
      <Helmet><title>ترتيب الطلاب | نظام المعلم</title></Helmet>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <h2 className="text-2xl font-extrabold">ترتيب الطلاب</h2>
          <p className="text-muted-foreground text-sm mt-0.5">الترتيب حسب درجات امتحان واحد</p>
        </div>

        {/* 3-step filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Step 1: Year */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">١. المرحلة الدراسية</label>
            <Select value={year} onValueChange={v => { setYear(v); setExamType(''); setExams([]); setSelectedExam(null); setRankings([]); }}>
              <SelectTrigger className="h-11"><SelectValue placeholder="اختر المرحلة..."/></SelectTrigger>
              <SelectContent>{ACADEMIC_YEARS.map(y=><SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Step 2: Exam type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">٢. نوع الامتحان</label>
            <Select value={examType} onValueChange={v => { setExamType(v); setExams([]); setSelectedExam(null); setRankings([]); }} disabled={!year}>
              <SelectTrigger className="h-11 disabled:opacity-50"><SelectValue placeholder="اختر النوع..."/></SelectTrigger>
              <SelectContent>
                <SelectItem value="electronic"><div className="flex items-center gap-2"><Monitor className="h-4 w-4 text-blue-500"/>امتحانات إلكترونية</div></SelectItem>
                <SelectItem value="paper"><div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-orange-500"/>امتحانات ورقية</div></SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Step 3: Exam name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">٣. اسم الامتحان</label>
            <Select
              value={selectedExam?.title || ''}
              onValueChange={v => setSelectedExam(exams.find(e => e.title === v) || null)}
              disabled={!examType || loadingExams || exams.length === 0}
            >
              <SelectTrigger className="h-11 disabled:opacity-50">
                <SelectValue placeholder={loadingExams ? 'جاري التحميل...' : exams.length === 0 && examType ? 'لا توجد امتحانات' : 'اختر الامتحان...'}/>
              </SelectTrigger>
              <SelectContent>
                {exams.map(e => <SelectItem key={e.title} value={e.title}>{e.title}{e.maxScore > 0 ? ` (${e.maxScore} درجة)` : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Empty state */}
        {!selectedExam && (
          <div className="text-center py-16 bg-card border rounded-2xl border-dashed">
            <Trophy className="h-14 w-14 text-muted-foreground mx-auto mb-4 opacity-30"/>
            <h3 className="text-lg font-bold text-muted-foreground">
              {!year ? 'اختر المرحلة الدراسية' : !examType ? 'اختر نوع الامتحان' : 'اختر اسم الامتحان'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">لعرض ترتيب الطلاب</p>
          </div>
        )}

        {loading && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}

        {/* Rankings */}
        {!loading && selectedExam && rankings.length > 0 && (
          <>
            {/*  < Top 3 >
            {enteredRankings.length >= 1 && (
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(pos => {
                  const r = enteredRankings.find(x => x.rank === pos);
                  return (
                    <Card key={pos} className={`border shadow-sm text-center ${pos===1?'border-yellow-300 bg-yellow-50/40':pos===2?'border-slate-200 bg-slate-50/30':'border-orange-200 bg-orange-50/30'}`}>
                      <CardContent className="p-3">
                        <div className="flex justify-center mb-1"><RankIcon rank={pos}/></div>
                        {r ? (
                          <>
                            <p className="font-bold text-xs mt-1 line-clamp-2 leading-snug">{r.student.name}</p>
                            <p className={`text-2xl font-black mt-1 ${pos===1?'text-yellow-600':pos===2?'text-slate-500':'text-orange-500'}`}>{r.score}</p>
                            <p className="text-[10px] text-muted-foreground">من {maxScore}</p>
                            <p className={`text-xs font-bold ${r.percentage>=50?'text-green-600':'text-red-500'}`}>{r.percentage}%</p>
                          </>
                        ) : <p className="text-xs text-muted-foreground mt-2">—</p>}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}  */}

            {/* Full table */}
            <Card className="border shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b flex items-center gap-3 flex-wrap">
                <span className="font-bold">{selectedExam.title}</span>
                <Badge variant={examType==='electronic'?'default':'secondary'}>{examType==='electronic'?'إلكتروني':'ورقي'}</Badge>
                {maxScore > 0 && <Badge variant="outline">الدرجة الكاملة: {maxScore}</Badge>}
                <Badge variant="outline" className="mr-auto">{rankings.length} طالب — {enteredRankings.length} أدّوا</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-muted/20 text-muted-foreground text-xs">
                    <tr>
                      <th className="px-4 py-3">الترتيب</th>
                      <th className="px-4 py-3">الطالب</th>
                      <th className="px-4 py-3">الدرجة</th>
                      <th className="px-4 py-3">من</th>
                      <th className="px-4 py-3">النسبة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rankings.map((r, i) => (
                      <tr key={r.student._id} className={`hover:bg-muted/20 transition-colors ${
                        !r.entered ? 'opacity-50' :
                        r.rank===1 ? 'bg-yellow-50/30' :
                        r.rank===2 ? 'bg-slate-50/20' :
                        r.rank===3 ? 'bg-orange-50/20' : ''
                      }`}>
                        <td className="px-4 py-3">
                          {r.rank ? <div className="flex items-center justify-center w-8"><RankIcon rank={r.rank}/></div> : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold">{r.student.name}</p>
                          {r.student.group?.name && <p className="text-xs text-muted-foreground">{r.student.group.name}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {r.entered
                            ? <span className="text-lg font-black">{r.score}</span>
                            : <span className="text-muted-foreground text-xs">لم يؤد</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{maxScore || r.maxScore || '—'}</td>
                        <td className="px-4 py-3">
                          {r.entered && (
                            <div className="flex items-center gap-2">
                              <div className="w-14 bg-muted rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${r.percentage>=70?'bg-green-500':r.percentage>=50?'bg-yellow-500':'bg-red-400'}`} style={{width:`${r.percentage}%`}}/>
                              </div>
                              <span className={`font-bold text-xs ${r.percentage>=70?'text-green-600':r.percentage>=50?'text-yellow-600':'text-red-500'}`}>{r.percentage}%</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {!loading && selectedExam && rankings.length === 0 && (
          <div className="text-center py-12 bg-card border rounded-2xl border-dashed">
            <p className="text-muted-foreground">لا يوجد طلاب في هذه المرحلة</p>
          </div>
        )}
      </div>
    </>
  );
}