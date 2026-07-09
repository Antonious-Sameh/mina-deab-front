import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { ClipboardCheck, CheckCircle2, XCircle, Loader2, TrendingUp, Calendar } from 'lucide-react';
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

  const pctColor = stats.pct >= 80 ? 'text-green-600' : stats.pct >= 60 ? 'text-yellow-600' : 'text-red-500';
  const barColor = stats.pct >= 80 ? 'bg-green-500' : stats.pct >= 60 ? 'bg-yellow-500' : 'bg-red-400';

  return (
    <>
      <Helmet><title>سجل حضوري | منصة الطالب</title></Helmet>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">

        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" /> سجل حضوري
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-green-600">{stats.present}</p>
                  <p className="text-xs text-green-700/70 mt-0.5">مرات الحضور</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-red-500">{stats.absent}</p>
                  <p className="text-xs text-red-700/70 mt-0.5">مرات الغياب</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-muted/60 to-muted/20">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black">{stats.total}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">إجمالي الحصص</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-black ${pctColor}`}>{stats.pct}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">نسبة الحضور</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress bar */}
            {stats.total > 0 && (
              <Card className="border shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">نسبة الحضور الكلية</span>
                    <span className={`font-bold ${pctColor}`}>{stats.pct}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className={`h-3 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${stats.pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{stats.present} حضور من {stats.total} حصة</p>
                </CardContent>
              </Card>
            )}

            {/* Records table */}
            {records.length === 0 ? (
              <div className="text-center py-16 bg-card border rounded-2xl border-dashed">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground font-medium">لا يوجد سجل حضور بعد</p>
              </div>
            ) : (
              <Card className="border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-semibold">#</th>
                        <th className="px-4 py-3 font-semibold">التاريخ</th>
                        <th className="px-4 py-3 font-semibold">اليوم</th>
                        <th className="px-4 py-3 font-semibold">الحالة</th>
                        <th className="px-4 py-3 font-semibold">ملاحظة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {records.map((r, i) => {
                        const d = new Date(r.date + 'T00:00:00');
                        const isPresent = r.status === 'present';
                        return (
                          <tr key={r._id} className={`transition-colors ${isPresent ? 'hover:bg-green-50/40' : 'hover:bg-red-50/40'}`}>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{records.length - i}</td>
                            <td className="px-4 py-3 font-mono text-xs">{d.toLocaleDateString('ar-EG')}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{d.toLocaleDateString('ar-EG',{weekday:'long'})}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                isPresent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {isPresent
                                  ? <><CheckCircle2 className="h-3 w-3"/>حاضر</>
                                  : <><XCircle className="h-3 w-3"/>غائب</>}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{r.note || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}