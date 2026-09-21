import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { motion, AnimatePresence } from 'motion/react';

export default function Input({
  label,
  name,
  type = 'text',
  register,
  validation,
  error,
  icon: Icon,
  placeholder = '',
  className = '',
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`relative w-full mb-5 ${className}`}>
      {label && (
        <label className={`block text-sm font-medium mb-1.5 transition-all duration-300 ${isFocused ? 'text-primary-500' : 'text-dark-600'}`}>
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-4 text-dark-400 text-lg pointer-events-none transition-colors duration-300 z-10">
            <Icon className={isFocused ? 'text-primary-500' : ''} />
          </div>
        )}
        <input
          type={inputType}
          name={name}
          placeholder={placeholder}
          className={`input-field ${Icon ? 'pl-12' : ''} ${error ? 'border-red-500/50 focus:border-red-500' : ''}`}
          onFocus={() => setIsFocused(true)}
          {...props}
          {...(register ? register(name, validation) : {})}
          onBlur={(e) => {
            setIsFocused(false);
            if (register && register(name).onBlur) {
              register(name).onBlur(e);
            }
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-primary-500 transition-colors z-20 focus:outline-none p-1"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={showPassword ? 'hide' : 'show'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                {showPassword ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
              </motion.div>
            </AnimatePresence>
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium tracking-wide">
          {error.message || error}
        </p>
      )}
    </div>
  );
}
