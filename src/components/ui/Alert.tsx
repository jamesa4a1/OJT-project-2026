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
 * Alert/Message Component
 * Displays notifications with animation
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
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: 'fas fa-check-circle',
    },
    error: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: 'fas fa-times-circle',
    },
    info: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: 'fas fa-info-circle',
    },
    warning: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: 'fas fa-exclamation-triangle',
    },
  };

  const config = typeConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className={`${config.bg} ${config.text} border ${config.border} p-4 rounded-lg flex items-center justify-between ${className}`}
    >
      <div className="flex items-center gap-3">
        {icon ? icon : <i className={`${config.icon} text-lg`}></i>}
        <span className="font-medium">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-lg hover:opacity-60 transition-opacity"
          aria-label="Close alert"
        >
          <i className="fas fa-times"></i>
        </button>
      )}
    </motion.div>
  );
};

export default Alert;
