import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Award,
  Trophy,
  Star,
  BarChart,
  Medal,
  UserCircle,
  CalendarDays,
  CreditCard,
  KeyRound as UsersRound,
  GraduationCap,
  ClipboardCheck,
  StickyNote,
  MonitorPlay,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext.jsx";
import { useNotifications } from "@/contexts/NotificationContext.jsx";

const TEACHER_GROUPS = [
  {
    id: "group-1",
    items: [
      { path: "/teacher/home", label: "لوحة التحكم", icon: LayoutDashboard },
      { path: "/groups", label: "المجموعات", icon: UsersRound },
      { path: "/students", label: "الطلاب", icon: GraduationCap },
      { path: "/attendance", label: "الحضور والفلوس", icon: ClipboardCheck },
    ],
  },
  {
    id: "group-2",
    items: [
      { path: "/teacher/exams", label: "الامتحانات", icon: FileText },
      { path: "/teacher/grades", label: "الدرجات", icon: Award },
      { path: "/teacher/rankings", label: "ترتيب الطلاب", icon: Trophy },
      { path: "/teacher/points", label: "النقاط", icon: Star },
    ],
  },
  {
    id: "group-3",
    items: [
      { path: "/teacher/online", label: "أون لاين", icon: MonitorPlay },
      { path: "/teacher/notes", label: "الملاحظات", icon: StickyNote },
      { path: "/teacher/reports", label: "التقارير", icon: BarChart },
      { path: "/teacher/heroes", label: "أبطال مروا من هنا", icon: Medal },
    ],
  },
  {
    id: "group-4",
    items: [{ path: "/teacher/account", label: "الحساب", icon: UserCircle }],
  },
];

const STUDENT_NAV = [
  { path: "/student/home", label: "الرئيسية", icon: LayoutDashboard },
  { path: "/student/schedule", label: "جدولي", icon: CalendarDays },
  { path: "/student/payments", label: "الفلوس", icon: CreditCard },
  { path: "/student/exams", label: "الامتحانات", icon: FileText },
  { path: "/student/grades", label: "الدرجات", icon: Award },
  { path: "/student/points", label: "النقاط", icon: Star },
  { path: "/student/online", label: "أون لاين", icon: MonitorPlay },
  { path: "/student/attendance", label: "حضوري", icon: ClipboardCheck },
  { path: "/student/notes", label: "الملاحظات", icon: StickyNote, badge: true },
  { path: "/student/heroes", label: "أبطال مروا من هنا", icon: Medal },
  { path: "/student/account", label: "الحساب", icon: UserCircle },
];

export default function Sidebar({ className }) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const isTeacher = user?.role === "teacher";

  return (
    <aside className={cn("border-l border-border/40 bg-slate-50/50 dark:bg-zinc-950/40 backdrop-blur-xl flex flex-col h-screen overflow-hidden select-none w-72 transition-all duration-300 shadow-[1px_0_0_0_rgba(0,0,0,0.03)]", className)}>
      
      {/* Brand Header & Identity */}
      <div className="relative flex flex-col justify-center px-6 py-6 shrink-0 gap-2 overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/90 bg-clip-text text-transparent text-right">
          {isTeacher ? "نظام الأستاذ مينا دياب" : "منصة الإبداع"}
        </h2>
        
        {!isTeacher && (
          <div className="mt-1 relative overflow-hidden bg-zinc-900/[0.02] dark:bg-white/[0.02] border border-border/60 pr-3 pl-4 py-2 rounded-xl transition-all hover:border-primary/30 group">
            <div className="absolute top-0 bottom-0 right-0 w-[3px] bg-primary rounded-r-full" />
            <p className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors duration-200 leading-relaxed text-right flex items-center justify-start gap-1.5">
              <span className="inline-block animate-bounce text-sm">🎵</span> دي مش رياضة... دي مزيكا
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links Area */}
      <nav className="px-4 py-3 flex-1 overflow-y-auto space-y-1 scrollbar-none hover:scrollbar-thin transition-all duration-200">
        {isTeacher ? (
          <div className="space-y-5">
            {TEACHER_GROUPS.map((group, index) => (
              <React.Fragment key={group.id}>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          cn(
                            "group relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-[14px] font-semibold transition-all duration-300 ease-out border border-transparent",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-[0_4px_20px_-4px_rgba(var(--primary-rgb),0.25)] border-primary/10"
                              : "text-muted-foreground/90 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-foreground"
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon className={cn(
                              "h-5 w-5 stroke-[2] transition-transform duration-300 group-hover:scale-105", 
                              isActive ? "text-primary-foreground" : "text-muted-foreground/70 group-hover:text-primary"
                            )} />
                            <span className="tracking-wide">{item.label}</span>
                            {/* Decorative active subtle bar */}
                            {isActive && (
                              <span className="absolute left-2 w-1 h-4 bg-primary-foreground/40 rounded-full" />
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
                {index < TEACHER_GROUPS.length - 1 && (
                  <div className="border-t border-border/40 my-3 mx-3 opacity-60" />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {STUDENT_NAV.map((item) => {
              const Icon = item.icon;
              const showBadge = item.badge && unreadCount > 0;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-[14px] font-semibold transition-all duration-300 ease-out border border-transparent",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-[0_4px_20px_-4px_rgba(var(--primary-rgb),0.25)] border-primary/10"
                        : "text-muted-foreground/90 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn(
                        "h-5 w-5 stroke-[2] transition-transform duration-300 group-hover:scale-105", 
                        isActive ? "text-primary-foreground" : "text-muted-foreground/70 group-hover:text-primary"
                      )} />
                      <span className="flex-1 tracking-wide">{item.label}</span>
                      {showBadge && (
                        <span className="inline-flex items-center justify-center min-w-[22px] h-5.5 px-2 rounded-full bg-red-500 text-white text-[10px] font-black tracking-tighter shadow-sm border border-background/20 animate-pulse">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                      {isActive && (
                        <span className="absolute left-2 w-1 h-4 bg-primary-foreground/40 rounded-full" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
  );
}