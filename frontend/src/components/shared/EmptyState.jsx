import React from 'react';
import { motion } from 'motion/react';
import GradientButton from '../ui/GradientButton';

export default function EmptyState({
  icon: Icon,
  title = 'No Data Found',
  description = 'There is nothing to display here at the moment.',
  actionText,
  onAction,
  actionIcon
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 glass rounded-3xl border border-white/5 my-6 max-w-lg mx-auto">
      {Icon && (
        <div className="relative mb-6 p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-dark-400 text-5xl shadow-[0_0_20px_rgba(255,255,255,0.02)]">
          <Icon />
          <div className="absolute inset-0 bg-primary-500/10 blur-xl rounded-full" />
        </div>
      )}
      <h3 className="text-xl font-bold font-sora text-white mb-2">{title}</h3>
      <p className="text-sm text-dark-300 font-poppins max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <GradientButton
          variant="secondary"
          size="sm"
          onClick={onAction}
          icon={actionIcon}
        >
          {actionText}
        </GradientButton>
      )}
    </div>
  );
}
