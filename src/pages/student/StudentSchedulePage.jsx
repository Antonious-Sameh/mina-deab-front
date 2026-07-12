import React from 'react';
import { Helmet } from 'react-helmet';
import { Calendar } from 'lucide-react';
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
      <Helmet><title>جدولي | منصة الطالب</title></Helmet>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div><h2 className="text-2xl font-extrabold mb-0.5">جدولي الدراسي</h2><p className="text-muted-foreground text-sm">مواعيد الحصص الخاصة بك</p></div>
        </div>
        {schedule.length === 0 ? (
          <div className="text-center py-16 bg-card border rounded-2xl border-dashed">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">لا يوجد جدول محدد بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedule.map((s, i) => (
              <Card key={i} className="border shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{s.day}</p>
                    <p className="text-sm text-muted-foreground" dir="ltr">{s.time}</p>
                    <p className="text-xs text-primary mt-0.5">{s.group}</p>
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
