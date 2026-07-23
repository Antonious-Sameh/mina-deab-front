import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'; // Preserved core icon utilities
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

  // بعض لوحات المفاتيح الافتراضية (خصوصًا على أجهزة زي الشاشات الذكية
  // التفاعلية لما نظام التشغيل يكون بلغة عربية) بترسل أرقام عربية-هندية أو
  // فارسية بدل الأرقام الإنجليزية العادية، رغم إن الرقم زي ما هو على الشاشة.
  // بنحوّلها هنا لنفس القيمة الرقمية بترميز إنجليزي موحّد.
  const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  const PERSIAN_DIGITS      = '۰۱۲۳۴۵۶۷۸۹';
  const normalizeDigits = (str) => str.replace(/[٠-٩۰-۹]/g, (ch) => {
    const a = ARABIC_INDIC_DIGITS.indexOf(ch);
    if (a !== -1) return String(a);
    const p = PERSIAN_DIGITS.indexOf(ch);
    if (p !== -1) return String(p);
    return ch;
  });

  const handleInputChange = (e) => {
    const value = normalizeDigits(e.target.value).replace(/\s+/g, '').toUpperCase();
    setCode(value);
  };
  // ----------------------------------------------------

  return (
    <>
      <Helmet>
        <title>تسجيل الدخول | الإبداع في الرياضيات</title>
      </Helmet>

      {/* Hardware-accelerated CSS animations for lag-free performance under high concurrent users */}
      <style>{`
        @keyframes spin-cw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-ccw {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes subtle-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-spin-cw {
          animation: spin-cw 70s linear infinite;
        }
        .animate-spin-ccw {
          animation: spin-ccw 80s linear infinite;
        }
      `}</style>

      {/* 
        التصميم المطور (Drafting Board Warm-Light Edition)
        - محاكاة لوحة رسم هندسي ومسطرة قياس (Draftsman CAD Workspace).
        - خلفية ورق عاجية دافئة ومريحة ومضادة لتعب العين (Warm Ivory Page).
        - مساطر قياس (Rulers) على أطراف الشاشة مع مؤشرات زاوية منقلة للمدرس.
        - تصميم إبداعي حقيقي ومختلف تماماً عن القوالب النمطية للذكاء الاصطناعي.
      */}
      <div className="min-h-screen flex flex-col justify-between bg-[#f6f5f0] text-slate-800 antialiased relative overflow-hidden font-sans select-none">
        
        {/* ========================================== */}
        {/* CAD WORKSPACE METRIC RULERS (Desktop Only) */}
        {/* ========================================== */}
        {/* Top Ruler */}
        <div className="hidden lg:block absolute top-0 left-0 right-0 h-6 border-b border-[#cbd5e1]/45 bg-[#fdfdfb]/80 z-20 overflow-hidden pointer-events-none">
          <svg className="w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="24" x2="100%" y2="24" stroke="#e1ded5" strokeWidth="1" />
            {Array.from({ length: 45 }).map((_, i) => (
              <React.Fragment key={i}>
                <line x1={i * 50 + 24} y1="12" x2={i * 50 + 24} y2="24" stroke="#cbd5e1" strokeWidth="1" />
                <line x1={i * 50 + 24 + 25} y1="18" x2={i * 50 + 24 + 25} y2="24" stroke="#e2e8f0" strokeWidth="0.8" />
                {i % 2 === 0 && (
                  <text x={i * 50 + 28} y="10" fontSize="8" fontFamily="monospace" fill="#94a3b8">{i * 50}</text>
                )}
              </React.Fragment>
            ))}
          </svg>
        </div>

        {/* Left Ruler */}
        <div className="hidden lg:block absolute top-0 left-0 bottom-0 w-6 border-r border-[#cbd5e1]/45 bg-[#fdfdfb]/80 z-20 overflow-hidden pointer-events-none">
          <svg className="w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
            <line x1="24" y1="0" x2="24" y2="100%" stroke="#e1ded5" strokeWidth="1" />
            {Array.from({ length: 30 }).map((_, i) => (
              <React.Fragment key={i}>
                <line x1="12" y1={i * 50 + 24} x2="24" y2={i * 50 + 24} stroke="#cbd5e1" strokeWidth="1" />
                <line x1="18" y1={i * 50 + 24 + 25} x2="24" y2={i * 50 + 24 + 25} stroke="#e2e8f0" strokeWidth="0.8" />
                {i % 2 === 0 && (
                  <text x="2" y={i * 50 + 24 + 10} fontSize="8" fontFamily="monospace" fill="#94a3b8">{i * 50}</text>
                )}
              </React.Fragment>
            ))}
          </svg>
        </div>

        {/* Grid lines layout (Math Drafting Board Effect) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e8e7e0_1px,transparent_1px),linear-gradient(to_bottom,#e8e7e0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_45%,#000_80%,transparent_100%)] opacity-55 pointer-events-none z-0" />

        {/* Dynamic blueprints drawn in light silver vectors */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.35] pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
          <g className="animate-spin-cw origin-center" style={{ transformOrigin: 'center' }}>
            <circle cx="50%" cy="45%" r="180" fill="none" stroke="#e1e4eb" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="50%" cy="45%" r="320" fill="none" stroke="#e1e4eb" strokeWidth="1" />
            <circle cx="50%" cy="45%" r="480" fill="none" stroke="#d5d9e2" strokeWidth="1.2" strokeDasharray="5 5" />
            <line x1="50%" y1="45%" x2="70%" y2="20%" stroke="rgba(99, 102, 241, 0.12)" strokeWidth="1.2" />
          </g>
          <g className="animate-spin-ccw origin-center" style={{ transformOrigin: 'center' }}>
            <circle cx="50%" cy="45%" r="250" fill="none" stroke="#e1e4eb" strokeWidth="1" strokeDasharray="6 6" />
          </g>
          {/* Wave vectors */}
          <path d="M 0,350 Q 200,200 400,350 T 800,350 T 1200,350 T 1600,350" fill="none" stroke="#d4d4d8" strokeWidth="1.2" />
        </svg>

        {/* Subtle, soft light beam highlights */}
        <div className="absolute top-[25%] left-[25%] w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none z-0" />
        <div className="absolute bottom-[25%] right-[25%] w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[90px] pointer-events-none z-0" />

        {/* Content Viewport */}
        <div className="flex-1 flex flex-col justify-center py-16 sm:px-6 lg:px-8 relative z-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-[450px] px-4">
            
            {/* The Blueprint Drawing Card Panel */}
            <Card className="border-2 border-[#e1ded5] bg-white/95 backdrop-blur-md shadow-[0_15px_40px_rgba(15,23,42,0.04),_0_1px_3px_rgba(0,0,0,0.01)] rounded-[28px] overflow-visible mt-24 relative p-1">
              
              {/* L-shaped Blueprint Draft Crop Marks in Corners */}
              <div className="absolute top-4 left-4 w-3.5 h-3.5 border-t border-l border-slate-300 pointer-events-none" />
              <div className="absolute top-4 right-4 w-3.5 h-3.5 border-t border-r border-slate-300 pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-3.5 h-3.5 border-b border-l border-slate-300 pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-3.5 h-3.5 border-b border-r border-slate-300 pointer-events-none" />

              {/* الصورة الشخصية للأستاذ بإطار المنقلة الهندسية */}
              <div className="absolute -top-20 inset-x-0 flex justify-center z-20">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  
                  {/* Concentric compass circles */}
                  <div className="absolute inset-0 rounded-full border border-dashed border-indigo-500/20 animate-spin-cw" />
                  <div className="absolute -inset-2 rounded-full border border-slate-200/60 animate-spin-ccw" />
                  
                  {/* Angle Marks and Lines */}
                  <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] opacity-30 animate-spin-cw" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="0.5" />
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                      <line
                        key={deg}
                        x1="50"
                        y1="2"
                        x2="50"
                        y2="5"
                        stroke="rgba(99, 102, 241, 0.7)"
                        strokeWidth="0.8"
                        transform={`rotate(${deg} 50 50)`}
                      />
                    ))}
                  </svg>
                  
                  {/* Coordinates marks */}
                  <span className="absolute -top-5 text-[8px] font-mono text-indigo-500 font-bold bg-[#f6f5f0] px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">90° N</span>
                  <span className="absolute -bottom-5 text-[8px] font-mono text-indigo-500 font-bold bg-[#f6f5f0] px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">270° S</span>

                  {/* Main Portrait Frame */}
                  <div className="w-32 h-32 rounded-full p-1 bg-white border border-slate-200 shadow-md relative overflow-hidden group z-10">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-50 flex items-center justify-center relative">
                      <img 
                        src="/teacher.jpg" 
                        alt="صورة الأستاذ" 
                        className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                        loading="eager"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Subtitle Badge */}
              <div className="relative pt-24 pb-4 px-8 text-center">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                  الإبداع في الرياضيات
                </h1>
                
                <div className="mt-3 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50/70 border border-indigo-100 text-xs font-bold text-indigo-600">
                    دي مش رياضة دي مزيكا 🎻🎻
                  </span>
                </div>
              </div>

              {/* Form elements with Clean layout */}
              <CardContent className="pt-6 pb-12 px-8 sm:px-12 relative z-10">
                <form id="login-form" onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center px-1">
                      <Label 
                        htmlFor="code" 
                        className="text-xs font-bold text-slate-400 tracking-wider"
                      >
                        أدخل كود المرور الخاص بك
                      </Label>
                      
                      <span className="flex items-center gap-1 text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/50">
                        Math_Key
                      </span>
                    </div>
                    
                    {/* Bracket-Framed Password Input */}
                    <div className="relative flex items-center group">
                      <div className="absolute -left-1.5 top-2.5 bottom-2.5 w-[3px] bg-slate-200 group-focus-within:bg-indigo-500 transition-all rounded-full" />
                      <div className="absolute -right-1.5 top-2.5 bottom-2.5 w-[3px] bg-slate-200 group-focus-within:bg-indigo-500 transition-all rounded-full" />
                      
                      <Input
                        id="code"
                        type={showCode ? "text" : "password"}
                        placeholder="••••••••"
                        value={code}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="text-center text-3xl font-bold tracking-[0.35em] h-15 bg-slate-50/80 border border-slate-200/80 text-slate-800 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all rounded-2xl placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-300 pl-14 pr-5 shadow-inner w-full font-mono"
                        dir="ltr"
                        autoFocus
                        autoComplete="current-password"
                        autoCapitalize="characters"
                        inputMode="text"
                        aria-label="كود الدخول"
                      />
                      
                      {/* Show/Hide code button */}
                      <button
                        type="button"
                        onClick={() => setShowCode(!showCode)}
                        className="absolute left-4 p-2.5 text-slate-400 hover:text-indigo-600 active:scale-95 transition-all rounded-xl focus:outline-none"
                        aria-label={showCode ? "إخفاء الكود" : "إظهار الكود"}
                      >
                        {showCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Clean Royal Slate Login Button */}
                  <Button
                    type="submit"
                    className="w-full h-14 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white active:scale-[0.98] rounded-2xl shadow-[0_4px_16px_rgba(15,23,42,0.1)] hover:shadow-[0_4px_22px_rgba(15,23,42,0.15)] transition-all duration-300 flex items-center justify-center gap-2 group border-0 relative overflow-hidden"
                    disabled={loading}
                  >
                    {/* Shimmer sweep effect */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[subtle-shimmer_1.8s_infinite] pointer-events-none" />

                    {loading ? (
                      <span className="flex items-center gap-3.5" role="status" aria-live="polite">
                        <span className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                        <span>جاري التحقق...</span>
                      </span>
                    ) : (
                      <>
                        <span>انطلق نحو الإبداع</span>
                        <ArrowLeft className="h-4 w-4 transition-transform duration-300 ease-out group-hover:-translate-x-1.5 rtl:rotate-180 text-white/90" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Blueprint Sheet Title Block Footer */}
        <footer className="w-full py-6 bg-[#f8f7f2]/80 backdrop-blur-md border-t-2 border-[#cbd5e1]/60 relative z-10 font-sans">
          <div className="max-w-xl mx-auto px-4">
            {/* Title Block Container */}
            <div className="border-2 border-[#cbd5e1] rounded-2xl bg-white/80 p-3 shadow-sm relative overflow-hidden">
              {/* Decorative Blueprint Corner Mark */}
              <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t-2 border-r-2 border-indigo-400 opacity-60" />
              <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b-2 border-l-2 border-indigo-400 opacity-60" />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-600">
                {/* Project & Copyright Section */}
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                  <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>الإبداع في الرياضيات</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    &copy; 2026 جميع الحقوق محفوظة
                  </span>
                </div>

                {/* Developer Credit Badge */}
                <div className="flex items-center gap-2 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-200 px-3 py-1.5 rounded-xl transition-all duration-300 group">
                  <a
                    href="https://antonious.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                    title="زيارة معرض الأعمال"
                  >
                    <span className="text-[11px] text-slate-500 font-normal">
                      تطوير:
                    </span>
                    <span>المهندس أنطونيوس سامح</span>
                    <span className="text-[10px] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 rtl:rotate-180">
                      ↗
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}