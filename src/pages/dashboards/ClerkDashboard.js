import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const ClerkDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({
        total: 0,
        resolved: 0,
        pending: 0,
        thisMonth: 0
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
                const mappedCases = cases.map(c => ({
                    ...c,
                    status: c.REMARKS_DECISION || c.REMARKS || 'Pending',
                    docket_no: c.DOCKET_NO || c.docket_no,
                    complainant: c.COMPLAINANT || c.complainant,
                    respondent: c.RESPONDENT || c.respondent,
                    date_filed: c.DATE_FILED || c.date_filed
                }));
                
                // Calculate stats
                const now = new Date();
                const thisMonth = now.getMonth();
                const thisYear = now.getFullYear();
                
                const resolved = mappedCases.filter(c => 
                    c.status?.toLowerCase() === 'resolved' || 
                    c.status?.toLowerCase() === 'closed' ||
                    c.status?.toLowerCase() === 'terminated' ||
                    c.status?.toLowerCase() === 'guilty' ||
                    c.status?.toLowerCase() === 'acquitted'
                ).length;
                const pending = mappedCases.filter(c => 
                    c.status?.toLowerCase() === 'pending' || 
                    c.status?.toLowerCase() === 'open' ||
                    c.status?.toLowerCase() === 'ongoing'
                ).length;
                const monthCases = mappedCases.filter(c => {
                    const caseDate = new Date(c.date_filed);
                    return caseDate.getMonth() === thisMonth && caseDate.getFullYear() === thisYear;
                }).length;

                setStats({
                    total: mappedCases.length,
                    resolved: resolved,
                    pending: pending,
                    thisMonth: monthCases
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
            const response = await fetch('http://localhost:5000/cases');
            if (response.ok) {
                const cases = await response.json();
                
                // Create CSV content
                const headers = ['Docket No', 'Title', 'Status', 'Date Filed', 'Complainant', 'Respondent'];
                const csvContent = [
                    headers.join(','),
                    ...cases.map(c => [
                        c.docket_no || '',
                        `"${(c.title || '').replace(/"/g, '""')}"`,
                        c.status || '',
                        c.date_filed || '',
                        `"${(c.complainant || '').replace(/"/g, '""')}"`,
                        `"${(c.respondent || '').replace(/"/g, '""')}"`
                    ].join(','))
                ].join('\n');

                // Download file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `cases_export_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
            }
        } catch (error) {
            console.error('Error exporting CSV:', error);
        }
    };

    const roleConfig = {
        Admin: { 
            bg: 'bg-red-500', 
            gradient: 'from-red-500 to-red-600',
            light: 'bg-red-100',
            text: 'text-red-600',
            icon: 'fa-shield-halved',
            access: 'Full System Access'
        },
        Clerk: { 
            bg: 'bg-amber-500', 
            gradient: 'from-amber-500 to-amber-600',
            light: 'bg-amber-100',
            text: 'text-amber-600',
            icon: 'fa-pen-to-square',
            access: 'Create, View & Edit Access'
        }
    };

    const currentRole = roleConfig[user?.role] || roleConfig.Clerk;

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
                            <h2 className="text-2xl font-bold text-white m-0">{user?.name || 'User'}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
                                    {user?.role}
                                </span>
                                <span className="text-white/70 text-xs">• {currentRole.access}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                                       bg-emerald-500 text-white font-semibold text-sm
                                       hover:bg-emerald-600 transition-colors border-none cursor-pointer shadow-lg"
                        >
                            <i className="fas fa-download"></i>
                            Export CSV
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
            >
                <div className="flex items-center gap-2 mb-4">
                    <i className="fas fa-bolt text-amber-500"></i>
                    <h3 className="text-lg font-bold text-slate-700 m-0">Quick Actions</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/newcase')}
                        className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 
                                   cursor-pointer group hover:shadow-xl transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center
                                                group-hover:bg-amber-500 transition-colors">
                                    <i className="fas fa-plus-circle text-amber-600 text-xl 
                                                  group-hover:text-white transition-colors"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 m-0">Add New Case</h4>
                                    <p className="text-sm text-slate-500 m-0">Register a new case entry</p>
                                </div>
                            </div>
                            <i className="fas fa-arrow-right text-slate-300 group-hover:text-amber-500 
                                          group-hover:translate-x-1 transition-all"></i>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/managecases')}
                        className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 
                                   cursor-pointer group hover:shadow-xl transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center
                                                group-hover:bg-blue-500 transition-colors">
                                    <i className="fas fa-tasks text-blue-600 text-xl 
                                                  group-hover:text-white transition-colors"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 m-0">Manage Cases</h4>
                                    <p className="text-sm text-slate-500 m-0">View and edit case details</p>
                                </div>
                            </div>
                            <i className="fas fa-arrow-right text-slate-300 group-hover:text-blue-500 
                                          group-hover:translate-x-1 transition-all"></i>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Statistics Cards */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <i className="fas fa-folder text-blue-600"></i>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 m-0">{stats.total}</p>
                            <p className="text-xs text-slate-500 m-0">Total</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <i className="fas fa-check-circle text-emerald-600"></i>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 m-0">{stats.resolved}</p>
                            <p className="text-xs text-slate-500 m-0">Resolved</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <i className="fas fa-clock text-amber-600"></i>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 m-0">{stats.pending}</p>
                            <p className="text-xs text-slate-500 m-0">Pending</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                            <i className="fas fa-calendar text-violet-600"></i>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-800 m-0">{stats.thisMonth}</p>
                            <p className="text-xs text-slate-500 m-0">This Month</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* More Actions */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
                >
                    <h3 className="text-lg font-bold text-slate-700 mb-4">More Actions</h3>
                    <div className="space-y-3">
                        <motion.button
                            whileHover={{ x: 4 }}
                            onClick={() => navigate('/caselist')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                                       bg-slate-50 hover:bg-slate-100 transition-colors
                                       border-none cursor-pointer text-left"
                        >
                            <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                                <i className="fas fa-list text-violet-600"></i>
                            </div>
                            <span className="font-medium text-slate-700">View All Cases</span>
                            <i className="fas fa-chevron-right text-slate-400 ml-auto"></i>
                        </motion.button>

                        <motion.button
                            whileHover={{ x: 4 }}
                            onClick={() => navigate('/findcase')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                                       bg-slate-50 hover:bg-slate-100 transition-colors
                                       border-none cursor-pointer text-left"
                        >
                            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                                <i className="fas fa-search text-blue-600"></i>
                            </div>
                            <span className="font-medium text-slate-700">Search Cases</span>
                            <i className="fas fa-chevron-right text-slate-400 ml-auto"></i>
                        </motion.button>

                        {user?.role === 'Admin' && (
                            <motion.button
                                whileHover={{ x: 4 }}
                                onClick={() => navigate('/managecases')}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                                           bg-red-50 hover:bg-red-100 transition-colors
                                           border-none cursor-pointer text-left"
                            >
                                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                                    <i className="fas fa-trash text-red-600"></i>
                                </div>
                                <span className="font-medium text-red-700">Delete Cases</span>
                                <i className="fas fa-chevron-right text-red-400 ml-auto"></i>
                            </motion.button>
                        )}
                    </div>
                </motion.div>

                {/* Recent Cases */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                <i className="fas fa-briefcase text-amber-600 text-lg"></i>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 m-0">Recent Cases</h3>
                                <p className="text-xs text-slate-500 m-0">{recentCases.length} {recentCases.length === 1 ? 'case' : 'cases'}</p>
                            </div>
                        </div>
                        <Link 
                            to="/caselist" 
                            className="text-sm font-semibold text-amber-600 hover:text-amber-700 
                                       flex items-center gap-2 no-underline px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors"
                        >
                            View All <i className="fas fa-arrow-right text-xs"></i>
                        </Link>
                    </div>
                    
                    {recentCases.length > 0 ? (
                        <div className="space-y-2">
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
                                        onClick={() => navigate(`/details/${caseItem.docket_no || caseItem.DOCKET_NO}`)}
                                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-blue-50 
                                                   cursor-pointer transition-all border border-slate-200 hover:border-blue-300"
                                    >
                                        <div className={`w-1 h-12 rounded-full flex-shrink-0 ${isResolved ? 'bg-gradient-to-b from-emerald-400 to-teal-600' : 'bg-gradient-to-b from-amber-400 to-orange-600'}`}></div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-bold text-slate-800 truncate m-0">
                                                    {caseItem.docket_no || caseItem.DOCKET_NO || 'N/A'}
                                                </p>
                                                <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                                                    isResolved
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {caseItem.status || 'Pending'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 truncate m-0">
                                                <i className="fas fa-user text-xs mr-1.5 text-slate-500"></i>
                                                {caseItem.respondent || caseItem.RESPONDENT || 'N/A'}
                                            </p>
                                            <p className="text-xs text-slate-500 m-0 mt-1">
                                                <i className="fas fa-calendar text-xs mr-1.5"></i>
                                                {caseItem.date_filed ? new Date(caseItem.date_filed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                                            </p>
                                        </div>
                                        <i className="fas fa-arrow-right text-slate-300 text-sm flex-shrink-0"></i>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                <i className="fas fa-inbox text-slate-400 text-2xl"></i>
                            </div>
                            <p className="text-slate-600 m-0 font-medium">No recent cases found</p>
                            <p className="text-sm text-slate-400 m-0 mt-2">Cases will appear here once added</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ClerkDashboard;
