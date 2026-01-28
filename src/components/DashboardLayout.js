import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../App';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useContext(ThemeContext) || {
    isDark: false,
    toggleTheme: () => {},
  };
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/homepage');
  };

  // Different sidebar items based on role
  const adminSidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large', path: '/admin-dashboard' },
    { id: 'excelsync', label: 'Excel Sync', icon: 'fa-file-excel', path: '/excel-sync' },
    { id: 'newcase', label: 'Add New Case', icon: 'fa-plus-circle', path: '/newcase' },
    { id: 'managecases', label: 'Manage Cases', icon: 'fa-tasks', path: '/managecases' },
    { id: 'clearance', label: 'Issue Clearance', icon: 'fa-certificate', path: '/clearances' },
    { id: 'addaccount', label: 'Add Account', icon: 'fa-user-plus', path: '/add-account' },
    { id: 'caselist', label: 'Terminated Cases', icon: 'fa-archive', path: '/caselist' },
    { id: 'settings', label: 'Account Settings', icon: 'fa-cog', path: '/settings' },
  ];

  const clerkSidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large', path: '/dashboard' },
    { id: 'newcase', label: 'Add New Case', icon: 'fa-plus-circle', path: '/newcase' },
    { id: 'managecases', label: 'Manage Cases', icon: 'fa-tasks', path: '/managecases' },
    { id: 'clearance', label: 'Issue Clearance', icon: 'fa-certificate', path: '/clearances' },
    { id: 'settings', label: 'Account Settings', icon: 'fa-cog', path: '/settings' },
  ];

  const staffSidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large', path: '/staff-dashboard' },
    { id: 'settings', label: 'Account Settings', icon: 'fa-cog', path: '/settings' },
  ];

  const getSidebarItems = () => {
    if (user?.role === 'Admin') return adminSidebarItems;
    if (user?.role === 'Staff') return staffSidebarItems;
    return clerkSidebarItems;
  };

  const sidebarItems = getSidebarItems();

  const roleConfig = {
    Admin: {
      light: 'bg-red-100',
      text: 'text-red-600',
      icon: 'fa-shield-halved',
    },
    Clerk: {
      light: 'bg-amber-100',
      text: 'text-amber-600',
      icon: 'fa-pen-to-square',
    },
    Staff: {
      light: 'bg-teal-100',
      text: 'text-teal-600',
      icon: 'fa-user-tie',
    },
  };

  const currentRole = roleConfig[user?.role] || roleConfig.Clerk;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col overflow-hidden">
      {/* Top Header */}
      <header
        className={`h-16 flex-shrink-0 px-8 flex items-center shadow-lg z-50 transition-colors duration-300 ${isDark ? 'bg-slate-900 border-b border-slate-700' : 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800'}`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 
                                        flex items-center justify-center shadow-lg"
            >
              <i className="fas fa-balance-scale text-white"></i>
            </div>
            <div>
              <h1 className="font-bold text-white text-lg m-0">OCP Docketing</h1>
              <p className="text-xs text-blue-300 m-0">Hall of Justice • Tagbilaran</p>
            </div>
          </div>

          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user?.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 
                                                flex items-center justify-center text-white font-bold"
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white m-0">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400 m-0">{user?.email}</p>
              </div>
              <motion.i
                animate={{ rotate: showProfileMenu ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="fas fa-chevron-down text-slate-400 text-xs ml-2"
              ></motion.i>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute right-0 mt-3 w-72 rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}
                  style={{ zIndex: 9999 }}
                >
                  <div
                    className={`p-4 border-b transition-colors duration-300 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50'}`}
                  >
                    <p
                      className={`text-base font-bold truncate mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}
                    >
                      {user?.name}
                    </p>
                    <p
                      className={`text-sm truncate mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                    >
                      {user?.email}
                    </p>
                    <span
                      className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                        user?.role === 'Admin'
                          ? 'bg-purple-600 text-white'
                          : user?.role === 'Staff'
                            ? 'bg-teal-600 text-white'
                            : 'bg-blue-600 text-white'
                      }`}
                    >
                      {user?.role}
                    </span>
                  </div>

                  {/* Dark Mode Toggle */}
                  <motion.button
                    whileHover={{ backgroundColor: isDark ? '#334155' : '#f1f5f9' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggleTheme}
                    className={`w-full flex items-center justify-between px-4 py-3.5 transition-all text-left border-none cursor-pointer font-medium ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-500'}`}
                      >
                        <i className={`fas ${isDark ? 'fa-moon' : 'fa-sun'} text-lg`}></i>
                      </div>
                      <span className="font-semibold text-base">
                        {isDark ? 'Dark Mode' : 'Light Mode'}
                      </span>
                    </div>
                    <div
                      className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${isDark ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <motion.div
                        layout
                        className="w-4 h-4 rounded-full bg-white shadow-md"
                        animate={{ x: isDark ? 24 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </motion.button>

                  <div className={`border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                    <motion.button
                      whileHover={{ backgroundColor: isDark ? '#7f1d1d' : '#fef2f2' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleLogout}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-red-500 transition-all text-left border-none cursor-pointer font-medium ${isDark ? 'bg-slate-800 hover:bg-red-900/30' : 'bg-white hover:bg-red-50'}`}
                    >
                      <i className="fas fa-sign-out-alt w-5 text-lg"></i>
                      <span className="font-semibold text-base">Sign Out</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Content Wrapper */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`w-72 flex-shrink-0 flex flex-col z-40 transition-colors duration-300 ${isDark ? 'bg-slate-800 border-r border-slate-700' : 'bg-white border-r border-slate-200'}`}
        >
          {/* Role Label */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`px-4 pt-8 pb-4 border-b transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
          >
            <motion.span
              animate={{ x: [0, 2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className={`inline-block text-base font-bold uppercase tracking-wider ${user?.role === 'Admin' ? 'text-blue-600' : user?.role === 'Staff' ? 'text-teal-600' : 'text-sky-600'}`}
            >
              {user?.role === 'Admin'
                ? 'Admin Dashboard'
                : user?.role === 'Staff'
                  ? 'Staff Dashboard'
                  : 'Clerk Dashboard'}
            </motion.span>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 p-4 pt-2 space-y-2 overflow-y-auto">
            {sidebarItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                                        transition-all duration-200 border-none cursor-pointer text-left
                                        ${
                                          isActive(item.path)
                                            ? isDark
                                              ? 'bg-blue-600 text-white shadow-lg'
                                              : 'bg-slate-800 text-white shadow-lg'
                                            : isDark
                                              ? 'bg-transparent text-slate-300 hover:bg-slate-700'
                                              : 'bg-transparent text-slate-600 hover:bg-slate-100'
                                        }`}
              >
                <i className={`fas ${item.icon} w-5 text-center`}></i>
                <span>{item.label}</span>
              </motion.button>
            ))}
          </nav>

          {/* Sidebar Footer - User Info */}
          <div
            className={`p-4 border-t transition-colors duration-300 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-300 ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user?.name}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-lg ${currentRole.light} flex items-center justify-center`}
                >
                  <i className={`fas ${currentRole.icon} ${currentRole.text} text-sm`}></i>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold truncate m-0 transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-700'}`}
                >
                  {user?.name || 'User'}
                </p>
                <p className={`text-xs m-0 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main
          className={`flex-1 overflow-x-hidden overflow-y-auto px-6 py-8 transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}
        >
          <div className="w-full h-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
