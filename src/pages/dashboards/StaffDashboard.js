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
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'terminated'
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        terminated: 0
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
                const pending = cases.filter(c => {
                    const decision = (c.REMARKS_DECISION || c.remarks_decision || '').toLowerCase();
                    return decision === 'pending';
                }).length;
                
                const terminated = cases.filter(c => {
                    const decision = (c.REMARKS_DECISION || c.remarks_decision || '').toLowerCase();
                    return decision === 'terminated';
                }).length;

                setStats({
                    total: cases.length,
                    pending: pending,
                    terminated: terminated
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
            result = result.filter(c => {
                const decision = (c.REMARKS_DECISION || c.remarks_decision || '').toLowerCase();
                return decision === 'pending';
            });
        } else if (statusFilter === 'terminated') {
            result = result.filter(c => {
                const decision = (c.REMARKS_DECISION || c.remarks_decision || '').toLowerCase();
                return decision === 'terminated';
            });
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(c => 
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
        
        if (decision === 'terminated') {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    <i className="fas fa-check-circle mr-1"></i>
                    Terminated
                </span>
            );
        } else if (decision === 'pending') {
            return (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    <i className="fas fa-clock mr-1"></i>
                    Pending
                </span>
            );
        }
        return (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
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
            access: 'View All Cases'
        }
    };

    const currentRole = roleConfig.Staff;

    return (
        <div>
            {/* Welcome Banner */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-r ${currentRole.gradient} rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden`}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
                
                <div className="relative flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm 
                                        flex items-center justify-center shadow-inner">
                            <i className={`fas ${currentRole.icon} text-white text-2xl`}></i>
                        </div>
                        <div>
                            <p className="text-white/80 text-sm m-0">Welcome back,</p>
                            <h2 className="text-2xl font-bold text-white m-0">{user?.name || 'Staff'}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
                                    Staff
                                </span>
                                <span className="text-white/70 text-xs">• {currentRole.access}</span>
                            </div>
                        </div>
                    </div>
                    
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={fetchAllCases}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                                   bg-white/20 text-white font-semibold text-sm
                                   hover:bg-white/30 transition-colors border-none cursor-pointer"
                    >
                        <i className="fas fa-sync-alt"></i>
                        Refresh
                    </motion.button>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-2xl p-6 shadow-lg border`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm font-medium`}>Total Cases</p>
                            <h3 className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} mt-1`}>{stats.total}</h3>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}>
                            <i className={`fas fa-folder-open ${isDark ? 'text-blue-400' : 'text-blue-600'} text-xl`}></i>
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
                            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm font-medium`}>Pending Cases</p>
                            <h3 className={`text-3xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'} mt-1`}>{stats.pending}</h3>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'} flex items-center justify-center`}>
                            <i className={`fas fa-clock ${isDark ? 'text-amber-400' : 'text-amber-600'} text-xl`}></i>
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
                            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm font-medium`}>Terminated Cases</p>
                            <h3 className={`text-3xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'} mt-1`}>{stats.terminated}</h3>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl ${isDark ? 'bg-red-500/20' : 'bg-red-100'} flex items-center justify-center`}>
                            <i className={`fas fa-check-double ${isDark ? 'text-red-400' : 'text-red-600'} text-xl`}></i>
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
                        <i className={`fas fa-search absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>
                        <input
                            type="text"
                            placeholder="Search by Docket No, IS Case No, Complainant, Respondent..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 
                                     ${isDark 
                                        ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400 focus:border-teal-500' 
                                        : 'bg-white border-slate-200 text-slate-700 focus:border-teal-500'
                                     } 
                                     focus:ring-4 focus:ring-teal-500/20 
                                     transition-all outline-none`}
                        />
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all border-none cursor-pointer
                                      ${statusFilter === 'all' 
                                        ? 'bg-teal-500 text-white shadow-lg' 
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            <i className="fas fa-list mr-2"></i>
                            All Cases
                        </button>
                        <button
                            onClick={() => setStatusFilter('pending')}
                            className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all border-none cursor-pointer
                                      ${statusFilter === 'pending' 
                                        ? 'bg-amber-500 text-white shadow-lg' 
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            <i className="fas fa-clock mr-2"></i>
                            Pending
                        </button>
                        <button
                            onClick={() => setStatusFilter('terminated')}
                            className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all border-none cursor-pointer
                                      ${statusFilter === 'terminated' 
                                        ? 'bg-red-500 text-white shadow-lg' 
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            <i className="fas fa-check-double mr-2"></i>
                            Terminated
                        </button>
                    </div>
                </div>

                {/* Results Count */}
                <div className={`mt-4 flex items-center justify-between text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>
                        Showing <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{filteredCases.length}</strong> of{' '}
                        <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{allCases.length}</strong> cases
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
                    <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} flex items-center gap-2`}>
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
                        <i className={`fas fa-folder-open text-4xl ${isDark ? 'text-slate-600' : 'text-slate-300'} mb-4`}></i>
                        <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>No cases found matching your criteria</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                                <tr>
                                    <th className={`text-left py-4 px-6 text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                                        Docket / IS Case No
                                    </th>
                                    <th className={`text-left py-4 px-6 text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                                        Complainant
                                    </th>
                                    <th className={`text-left py-4 px-6 text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                                        Respondent
                                    </th>
                                    <th className={`text-left py-4 px-6 text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                                        Remarks
                                    </th>
                                    <th className={`text-left py-4 px-6 text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
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
                                                    <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
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
                                            <td className="py-4 px-6">
                                                {getStatusBadge(caseItem)}
                                            </td>
                                            <td className="py-4 px-6">
                                                <Link
                                                    to={`/details/${caseItem.DOCKET_NO || caseItem.docket_no}`}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg
                                                             ${isDark 
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
