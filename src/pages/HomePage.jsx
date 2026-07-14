import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, Calendar, FileText,
  ClipboardCheck, Award, Star, Loader2, TrendingUp, MonitorPlay, StickyNote, ChevronLeft
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { studentsAPI, groupsAPI } from '@/api/services';

function StatCard({ title, value, icon: Icon, color, bgColor, darkBgColor, sub }) {
  return (
    <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md shadow-sm hover:shadow-lg hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all duration-300 group overflow-hidden relative">
      {/* Decorative background grid pulse for cards */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardContent className="p-5 relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">{title}</p>
            <p className={`text-2xl sm:text-3xl font-black tracking-tight ${color}`}>{value}</p>
            {sub && (
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500" />
                {sub}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-2xl ${bgColor} ${darkBgColor} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const QUICK_LINKS = [
  { label: 'الحضور والفلوس',  to: '/attendance',        icon: ClipboardCheck, color: 'text-emerald-600 dark:text-emerald-400',  bg: 'bg-emerald-50 dark:bg-emerald-950/20',  border: 'border-emerald-100 dark:border-emerald-900/30'   },
  { label: 'إدارة الطلاب',  to: '/students',           icon: Users,          color: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-50 dark:bg-indigo-950/20',   border: 'border-indigo-100 dark:border-indigo-900/30' },
  { label: 'الدرجات',        to: '/teacher/grades',     icon: Award,          color: 'text-blue-600 dark:text-blue-400',     iconColor: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/20',     border: 'border-blue-100 dark:border-blue-900/30'    },
  { label: 'الامتحانات',     to: '/teacher/exams',      icon: FileText,       color: 'text-fuchsia-600 dark:text-fuchsia-400',  bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/20',  border: 'border-fuchsia-100 dark:border-fuchsia-900/30'  },
  { label: 'النقاط',         to: '/teacher/points',     icon: Star,           color: 'text-amber-500 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-950/20',    border: 'border-amber-100 dark:border-amber-900/30'  },
  { label: 'الملاحظات',      to: '/teacher/notes',      icon: StickyNote,     color: 'text-rose-600 dark:text-rose-400',      bg: 'bg-rose-50 dark:bg-rose-950/20',      border: 'border-rose-100 dark:border-rose-900/30'     },
  { label: 'أون لاين',       to: '/teacher/online',     icon: MonitorPlay,    color: 'text-teal-600 dark:text-teal-400',     bg: 'bg-teal-50 dark:bg-teal-950/20',      border: 'border-teal-100 dark:border-teal-900/30'    },
];

export default function HomePage() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sData, gData] = await Promise.all([
          studentsAPI.getAll({ limit: 1 }),
          groupsAPI.getAll(),
        ]);
        setStats({
          totalStudents: sData.pagination?.total || 0,
          totalGroups:   gData.groups?.length    || 0,
          activeYears:   new Set(gData.groups?.map(g => g.academicYear) || []).size,
        });
      } catch {
        setStats({ totalStudents: '—', totalGroups: '—', activeYears: '—' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      <Helmet><title>لوحة التحكم | نظام المعلم</title></Helmet>

      {/* Custom Inline CSS Animations for subtle ambient dashboard glow and grid flows */}
      <style>{`
        @keyframes flow-grid {
          0% { background-position: 0 0; }
          100% { background-position: 4rem 4rem; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
        .animate-flow-grid {
          animation: flow-grid 20s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
      `}</style>

      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 antialiased font-sans overflow-hidden">
        
        {/* Fine Mathematical Grid Backdrop */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none z-0" />
        
        {/* Soft Ambient Radiance */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-violet-500/5 dark:bg-violet-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

        <div className="relative p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 z-10">

          {/* Welcome Banner */}
          <div className="relative overflow-hidden bg-gradient-to-l from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-600/15 dark:via-indigo-600/5 dark:to-transparent border border-slate-200/80 dark:border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-sm backdrop-blur-md group">
            
            {/* Background SVG blueprint lines on the banner */}
            <svg className="absolute left-0 bottom-0 top-0 h-full w-1/3 opacity-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 0,100 L 100,0 M 20,100 L 100,20 M 40,100 L 100,40 M 60,100 L 100,60" stroke="currentColor" strokeWidth="0.5" fill="none" />
              <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
            </svg>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-100 dark:to-white bg-clip-text text-transparent">
                  أهلاً، {user?.name} 👋
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium tracking-wide flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-500/80" />
                  {today}
                </p>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-2xl border border-indigo-500/20 dark:border-indigo-500/30 shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30">
                <TrendingUp className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs sm:text-sm font-bold tracking-wider">منصة الإبداع</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500/40 opacity-75"></span>
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400 relative z-10" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="إجمالي الطلاب" 
                value={stats?.totalStudents} 
                icon={Users} 
                color="text-indigo-600 dark:text-indigo-400" 
                bgColor="bg-indigo-50" 
                darkBgColor="dark:bg-indigo-950/20" 
              />
              <StatCard 
                title="المجموعات" 
                value={stats?.totalGroups} 
                icon={BookOpen} 
                color="text-sky-600 dark:text-sky-400" 
                bgColor="bg-sky-50" 
                darkBgColor="dark:bg-sky-950/20" 
              />
              <StatCard 
                title="السنوات الدراسية" 
                value={stats?.activeYears} 
                icon={Calendar} 
                color="text-violet-600 dark:text-violet-400" 
                bgColor="bg-violet-50" 
                darkBgColor="dark:bg-violet-950/20" 
              />
              <StatCard 
                title="الصفحات النشطة" 
                value="14" 
                icon={FileText} 
                color="text-emerald-600 dark:text-emerald-400" 
                bgColor="bg-emerald-50" 
                darkBgColor="dark:bg-emerald-950/20" 
                sub="صفحة في المنظومة" 
              />
            </div>
          )}

          {/* Quick links Grid */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-indigo-500 rounded-full" />
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">الوصول السريع</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {QUICK_LINKS.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center justify-between gap-4 p-5 bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl hover:shadow-xl hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300 text-center group relative overflow-hidden`}
                >
                  {/* Decorative faint glow inside quicklink cards */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div className={`p-4 rounded-2xl ${item.bg} border ${item.border} group-hover:scale-110 group-hover:rotate-2 transition-all duration-300 shadow-sm relative z-10`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  
                  <div className="flex flex-col items-center gap-1 relative z-10 w-full">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wide">{item.label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-[-2px] transition-all duration-300">
                      انتقال 
                      <ChevronLeft className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
