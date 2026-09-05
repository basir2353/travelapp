import React from 'react';
import { motion } from 'framer-motion';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gradient' | 'dark' | 'ghost';
  shimmer?: boolean;
}

export function SignupV2GradientButton({
  children,
  variant = 'gradient',
  shimmer = false,
  className = '',
  disabled,
  ...props
}: GradientButtonProps) {
  const variants = {
    gradient:
      'bg-gradient-to-r from-[#0F3946] via-[#1D6274] to-[#E8756E] text-white shadow-glow disabled:opacity-60',
    dark: 'bg-ink text-white shadow-[0_8px_24px_-10px_rgba(15,21,32,0.7)] disabled:opacity-50',
    ghost: 'bg-white text-ink border border-line disabled:opacity-50'
  };

  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
      disabled={disabled}
      className={`relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-2xl text-[16px] font-semibold transition-colors duration-150 ease-swift disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}>
      {shimmer && !disabled ?
        <motion.span
          aria-hidden="true"
          animate={{ x: ['-120%', '220%'] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" /> :
        null}
      <span className="relative flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
