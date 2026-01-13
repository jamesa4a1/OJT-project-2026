import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { user, updateUserInfo, uploadProfilePicture, removeProfilePicture } = useAuth();
    const fileInputRef = useRef(null);
    const cameraMenuRef = useRef(null);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [showCameraMenu, setShowCameraMenu] = useState(false);
    const [showPhotoViewer, setShowPhotoViewer] = useState(false);
    const [uploadingPicture, setUploadingPicture] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || ''
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
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
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
            email: formData.email
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
            newPassword: formData.newPassword
        });

        if (result.success) {
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        } else {
            setMessage({ type: 'error', text: result.message || 'Failed to update password' });
        }

        setIsLoading(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData(prev => ({
            ...prev,
            name: user?.name || '',
            email: user?.email || ''
        }));
        setMessage({ type: '', text: '' });
    };

    const getInitials = () => user?.name?.charAt(0).toUpperCase() || 'U';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4 lg:px-8">
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
                                className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-slate-600 hover:text-slate-800 hover:scale-110 transition-all border-none cursor-pointer"
                            >
                                <i className="fas fa-times text-xl"></i>
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
                {/* Profile Header Card */}
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8"
                >
                    {/* Header Background */}
                    <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
                    </div>
                    
                    {/* Profile Info */}
                    <div className="relative px-8 pb-8">
                        {/* Avatar */}
                        <div className="absolute -top-16 left-8">
                            <div className="relative" ref={cameraMenuRef}>
                                {uploadingPicture ? (
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center ring-4 ring-white shadow-xl">
                                        <i className="fas fa-spinner fa-spin text-white text-3xl"></i>
                                    </div>
                                ) : user?.profilePicture ? (
                                    <img
                                        src={user.profilePicture}
                                        alt={user?.name}
                                        className="w-32 h-32 rounded-full object-cover ring-4 ring-white shadow-xl"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-5xl font-bold ring-4 ring-white shadow-xl">
                                        {getInitials()}
                                    </div>
                                )}
                                
                                {/* Camera Button */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowCameraMenu(!showCameraMenu)}
                                    className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center border-3 border-white transition-colors cursor-pointer"
                                    style={{ borderWidth: '3px' }}
                                >
                                    <i className="fas fa-camera"></i>
                                </motion.button>
                                
                                {/* Camera Dropdown Menu */}
                                <AnimatePresence>
                                    {showCameraMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden min-w-[180px] z-50"
                                        >
                                            {user?.profilePicture && (
                                                <button
                                                    onClick={() => {
                                                        setShowPhotoViewer(true);
                                                        setShowCameraMenu(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors text-left border-none bg-transparent cursor-pointer"
                                                >
                                                    <i className="fas fa-eye text-blue-500 w-5"></i>
                                                    <span className="font-medium">View Photo</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    fileInputRef.current?.click();
                                                    setShowCameraMenu(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors text-left border-none bg-transparent cursor-pointer"
                                            >
                                                <i className="fas fa-upload text-green-500 w-5"></i>
                                                <span className="font-medium">Change Photo</span>
                                            </button>
                                            {user?.profilePicture && (
                                                <button
                                                    onClick={handleRemovePicture}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left border-none bg-transparent cursor-pointer"
                                                >
                                                    <i className="fas fa-trash-alt w-5"></i>
                                                    <span className="font-medium">Remove Photo</span>
                                                </button>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        
                        {/* User Info */}
                        <div className="pt-20 flex flex-col md:flex-row md:items-end md:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800">{user?.name}</h1>
                                <p className="text-slate-500 mt-1">{user?.email}</p>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                                        user?.role === 'Admin' 
                                            ? 'bg-purple-100 text-purple-700' 
                                            : user?.role === 'Staff'
                                            ? 'bg-teal-100 text-teal-700'
                                            : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        <i className={`fas ${user?.role === 'Admin' ? 'fa-shield-halved' : user?.role === 'Staff' ? 'fa-user-tie' : 'fa-user-pen'} mr-2`}></i>
                                        {user?.role}
                                    </span>
                                    <span className="text-slate-400 text-sm">
                                        <i className="fas fa-calendar-alt mr-1"></i>
                                        Joined {user?.registeredAt ? new Date(user.registeredAt).toLocaleDateString('en-US', {
                                            month: 'long',
                                            year: 'numeric'
                                        }) : 'Recently'}
                                    </span>
                                </div>
                            </div>
                            
                            {user?.id && (
                                <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-slate-400">
                                    <i className="fas fa-database"></i>
                                    <span>Connected to Database</span>
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Message Alert */}
                <AnimatePresence>
                    {message.text && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-lg ${
                                message.type === 'success' 
                                    ? 'bg-green-50 border border-green-200 text-green-700' 
                                    : 'bg-red-50 border border-red-200 text-red-700'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                message.type === 'success' ? 'bg-green-200' : 'bg-red-200'
                            }`}>
                                <i className={`fas ${message.type === 'success' ? 'fa-check' : 'fa-exclamation'} text-lg`}></i>
                            </div>
                            <span className="font-medium">{message.text}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-24">
                            <nav className="space-y-1">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 border-none cursor-pointer ${
                                        activeTab === 'profile'
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : 'text-slate-600 hover:bg-slate-100 bg-transparent'
                                    }`}
                                >
                                    <i className="fas fa-user-circle"></i>
                                    Profile Info
                                </button>
                                <button
                                    onClick={() => setActiveTab('security')}
                                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 border-none cursor-pointer ${
                                        activeTab === 'security'
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                                            : 'text-slate-600 hover:bg-slate-100 bg-transparent'
                                    }`}
                                >
                                    <i className="fas fa-shield-alt"></i>
                                    Security
                                </button>
                            </nav>
                            
                            {/* Info Box */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex items-start gap-3">
                                    <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
                                    <div>
                                        <h4 className="font-semibold text-blue-900 text-sm">Pro Tip</h4>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Keep your profile updated to ensure seamless access to the system.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Panel */}
                    <motion.div
                        layout
                        className="lg:col-span-3"
                    >
                        <AnimatePresence mode="wait">
                            {activeTab === 'profile' && (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="bg-white rounded-2xl shadow-lg p-6 lg:p-8"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                    <i className="fas fa-user text-blue-600"></i>
                                                </div>
                                                Profile Information
                                            </h2>
                                            <p className="text-slate-500 mt-1 ml-13">Update your personal details</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleProfileSubmit}>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    <i className="fas fa-user mr-2 text-slate-400"></i>
                                                    Full Name
                                                </label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-slate-800 font-medium outline-none"
                                                        placeholder="Enter your full name"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <div 
                                                        onClick={() => setIsEditing(true)}
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-100 text-slate-700 font-medium cursor-pointer hover:bg-slate-100 hover:border-blue-300 transition-all"
                                                    >
                                                        {formData.name || 'Not set'}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    <i className="fas fa-envelope mr-2 text-slate-400"></i>
                                                    Email Address
                                                </label>
                                                {isEditing ? (
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-slate-800 outline-none"
                                                        placeholder="your@email.com"
                                                    />
                                                ) : (
                                                    <div 
                                                        onClick={() => setIsEditing(true)}
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-100 text-slate-700 font-medium cursor-pointer hover:bg-slate-100 hover:border-blue-300 transition-all"
                                                    >
                                                        {formData.email || 'Not set'}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    <i className="fas fa-briefcase mr-2 text-slate-400"></i>
                                                    Role
                                                </label>
                                                <div className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-100 text-slate-700 font-medium flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${
                                                        user?.role === 'Admin' 
                                                            ? 'bg-purple-500' 
                                                            : user?.role === 'Staff' 
                                                            ? 'bg-teal-500' 
                                                            : 'bg-blue-500'
                                                    }`}></span>
                                                    {user?.role || 'Not assigned'}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    <i className="fas fa-calendar mr-2 text-slate-400"></i>
                                                    Member Since
                                                </label>
                                                <div className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-100 text-slate-700 font-medium">
                                                    {user?.registeredAt 
                                                        ? new Date(user.registeredAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        }) 
                                                        : 'Unknown'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                                            {!isEditing ? (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    type="button"
                                                    onClick={() => setIsEditing(true)}
                                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all border-none cursor-pointer"
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
                                                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 transition-all border-none cursor-pointer"
                                                    >
                                                        {isLoading ? (
                                                            <><i className="fas fa-spinner fa-spin mr-2"></i>Saving...</>
                                                        ) : (
                                                            <><i className="fas fa-save mr-2"></i>Save Changes</>
                                                        )}
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        type="button"
                                                        onClick={handleCancel}
                                                        disabled={isLoading}
                                                        className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all border-none cursor-pointer"
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
                                    className="bg-white rounded-2xl shadow-lg p-6 lg:p-8"
                                >
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                <i className="fas fa-lock text-green-600"></i>
                                            </div>
                                            Security Settings
                                        </h2>
                                        <p className="text-slate-500 mt-1 ml-13">Update your password to keep your account secure</p>
                                    </div>

                                    {/* Security Info Box */}
                                    <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                                        <i className="fas fa-shield-halved text-amber-500 text-lg mt-0.5"></i>
                                        <div>
                                            <h4 className="font-semibold text-amber-900">Password Requirements</h4>
                                            <ul className="text-sm text-amber-700 mt-2 space-y-1">
                                                <li><i className="fas fa-check-circle mr-2 text-amber-500"></i>Minimum 6 characters</li>
                                                <li><i className="fas fa-check-circle mr-2 text-amber-500"></i>Confirmation must match</li>
                                                <li><i className="fas fa-check-circle mr-2 text-amber-500"></i>Current password required for verification</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                <i className="fas fa-key mr-2 text-slate-400"></i>
                                                Current Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPasswords.current ? "text" : "password"}
                                                    name="currentPassword"
                                                    value={formData.currentPassword}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all outline-none"
                                                    placeholder="Enter your current password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('current')}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                                                >
                                                    <i className={`fas ${showPasswords.current ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                <i className="fas fa-lock mr-2 text-slate-400"></i>
                                                New Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPasswords.new ? "text" : "password"}
                                                    name="newPassword"
                                                    value={formData.newPassword}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all outline-none"
                                                    placeholder="Enter new password (min. 6 characters)"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('new')}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                                                >
                                                    <i className={`fas ${showPasswords.new ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                <i className="fas fa-lock mr-2 text-slate-400"></i>
                                                Confirm New Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPasswords.confirm ? "text" : "password"}
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all outline-none"
                                                    placeholder="Confirm your new password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('confirm')}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                                                >
                                                    <i className={`fas ${showPasswords.confirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                </button>
                                            </div>
                                            {formData.newPassword && formData.confirmPassword && (
                                                <p className={`mt-2 text-sm font-medium flex items-center gap-2 ${
                                                    formData.newPassword === formData.confirmPassword ? 'text-green-600' : 'text-red-500'
                                                }`}>
                                                    <i className={`fas ${formData.newPassword === formData.confirmPassword ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                                                    {formData.newPassword === formData.confirmPassword ? 'Passwords match!' : 'Passwords do not match'}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="submit"
                                                disabled={isLoading}
                                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 transition-all border-none cursor-pointer"
                                            >
                                                {isLoading ? (
                                                    <><i className="fas fa-spinner fa-spin mr-2"></i>Updating...</>
                                                ) : (
                                                    <><i className="fas fa-lock mr-2"></i>Update Password</>
                                                )}
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))}
                                                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all border-none cursor-pointer"
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
