import React from "react";
import { NavLink } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext.jsx";
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
  { path: "/student/attendance", label: "حضورى", icon: ClipboardCheck },
  { path: "/student/payments", label: "الفلوس", icon: CreditCard },
  { path: "/student/exams", label: "الامتحانات", icon: FileText },
  { path: "/student/grades", label: "الدرجات", icon: Award },
  { path: "/student/points", label: "النقاط", icon: Star },
  { path: "/student/online", label: "أون لاين", icon: MonitorPlay },
  { path: "/student/notes", label: "الملاحظات", icon: StickyNote },
  { path: "/student/heroes", label: "أبطال مروا من هنا", icon: Medal },
  { path: "/student/account", label: "الحساب", icon: UserCircle },
];

export default function MobileNav({ open, onClose }) {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-72 p-0 flex flex-col">
        {/* الجزء المعدل: تم إضافة الجملة تحت العنوان للموبايل */}
        <SheetHeader className="border-b p-6 text-right shrink-0 gap-1">
          <SheetTitle className="text-lg font-bold text-primary">
            {isTeacher ? "نظام المعلم" : "منصة خطوة"}
          </SheetTitle>
          {!isTeacher && (
            <div className="mt-2 bg-gradient-to-l from-primary/10 to-transparent border-r-2 border-primary pr-3 py-1.5 rounded-l-md">
              <p className="text-[11px] sm:text-xs font-semibold text-primary/90 leading-relaxed">
                ابدأ من هنا .. خطوة بخطوة نحو القمة 🚀
              </p>
            </div>
          )}
          <SheetDescription className="hidden">
            Navigation Menu
          </SheetDescription>
        </SheetHeader>

        <nav className="p-4 flex-1 overflow-y-auto">
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
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                            )
                          }
                        >
                          <Icon className="h-5 w-5 shrink-0" />
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
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
