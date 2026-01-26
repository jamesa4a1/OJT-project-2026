import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../App';
import axios from 'axios';
import * as XLSX from 'xlsx';

// Circular Progress Ring Component
const ProgressRing = ({ progress, size = 48, strokeWidth = 4, color = 'blue', isDark }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const colorMap = {
    blue: { light: '#3B82F6', dark: '#60A5FA' },
    teal: { light: '#14B8A6', dark: '#2DD4BF' },
    orange: { light: '#F97316', dark: '#FB923C' },
    violet: { light: '#8B5CF6', dark: '#A78BFA' },
  };
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorMap[color]?.[isDark ? 'dark' : 'light'] || colorMap.blue.light}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

// Trend Indicator Component
const TrendIndicator = ({ value, isPositive = true, isDark }) => (
  <div className={`flex items-center gap-1 text-xs font-semibold ${
    isPositive 
      ? isDark ? 'text-emerald-400' : 'text-emerald-600'
      : isDark ? 'text-rose-400' : 'text-rose-600'
  }`}>
    <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'} text-[10px]`}></i>
    <span>{value}%</span>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, register } = useAuth();
  const { isDark } = useContext(ThemeContext) || { isDark: false };
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    thisMonth: 0,
    totalUsers: 0,
    totalClerks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentCases, setRecentCases] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [showAllCases, setShowAllCases] = useState(false);
  const [users, setUsers] = useState([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Clerk' });
  const [createStatus, setCreateStatus] = useState({ type: '', message: '' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();

    // Auto-refresh users list every 3 seconds to update online status
    const interval = setInterval(() => {
      fetchUsers();
    }, 3000); // 3 seconds for faster updates

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/cases');
      if (response.ok) {
        const cases = await response.json();

        // Map uppercase DB fields to lowercase for frontend
        const mappedCases = cases.map((c) => ({
          ...c,
          id: c.id,
          docket_no: c.DOCKET_NO,
          date_filed: c.DATE_FILED,
          complainant: c.COMPLAINANT,
          respondent: c.RESPONDENT,
          offense: c.OFFENSE,
          date_resolved: c.DATE_RESOLVED,
          status: c.REMARKS_DECISION || 'Pending',
          title: c.DOCKET_NO,
        }));

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const resolved = mappedCases.filter(
          (c) =>
            c.status?.toLowerCase() === 'resolved' ||
            c.status?.toLowerCase() === 'closed' ||
            c.status?.toLowerCase() === 'terminated'
        ).length;
        const pending = mappedCases.filter(
          (c) =>
            c.status?.toLowerCase() === 'pending' ||
            c.status?.toLowerCase() === 'open' ||
            c.status?.toLowerCase() === 'ongoing'
        ).length;
        const monthCases = mappedCases.filter((c) => {
          const caseDate = new Date(c.date_filed || c.DATE_FILED);
          return caseDate.getMonth() === thisMonth && caseDate.getFullYear() === thisYear;
        }).length;

        setStats((prev) => ({
          ...prev,
          total: mappedCases.length,
          resolved: resolved,
          pending: pending,
          thisMonth: monthCases,
        }));

        setRecentCases(mappedCases.slice(0, 3));
        setAllCases(mappedCases);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
          const clerks = data.users.filter((u) => u.role === 'Clerk').length;
          setStats((prev) => ({
            ...prev,
            totalUsers: data.users.length,
            totalClerks: clerks,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateStatus({ type: '', message: '' });

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (data.success) {
        setCreateStatus({
          type: 'success',
          message: `Account created successfully for ${newUser.name}!`,
        });
        setNewUser({ name: '', email: '', password: '', role: 'Clerk' });
        fetchUsers();
        setTimeout(() => {
          setShowCreateModal(false);
          setCreateStatus({ type: '', message: '' });
        }, 2000);
      } else {
        setCreateStatus({ type: 'error', message: data.message || 'Failed to create account' });
      }
    } catch (error) {
      setCreateStatus({ type: 'error', message: 'Server error. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`http://localhost:5000/api/user/${selectedUser.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchUsers();
        setShowDeleteModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      console.log('📥 Starting Excel export...');
      const response = await fetch('http://localhost:5000/cases');
      
      if (!response.ok) {
        console.error('❌ Failed to fetch cases:', response.status);
        alert(`Failed to export: ${response.statusText}`);
        return;
      }
      
      const cases = await response.json();
      console.log(`✅ Fetched ${cases.length} cases for export`);
      
      if (!cases || cases.length === 0) {
        alert('No cases available to export');
        return;
      }

      // Prepare headers (removed ID)
      const headers = [
        'Docket No',
        'Date Filed',
        'Complainant',
        'Respondent',
        'Address of Respondent',
        'Offense',
        'Date of Commission',
        'Date Resolved',
        'Resolving Prosecutor',
        'Criminal Case No',
        'Branch',
        'Date Filed in Court',
        'Remarks Decision',
        'Penalty',
        'Index Cards',
      ];

      // Prepare data rows (removed c.id)
      const data = cases.map((c) => [
        c.DOCKET_NO || c.docket_no || '',
        c.DATE_FILED || c.date_filed || '',
        c.COMPLAINANT || c.complainant || '',
        c.RESPONDENT || c.respondent || '',
        c.ADDRESS_OF_RESPONDENT || c.address_of_respondent || '',
        c.OFFENSE || c.offense || '',
        c.DATE_OF_COMMISSION || c.date_of_commission || '',
        c.DATE_RESOLVED || c.date_resolved || '',
        c.RESOLVING_PROSECUTOR || c.resolving_prosecutor || '',
        c.CRIM_CASE_NO || c.crim_case_no || '',
        c.BRANCH || c.branch || '',
        c.DATEFILED_IN_COURT || c.datefiled_in_court || '',
        c.REMARKS_DECISION || c.remarks_decision || '',
        c.PENALTY || c.penalty || '',
        c.INDEX_CARDS || c.index_cards || '',
      ]);

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

      // Auto-fit column widths based on content
      const columnWidths = headers.map((header, idx) => {
        let maxWidth = header.length;
        
        // Check content in each row
        data.forEach((row) => {
          const cellContent = String(row[idx] || '').length;
          if (cellContent > maxWidth) {
            maxWidth = cellContent;
          }
        });
        
        // Add padding and return width object
        return { wch: Math.min(maxWidth + 2, 50) }; // Max width 50 to prevent extremely wide columns
      });

      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Cases');

      // Write file
      const filename = `cases_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
      
      console.log(`✅ Excel file exported successfully: ${filename}`);
    } catch (error) {
      console.error('❌ Error exporting Excel:', error);
      alert('Error exporting Excel: ' + error.message);
    }
  };

  return (
    <div className="transition-colors duration-300 space-y-6">
      {/* Admin Welcome Banner - Enhanced with glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative rounded-2xl p-6 shadow-2xl overflow-hidden ${
          isDark 
            ? 'bg-gradient-to-br from-slate-800 via-blue-900/50 to-indigo-900' 
            : 'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600'
        }`}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl"
          />
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" 
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {/* Animated Avatar with Profile Picture */}
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-xl 
                            flex items-center justify-center shadow-xl border-2 border-white/40 overflow-hidden">
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user?.name || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <motion.i 
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="fas fa-user-shield text-white text-3xl"
                  ></motion.i>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full 
                            flex items-center justify-center border-2 border-white shadow-lg">
                <i className="fas fa-check text-white text-xs"></i>
              </div>
            </motion.div>
            
            <div>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-white/70 text-sm font-medium m-0"
              >
                Welcome back,
              </motion.p>
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-white m-0 tracking-tight"
              >
                {user?.name || 'Admin'}
              </motion.h2>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 mt-2"
              >
                <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm 
                               text-white text-xs font-bold uppercase tracking-wider
                               border border-white/20 shadow-inner">
                  <i className="fas fa-shield-halved mr-1.5"></i>
                  Administrator
                </span>
                <span className="text-white/60 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Full System Access
                </span>
              </motion.div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date/Time Widget */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className={`hidden md:flex flex-col items-end px-5 py-3 rounded-2xl`}>
              <span className="text-white/95 text-sm font-bold tracking-wide">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
              <span className="text-white/70 text-xs font-medium mt-0.5">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-6 py-3 rounded-xl
                       bg-white text-blue-600 font-bold text-sm
                       hover:bg-blue-50 transition-all duration-300 border-none cursor-pointer 
                       shadow-xl shadow-blue-900/30"
            >
              <i className="fas fa-download"></i>
              Export Cases
            </motion.button>
          </div>
        </div>
        
        {/* Mini Stats in Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10"
        >
          {[
            { label: 'Total Cases', value: stats.total, icon: 'fa-folder-open' },
            { label: 'Active Users', value: stats.totalUsers, icon: 'fa-users' },
            { label: 'Pending Review', value: stats.pending, icon: 'fa-hourglass-half' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <i className={`fas ${item.icon} text-white/80`}></i>
              </div>
              <div>
                <p className="text-2xl font-bold text-white m-0">{item.value}</p>
                <p className="text-white/60 text-xs m-0">{item.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Quick Actions - Enhanced with gradients and animations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-amber-900/50' : 'bg-amber-100'
            }`}>
              <i className={`fas fa-bolt ${isDark ? 'text-amber-400' : 'text-amber-600'}`}></i>
            </div>
            <h3 className={`text-lg font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Quick Actions
            </h3>
          </div>
          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Frequently used operations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Add New Case Card */}
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/newcase')}
            className={`relative rounded-2xl p-6 cursor-pointer group overflow-hidden transition-all duration-300 ${
              isDark 
                ? 'bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50' 
                : 'bg-white border border-slate-100 hover:border-cyan-300 shadow-lg hover:shadow-xl'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center 
                            bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30`}
                >
                  <i className="fas fa-plus text-white text-xl"></i>
                </motion.div>
                <div>
                  <h4 className={`font-bold text-lg m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    Add New Case
                  </h4>
                  <p className={`text-sm m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Register a new case entry
                  </p>
                </div>
              </div>
              <motion.i
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`fas fa-arrow-right text-lg ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}
              ></motion.i>
            </div>
          </motion.div>

          {/* Manage Cases Card */}
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/managecases')}
            className={`relative rounded-2xl p-6 cursor-pointer group overflow-hidden transition-all duration-300 ${
              isDark 
                ? 'bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700/50 hover:border-sky-500/50' 
                : 'bg-white border border-slate-100 hover:border-sky-300 shadow-lg hover:shadow-xl'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ rotate: 15 }}
                  transition={{ duration: 0.3 }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center 
                            bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/30`}
                >
                  <i className="fas fa-tasks text-white text-xl"></i>
                </motion.div>
                <div>
                  <h4 className={`font-bold text-lg m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    Manage Cases
                  </h4>
                  <p className={`text-sm m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Modify existing case details
                  </p>
                </div>
              </div>
              <motion.i
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                className={`fas fa-arrow-right text-lg ${isDark ? 'text-sky-400' : 'text-sky-600'}`}
              ></motion.i>
            </div>
          </motion.div>

          {/* Excel Sync Card */}
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/excel-sync')}
            className={`relative rounded-3xl p-6 cursor-pointer group overflow-hidden transition-all duration-300 ${
              isDark 
                ? 'bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700/50 hover:border-emerald-500/50' 
                : 'bg-white border border-slate-100 hover:border-emerald-300 shadow-lg hover:shadow-xl'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-14 h-14 rounded-3xl flex items-center justify-center 
                            bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30`}
                >
                  <i className="fas fa-file-excel text-white text-xl"></i>
                </motion.div>
                <div>
                  <h4 className={`font-bold text-lg m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    Excel Sync
                  </h4>
                  <p className={`text-sm m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Import/Export Excel files
                  </p>
                </div>
              </div>
              <motion.i
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                className={`fas fa-arrow-right text-lg ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
              ></motion.i>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Statistics Cards - Enhanced with Progress Rings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-blue-900/50' : 'bg-blue-100'
            }`}>
              <i className={`fas fa-chart-pie ${isDark ? 'text-blue-400' : 'text-blue-600'}`}></i>
            </div>
            <h3 className={`text-lg font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Case Statistics
            </h3>
          </div>
          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Real-time overview
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Cases Card */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className={`relative rounded-2xl p-5 overflow-hidden transition-all duration-300 ${
              isDark 
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50' 
                : 'bg-white border border-slate-100 shadow-lg hover:shadow-xl'
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-8 -mt-8" />
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${
                  isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <i className={`fas fa-folder-open ${isDark ? 'text-blue-400' : 'text-blue-600'}`}></i>
                </div>
                <p className={`text-3xl font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {stats.total}
                </p>
                <p className={`text-sm m-0 mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Total Cases
                </p>
              </div>
              <ProgressRing 
                progress={100} 
                color="blue" 
                isDark={isDark}
              />
            </div>
          </motion.div>

          {/* Pending Cases Card */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className={`relative rounded-2xl p-5 overflow-hidden transition-all duration-300 ${
              isDark 
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50' 
                : 'bg-white border border-slate-100 shadow-lg hover:shadow-xl'
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full -mr-8 -mt-8" />
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${
                  isDark ? 'bg-orange-500/20' : 'bg-orange-100'
                }`}>
                  <i className={`fas fa-hourglass-half ${isDark ? 'text-orange-400' : 'text-orange-500'}`}></i>
                </div>
                <p className={`text-3xl font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {stats.pending}
                </p>
                <p className={`text-sm m-0 mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Pending
                </p>
              </div>
              <ProgressRing 
                progress={stats.total > 0 ? (stats.pending / stats.total) * 100 : 0} 
                color="orange" 
                isDark={isDark}
              />
            </div>
          </motion.div>

          {/* This Month Card */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className={`relative rounded-2xl p-5 overflow-hidden transition-all duration-300 ${
              isDark 
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50' 
                : 'bg-white border border-slate-100 shadow-lg hover:shadow-xl'
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full -mr-8 -mt-8" />
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${
                  isDark ? 'bg-violet-500/20' : 'bg-violet-100'
                }`}>
                  <i className={`fas fa-calendar-days ${isDark ? 'text-violet-400' : 'text-violet-600'}`}></i>
                </div>
                <p className={`text-3xl font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {stats.thisMonth}
                </p>
                <p className={`text-sm m-0 mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  This Month
                </p>
              </div>
              <ProgressRing 
                progress={stats.total > 0 ? (stats.thisMonth / stats.total) * 100 : 0} 
                color="violet" 
                isDark={isDark}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom Section - Recent Cases - Enhanced */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Cases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`rounded-3xl overflow-hidden transition-all duration-300 ${
            isDark 
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50' 
              : 'bg-white border border-slate-100 shadow-xl'
          }`}
        >
          {/* Header */}
          <div className={`px-6 py-5 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isDark 
                    ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20' 
                    : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                }`}>
                  <i className={`fas fa-briefcase text-xl ${isDark ? 'text-blue-400' : 'text-blue-600'}`}></i>
                </div>
                <div>
                  <h3 className={`text-xl font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    Recent Cases
                  </h3>
                  <p className={`text-sm m-0 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {recentCases.length} {recentCases.length === 1 ? 'case' : 'cases'} in the system
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05, x: 3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/managecases')}
                className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl 
                          transition-all no-underline border-none cursor-pointer ${
                  isDark 
                    ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20' 
                    : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                }`}
              >
                View All
                <i className="fas fa-arrow-right text-xs"></i>
              </motion.button>
            </div>
          </div>

          {/* Cases List */}
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`animate-pulse rounded-2xl p-5 ${
                    isDark ? 'bg-slate-700/50' : 'bg-slate-100'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`} />
                      <div className="flex-1">
                        <div className={`h-4 rounded w-1/3 mb-2 ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`} />
                        <div className={`h-3 rounded w-1/2 ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentCases.length > 0 ? (
              <div className="space-y-3">
                {(showAllCases ? recentCases : recentCases.slice(0, 5)).map((caseItem, index) => {
                  const isResolved =
                    caseItem.status?.toLowerCase() === 'resolved' ||
                    caseItem.status?.toLowerCase() === 'closed' ||
                    caseItem.status?.toLowerCase() === 'terminated' ||
                    caseItem.status?.toLowerCase() === 'guilty' ||
                    caseItem.status?.toLowerCase() === 'acquitted';

                  return (
                    <motion.div
                      key={caseItem.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      className={`group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                        isDark
                          ? 'border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-700/30'
                          : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-lg'
                      }`}
                      onClick={() => navigate(`/details/${caseItem.DOCKET_NO || caseItem.docket_no}`)}
                    >
                      {/* Case Icon with Status */}
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                          isResolved
                            ? isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                            : isDark ? 'bg-amber-500/20' : 'bg-amber-100'
                        }`}>
                          <i className={`fas fa-gavel text-xl ${
                            isResolved
                              ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                              : isDark ? 'text-amber-400' : 'text-amber-600'
                          }`}></i>
                        </div>
                        {/* Status dot */}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isDark ? 'border-slate-800' : 'border-white'
                        } ${isResolved ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                          <i className={`fas ${isResolved ? 'fa-check' : 'fa-hourglass-half'} text-white text-[8px]`}></i>
                        </div>
                      </div>

                      {/* Case Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <p className={`font-bold m-0 text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {caseItem.DOCKET_NO || caseItem.docket_no || 'Untitled Case'}
                          </p>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                            isResolved
                              ? isDark
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : isDark
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}>
                            {caseItem.status || 'Pending'}
                          </span>
                        </div>
                        <p className={`text-sm m-0 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          <i className="fas fa-user-tie text-xs opacity-60"></i>
                          <span className="truncate">{caseItem.RESPONDENT || caseItem.respondent || 'N/A'}</span>
                        </p>
                        <p className={`text-xs m-0 mt-1.5 flex items-center gap-3 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          <span className="flex items-center gap-1">
                            <i className="fas fa-calendar-plus text-xs"></i>
                            Filed: {caseItem.DATE_FILED
                              ? new Date(caseItem.DATE_FILED).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'No date'}
                          </span>
                          {(caseItem.date_resolved || caseItem.DATE_RESOLVED) && (
                            <span className="flex items-center gap-1">
                              <i className="fas fa-calendar-check text-xs"></i>
                              Resolved: {new Date(caseItem.DATE_RESOLVED).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Arrow Indicator */}
                      <motion.div
                        initial={{ x: 0, opacity: 0.5 }}
                        whileHover={{ x: 5, opacity: 1 }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          isDark 
                            ? 'bg-slate-700 group-hover:bg-blue-500/20' 
                            : 'bg-slate-100 group-hover:bg-blue-100'
                        }`}
                      >
                        <i className={`fas fa-chevron-right ${
                          isDark ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-600'
                        }`}></i>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className={`text-center py-16 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <div className={`w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center ${
                  isDark ? 'bg-slate-700/50' : 'bg-slate-100'
                }`}>
                  <i className="fas fa-inbox text-4xl opacity-30"></i>
                </div>
                <p className="m-0 font-semibold text-lg">No cases found</p>
                <p className="text-sm m-0 mt-2 opacity-70">Cases will appear here once they are created</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/newcase')}
                  className={`mt-4 px-6 py-3 rounded-xl font-semibold border-none cursor-pointer ${
                    isDark
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add First Case
                </motion.button>
              </div>
            )}
          </div>

          {/* See More / See Less Button */}
          {recentCases.length > 5 && (
            <div className={`px-6 py-4 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAllCases(!showAllCases)}
                className={`w-full py-3 rounded-xl font-semibold border-2 transition-all flex items-center justify-center gap-2 ${
                  isDark
                    ? 'bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <i className={`fas fa-chevron-${showAllCases ? 'up' : 'down'}`}></i>
                {showAllCases ? 'Show Less' : `Show All (${recentCases.length})`}
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>

      {/* User Management Section - Enhanced with HeroUI Table styling */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`rounded-3xl overflow-hidden transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50' 
            : 'bg-white border border-slate-100 shadow-xl'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-5 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isDark 
                  ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/20' 
                  : 'bg-gradient-to-br from-violet-100 to-purple-100'
              }`}>
                <i className={`fas fa-users-gear text-xl ${isDark ? 'text-violet-400' : 'text-violet-600'}`}></i>
              </div>
              <div>
                <h3 className={`text-xl font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  User Management
                </h3>
                <p className={`text-sm m-0 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {stats.totalUsers} total users • {stats.totalClerks} clerks
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/add-account')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                        border-none cursor-pointer transition-all
                        bg-gradient-to-r from-violet-500 to-purple-600 text-white
                        shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40`}
            >
              <i className="fas fa-user-plus"></i>
              Manage Users
            </motion.button>
          </div>
        </div>

        {/* Users Table */}
        <div className="p-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={`text-left py-4 px-4 text-xs font-bold uppercase tracking-wider rounded-l-xl ${
                  isDark ? 'text-slate-400 bg-slate-700/30' : 'text-slate-500 bg-slate-50'
                }`}>
                  User
                </th>
                <th className={`text-left py-4 px-4 text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400 bg-slate-700/30' : 'text-slate-500 bg-slate-50'
                }`}>
                  Email
                </th>
                <th className={`text-left py-4 px-4 text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400 bg-slate-700/30' : 'text-slate-500 bg-slate-50'
                }`}>
                  Role
                </th>
                <th className={`text-left py-4 px-4 text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400 bg-slate-700/30' : 'text-slate-500 bg-slate-50'
                }`}>
                  Last Login
                </th>
                <th className={`text-left py-4 px-4 text-xs font-bold uppercase tracking-wider rounded-r-xl ${
                  isDark ? 'text-slate-400 bg-slate-700/30' : 'text-slate-500 bg-slate-50'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {(showAllUsers ? users : users.slice(0, 5)).map((u, index) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group transition-all ${
                    isDark 
                      ? 'hover:bg-slate-700/30' 
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className={`py-4 px-4 border-b ${isDark ? 'border-slate-700/30' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                        u.role === 'Admin' 
                          ? isDark ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20 text-red-400' : 'bg-gradient-to-br from-red-100 to-rose-100 text-red-600'
                          : u.role === 'Staff'
                            ? isDark ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20 text-teal-400' : 'bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-600'
                            : isDark ? 'bg-gradient-to-br from-sky-500/20 to-blue-500/20 text-sky-400' : 'bg-gradient-to-br from-sky-100 to-blue-100 text-sky-600'
                      }`}>
                        <i className={`fas ${
                          u.role === 'Admin' ? 'fa-shield-halved' : u.role === 'Staff' ? 'fa-user-tie' : 'fa-user'
                        }`}></i>
                        {/* Online indicator */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                          isDark ? 'border-slate-800' : 'border-white'
                        } ${u.is_online === 1 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      </div>
                      <div>
                        <span className={`font-semibold block ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          {u.name}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {u.is_online === 1 ? (
                            <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>Active now</span>
                          ) : u.last_login ? (
                            (() => {
                              const now = new Date();
                              const lastLogin = new Date(u.last_login);
                              const diffMs = now - lastLogin;
                              const diffMins = Math.floor(diffMs / 60000);
                              const diffHours = Math.floor(diffMs / 3600000);
                              const diffDays = Math.floor(diffMs / 86400000);
                              
                              if (diffMins < 1) return 'Active just now';
                              if (diffMins < 60) return `Active ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
                              if (diffHours < 24) return `Active ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
                              return `Active ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
                            })()
                          ) : 'Never active'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={`py-4 px-4 border-b ${isDark ? 'border-slate-700/30' : 'border-slate-100'}`}>
                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {u.email}
                    </span>
                  </td>
                  <td className={`py-4 px-4 border-b ${isDark ? 'border-slate-700/30' : 'border-slate-100'}`}>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                      u.role === 'Admin' 
                        ? isDark ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-100 text-red-700 border border-red-200'
                        : u.role === 'Staff'
                          ? isDark ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-teal-100 text-teal-700 border border-teal-200'
                          : isDark ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-sky-100 text-sky-700 border border-sky-200'
                    }`}>
                      <i className={`fas ${u.role === 'Admin' ? 'fa-crown' : u.role === 'Staff' ? 'fa-briefcase' : 'fa-pen'} text-[10px]`}></i>
                      {u.role}
                    </span>
                  </td>
                  <td className={`py-4 px-4 border-b ${isDark ? 'border-slate-700/30' : 'border-slate-100'}`}>
                    <div>
                      <span className={`text-sm block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {u.last_login
                          ? new Date(u.last_login).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Never'}
                      </span>
                      {u.last_login && (
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {new Date(u.last_login).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`py-4 px-4 border-b ${isDark ? 'border-slate-700/30' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                      {u.role !== 'Admin' && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedUser(u);
                            setShowDeleteModal(true);
                          }}
                          className={`w-9 h-9 rounded-xl border-none cursor-pointer transition-all flex items-center justify-center ${
                            isDark 
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                              : 'bg-red-50 text-red-500 hover:bg-red-100'
                          }`}
                          title="Delete user"
                        >
                          <i className="fas fa-trash-alt text-sm"></i>
                        </motion.button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* See More / See Less Button */}
        {users.length > 5 && (
          <div className={`px-6 py-4 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAllUsers(!showAllUsers)}
              className={`w-full py-3 rounded-xl font-semibold border-2 transition-all flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-slate-700/50 hover:bg-slate-700 text-white border-slate-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <i className={`fas fa-chevron-${showAllUsers ? 'up' : 'down'}`}></i>
              {showAllUsers ? 'Show Less' : `Show All Users (${users.length})`}
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Secondary Quick Actions - Compact Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-slate-700' : 'bg-slate-100'
          }`}>
            <i className={`fas fa-ellipsis-h ${isDark ? 'text-slate-400' : 'text-slate-500'}`}></i>
          </div>
          <h3 className={`text-lg font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            More Actions
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/managecases')}
            className={`rounded-2xl p-5 cursor-pointer group transition-all duration-300 ${
              isDark 
                ? 'bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/30' 
                : 'bg-white border border-slate-100 hover:border-blue-200 shadow-md hover:shadow-lg'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isDark 
                  ? 'bg-blue-500/10 group-hover:bg-blue-500/20' 
                  : 'bg-blue-50 group-hover:bg-blue-100'
              }`}>
                <i className={`fas fa-list text-lg ${isDark ? 'text-blue-400' : 'text-blue-600'}`}></i>
              </div>
              <div>
                <h4 className={`font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  View All Cases
                </h4>
                <p className={`text-sm m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Browse case records
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/caselist')}
            className={`rounded-2xl p-5 cursor-pointer group transition-all duration-300 ${
              isDark 
                ? 'bg-slate-800/50 border border-slate-700/50 hover:border-amber-500/30' 
                : 'bg-white border border-slate-100 hover:border-amber-200 shadow-md hover:shadow-lg'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isDark 
                  ? 'bg-amber-500/10 group-hover:bg-amber-500/20' 
                  : 'bg-amber-50 group-hover:bg-amber-100'
              }`}>
                <i className={`fas fa-archive text-lg ${isDark ? 'text-amber-400' : 'text-amber-600'}`}></i>
              </div>
              <div>
                <h4 className={`font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Terminated Cases
                </h4>
                <p className={`text-sm m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  View closed records
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/settings')}
            className={`rounded-2xl p-5 cursor-pointer group transition-all duration-300 ${
              isDark 
                ? 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-500/30' 
                : 'bg-white border border-slate-100 hover:border-slate-200 shadow-md hover:shadow-lg'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isDark 
                  ? 'bg-slate-500/10 group-hover:bg-slate-500/20' 
                  : 'bg-slate-50 group-hover:bg-slate-100'
              }`}>
                <motion.i 
                  animate={{ rotate: [0, 180, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className={`fas fa-cog text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                ></motion.i>
              </div>
              <div>
                <h4 className={`font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Settings
                </h4>
                <p className={`text-sm m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Manage your profile
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Create User Modal - Enhanced HeroUI Style */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`rounded-3xl w-full max-w-md shadow-2xl overflow-hidden ${
                isDark ? 'bg-slate-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with gradient */}
              <div className={`px-6 pt-6 pb-4 ${
                isDark 
                  ? 'bg-gradient-to-br from-slate-700 to-slate-800' 
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    isDark 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  } shadow-lg shadow-blue-500/30`}>
                    <i className="fas fa-user-plus text-2xl text-white"></i>
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      Create New Account
                    </h3>
                    <p className={`text-sm m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Add a new user to the system
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateUser} className="p-6 space-y-5">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <i className="fas fa-user mr-2 opacity-60"></i>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className={`w-full px-4 py-3.5 rounded-xl border-2 outline-none transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20' 
                        : 'bg-slate-50 border-slate-200 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white'
                    }`}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <i className="fas fa-envelope mr-2 opacity-60"></i>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className={`w-full px-4 py-3.5 rounded-xl border-2 outline-none transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20' 
                        : 'bg-slate-50 border-slate-200 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white'
                    }`}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <i className="fas fa-lock mr-2 opacity-60"></i>
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className={`w-full px-4 py-3.5 rounded-xl border-2 outline-none transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20' 
                        : 'bg-slate-50 border-slate-200 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white'
                    }`}
                    placeholder="Enter password (min 6 characters)"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <i className="fas fa-user-tag mr-2 opacity-60"></i>
                    Role
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Clerk', 'Staff', 'Admin'].map((role) => (
                      <motion.button
                        key={role}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setNewUser({ ...newUser, role })}
                        className={`py-3 px-4 rounded-xl font-semibold text-sm border-2 transition-all ${
                          newUser.role === role
                            ? role === 'Admin'
                              ? 'bg-red-500 text-white border-red-500'
                              : role === 'Staff'
                                ? 'bg-teal-500 text-white border-teal-500'
                                : 'bg-blue-500 text-white border-blue-500'
                            : isDark
                              ? 'bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <i className={`fas ${role === 'Admin' ? 'fa-shield-halved' : role === 'Staff' ? 'fa-user-tie' : 'fa-user'} mr-1.5`}></i>
                        {role}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {createStatus.message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`p-4 rounded-xl flex items-center gap-3 ${
                      createStatus.type === 'success' 
                        ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : isDark ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-red-100 text-red-700 border border-red-200'
                    }`}
                  >
                    <i className={`fas ${createStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-lg`}></i>
                    <span className="font-medium">{createStatus.message}</span>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateModal(false)}
                    className={`flex-1 py-3.5 rounded-xl font-semibold border-2 transition-all ${
                      isDark 
                        ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600' 
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isCreating}
                    className="flex-1 py-3.5 rounded-xl font-semibold border-none cursor-pointer
                             bg-gradient-to-r from-blue-500 to-indigo-600 text-white
                             shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40
                             disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isCreating ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.i 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="fas fa-spinner"
                        ></motion.i>
                        Creating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <i className="fas fa-user-plus"></i>
                        Create Account
                      </span>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal - Enhanced HeroUI Style */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center ${
                isDark ? 'bg-slate-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Warning Icon with Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
                  isDark 
                    ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20' 
                    : 'bg-gradient-to-br from-red-100 to-rose-100'
                }`}
              >
                <motion.i
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={`fas fa-exclamation-triangle text-3xl ${
                    isDark ? 'text-red-400' : 'text-red-500'
                  }`}
                ></motion.i>
              </motion.div>
              
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Delete User Account
              </h3>
              <p className={`mb-6 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Are you sure you want to delete{' '}
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {selectedUser?.name}
                </span>'s account? 
                <br />
                <span className="text-sm opacity-70">This action cannot be undone.</span>
              </p>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(false)}
                  className={`flex-1 py-3.5 rounded-xl font-semibold border-2 transition-all ${
                    isDark 
                      ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600' 
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteUser}
                  className="flex-1 py-3.5 rounded-xl font-semibold border-none cursor-pointer
                           bg-gradient-to-r from-red-500 to-rose-600 text-white
                           shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all"
                >
                  <i className="fas fa-trash-alt mr-2"></i>
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
