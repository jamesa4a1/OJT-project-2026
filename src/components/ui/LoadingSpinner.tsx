import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  isDark?: boolean;
}

/**
 * Loading Spinner Component
 * Shows animated loading state
 * @example
 * <LoadingSpinner size="lg" message="Loading..." isDark={isDark} />
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  isDark = false,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={`${sizeClasses[size]} border-4 border-t-blue-500 border-r-blue-500 border-b-slate-200 border-l-slate-200 rounded-full`}
      />
      {message && (
        <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
