import React, { useState, Suspense, lazy } from 'react';
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
import { Loader2 } from 'lucide-react';

// Auth — loaded eagerly since it's the first thing an unauthenticated user sees
import LoginPage from '@/pages/LoginPage.jsx';

// Teacher Pages — lazy-loaded per route so a student never has to download
// teacher-only page code (and vice versa). Same components, same behavior —
// only the loading strategy changes.
const HomePage    = lazy(() => import('@/pages/HomePage.jsx'));
const GroupsPage  = lazy(() => import('@/pages/GroupsPage.jsx'));
const StudentsPage = lazy(() => import('@/pages/StudentsPage.jsx'));
const AttendancePage = lazy(() => import('@/pages/AttendancePage.jsx'));
// صفحة الفلوس (الفريق) — تم إخفاؤها مؤقتاً، هيتم استبدالها بنظام جديد. الملف والمنطق لسه موجودين.
// import PaymentsPage from '@/pages/PaymentsPage.jsx';
const ExamsPage    = lazy(() => import('@/pages/teacher/ExamsPage.jsx'));
const GradesPage   = lazy(() => import('@/pages/teacher/GradesPage.jsx'));
const RankingsPage = lazy(() => import('@/pages/teacher/RankingsPage.jsx'));
const PointsPage   = lazy(() => import('@/pages/teacher/PointsPage.jsx'));
const ReportsPage  = lazy(() => import('@/pages/teacher/ReportsPage.jsx'));
const HeroesPage   = lazy(() => import('@/pages/teacher/HeroesPage.jsx'));
const NotesPage    = lazy(() => import('@/pages/teacher/NotesPage.jsx'));
const OnlinePage   = lazy(() => import('@/pages/teacher/OnlinePage.jsx'));
const AccountPage  = lazy(() => import('@/pages/AccountPage.jsx'));
import AdminPasswordGate from '@/components/AdminPasswordGate.jsx';

// Student Pages — lazy-loaded per route, same reasoning as above.
const StudentHomePage       = lazy(() => import('@/pages/student/StudentHomePage.jsx'));
const StudentSchedulePage   = lazy(() => import('@/pages/student/StudentSchedulePage.jsx'));
const StudentPaymentsPage   = lazy(() => import('@/pages/student/StudentPaymentsPage.jsx'));
const StudentExamsPage      = lazy(() => import('@/pages/student/StudentExamsPage.jsx'));
const ExamInterfacePage     = lazy(() => import('@/pages/student/ExamInterfacePage.jsx'));
const StudentGradesPage     = lazy(() => import('@/pages/student/StudentGradesPage.jsx'));
const StudentRankingsPage   = lazy(() => import('@/pages/student/StudentRankingsPage.jsx'));
const StudentAttendancePage = lazy(() => import('@/pages/student/StudentAttendancePage.jsx'));
const StudentPointsPage     = lazy(() => import('@/pages/student/StudentPointsPage.jsx'));
const StudentHeroesPage     = lazy(() => import('@/pages/student/StudentHeroesPage.jsx'));
const StudentAccountPage    = lazy(() => import('@/pages/student/StudentAccountPage.jsx'));
const StudentNotesPage      = lazy(() => import('@/pages/student/StudentNotesPage.jsx'));
const StudentOnlinePage     = lazy(() => import('@/pages/student/StudentOnlinePage.jsx'));
const StudentContactPage = lazy(() => import('@/pages/student/StudentContactPage.jsx'));


// Lightweight fallback shown only while a route's chunk is downloading —
// uses the same Loader2/animate-spin pattern already used across the app
// (AccountPage, AttendancePage, PDFViewer, ...) so it feels consistent.
function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

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
          <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            {/* TEACHER ROUTES */}
            <Route path="/teacher/home" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><AdminPasswordGate><HomePage /></AdminPasswordGate></ProtectedLayout></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><AdminPasswordGate><GroupsPage /></AdminPasswordGate></ProtectedLayout></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><AdminPasswordGate><StudentsPage /></AdminPasswordGate></ProtectedLayout></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><AdminPasswordGate><AttendancePage /></AdminPasswordGate></ProtectedLayout></ProtectedRoute>} />
            {/* صفحة الفلوس — مخفية مؤقتاً، هيتم استبدالها بنظام جديد */}
            {/* <Route path="/payments" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><PaymentsPage /></ProtectedLayout></ProtectedRoute>} /> */}
            <Route path="/teacher/exams" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><ExamsPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/grades" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><GradesPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/rankings" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><RankingsPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/points" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><PointsPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/reports" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><ReportsPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/heroes" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><HeroesPage /></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/notes" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><AdminPasswordGate><NotesPage /></AdminPasswordGate></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/online" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><AdminPasswordGate><OnlinePage /></AdminPasswordGate></ProtectedLayout></ProtectedRoute>} />
            <Route path="/teacher/account" element={<ProtectedRoute allowedRole="teacher"><ProtectedLayout><AccountPage /></ProtectedLayout></ProtectedRoute>} />

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
            <Route path="/student/contact" element={<ProtectedRoute allowedRole="student"><ProtectedLayout><StudentContactPage /></ProtectedLayout></ProtectedRoute>}/>

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
          <Toaster position="top-center" dir="rtl" />
          <PWAInstallPrompt />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;