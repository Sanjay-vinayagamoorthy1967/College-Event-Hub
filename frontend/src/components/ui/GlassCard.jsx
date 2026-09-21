import React from 'react';
import { motion } from 'motion/react';

export default function GlassCard({ children, className = '', hover = true, glow = null, ...props }) {
  const glowClasses = {
    purple: 'shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:shadow-[0_0_40px_rgba(139,92,246,0.3)]',
    pink: 'shadow-[0_0_30px_rgba(236,72,153,0.15)] hover:shadow-[0_0_40px_rgba(236,72,153,0.3)]',
    amber: 'shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:shadow-[0_0_40px_rgba(245,158,11,0.3)]',
    green: 'shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]'
  };

  const baseClass = `glass rounded-3xl p-6 ${glow ? glowClasses[glow] : ''} ${className}`;

  if (hover) {
    return (
      <motion.div
        className={`${baseClass} glass-hover`}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClass} {...props}>
      {children}
    </div>
  );
}
