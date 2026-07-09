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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { studentAPI } from "@/api/services";
import { toast } from "sonner";

const TYPE_INFO = {
  electronic: {
    label: "إلكتروني",
    icon: Monitor,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  paper: {
    label: "ورقي",
    icon: ClipboardList,
    color: "text-orange-600",
    bg: "bg-orange-50",
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
    if (!max) return "text-muted-foreground";
    const pct = (score / max) * 100;
    if (pct >= 85) return "text-green-600";
    if (pct >= 70) return "text-blue-600";
    if (pct >= 50) return "text-yellow-600";
    return "text-red-500";
  };

  const getPct = (score, max) =>
    max > 0 ? Math.round((score / max) * 100) : null;

  return (
    <>
      <Helmet>
        <title>درجاتي | منصة الطالب</title>
      </Helmet>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <h2 className="text-2xl font-extrabold mb-0.5">درجاتي</h2>
          <p className="text-muted-foreground text-sm">
            {loading ? "..." : `${summary.examCount || 0} امتحان`}
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Summary cards */}
            {grades.length > 0 && (
              <div className="max-w-md mx-auto">
                <Card className="border border-primary/10 shadow-md bg-gradient-to-r from-primary/10 via-background to-background overflow-hidden relative">
                  {/* لمسة جمالية: دائرة خفيفة في الخلفية تمنح التصميم عمقاً */}
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full blur-xl" />

                  <CardContent className="p-5 flex items-center justify-between relative z-10">
                    <div className="space-y-1 text-right">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                        الإحصائيات الحالية
                      </span>
                      <h3 className="text-2xl font-black text-foreground pt-1">
                        {summary.examCount || 0}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          امتحانات محتواة
                        </span>
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        إجمالي عدد الاختبارات التي تم تسجيل درجاتها
                      </p>
                    </div>

                    {/* أيقونة مميزة تعبر عن الامتحانات داخل خلفية دائرية ملونة */}
                    <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shadow-primary/30 shrink-0">
                      <ClipboardList className="h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Grades list */}
            {grades.length === 0 ? (
              <div className="text-center py-20 bg-card border rounded-2xl border-dashed">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-bold">لا توجد درجات بعد</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  ستظهر درجاتك هنا بعد حل أو تصحيح الامتحانات
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {grades.map((g) => {
                  const maxScore = g.maxScore || 0;
                  const pct = g.percentage ?? getPct(g.score, maxScore);
                  const passed = pct !== null ? pct >= 50 : null;
                  const typeInfo =
                    TYPE_INFO[g.examType] || TYPE_INFO.electronic;
                  const TypeIcon = typeInfo.icon;

                  return (
                    <Card
                      key={g._id}
                      className="border shadow-sm overflow-hidden"
                    >
                      <CardContent className="p-0">
                        {/* Top color bar based on score */}
                        <div
                          className={`h-1 ${
                            pct === null
                              ? "bg-muted"
                              : pct >= 85
                                ? "bg-green-500"
                                : pct >= 70
                                  ? "bg-blue-500"
                                  : pct >= 50
                                    ? "bg-yellow-500"
                                    : "bg-red-400"
                          }`}
                        />
                        <div className="p-4 space-y-3">
                          {/* Title row + status icon */}
                          <div className="flex items-start gap-3">
                            <div
                              className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                                passed === null
                                  ? "bg-muted"
                                  : passed
                                    ? "bg-green-100"
                                    : "bg-red-100"
                              }`}
                            >
                              {passed === null ? (
                                <Award className="h-5 w-5 text-muted-foreground" />
                              ) : passed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold leading-snug">
                                {g.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {/* Exam type badge */}
                                <span
                                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.bg} ${typeInfo.color}`}
                                >
                                  <TypeIcon className="h-3 w-3" />{" "}
                                  {typeInfo.label}
                                </span>
                                {/* Auto-graded badge */}
                                {g.isAuto && (
                                  <Badge className="bg-primary/10 text-primary border-0 text-xs gap-1 px-1.5">
                                    <Zap className="h-2.5 w-2.5" /> تصحيح تلقائي
                                  </Badge>
                                )}
                                {/* Date */}
                                {g.examDate && (
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(g.examDate).toLocaleDateString(
                                      "ar-EG",
                                    )}
                                  </span>
                                )}
                              </div>
                              {g.note && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {g.note}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Score row — clearly labeled */}
                          <div className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3">
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-0.5">
                                الدرجة
                              </p>
                              <p
                                className={`text-2xl font-black leading-none ${getGradeColor(g.score, maxScore)}`}
                              >
                                {g.score}
                              </p>
                            </div>
                            <div className="text-muted-foreground text-lg font-light">
                              /
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-muted-foreground mb-0.5">
                                الدرجة النهائية
                              </p>
                              <p className="text-2xl font-black leading-none text-foreground">
                                {maxScore || "—"}
                              </p>
                            </div>
                            <div className="h-8 w-px bg-border mx-1" />
                            <div className="text-center min-w-[56px]">
                              <p className="text-[10px] text-muted-foreground mb-0.5">
                                النسبة
                              </p>
                              <p
                                className={`text-xl font-black leading-none ${
                                  pct === null
                                    ? "text-muted-foreground"
                                    : pct >= 50
                                      ? "text-green-600"
                                      : "text-red-500"
                                }`}
                              >
                                {pct !== null ? `${pct}%` : "—"}
                              </p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          {pct !== null && (
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${pct >= 85 ? "bg-green-500" : pct >= 70 ? "bg-blue-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-400"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
