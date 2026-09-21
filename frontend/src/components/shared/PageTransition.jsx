import React from 'react';
import { motion } from 'motion/react';

export default function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className={`w-full min-h-screen flex flex-col ${className}`}
    >
      {children}
    </motion.div>
  );
}
