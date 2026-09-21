import React from 'react';
import GlassCard from './GlassCard';
import AnimatedCounter from './AnimatedCounter';

export default function StatsCard({ title, value, icon: Icon, trend, color = 'purple' }) {
  const colorGlows = {
    purple: 'purple',
    pink: 'pink',
    amber: 'amber',
    green: 'green'
  };

  const iconColors = {
    purple: 'text-primary-600 bg-primary-500/10 border border-primary-500/20',
    pink: 'text-secondary-600 bg-secondary-500/10 border border-secondary-500/20',
    amber: 'text-accent-600 bg-accent-500/10 border border-accent-500/20',
    green: 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/20'
  };

  return (
    <GlassCard glow={colorGlows[color]} className="flex items-center gap-5 p-6 hover:translate-y-[-4px]">
      <div className={`p-4 rounded-2xl flex items-center justify-center text-2xl ${iconColors[color]}`}>
        {Icon && <Icon />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs sm:text-sm font-semibold text-dark-600 font-poppins uppercase tracking-wider mb-1 break-words">
          {title}
        </h4>
        <div className="flex items-baseline gap-2.5">
          <span className="text-3xl font-extrabold font-sora text-dark-900">
            {typeof value === 'number' ? (
              <AnimatedCounter end={value} duration={1500} prefix={title.toLowerCase().includes('revenue') ? '₹' : ''} />
            ) : (
              value
            )}
          </span>
          {trend !== undefined && (
            <span className={`text-xs font-bold font-sora px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
