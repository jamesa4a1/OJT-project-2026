import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AddAccount = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Clerk'
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [users, setUsers] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/users');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setUsers(data.users);
                }
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        
        setIsDeleting(true);
        try {
            const response = await fetch(`http://localhost:5000/api/user/${selectedUser.id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            
            if (data.success) {
                setStatus({ type: 'success', message: `Account "${selectedUser.name}" deleted successfully!` });
                fetchUsers();
                setShowDeleteModal(false);
                setSelectedUser(null);
                setTimeout(() => setStatus({ type: '', message: '' }), 3000);
            } else {
                setStatus({ type: 'error', message: data.message || 'Failed to delete account' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Server error. Please try again.' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear status when user starts typing
        if (status.message) {
            setStatus({ type: '', message: '' });
        }
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setStatus({ type: 'error', message: 'Name is required' });
            return false;
        }
        if (!formData.email.trim()) {
            setStatus({ type: 'error', message: 'Email is required' });
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setStatus({ type: 'error', message: 'Please enter a valid email' });
            return false;
        }
        if (formData.password.length < 6) {
            setStatus({ type: 'error', message: 'Password must be at least 6 characters' });
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setStatus({ type: 'error', message: 'Passwords do not match' });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                })
            });

            const data = await response.json();

            if (data.success) {
                setStatus({ type: 'success', message: `Account created successfully for ${formData.name}!` });
                setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'Clerk' });
                fetchUsers(); // Refresh the users list
                
                // Clear message after 3 seconds
                setTimeout(() => {
                    setStatus({ type: '', message: '' });
                }, 3000);
            } else {
                setStatus({ type: 'error', message: data.message || 'Failed to create account' });
            }
        } catch (error) {
            console.error('Error:', error);
            setStatus({ type: 'error', message: 'Server error. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin-dashboard');
    };

    return (
        <div className="min-vh-100 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6"
                >
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCancel}
                            className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center border-none cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            <i className="fas fa-arrow-left text-slate-700"></i>
                        </motion.button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 m-0">Account Management</h1>
                            <p className="text-slate-500 m-0">Create new accounts and manage existing users</p>
                        </div>
                    </div>
                </motion.div>

                {/* Status Message */}
                <AnimatePresence>
                    {status.message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-lg ${
                                status.type === 'success' 
                                    ? 'bg-green-50 border border-green-200 text-green-700' 
                                    : 'bg-red-50 border border-red-200 text-red-700'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                status.type === 'success' ? 'bg-green-200' : 'bg-red-200'
                            }`}>
                                <i className={`fas ${status.type === 'success' ? 'fa-check' : 'fa-exclamation'} text-lg`}></i>
                            </div>
                            <span className="font-medium">{status.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Create Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sticky top-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <i className="fas fa-user-plus text-blue-600 text-xl"></i>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 m-0">Create Account</h2>
                                    <p className="text-slate-500 text-sm m-0">Add new user</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        <i className="fas fa-user text-slate-400 mr-2"></i>Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                                        placeholder="Enter full name"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        <i className="fas fa-envelope text-slate-400 mr-2"></i>Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                                        placeholder="Enter email"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        <i className="fas fa-lock text-slate-400 mr-2"></i>Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all pr-10 text-sm"
                                            placeholder="Min. 6 characters"
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                                        >
                                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        <i className="fas fa-lock text-slate-400 mr-2"></i>Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all pr-10 text-sm"
                                            placeholder="Re-enter password"
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                                        >
                                            <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        <i className="fas fa-user-tag text-slate-400 mr-2"></i>Role
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-sm"
                                        disabled={isSubmitting}
                                    >
                                        <option value="Clerk">Clerk - Can manage cases</option>
                                        <option value="Staff">Staff - Can view cases</option>
                                        <option value="Admin">Admin - Full access</option>
                                    </select>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold border-none cursor-pointer shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <><i className="fas fa-spinner fa-spin mr-2"></i>Creating...</>
                                    ) : (
                                        <><i className="fas fa-user-plus mr-2"></i>Create Account</>
                                    )}
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Right Column - Stats & Users List */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        {/* Stats Cards */}
                        <div className="grid grid-cols-4 gap-4">
                            <motion.div
                                whileHover={{ y: -4 }}
                                className="bg-white rounded-xl shadow-md p-4 border border-slate-100"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-bold text-slate-800 m-0">{users.length}</p>
                                        <p className="text-slate-500 text-sm m-0 mt-1">Total Users</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <i className="fas fa-users text-blue-600 text-xl"></i>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ y: -4 }}
                                className="bg-white rounded-xl shadow-md p-4 border border-slate-100"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-bold text-slate-800 m-0">{users.filter(u => u.role === 'Admin').length}</p>
                                        <p className="text-slate-500 text-sm m-0 mt-1">Admins</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                        <i className="fas fa-shield-halved text-purple-600 text-xl"></i>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                whileHover={{ y: -4 }}
                                className="bg-white rounded-xl shadow-md p-4 border border-slate-100"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-bold text-slate-800 m-0">{users.filter(u => u.role === 'Clerk').length}</p>
                                        <p className="text-slate-500 text-sm m-0 mt-1">Clerks</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                                        <i className="fas fa-user-pen text-teal-600 text-xl"></i>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Staff Card */}
                            <motion.div
                                whileHover={{ y: -4 }}
                                className="bg-white rounded-xl shadow-md p-4 border border-slate-100"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-bold text-slate-800 m-0">{users.filter(u => u.role === 'Staff').length}</p>
                                        <p className="text-slate-500 text-sm m-0 mt-1">Staff</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                        <i className="fas fa-user-group text-green-600 text-xl"></i>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Users List */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <i className="fas fa-users text-blue-600"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 m-0">All Accounts</h3>
                                        <p className="text-slate-500 text-sm m-0">Manage existing users</p>
                                    </div>
                                </div>
                                <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                    {users.length} users
                                </span>
                            </div>
                            
                            {users.length > 0 ? (
                                <div className="overflow-x-auto -mx-6 px-6">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">User</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Email</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Role</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Created</th>
                                                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user, index) => (
                                                <motion.tr
                                                    key={user.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                                >
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                                                user.role === 'Admin' ? 'bg-purple-500' :
                                                                user.role === 'Staff' ? 'bg-teal-500' : 'bg-blue-500'
                                                            }`}>
                                                                {user.name?.charAt(0).toUpperCase() || 'U'}
                                                            </div>
                                                            <span className="font-medium text-slate-700">{user.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-slate-600 text-sm">{user.email}</td>
                                                    <td className="py-4 px-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                            user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                                                            user.role === 'Staff' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-slate-500 text-sm">
                                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        {user.role !== 'Admin' ? (
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                                                                className="w-9 h-9 rounded-lg bg-red-100 text-red-600 border-none cursor-pointer hover:bg-red-500 hover:text-white transition-all"
                                                                title="Delete account"
                                                            >
                                                                <i className="fas fa-trash-alt text-sm"></i>
                                                            </motion.button>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">Protected</span>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <i className="fas fa-users text-5xl mb-3 opacity-50"></i>
                                    <p className="m-0">No accounts found</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

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
                            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                    <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-slate-800">Delete Account</h3>
                                <p className="text-slate-600 mb-6">
                                    Are you sure you want to delete <strong>{selectedUser?.name}</strong>'s account? 
                                    This action cannot be undone.
                                </p>
                                <div className="flex gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowDeleteModal(false)}
                                        disabled={isDeleting}
                                        className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold border-none cursor-pointer hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleDeleteUser}
                                        disabled={isDeleting}
                                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold border-none cursor-pointer hover:bg-red-600 transition-colors disabled:opacity-50"
                                    >
                                        {isDeleting ? (
                                            <><i className="fas fa-spinner fa-spin mr-2"></i>Deleting...</>
                                        ) : (
                                            <><i className="fas fa-trash-alt mr-2"></i>Delete</>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AddAccount;
