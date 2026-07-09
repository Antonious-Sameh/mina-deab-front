import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, User, Activity, CreditCard, Award, Trophy, Star, BarChart2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input }  from '@/components/ui/input';
import { Badge }  from '@/components/ui/badge';
import { studentsAPI } from '@/api/services';
import { toast } from 'sonner';

function Stat({ label, value, color = '' }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export default function ReportsPage() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

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
              </CardContent>
            </Card>

            {/*  < Grades 
            {report.grades?.list?.length > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex gap-2"><Award className="h-5 w-5 text-primary" />الدرجات</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {report.grades.list.map(g => (
                    <div key={g._id} className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3">
                      <span className="font-medium text-sm">{g.exam?.title}</span>
                      <span className="font-black text-lg text-primary">{g.score} <span className="text-xs text-muted-foreground font-normal">/ {g.exam?.maxScore}</span></span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            */}
          </div>
        )}
      </div>
    </>
  );
}
