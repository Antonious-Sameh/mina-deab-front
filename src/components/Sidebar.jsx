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
  Wallet,
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
      { path: "/attendance", label: "الحضور", icon: ClipboardCheck },
      { path: "/payments", label: "الفلوس", icon: Wallet },
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
    <aside className={cn("border-l bg-card flex flex-col", className)}>
      {/* الجزء المعدل: تم زيادة المساحة وإضافة الجملة تحت اسم المنصة */}
      <div className="flex flex-col justify-center border-b px-6 py-4 shrink-0 gap-1">
        <h2 className="text-lg font-bold text-primary">
          {isTeacher ? "نظام المعلم" : "منصة خطوة"}
        </h2>
        {!isTeacher && (
          <div className="mt-1 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border-r-2 border-primary pr-2.5 py-1.5 rounded-l-md animate-pulse">
            <p className="text-[11px] font-semibold text-primary/90 leading-relaxed text-right">
              ابدأ من هنا ... خطوة بخطوة نحو القمة 🚀
            </p>
          </div>
        )}
      </div>

      <nav className="p-4 flex-1 overflow-y-auto scrollbar-thin">
        {isTeacher ? (
          <div className="space-y-6">
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
                            "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          )
                        }
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
                {index < TEACHER_GROUPS.length - 1 && (
                  <div className="border-t border-border mx-2" />
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
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold leading-none animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
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
