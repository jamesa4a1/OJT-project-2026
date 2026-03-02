import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface ToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  onClose: () => void;
}

/**
 * Toast Notification Component
 * Displays notifications in the upper right corner with smooth fade in/out animations
 * @example
 * <Toast type="success" message="Case added successfully!" onClose={handleClose} />
 */
const Toast: React.FC<ToastProps> = ({
  type,
  message,
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      icon: 'fas fa-check-circle',
      borderColor: 'border-emerald-400',
      shadowColor: 'shadow-emerald-500/30',
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500 to-rose-500',
      icon: 'fas fa-exclamation-circle',
      borderColor: 'border-red-400',
      shadowColor: 'shadow-red-500/30',
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      icon: 'fas fa-info-circle',
      borderColor: 'border-blue-400',
      shadowColor: 'shadow-blue-500/30',
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
      icon: 'fas fa-exclamation-triangle',
      borderColor: 'border-amber-400',
      shadowColor: 'shadow-amber-500/30',
    },
  };

  const config = typeConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -20, x: 20 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }}
      className={`${config.bg} fixed top-20 right-6 max-w-md px-6 py-4 rounded-2xl 
                   shadow-2xl ${config.shadowColor} backdrop-blur-md border-2 ${config.borderColor}
                   flex items-center gap-4 text-white z-[9999] pointer-events-auto
                   hover:shadow-2xl transition-all duration-300`}
    >
      {/* Icon with animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
          delay: 0.1,
        }}
        className="flex-shrink-0"
      >
        <i className={`${config.icon} text-2xl`}></i>
      </motion.div>

      {/* Message text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex-1"
      >
        <p className="font-semibold text-sm leading-tight">{message}</p>
      </motion.div>

      {/* Close button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
        className="flex-shrink-0 ml-2 p-1 hover:bg-white/20 rounded-lg 
                   transition-all duration-200 cursor-pointer"
        aria-label="Close notification"
      >
        <i className="fas fa-times text-lg"></i>
      </motion.button>

      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className="absolute bottom-0 left-0 h-1 bg-white/40 origin-left rounded-b-2xl"
        style={{ width: '100%' }}
      />
    </motion.div>
  );
};

export default Toast;
