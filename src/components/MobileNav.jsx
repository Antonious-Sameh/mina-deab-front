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
  MessageCircle,
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
  { path: "/student/contact", label: "تواصل مع المدرس", icon: MessageCircle },
  { path: "/student/account", label: "الحساب", icon: UserCircle },
];

export default function MobileNav({ open, onClose }) {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-80 p-0 flex flex-col bg-background border-l border-border/40 selection:bg-primary/10 backdrop-blur-md"
      >
        <SheetDescription className="hidden">
          Navigation Menu
        </SheetDescription>

        {/* Header Section: Modern Glassmorphism Accent */}
        <SheetHeader className="p-6 text-right shrink-0 relative overflow-hidden bg-gradient-to-b from-muted/30 to-transparent border-b border-border/50">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-6 -mt-6" />
          <SheetTitle className="text-xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            {isTeacher ? "نظام الأستاذ مينا دياب" : "منصة الإبداع"}
          </SheetTitle>
        </SheetHeader>

        {/* Navigation Body: Modern Floating Cards Design */}
        <nav className="p-5 flex-1 overflow-y-auto space-y-6 scrollbar-none">
          {isTeacher ? (
            <div className="space-y-6">
              {TEACHER_GROUPS.map((group, index) => (
                <React.Fragment key={group.id}>
                  <div className="space-y-2 bg-muted/20 p-2.5 rounded-2xl border border-border/30">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-out group relative overflow-hidden",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/10 font-semibold scale-[1.01]"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )
                          }
                        >
                          <Icon className={cn(
                            "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                            "opacity-90 group-[.active]:opacity-100"
                          )} />
                          <span className="relative z-10 tracking-wide">{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </React.Fragment>
              ))}
            </div>
          ) : (
            /* Student Section: Sleek Single Dashboard Container */
            <div className="bg-muted/20 p-2.5 rounded-2xl border border-border/30 space-y-1.5">
              {STUDENT_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-out group relative overflow-hidden",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/10 font-semibold scale-[1.01]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )
                    }
                  >
                    <Icon className={cn(
                      "h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                      "opacity-90 group-[.active]:opacity-100"
                    )} />
                    <span className="relative z-10 tracking-wide">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer Section: Transformed Floating Motivational Card */}
        {!isTeacher && (
          <div className="p-5 mt-auto border-t border-border/40 bg-gradient-to-t from-muted/40 to-transparent">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/[0.07] via-primary/[0.03] to-transparent border border-primary/10 rounded-2xl p-4 text-right shadow-sm">
              <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-primary/5 rounded-full blur-xl" />
              <p className="text-xs font-bold text-primary tracking-wide leading-relaxed">
                دي مش رياضة... دي مزيكا 🎵
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}