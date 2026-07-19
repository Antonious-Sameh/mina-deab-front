import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Clock, Users, CalendarDays, Inbox, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { studentAPI } from "@/api/services";

// "16:00" (24h, as stored on the group) → "4:00 م" (12h, Arabic AM/PM) —
// same formatting convention already used for schedules in GroupCard (teacher side).
function formatTime(timeStr) {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':');
    const hour = Number(h);
    const suffix = hour >= 12 ? 'م' : 'ص';
    const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${h12}:${m} ${suffix}`;
  } catch { return timeStr; }
}

export default function StudentSchedulePage() {
  const [loading,  setLoading]  = useState(true);
  const [groupName, setGroupName] = useState('');
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await studentAPI.schedule();
        if (cancelled) return;
        setGroupName(data.group?.name || '');
        setSchedule(data.schedule || []);
      } catch {
        if (!cancelled) { setGroupName(''); setSchedule([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Helmet>
        <title>جدولي | منصة الطالب</title>
      </Helmet>

      <div className="p-5 sm:p-8 max-w-5xl mx-auto space-y-8 antialiased selection:bg-primary/20">
        {/* Header Section - Modern Sleek Style */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 sm:p-8 border border-primary/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <CalendarDays className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  جدولي الدراسي
                </h2>
                <p className="text-muted-foreground text-sm mt-1 font-medium">
                  مواعيد الحصص الخاصة بك
                </p>
              </div>
            </div>

            {/* Live Stats Badge */}
            <div className="inline-flex items-center gap-2 self-start sm:self-center px-4 py-2 rounded-full bg-background border border-border text-xs font-semibold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>مُحدّث للفصل الحالي</span>
            </div>
          </div>
        </div>

        {/* Schedule Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : schedule.length === 0 ? (
          /* State: Empty View - Minimalist & Warm */
          <div className="flex flex-col items-center justify-center text-center py-20 bg-muted/30 border-2 border-dashed border-muted rounded-3xl p-6">
            <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-sm mb-4 border">
              <Inbox className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              الجدول فارغ حالياً
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              لم يتم إدراجك في أي مجموعة دراسية بعد. تواصل مع الدعم الفني لتفعيل
              حسابك.
            </p>
          </div>
        ) : (
          /* State: Grid Layout - Premium Cards */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {schedule.map((s, i) => (
              <Card
                key={i}
                className="group relative overflow-hidden bg-card hover:bg-card/80 border border-border/60 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl"
              >
                {/* Decorative Top Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/40 via-primary to-primary/40 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />

                <CardContent className="p-6 space-y-5">
                  {/* Card Header: Day Badge & Group info */}
                  <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-4">
                    <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-primary/10 text-primary text-base font-black">
                      {s.day}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-muted/60 px-3 py-1 rounded-lg">
                      <Users className="h-3.5 w-3.5 text-primary/70" />
                      <span>{groupName}</span>
                    </div>
                  </div>

                  {/* Card Body: Time Block with Clean Typography */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs text-muted-foreground font-medium block">
                          ميعاد الدرس 
                      </span>

                      <span
                        className="text-base font-bold text-foreground"
                        style={{
                          direction: "ltr",
                          unicodeBidi: "plaintext",
                        }}
                      >
                        {formatTime(s.time)}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Interactive indicator */}
                  <div className="pt-2 flex items-center justify-end text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="inline-block translate-x-1 group-hover:translate-x-0 transition-transform duration-300">
                      حضور منتظم ←
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}