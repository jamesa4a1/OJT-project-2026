import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  isDark?: boolean;
  onClick?: () => void;
}

/**
 * Card Component
 * Generic container for content with consistent styling
 * @example
 * <Card isDark={isDark}>
 *   <h2>Title</h2>
 *   <p>Content</p>
 * </Card>
 */
const Card: React.FC<CardProps> = ({ children, className = '', isDark = false, onClick }) => {
  return (
    <div
      className={`p-6 rounded-2xl border shadow-sm transition-all hover:shadow-md ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export default Card;
