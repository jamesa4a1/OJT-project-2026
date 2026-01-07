import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Homepage = () => {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 
                        relative overflow-hidden">
            
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] 
                                bg-gradient-radial from-blue-100/20 to-transparent rounded-full"></div>
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20"
            >
                {/* Header Section */}
                <motion.div variants={itemVariants} className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                                    bg-blue-100 border border-blue-200 mb-6">
                        <i className="fas fa-landmark text-blue-600"></i>
                        <span className="text-blue-700 font-medium text-sm">
                            Department of Justice • Republic of the Philippines
                        </span>
                    </div>
                </motion.div>

                {/* Main Title */}
                <motion.div variants={itemVariants} className="text-center mb-6">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold 
                                   bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 
                                   bg-clip-text text-transparent tracking-tight mb-4">
                        Tagbilaran City
                    </h1>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-700 mb-2">
                        Hall of Justice
                    </h2>
                </motion.div>

                {/* Subtitle */}
                <motion.div variants={itemVariants} className="text-center mb-10">
                    <div className="inline-flex items-center justify-center gap-4 flex-wrap">
                        <span className="h-px w-12 bg-gradient-to-r from-transparent to-blue-400"></span>
                        <h3 className="text-lg md:text-xl font-semibold text-blue-600 
                                       tracking-wide uppercase m-0">
                            Office of the City Prosecutor
                        </h3>
                        <span className="h-px w-12 bg-gradient-to-l from-transparent to-blue-400"></span>
                    </div>
                </motion.div>

                {/* Decorative Line */}
                <motion.div variants={itemVariants} className="flex justify-center mb-10">
                    <div className="w-full max-w-2xl h-1 rounded-full 
                                    bg-gradient-to-r from-transparent via-blue-500 to-transparent 
                                    opacity-60"></div>
                </motion.div>

                {/* Logo Section */}
                <motion.div 
                    variants={itemVariants}
                    className="flex justify-center mb-12"
                >
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="relative group"
                    >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-blue-400/20 to-blue-500/20 
                                        rounded-full blur-2xl scale-110 opacity-0 group-hover:opacity-100 
                                        transition-opacity duration-500"></div>
                        
                        {/* Logo Container */}
                        <div className="relative p-8 md:p-12 rounded-full 
                                        bg-gradient-to-br from-white to-slate-50 
                                        shadow-2xl shadow-blue-900/10 
                                        border border-slate-200/50">
                            <motion.img 
                                src={logo}
                                alt="Department of Justice Philippines Official Seal"
                                className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 
                                           object-contain drop-shadow-lg"
                                initial={{ rotate: 0 }}
                                animate={{ rotate: 0 }}
                                whileHover={{ rotate: 5 }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </motion.div>
                </motion.div>

                {/* CTA Section */}
                <motion.div variants={itemVariants} className="text-center">
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/cases')}
                        className="inline-flex items-center gap-3 px-8 py-4 
                                   bg-gradient-to-r from-blue-600 to-blue-700 
                                   hover:from-blue-700 hover:to-blue-800
                                   text-white font-semibold text-lg rounded-2xl 
                                   shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40
                                   transition-all duration-300 border-none cursor-pointer"
                        aria-label="Access the case management system"
                    >
                        <i className="fas fa-folder-open"></i>
                        Access Case Management
                        <i className="fas fa-arrow-right text-blue-300"></i>
                    </motion.button>
                </motion.div>

                {/* Stats Section */}
                <motion.div 
                    variants={itemVariants}
                    className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
                >
                    {[
                        { icon: 'fa-gavel', label: 'Digital Docketing', desc: 'Modern case tracking' },
                        { icon: 'fa-shield-halved', label: 'Secure System', desc: 'Protected data' },
                        { icon: 'fa-clock', label: '24/7 Access', desc: 'Always available' },
                    ].map((item, index) => (
                        <motion.div
                            key={index}
                            whileHover={{ y: -5 }}
                            className="flex flex-col items-center p-6 rounded-2xl 
                                       bg-white/60 backdrop-blur-sm border border-slate-200/50 
                                       shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 
                                            flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                                <i className={`fas ${item.icon} text-white text-xl`}></i>
                            </div>
                            <h4 className="font-semibold text-slate-800 mb-1">{item.label}</h4>
                            <p className="text-sm text-slate-500">{item.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Homepage;