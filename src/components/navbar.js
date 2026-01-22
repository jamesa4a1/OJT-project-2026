import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeContext } from '../App';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext) || {
    theme: 'dojlight',
    toggleTheme: () => {},
  };
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { path: '/homepage', label: 'Home', icon: 'fa-home' },
    { path: '/aboutus', label: 'About', icon: 'fa-info-circle' },
  ];

  const isActive = (path) => location.pathname === path;
  const isAddAccountPage = location.pathname === '/add-account';

  const roleColors = {
    Admin: { bg: 'from-red-500 to-red-600', icon: 'fa-shield-halved', badge: 'bg-red-500' },
    Clerk: { bg: 'from-amber-500 to-amber-600', icon: 'fa-pen-to-square', badge: 'bg-amber-500' },
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 
                       shadow-2xl border-b border-slate-700/50 backdrop-blur-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-3 group no-underline"
            aria-label="OCP Docketing System Home"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 
                                       flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              <i className="fas fa-balance-scale text-white text-lg md:text-xl"></i>
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-white font-bold text-lg md:text-xl tracking-tight m-0">
                OCP Docketing
              </h1>
              <p className="text-blue-400 text-xs font-medium -mt-1 m-0">
                Hall of Justice • Tagbilaran
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {!isAddAccountPage && (
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    className={`relative px-4 py-2 rounded-xl font-medium text-sm
                                               flex items-center gap-2 transition-all duration-300 no-underline
                                               ${
                                                 isActive(item.path)
                                                   ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                   : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                               }`}
                    aria-current={isActive(item.path) ? 'page' : undefined}
                  >
                    <i
                      className={`fas ${item.icon} ${isActive(item.path) ? 'text-white' : 'text-blue-400'}`}
                    ></i>
                    {item.label}
                    {isActive(item.path) && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-blue-600 rounded-xl -z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                </motion.div>
              ))}

              {/* Auth Buttons */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2 ml-2">
                  {/* User Badge */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-700/50 border border-slate-600/50">
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-br ${roleColors[user?.role]?.bg || 'from-blue-500 to-blue-600'} 
                                                    flex items-center justify-center`}
                    >
                      <i
                        className={`fas ${roleColors[user?.role]?.icon || 'fa-user'} text-white text-xs`}
                      ></i>
                    </div>
                    <span className="text-slate-300 text-sm font-medium hidden lg:inline">
                      {user?.name || 'User'}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${roleColors[user?.role]?.badge || 'bg-blue-500'} text-white`}
                    >
                      {user?.role}
                    </span>
                  </div>
                  {/* Logout Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      logout();
                      window.location.href = '/homepage';
                    }}
                    className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 
                                               text-red-400 hover:text-red-300 transition-all duration-300
                                               border border-red-500/30"
                    aria-label="Logout"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                  </motion.button>
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-2">
                  <Link to="/login">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600
                                                   text-white font-medium text-sm shadow-lg shadow-blue-500/30
                                                   hover:from-blue-600 hover:to-blue-700 transition-all duration-300 border-none"
                    >
                      <i className="fas fa-sign-in-alt mr-2"></i>
                      Login
                    </motion.button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white
                                       transition-colors duration-300"
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {!isAddAccountPage && (
          <motion.div
            initial={false}
            animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden"
          >
            <div className="py-4 space-y-2">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: isOpen ? 0 : -20, opacity: isOpen ? 1 : 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium
                                               transition-all duration-300 no-underline
                                               ${
                                                 isActive(item.path)
                                                   ? 'bg-blue-600 text-white'
                                                   : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                               }`}
                  >
                    <i className={`fas ${item.icon} w-5`}></i>
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile Auth Section */}
              <div className="pt-4 mt-4 border-t border-slate-700">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    {/* User Info */}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-700/50">
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${roleColors[user?.role]?.bg || 'from-blue-500 to-blue-600'} 
                                                        flex items-center justify-center`}
                      >
                        <i
                          className={`fas ${roleColors[user?.role]?.icon || 'fa-user'} text-white`}
                        ></i>
                      </div>
                      <div>
                        <p className="text-white font-medium m-0">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-400 m-0">{user?.role}</p>
                      </div>
                    </div>
                    {/* Logout Button */}
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                        window.location.href = '/homepage';
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium
                                                   w-full text-red-400 hover:bg-red-500/20 transition-all border-none cursor-pointer bg-transparent"
                    >
                      <i className="fas fa-sign-out-alt w-5"></i>
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <button
                        className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium
                                                           w-full text-white bg-gradient-to-r from-blue-500 to-blue-600
                                                           border-none cursor-pointer"
                      >
                        <i className="fas fa-sign-in-alt w-5"></i>
                        Login
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
