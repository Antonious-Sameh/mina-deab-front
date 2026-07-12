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

      {/* Custom Inline CSS Animations to keep code compile-free, standard-compliant, and fully portable */}
      <style>{`
        @keyframes orbit-cw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbit-ccw {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(99, 102, 241, 0.2); }
          50% { text-shadow: 0 0 20px rgba(99, 102, 241, 0.6), 0 0 30px rgba(139, 92, 246, 0.3); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes laser-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-orbit-cw {
          animation: orbit-cw 40s linear infinite;
        }
        .animate-orbit-ccw {
          animation: orbit-ccw 50s linear infinite;
        }
        .animate-text-glow {
          animation: text-glow 4s ease-in-out infinite;
        }
      `}</style>

      {/* التصميم المطور (Premium Geometry Edition) */}
      <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 px-4 antialiased relative overflow-hidden selection:bg-indigo-500/30 font-sans">
        
        {/* شبكة هندسية دقيقة للخلفية (Math Grid Effect) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none z-0" />

        {/* Dynamic Vector Geometry Background (Stunning Premium Math Accent) */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
          {/* Rotating Polar Coordinate System */}
          <g className="animate-orbit-cw origin-center" style={{ transformOrigin: 'center' }}>
            <circle cx="50%" cy="50%" r="150" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="50%" cy="50%" r="300" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="6 6" />
            <circle cx="50%" cy="50%" r="450" fill="none" stroke="#6366f1" strokeWidth="1.5" />
            <circle cx="50%" cy="50%" r="600" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="8 8" />
            <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="5 5" />
            <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="5 5" />
            <line x1="10%" y1="10%" x2="90%" y2="90%" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="5 5" />
            <line x1="90%" y1="10%" x2="10%" y2="90%" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="5 5" />
          </g>
          {/* Mathematical curves */}
          <path d="M 0,300 Q 200,150 400,300 T 800,300 T 1200,300 T 1600,300" fill="none" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.4" />
          <path d="M 0,350 Q 200,450 400,350 T 800,350 T 1200,350 T 1600,350" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.3" strokeDasharray="4 4" />
          
          {/* Geometric annotations */}
          <g transform="translate(120, 200)" opacity="0.5">
            <polygon points="0,0 100,0 100,75" fill="none" stroke="#6366f1" strokeWidth="1.2" />
            <path d="M 25,0 A 25,25 0 0,1 20,15" fill="none" stroke="#06b6d4" strokeWidth="1.2" />
            <text x="35" y="30" fill="#6366f1" fontSize="11" fontFamily="monospace" fontWeight="bold">θ = 36.87°</text>
            <text x="45" y="-10" fill="#a78bfa" fontSize="11" fontFamily="monospace">cos²(θ) + sin²(θ) = 1</text>
          </g>
          <g transform="translate(85%, 65%)" opacity="0.5">
            <circle cx="0" cy="0" r="50" fill="none" stroke="#8b5cf6" strokeWidth="1" />
            <line x1="-60" y1="0" x2="60" y2="0" stroke="#8b5cf6" strokeWidth="0.8" />
            <line x1="0" y1="-60" x2="0" y2="60" stroke="#8b5cf6" strokeWidth="0.8" />
            <line x1="0" y1="0" x2="35" y2="-35" stroke="#06b6d4" strokeWidth="1.5" />
            <text x="40" y="-40" fill="#06b6d4" fontSize="11" fontFamily="monospace" fontWeight="bold">r = a + bθ</text>
          </g>
        </svg>

        {/* تأثيرات ضوئية ملونة (أشعة الجبر والهندسة) */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute top-[40%] left-[30%] w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

        <div className="flex-1 flex flex-col justify-center py-16 sm:px-6 lg:px-8 relative z-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-[480px]">
            
            {/* الكارت الزجاجي الحديث الاحترافي */}
            <Card className="border border-slate-800/60 bg-slate-900/40 backdrop-blur-2xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8)] rounded-3xl overflow-visible mt-28 relative transition-all duration-300 hover:border-slate-700/80">
              
              {/* زوايا مضيئة هندسية للكارت */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-indigo-500/50 rounded-tl-3xl pointer-events-none" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-indigo-500/50 rounded-tr-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-indigo-500/50 rounded-bl-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-indigo-500/50 rounded-br-3xl pointer-events-none" />

              {/* الصورة الشخصية المدمجة ببرواز مضيء هندسي */}
              <div className="absolute -top-24 inset-x-0 flex justify-center z-20">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  
                  {/* Concentric Protractor Ring 1 (Rotating Clockwise) */}
                  <div className="absolute inset-0 rounded-full border border-dashed border-indigo-500/30 animate-[spin_40s_linear_infinite]" />
                  
                  {/* Concentric Protractor Ring 2 (Rotating Counter-Clockwise) */}
                  <div className="absolute -inset-3 rounded-full border border-slate-700/40 animate-[spin_60s_linear_infinite]" />
                  
                  {/* Geometric Protractor Ticks */}
                  <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] opacity-40 animate-[spin_120s_linear_infinite]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="0.5" />
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                      <line
                        key={deg}
                        x1="50"
                        y1="2"
                        x2="50"
                        y2="5"
                        stroke="rgba(99, 102, 241, 0.6)"
                        strokeWidth="0.75"
                        transform={`rotate(${deg} 50 50)`}
                      />
                    ))}
                  </svg>

                  {/* HUD Coordinate indicators around the image */}
                  <span className="absolute -top-6 text-[9px] font-mono text-cyan-400/80 bg-slate-950 px-1 py-0.5 rounded border border-cyan-500/20 shadow-sm">90° N</span>
                  <span className="absolute -bottom-6 text-[9px] font-mono text-indigo-400/80 bg-slate-950 px-1 py-0.5 rounded border border-indigo-500/20 shadow-sm">270° S</span>
                  <span className="absolute -left-9 text-[9px] font-mono text-violet-400/80 bg-slate-950 px-1 py-0.5 rounded border border-violet-500/20 shadow-sm">180° W</span>
                  <span className="absolute -right-9 text-[9px] font-mono text-pink-400/80 bg-slate-950 px-1 py-0.5 rounded border border-pink-500/20 shadow-sm">0° E</span>
                  
                  {/* Container الرئيسي للصورة الشخصية */}
                  <div className="w-36 h-36 rounded-full p-1 bg-slate-900 border-2 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.25)] relative overflow-hidden group">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-md pointer-events-none" />
                    
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 flex items-center justify-center relative">
                      <img 
                        src="/teacher.jpg" 
                        alt="صورة الأستاذ" 
                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                        loading="eager"
                      />
                      {/* تأثير وهج متحرك فوق الصورة عند التمرير */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-y-full group-hover:translate-y-[-100%] transition-transform duration-1000 ease-out pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* الهيدر المبتكر */}
              <div className="relative pt-28 pb-4 px-8 text-center overflow-hidden">
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-cyan-200 bg-clip-text text-transparent drop-shadow-sm font-sans animate-text-glow">
                  الإبداع في الرياضيات
                </h1>
                
                <div className="mt-4 flex justify-center">
                  <div className="relative px-6 py-2 rounded-full bg-indigo-950/40 border border-indigo-500/20 backdrop-blur-md shadow-inner flex items-center gap-2 group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <span className="text-sm font-medium text-indigo-200 leading-relaxed font-sans relative z-10">
                      دي مش رياضة دي مزيكا 🎻🎻
                    </span>
                  </div>
                </div>
              </div>

              {/* منطقة إدخال الكود الفاخرة */}
              <CardContent className="pt-8 pb-12 px-8 sm:px-12">
                <form id="login-form" onSubmit={handleSubmit} className="space-y-8">
                  
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center px-1">
                      <Label 
                        htmlFor="code" 
                        className="text-xs font-semibold text-slate-400 uppercase tracking-wider"
                      >
                        أدخل كود المرور الخاص بك
                      </Label>
                      
                      <span className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-800/40 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        MATH_KEY
                      </span>
                    </div>
                    
                    {/* Input المطور (Premium Input) */}
                    <div className="relative flex items-center group">
                      <div className="absolute -left-2 top-2 bottom-2 w-[3px] bg-indigo-500/30 rounded-full group-focus-within:bg-cyan-500 group-focus-within:shadow-[0_0_10px_#06b6d4] transition-all" />
                      <div className="absolute -right-2 top-2 bottom-2 w-[3px] bg-indigo-500/30 rounded-full group-focus-within:bg-cyan-500 group-focus-within:shadow-[0_0_10px_#06b6d4] transition-all" />
                      
                      <Input
                        id="code"
                        type={showCode ? "text" : "password"}
                        placeholder="••••••••"
                        value={code}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="text-center text-3xl font-extrabold tracking-[0.4em] h-16 bg-slate-950/90 border border-slate-800/80 text-indigo-50 focus-visible:ring-1 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 transition-all rounded-2xl placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-800 pl-16 pr-5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] w-full font-mono selection:bg-indigo-500/40"
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
                        className="absolute left-4 p-2 text-slate-500 hover:text-cyan-300 hover:bg-slate-900 active:scale-95 transition-all rounded-xl focus:outline-none border border-transparent hover:border-slate-800"
                        aria-label={showCode ? "إخفاء الكود" : "إظهار الكود"}
                      >
                        {showCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* زر الدخول الجديد كلياً (Premium Button) */}
                  <Button
                    type="submit"
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] hover:bg-[right_center] text-white active:scale-[0.97] rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all duration-500 flex items-center justify-center gap-3 group border border-indigo-500/40 relative overflow-hidden"
                    disabled={loading}
                  >
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />

                    {loading ? (
                      <span className="flex items-center gap-3" role="status" aria-live="polite">
                        <span className="relative flex h-5 w-5 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 border-2 border-indigo-400 border-t-white animate-spin"></span>
                        </span>
                        <span>جاري التحقق من المعطيات...</span>
                      </span>
                    ) : (
                      <>
                        <span>انطلق نحو الإبداع</span>
                        <ArrowLeft className="h-5 w-5 transition-transform duration-300 ease-out group-hover:-translate-x-2 rtl:rotate-180 text-indigo-100" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* الفوتر الجديد المحدث */}
        <footer className="w-full py-8 text-center border-t border-slate-900/60 bg-slate-950/60 backdrop-blur-md relative z-10 font-sans">
          <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-2 px-6">
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent mb-1" />
            <p className="text-xs text-slate-500 font-medium tracking-wide">
              &copy; 2026 الإبداع في الرياضيات. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono">
              <span>DESIGN SYSTEM v2.0</span>
              <span className="text-slate-800">|</span>
              <span>تطوير: المهندس أنطونيوس سامح</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
