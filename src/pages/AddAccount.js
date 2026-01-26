import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../App';

const AddAccount = () => {
  const navigate = useNavigate();
  const { isDark } = useContext(ThemeContext) || { isDark: false };
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Clerk',
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState(null); // null means show all
  const [showAllUsers, setShowAllUsers] = useState(false); // Toggle for See More / See Less
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState('Clerk');
  const [isEditing, setIsEditing] = useState(false);
  const [togglingUser, setTogglingUser] = useState(null);

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

  const handleToggleStatus = async (user) => {
    setTogglingUser(user.id);
    try {
      const response = await fetch(`http://localhost:5000/api/user/${user.id}/toggle-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        setStatus({
          type: 'success',
          message: `${user.name}'s account has been ${data.isActive ? 'activated' : 'deactivated'}`,
        });
        fetchUsers();
        setTimeout(() => setStatus({ type: '', message: '' }), 3000);
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to toggle status' });
        setTimeout(() => setStatus({ type: '', message: '' }), 5000);
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Server error. Please try again.' });
    } finally {
      setTogglingUser(null);
    }
  };

  const getAdminCount = () => users.filter((u) => u.role === 'Admin' && u.is_active === 1).length;
  const getActiveAdminCount = () =>
    users.filter((u) => u.role === 'Admin' && u.is_active === 1).length;

  // Filter users based on selected role
  const getFilteredUsers = () => {
    let filtered = users;
    if (roleFilter) {
      filtered = users.filter((u) => u.role === roleFilter);
    }
    // Apply pagination: show 5 by default, all if showAllUsers is true
    if (!showAllUsers && filtered.length > 5) {
      return filtered.slice(0, 5);
    }
    return filtered;
  };

  // Get total filtered count (for determining if we show See More button)
  const getTotalFilteredCount = () => {
    if (!roleFilter) return users.length;
    return users.filter((u) => u.role === roleFilter).length;
  };

  const canToggleAdmin = (user) => {
    // Cannot deactivate if this is the last active admin
    if (user.role === 'Admin' && user.is_active === 1 && getActiveAdminCount() <= 1) {
      return false;
    }
    return true;
  };

  const canDeleteUser = (user) => {
    // Cannot delete if this is the last admin
    if (user.role === 'Admin' && getAdminCount() <= 1) {
      return false;
    }
    return true;
  };

  const handleEditUser = (user) => {
    setEditUser(user);
    setEditRole(user.role);
    setShowEditModal(true);
  };

  const handleUpdateRole = async () => {
    if (!editUser) return;
    setIsEditing(true);
    try {
      const response = await fetch(`http://localhost:5000/api/user/${editUser.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });
      const data = await response.json();
      if (data.success) {
        setStatus({ type: 'success', message: `Role updated for ${editUser.name}` });
        fetchUsers();
        setShowEditModal(false);
        setEditUser(null);
      } else {
        setStatus({ type: 'error', message: data.message || 'Failed to update role' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Server error. Please try again.' });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    // Check if trying to delete the last admin
    if (!canDeleteUser(selectedUser)) {
      setStatus({ type: 'error', message: 'Cannot delete the last admin account!' });
      setShowDeleteModal(false);
      setSelectedUser(null);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/user/${selectedUser.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setStatus({
          type: 'success',
          message: `Account "${selectedUser.name}" deleted successfully!`,
        });
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
      [e.target.name]: e.target.value,
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
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({
          type: 'success',
          message: `Account created successfully for ${formData.name}!`,
        });
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
    <div className={`min-h-screen p-3 transition-colors duration-300 ${
      isDark
        ? 'bg-slate-900'
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'
    }`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-3"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center border-none cursor-pointer transition-colors ${
                isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <i className="fas fa-arrow-left"></i>
            </motion.button>
            <div>
              <h1 className={`text-2xl font-bold m-0 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Account Management</h1>
              <p className={`text-xs m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Create new accounts and manage existing users</p>
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
              className={`mb-3 p-3 rounded-xl flex items-center gap-3 shadow-lg ${
                status.type === 'success'
                  ? isDark
                    ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                    : 'bg-green-50 border border-green-200 text-green-700'
                  : isDark
                    ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                    : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  status.type === 'success'
                    ? isDark
                      ? 'bg-green-500/30 text-green-400'
                      : 'bg-green-200 text-green-600'
                    : isDark
                      ? 'bg-red-500/30 text-red-400'
                      : 'bg-red-200 text-red-600'
                }`}
              >
                <i
                  className={`fas ${status.type === 'success' ? 'fa-check' : 'fa-exclamation'} text-lg`}
                ></i>
              </div>
              <span className="font-medium">{status.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid md:grid-cols-3 gap-3">
          {/* Left Column - Create Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1"
          >
            <div className={`rounded-2xl shadow-lg border p-4 sticky top-3 transition-colors duration-300 ${
              isDark
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-100'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  <i className="fas fa-user-plus text-lg"></i>
                </div>
                <div>
                  <h2 className={`text-lg font-bold m-0 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Create Account</h2>
                  <p className={`text-xs m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Add new user</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <i className={`fas fa-user mr-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded-xl border outline-none transition-all text-xs ${
                      isDark
                        ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                    placeholder="Enter full name"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <i className={`fas fa-envelope mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm ${
                      isDark
                        ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                    placeholder="Enter email"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <i className={`fas fa-lock mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all pr-10 text-sm ${
                        isDark
                          ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      }`}
                      placeholder="Min. 6 characters"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer text-sm ${
                        isDark
                          ? 'text-slate-500 hover:text-slate-400'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <i className={`fas fa-lock mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all pr-10 text-sm ${
                        isDark
                          ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      }`}
                      placeholder="Re-enter password"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer text-sm ${
                        isDark
                          ? 'text-slate-500 hover:text-slate-400'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <i
                        className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                      ></i>
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <i className={`fas fa-user-tag mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm ${
                      isDark
                        ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        : 'bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
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
                  className={`w-full py-3 rounded-xl text-white font-semibold border-none cursor-pointer shadow-lg hover:shadow-xl transition-all disabled:opacity-50 ${
                    isDark
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus mr-2"></i>Create Account
                    </>
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
                className={`rounded-xl shadow-md p-4 border transition-colors duration-300 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold m-0 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{users.length}</p>
                    <p className={`text-xs m-0 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Users</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isDark
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    <i className="fas fa-users text-xl"></i>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className={`rounded-xl shadow-md p-4 border transition-colors duration-300 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold m-0 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {users.filter((u) => u.role === 'Admin').length}
                    </p>
                    <p className={`text-xs m-0 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Admins</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isDark
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    <i className="fas fa-shield-halved text-xl"></i>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className={`rounded-xl shadow-md p-4 border transition-colors duration-300 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold m-0 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {users.filter((u) => u.role === 'Clerk').length}
                    </p>
                    <p className={`text-xs m-0 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Clerks</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isDark
                      ? 'bg-teal-500/20 text-teal-400'
                      : 'bg-teal-100 text-teal-600'
                  }`}>
                    <i className="fas fa-user-pen text-xl"></i>
                  </div>
                </div>
              </motion.div>

              {/* Staff Card */}
              <motion.div
                whileHover={{ y: -4 }}
                className={`rounded-xl shadow-md p-4 border transition-colors duration-300 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold m-0 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {users.filter((u) => u.role === 'Staff').length}
                    </p>
                    <p className={`text-xs m-0 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Staff</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isDark
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    <i className="fas fa-user-group text-xl"></i>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Users List */}
            <div className={`rounded-2xl shadow-lg border p-6 transition-colors duration-300 ${
              isDark
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-100'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDark
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    <i className="fas fa-users"></i>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold m-0 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>All Accounts</h3>
                    <p className={`text-sm m-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage existing users</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Role Filter Buttons */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setRoleFilter(null)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        roleFilter === null
                          ? isDark
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-blue-600 text-white border-blue-600'
                          : isDark
                            ? 'bg-slate-700 text-slate-300 border-slate-600 hover:border-blue-400'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      All
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setRoleFilter('Admin')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        roleFilter === 'Admin'
                          ? isDark
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-purple-600 text-white border-purple-600'
                          : isDark
                            ? 'bg-slate-700 text-slate-300 border-slate-600 hover:border-purple-400'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      Admin
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setRoleFilter('Clerk')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        roleFilter === 'Clerk'
                          ? isDark
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-blue-600 text-white border-blue-600'
                          : isDark
                            ? 'bg-slate-700 text-slate-300 border-slate-600 hover:border-blue-400'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      Clerk
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setRoleFilter('Staff')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        roleFilter === 'Staff'
                          ? isDark
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-teal-600 text-white border-teal-600'
                          : isDark
                            ? 'bg-slate-700 text-slate-300 border-slate-600 hover:border-teal-400'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      Staff
                    </motion.button>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isDark
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {getFilteredUsers().length}/{getTotalFilteredCount()} users
                  </span>
                </div>
              </div>

              {users.length > 0 ? (
                <div className="w-full overflow-hidden">
                  <table className="w-full min-w-full table-fixed">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <th className={`text-left py-2.5 px-3 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          User
                        </th>
                        <th className={`text-left py-2.5 px-3 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Email
                        </th>
                        <th className={`text-left py-2.5 px-3 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Role
                        </th>
                        <th className={`text-left py-2.5 px-3 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Created
                        </th>
                        <th className={`text-center py-2.5 px-3 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredUsers().map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`border-b transition-colors ${
                            isDark
                              ? 'border-slate-700 hover:bg-slate-700/50'
                              : 'border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5 flex-nowrap">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                                  user.role === 'Admin'
                                    ? 'bg-purple-500'
                                    : user.role === 'Staff'
                                      ? 'bg-teal-500'
                                      : 'bg-blue-500'
                                }`}
                              >
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <span className={`font-medium whitespace-nowrap overflow-hidden text-ellipsis text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {user.name}
                              </span>
                            </div>
                          </td>
                          <td className={`py-2.5 px-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{user.email}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                user.role === 'Admin'
                                  ? isDark
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : 'bg-purple-100 text-purple-700'
                                  : user.role === 'Staff'
                                    ? isDark
                                      ? 'bg-teal-500/20 text-teal-300'
                                      : 'bg-teal-100 text-teal-700'
                                    : isDark
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex gap-1.5 justify-center items-center">
                              {/* Delete Button - shown for all users */}
                              <motion.button
                                whileHover={{ scale: canDeleteUser(user) ? 1.1 : 1 }}
                                whileTap={{ scale: canDeleteUser(user) ? 0.9 : 1 }}
                                onClick={() => {
                                  if (canDeleteUser(user)) {
                                    setSelectedUser(user);
                                    setShowDeleteModal(true);
                                  }
                                }}
                                className={`w-8 h-8 rounded-lg border-none transition-all flex items-center justify-center ${
                                  canDeleteUser(user)
                                    ? 'bg-red-100 text-red-600 cursor-pointer hover:bg-red-500 hover:text-white'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                }`}
                                title={
                                  canDeleteUser(user)
                                    ? 'Delete account'
                                    : 'Cannot delete the last admin'
                                }
                                disabled={!canDeleteUser(user)}
                              >
                                <i className="fas fa-trash-alt text-xs"></i>
                              </motion.button>

                              {/* Toggle Switch for Admin users */}
                              {user.role === 'Admin' ? (
                                <motion.button
                                  whileHover={{ scale: canToggleAdmin(user) ? 1.05 : 1 }}
                                  whileTap={{ scale: canToggleAdmin(user) ? 0.95 : 1 }}
                                  onClick={() => canToggleAdmin(user) && handleToggleStatus(user)}
                                  disabled={togglingUser === user.id || !canToggleAdmin(user)}
                                  className={`relative w-8 h-8 rounded-lg border-none flex items-center justify-center transition-colors duration-300 ${
                                    canToggleAdmin(user)
                                      ? 'cursor-pointer'
                                      : 'cursor-not-allowed opacity-50'
                                  } ${user.is_active !== 0 ? 'bg-cyan-100' : 'bg-red-100'}`}
                                  title={
                                    !canToggleAdmin(user)
                                      ? 'Cannot deactivate the last active admin'
                                      : user.is_active !== 0
                                        ? 'Deactivate account'
                                        : 'Activate account'
                                  }
                                >
                                  <motion.div
                                    className={`w-5 h-5 rounded-md shadow-sm transition-colors duration-300 ${
                                      user.is_active !== 0 ? 'bg-cyan-500' : 'bg-red-500'
                                    }`}
                                    animate={{
                                      y: user.is_active !== 0 ? -4 : 4,
                                    }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                  />

                                  {togglingUser === user.id && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/30 rounded-lg z-10">
                                      <i className="fas fa-spinner fa-spin text-slate-700 text-xs"></i>
                                    </div>
                                  )}
                                </motion.button>
                              ) : (
                                /* Edit Button for non-Admin users */
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEditUser(user)}
                                  className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 border-none cursor-pointer hover:bg-yellow-400 hover:text-white transition-all flex items-center justify-center"
                                  title="Edit role"
                                >
                                  <i className="fas fa-edit text-xs"></i>
                                </motion.button>
                              )}
                            </div>
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

              {/* See More / See Less Button */}
              {getTotalFilteredCount() > 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center mt-6 pt-4 border-t border-slate-200"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAllUsers(!showAllUsers)}
                    className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition-all flex items-center gap-2"
                  >
                    {showAllUsers ? (
                      <>
                        <i className="fas fa-chevron-up"></i>
                        See Less
                      </>
                    ) : (
                      <>
                        <i className="fas fa-chevron-down"></i>
                        See More
                      </>
                    )}
                  </motion.button>
                </motion.div>
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
              onClick={(e) => e.stopPropagation()}
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
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>Deleting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash-alt mr-2"></i>Delete
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-edit text-2xl text-yellow-700"></i>
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-800">Edit User Role</h3>
                <p className="text-slate-600 mb-6">
                  Update role for <strong>{editUser?.name}</strong> ({editUser?.email})
                </p>
                <div className="mb-6">
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                  >
                    <option value="Clerk">Clerk</option>
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowEditModal(false)}
                    disabled={isEditing}
                    className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold border-none cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpdateRole}
                    disabled={isEditing}
                    className="flex-1 py-3 rounded-xl bg-yellow-500 text-white font-semibold border-none cursor-pointer hover:bg-yellow-600 transition-colors disabled:opacity-50"
                  >
                    {isEditing ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>Save
                      </>
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
