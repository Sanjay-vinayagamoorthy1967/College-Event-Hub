import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';
import PageTransition from './components/shared/PageTransition';
import AIChatbot from './components/layout/AIChatbot';

// Pages
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import EventResultPage from './pages/EventResultPage';
import Login from './pages/Login';
import Register from './pages/Register';
import InternalLogin from './pages/InternalLogin';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateEvent from './pages/admin/CreateEvent';
import ManageEvents from './pages/admin/ManageEvents';
import ManageStudents from './pages/admin/ManageStudents';
import QRScanner from './pages/admin/QRScanner';
import Announcements from './pages/admin/Announcements';
import CertificateManagement from './pages/admin/CertificateManagement';
import Certificates from './pages/Certificates';
import About from './pages/About';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import CompletedEvents from './pages/CompletedEvents';
import DeletionRequests from './pages/admin/DeletionRequests';
import AdminManagement from './pages/admin/AdminManagement';
import AdminRequests from './pages/admin/AdminRequests';
import AdminVerify from './pages/admin/AdminVerify';
import ResultsManagement from './pages/admin/ResultsManagement';
import CollegeStudentsList from './pages/admin/CollegeStudentsList';

// Helper for protecting routes
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, userType } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userType)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  const { userType, isAuthenticated } = useAuth();
  const location = useLocation();

  // Sidebar is shown on student dashboard, admin pages, and profile pages
  const isDashboardRoute =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/admin') ||
    location.pathname === '/profile';

  return (
    <div className="min-h-screen bg-transparent text-dark-900 flex flex-col font-poppins antialiased">
      {/* Dynamic Background Grid Pattern */}
      <div className="fixed inset-0 dot-pattern opacity-40 pointer-events-none z-0" />
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary-500/10 via-transparent to-transparent pointer-events-none z-0" />

      {/* Header */}
      <Navbar />

      {/* Main Body Grid */}
      <div className="flex-1 flex relative z-10 pt-[72px] min-w-0">
        {isAuthenticated && isDashboardRoute && <Sidebar />}
        <main className={`flex-1 flex flex-col min-w-0 overflow-x-hidden ${isAuthenticated && isDashboardRoute ? 'md:pl-64' : ''}`}>
          <div className="flex-grow min-w-0">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />
              <Route path="/events" element={<PageTransition><Events /></PageTransition>} />
              <Route path="/events/:id" element={<PageTransition><EventDetails /></PageTransition>} />
              <Route path="/event/:id/result" element={<PageTransition><EventResultPage /></PageTransition>} />
              <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
              <Route path="/login-internal" element={<PageTransition><InternalLogin /></PageTransition>} />
              <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
              <Route path="/certificates" element={<PageTransition><Certificates /></PageTransition>} />
              <Route path="/about" element={<PageTransition><About /></PageTransition>} />
              <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />

              {/* Protected Student Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student_internal', 'student_external']}>
                    <PageTransition><StudentDashboard /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['student_internal', 'student_external', 'admin']}>
                    <PageTransition><Profile /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/completed-events"
                element={
                  <ProtectedRoute allowedRoles={['student_internal', 'student_external', 'admin']}>
                    <PageTransition><CompletedEvents /></PageTransition>
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageTransition><AdminDashboard /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/events"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageTransition><ManageEvents /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/create-event"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageTransition><CreateEvent /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/edit-event/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageTransition><CreateEvent /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageTransition><ManageStudents /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/id-verification"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageTransition><CollegeStudentsList /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/scanner"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageTransition><QRScanner /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/certificates"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageTransition><CertificateManagement /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/results"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageTransition><ResultsManagement /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/announcements"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageTransition><Announcements /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/deletion-requests"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageTransition><DeletionRequests /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/management"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageTransition><AdminManagement /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/requests"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PageTransition><AdminRequests /></PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route path="/admin/verify" element={<PageTransition><AdminVerify /></PageTransition>} />

              {/* 404 Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          {!isDashboardRoute && <Footer />}
        </main>
      </div>
      {/* AI Assistant Chatbot */}
      <AIChatbot />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
