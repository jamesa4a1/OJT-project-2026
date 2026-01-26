import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../App';
import * as XLSX from 'xlsx';

// Progress Ring Component
const ProgressRing = ({ progress, size = 80, strokeWidth = 8, color = 'blue', isDark }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const colorMap = {
    blue: isDark ? '#38BDF8' : '#0EA5E9',
    emerald: isDark ? '#2DD4BF' : '#10B981',
    amber: isDark ? '#FCD34D' : '#F59E0B',
    violet: isDark ? '#C4B5FD' : '#8B5CF6',
  };

  const bgColor = isDark ? '#475569' : '#E2E8F0';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colorMap[color]}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
    </svg>
  );
};

// Trend Indicator Component
const TrendIndicator = ({ value, isPositive = true, isDark }) => {
  if (value === 0) return null;
  return (
    <div className={`flex items-center gap-1 text-xs font-medium ${
      isPositive 
        ? isDark ? 'text-emerald-400' : 'text-emerald-600'
        : isDark ? 'text-red-400' : 'text-red-600'
    }`}>
      <i className={`fas fa-arrow-${isPositive ? 'up' : 'down'} text-[10px]`}></i>
      <span>{Math.abs(value)}%</span>
    </div>
  );
};

const ClerkDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark } = useContext(ThemeContext) || { isDark: false };
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    thisMonth: 0,
  });
  const [recentCases, setRecentCases] = useState([]);

  // Fetch stats and recent cases
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/cases');
      if (response.ok) {
        const cases = await response.json();

        // Map uppercase DB fields to lowercase
        const mappedCases = cases.map((c) => ({
          ...c,
          status: c.REMARKS_DECISION || c.REMARKS || 'Pending',
          docket_no: c.DOCKET_NO || c.docket_no,
          complainant: c.COMPLAINANT || c.complainant,
          respondent: c.RESPONDENT || c.respondent,
          date_filed: c.DATE_FILED || c.date_filed,
        }));

        // Calculate stats
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const resolved = mappedCases.filter(
          (c) =>
            c.status?.toLowerCase() === 'resolved' ||
            c.status?.toLowerCase() === 'closed' ||
            c.status?.toLowerCase() === 'terminated' ||
            c.status?.toLowerCase() === 'guilty' ||
            c.status?.toLowerCase() === 'acquitted'
        ).length;
        const pending = mappedCases.filter(
          (c) =>
            c.status?.toLowerCase() === 'pending' ||
            c.status?.toLowerCase() === 'open' ||
            c.status?.toLowerCase() === 'ongoing'
        ).length;
        const monthCases = mappedCases.filter((c) => {
          const caseDate = new Date(c.date_filed);
          return caseDate.getMonth() === thisMonth && caseDate.getFullYear() === thisYear;
        }).length;

        setStats({
          total: mappedCases.length,
          resolved: resolved,
          pending: pending,
          thisMonth: monthCases,
        });

        // Get recent cases (last 5)
        setRecentCases(mappedCases.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      console.log('📥 Starting Excel export...');
      const response = await fetch('http://localhost:5000/cases');
      if (response.ok) {
        const cases = await response.json();
        console.log(`✅ Fetched ${cases.length} cases for export`);

        // Prepare headers
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

        // Prepare data rows
        const data = cases.map((c) => [
          c.DOCKET_NO || '',
          c.DATE_FILED || '',
          c.COMPLAINANT || '',
          c.RESPONDENT || '',
          c.ADDRESS_OF_RESPONDENT || '',
          c.OFFENSE || '',
          c.DATE_OF_COMMISSION || '',
          c.DATE_RESOLVED || '',
          c.RESOLVING_PROSECUTOR || '',
          c.CRIM_CASE_NO || '',
          c.BRANCH || '',
          c.DATEFILED_IN_COURT || '',
          c.REMARKS_DECISION || '',
          c.PENALTY || '',
          c.INDEX_CARDS || '',
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
      }
    } catch (error) {
      console.error('❌ Error exporting Excel:', error);
      alert('Error exporting Excel: ' + error.message);
    }
  };

  const roleConfig = {
    Admin: {
      bg: 'bg-red-500',
      gradient: 'from-red-500 to-red-600',
      light: 'bg-red-100',
      text: 'text-red-600',
      icon: 'fa-shield-halved',
      access: 'Full System Access',
    },
    Clerk: {
      bg: 'bg-amber-500',
      gradient: 'from-amber-500 to-amber-600',
      light: 'bg-amber-100',
      text: 'text-amber-600',
      icon: 'fa-pen-to-square',
      access: 'Create, View & Edit Access',
    },
  };

  const currentRole = roleConfig[user?.role] || roleConfig.Clerk;

  return (
    <div className={`space-y-6 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'} min-h-screen transition-colors duration-300 p-6`}>
      {/* Clerk Welcome Banner - Matching Admin Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative rounded-2xl p-6 shadow-2xl overflow-hidden ${
          isDark
            ? 'bg-gradient-to-br from-amber-900/40 via-slate-800 to-slate-900 border border-amber-500/20'
            : 'bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600'
        }`}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
            className={`absolute -top-24 -right-24 w-96 h-96 ${isDark ? 'bg-amber-500/5' : 'bg-white/10'} rounded-full blur-3xl`}
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className={`absolute -bottom-32 -left-32 w-80 h-80 ${isDark ? 'bg-yellow-500/5' : 'bg-yellow-400/20'} rounded-full blur-3xl`}
          />
          {isDark && (
            <>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"
              />
            </>
          )}
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
              <div className={`w-20 h-20 rounded-2xl backdrop-blur-xl flex items-center justify-center shadow-xl border-2 overflow-hidden ${
                isDark 
                  ? 'bg-amber-500/20 border-amber-500/40' 
                  : 'bg-white/20 border-white/40'
              }`}>
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
                    className={`fas fa-pen-to-square text-3xl ${isDark ? 'text-amber-300' : 'text-white'}`}
                  ></motion.i>
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-lg ${
                isDark 
                  ? 'bg-emerald-500 border-slate-800' 
                  : 'bg-emerald-500 border-white'
              }`}>
                <i className="fas fa-check text-white text-xs"></i>
              </div>
            </motion.div>
            
            <div>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className={`text-sm font-medium m-0 ${isDark ? 'text-amber-200/60' : 'text-white/70'}`}
              >
                Welcome back,
              </motion.p>
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`text-3xl font-bold m-0 tracking-tight ${isDark ? 'text-amber-100' : 'text-white'}`}
              >
                {user?.name || 'Clerk'}
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
                  <i className="fas fa-pen-to-square mr-1.5"></i>
                  Clerk
                </span>
                <span className="text-white/60 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  Create, View & Edit Access
                </span>
              </motion.div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date/Time Widget */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="hidden md:flex flex-col items-end px-5 py-3 rounded-2xl">
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
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm
                       transition-all duration-300 border-none cursor-pointer shadow-xl ${
                         isDark
                           ? 'bg-amber-500 text-slate-900 hover:bg-amber-400 shadow-amber-500/30'
                           : 'bg-white text-orange-600 hover:bg-orange-50 shadow-orange-900/30'
                       }`}
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
          className={`relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t ${
            isDark ? 'border-amber-500/20' : 'border-white/10'
          }`}
        >
          {[
            { label: 'Total Cases', value: stats.total, icon: 'fa-folder-open' },
            { label: 'Pending Review', value: stats.pending, icon: 'fa-hourglass-half' },
            { label: 'This Month', value: stats.thisMonth, icon: 'fa-calendar-days' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center ${
                isDark 
                  ? 'bg-amber-500/20 text-amber-300' 
                  : 'bg-white/10 text-white/80'
              }`}>
                <i className={`fas ${item.icon}`}></i>
              </div>
              <div>
                <p className={`text-2xl font-bold m-0 ${isDark ? 'text-amber-100' : 'text-white'}`}>{item.value}</p>
                <p className={`text-xs m-0 ${isDark ? 'text-amber-200/60' : 'text-white/60'}`}>{item.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Statistics Cards with Progress Rings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-lg ${
              isDark
                ? 'from-amber-400 to-orange-500 text-white'
                : 'from-blue-400 to-indigo-500 text-white'
            }`}>
              <i className="fas fa-chart-line text-sm"></i>
            </div>
            <h3 className={`text-xl font-bold m-0 ${isDark ? 'text-amber-100' : 'text-slate-800'}`}>Case Statistics</h3>
          </div>
          <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Real-time overview</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Total Cases */}
          <motion.div
            whileHover={{ y: -4 }}
            className={`relative rounded-2xl p-6 shadow-lg border overflow-hidden group ${
              isDark
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-100'
            }`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500 ${
              isDark
                ? 'bg-gradient-to-br from-blue-400/5 to-blue-500/5'
                : 'bg-gradient-to-br from-blue-400/10 to-blue-500/10'
            }`} />
            <div className="relative flex items-center justify-between">
              <div className="flex flex-col">
                <div className="mb-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
                    isDark 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    <i className="fas fa-folder text-2xl"></i>
                  </div>
                </div>
                <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{stats.total}</p>
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Cases</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <ProgressRing progress={100} size={70} strokeWidth={6} color="blue" isDark={isDark} />
              </div>
            </div>
          </motion.div>

          {/* Pending Cases */}
          <motion.div
            whileHover={{ y: -4 }}
            className={`relative rounded-2xl p-6 shadow-lg border overflow-hidden group ${
              isDark
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-100'
            }`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500 ${
              isDark
                ? 'bg-gradient-to-br from-amber-400/5 to-amber-500/5'
                : 'bg-gradient-to-br from-amber-400/10 to-amber-500/10'
            }`} />
            <div className="relative flex items-center justify-between">
              <div className="flex flex-col">
                <div className="mb-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
                    isDark 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'bg-amber-100 text-amber-600'
                  }`}>
                    <i className="fas fa-hourglass-half text-2xl"></i>
                  </div>
                </div>
                <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{stats.pending}</p>
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pending</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <ProgressRing
                  progress={stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}
                  size={70}
                  strokeWidth={6}
                  color="amber"
                  isDark={isDark}
                />
              </div>
            </div>
          </motion.div>

          {/* This Month */}
          <motion.div
            whileHover={{ y: -4 }}
            className={`relative rounded-2xl p-6 shadow-lg border overflow-hidden group ${
              isDark
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-100'
            }`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500 ${
              isDark
                ? 'bg-gradient-to-br from-violet-400/5 to-violet-500/5'
                : 'bg-gradient-to-br from-violet-400/10 to-violet-500/10'
            }`} />
            <div className="relative flex items-center justify-between">
              <div className="flex flex-col">
                <div className="mb-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
                    isDark 
                      ? 'bg-violet-500/20 text-violet-400' 
                      : 'bg-violet-100 text-violet-600'
                  }`}>
                    <i className="fas fa-calendar-days text-2xl"></i>
                  </div>
                </div>
                <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{stats.thisMonth}</p>
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>This Month</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <ProgressRing
                  progress={stats.total > 0 ? (stats.thisMonth / stats.total) * 100 : 0}
                  size={70}
                  strokeWidth={6}
                  color="violet"
                  isDark={isDark}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom Section - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Recent Cases - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`lg:col-span-2 rounded-2xl p-6 shadow-lg border ${
            isDark
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg ${
                isDark
                  ? 'from-amber-400 to-orange-500 text-white'
                  : 'from-amber-400 to-orange-500 text-white'
              }`}>
                <i className="fas fa-briefcase text-lg"></i>
              </div>
              <div>
                <h3 className={`text-lg font-bold m-0 ${isDark ? 'text-amber-100' : 'text-slate-800'}`}>Recent Cases</h3>
                <p className={`text-xs m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {recentCases.length} {recentCases.length === 1 ? 'case' : 'cases'}
                </p>
              </div>
            </div>
            <Link
              to="/caselist"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm no-underline border transition-all group ${
                isDark
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 hover:text-amber-300 border-amber-500/30 hover:border-amber-500/50'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-700 border-amber-200 hover:border-amber-300'
              }`}
            >
              View All
              <motion.i
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="fas fa-arrow-right text-xs"
              ></motion.i>
            </Link>
          </div>

          {recentCases.length > 0 ? (
            <div className="space-y-3">
              {recentCases.map((caseItem, index) => {
                const isResolved =
                  caseItem.status?.toLowerCase() === 'resolved' ||
                  caseItem.status?.toLowerCase() === 'closed' ||
                  caseItem.status?.toLowerCase() === 'terminated' ||
                  caseItem.status?.toLowerCase() === 'guilty' ||
                  caseItem.status?.toLowerCase() === 'acquitted';

                return (
                  <motion.div
                    key={caseItem.docket_no || caseItem.DOCKET_NO || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    onClick={() => navigate(`/details/${caseItem.docket_no || caseItem.DOCKET_NO}`)}
                    className="group flex items-center gap-4 p-4 rounded-xl 
                             bg-gradient-to-r from-slate-50 to-transparent hover:from-blue-50 hover:to-blue-50/30
                             cursor-pointer transition-all border border-slate-200 hover:border-blue-300 hover:shadow-md"
                  >
                    <div
                      className={`w-1.5 h-16 rounded-full flex-shrink-0 ${
                        isResolved
                          ? 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-600'
                          : 'bg-gradient-to-b from-amber-400 via-amber-500 to-orange-600'
                      }`}
                    ></div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="font-bold text-slate-800 m-0 text-base">
                          {caseItem.docket_no || caseItem.DOCKET_NO || 'N/A'}
                        </p>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm ${
                            isResolved
                              ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white'
                              : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                          }`}
                        >
                          {caseItem.status || 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-1 flex items-center gap-2">
                        <i className="fas fa-user text-xs text-slate-400"></i>
                        <span className="truncate">{caseItem.respondent || caseItem.RESPONDENT || 'N/A'}</span>
                      </p>
                      <p className="text-xs text-slate-500 m-0 flex items-center gap-2">
                        <i className="fas fa-calendar text-xs text-slate-400"></i>
                        {caseItem.date_filed
                          ? new Date(caseItem.date_filed).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'No date'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <i className="fas fa-arrow-right text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all text-sm"></i>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 
                         flex items-center justify-center mx-auto mb-4 shadow-inner"
              >
                <i className="fas fa-inbox text-slate-400 text-3xl"></i>
              </motion.div>
              <p className="text-slate-600 font-semibold text-lg mb-2">No recent cases found</p>
              <p className="text-sm text-slate-400">Cases will appear here once added</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ClerkDashboard;
