import React from 'react';
import { motion } from 'motion/react';

export default function FilterChips({ filters, selected, onSelect, multiSelect = false }) {
  const handleSelect = (val) => {
    if (multiSelect) {
      const isSelected = selected.includes(val);
      if (isSelected) {
        onSelect(selected.filter(item => item !== val));
      } else {
        onSelect([...selected, val]);
      }
    } else {
      onSelect(selected === val ? '' : val);
    }
  };

  const isSelected = (val) => {
    return multiSelect ? selected.includes(val) : selected === val;
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-2 flex gap-2.5 mask-edges">
      {filters.map((filter, index) => {
        const active = isSelected(filter.value);
        const isActive = isSelected(filter.value);
        return (
          <motion.button
            key={index}
            type="button"
            onClick={() => handleSelect(filter.value)}
            className={`relative px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 border focus:outline-none ${
              isActive
                ? 'bg-gradient-to-r from-primary-600 to-secondary-500 text-white border-transparent shadow-[0_0_15px_rgba(255,138,91,0.3)]'
                : 'bg-white border-[#E5E7EB] text-dark-600 hover:border-primary-300 hover:text-dark-900 shadow-sm'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {filter.label}
          </motion.button>
        );
      })}
    </div>
  );
}
