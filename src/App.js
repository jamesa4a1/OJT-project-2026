import React, { useState, useEffect, createContext } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from './components/navbar';
import Footer from './components/footer';
import DashboardLayout from './components/DashboardLayout';
//pages
import Cases from './pages/cases';
import Caselist from './pages/caselist';
import Newcase from './pages/newcase.tsx';
import Findcase from './pages/findcase';
import Deletecase from './pages/deletecase';
import Editcase from './pages/editcase';
import Homepage from './pages/homepage';
import About from './pages/aboutus';
import Details from './pages/details';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import ClerkDashboard from './pages/dashboards/ClerkDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import StaffDashboard from './pages/dashboards/StaffDashboard';
import AddAccount from './pages/AddAccount';
import Settings from './pages/Settings';
import ExcelSync from './pages/ExcelSync';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// design
import '@fortawesome/fontawesome-free/css/all.min.css';
// Auth
import { AuthProvider, useAuth } from './context/AuthContext';

// Theme Context
export const ThemeContext = createContext();

// Page Transition Wrapper
const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
};

// Dashboard Page Wrapper - wraps content with DashboardLayout
const DashboardPageWrapper = ({ children }) => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </DashboardLayout>
  );
};

// Animated Routes Component
const AnimatedRoutes = () => {
  const location = useLocation();
  const { isAuthenticated, user, isLoading } = useAuth();

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Pages that should use dashboard layout (authenticated pages)
  const dashboardPages = [
    '/dashboard',
    '/admin-dashboard',
    '/staff-dashboard',
    '/newcase',
    '/findcase',
    '/editcase',
    '/caselist',
    '/managecases',
    '/details',
    '/settings',
    '/excel-sync',
    '/add-account',
  ];
  const isDashboardPage = dashboardPages.some((page) => location.pathname.startsWith(page));
  const hideNavFooter = isDashboardPage && isAuthenticated;

  return (
    <>
      {!hideNavFooter && <Navbar />}
      <main className={hideNavFooter ? '' : 'flex-grow'}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/homepage" replace />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <DashboardPageWrapper>
                  <ClerkDashboard />
                </DashboardPageWrapper>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <DashboardPageWrapper>
                  <AdminDashboard />
                </DashboardPageWrapper>
              }
            />
            <Route
              path="/staff-dashboard"
              element={
                <DashboardPageWrapper>
                  <StaffDashboard />
                </DashboardPageWrapper>
              }
            />
            <Route
              path="/add-account"
              element={
                isAuthenticated && user?.role === 'Admin' ? (
                  <DashboardPageWrapper>
                    <AddAccount />
                  </DashboardPageWrapper>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/settings"
              element={
                isAuthenticated ? (
                  <DashboardPageWrapper>
                    <Settings />
                  </DashboardPageWrapper>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/cases"
              element={
                <PageWrapper>
                  <Cases />
                </PageWrapper>
              }
            />
            <Route
              path="/caselist"
              element={
                isAuthenticated ? (
                  <DashboardPageWrapper>
                    <Caselist />
                  </DashboardPageWrapper>
                ) : (
                  <PageWrapper>
                    <Caselist />
                  </PageWrapper>
                )
              }
            />
            <Route
              path="/newcase"
              element={
                isAuthenticated ? (
                  <DashboardPageWrapper>
                    <Newcase />
                  </DashboardPageWrapper>
                ) : (
                  <PageWrapper>
                    <Newcase />
                  </PageWrapper>
                )
              }
            />
            <Route
              path="/findcase"
              element={
                isAuthenticated ? (
                  <DashboardPageWrapper>
                    <Findcase />
                  </DashboardPageWrapper>
                ) : (
                  <PageWrapper>
                    <Findcase />
                  </PageWrapper>
                )
              }
            />
            <Route
              path="/managecases"
              element={
                isAuthenticated ? (
                  <DashboardPageWrapper>
                    <Deletecase />
                  </DashboardPageWrapper>
                ) : (
                  <PageWrapper>
                    <Deletecase />
                  </PageWrapper>
                )
              }
            />
            <Route
              path="/editcase"
              element={
                isAuthenticated ? (
                  <DashboardPageWrapper>
                    <Editcase />
                  </DashboardPageWrapper>
                ) : (
                  <PageWrapper>
                    <Editcase />
                  </PageWrapper>
                )
              }
            />
            <Route
              path="/homepage"
              element={
                <PageWrapper>
                  <Homepage />
                </PageWrapper>
              }
            />
            <Route
              path="/aboutus"
              element={
                <PageWrapper>
                  <About />
                </PageWrapper>
              }
            />
            <Route
              path="/excel-sync"
              element={
                isAuthenticated ? (
                  <DashboardPageWrapper>
                    <ExcelSync />
                  </DashboardPageWrapper>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/details/:docketNo"
              element={
                isAuthenticated ? (
                  <DashboardPageWrapper>
                    <Details />
                  </DashboardPageWrapper>
                ) : (
                  <PageWrapper>
                    <Details />
                  </PageWrapper>
                )
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
      {!hideNavFooter && <Footer />}
    </>
  );
};

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('ocp-theme');
    return savedTheme || 'light';
  });
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('ocp-theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ocp-theme', isDark ? 'dark' : 'light');
  }, [theme, isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <AuthProvider>
      <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
        <Router>
          <div
            className={`flex flex-col min-h-screen transition-all duration-500 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'}`}
            data-theme={theme}
          >
            <AnimatedRoutes />
          </div>
        </Router>
      </ThemeContext.Provider>
    </AuthProvider>
  );
}

export default App;
