import React, { useState } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import MobileNav from '@/components/MobileNav.jsx';
import { Toaster } from '@/components/ui/sonner';
import PWAInstallPrompt from '@/components/PWAInstallPrompt.jsx';
import { NotificationProvider } from '@/contexts/NotificationContext.jsx'; // الـ Import موجود وجاهز

// Auth
import LoginPage from '@/pages/LoginPage.jsx';

// Teacher Pages
import HomePage from '@/pages/HomePage.jsx'; 
import GroupsPage from '@/pages/GroupsPage.jsx';
import StudentsPage from '@/pages/StudentsPage.jsx';
import AttendancePage from '@/pages/AttendancePage.jsx';
// صفحة الفلوس (الفريق) — تم إخفاؤها مؤقتاً، هيتم استبدالها بنظام جديد. الملف والمنطق لسه موجودين.
// import PaymentsPage from '@/pages/PaymentsPage.jsx';
import ExamsPage from '@/pages/teacher/ExamsPage.jsx';
import GradesPage from '@/pages/teacher/GradesPage.jsx';
import RankingsPage from '@/pages/teacher/RankingsPage.jsx';
import PointsPage from '@/pages/teacher/PointsPage.jsx';
import ReportsPage from '@/pages/teacher/ReportsPage.jsx';
import HeroesPage from '@/pages/teacher/HeroesPage.jsx';
import NotesPage from '@/pages/teacher/NotesPage.jsx';
import OnlinePage from '@/pages/teacher/OnlinePage.jsx';
import AccountPage from '@/pages/AccountPage.jsx';
import AdminPasswordGate from '@/components/AdminPasswordGate.jsx';

// Student Pages
import StudentHomePage from '@/pages/student/StudentHomePage.jsx';
import StudentSchedulePage from '@/pages/student/StudentSchedulePage.jsx';
import StudentPaymentsPage from '@/pages/student/StudentPaymentsPage.jsx';
import StudentExamsPage from '@/pages/student/StudentExamsPage.jsx';
import ExamInterfacePage from '@/pages/student/ExamInterfacePage.jsx';
import StudentGradesPage from '@/pages/student/StudentGradesPage.jsx';
import StudentRankingsPage from '@/pages/student/StudentRankingsPage.jsx';
import StudentAttendancePage from '@/pages/student/StudentAttendancePage.jsx';
import StudentPointsPage from '@/pages/student/StudentPointsPage.jsx';
import StudentHeroesPage from '@/pages/student/StudentHeroesPage.jsx';
import StudentAccountPage from '@/pages/student/StudentAccountPage.jsx';
import StudentNotesPage from '@/pages/student/StudentNotesPage.jsx';
import StudentOnlinePage from '@/pages/student/StudentOnlinePage.jsx';

function ProtectedLayout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300" dir="rtl">
      <div className="flex h-screen overflow-hidden">
        <Sidebar className="hidden lg:flex w-64 flex-shrink-0" />
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          <Header onMenuClick={() => setMobileNavOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'teacher' ? '/teacher/home' : '/student/home'} replace />;
}

function App() {
  return (
    <AuthProvider>
      {/* التعديل الجديد: التغليف بـ NotificationProvider */}
      <NotificationProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            {/* TEACHER ROUTES */}
            <Route path="/teacher/home" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><HomePage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><AdminPasswordGate><GroupsPage /></AdminPasswordGate></ProtectedLayout></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><StudentsPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><AdminPasswordGate><AttendancePage /></AdminPasswordGate></ProtectedLayout></ProtectedRoute>} />
            {/* صفحة الفلوس — مخفية مؤقتاً، هيتم استبدالها بنظام جديد */}
            {/* <Route path="/payments" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><PaymentsPage /></ProtectedLayout></ProtectedRoute>} /> */}
            <Route path="/teacher/exams" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><AdminPasswordGate><ExamsPage /></AdminPasswordGate></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/grades" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><AdminPasswordGate><GradesPage /></AdminPasswordGate></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/rankings" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><RankingsPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/points" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><AdminPasswordGate><PointsPage /></AdminPasswordGate></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/reports" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><ReportsPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/heroes" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><HeroesPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/notes" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><AdminPasswordGate><NotesPage /></AdminPasswordGate></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/online" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><AdminPasswordGate><OnlinePage /></AdminPasswordGate></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/account" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><AdminPasswordGate><AccountPage /></AdminPasswordGate></ProtectedLayout></ProtectedRoute>} />

            {/* STUDENT ROUTES */}
            <Route path="/student/home" element={<ProtectedRoute allowedRole="student"><ProtectedLayout><StudentHomePage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/student/schedule" element={<ProtectedRoute allowedRole="student"><ProtectedLayout><StudentSchedulePage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/student/payments" element={<ProtectedRoute allowedRole="student"><ProtectedLayout><StudentPaymentsPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/student/exams" element={<ProtectedRoute allowedRole="student"><ProtectedLayout><StudentExamsPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/student/exam-interface" element={<ProtectedRoute allowedRole="student"><ExamInterfacePage /></ProtectedRoute>} />
            <Route path="/student/grades" element={<ProtectedRoute allowedRole="student"><ProtectedLayout><StudentGradesPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/student/rankings" element={<ProtectedRoute allowedRole="student"><ProtectedLayout><StudentRankingsPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/student/points" element={<ProtectedRoute allowedRole="student"><ProtectedLayout><StudentPointsPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/student/attendance" element={<ProtectedRoute allowedRole="student"><ProtectedLayout><StudentAttendancePage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/student/heroes" element={<ProtectedRoute allowedRole="student"><ProtectedLayout><StudentHeroesPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/student/account" element={<ProtectedRoute allowedRole="student"><ProtectedLayout><StudentAccountPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/student/notes" element={<ProtectedRoute allowedRole="student"><ProtectedLayout><StudentNotesPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/student/online" element={<ProtectedRoute allowedRole="student"><ProtectedLayout><StudentOnlinePage /></ProtectedLayout></ProtectedRoute>} />

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-center" dir="rtl" />
          <PWAInstallPrompt />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;