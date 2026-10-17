import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glass = true,
  hoverEffect = false,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -3, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      className={`rounded-2xl p-6 transition-all duration-200 ${
        glass
          ? 'glass-card shadow-sm dark:shadow-none'
          : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800'
      } ${hoverEffect ? 'hover:shadow-lg hover:border-brand-500/30 cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};
