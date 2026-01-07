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
        <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
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
                            className="card shadow-lg border-0 mb-4"
                            style={{ borderRadius: '20px' }}
                        >
                            <div className="card-body p-4" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '20px' }}>
                                <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={handleCancel}
                                            className="btn btn-light rounded-circle me-3 d-flex align-items-center justify-content-center"
                                            style={{ width: '48px', height: '48px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                                        >
                                            <i className="fas fa-arrow-left" style={{ fontSize: '1.2rem', color: '#f59e0b' }}></i>
                                        </motion.button>
                                        <div className="bg-white rounded-circle p-3 shadow-sm me-3">
                                            <i className="fas fa-user-plus" style={{ fontSize: '2rem', color: '#f59e0b' }}></i>
                                        </div>
                                        <div className="text-white">
                                            <h2 className="mb-1 fw-bold">Create New Account</h2>
                                            <p className="mb-0 opacity-75">Add a new user to the OCP Docketing System</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Form Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="card shadow-lg border-0"
                            style={{ borderRadius: '20px' }}
                        >
                            <div className="card-body p-5">
                                <form onSubmit={handleSubmit}>
                                    {/* Status Message */}
                                    {status.message && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center mb-4`}
                                            style={{ borderRadius: '12px' }}
                                        >
                                            <i className={`fas ${status.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`}></i>
                                            {status.message}
                                        </motion.div>
                                    )}

                                    {/* Full Name */}
                                    <div className="mb-4">
                                        <label className="form-label fw-semibold text-dark">
                                            <i className="fas fa-user me-2 text-primary"></i>
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="form-control form-control-lg"
                                            placeholder="Enter full name"
                                            style={{ borderRadius: '12px', border: '2px solid #e5e7eb' }}
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="mb-4">
                                        <label className="form-label fw-semibold text-dark">
                                            <i className="fas fa-envelope me-2 text-primary"></i>
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="form-control form-control-lg"
                                            placeholder="Enter email address"
                                            style={{ borderRadius: '12px', border: '2px solid #e5e7eb' }}
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {/* Password */}
                                    <div className="mb-4">
                                        <label className="form-label fw-semibold text-dark">
                                            <i className="fas fa-lock me-2 text-primary"></i>
                                            Password
                                        </label>
                                        <div className="position-relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="form-control form-control-lg"
                                                placeholder="Enter password (min. 6 characters)"
                                                style={{ borderRadius: '12px', border: '2px solid #e5e7eb', paddingRight: '3rem' }}
                                                disabled={isSubmitting}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                                                style={{ textDecoration: 'none', color: '#6b7280' }}
                                            >
                                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="mb-4">
                                        <label className="form-label fw-semibold text-dark">
                                            <i className="fas fa-lock me-2 text-primary"></i>
                                            Confirm Password
                                        </label>
                                        <div className="position-relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className="form-control form-control-lg"
                                                placeholder="Re-enter password"
                                                style={{ borderRadius: '12px', border: '2px solid #e5e7eb', paddingRight: '3rem' }}
                                                disabled={isSubmitting}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                                                style={{ textDecoration: 'none', color: '#6b7280' }}
                                            >
                                                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Role Selection */}
                                    <div className="mb-4">
                                        <label className="form-label fw-semibold text-dark">
                                            <i className="fas fa-user-tag me-2 text-primary"></i>
                                            Account Role
                                        </label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className="form-select form-select-lg"
                                            style={{ borderRadius: '12px', border: '2px solid #e5e7eb' }}
                                            disabled={isSubmitting}
                                        >
                                            <option value="Clerk">Clerk</option>
                                            <option value="Staff">Staff</option>
                                            <option value="Admin">Admin</option>
                                        </select>
                                        <small className="text-muted">
                                            <i className="fas fa-info-circle me-1"></i>
                                            Clerks can manage cases. Staff can view all cases. Admins have full system access.
                                        </small>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="d-flex gap-3 mt-5">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            className="btn btn-lg flex-fill"
                                            disabled={isSubmitting}
                                            style={{
                                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                fontWeight: 'bold',
                                                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                                            }}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
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
                                            className="btn btn-lg btn-outline-secondary flex-fill"
                                            disabled={isSubmitting}
                                            style={{
                                                borderRadius: '12px',
                                                fontWeight: 'bold',
                                                border: '2px solid #6b7280'
                                            }}
                                        >
                                            <i className="fas fa-times me-2"></i>
                                            Cancel
                                        </motion.button>
                                    </div>
                                </form>

                                {/* Info Box */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="mt-4 p-3"
                                    style={{
                                        background: '#f3f4f6',
                                        borderRadius: '12px',
                                        borderLeft: '4px solid #3b82f6'
                                    }}
                                >
                                    <p className="mb-0 text-muted small">
                                        <i className="fas fa-shield-alt me-2 text-primary"></i>
                                        <strong>Security Note:</strong> The password will be securely encrypted before being stored in the database. Users will receive their login credentials via email.
                                    </p>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Quick Stats Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4"
                        >
                            <div className="card shadow border-0" style={{ borderRadius: '20px' }}>
                                <div className="card-body p-4">
                                    <div className="row text-center">
                                        <div className="col-4">
                                            <div className="bg-light rounded-3 p-3">
                                                <i className="fas fa-users fa-2x text-primary mb-2"></i>
                                                <h6 className="mb-0 text-muted small">Total Users</h6>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="bg-light rounded-3 p-3">
                                                <i className="fas fa-user-shield fa-2x text-warning mb-2"></i>
                                                <h6 className="mb-0 text-muted small">Admin Access</h6>
                                            </div>
                                        </div>
                                        <div className="col-4">
                                            <div className="bg-light rounded-3 p-3">
                                                <i className="fas fa-lock fa-2x text-success mb-2"></i>
                                                <h6 className="mb-0 text-muted small">Secure</h6>
                                            </div>
                                        </div>
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
