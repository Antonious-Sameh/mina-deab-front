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

// Avatar component — shows image or initials
function UserAvatar({ name, avatarUrl, size = 'md' }) {
  const sz       = size === 'md' ? 'h-9 w-9 text-sm' : 'h-8 w-8 text-xs';
  const initials = name?.split(' ').slice(0,2).map(w => w[0]).join('') || '?';
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${sz} rounded-full object-cover border-2 border-primary/20 shadow-sm`} />;
  }
  return (
    <div className={`${sz} rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center border-2 border-primary/20`}>
      {initials}
    </div>
  );
}

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();

  // For students: fetch teacher's avatar
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

  // What to show in top-right
  const displayAvatar = user?.role === 'teacher' ? user.avatar : teacherAvatar;
  const displayName   = user?.role === 'teacher' ? user.name  : teacherName;

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        <h1 className="text-xl font-bold truncate">
          {PAGE_TITLES[location.pathname] || 'لوحة التحكم'}
        </h1>

        <div className="mr-auto flex items-center gap-2">
          <div className="hidden md:flex flex-col text-left">
            <span className="text-sm font-semibold leading-tight">{user?.name}</span>
            <span className="text-xs text-muted-foreground">{user?.role === 'teacher' ? 'مدرس' : 'طالب'}</span>
          </div>

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => navigate(user?.role === 'student' ? '/student/notes' : '#')}>
              <Bell className="h-5 w-5" />
            </Button>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>

          <Button variant="ghost" size="icon" onClick={handleLogout} title="تسجيل الخروج">
            <LogOut className="h-5 w-5 text-destructive" />
          </Button>

          {/* Avatar — teacher sees their own, students see teacher's */}
          <button
            onClick={() => navigate(user?.role === 'teacher' ? '/teacher/account' : '/student/account')}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40"
            title={user?.role === 'teacher' ? 'حسابي' : `منصة ${displayName || ''}`}
          >
            <UserAvatar name={displayName || user?.name} avatarUrl={displayAvatar} />
          </button>
        </div>
      </div>
    </header>
  );
}