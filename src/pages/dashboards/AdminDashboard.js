import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout, register } = useAuth();
    const [stats, setStats] = useState({
        total: 0,
        resolved: 0,
        pending: 0,
        thisMonth: 0,
        totalUsers: 0,
        totalClerks: 0
    });
    const [recentCases, setRecentCases] = useState([]);
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
                
                const now = new Date();
                const thisMonth = now.getMonth();
                const thisYear = now.getFullYear();
                
                const resolved = cases.filter(c => c.status?.toLowerCase() === 'resolved' || c.status?.toLowerCase() === 'closed').length;
                const pending = cases.filter(c => c.status?.toLowerCase() === 'pending' || c.status?.toLowerCase() === 'open').length;
                const monthCases = cases.filter(c => {
                    const caseDate = new Date(c.date_filed || c.created_at);
                    return caseDate.getMonth() === thisMonth && caseDate.getFullYear() === thisYear;
                }).length;

                setStats(prev => ({
                    ...prev,
                    total: cases.length,
                    resolved: resolved,
                    pending: pending,
                    thisMonth: monthCases
                }));

                setRecentCases(cases.slice(0, 5));
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
        <div>
            {/* Admin Welcome Banner */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden"
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
                                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center
                                                group-hover:bg-emerald-500 transition-colors">
                                    <i className="fas fa-plus-circle text-emerald-600 text-xl 
                                                  group-hover:text-white transition-colors"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 m-0">Add New Case</h4>
                                    <p className="text-sm text-slate-500 m-0">Register a new case entry</p>
                                </div>
                            </div>
                            <i className="fas fa-arrow-right text-slate-300 group-hover:text-emerald-500 
                                          group-hover:translate-x-1 transition-all"></i>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/editcase')}
                        className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 
                                   cursor-pointer group hover:shadow-xl transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center
                                                group-hover:bg-amber-500 transition-colors">
                                    <i className="fas fa-edit text-amber-600 text-xl 
                                                  group-hover:text-white transition-colors"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 m-0">Edit Case</h4>
                                    <p className="text-sm text-slate-500 m-0">Modify existing case details</p>
                                </div>
                            </div>
                            <i className="fas fa-arrow-right text-slate-300 group-hover:text-amber-500 
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

            {/* Bottom Section - Recent Cases */}
            <div className="grid grid-cols-1 gap-6 mb-8">
                {/* Recent Cases */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-clock text-amber-500"></i>
                            <h3 className="text-lg font-bold text-slate-700 m-0">Recent Cases</h3>
                        </div>
                        <Link to="/caselist" className="text-amber-500 hover:text-amber-600 text-sm font-medium no-underline">
                            View All →
                        </Link>
                    </div>
                    
                    {recentCases.length > 0 ? (
                        <div className="space-y-3">
                            {recentCases.map((caseItem, index) => (
                                <motion.div
                                    key={caseItem.id || index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/details/${caseItem.docket_no}`)}
                                >
                                    <div className={`w-2 h-10 rounded-full ${
                                        caseItem.status?.toLowerCase() === 'resolved' || caseItem.status?.toLowerCase() === 'closed'
                                            ? 'bg-emerald-500'
                                            : 'bg-amber-500'
                                    }`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-700 m-0 truncate">
                                            {caseItem.title || caseItem.docket_no || 'Untitled Case'}
                                        </p>
                                        <p className="text-sm text-slate-400 m-0">
                                            {caseItem.docket_no} • {caseItem.date_filed || 'No date'}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        caseItem.status?.toLowerCase() === 'resolved' || caseItem.status?.toLowerCase() === 'closed'
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-amber-100 text-amber-600'
                                    }`}>
                                        {caseItem.status || 'Pending'}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <i className="fas fa-folder-open text-4xl mb-3 opacity-50"></i>
                            <p className="m-0">No cases yet</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* User Management Section */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 mb-8"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <i className="fas fa-users-gear text-amber-500"></i>
                        <h3 className="text-lg font-bold text-slate-700 m-0">User Management</h3>
                    </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">User</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Email</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Role</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Last Login</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, index) => (
                                <motion.tr 
                                    key={u.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                >
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-lg ${u.role === 'Admin' ? 'bg-red-100' : 'bg-amber-100'} 
                                                            flex items-center justify-center`}>
                                                <i className={`fas ${u.role === 'Admin' ? 'fa-shield-halved text-red-600' : 'fa-user text-amber-600'}`}></i>
                                            </div>
                                            <span className="font-medium text-slate-700">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-slate-600 text-sm">{u.email}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold
                                                        ${u.role === 'Admin' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-500 text-sm">
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
                                                className="w-8 h-8 rounded-lg bg-red-100 text-red-600 
                                                           border-none cursor-pointer hover:bg-red-200 transition-colors"
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
                    className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 
                               cursor-pointer group hover:shadow-xl transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center
                                        group-hover:bg-blue-500 transition-colors">
                            <i className="fas fa-list text-blue-600 text-xl group-hover:text-white transition-colors"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 m-0">View All Cases</h4>
                            <p className="text-sm text-slate-500 m-0">Browse case records</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/newcase')}
                    className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 
                               cursor-pointer group hover:shadow-xl transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center
                                        group-hover:bg-emerald-500 transition-colors">
                            <i className="fas fa-plus text-emerald-600 text-xl group-hover:text-white transition-colors"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 m-0">New Case</h4>
                            <p className="text-sm text-slate-500 m-0">Add a new record</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/settings')}
                    className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 
                               cursor-pointer group hover:shadow-xl transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center
                                        group-hover:bg-slate-500 transition-colors">
                            <i className="fas fa-cog text-slate-600 text-xl group-hover:text-white transition-colors"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 m-0">Settings</h4>
                            <p className="text-sm text-slate-500 m-0">Manage your profile</p>
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
                            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                    <i className="fas fa-user-plus text-amber-600 text-xl"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 m-0">Create New Account</h3>
                                    <p className="text-sm text-slate-500 m-0">Add a new user to the system</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={newUser.name}
                                        onChange={e => setNewUser({...newUser, name: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 
                                                   focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={e => setNewUser({...newUser, email: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 
                                                   focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                        placeholder="Enter email"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={newUser.password}
                                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 
                                                   focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                                        placeholder="Enter password"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                                    <select
                                        value={newUser.role}
                                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 
                                                   focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none bg-white"
                                    >
                                        <option value="Clerk">Clerk</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>

                                {createStatus.message && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-3 rounded-xl ${createStatus.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
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
                                        className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 
                                                   font-semibold border-none cursor-pointer hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isCreating}
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 
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
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete User Account</h3>
                            <p className="text-slate-600 mb-6">
                                Are you sure you want to delete <strong>{selectedUser?.name}</strong>'s account? 
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 
                                               font-semibold border-none cursor-pointer"
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleDeleteUser}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-white 
                                               font-semibold border-none cursor-pointer"
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
