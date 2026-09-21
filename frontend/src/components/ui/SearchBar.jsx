import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FiSearch } from 'react-icons/fi';

export default function SearchBar({ value, onChange, placeholder = 'Search events...', onSearch }) {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg">
      <motion.div
        className={`relative flex items-center w-full px-5 py-3 rounded-2xl bg-white border transition-all duration-300 shadow-sm ${
          isFocused ? 'border-primary-500 shadow-md' : 'border-[#E5E7EB]'
        }`}
        animate={{ scale: isFocused ? 1.01 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <FiSearch className={`text-xl mr-3 transition-colors duration-300 ${isFocused ? 'text-primary-500' : 'text-dark-500'}`} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent border-none outline-none text-dark-900 placeholder-dark-500 font-poppins text-base"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-dark-500 hover:text-dark-900 text-sm"
          >
            Clear
          </button>
        )}
      </motion.div>
    </form>
  );
}
