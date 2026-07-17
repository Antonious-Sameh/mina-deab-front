import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { ClipboardCheck, CheckCircle2, XCircle, Loader2, Calendar, LayoutGrid, Activity, ShieldAlert, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { studentAPI } from '@/api/services';
import { toast } from 'sonner';

export default function StudentAttendancePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats,   setStats]   = useState({ present:0, absent:0, total:0, pct:0 });

  useEffect(() => {
    studentAPI.attendance({ limit: 300 })
      .then(d => {
        const recs = d.records || [];
        setRecords(recs);
        const present = recs.filter(r => r.status === 'present').length;
        const total   = recs.length;
        setStats({ present, absent: total - present, total, pct: total > 0 ? Math.round((present/total)*100) : 0 });
      })
      .catch(() => toast.error('فشل تحميل الحضور'))
      .finally(() => setLoading(false));
  }, []);

  // تحسين الهوية البصرية للألوان لتصبح درجات احترافية (Premium Muted Colors)
  const pctColor = stats.pct >= 80 ? 'text-emerald-600 dark:text-emerald-400' : stats.pct >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
  const barColor = stats.pct >= 80 ? 'bg-emerald-500' : stats.pct >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  const bgGlass = stats.pct >= 80 ? 'bg-emerald-50/30 border-emerald-100/50' : stats.pct >= 60 ? 'bg-amber-50/30 border-amber-100/50' : 'bg-rose-50/30 border-rose-100/50';

  return (
    <>
      <Helmet><title>سجل حضوري | منصة الطالب</title></Helmet>
      
      {/* Container الرئيسي بتوزيع ومساحات أنظف */}
      <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 p-4 md:p-8 antialiased">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header عصري وشفاف وبدون الحواف الضخمة القديمة */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-50">سجل حضوري</h1>
              </div>
              <p className="text-sm text-muted-foreground mr-10">تابع تفاصيل ونسب حضورك للحصص أولاً بأول</p>
            </div>
            
            {/* إضافة لمسة احترافية لعرض تاريخ اليوم كعنصر بصري إضافي */}
            <div className="flex items-center gap-2 text-xs font-medium bg-white dark:bg-zinc-900 border px-3 py-2 rounded-xl shadow-sm self-start sm:self-auto">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">تحديث فوري</span>
            </div>
          </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary/80" />
              <p className="text-xs text-muted-foreground animate-pulse font-medium">جاري مزامنة بيانات الحضور...</p>
            </div>
          ) : (
            <>
              {/* قسم الإحصائيات الجديد: Bento Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* كارت النسبة الكبير - البطل البصري الرئيسي للوحة */}
                <Card className={`md:col-span-1 border shadow-sm backdrop-blur-sm overflow-hidden relative ${bgGlass}`}>
                  <CardContent className="p-6 flex flex-col justify-between h-full space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">معدل الالتزام</span>
                      <Activity className={`h-4 w-4 ${pctColor}`} />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-5xl font-black tracking-tight ${pctColor}`}>{stats.pct}</span>
                        <span className={`text-xl font-bold ${pctColor}`}>%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">مجموع فترات التواجد الفعلي</p>
                    </div>
                    {/* شريط التقدم المدمج بداخل الكارت بشكل أنيق */}
                    {stats.total > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <div className="h-2 bg-slate-200/60 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`} style={{ width: `${stats.pct}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                          <span>{stats.present} حضور</span>
                          <span>{stats.total} حصة إجمالية</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* كروت الأرقام الفرعية بتصميم Minimalist ومدمج */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex sm:flex-col justify-between items-center sm:items-start h-full gap-2">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="sm:mt-2 text-left sm:text-right">
                        <p className="text-3xl font-black text-slate-800 dark:text-zinc-100">{stats.present}</p>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">مرات الحضور</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex sm:flex-col justify-between items-center sm:items-start h-full gap-2">
                      <div className="p-2 bg-rose-50 dark:bg-rose-950/50 rounded-lg text-rose-600 dark:text-rose-400">
                        <ShieldAlert className="h-4 w-4" />
                      </div>
                      <div className="sm:mt-2 text-left sm:text-right">
                        <p className="text-3xl font-black text-slate-800 dark:text-zinc-100">{stats.absent}</p>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">مرات الغياب</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow sm:col-span-1">
                    <CardContent className="p-5 flex sm:flex-col justify-between items-center sm:items-start h-full gap-2">
                      <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-600 dark:text-zinc-400">
                        <LayoutGrid className="h-4 w-4" />
                      </div>
                      <div className="sm:mt-2 text-left sm:text-right">
                        <p className="text-3xl font-black text-slate-800 dark:text-zinc-100">{stats.total}</p>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">إجمالي الحصص</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>

              {/* قسم السجل التفصيلي */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                    <span>جدول الحصص التفصيلي</span>
                    <span className="text-xs font-normal bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-muted-foreground">آخر 300 سجل</span>
                  </h3>
                </div>

                {records.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-zinc-900 border rounded-2xl border-dashed shadow-sm">
                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-full w-fit mx-auto mb-4">
                      <Calendar className="h-6 w-6 text-muted-foreground/60" />
                    </div>
                    <p className="text-slate-800 dark:text-zinc-200 font-semibold text-base">لا يوجد سجل حضور بعد</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">عند تسجيل حضورك في أي حصة قادمة ستظهر التفاصيل الكاملة هنا مباشرة.</p>
                  </div>
                ) : (
                  /* تصميم هجين (Table على الشاشات الكبيرة و Cards مبتكرة وسلسة على الموبايل) */
                  <div className="space-y-3 sm:space-y-0">
                    
                    {/* عرض الموبايل (Mobile View Cards) - يختفي في الشاشات الأكبر */}
                    <div className="grid grid-cols-1 gap-3 sm:hidden">
                      {records.map((r, i) => {
                        const d = new Date(r.date + 'T00:00:00');
                        const isPresent = r.status === 'present';
                        return (
                          <div 
                            key={r._id} 
                            className={`p-4 rounded-xl border bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-between gap-4 border-r-4 ${
                              isPresent ? 'border-r-emerald-500' : 'border-r-rose-500'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-800 dark:text-zinc-200">
                                  {d.toLocaleDateString('ar-EG', { weekday: 'long' })}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500">#{records.length - i}</span>
                              </div>
                              <div className="text-xs font-mono text-muted-foreground">
                                {d.toLocaleDateString('ar-EG')}
                              </div>
                              {r.note && (
                                <p className="text-[11px] bg-slate-50 dark:bg-zinc-800/50 px-2 py-1 rounded text-muted-foreground italic mt-1">
                                  {r.note}
                                </p>
                              )}
                            </div>
                            
                            <div>
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${
                                isPresent ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              }`}>
                                {isPresent ? <CheckCircle2 className="h-3.5 w-3.5"/> : <XCircle className="h-3.5 w-3.5"/>}
                                {isPresent ? 'حاضر' : 'غائب'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* عرض الويب الاحترافي (Desktop Table) - يظهر فقط في الشاشات الكبيرة */}
                    <Card className="hidden sm:block border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden rounded-xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                          <thead className="bg-slate-50 dark:bg-zinc-800/40 text-slate-500 dark:text-zinc-400 border-b">
                            <tr>
                              <th className="px-6 py-4 font-bold text-xs tracking-wider">#</th>
                              <th className="px-6 py-4 font-bold text-xs tracking-wider">التاريخ</th>
                              <th className="px-6 py-4 font-bold text-xs tracking-wider">اليوم</th>
                              <th className="px-6 py-4 font-bold text-xs tracking-wider">الحالة</th>
                              <th className="px-6 py-4 font-bold text-xs tracking-wider">ملاحظات الإدارة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                            {records.map((r, i) => {
                              const d = new Date(r.date + 'T00:00:00');
                              const isPresent = r.status === 'present';
                              return (
                                <tr 
                                  key={r._id} 
                                  className={`transition-colors duration-150 ${
                                    isPresent ? 'hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10' : 'hover:bg-rose-50/20 dark:hover:bg-rose-950/10'
                                  }`}
                                >
                                  <td className="px-6 py-4 text-muted-foreground font-medium text-xs">{records.length - i}</td>
                                  <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                    {d.toLocaleDateString('ar-EG')}
                                  </td>
                                  <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-zinc-400">
                                    {d.toLocaleDateString('ar-EG', { weekday: 'long' })}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                      isPresent 
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                    }`}>
                                      {isPresent ? <CheckCircle2 className="h-3 w-3"/> : <XCircle className="h-3 w-3"/>}
                                      {isPresent ? 'حاضر' : 'غائب'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-xs text-muted-foreground/90 italic">
                                    {r.note || <span className="text-slate-300 dark:text-zinc-700">—</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>

                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}