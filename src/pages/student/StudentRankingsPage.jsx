import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Trophy, Loader2, AlertCircle, Star, TrendingUp, Users, Target, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { studentAPI } from '@/api/services';
import { toast } from 'sonner';

export default function StudentRankingsPage() {
  const [rank,    setRank]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    studentAPI.rank()
      .then(d => setRank(d))
      .catch(() => {
        setError('فشل تحميل بيانات الترتيب');
        toast.error('فشل تحميل بيانات الترتيب');
      })
      .finally(() => setLoading(false));
  }, []);

  // الحفاظ على كامل الـ Logic الخاص بالدالة مع تحديث الفئات بلمسة تصميم عصرية ومختلفة تماماً
  const getRankStyle = (r) => {
    if (!r) return { color: 'text-slate-400', bg: 'bg-slate-500/5', border: 'border-slate-200/60', badge: 'bg-slate-100 text-slate-600', glow: '' };
    if (r === 1) return { color: 'text-amber-500', bg: 'bg-amber-500/[0.03]', border: 'border-amber-500/20 shadow-amber-500/[0.04]', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', glow: 'shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]' };
    if (r === 2) return { color: 'text-slate-400', bg: 'bg-slate-400/[0.03]', border: 'border-slate-400/20 shadow-slate-400/[0.04]', badge: 'bg-slate-400/10 text-slate-600 dark:text-slate-300', glow: 'shadow-[0_0_30px_-5px_rgba(148,163,184,0.15)]' };
    if (r === 3) return { color: 'text-amber-700', bg: 'bg-amber-700/[0.03]', border: 'border-amber-700/20 shadow-amber-700/[0.04]', badge: 'bg-amber-700/10 text-amber-700 dark:text-amber-400', glow: 'shadow-[0_0_30px_-5px_rgba(180,83,9,0.15)]' };
    return { color: 'text-indigo-600', bg: 'bg-indigo-600/[0.02]', border: 'border-indigo-600/10 shadow-indigo-600/[0.02]', badge: 'bg-indigo-50 text-indigo-600', glow: '' };
  };

  const style = getRankStyle(rank?.rank);
  const pct   = rank?.percentage || 0;
  const noData = !rank?.outOf || rank?.outOf === 0;

  return (
    <>
      <Helmet><title>ترتيبي | منصة الطالب</title></Helmet>
      
      <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-8 antialiased">
        
        {/* Header Section - تم إعادة توزيع العناصر وإضافة تأثير بصري مميز ونظيف */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full backdrop-blur-sm">لوحة القيادة</span>
              <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">مستوى الأداء البصري</h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1.5 font-light leading-relaxed">تابع ترتيبك المباشر ومدى تقدمك في جميع الاختبارات الإلكترونية بين زملائك.</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <Target className="h-6 w-6 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Loading State - تصميم عصري للتحميل بدون تشتيت */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="h-12 w-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin" />
            </div>
            <p className="text-sm font-medium text-muted-foreground animate-pulse">جاري استدعاء البيانات وتحديث لوحة الشرف...</p>
          </div>
        )}

        {/* Error State - تصميم احترافي لرسائل الخطأ */}
        {error && (
          <div className="flex items-start gap-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 shadow-sm shadow-rose-500/[0.02]">
            <div className="p-2 bg-rose-100 rounded-xl shrink-0">
              <AlertCircle className="h-5 w-5"/>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm">تنبيه بالنظام</h4>
              <p className="text-xs text-rose-600/90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* No Data State - تصميم توضيحي جذاب ومختلف تماماً عن فكرة الـ Card الميتة */}
        {!loading && !error && (noData || rank?.rank === null) ? (
          <div className="text-center py-16 px-6 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl backdrop-blur-sm">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-100 text-slate-400 mb-4 shadow-sm">
              <Award className="h-8 w-8 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">رحلتك لم تبدأ بعد!</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2 leading-relaxed">بمجرد خوضك لأول امتحان إلكتروني، سيتم احتساب نقاطك وتحديد مركزك هنا فوراً.</p>
          </div>
        ) : !loading && !error && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Rank Card Hero - إعادة صياغة كاملة لبطاقة المركز لعرضها بشكل فخم ومحترف */}
            <div className={`relative overflow-hidden rounded-3xl border ${style.border} ${style.bg} ${style.glow} transition-all duration-300`}>
              <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                <Trophy className="h-48 w-48 -mr-12 -mt-12" />
              </div>

              <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="text-center md:text-right space-y-2">
                  {rank.rank <= 3 ? (
                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold shadow-sm ${style.badge}`}>
                      {rank.rank === 1 ? '🥇 صدارة المنصة' : rank.rank === 2 ? '🥈 الوصيف الأول' : '🥉 النخبة الثالثة'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      لوحة المنافسة المباشرة
                    </span>
                  )}
                  <h3 className="text-slate-500 text-sm font-medium pt-1">ترتيبك الحالي في النظام</h3>
                  <p className="text-xs text-muted-foreground">أنت متقدم على مجموعة متميزة من الطلاب</p>
                </div>

                <div className="flex items-baseline gap-1 bg-white dark:bg-slate-900 border border-slate-100 px-6 py-4 rounded-2xl shadow-sm min-w-[160px] justify-center">
                  <span className="text-xs text-muted-foreground ml-1">المركز</span>
                  <span className={`text-6xl font-black tracking-tight ${style.color}`}>
                    {rank.rank}
                  </span>
                  <span className="text-slate-400 font-light mx-1 text-xl">/</span>
                  <span className="text-sm font-bold text-slate-600">{rank.outOf}</span>
                </div>
              </div>
            </div>

            {/* Stats Dashboard Grid - توزيع ثلاثي متوازن وبألوان هادئة ومريحة كلياً */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <Card className="overflow-hidden border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <Star className="h-5 w-5 fill-amber-500/10" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-2xl font-black text-slate-800 tracking-tight">{rank.totalScore || 0}</p>
                    <p className="text-xs font-medium text-slate-400">النقاط المحصّلة</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-2xl font-black text-slate-800 tracking-tight">{rank.totalMax || 0}</p>
                    <p className="text-xs font-medium text-slate-400">المجموع الكلي</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${pct >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500'}`}>
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className={`text-2xl font-black tracking-tight ${pct >= 70 ? 'text-emerald-600' : 'text-orange-600'}`}>{pct}%</p>
                    <p className="text-xs font-medium text-slate-400">النسبة المئوية</p>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Advanced Progress Card - إعادة تصميم شريط التقدم ليكون فائق الحداثة والدقة */}
            <Card className="border border-slate-100 bg-white shadow-sm overflow-hidden relative">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-600" />
                    <span className="text-sm font-bold text-slate-700">مؤشر الكفاءة الإجمالي</span>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-md ${
                    pct >= 85 ? 'bg-emerald-50 text-emerald-700' : 
                    pct >= 70 ? 'bg-blue-50 text-blue-700' : 
                    pct >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {pct >= 85 ? 'ممتاز واعد' : pct >= 70 ? 'جيد جداً' : pct >= 50 ? 'مقبول روتيني' : 'بحاجة لتركيز'}
                  </span>
                </div>

                {/* شريط تقدم مخصص بنعومة فائقة وتأثير كبسولة عصري */}
                <div className="relative pt-1">
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-[2px]">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${
                        pct >= 85 ? 'bg-emerald-500' : 
                        pct >= 70 ? 'bg-indigo-600' : 
                        pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-50">
                  <p>توزيع الدرجات الفعلي:</p>
                  <p className="font-semibold text-slate-600">
                    حققت <span className="text-indigo-600 font-bold">{rank.totalScore}</span> من أصل <span className="font-bold">{rank.totalMax}</span> درجة متاحة بالمنصة
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </>
  );
}