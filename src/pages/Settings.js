import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../App';

const Settings = () => {
  const { user, updateUserInfo, uploadProfilePicture, removeProfilePicture } = useAuth();
  const { isDark } = useContext(ThemeContext) || { isDark: false };
  const fileInputRef = useRef(null);
  const cameraMenuRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  // Close camera menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cameraMenuRef.current && !cameraMenuRef.current.contains(event.target)) {
        setShowCameraMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
      return;
    }

    setUploadingPicture(true);
    const result = await uploadProfilePicture(file);

    if (result.success) {
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to upload image' });
    }

    setUploadingPicture(false);

    // Clear message after 3 seconds
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleRemovePicture = async () => {
    setUploadingPicture(true);
    setShowCameraMenu(false);

    const result = await removeProfilePicture();

    if (result.success) {
      setMessage({ type: 'success', text: 'Profile picture removed successfully!' });
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to remove picture' });
    }

    setUploadingPicture(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required' });
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email' });
      setIsLoading(false);
      return;
    }

    const result = await updateUserInfo({
      name: formData.name,
      email: formData.email,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to update profile' });
    }

    setIsLoading(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.currentPassword) {
      setMessage({ type: 'error', text: 'Current password is required' });
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      setIsLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setIsLoading(false);
      return;
    }

    const result = await updateUserInfo({
      name: user.name,
      email: user.email,
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to update password' });
    }

    setIsLoading(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData((prev) => ({
      ...prev,
      name: user?.name || '',
      email: user?.email || '',
    }));
    setMessage({ type: '', text: '' });
  };

  const getInitials = () => user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <div className={`min-h-screen py-8 px-4 lg:px-8 transition-colors duration-300 ${
      isDark 
        ? 'bg-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20'
    }`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Photo Viewer Modal */}
      <AnimatePresence>
        {showPhotoViewer && user?.profilePicture && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPhotoViewer(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={user.profilePicture}
                alt={user?.name}
                className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl object-contain"
              />
              <button
                onClick={() => setShowPhotoViewer(false)}
                className={`absolute -top-4 -right-4 w-12 h-12 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-all border-none cursor-pointer text-xl ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white text-slate-600 hover:text-slate-800'
                }`}
              >
                <i className="fas fa-times"></i>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Profile Header Card - Enhanced */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`rounded-3xl shadow-2xl overflow-hidden mb-8 border-2 transition-colors duration-300 ${
            isDark
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-slate-100'
          }`}
        >
          {/* Header Background - Enhanced Gradient */}
          <div className={`h-40 relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700'
              : 'bg-gradient-to-br from-doj-navy via-doj-blue to-blue-600'
          }`}>
            <div className="absolute inset-0">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.2, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={`absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl ${
                  isDark ? 'bg-slate-500/20' : 'bg-blue-400/20'
                }`}
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1,
                }}
                className={`absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-3xl ${
                  isDark ? 'bg-slate-400/20' : 'bg-indigo-400/20'
                }`}
              />
            </div>
          </div>

          {/* Profile Info - Enhanced */}
          <div className="relative px-8 pb-8">
            {/* Avatar - Enhanced with better ring */}
            <div className="absolute -top-20 left-8">
              <div className="relative" ref={cameraMenuRef}>
                {uploadingPicture ? (
                  <div className={`w-40 h-40 rounded-2xl flex items-center justify-center ring-4 shadow-2xl ${
                    isDark
                      ? 'bg-gradient-to-br from-slate-600 via-slate-500 to-slate-600 ring-slate-700'
                      : 'bg-gradient-to-br from-doj-blue via-blue-500 to-indigo-600 ring-white'
                  }`}>
                    <i className="fas fa-spinner fa-spin text-4xl" style={{ color: isDark ? '#e2e8f0' : 'white' }}></i>
                  </div>
                ) : user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user?.name}
                    className={`w-40 h-40 rounded-2xl object-cover ring-4 shadow-2xl ${
                      isDark ? 'ring-slate-700' : 'ring-white'
                    }`}
                  />
                ) : (
                  <div className={`w-40 h-40 rounded-2xl flex items-center justify-center text-6xl font-bold ring-4 shadow-2xl ${
                    isDark
                      ? 'bg-gradient-to-br from-slate-600 via-slate-500 to-slate-600 text-slate-200 ring-slate-700'
                      : 'bg-gradient-to-br from-doj-blue via-blue-500 to-indigo-600 text-white ring-white'
                  }`}>
                    {getInitials()}
                  </div>
                )}

                {/* Camera Button - Enhanced */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCameraMenu(!showCameraMenu)}
                  className={`absolute bottom-2 right-2 w-12 h-12 rounded-xl shadow-xl flex items-center justify-center border-4 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-gradient-to-br from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400 text-white border-slate-700'
                      : 'bg-gradient-to-br from-doj-blue to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white border-white'
                  }`}
                >
                  <i className="fas fa-camera text-lg"></i>
                </motion.button>

                {/* Camera Dropdown Menu - Enhanced */}
                <AnimatePresence>
                  {showCameraMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className={`absolute top-full left-0 mt-2 rounded-2xl shadow-2xl border-2 overflow-hidden min-w-[200px] z-50 ${
                        isDark
                          ? 'bg-slate-800 border-slate-700'
                          : 'bg-white border-slate-100'
                      }`}
                    >
                      {user?.profilePicture && (
                        <button
                          onClick={() => {
                            setShowPhotoViewer(true);
                            setShowCameraMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-5 py-3.5 transition-all text-left border-none bg-transparent cursor-pointer font-medium ${
                            isDark
                              ? 'text-slate-300 hover:bg-slate-700'
                              : 'text-slate-700 hover:bg-blue-50'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isDark
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            <i className="fas fa-eye"></i>
                          </div>
                          <span>View Photo</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowCameraMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-5 py-3.5 transition-all text-left border-none bg-transparent cursor-pointer font-medium ${
                          isDark
                            ? 'text-slate-300 hover:bg-slate-700'
                            : 'text-slate-700 hover:bg-emerald-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isDark
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          <i className="fas fa-upload"></i>
                        </div>
                        <span>Change Photo</span>
                      </button>
                      {user?.profilePicture && (
                        <button
                          onClick={handleRemovePicture}
                          className={`w-full flex items-center gap-3 px-5 py-3.5 transition-all text-left border-none bg-transparent cursor-pointer font-medium ${
                            isDark
                              ? 'text-red-400 hover:bg-slate-700'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            isDark
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-red-100 text-red-600'
                          }`}>
                            <i className="fas fa-trash-alt"></i>
                          </div>
                          <span>Remove Photo</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* User Info - Enhanced */}
            <div className="pt-24 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className={`text-4xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{user?.name}</h1>
                <p className={`mt-2 text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user?.email}</p>
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  <span
                    className={`px-5 py-2 rounded-xl text-sm font-bold shadow-lg ${
                      user?.role === 'Admin'
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                        : user?.role === 'Staff'
                          ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    }`}
                  >
                    <i
                      className={`fas ${user?.role === 'Admin' ? 'fa-shield-halved' : user?.role === 'Staff' ? 'fa-user-tie' : 'fa-user-pen'} mr-2`}
                    ></i>
                    {user?.role}
                  </span>
                  <span className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
                    isDark
                      ? 'bg-slate-700 text-slate-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    <i className="fas fa-calendar-alt"></i>
                    Joined{' '}
                    {user?.registeredAt
                      ? new Date(user.registeredAt).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Recently'}
                  </span>
                </div>
              </div>

              {user?.id && (
                <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 ${
                  isDark
                    ? 'bg-emerald-500/20 border-emerald-500/30'
                    : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDark
                      ? 'bg-emerald-500/30 text-emerald-400'
                      : 'bg-emerald-200 text-emerald-600'
                  }`}>
                    <i className="fas fa-database"></i>
                  </div>
                  <div>
                    <p className={`text-sm font-bold m-0 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Connected to Database</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
                      <span className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Active Connection</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Message Alert - Enhanced */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`mb-6 p-5 rounded-2xl flex items-center gap-4 shadow-xl border-2 ${
                message.type === 'success'
                  ? isDark
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-800'
                  : isDark
                    ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-500/30 text-red-300'
                    : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 text-red-800'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                  message.type === 'success' 
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white' 
                    : 'bg-gradient-to-br from-red-400 to-rose-500 text-white'
                }`}
              >
                <i
                  className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-xl`}
                ></i>
              </div>
              <span className="font-bold text-lg">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Enhanced */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className={`rounded-2xl shadow-xl p-6 sticky top-24 border-2 transition-colors duration-300 ${
              isDark
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-slate-100'
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-5 px-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Settings Menu</h3>
              <nav className="space-y-3">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-4 rounded-xl font-semibold transition-all flex items-center gap-3 border-none cursor-pointer ${
                    activeTab === 'profile'
                      ? isDark
                        ? 'bg-gradient-to-r from-blue-500/30 to-blue-500/20 text-blue-300 border-2 border-blue-500/50 shadow-md'
                        : 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-900 border-2 border-blue-300 shadow-md'
                      : isDark
                        ? 'text-slate-400 hover:bg-slate-700 bg-transparent border border-slate-700 hover:border-blue-500/30'
                        : 'text-slate-600 hover:bg-slate-50 bg-transparent border border-slate-200 hover:border-blue-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activeTab === 'profile'
                      ? isDark
                        ? 'bg-blue-500/30 text-blue-300'
                        : 'bg-blue-500/20 text-blue-600'
                      : isDark
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-blue-100 text-blue-600'
                  }`}>
                    <i className="fas fa-user-circle text-lg"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold leading-tight">Profile</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Info</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-4 rounded-xl font-semibold transition-all flex items-center gap-3 border-none cursor-pointer ${
                    activeTab === 'security'
                      ? isDark
                        ? 'bg-gradient-to-r from-emerald-500/40 to-teal-600/40 text-emerald-200 shadow-xl shadow-emerald-500/20'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30'
                      : isDark
                        ? 'text-slate-400 hover:bg-slate-700 bg-transparent border border-slate-700 hover:border-emerald-500/30'
                        : 'text-slate-600 hover:bg-slate-50 bg-transparent border border-slate-200 hover:border-emerald-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activeTab === 'security'
                      ? isDark
                        ? 'bg-white/20 text-emerald-300'
                        : 'bg-white/20 text-white'
                      : isDark
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    <i className="fas fa-shield-alt text-lg"></i>
                  </div>
                  <p className="text-sm font-bold">Security</p>
                </button>
              </nav>

              {/* Info Box - Enhanced */}
              <div className={`mt-6 p-4 rounded-2xl border-2 ${
                isDark
                  ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/30'
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isDark
                      ? 'bg-blue-500/30 text-blue-400'
                      : 'bg-blue-500/20 text-blue-600'
                  }`}>
                    <i className="fas fa-lightbulb text-base"></i>
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm mb-1 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>Pro Tip</h4>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                      Keep your profile updated to ensure seamless access to the system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Panel */}
          <motion.div layout className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`rounded-2xl shadow-xl p-6 lg:p-8 border-2 transition-colors duration-300 ${
                    isDark
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className={`text-3xl font-bold flex items-center gap-4 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                          isDark
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-blue-200'
                            : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                        }`}>
                          <i className="fas fa-user text-xl"></i>
                        </div>
                        Profile Information
                      </h2>
                      <p className={`mt-2 ml-[4.5rem] text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Update your personal details</p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileSubmit}>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <i className={`fas fa-user mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>
                          Full Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 transition-all outline-none font-medium ${
                              isDark
                                ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-blue-500/20'
                                : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:ring-blue-500/20'
                            }`}
                            placeholder="Enter your full name"
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() => setIsEditing(true)}
                            className={`w-full px-4 py-3 rounded-xl border-2 font-medium cursor-pointer transition-all ${
                              isDark
                                ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:border-blue-500/30'
                                : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-blue-300'
                            }`}
                          >
                            {formData.name || 'Not set'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <i className={`fas fa-envelope mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>
                          Email Address
                        </label>
                        {isEditing ? (
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 transition-all outline-none ${
                              isDark
                                ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-blue-500/20'
                                : 'border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:ring-blue-500/20'
                            }`}
                            placeholder="your@email.com"
                          />
                        ) : (
                          <div
                            onClick={() => setIsEditing(true)}
                            className={`w-full px-4 py-3 rounded-xl border-2 font-medium cursor-pointer transition-all ${
                              isDark
                                ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:border-blue-500/30'
                                : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100 hover:border-blue-300'
                            }`}
                          >
                            {formData.email || 'Not set'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <i className={`fas fa-briefcase mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>
                          Role
                        </label>
                        <div className={`w-full px-4 py-3 rounded-xl border-2 font-medium flex items-center gap-2 ${
                          isDark
                            ? 'bg-slate-700 border-slate-600 text-slate-300'
                            : 'bg-slate-50 border-slate-100 text-slate-700'
                        }`}>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              user?.role === 'Admin'
                                ? isDark ? 'bg-purple-400' : 'bg-purple-500'
                                : user?.role === 'Staff'
                                  ? isDark ? 'bg-teal-400' : 'bg-teal-500'
                                  : isDark ? 'bg-blue-400' : 'bg-blue-500'
                            }`}
                          ></span>
                          {user?.role || 'Not assigned'}
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <i className={`fas fa-calendar mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>
                          Member Since
                        </label>
                        <div className={`w-full px-4 py-3 rounded-xl border-2 font-medium ${
                          isDark
                            ? 'bg-slate-700 border-slate-600 text-slate-300'
                            : 'bg-slate-50 border-slate-100 text-slate-700'
                        }`}>
                          {user?.registeredAt
                            ? new Date(user.registeredAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : 'Unknown'}
                        </div>
                      </div>
                    </div>

                    <div className={`mt-8 pt-6 flex flex-col sm:flex-row gap-3 ${isDark ? 'border-t border-slate-700' : 'border-t border-slate-200'}`}>
                      {!isEditing ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className={`px-6 py-3 font-semibold rounded-xl shadow-lg transition-all border-none cursor-pointer ${
                            isDark
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white'
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                          }`}
                        >
                          <i className="fas fa-edit mr-2"></i>
                          Edit Profile
                        </motion.button>
                      ) : (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className={`px-6 py-3 font-semibold rounded-xl shadow-lg disabled:opacity-50 transition-all border-none cursor-pointer ${
                              isDark
                                ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white'
                                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                            }`}
                          >
                            {isLoading ? (
                              <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>Saving...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-save mr-2"></i>Save Changes
                              </>
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className={`px-6 py-3 font-semibold rounded-xl transition-all border-none cursor-pointer ${
                              isDark
                                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                            }`}
                          >
                            <i className="fas fa-times mr-2"></i>
                            Cancel
                          </motion.button>
                        </>
                      )}
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`rounded-2xl shadow-lg p-6 lg:p-8 border-2 transition-colors duration-300 ${
                    isDark
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="mb-6">
                    <h2 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isDark
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        <i className="fas fa-lock"></i>
                      </div>
                      Security Settings
                    </h2>
                    <p className={`mt-1 ml-13 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Update your password to keep your account secure
                    </p>
                  </div>

                  {/* Security Info Box */}
                  <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
                    isDark
                      ? 'bg-amber-500/20 border-amber-500/30'
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <i className={`fas fa-shield-halved text-lg mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`}></i>
                    <div>
                      <h4 className={`font-semibold ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>Password Requirements</h4>
                      <ul className={`text-sm mt-2 space-y-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                        <li>
                          <i className={`fas fa-check-circle mr-2 ${isDark ? 'text-amber-400' : 'text-amber-500'}`}></i>Minimum 6
                          characters
                        </li>
                        <li>
                          <i className={`fas fa-check-circle mr-2 ${isDark ? 'text-amber-400' : 'text-amber-500'}`}></i>Confirmation
                          must match
                        </li>
                        <li>
                          <i className={`fas fa-check-circle mr-2 ${isDark ? 'text-amber-400' : 'text-amber-500'}`}></i>Current
                          password required for verification
                        </li>
                      </ul>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-5">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className={`fas fa-key mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 pr-12 rounded-xl border-2 focus:ring-4 transition-all outline-none ${
                            isDark
                              ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-green-500/20'
                              : 'border-slate-200 bg-white text-slate-800 focus:border-green-500 focus:ring-green-500/20'
                          }`}
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className={`absolute right-4 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer ${
                            isDark
                              ? 'text-slate-500 hover:text-slate-400'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <i
                            className={`fas ${showPasswords.current ? 'fa-eye-slash' : 'fa-eye'}`}
                          ></i>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className={`fas fa-lock mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 pr-12 rounded-xl border-2 focus:ring-4 transition-all outline-none ${
                            isDark
                              ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-green-500/20'
                              : 'border-slate-200 bg-white text-slate-800 focus:border-green-500 focus:ring-green-500/20'
                          }`}
                          placeholder="Enter new password (min. 6 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className={`absolute right-4 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer ${
                            isDark
                              ? 'text-slate-500 hover:text-slate-400'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <i className={`fas ${showPasswords.new ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className={`fas fa-lock mr-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 pr-12 rounded-xl border-2 focus:ring-4 transition-all outline-none ${
                            isDark
                              ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-green-500/20'
                              : 'border-slate-200 bg-white text-slate-800 focus:border-green-500 focus:ring-green-500/20'
                          }`}
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className={`absolute right-4 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer ${
                            isDark
                              ? 'text-slate-500 hover:text-slate-400'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <i
                            className={`fas ${showPasswords.confirm ? 'fa-eye-slash' : 'fa-eye'}`}
                          ></i>
                        </button>
                      </div>
                      {formData.newPassword && formData.confirmPassword && (
                        <p
                          className={`mt-2 text-sm font-medium flex items-center gap-2 ${
                            formData.newPassword === formData.confirmPassword
                              ? isDark ? 'text-green-400' : 'text-green-600'
                              : isDark ? 'text-red-400' : 'text-red-500'
                          }`}
                        >
                          <i
                            className={`fas ${formData.newPassword === formData.confirmPassword ? 'fa-check-circle' : 'fa-times-circle'}`}
                          ></i>
                          {formData.newPassword === formData.confirmPassword
                            ? 'Passwords match!'
                            : 'Passwords do not match'}
                        </p>
                      )}
                    </div>

                    <div className={`pt-6 flex flex-col sm:flex-row gap-3 ${isDark ? 'border-t border-slate-700' : 'border-t border-slate-200'}`}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        className={`px-6 py-3 font-semibold rounded-xl shadow-lg disabled:opacity-50 transition-all border-none cursor-pointer ${
                          isDark
                            ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>Updating...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-lock mr-2"></i>Update Password
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                          }))
                        }
                        className={`px-6 py-3 font-semibold rounded-xl transition-all border-none cursor-pointer ${
                          isDark
                            ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                      >
                        <i className="fas fa-eraser mr-2"></i>
                        Clear Fields
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
