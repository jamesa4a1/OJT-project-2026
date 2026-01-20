import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../App';
import axios from 'axios';

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
        totalClerks: 0
    });
    const [recentCases, setRecentCases] = useState([]);
    const [allCases, setAllCases] = useState([]);
    const [showAllCases, setShowAllCases] = useState(false);
    const [users, setUsers] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Clerk' });
    const [createStatus, setCreateStatus] = useState({ type: '', message: '' });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchDashboardData();
        fetchUsers();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('http://localhost:5000/cases');
            if (response.ok) {
                const cases = await response.json();
                
                // Map uppercase DB fields to lowercase for frontend
                const mappedCases = cases.map(c => ({
                    ...c,
                    id: c.id,
                    docket_no: c.DOCKET_NO,
                    date_filed: c.DATE_FILED,
                    complainant: c.COMPLAINANT,
                    respondent: c.RESPONDENT,
                    offense: c.OFFENSE,
                    date_resolved: c.DATE_RESOLVED,
                    status: c.REMARKS_DECISION || 'Pending',
                    title: c.DOCKET_NO
                }));
                
                const now = new Date();
                const thisMonth = now.getMonth();
                const thisYear = now.getFullYear();
                
                const resolved = mappedCases.filter(c => 
                    c.status?.toLowerCase() === 'resolved' || 
                    c.status?.toLowerCase() === 'closed' ||
                    c.status?.toLowerCase() === 'terminated'
                ).length;
                const pending = mappedCases.filter(c => 
                    c.status?.toLowerCase() === 'pending' || 
                    c.status?.toLowerCase() === 'open' ||
                    c.status?.toLowerCase() === 'ongoing'
                ).length;
                const monthCases = mappedCases.filter(c => {
                    const caseDate = new Date(c.date_filed || c.DATE_FILED);
                    return caseDate.getMonth() === thisMonth && caseDate.getFullYear() === thisYear;
                }).length;

                setStats(prev => ({
                    ...prev,
                    total: mappedCases.length,
                    resolved: resolved,
                    pending: pending,
                    thisMonth: monthCases
                }));

                setRecentCases(mappedCases.slice(0, 3));
                setAllCases(mappedCases);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/users');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setUsers(data.users);
                    const clerks = data.users.filter(u => u.role === 'Clerk').length;
                    setStats(prev => ({
                        ...prev,
                        totalUsers: data.users.length,
                        totalClerks: clerks
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
                body: JSON.stringify(newUser)
            });

            const data = await response.json();

            if (data.success) {
                setCreateStatus({ type: 'success', message: `Account created successfully for ${newUser.name}!` });
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
                method: 'DELETE'
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
            const response = await fetch('http://localhost:5000/cases');
            if (response.ok) {
                const cases = await response.json();
                
                const headers = [
                    'ID',
                    'Docket No',
                    'Date Filed',
                    'Complainant',
                    'Respondent',
                    'Offense',
                    'Date Resolved',
                    'Resolving Prosecutor',
                    'Criminal Case No',
                    'Branch',
                    'Date Filed in Court',
                    'Remarks',
                    'Remarks Decision',
                    'Penalty',
                    'Index Cards'
                ];
                
                const csvContent = [
                    headers.join(','),
                    ...cases.map(c => [
                        c.id || '',
                        `"${(c.docket_no || c.DOCKET_NO || '').replace(/"/g, '""')}"`,
                        c.date_filed || c.DATE_FILED || '',
                        `"${(c.complainant || c.COMPLAINANT || '').replace(/"/g, '""')}"`,
                        `"${(c.respondent || c.RESPONDENT || '').replace(/"/g, '""')}"`,
                        `"${(c.offense || c.OFFENSE || '').replace(/"/g, '""')}"`,
                        c.date_resolved || c.DATE_RESOLVED || '',
                        `"${(c.resolving_prosecutor || c.RESOLVING_PROSECUTOR || '').replace(/"/g, '""')}"`,
                        `"${(c.crim_case_no || c.CRIM_CASE_NO || '').replace(/"/g, '""')}"`,
                        `"${(c.branch || c.BRANCH || '').replace(/"/g, '""')}"`,
                        c.datefiled_in_court || c.DATEFILED_IN_COURT || '',
                        `"${(c.remarks || c.REMARKS || '').replace(/"/g, '""')}"`,
                        `"${(c.remarks_decision || c.REMARKS_DECISION || '').replace(/"/g, '""')}"`,
                        `"${(c.penalty || c.PENALTY || '').replace(/"/g, '""')}"`,
                        `"${(c.index_cards || c.INDEX_CARDS || '').replace(/"/g, '""')}"`
                    ].join(','))
                ].join('\n');

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

    return (
        <div className="transition-colors duration-300">
            {/* Admin Welcome Banner */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden ${isDark ? 'bg-gradient-to-r from-blue-600 to-indigo-700' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
                
                <div className="relative flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm 
                                        flex items-center justify-center shadow-inner">
                            <i className="fas fa-external-link-alt text-white text-xl"></i>
                        </div>
                        <div>
                            <p className="text-white/80 text-sm m-0">Welcome back,</p>
                            <h2 className="text-2xl font-bold text-white m-0">{user?.name || 'Admin'}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
                                    admin
                                </span>
                                <span className="text-white/70 text-xs">• Full Access</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                                       bg-teal-500 text-white font-semibold text-sm
                                       hover:bg-teal-600 transition-colors border-none cursor-pointer shadow-lg"
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
                    <i className={`fas fa-bolt ${isDark ? 'text-blue-400' : 'text-blue-500'}`}></i>
                    <h3 className={`text-lg font-bold m-0 ${isDark ? 'text-white' : 'text-slate-700'}`}>Quick Actions</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/newcase')}
                        className={`rounded-2xl p-5 shadow-lg cursor-pointer group hover:shadow-xl transition-all ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-cyan-500 transition-colors ${isDark ? 'bg-cyan-900/50' : 'bg-cyan-100'}`}>
                                    <i className={`fas fa-plus-circle text-xl group-hover:text-white transition-colors ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}></i>
                                </div>
                                <div>
                                    <h4 className={`font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>Add New Case</h4>
                                    <p className={`text-sm m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Register a new case entry</p>
                                </div>
                            </div>
                            <i className={`fas fa-arrow-right group-hover:text-cyan-500 group-hover:translate-x-1 transition-all ${isDark ? 'text-slate-600' : 'text-slate-300'}`}></i>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/editcase')}
                        className={`rounded-2xl p-5 shadow-lg cursor-pointer group hover:shadow-xl transition-all ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-sky-500 transition-colors ${isDark ? 'bg-sky-900/50' : 'bg-sky-100'}`}>
                                    <i className={`fas fa-edit text-xl group-hover:text-white transition-colors ${isDark ? 'text-sky-400' : 'text-sky-600'}`}></i>
                                </div>
                                <div>
                                    <h4 className={`font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>Edit Case</h4>
                                    <p className={`text-sm m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Modify existing case details</p>
                                </div>
                            </div>
                            <i className={`fas fa-arrow-right group-hover:text-sky-500 group-hover:translate-x-1 transition-all ${isDark ? 'text-slate-600' : 'text-slate-300'}`}></i>
                        </div>
                    </motion.div>

                    {/* Excel Sync Button (Upload/Download) */}
                    <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/excel-sync')}
                        className={`rounded-2xl p-5 shadow-lg cursor-pointer group hover:shadow-xl transition-all ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-teal-500 transition-colors ${isDark ? 'bg-teal-900/50' : 'bg-teal-100'}`}>
                                    <i className={`fas fa-sync-alt text-xl group-hover:text-white transition-colors ${isDark ? 'text-teal-400' : 'text-teal-600'}`}></i>
                                </div>
                                <div>
                                    <h4 className={`font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>Excel Sync</h4>
                                    <p className={`text-sm m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Import/Export Excel files</p>
                                </div>
                            </div>
                            <i className={`fas fa-arrow-right group-hover:text-teal-500 group-hover:translate-x-1 transition-all ${isDark ? 'text-slate-600' : 'text-slate-300'}`}></i>
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
                <div className={`rounded-2xl p-5 shadow-lg transition-colors duration-300 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                            <i className={`fas fa-folder ${isDark ? 'text-blue-400' : 'text-blue-600'}`}></i>
                        </div>
                        <div>
                            <p className={`text-2xl font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.total}</p>
                            <p className={`text-xs m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total</p>
                        </div>
                    </div>
                </div>

                <div className={`rounded-2xl p-5 shadow-lg transition-colors duration-300 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-teal-900/50' : 'bg-teal-100'}`}>
                            <i className={`fas fa-check-circle ${isDark ? 'text-teal-400' : 'text-teal-600'}`}></i>
                        </div>
                        <div>
                            <p className={`text-2xl font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.resolved}</p>
                            <p className={`text-xs m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Resolved</p>
                        </div>
                    </div>
                </div>

                <div className={`rounded-2xl p-5 shadow-lg transition-colors duration-300 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-orange-900/50' : 'bg-orange-100'}`}>
                            <i className={`fas fa-clock ${isDark ? 'text-orange-400' : 'text-orange-500'}`}></i>
                        </div>
                        <div>
                            <p className={`text-2xl font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.pending}</p>
                            <p className={`text-xs m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pending</p>
                        </div>
                    </div>
                </div>

                <div className={`rounded-2xl p-5 shadow-lg transition-colors duration-300 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-violet-900/50' : 'bg-violet-100'}`}>
                            <i className={`fas fa-calendar ${isDark ? 'text-violet-400' : 'text-violet-600'}`}></i>
                        </div>
                        <div>
                            <p className={`text-2xl font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.thisMonth}</p>
                            <p className={`text-xs m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>This Month</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Bottom Section - Recent Cases */}
            <div className="grid grid-cols-1 gap-6 mb-8">
                {/* Recent Cases */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`rounded-2xl p-6 shadow-lg transition-colors duration-300 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                                <i className={`fas fa-briefcase text-lg ${isDark ? 'text-blue-400' : 'text-blue-600'}`}></i>
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                    Recent Cases
                                </h3>
                                <p className={`text-xs m-0 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                    {recentCases.length} {recentCases.length === 1 ? 'case' : 'cases'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/managecases')}
                            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors no-underline border-none cursor-pointer ${isDark ? 'text-blue-400 hover:bg-slate-700' : 'text-blue-600 hover:bg-blue-50'}`}
                        >
                            View All →
                        </button>
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
                                        key={caseItem.id || index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                                            isDark 
                                                ? 'border-slate-700 hover:border-blue-600 hover:bg-slate-700/50' 
                                                : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                                        }`}
                                        onClick={() => navigate(`/details/${caseItem.DOCKET_NO || caseItem.docket_no}`)}
                                    >
                                        {/* Status Indicator */}
                                        <div className={`w-1 h-12 rounded-full flex-shrink-0 ${isResolved ? 'bg-gradient-to-b from-emerald-400 to-teal-600' : 'bg-gradient-to-b from-amber-400 to-orange-600'}`}></div>
                                        
                                        {/* Case Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className={`font-bold m-0 text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                                    {caseItem.DOCKET_NO || caseItem.docket_no || 'Untitled Case'}
                                                </p>
                                                <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                                                    isResolved
                                                        ? isDark ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                                                        : isDark ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {caseItem.status || 'Pending'}
                                                </span>
                                            </div>
                                            <p className={`text-sm m-0 line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                <i className="fas fa-user text-xs mr-1.5"></i>
                                                {caseItem.RESPONDENT || caseItem.respondent || 'N/A'}
                                            </p>
                                            <p className={`text-xs m-0 mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                                <i className="fas fa-calendar text-xs mr-1.5"></i>
                                                {caseItem.DATE_FILED ? new Date(caseItem.DATE_FILED).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}
                                                {caseItem.date_resolved || caseItem.DATE_RESOLVED ? ` • Resolved: ${new Date(caseItem.DATE_RESOLVED).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                                            </p>
                                        </div>
                                        
                                        {/* Arrow Indicator */}
                                        <div className={`text-xl transition-colors flex-shrink-0 ${isDark ? 'text-slate-600 group-hover:text-blue-400' : 'text-slate-300 group-hover:text-blue-500'}`}>
                                            <i className="fas fa-arrow-right"></i>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={`text-center py-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            <i className="fas fa-inbox text-5xl mb-4 opacity-30"></i>
                            <p className="m-0 font-medium">No cases found</p>
                            <p className="text-xs m-0 mt-2">Cases will appear here once they are created</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* User Management Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={`rounded-2xl p-6 shadow-lg mb-8 transition-colors duration-300 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <i className={`fas fa-users-gear ${isDark ? 'text-blue-400' : 'text-blue-500'}`}></i>
                        <h3 className={`text-lg font-bold m-0 ${isDark ? 'text-white' : 'text-slate-700'}`}>User Management</h3>
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>User</th>
                                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Email</th>
                                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Role</th>
                                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Last Login</th>
                                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, index) => (
                                <motion.tr 
                                    key={u.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`border-b transition-colors ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'}`}
                                >
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${u.role === 'Admin' ? isDark ? 'bg-red-900/50' : 'bg-red-100' : isDark ? 'bg-sky-900/50' : 'bg-sky-100'}`}>
                                                <i className={`fas ${u.role === 'Admin' ? isDark ? 'fa-shield-halved text-red-400' : 'fa-shield-halved text-red-600' : isDark ? 'fa-user text-sky-400' : 'fa-user text-sky-600'}`}></i>
                                            </div>
                                            <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td className={`py-3 px-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{u.email}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold
                                                        ${u.role === 'Admin' ? isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600' : isDark ? 'bg-sky-900/50 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className={`py-3 px-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {u.last_login ? new Date(u.last_login).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        }) : 'Never'}
                                    </td>
                                    <td className="py-3 px-4">
                                        {u.role !== 'Admin' && (
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => { setSelectedUser(u); setShowDeleteModal(true); }}
                                                className={`w-8 h-8 rounded-lg border-none cursor-pointer transition-colors ${isDark ? 'bg-red-900/50 text-red-400 hover:bg-red-900' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                                            >
                                                <i className="fas fa-trash-alt text-sm"></i>
                                            </motion.button>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/caselist')}
                    className={`rounded-2xl p-5 shadow-lg cursor-pointer group hover:shadow-xl transition-all ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                            <i className={`fas fa-list text-xl group-hover:text-white transition-colors ${isDark ? 'text-blue-400' : 'text-blue-600'}`}></i>
                        </div>
                        <div>
                            <h4 className={`font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>View All Cases</h4>
                            <p className={`text-sm m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Browse case records</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/newcase')}
                    className={`rounded-2xl p-5 shadow-lg cursor-pointer group hover:shadow-xl transition-all ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-cyan-500 transition-colors ${isDark ? 'bg-cyan-900/50' : 'bg-cyan-100'}`}>
                            <i className={`fas fa-plus text-xl group-hover:text-white transition-colors ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}></i>
                        </div>
                        <div>
                            <h4 className={`font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>New Case</h4>
                            <p className={`text-sm m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Add a new record</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/settings')}
                    className={`rounded-2xl p-5 shadow-lg cursor-pointer group hover:shadow-xl transition-all ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-slate-500 transition-colors ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                            <i className={`fas fa-cog text-xl group-hover:text-white transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}></i>
                        </div>
                        <div>
                            <h4 className={`font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>Settings</h4>
                            <p className={`text-sm m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage your profile</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Create User Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`rounded-2xl p-6 w-full max-w-md shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'}`}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                                    <i className={`fas fa-user-plus text-xl ${isDark ? 'text-blue-400' : 'text-blue-600'}`}></i>
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>Create New Account</h3>
                                    <p className={`text-sm m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Add a new user to the system</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Full Name</label>
                                    <input
                                        type="text"
                                        value={newUser.name}
                                        onChange={e => setNewUser({...newUser, name: e.target.value})}
                                        className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-900' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={e => setNewUser({...newUser, email: e.target.value})}
                                        className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-900' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
                                        placeholder="Enter email"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
                                    <input
                                        type="password"
                                        value={newUser.password}
                                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                                        className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-900' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
                                        placeholder="Enter password"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Role</label>
                                    <select
                                        value={newUser.role}
                                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                                        className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-900' : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
                                    >
                                        <option value="Clerk">Clerk</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>

                                {createStatus.message && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-3 rounded-xl ${createStatus.type === 'success' ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-700'}`}
                                    >
                                        <i className={`fas ${createStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
                                        {createStatus.message}
                                    </motion.div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowCreateModal(false)}
                                        className={`flex-1 py-3 rounded-xl font-semibold border-none cursor-pointer transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isCreating}
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 
                                                   text-white font-semibold border-none cursor-pointer shadow-lg
                                                   disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCreating ? (
                                            <><i className="fas fa-spinner fa-spin mr-2"></i>Creating...</>
                                        ) : (
                                            <><i className="fas fa-user-plus mr-2"></i>Create Account</>
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center ${isDark ? 'bg-slate-800' : 'bg-white'}`}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-red-900/50' : 'bg-red-100'}`}>
                                <i className={`fas fa-exclamation-triangle text-2xl ${isDark ? 'text-red-400' : 'text-red-500'}`}></i>
                            </div>
                            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Delete User Account</h3>
                            <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                Are you sure you want to delete <strong className={isDark ? 'text-white' : ''}>{selectedUser?.name}</strong>'s account? 
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowDeleteModal(false)}
                                    className={`flex-1 py-3 rounded-xl font-semibold border-none cursor-pointer ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleDeleteUser}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-white 
                                               font-semibold border-none cursor-pointer hover:bg-red-600"
                                >
                                    <i className="fas fa-trash-alt mr-2"></i>Delete
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
