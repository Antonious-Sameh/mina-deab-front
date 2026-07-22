import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Award,
  CreditCard,
  ClipboardCheck,
  Star,
  Trophy,
  Bell,
  Loader2,
  Clock,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { studentAPI } from "@/api/services";

const YEAR_LABELS = {
  "first-prep": "الصف الأول الإعدادي",
  "second-prep": "الصف الثاني الإعدادي",
  "third-prep": "الصف الثالث الإعدادي",
  "first-sec": "الصف الأول الثانوي",
  "second-sec": "الصف الثاني الثانوي",
  "third-sec":  "الصف الثالث الثانوي",
};

export default function StudentHomePage() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // دالة حساب الوقت المنقضي للإعلانات
  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `منذ ${hrs} ساعة`;
    const days = Math.floor(hrs / 24);
    return `منذ ${days} يوم`;
  };

  useEffect(() => {
    Promise.all([
      studentAPI.report().catch(() => null),
      studentAPI.notes().catch(() => null),
    ])
      .then(([rData, nData]) => {
        setReport(rData?.report || null);
        setNotes(nData?.generalNotes?.slice(0, 3) || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Demo fallback data
  const stats = report
    ? {
        attendance: report.attendance?.percentage || 0,
        totalScore: report.grades?.totalScore || 0,
        balance: report.points?.balance || 0,
        rank: report.pointsRank?.rank || null,
        rankOutOf: report.pointsRank?.outOf || null,
        paid: report.payments?.status || "—",
        paidOk: report.payments?.totalRemaining === 0,
      }
    : {
        attendance: 92,
        totalScore: 186,
        balance: 150,
        rank: 3,
        rankOutOf: 80,
        paid: "مكتمل",
        paidOk: true,
      };

  const demoNotes = notes.length
    ? notes
    : [
        { _id: "1", text: "امتحان يوم الخميس القادم — حضور إلزامي", createdAt: new Date(Date.now() - 30 * 60000).toISOString() }, // نص تجريبي مع وقت
        { _id: "2", text: "إحضار كتاب المدرسة في الحصة القادمة", createdAt: new Date(Date.now() - 3 * 3600000).toISOString() }, // نص تجريبي مع وقت
      ];

  return (
    <>
      <Helmet>
        <title>الرئيسية | منصة الطالب</title>
      </Helmet>

      {/* Local custom animations for mathematical dashboard elements */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(10deg); }
        }
        .animate-pulse-ring {
          animation: pulse-ring 4s ease-in-out infinite;
        }
        .animate-sway:hover .bell-icon {
          animation: sway 0.5s ease-in-out infinite;
        }
      `}</style>

      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 antialiased font-sans overflow-hidden">
        
        {/* Polar coordinates vector system in the background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none z-0" />
        
        {/* Colorful mathematical glow beams */}
        <div className="absolute top-0 left-10 w-[450px] h-[450px] bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-ring" />

        <div className="relative p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 z-10">
          
          {/* Welcome Card */}
          <div className="relative overflow-hidden bg-gradient-to-l from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-600/15 dark:via-indigo-600/5 dark:to-transparent border border-slate-200/80 dark:border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-sm backdrop-blur-md">
            
            {/* Background geometric blueprints */}
            <svg className="absolute left-0 bottom-0 top-0 h-full w-1/4 opacity-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" />
              <line x1="0" y1="20" x2="80" y2="100" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="0" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
            </svg>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-100 dark:to-white bg-clip-text text-transparent">
                  أهلاً {user?.name} 👋
                </h2>
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold border border-indigo-500/15">
                  <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                  <span>{YEAR_LABELS[user?.academicYear] || "منصة الإبداع"}</span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500/40 opacity-75"></span>
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400 relative z-10" />
              </div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Attendance */}
                <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 rounded-3xl overflow-hidden group">
                  <CardContent className="p-5 text-center flex flex-col items-center justify-between h-full space-y-4">
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-inner">
                      <ClipboardCheck className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                        {stats.attendance}%
                      </p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        نسبة الحضور
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Payments */}
                <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 rounded-3xl overflow-hidden group">
                  <CardContent className="p-5 text-center flex flex-col items-center justify-between h-full space-y-4">
                    <div className={`p-3 rounded-2xl ${stats.paidOk ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner`}>
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className={`text-xl font-black tracking-tight ${stats.paidOk ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {stats.paid}
                      </p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        المدفوعات
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Rank */}
                <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 rounded-3xl overflow-hidden group">
                  <CardContent className="p-5 text-center flex flex-col items-center justify-between h-full space-y-4">
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-inner">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-black text-amber-500 dark:text-amber-400 tracking-tight">
                        {stats.rank ? `${stats.rank}` : "—"}
                      </p>
                      {stats.rank && stats.rankOutOf ? (
                        {/*<p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          من {stats.rankOutOf} طالب
                        </p>*/}
                      ) : null}
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        ترتيب النقاط
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Points Balance */}
                <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 rounded-3xl overflow-hidden group">
                  <CardContent className="p-5 text-center flex flex-col items-center justify-between h-full space-y-4">
                    <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-orange-500 dark:text-orange-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
                      <Star className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-3xl font-black text-orange-500 dark:text-orange-400 tracking-tight">
                        {stats.balance}
                      </p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        نقاطي
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Latest Notes */}
              {demoNotes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 animate-sway cursor-pointer">
                    <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/10">
                      <Bell className="h-5 w-5 bell-icon" />
                    </div>
                    <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">
                      آخر الإعلانات
                    </h3>
                  </div>

                  <div className="space-y-3.5">
                    {demoNotes.map((n) => (
                      <div
                        key={n._id}
                        className="flex flex-col justify-between gap-3 p-5 bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-500/20 dark:hover:border-indigo-500/20 transition-all duration-300 md:flex-row md:items-center relative overflow-hidden group"
                      >
                        {/* Interactive left accent line */}
                        <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-indigo-500/60 rounded-full group-hover:bg-indigo-500 transition-colors" />
                        
                        <div className="flex items-start gap-3 relative z-10 pr-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2 animate-pulse" />
                          <p className="text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
                            {n.text}
                          </p>
                        </div>
                        
                        {/* Date and elapsed time with clock icon */}
                        {n.createdAt && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium shrink-0 mr-5 md:mr-0 relative z-10">
                            <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                            <span>{timeAgo(n.createdAt)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
