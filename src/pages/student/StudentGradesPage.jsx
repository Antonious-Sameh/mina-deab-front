import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Award,
  Loader2,
  AlertCircle,
  Monitor,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Zap,
  Calendar,
  TrendingUp,
  BookOpen,
  Folder,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { studentAPI } from "@/api/services";
import { toast } from "sonner";

const TYPE_INFO = {
  electronic: {
    label: "إلكتروني",
    icon: Monitor,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50",
  },
  paper: {
    label: "ورقي",
    icon: ClipboardList,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50",
  },
};

export default function StudentGradesPage() {
  const [grades, setGrades] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    studentAPI
      .grades()
      .then((d) => {
        setGrades(d.grades || []);
        setSummary(d.summary || {});
      })
      .catch(() => {
        setError("فشل تحميل الدرجات");
        toast.error("فشل تحميل الدرجات");
      })
      .finally(() => setLoading(false));
  }, []);

  const getGradeColor = (score, max) => {
    if (!max) return "text-slate-400";
    const pct = (score / max) * 100;
    if (pct >= 85) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 70) return "text-blue-600 dark:text-blue-400";
    if (pct >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-rose-500 dark:text-rose-400";
  };

  const getPct = (score, max) =>
    max > 0 ? Math.round((score / max) * 100) : null;

  return (
    <>
      <Helmet>
        <title>درجاتي | منصة الطالب</title>
      </Helmet>
      
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 antialiased text-right" dir="rtl">
        
        {/* Modern Modern Header Area */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="space-y-1.5">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">درجاتي</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              تابِع نتائج اختباراتك الدورية وتقييم درجاتك أولاً بأول.
            </p>
          </div>
          
          {!loading && !error && grades.length > 0 && (
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 w-fit">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">إجمالي الاختبارات</p>
                <p className="text-lg font-black text-slate-800 dark:text-slate-200 leading-none mt-0.5">
                  {summary.examCount || 0} <span className="text-xs font-normal text-slate-500">اختبار</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
              <div className="absolute h-12 w-12 rounded-full border-2 border-primary/10 animate-ping" />
            </div>
            <p className="text-sm font-medium text-slate-400 animate-pulse">جاري جلب ملف الدرجات...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-4 p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-rose-700 dark:text-rose-400 shadow-sm max-w-xl mx-auto">
            <div className="p-3 bg-rose-500/10 rounded-xl shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-base">حدث خطأ أثناء التحميل</h4>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Main Content Visual Hierarchy */}
            {grades.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <Award className="h-8 w-8 text-slate-400 opacity-60" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">سجل الدرجات فارغ</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">
                    بمجرد تصحيح اختباراتك أو اعتمادها من قِبل المعلم، ستظهر تقاريرك بالتفصيل هنا.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Section Title */}
                <div className="flex items-center gap-2 px-1">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">قائمة التقارير التفصيلية</span>
                </div>

                {/* Grid/List Layout */}
                <div className="grid gap-3.5">
                  {grades.map((g) => {
                    const maxScore = g.maxScore || 0;
                    const pct = g.percentage ?? getPct(g.score, maxScore);
                    const passed = pct !== null ? pct >= 50 : null;
                    const typeInfo = TYPE_INFO[g.examType] || TYPE_INFO.electronic;
                    const TypeIcon = typeInfo.icon;

                    return (
                      <Card
                        key={g._id}
                        className="group relative border border-slate-200/80 dark:border-slate-800/80 bg-background hover:bg-slate-50/40 dark:hover:bg-slate-900/20 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden"
                      >
                        {/* Interactive Side Border Indicator instead of Top bar */}
                        <div
                          className={`absolute right-0 top-0 bottom-0 w-[5px] transition-all duration-300 group-hover:w-[7px] ${
                            pct === null
                              ? "bg-slate-200 dark:bg-slate-700"
                              : pct >= 85
                                ? "bg-emerald-500"
                                : pct >= 70
                                  ? "bg-blue-500"
                                  : pct >= 50
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                          }`}
                        />

                        <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 mr-[5px]">
                          
                          {/* Right Side: Meta & Info Section */}
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            {/* Visual Rounded Badge Indicator */}
                            <div
                              className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-105 ${
                                passed === null
                                  ? "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400"
                                  : passed
                                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/30 text-rose-500 dark:text-rose-400"
                              }`}
                            >
                              {passed === null ? (
                                <Award className="h-5 w-5" />
                              ) : passed ? (
                                <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
                              ) : (
                                <XCircle className="h-5 w-5 stroke-[2.5]" />
                              )}
                            </div>

                            {/* Text Metadata Details */}
                            <div className="space-y-2 flex-1 min-w-0">
                              <h3 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100 leading-snug tracking-tight truncate pl-2">
                                {g.title}
                              </h3>
                              
                              <div className="flex flex-wrap items-center gap-2.5">
                                {/* Badges */}
                                <span
                                  className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-lg font-bold border ${typeInfo.bg} ${typeInfo.color}`}
                                >
                                  <TypeIcon className="h-3 w-3" />
                                  {typeInfo.label}
                                </span>

                                {g.isAuto && (
                                  <Badge className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 text-[11px] font-bold gap-1 px-2.5 py-0.5 rounded-lg shadow-none">
                                    <Zap className="h-3 w-3 fill-current" /> تصحيح تلقائي
                                  </Badge>
                                )}

                                {/* Calendar Meta */}
                                {g.examDate && (
                                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <Calendar className="h-3 w-3 text-slate-400" />
                                    {new Date(g.examDate).toLocaleDateString("ar-EG", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric"
                                    })}
                                  </span>
                                )}

                                {/* Section / Category (paper exams only, when assigned) */}
                                {g.section && (
                                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <Folder className="h-3 w-3 text-slate-400" />
                                    {g.section}
                                  </span>
                                )}
                              </div>

                              {g.note && (
                                <div className="text-xs bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800/80 p-2 rounded-xl inline-block max-w-full truncate">
                                  <span className="font-semibold text-slate-400">ملاحظة المعلم: </span>
                                  {g.note}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Left Side: Dynamic Scoring Data Matrix */}
                          <div className="flex items-center gap-4 sm:gap-6 bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-3 sm:px-5 sm:py-3 md:min-w-[280px] justify-between self-stretch md:self-auto">
                            
                            {/* Score Display */}
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">الدرجة المحققة</p>
                              <div className="flex items-baseline gap-1">
                                <span className={`text-2xl sm:text-3xl font-black tracking-tight ${getGradeColor(g.score, maxScore)}`}>
                                  {g.score}
                                </span>
                                <span className="text-slate-300 dark:text-slate-700 text-sm font-light">/</span>
                                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                  {maxScore || "—"}
                                </span>
                              </div>
                            </div>

                            {/* Separator Line */}
                            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />

                            {/* Percentage Matrix Block */}
                            <div className="space-y-1.5 min-w-[70px] flex-1 sm:flex-initial text-left flex flex-col items-end">
                              <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase block">النسبة المئوية</span>
                              
                              <div className="w-full space-y-1">
                                <span
                                  className={`text-lg sm:text-xl font-black leading-none tracking-tight block ${
                                    pct === null
                                      ? "text-slate-400"
                                      : pct >= 50
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-rose-500 dark:text-rose-400"
                                  }`}
                                >
                                  {pct !== null ? `${pct}%` : "—"}
                                </span>

                                {/* Linear Progress Micro-indicator */}
                                {pct !== null && (
                                  <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden w-16">
                                    <div
                                      className={`h-full rounded-full ${
                                        pct >= 85 
                                          ? "bg-emerald-500" 
                                          : pct >= 70 
                                            ? "bg-blue-500" 
                                            : pct >= 50 
                                              ? "bg-amber-500" 
                                              : "bg-rose-500"
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                )}
                              </div>

                            </div>

                          </div>

                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}