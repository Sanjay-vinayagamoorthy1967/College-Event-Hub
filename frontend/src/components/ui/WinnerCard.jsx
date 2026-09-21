import React from 'react';
import { motion } from 'motion/react';
import { FiAward } from 'react-icons/fi';
import GlassCard from './GlassCard';
import { formatCurrency } from '../../utils/helpers';

export default function WinnerCard({ result }) {
  const { position, prizeAmount, participantId } = result;
  
  if (!participantId) return null;

  const isTeam = participantId.registrationType === 'team';
  const name = isTeam ? participantId.teamName : participantId.fullName;
  const photo = participantId.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

  let style = {
    color: 'text-yellow-600',
    border: 'border-yellow-400',
    bg: 'bg-yellow-50',
    badge: 'bg-yellow-400 text-yellow-900',
    label: 'FIRST PRIZE',
    medal: '🥇'
  };

  if (position === 2) {
    style = {
      color: 'text-slate-500',
      border: 'border-slate-300',
      bg: 'bg-slate-50',
      badge: 'bg-slate-300 text-slate-800',
      label: 'SECOND PRIZE',
      medal: '🥈'
    };
  } else if (position === 3) {
    style = {
      color: 'text-amber-700',
      border: 'border-amber-400',
      bg: 'bg-amber-50',
      badge: 'bg-amber-400 text-amber-900',
      label: 'THIRD PRIZE',
      medal: '🥉'
    };
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard className={`relative overflow-hidden border-2 ${style.border} p-0 h-full flex flex-col`}>
        <div className={`p-4 flex items-center justify-between ${style.bg} border-b ${style.border}`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{style.medal}</span>
            <h4 className={`font-black font-sora tracking-wider text-sm ${style.color}`}>
              {style.label}
            </h4>
          </div>
          {prizeAmount > 0 && (
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${style.badge}`}>
              {formatCurrency(prizeAmount)}
            </span>
          )}
        </div>
        
        <div className="p-6 flex flex-col items-center text-center flex-1">
          <div className={`w-24 h-24 rounded-full p-1 border-4 ${style.border} mb-4`}>
            <img 
              src={photo} 
              alt={name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          
          <h3 className="text-xl font-bold text-dark-900 font-sora mb-1">
            {isTeam && <span className="text-sm text-dark-500 block mb-1">Team</span>}
            {name}
          </h3>
          
          {isTeam && (
            <p className="text-sm font-semibold text-dark-600 mb-2">
              Leader: {participantId.fullName}
            </p>
          )}

          <div className="mt-auto pt-4 w-full">
            <p className="text-sm font-bold text-dark-700 mb-0.5">
              College: <span className="font-medium text-dark-600">{participantId.collegeName}</span>
            </p>
            <p className="text-xs text-dark-500 font-medium uppercase tracking-wide">
              {participantId.department}
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
