import React from 'react';
import { motion } from 'motion/react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0B0F]">
      {/* 3D-like Glowing Spinner */}
      <div className="relative w-20 h-20 mb-8">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-t-primary-500 border-r-secondary-500 border-b-accent-500 border-l-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-4 border-t-secondary-500 border-r-accent-500 border-b-primary-500 border-l-transparent opacity-75"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        />
        <div className="absolute inset-4 rounded-full bg-[#0B0B0F] flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
        </div>
      </div>

      {/* Brand Text */}
      <motion.h2
        className="text-2xl font-extrabold font-sora tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        COLLEGE EVENT HUB
      </motion.h2>

      {/* Status Msg */}
      <motion.div
        className="flex items-center gap-1 text-sm text-dark-400 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <span>Loading experience</span>
        <span className="w-1 h-1 rounded-full bg-dark-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1 h-1 rounded-full bg-dark-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1 h-1 rounded-full bg-dark-400 animate-bounce" />
      </motion.div>
    </div>
  );
}
