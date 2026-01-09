import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
                
                // Redirect to admin dashboard after 2 seconds
                setTimeout(() => {
                    navigate('/admin-dashboard');
                }, 2000);
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
        <div className="min-vh-100 bg-slate-100">
            <div className="container py-5">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="row justify-content-center"
                >
                    <div className="col-lg-8 col-xl-7">
                        {/* Header Card */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 mb-4 shadow-xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
                            
                            <div className="relative flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleCancel}
                                        className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-none cursor-pointer shadow-lg hover:bg-white/30 transition-colors"
                                    >
                                        <i className="fas fa-arrow-left text-white text-lg"></i>
                                    </motion.button>
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                                        <i className="fas fa-user-plus text-white text-2xl"></i>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white m-0">Create New Account</h2>
                                        <p className="text-white/80 text-sm m-0 mt-1">Add a new user to the OCP Docketing System</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Form Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6"
                        >
                                <form onSubmit={handleSubmit}>
                                    {/* Status Message */}
                                    {status.message && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`p-4 rounded-xl mb-6 flex items-center gap-2 ${status.type === 'success' ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-700'}`}
                                        >
                                            <i className={`fas ${status.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                                            <span className="font-medium">{status.message}</span>
                                        </motion.div>
                                    )}

                                    {/* Full Name */}
                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            <i className="fas fa-user text-blue-600 mr-2"></i>
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            placeholder="Enter full name"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            <i className="fas fa-envelope text-blue-600 mr-2"></i>
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            placeholder="Enter email address"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {/* Password */}
                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            <i className="fas fa-lock text-blue-600 mr-2"></i>
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all pr-12"
                                                placeholder="Enter password (min. 6 characters)"
                                                disabled={isSubmitting}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
                                            >
                                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            <i className="fas fa-lock text-blue-600 mr-2"></i>
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all pr-12"
                                                placeholder="Re-enter password"
                                                disabled={isSubmitting}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
                                            >
                                                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Role Selection */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            <i className="fas fa-user-tag text-blue-600 mr-2"></i>
                                            Account Role
                                        </label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
                                            disabled={isSubmitting}
                                        >
                                            <option value="Clerk">Clerk - Can manage cases</option>
                                            <option value="Staff">Staff - Can view cases</option>
                                            <option value="Admin">Admin - Full system access</option>
                                        </select>
                                        <p className="text-slate-500 text-sm mt-2">
                                            <i className="fas fa-info-circle mr-1"></i>
                                            Select the appropriate role based on user permissions needed
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 mt-6">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold border-none cursor-pointer shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                                    Creating Account...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-user-plus me-2"></i>
                                                    Create Account
                                                </>
                                            )}
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={handleCancel}
                                            disabled={isSubmitting}
                                            className="flex-1 py-3 px-6 rounded-xl bg-slate-100 text-slate-600 font-semibold border-none cursor-pointer hover:bg-slate-200 transition-colors disabled:opacity-50"
                                        >
                                            <i className="fas fa-times mr-2"></i>
                                            Cancel
                                        </motion.button>
                                    </div>
                                </form>

                                {/* Info Box */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="mt-6 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500"
                                >
                                    <p className="m-0 text-slate-700 text-sm">
                                        <i className="fas fa-shield-alt text-blue-500 mr-2"></i>
                                        <strong>Security Note:</strong> The password will be securely encrypted before being stored in the database. Users will receive their login credentials via email.
                                    </p>
                                </motion.div>
                        </motion.div>

                        {/* Quick Stats Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-6"
                        >
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-blue-50 rounded-xl p-4 hover:bg-blue-100 transition-colors">
                                        <i className="fas fa-users text-3xl text-blue-600 mb-2"></i>
                                        <h6 className="m-0 text-slate-600 text-sm font-semibold">Total Users</h6>
                                    </div>
                                    <div className="bg-indigo-50 rounded-xl p-4 hover:bg-indigo-100 transition-colors">
                                        <i className="fas fa-user-shield text-3xl text-indigo-600 mb-2"></i>
                                        <h6 className="m-0 text-slate-600 text-sm font-semibold">Admin Access</h6>
                                    </div>
                                    <div className="bg-teal-50 rounded-xl p-4 hover:bg-teal-100 transition-colors">
                                        <i className="fas fa-lock text-3xl text-teal-600 mb-2"></i>
                                        <h6 className="m-0 text-slate-600 text-sm font-semibold">Secure</h6>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AddAccount;
