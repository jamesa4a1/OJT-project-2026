import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef(null);

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/homepage');
    };

    // Different sidebar items based on role
    const adminSidebarItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large', path: '/admin-dashboard' },
        { id: 'newcase', label: 'Add New Case', icon: 'fa-plus-circle', path: '/newcase' },
        { id: 'findcase', label: 'Find Case', icon: 'fa-search', path: '/findcase' },
        { id: 'editcase', label: 'Update Case', icon: 'fa-edit', path: '/editcase' },
        { id: 'addaccount', label: 'Add Account', icon: 'fa-user-plus', path: '/add-account' },
        { id: 'deletecase', label: 'Delete Case', icon: 'fa-trash-alt', path: '/deletecase' },
        { id: 'caselist', label: 'Terminated Cases', icon: 'fa-archive', path: '/caselist' },
        { id: 'settings', label: 'Account Settings', icon: 'fa-cog', path: '/settings' },
    ];

    const clerkSidebarItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large', path: '/dashboard' },
        { id: 'newcase', label: 'Add New Case', icon: 'fa-plus-circle', path: '/newcase' },
        { id: 'findcase', label: 'Find Case', icon: 'fa-search', path: '/findcase' },
        { id: 'editcase', label: 'Update Case', icon: 'fa-edit', path: '/editcase' },
        { id: 'settings', label: 'Account Settings', icon: 'fa-cog', path: '/settings' },
    ];

    const staffSidebarItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large', path: '/staff-dashboard' },
        { id: 'findcase', label: 'Find Case', icon: 'fa-search', path: '/findcase' },
        { id: 'settings', label: 'Account Settings', icon: 'fa-cog', path: '/settings' },
    ];

    const getSidebarItems = () => {
        if (user?.role === 'Admin') return adminSidebarItems;
        if (user?.role === 'Staff') return staffSidebarItems;
        return clerkSidebarItems;
    };

    const sidebarItems = getSidebarItems();

    const roleConfig = {
        Admin: { 
            light: 'bg-red-100',
            text: 'text-red-600',
            icon: 'fa-shield-halved',
        },
        Clerk: { 
            light: 'bg-amber-100',
            text: 'text-amber-600',
            icon: 'fa-pen-to-square',
        },
        Staff: { 
            light: 'bg-teal-100',
            text: 'text-teal-600',
            icon: 'fa-user-tie',
        }
    };

    const currentRole = roleConfig[user?.role] || roleConfig.Clerk;

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar */}
            <motion.aside 
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-64 bg-white shadow-xl fixed left-0 top-20 bottom-0 z-40 flex flex-col"
            >
                {/* Role Label */}
                <div className="px-4 pt-8 pb-4 bg-slate-50 border-b border-slate-200">
                    <span className={`text-base font-bold uppercase tracking-wider ${user?.role === 'Admin' ? 'text-red-500' : user?.role === 'Staff' ? 'text-teal-500' : 'text-amber-500'}`}>
                        {user?.role === 'Admin' ? 'Admin Dashboard' : user?.role === 'Staff' ? 'Staff Dashboard' : 'Clerk Dashboard'}
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 pt-2 space-y-2 overflow-y-auto">
                    {sidebarItems.map((item) => (
                        <motion.button
                            key={item.id}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                                       transition-all duration-200 border-none cursor-pointer text-left
                                       ${isActive(item.path) && item.id === 'dashboard'
                                           ? 'bg-slate-800 text-white shadow-lg' 
                                           : isActive(item.path)
                                           ? 'bg-slate-800 text-white shadow-lg'
                                           : 'bg-transparent text-slate-600 hover:bg-slate-100'}`}
                        >
                            <i className={`fas ${item.icon} w-5 text-center`}></i>
                            <span>{item.label}</span>
                        </motion.button>
                    ))}
                </nav>

                {/* Sidebar Footer - User Info */}
                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
                        {user?.profilePicture ? (
                            <img 
                                src={user.profilePicture} 
                                alt={user?.name}
                                className="w-8 h-8 rounded-lg object-cover"
                            />
                        ) : (
                            <div className={`w-8 h-8 rounded-lg ${currentRole.light} flex items-center justify-center`}>
                                <i className={`fas ${currentRole.icon} ${currentRole.text} text-sm`}></i>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate m-0">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-400 m-0">{user?.role}</p>
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 ml-64">
                {/* Top Header */}
                <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-8 py-4 
                                   shadow-lg fixed top-0 left-0 right-0 z-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 
                                            flex items-center justify-center shadow-lg">
                                <i className="fas fa-balance-scale text-white"></i>
                            </div>
                            <div>
                                <h1 className="font-bold text-white text-lg m-0">OCP Docketing</h1>
                                <p className="text-xs text-blue-300 m-0">Hall of Justice • Tagbilaran</p>
                            </div>
                        </div>
                        
                        <div className="relative" ref={profileMenuRef}>
                            <button
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600 hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                {user?.profilePicture ? (
                                    <img 
                                        src={user.profilePicture} 
                                        alt={user?.name}
                                        className="w-9 h-9 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 
                                                    flex items-center justify-center text-white font-bold">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-white m-0">{user?.name || 'User'}</p>
                                    <p className="text-xs text-slate-400 m-0">{user?.email}</p>
                                </div>
                                <motion.i 
                                    animate={{ rotate: showProfileMenu ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="fas fa-chevron-down text-slate-400 text-xs ml-2"
                                ></motion.i>
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {showProfileMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50"
                                    >
                                        <div className="p-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                            <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${
                                                user?.role === 'Admin' 
                                                    ? 'bg-purple-100 text-purple-700' 
                                                    : user?.role === 'Staff'
                                                    ? 'bg-teal-100 text-teal-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {user?.role}
                                            </span>
                                        </div>
                                        
                                        <motion.button
                                            whileHover={{ backgroundColor: '#fee2e2' }}
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left border-none bg-transparent cursor-pointer"
                                        >
                                            <i className="fas fa-sign-out-alt w-5"></i>
                                            <span className="font-medium">Sign Out</span>
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-8 mt-16">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
