import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function CountdownTimer({ targetDate, label = 'Starts In' }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [isCompleted, setIsCompleted] = useState(false);

  function calculateTimeLeft() {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return timeLeft;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      const totalSeconds = remaining.days + remaining.hours + remaining.minutes + remaining.seconds;
      if (totalSeconds === 0) {
        setIsCompleted(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timerItems = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds }
  ];

  if (isCompleted) {
    return (
      <div className="flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold font-sora">
        ✨ EVENT STARTED!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-xs font-semibold text-dark-700 uppercase tracking-wider">{label}</span>}
      <div className="grid grid-cols-4 gap-2">
        {timerItems.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center justify-center bg-[#F0F9FF] border border-[#BAE6FD] rounded-2xl p-2.5 min-w-[60px] shadow-sm">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={item.value}
                className="text-xl md:text-2xl font-bold font-sora text-dark-900"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                {String(item.value).padStart(2, '0')}
              </motion.span>
            </AnimatePresence>
            <span className="text-[10px] text-dark-600 mt-1 uppercase font-semibold tracking-wide">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
