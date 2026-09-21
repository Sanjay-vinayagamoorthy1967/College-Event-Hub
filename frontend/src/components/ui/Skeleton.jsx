import React from 'react';

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`skeleton w-full h-64 ${className}`} />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className="skeleton h-4"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`skeleton rounded-full ${sizeClasses[size]} ${className}`} />
  );
}

export function SkeletonEvent({ className = '' }) {
  return (
    <div className={`glass rounded-3xl border border-white/10 p-5 flex flex-col h-[420px] ${className}`}>
      {/* Poster */}
      <div className="skeleton w-full h-48 rounded-2xl mb-4" />
      {/* Category badge */}
      <div className="skeleton w-20 h-5 rounded-full mb-3" />
      {/* Title */}
      <div className="skeleton w-3/4 h-6 mb-2" />
      {/* Date/venue */}
      <div className="skeleton w-1/2 h-4 mb-4" />
      {/* Bottom spacer */}
      <div className="mt-auto flex justify-between items-center border-t border-white/5 pt-4">
        <div className="skeleton w-16 h-5" />
        <div className="skeleton w-24 h-9 rounded-2xl" />
      </div>
    </div>
  );
}
