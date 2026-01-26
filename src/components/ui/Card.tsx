import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  isDark?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'bordered' | 'flat' | 'shadow';
}

/**
 * Modern Card Component with HeroUI-inspired design
 * Generic container for content with beautiful styling
 * @example
 * <Card isDark={isDark} variant="shadow">
 *   <h2>Title</h2>
 *   <p>Content</p>
 * </Card>
 */
const Card: React.FC<CardProps> = ({
  children,
  className = '',
  isDark = false,
  onClick,
  variant = 'default',
}) => {
  const variantClasses = {
    default: isDark
      ? 'bg-slate-800/80 border-slate-700/50 shadow-xl shadow-slate-900/20 backdrop-blur-xl'
      : 'bg-white/80 border-slate-200/60 shadow-xl shadow-slate-200/50 backdrop-blur-xl',
    bordered: isDark
      ? 'bg-transparent border-2 border-slate-600 hover:border-slate-500'
      : 'bg-transparent border-2 border-slate-300 hover:border-slate-400',
    flat: isDark ? 'bg-slate-800/50 border-transparent' : 'bg-slate-50 border-transparent',
    shadow: isDark
      ? 'bg-slate-800/90 border-slate-700/30 shadow-2xl shadow-slate-900/40 hover:shadow-slate-900/60'
      : 'bg-white/90 border-slate-100 shadow-2xl shadow-slate-300/40 hover:shadow-slate-300/60',
  };

  return (
    <div
      className={`p-6 rounded-3xl border transition-all duration-300 ${variantClasses[variant]} ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export default Card;
