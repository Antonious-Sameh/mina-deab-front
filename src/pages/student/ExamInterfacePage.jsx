import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Timer, Send, CheckCircle2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ExamInterfacePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success('تم تسليم الامتحان بنجاح!');
      navigate('/student/exams');
    }, 1500);
  };

  return (
    <>
      <Helmet><title>واجهة الامتحان - منصة الطالب</title></Helmet>
      
      {/* خلفية غامرة ومريحة للعين مع تحسين الـ Spacing العام */}
      <div className="min-h-screen bg-slate-50/70 text-slate-900 antialiased selection:bg-primary/10">
        
        {/* هيدر نحيف ومودرن أشبه بتطبيقات الـ SaaS الاحترافية */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight text-slate-800">امتحان الوحدة الثانية</h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">يتكون من 3 أسئلة • اختبار تقييمي</p>
            </div>
          </div>
          
          {/* عداد وقت بتصميم كبسولة حديث ومميز عن التصميم التقليدي */}
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold font-mono tracking-wider shadow-sm text-sm border border-slate-800 animate-pulse">
            <Timer className="h-4 w-4 text-primary-foreground/80" />
            29:59
          </div>
        </header>

        {/* توزيع العناصر الجديد: Grid مخصص للشاشات الكبيرة ليصبح Layout احترافي */}
        <main className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* الجانب الأيمن: الأسئلة (تأخذ مساحة 2/3 في الشاشات الكبيرة) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* السؤال الأول */}
            <Card className="border-slate-100 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                    ١
                  </span>
                  <h3 className="font-bold text-lg md:text-xl text-slate-800 pt-0.5 leading-relaxed">
                    ما هو عاصمة جمهورية مصر العربية؟
                  </h3>
                </div>
                
                <RadioGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="relative flex items-center border border-slate-150 rounded-xl p-4 hover:border-primary/40 hover:bg-slate-50/50 transition-all duration-200 cursor-pointer group">
                    <RadioGroupItem value="alex" id="r1" className="text-primary border-slate-300 ml-3" />
                    <Label htmlFor="r1" className="cursor-pointer flex-1 font-medium text-slate-700 group-hover:text-slate-900 select-none">
                      الإسكندرية
                    </Label>
                  </div>
                  
                  <div className="relative flex items-center border border-slate-150 rounded-xl p-4 hover:border-primary/40 hover:bg-slate-50/50 transition-all duration-200 cursor-pointer group">
                    <RadioGroupItem value="cairo" id="r2" className="text-primary border-slate-300 ml-3" />
                    <Label htmlFor="r2" className="cursor-pointer flex-1 font-medium text-slate-700 group-hover:text-slate-900 select-none">
                      القاهرة
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* السؤال الثاني */}
            <Card className="border-slate-100 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                    ٢
                  </span>
                  <h3 className="font-bold text-lg md:text-xl text-slate-800 pt-0.5 leading-relaxed">
                    النيل هو أطول نهر في العالم.
                  </h3>
                </div>
                
                <RadioGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="relative flex items-center border border-slate-150 rounded-xl p-4 hover:border-primary/40 hover:bg-slate-50/50 transition-all duration-200 cursor-pointer group">
                    <RadioGroupItem value="true" id="r3" className="text-primary border-slate-300 ml-3" />
                    <Label htmlFor="r3" className="cursor-pointer flex-1 font-medium text-slate-700 group-hover:text-slate-900 select-none">
                      صح
                    </Label>
                  </div>
                  
                  <div className="relative flex items-center border border-slate-150 rounded-xl p-4 hover:border-primary/40 hover:bg-slate-50/50 transition-all duration-200 cursor-pointer group">
                    <RadioGroupItem value="false" id="r4" className="text-primary border-slate-300 ml-3" />
                    <Label htmlFor="r4" className="cursor-pointer flex-1 font-medium text-slate-700 group-hover:text-slate-900 select-none">
                      خطأ
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

          </div>

          {/* الجانب الأيسر: لوحة التحكم الإضافية بصرية (Sidebar / Control Widget) */}
          {/* ميزة بصرية ذكية تحسن الـ UX وتجعل لوحة التحكم ثابتة وجانبية لإنهاء الشكل التقليدي */}
          <div className="space-y-6 sticky top-24">
            <Card className="border-slate-100 shadow-md rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h4 className="font-bold text-slate-800 text-sm mb-1">حالة التقدم</h4>
                  <p className="text-xs text-slate-400">تأكد من الإجابة على جميع الأسئلة قبل التسليم</p>
                </div>

                {/* مؤشر بصري لعدد الأسئلة (UX Enhancement) */}
                <div className="flex flex-wrap gap-2.5">
                  <span className="w-9 h-9 rounded-xl border-2 border-primary bg-primary/5 text-primary flex items-center justify-center font-bold text-xs shadow-sm">١</span>
                  <span className="w-9 h-9 rounded-xl border-2 border-primary bg-primary/5 text-primary flex items-center justify-center font-bold text-xs shadow-sm">٢</span>
                  <span className="w-9 h-9 rounded-xl border border-slate-250 bg-slate-50 text-slate-400 flex items-center justify-center font-bold text-xs">٣</span>
                </div>

                <div className="pt-2">
                  <Button 
                    size="lg" 
                    onClick={handleSubmit} 
                    disabled={loading} 
                    className="w-full gap-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 py-6"
                  >
                    <Send className="h-4 w-4" /> 
                    {loading ? 'جاري التسليم...' : 'تسليم الامتحان بالكامل'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* بطاقة إرشادية سريعة لملء الفراغ البصري بشكل احترافي */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-5 shadow-md flex items-start gap-3.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-sm text-slate-100">حفظ تلقائي نشط</h5>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">يتم حفظ إجاباتك بشكل تلقائي وآمن في خوادم المنصة فور اختيارها.</p>
              </div>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}