import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../App';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useContext(ThemeContext) || { isDark: false };
  const [allCases, setAllCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'dismissed', 'convicted'
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    dismissed: 0,
    convicted: 0,
  });

  // Fetch all cases
  useEffect(() => {
    fetchAllCases();
  }, []);

  // Filter cases when search or filter changes
  useEffect(() => {
    filterCases();
  }, [searchQuery, statusFilter, allCases]);

  const fetchAllCases = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/cases');
      if (response.ok) {
        const cases = await response.json();
        setAllCases(cases);

        // Calculate stats
        const pending = cases.filter((c) => {
          const decision = (c.REMARKS_DECISION || c.remarks_decision || '').toLowerCase();
          return decision === 'pending';
        }).length;
        const dismissed = cases.filter((c) => {
          const decision = (c.REMARKS_DECISION || c.remarks_decision || '').toLowerCase();
          return decision === 'dismissed';
        }).length;
        const convicted = cases.filter((c) => {
          const decision = (c.REMARKS_DECISION || c.remarks_decision || '').toLowerCase();
          return decision === 'convicted';
        }).length;
        setStats({
          total: cases.length,
          pending,
          dismissed,
          convicted,
        });
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCases = () => {
    let result = [...allCases];

    // Apply status filter
    if (statusFilter === 'pending') {
      result = result.filter((c) => {
        const decision = (c.REMARKS_DECISION || c.remarks_decision || '').toLowerCase();
        return decision === 'pending';
      });
    } else if (statusFilter === 'dismissed') {
      result = result.filter((c) => {
        const decision = (c.REMARKS_DECISION || c.remarks_decision || '').toLowerCase();
        return decision === 'dismissed';
      });
    } else if (statusFilter === 'convicted') {
      result = result.filter((c) => {
        const decision = (c.REMARKS_DECISION || c.remarks_decision || '').toLowerCase();
        return decision === 'convicted';
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          (c.DOCKET_NO || c.docket_no || '').toLowerCase().includes(query) ||
          (c.IS_CASE_NO || c.is_case_no || '').toLowerCase().includes(query) ||
          (c.CRIM_CASE_NO || c.crim_case_no || '').toLowerCase().includes(query) ||
          (c.COMPLAINANT || c.complainant || '').toLowerCase().includes(query) ||
          (c.RESPONDENT || c.respondent || '').toLowerCase().includes(query) ||
          (c.TITLE || c.title || '').toLowerCase().includes(query)
      );
    }

    setFilteredCases(result);
  };

  const getStatusBadge = (caseItem) => {
    const decision = (caseItem.REMARKS_DECISION || caseItem.remarks_decision || '').toLowerCase();
    if (decision === 'pending') {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isDark 
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
            : 'bg-amber-100 text-amber-700'
        }`}>
          <i className="fas fa-clock mr-1"></i>
          Pending
        </span>
      );
    } else if (decision === 'dismissed') {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isDark 
            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          <i className="fas fa-times-circle mr-1"></i>
          Dismissed
        </span>
      );
    } else if (decision === 'convicted') {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isDark 
            ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
            : 'bg-green-100 text-green-700'
        }`}>
          <i className="fas fa-gavel mr-1"></i>
          Convicted
        </span>
      );
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
        isDark 
          ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30' 
          : 'bg-slate-100 text-slate-700'
      }`}>
        <i className="fas fa-question-circle mr-1"></i>
        N/A
      </span>
    );
  };

  const roleConfig = {
    Staff: {
      bg: 'bg-teal-500',
      gradient: 'from-teal-500 to-teal-600',
      light: 'bg-teal-100',
      text: 'text-teal-600',
      icon: 'fa-user-tie',
      access: 'View All Cases',
    },
  };

  const currentRole = roleConfig.Staff;

  return (
    <div className={`${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'} min-h-screen transition-colors duration-300`}>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-3xl mb-8 shadow-2xl relative overflow-hidden p-8 ${
          isDark
            ? 'bg-gradient-to-br from-teal-900/40 via-slate-800 to-slate-900 border border-teal-500/20'
            : `bg-gradient-to-r ${currentRole.gradient}`
        }`}
      >
        <div className={`absolute top-0 right-0 w-64 h-64 ${isDark ? 'bg-teal-500/5' : 'bg-white/10'} rounded-full -mr-32 -mt-32`}></div>
        <div className={`absolute bottom-0 left-0 w-48 h-48 ${isDark ? 'bg-teal-500/5' : 'bg-white/5'} rounded-full -ml-24 -mb-24`}></div>
        {isDark && (
          <>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              className="absolute -bottom-32 -left-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"
            />
          </>
        )}

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className={`w-20 h-20 rounded-2xl ${
                isDark ? 'bg-teal-500/20 border border-teal-500/40' : 'bg-white/20'
              } backdrop-blur-sm flex items-center justify-center shadow-lg overflow-hidden`}
            >
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={user?.name || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <i className={`fas ${currentRole.icon} ${isDark ? 'text-teal-300' : 'text-white'} text-2xl`}></i>
              )}
            </motion.div>
            <div>
              <p className={`${isDark ? 'text-teal-200/60' : 'text-white/80'} text-sm m-0`}>Welcome back,</p>
              <h2 className={`text-3xl font-bold m-0 tracking-tight ${isDark ? 'text-teal-100' : 'text-white'}`}>{user?.name || 'Staff'}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isDark 
                    ? 'bg-teal-500/30 text-teal-200 border border-teal-500/50' 
                    : 'bg-white/20 text-white border border-white/30'
                }`}>
                  <i className="fas fa-user-tie mr-1.5"></i>
                  Staff
                </span>
                <span className={`${isDark ? 'text-teal-200/70' : 'text-white/70'} text-xs font-medium`}>• {currentRole.access}</span>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAllCases}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
                        transition-all border-none cursor-pointer shadow-lg ${
                          isDark
                            ? 'bg-teal-500 text-slate-900 hover:bg-teal-400'
                            : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                        }`}
          >
            <i className="fas fa-sync-alt"></i>
            Refresh Cases
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl p-6 shadow-lg border`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm font-medium`}>
                Total Cases
              </p>
              <h3
                className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} mt-1`}
              >
                {stats.total}
              </h3>
            </div>
            <div
              className={`w-14 h-14 rounded-2xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}
            >
              <i
                className={`fas fa-folder-open ${isDark ? 'text-blue-400' : 'text-blue-600'} text-xl`}
              ></i>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl p-6 shadow-lg border`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm font-medium`}>
                Pending Cases
              </p>
              <h3
                className={`text-3xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'} mt-1`}
              >
                {stats.pending}
              </h3>
            </div>
            <div
              className={`w-14 h-14 rounded-2xl ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'} flex items-center justify-center`}
            >
              <i
                className={`fas fa-clock ${isDark ? 'text-amber-400' : 'text-amber-600'} text-xl`}
              ></i>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl p-6 shadow-lg border`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm font-medium`}>
                Dismissed Cases
              </p>
              <h3
                className={`text-3xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'} mt-1`}
              >
                {stats.dismissed}
              </h3>
            </div>
            <div
              className={`w-14 h-14 rounded-2xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}
            >
              <i
                className={`fas fa-times-circle ${isDark ? 'text-blue-400' : 'text-blue-600'} text-xl`}
              ></i>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl p-6 shadow-lg border`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm font-medium`}>
                Convicted Cases
              </p>
              <h3
                className={`text-3xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'} mt-1`}
              >
                {stats.convicted}
              </h3>
            </div>
            <div
              className={`w-14 h-14 rounded-2xl ${isDark ? 'bg-green-500/20' : 'bg-green-100'} flex items-center justify-center`}
            >
              <i
                className={`fas fa-gavel ${isDark ? 'text-green-400' : 'text-green-600'} text-xl`}
              ></i>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl p-6 shadow-lg border mb-6`}
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <i
              className={`fas fa-search absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
            ></i>
            <input
              type="text"
              placeholder="Search by Docket No, IS Case No, Complainant, Respondent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 
                                     ${
                                       isDark
                                         ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400 focus:border-teal-500'
                                         : 'bg-white border-slate-200 text-slate-700 focus:border-teal-500'
                                     } 
                                     focus:ring-4 focus:ring-teal-500/20 
                                     transition-all outline-none`}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all border-none cursor-pointer
                                      ${
                                        statusFilter === 'all'
                                          ? isDark ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'bg-teal-500 text-white shadow-lg'
                                          : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
            >
              <i className="fas fa-list mr-2"></i>
              All Cases
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all border-none cursor-pointer
                                      ${
                                        statusFilter === 'pending'
                                          ? isDark ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-amber-500 text-white shadow-lg'
                                          : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
            >
              <i className="fas fa-clock mr-2"></i>
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('dismissed')}
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all border-none cursor-pointer
                                      ${
                                        statusFilter === 'dismissed'
                                          ? isDark ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-blue-500 text-white shadow-lg'
                                          : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
            >
              <i className="fas fa-times-circle mr-2"></i>
              Dismissed
            </button>
            <button
              onClick={() => setStatusFilter('convicted')}
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all border-none cursor-pointer
                                      ${
                                        statusFilter === 'convicted'
                                          ? isDark ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-green-500 text-white shadow-lg'
                                          : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
            >
              <i className="fas fa-gavel mr-2"></i>
              Convicted
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div
          className={`mt-4 flex items-center justify-between text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
        >
          <span>
            Showing{' '}
            <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>
              {filteredCases.length}
            </strong>{' '}
            of{' '}
            <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>
              {allCases.length}
            </strong>{' '}
            cases
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`${isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'} font-medium border-none bg-transparent cursor-pointer`}
            >
              <i className="fas fa-times mr-1"></i>
              Clear search
            </button>
          )}
        </div>
      </motion.div>

      {/* Cases Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl shadow-lg border overflow-hidden`}
      >
        <div className={`p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <h3
            className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} flex items-center gap-2`}
          >
            <i className="fas fa-folder-open text-teal-500"></i>
            Case Records
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <i className="fas fa-spinner fa-spin text-4xl text-teal-500 mb-4"></i>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Loading cases...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-12 text-center">
            <i
              className={`fas fa-folder-open text-4xl ${isDark ? 'text-slate-600' : 'text-slate-300'} mb-4`}
            ></i>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              No cases found matching your criteria
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                <tr>
                  <th
                    className={`text-left py-4 px-6 text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}
                  >
                    Docket / IS Case No
                  </th>
                  <th
                    className={`text-left py-4 px-6 text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}
                  >
                    Complainant
                  </th>
                  <th
                    className={`text-left py-4 px-6 text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}
                  >
                    Respondent
                  </th>
                  <th
                    className={`text-left py-4 px-6 text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}
                  >
                    Remarks
                  </th>
                  <th
                    className={`text-left py-4 px-6 text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
                <AnimatePresence>
                  {filteredCases.map((caseItem, index) => (
                    <motion.tr
                      key={caseItem.DOCKET_NO || caseItem.docket_no || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.02 }}
                      className={`${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'} transition-colors`}
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p
                            className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
                          >
                            {caseItem.DOCKET_NO || caseItem.docket_no || 'N/A'}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            IS: {caseItem.IS_CASE_NO || caseItem.is_case_no || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className={`py-4 px-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {caseItem.COMPLAINANT || caseItem.complainant || 'N/A'}
                      </td>
                      <td className={`py-4 px-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {caseItem.RESPONDENT || caseItem.respondent || 'N/A'}
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(caseItem)}</td>
                      <td className="py-4 px-6">
                        <Link
                          to={`/details/${caseItem.DOCKET_NO || caseItem.docket_no}`}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg
                                                             ${
                                                               isDark
                                                                 ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30'
                                                                 : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                                                             } text-sm font-semibold
                                                             transition-colors no-underline`}
                        >
                          <i className="fas fa-eye"></i>
                          View
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StaffDashboard;
