import React from 'react';
import { motion } from 'motion/react';

export default function Timeline({ items }) {
  if (!items || items.length === 0) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="relative pl-8 my-6">
      {/* Timeline core line */}
      <div className="timeline-line" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
        className="flex flex-col gap-8"
      >
        {items.map((item, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="relative flex flex-col md:flex-row md:items-baseline gap-2 md:gap-6"
          >
            {/* Timeline Bullet Node */}
            <div className="absolute -left-[30px] top-1.5 w-[15px] h-[15px] rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 border-2 border-white shadow-[0_0_10px_rgba(255,138,91,0.5)] z-10" />

            {/* Time slot */}
            <div className="flex-shrink-0">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold font-sora bg-primary-500/10 border border-primary-500/20 text-primary-600">
                {item.time}
              </span>
            </div>

            {/* Content Details */}
            <div className="flex-1">
              <h4 className="text-base font-bold font-sora text-dark-900 mb-1">
                {item.activity || item.title}
              </h4>
              {(item.description || item.activityDescription) && (
                <p className="text-sm text-dark-600 leading-relaxed font-poppins">
                  {item.description || item.activityDescription}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
