import React from 'react';
import { Helmet } from 'react-helmet';
import { Calendar, Clock, Users, CalendarDays, Inbox } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const SCHEDULE_DEMO = {
  'first-prep':  [{ day:'السبت',    time:'4:00م - 6:00م', group:'مجموعة النخبة' }, { day:'الثلاثاء', time:'4:00م - 6:00م', group:'مجموعة النخبة' }],
  'second-prep': [{ day:'الأحد',    time:'5:00م - 7:00م', group:'مجموعة الرواد' }, { day:'الأربعاء',time:'5:00م - 7:00م', group:'مجموعة الرواد' }],
  'third-prep':  [{ day:'الاثنين',  time:'4:00م - 7:00م', group:'مجموعة الأبطال' }, { day:'الخميس', time:'4:00م - 7:00م', group:'مجموعة الأبطال' }],
  'first-sec':   [{ day:'الثلاثاء', time:'6:00م - 8:00م', group:'مجموعة الصباح' }],
  'second-sec':  [{ day:'الجمعة',   time:'10:00ص - 1:00م', group:'مجموعة الإتقان' }],
  'third-sec':   [{ day:'السبت',    time:'10:00ص - 1:00م', group:'مجموعة التفوق' }],
};

export default function StudentSchedulePage() {
  const { user } = useAuth();
  const schedule = SCHEDULE_DEMO[user?.academicYear] || [];

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
                  أجندة الحصص الدراسيّة
                </h2>
                <p className="text-muted-foreground text-sm mt-1 font-medium">
                  متابعة ذكية لمواعيد مجموعاتك الأكاديمية ونشاطك القادم
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
        {schedule.length === 0 ? (
          /* State: Empty View - Minimalist & Warm */
          <div className="flex flex-col items-center justify-center text-center py-20 bg-muted/30 border-2 border-dashed border-muted rounded-3xl p-6">
            <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-sm mb-4 border">
              <Inbox className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">الجدول فارغ حالياً</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              لم يتم إدراجك في أي مجموعة دراسية بعد. تواصل مع الدعم الفني لتفعيل حسابك.
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
                      <span>{s.group}</span>
                    </div>
                  </div>

                  {/* Card Body: Time Block with Clean Typography */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs text-muted-foreground font-medium block">توقيت المحاضرة</span>
                      <span className="font-mono text-base font-bold text-foreground/90 tracking-wide" dir="ltr">
                        {s.time}
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