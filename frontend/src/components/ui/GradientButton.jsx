import React from 'react';
import { motion } from 'motion/react';

export default function GradientButton({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'gradient' | 'outline' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  type = 'button',
  ...props
}) {
  const baseStyles = 'relative inline-flex items-center justify-center font-semibold rounded-3xl overflow-hidden transition-all duration-300 select-none outline-none focus:outline-none';
  
  const sizes = {
    sm: 'px-5 py-2 text-sm rounded-2xl',
    md: 'px-7 py-3 text-base rounded-3xl',
    lg: 'px-9 py-4 text-lg rounded-[25px]',
  };

  const variants = {
    primary: 'text-white bg-gradient-to-r from-primary-500 to-primary-600 shadow-glow-primary hover:shadow-[0_0_30px_rgba(255,138,91,0.5)] border border-primary-500/20',
    secondary: 'text-dark-800 bg-white/60 border border-dark-200 hover:bg-white hover:border-primary-300',
    gradient: 'text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 shadow-glow-primary hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] border border-primary-500/20',
    outline: 'text-primary-600 bg-transparent border border-primary-500 hover:bg-primary-50 hover:border-primary-600 shadow-[0_0_15px_rgba(255,138,91,0.1)]',
    danger: 'text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.2)] border border-red-500/20'
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none';

  return (
    <motion.button
      type={type}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${disabled || loading ? disabledStyles : ''} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          {Icon && <Icon className="text-xl" />}
          {children}
        </span>
      )}
    </motion.button>
  );
}
