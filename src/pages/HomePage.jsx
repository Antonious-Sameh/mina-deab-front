import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, Calendar, CreditCard, FileText,
  ClipboardCheck, Award, Star, Loader2, TrendingUp, AlertCircle, MonitorPlay, StickyNote
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { studentsAPI, groupsAPI } from '@/api/services';

function StatCard({ title, value, icon: Icon, color, bgColor, sub }) {
  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${bgColor}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const QUICK_LINKS = [
  { label: 'تسجيل الحضور',  to: '/attendance',        icon: ClipboardCheck, color: 'text-green-600',  bg: 'bg-green-50'   },
  { label: 'إدارة الطلاب',  to: '/students',           icon: Users,          color: 'text-primary',    bg: 'bg-primary/10' },
  { label: 'المدفوعات',      to: '/payments',           icon: CreditCard,     color: 'text-orange-600', bg: 'bg-orange-50'  },
  { label: 'الدرجات',        to: '/teacher/grades',     icon: Award,          color: 'text-blue-600',   bg: 'bg-blue-50'    },
  { label: 'الامتحانات',     to: '/teacher/exams',      icon: FileText,       color: 'text-purple-600', bg: 'bg-purple-50'  },
  { label: 'النقاط',         to: '/teacher/points',     icon: Star,           color: 'text-yellow-600', bg: 'bg-yellow-50'  },
  { label: 'الملاحظات',      to: '/teacher/notes',      icon: StickyNote,     color: 'text-red-600',    bg: 'bg-red-50'     },
  { label: 'أون لاين',       to: '/teacher/online',     icon: MonitorPlay,    color: 'text-teal-600',   bg: 'bg-teal-50'    },
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
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

        {/* Welcome */}
        <div className="bg-gradient-to-l from-primary/5 to-primary/15 border border-primary/20 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold mb-1">أهلاً، {user?.name} 👋</h2>
              <p className="text-muted-foreground text-sm">{today}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-primary">منصة خطوة</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard title="إجمالي الطلاب"   value={stats?.totalStudents} icon={Users}     color="text-primary"    bgColor="bg-primary/10" />
            <StatCard title="المجموعات"         value={stats?.totalGroups}   icon={BookOpen}  color="text-blue-600"   bgColor="bg-blue-50" />
            <StatCard title="السنوات الدراسية" value={stats?.activeYears}   icon={Calendar}  color="text-purple-600" bgColor="bg-purple-50" />
            <StatCard title="الصفحات النشطة"   value="14"                    icon={FileText}  color="text-green-600"  bgColor="bg-green-50" sub="صفحة في المنظومة" />
          </div>
        )}

        {/* Quick links — all use React Router Link */}
        <div>
          <h3 className="text-lg font-bold mb-4">الوصول السريع</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {QUICK_LINKS.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center gap-3 p-4 bg-card border rounded-xl hover:shadow-md hover:border-primary/30 transition-all text-center group"
              >
                <div className={`p-3 rounded-xl ${item.bg} group-hover:scale-110 transition-transform`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}