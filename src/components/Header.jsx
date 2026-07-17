import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { useNotifications } from '@/contexts/NotificationContext.jsx';
import api from '@/api/axios';

const PAGE_TITLES = {
  '/teacher/home':'الرئيسية','/groups':'المجموعات','/students':'الطلاب',
  '/attendance':'الحضور والفلوس','/payments':'الفلوس','/teacher/exams':'الامتحانات',
  '/teacher/grades':'الدرجات','/teacher/rankings':'ترتيب الطلاب',
  '/teacher/points':'النقاط','/teacher/reports':'التقارير',
  '/teacher/online':'أون لاين','/teacher/notes':'الملاحظات',
  '/teacher/heroes':'أبطال مروا من هنا','/teacher/account':'الحساب',
  '/student/home':'الرئيسية','/student/schedule':'جدولي',
  '/student/payments':'الفلوس','/student/exams':'الامتحانات',
  '/student/grades':'الدرجات','/student/rankings':'الترتيب',
  '/student/points':'النقاط','/student/online':'أون لاين',
  '/student/notes':'الملاحظات','/student/attendance':'حضوري',
  '/student/heroes':'أبطال مروا من هنا','/student/account':'الحساب',
};

// الـ Avatar بشكلها العصري الجديد مع الحفاظ على نفس البارامترات والـ Logic
function UserAvatar({ name, avatarUrl, size = 'md' }) {
  const sz = size === 'md' ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs';
  const initials = name?.split(' ').slice(0,2).map(w => w[0]).join('') || '?';
  
  if (avatarUrl) {
    return (
      <div className="relative inline-block tracking-wide">
        <img 
          src={avatarUrl} 
          alt={name} 
          className={`${sz} rounded-xl object-cover ring-2 ring-primary/10 hover:ring-primary/30 shadow-sm transition-all duration-300`} 
        />
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
      </div>
    );
  }
  
  return (
    <div className="relative inline-block">
      <div className={`${sz} rounded-xl bg-gradient-to-br from-primary/90 to-primary text-primary-foreground font-bold flex items-center justify-center shadow-md shadow-primary/10 transition-all duration-300`}>
        {initials}
      </div>
      <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
    </div>
  );
}

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();

  const [teacherAvatar, setTeacherAvatar] = useState(null);
  const [teacherName,   setTeacherName]   = useState(null);
  
  useEffect(() => {
    if (user?.role !== 'student') return;
    api.get('/account/teacher-info').then(r => {
      setTeacherAvatar(r.data.data.teacher?.avatar || null);
      setTeacherName(r.data.data.teacher?.name   || null);
    }).catch(() => {});
  }, [user?.role]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const displayAvatar = user?.role === 'teacher' ? user.avatar : teacherAvatar;
  const displayName   = user?.role === 'teacher' ? user.name  : teacherName;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="flex h-20 items-center justify-between px-6 lg:px-8 max-w-[1600px] mx-auto">
        
        {/* الجزء الأيمن: القائمة وعنوان الصفحة بتوزيع مريح وعصري */}
        <div className="flex items-center gap-4">
          <Button 
            variant="secondary" 
            size="icon" 
            className="lg:hidden h-10 w-10 rounded-xl bg-muted/60 hover:bg-muted" 
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5 text-foreground/80" />
          </Button>

          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl lg:text-2xl font-black tracking-tight bg-gradient-to-l from-foreground to-foreground/80 bg-clip-text text-transparent">
              {PAGE_TITLES[location.pathname] || 'لوحة التحكم'}
            </h1>
          </div>
        </div>

        {/* الجزء الأيسر: تم تعديل الـ Layout بالكامل إلى (ml-auto لـ RTL) لتنظيم الأدوات */}
        <div className="ml-0 mr-auto flex items-center gap-3 lg:gap-4">
          
          {/* بيانات المستخدم الحالية بتصميم تايبوجرافي أنظف */}
          <div className="hidden sm:flex flex-col items-end text-right pl-2 border-l border-border/60 ml-2">
            <span className="text-sm font-bold text-foreground/90 tracking-wide">{user?.name}</span>
            <span className="text-xs font-medium text-muted-foreground/80 mt-0.5 px-2 py-0.5 bg-muted rounded-full">
              {user?.role === 'teacher' ? 'المدرس' : 'طالب '}
            </span>
          </div>

          {/* مركز التحكم بالأزرار (تأثيرات حركية خفيفة وأشكال دائرية ناعمة Rounded-xl) */}
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-2xl border border-border/20">
            
            {/* زر المظهر */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-xl hover:bg-background hover:shadow-sm text-muted-foreground hover:text-foreground transition-all"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="h-[18px] w-[18px] text-amber-500" /> : <Moon className="h-[18px] w-[18px] text-indigo-500" />}
            </Button>

            {/* زر الإشعارات المطور */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-xl hover:bg-background hover:shadow-sm text-muted-foreground hover:text-foreground transition-all"
                onClick={() => navigate(user?.role === 'student' ? '/student/notes' : '#')}
              >
                <Bell className="h-[18px] w-[18px]" />
              </Button>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-black text-destructive-foreground ring-2 ring-background animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>

            {/* زر تسجيل الخروج */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
              onClick={handleLogout} 
              title="تسجيل الخروج"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </Button>
          </div>

          {/* زر الـ Avatar التفاعلي الكامل */}
          <button
            onClick={() => navigate(user?.role === 'teacher' ? '/teacher/account' : '/student/account')}
            className="rounded-xl p-0.5 focus:outline-none focus:ring-2 focus:ring-primary/30 hover:scale-105 transition-transform duration-200"
            title={user?.role === 'teacher' ? 'حسابي' : `منصة ${displayName || ''}`}
          >
            <UserAvatar name={displayName || user?.name} avatarUrl={displayAvatar} />
          </button>
          
        </div>
      </div>
    </header>
  );
}