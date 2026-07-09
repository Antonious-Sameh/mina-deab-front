import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { KeyRound, ArrowLeft, Eye, EyeOff, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';

export default function LoginPage() {
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

  return (
    <>
      <Helmet>
        <title>تسجيل الدخول | خطوة بلس</title>
      </Helmet>

      <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-slate-50 to-blue-50/20 text-slate-900 px-4 antialiased selection:bg-blue-500/10 relative overflow-hidden">
        
        {/* الخلفية الجمالية الدائرية */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none z-0">
          <div className="absolute top-[-5%] left-[10%] w-[350px] h-[350px] bg-blue-500/[0.02] rounded-full blur-[60px]" />
          <div className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] bg-blue-600/[0.02] rounded-full blur-[80px]" />
        </div>

        <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative z-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-[420px]">
            <Card className="border border-slate-200/60 bg-white shadow-[0_15px_40px_rgba(0,0,0,0.03)] rounded-3xl overflow-visible mt-12">
              
              {/* هيدر الكارت السفلي المنحني الأزرق */}
              <div className="relative bg-gradient-to-b from-blue-600 to-blue-700 pt-10 pb-20 px-6 text-center text-white rounded-t-3xl overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0,0 C50,40 50,60 100,100 L100,0 Z" fill="currentColor" />
                  </svg>
                </div>
                
                <h1 className="relative z-10 text-2xl font-bold tracking-tight">
                  خطوة 
                </h1>
                <p className="relative z-10 text-xs text-blue-100/80 mt-2 max-w-[280px] mx-auto leading-relaxed font-normal">
                  منصة تعليمية لإدارة الدروس والاختبارات ومتابعة تقدم الطلاب بسهولة.
                </p>

                {/* تماوج المنحنى السفلي للهيدر */}
                <div className="absolute bottom-0 inset-x-0 w-full overflow-hidden leading-[0] fill-white">
                  <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[48px]">
                    <path d="M0,0 C150,90 350,120 600,120 C850,120 1050,90 1200,0 L1200,120 L0,120 Z" />
                  </svg>
                </div>
              </div>

              {/* منطقة صورة المدرس المبتكرة (تتوسط المنحنى بامتياز) */}
              <div className="relative flex justify-center h-10 z-20">
                <div className="absolute -top-14 w-24 h-24 rounded-full p-1 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-transform duration-300 hover:scale-105">
                  <div className="w-full h-full rounded-full overflow-hidden border border-slate-100 bg-slate-50 relative group">
                    <img 
                      src="/teacher.jpg" 
                      alt="صورة المدرس" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="eager"
                    />
                    {/* لمعة خفيفة تظهر عند التحويم فوق الصورة */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              </div>

              {/* محتوى الفورم تم زيادة الـ pt ليناسب نزول الصورة */}
              <CardContent className="pt-14 pb-10 px-6 sm:px-10">
                <form id="login-form" onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="space-y-2">
                    <Label 
                      htmlFor="code" 
                      className="text-xs font-medium text-slate-500 pr-0.5"
                    >
                      أدخل كود الدخول
                    </Label>
                    
                    <div className="relative flex items-center group">
                      <Input
                        id="code"
                        type={showCode ? "text" : "password"}
                        placeholder="••••••••"
                        value={code}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="text-center text-xl font-semibold tracking-[0.15em] h-12 bg-slate-50/50 border border-slate-200 text-slate-900 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:bg-white focus-visible:border-blue-500 transition-all rounded-xl placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-300 pl-12 pr-4 shadow-sm group-hover:border-slate-300/90"
                        dir="ltr"
                        autoFocus
                        autoComplete="current-password"
                        autoCapitalize="characters"
                        inputMode="text"
                        aria-label="كود الدخول"
                      />
                      
                      <button
                        type="button"
                        onClick={() => setShowCode(!showCode)}
                        className="absolute left-3.5 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 active:bg-slate-200/60 transition-all rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        aria-label={showCode ? "إخفاء الكود" : "إظهار الكود"}
                      >
                        {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 group"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2" role="status" aria-live="polite">
                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>جارٍ تسجيل الدخول...</span>
                      </span>
                    ) : (
                      <>
                        <span>تسجيل الدخول</span>
                        <ArrowLeft className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5 rtl:rotate-180" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* الفوتر الثابت والمحمي بالحقوق */}
        <footer className="w-full py-6 text-center border-t border-slate-100 bg-transparent relative z-10">
          <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-1 px-4">
            <p className="text-xs text-slate-400 font-normal">
              &copy; 2026 خطوة . جميع الحقوق محفوظة.
            </p>
            <p className="text-[11px] text-slate-400/80 font-normal mt-0.5">
              تطوير: المهندس أنطونيوس سامح
            </p>
          </div>
        </footer>

      </div>
    </>
  );
}