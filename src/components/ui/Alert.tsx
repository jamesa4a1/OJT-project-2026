import React from 'react';
import { motion } from 'framer-motion';

interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose?: () => void;
  autoClose?: number;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Alert/Message Component with HeroUI-inspired design
 * Displays notifications with smooth animations
 * @example
 * <Alert type="success" message="Operation completed!" autoClose={3000} />
 */
const Alert: React.FC<AlertProps> = ({
  type,
  message,
  onClose,
  autoClose,
  icon,
  className = '',
}) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const typeConfig = {
    success: {
      bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
      text: 'text-emerald-700',
      border: 'border-emerald-300/60',
      icon: 'fas fa-check-circle',
      glow: 'shadow-emerald-100',
    },
    error: {
      bg: 'bg-gradient-to-r from-red-50 to-rose-50',
      text: 'text-red-700',
      border: 'border-red-300/60',
      icon: 'fas fa-times-circle',
      glow: 'shadow-red-100',
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-50 to-sky-50',
      text: 'text-blue-700',
      border: 'border-blue-300/60',
      icon: 'fas fa-info-circle',
      glow: 'shadow-blue-100',
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
      text: 'text-amber-700',
      border: 'border-amber-300/60',
      icon: 'fas fa-exclamation-triangle',
      glow: 'shadow-amber-100',
    },
  };

  const config = typeConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`${config.bg} ${config.text} border-2 ${config.border} px-5 py-4 rounded-2xl flex items-center justify-between shadow-lg ${config.glow} backdrop-blur-sm ${className}`}
    >
      <div className="flex items-center gap-4">
        {icon ? icon : <i className={`${config.icon} text-xl drop-shadow-sm`}></i>}
        <span className="font-semibold tracking-tight">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-lg hover:opacity-60 transition-all duration-200 hover:scale-110 ml-4"
          aria-label="Close alert"
        >
          <i className="fas fa-times"></i>
        </button>
      )}
    </motion.div>
  );
};

export default Alert;
