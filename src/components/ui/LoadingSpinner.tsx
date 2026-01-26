import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  isDark?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

/**
 * Modern Loading Spinner with HeroUI-inspired design
 * Shows beautiful animated loading state
 * @example
 * <LoadingSpinner size="lg" message="Loading..." isDark={isDark} />
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  isDark = false,
  color = 'primary',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const colorClasses = {
    primary: 'border-t-blue-600 border-r-blue-600',
    secondary: 'border-t-slate-600 border-r-slate-600',
    success: 'border-t-emerald-500 border-r-emerald-500',
    warning: 'border-t-amber-500 border-r-amber-500',
    danger: 'border-t-red-500 border-r-red-500',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className={`${sizeClasses[size]} border-4 ${colorClasses[color]} border-b-transparent border-l-transparent rounded-full`}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className={`absolute inset-0 ${sizeClasses[size]} border-4 border-t-transparent border-r-transparent border-b-blue-300/40 border-l-blue-300/40 rounded-full`}
        />
      </div>
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`font-medium tracking-tight ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

export default LoadingSpinner;
