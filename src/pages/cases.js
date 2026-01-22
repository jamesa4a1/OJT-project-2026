import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Cases = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, canCreateCases, canEditCases, canDeleteCases, logout } = useAuth();

  // Define all possible action cards
  const allActionCards = [
    {
      id: 'newcase',
      title: 'Add New Case',
      description: 'Register a new legal case into the system',
      icon: 'fa-plus-circle',
      path: '/newcase',
      color: 'from-emerald-500 to-emerald-600',
      shadowColor: 'shadow-emerald-500/30',
      hoverBg: 'hover:bg-emerald-50',
      permission: 'create',
    },
    {
      id: 'findcase',
      title: 'Find Case',
      description: 'Search and locate specific cases',
      icon: 'fa-search',
      path: '/findcase',
      color: 'from-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-500/30',
      hoverBg: 'hover:bg-blue-50',
      permission: 'view',
    },
    {
      id: 'editcase',
      title: 'Edit Case',
      description: 'Modify existing case information',
      icon: 'fa-edit',
      path: '/editcase',
      color: 'from-amber-500 to-amber-600',
      shadowColor: 'shadow-amber-500/30',
      hoverBg: 'hover:bg-amber-50',
      permission: 'edit',
    },
    {
      id: 'caselist',
      title: 'View All Cases',
      description: 'Browse the complete case database',
      icon: 'fa-list-ul',
      path: '/caselist',
      color: 'from-violet-500 to-violet-600',
      shadowColor: 'shadow-violet-500/30',
      hoverBg: 'hover:bg-violet-50',
      permission: 'view',
    },
    {
      id: 'deletecase',
      title: 'Delete Case',
      description: 'Remove cases from the system',
      icon: 'fa-trash-alt',
      path: '/managecases',
      color: 'from-red-500 to-red-600',
      shadowColor: 'shadow-red-500/30',
      hoverBg: 'hover:bg-red-50',
      permission: 'delete',
    },
  ];

  // Filter action cards based on user permissions
  const actionCards = allActionCards.filter((card) => {
    if (card.permission === 'view') return true; // Everyone can view
    if (card.permission === 'create') return canCreateCases();
    if (card.permission === 'edit') return canEditCases();
    if (card.permission === 'delete') return canDeleteCases();
    return false;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 
                        py-12 px-4 relative overflow-hidden"
    >
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto"
      >
        {/* User Dashboard Header */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl bg-white border border-slate-200 shadow-lg"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center
                                               ${
                                                 user?.role === 'Admin'
                                                   ? 'bg-gradient-to-br from-red-500 to-red-600'
                                                   : user?.role === 'Clerk'
                                                     ? 'bg-gradient-to-br from-amber-500 to-amber-600'
                                                     : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                               } shadow-lg`}
                >
                  <i
                    className={`fas ${
                      user?.role === 'Admin'
                        ? 'fa-shield-halved'
                        : user?.role === 'Clerk'
                          ? 'fa-pen-to-square'
                          : 'fa-eye'
                    } 
                                                  text-white text-xl`}
                  ></i>
                </div>
                <div>
                  <p className="text-sm text-slate-500 m-0">Welcome back,</p>
                  <h2 className="text-xl font-bold text-slate-800 m-0">
                    {user?.name || user?.email}
                  </h2>
                  <p
                    className={`text-sm font-medium m-0
                                                  ${
                                                    user?.role === 'Admin'
                                                      ? 'text-red-600'
                                                      : user?.role === 'Clerk'
                                                        ? 'text-amber-600'
                                                        : 'text-blue-600'
                                                  }`}
                  >
                    {user?.role} Dashboard
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-sm text-slate-500">Permissions:</span>
                  <span className="text-sm font-medium text-slate-700">
                    {user?.role === 'Admin'
                      ? 'Full Access'
                      : user?.role === 'Clerk'
                        ? 'Create, View & Edit'
                        : 'View Only'}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl
                                               bg-slate-800 text-white font-medium text-sm
                                               hover:bg-slate-900 transition-colors border-none cursor-pointer"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span className="hidden sm:inline">Logout</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Not Logged In Warning */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-amber-600"></i>
                </div>
                <div>
                  <p className="font-semibold text-amber-800 m-0">You're browsing as a guest</p>
                  <p className="text-sm text-amber-600 m-0">Login to access all features</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-xl bg-amber-600 text-white font-medium text-sm
                                                   hover:bg-amber-700 transition-colors border-none cursor-pointer"
                  >
                    Login
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-xl bg-white text-amber-700 font-medium text-sm
                                                   border border-amber-300 hover:bg-amber-50 cursor-pointer"
                  >
                    Register
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                                    bg-blue-100 border border-blue-200 mb-4"
          >
            <i className="fas fa-folder-open text-blue-600"></i>
            <span className="text-blue-700 font-medium text-sm">Case Management</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Select an Action</h1>
          <p className="text-slate-500 max-w-md mx-auto">
            {isAuthenticated
              ? `Available actions based on your ${user?.role} role`
              : 'Login to access all case management features'}
          </p>
        </motion.div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {actionCards.map((card, index) => (
            <motion.div
              key={card.id}
              variants={cardVariants}
              whileHover={{
                y: -8,
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(card.path)}
              className={`relative overflow-hidden rounded-2xl p-6 
                                       bg-white border border-slate-200/80
                                       shadow-lg hover:shadow-2xl ${card.shadowColor}
                                       cursor-pointer group transition-all duration-300
                                       ${card.hoverBg}`}
              role="button"
              tabIndex={0}
              aria-label={`${card.title}: ${card.description}`}
              onKeyDown={(e) => e.key === 'Enter' && navigate(card.path)}
            >
              {/* Card Background Gradient on Hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.color} 
                                            opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              ></div>

              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} 
                                            flex items-center justify-center mb-4 
                                            shadow-lg ${card.shadowColor}
                                            group-hover:scale-110 transition-transform duration-300`}
              >
                <i className={`fas ${card.icon} text-white text-xl`}></i>
              </div>

              {/* Content */}
              <h3
                className="text-lg font-bold text-slate-800 mb-2 
                                          group-hover:text-slate-900 transition-colors"
              >
                {card.title}
              </h3>
              <p className="text-sm text-slate-500 mb-4">{card.description}</p>

              {/* Arrow Indicator */}
              <div
                className="flex items-center text-sm font-medium text-blue-600 
                                           opacity-0 group-hover:opacity-100 
                                           transform translate-x-[-10px] group-hover:translate-x-0
                                           transition-all duration-300"
              >
                <span>Open</span>
                <i className="fas fa-arrow-right ml-2"></i>
              </div>

              {/* Decorative Corner */}
              <div
                className={`absolute -bottom-2 -right-2 w-20 h-20 
                                            bg-gradient-to-br ${card.color} opacity-5 rounded-full
                                            group-hover:opacity-10 group-hover:scale-150
                                            transition-all duration-500`}
              ></div>
            </motion.div>
          ))}
        </div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl 
                                    bg-slate-100 text-slate-600 text-sm"
          >
            <i className="fas fa-lightbulb text-amber-500"></i>
            <span>
              Tip: Use{' '}
              <kbd className="px-2 py-0.5 bg-white rounded border text-xs">keyboard navigation</kbd>{' '}
              for faster access
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Cases;
