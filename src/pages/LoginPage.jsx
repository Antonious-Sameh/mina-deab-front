import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Eye, EyeOff, HelpCircle } from 'lucide-react'; // Removed unused Sigma and Binary
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';

export default function LoginPage() {
  // --- الحفاظ على اللوجيك الأصلي تماماً بدون أي تغيير ---
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmed = code.trim().replace(/\s+/g, '');
    if (!trimmed) { 
      toast.error('يرجى إدخال كود الدخول'); 
      return; 
    }

    setLoading(true);
    try {
      const user = await login(trimmed);
      toast.success(`مرحباً بك ${user.name}`);
      const from = location.state?.from?.pathname;
      if (from && from !== '/') {
        navigate(from, { replace: true });
      } else {
        navigate(user.role === 'teacher' ? '/teacher/home' : '/student/home', { replace: true });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'كود الدخول غير صحيح، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\s+/g, '').toUpperCase();
    setCode(value);
  };
  // ----------------------------------------------------

  return (
    <>
      <Helmet>
        <title>تسجيل الدخول | الإبداع في الرياضيات</title>
      </Helmet>

      {/* التصميم المطور (Premium) 
        - تم الحفاظ على الخلفية والفوتر والنصوص.
        - تم تكبير صورة المدرس بنسبة ~30% واستخدام aspect-square مع object-contain لضمان عدم القص.
        - تم إزالة العناصر المشتتة (Sigma, Binary).
        - تم تحسين جودة الكارد، الـ Input، والزر (Premium Look).
      */}
      <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 px-4 antialiased relative overflow-hidden selection:bg-indigo-500/30 font-sans">
        
        {/* شبكة هندسية دقيقة للخلفية (Math Grid Effect) - تم الحفاظ عليها */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 pointer-events-none z-0" />

        {/* تأثيرات ضوئية ملونة (أشعة الجبر والهندسة) - تم الحفاظ عليها */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none z-0" />

        <div className="flex-1 flex flex-col justify-center py-16 sm:px-6 lg:px-8 relative z-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-[460px]"> {/* تم تكبير الـ max-w قليلاً لتنفس التصميم */}
            
            {/* الكارت الزجاجي الحديث الاحترافي (Premium Upgrade)
              - border أرق، shadow أعمق وأكثر نعومة، و blur أقل.
            */}
            <Card className="border border-slate-800/40 bg-slate-900/50 backdrop-blur-lg shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] rounded-3xl overflow-visible mt-28 relative transition-shadow duration-300">
              
              {/* تم حذف الأيقونات الرياضية العائمة المشتتة (Sigma/Binary) */}

              {/* الصورة الشخصية المدمجة ببرواز مضيء هندسي (التركيز الأساسي)
                - تم تكبير المساحة بنسبة ~30% (w-40 h-40).
                - تم استخدام object-contain لضمان عدم قص الوجه أو الأكتاف.
                - إطار بسيط جداً (حلقة واحدة) مع glow احترافي.
                - تمت إزالة التدرج اللوني المبالغ فيه.
              */}
              <div className="absolute -top-20 inset-x-0 flex justify-center z-20">
                <div className="w-40 h-40 rounded-3xl p-1 bg-slate-800 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.6)] relative">
                  {/* Glow خفيف واحترافي حول الصورة (Premium Glow) */}
                  <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-xl opacity-80 pointer-events-none" />
                  
                  <div className="w-full h-full rounded-[21px] overflow-hidden bg-slate-950 relative group border-2 border-slate-700/50 flex items-center justify-center">
                    <img 
                      src="/teacher.jpg" 
                      alt="صورة الأستاذ" 
                      className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                      loading="eager"
                    />
                    {/* طبقة تفاعلية ناعمة عند الـ Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              </div>

              {/* الهيدر الجديد المبتكر - تم زيادة الـ padding وتنسيق النصوص */}
              <div className="relative pt-28 pb-6 px-8 text-center overflow-hidden">
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-100 via-slate-100 to-indigo-100 bg-clip-text text-transparent">
                  الإبداع في الرياضيات
                </h1>
                <p className="text-sm text-slate-400 mt-4 max-w-[340px] mx-auto leading-relaxed">
                  دي مش رياضة دي مزيكا 🎻🎻
                </p>
              </div>

              {/* منطقة إدخال الكود الفاخرة */}
              <CardContent className="pt-8 pb-12 px-8 sm:px-12">
                <form id="login-form" onSubmit={handleSubmit} className="space-y-8">
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <Label 
                        htmlFor="code" 
                        className="text-xs font-medium text-slate-400 tracking-wider"
                      >
                        أدخل كود المرور الخاص بك
                      </Label>
                      {/* Math_Key badge - تم تبسيطها */}
                      <span className="text-[10px] text-indigo-300 bg-indigo-950/50 px-3 py-1 rounded-full font-mono border border-indigo-900/50">
                        Math_Key
                      </span>
                    </div>
                    
                    {/* Input المطور (Premium Input)
                      - h-16 ليعطي شعوراً بالفخامة.
                      - text-3xl مع tracking متباعد.
                      - focus animation أنعم وحدود أرق.
                    */}
                    <div className="relative flex items-center group">
                      <Input
                        id="code"
                        type={showCode ? "text" : "password"}
                        placeholder="••••••••"
                        value={code}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="text-center text-3xl font-bold tracking-[0.3em] h-16 bg-slate-950/80 border border-slate-800 text-indigo-50 focus-visible:ring-1 focus-visible:ring-indigo-500/80 focus-visible:border-indigo-600 transition-all rounded-2xl placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-700 pl-16 pr-5 shadow-inner group-hover:border-slate-700/80 w-full"
                        dir="ltr"
                        autoFocus
                        autoComplete="current-password"
                        autoCapitalize="characters"
                        inputMode="text"
                        aria-label="كود الدخول"
                      />
                      
                      {/* زر إظهار/إخفاء الكود */}
                      <button
                        type="button"
                        onClick={() => setShowCode(!showCode)}
                        className="absolute left-5 p-2.5 text-slate-500 hover:text-indigo-200 hover:bg-slate-800/80 active:bg-slate-800 transition-all rounded-xl focus:outline-none"
                        aria-label={showCode ? "إخفاء الكود" : "إظهار الكود"}
                      >
                        {showCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* زر الدخول الجديد كلياً (Premium Button)
                    - h-14 ليتناسب مع الـ input.
                    - لون أزرق واحد (indigo-600)، مع hover ناعم.
                    - micro-interaction عند الضغط.
                    - glow خفيف يعبر عن الانطلاق.
                  */}
                  <Button
                    type="submit"
                    className="w-full h-14 text-lg font-bold bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98] rounded-2xl shadow-[0_6px_25px_-5px_rgba(79,70,229,0.4)] transition-all duration-200 flex items-center justify-center gap-3 group border border-indigo-700/50"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-3" role="status" aria-live="polite">
                        <span className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                        <span>جاري التحقق من المعطيات...</span>
                      </span>
                    ) : (
                      <>
                        <span>انطلق نحو الإبداع</span>
                        <ArrowLeft className="h-5 w-5 transition-transform duration-300 ease-out group-hover:-translate-x-1.5 rtl:rotate-180 text-indigo-100" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* الفوتر الجديد المحدث - تم الحفاظ عليه مع تحسين طفيف للهوامش */}
        <footer className="w-full py-8 text-center border-t border-slate-900 bg-slate-950/40 backdrop-blur-md relative z-10">
          <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-1.5 px-6">
            <p className="text-xs text-slate-500 font-medium">
              &copy; 2026 الإبداع في الرياضيات. جميع الحقوق محفوظة.
            </p>
            <p className="text-[11px] text-slate-600 font-normal">
              تطوير: المهندس أنطونيوس سامح
            </p>
          </div>
        </footer>

      </div>
    </>
  );
}