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
  Clock, // ضفنا أيقونة الساعة هنا
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
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-l from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6">
          <h2 className="text-2xl font-extrabold mb-1">
            أهلاً {user?.name} 👋
          </h2>
          <p className="text-muted-foreground">
            {YEAR_LABELS[user?.academicYear] || ""}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border shadow-sm">
                <CardContent className="p-4 text-center">
                  <ClipboardCheck className="h-7 w-7 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-black text-green-600">
                    {stats.attendance}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    نسبة الحضور
                  </p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4 text-center">
                  <CreditCard className="h-7 w-7 text-blue-600 mx-auto mb-2" />
                  <p
                    className={`text-xl font-black ${stats.paidOk ? "text-green-600" : "text-red-600"}`}
                  >
                    {stats.paid}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    المدفوعات
                  </p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4 text-center">
                  <Trophy className="h-7 w-7 text-yellow-500 mx-auto mb-2" />
                  <p className="text-3xl font-black text-yellow-600">
                    {stats.rank ? `${stats.rank}` : "—"}
                  </p>
                  {stats.rank && stats.rankOutOf ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      من {stats.rankOutOf} طالب
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground mt-1">
                    ترتيب النقاط
                  </p>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-4 text-center">
                  <Star className="h-7 w-7 text-orange-400 mx-auto mb-2" />
                  <p className="text-3xl font-black text-orange-500">
                    {stats.balance}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">نقاطي</p>
                </CardContent>
              </Card>
            </div>

            {/* Latest Notes */}
            {demoNotes.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" /> آخر الإعلانات
                </h3>
                {demoNotes.map((n) => (
                  <div
                    key={n._id}
                    className="flex flex-col justify-between gap-2 p-4 bg-card border rounded-xl shadow-sm md:flex-row md:items-center"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                      <p className="text-sm">{n.text}</p>
                    </div>
                    
                    {/* هنا جزء التاريخ والوقت المنقضي مع الأيقونة */}
                    {n.createdAt && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 mr-5 md:mr-0">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span>{timeAgo(n.createdAt)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}