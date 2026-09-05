import React from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Delete } from 'lucide-react';

export function NumPad({
  onKey,
  onDelete,
  biometric,
  onBiometric,
  variant = 'default'
}: {
  onKey: (n: string) => void;
  onDelete: () => void;
  biometric?: boolean;
  onBiometric?: () => void;
  variant?: 'default' | 'soft' | 'auth';
}) {
  const isAuth = variant === 'auth';
  const isSoft = variant === 'soft';

  const keyClass = isAuth
    ? 'kta-pin-key h-[50px] w-full max-w-[64px] mx-auto rounded-[14px] text-[19px] font-bold text-[#0B1320] flex items-center justify-center transition-colors duration-150'
    : isSoft
      ? 'h-[58px] w-[58px] mx-auto rounded-full glass-pill text-[22px] font-semibold text-text-primary flex items-center justify-center shadow-ios-xs hover:bg-white/65 active:scale-95 transition-all duration-ios'
      : 'h-16 rounded-ios-lg glass-pill text-[26px] font-semibold text-text-primary flex items-center justify-center hover:bg-white/65 active:scale-95 transition-all duration-ios';

  const actionClass = isAuth
    ? 'kta-pin-key-ghost h-[50px] w-full max-w-[64px] mx-auto rounded-[14px] flex items-center justify-center transition-colors duration-150'
    : isSoft
      ? 'h-[58px] w-[58px] mx-auto rounded-full glass-btn-ghost flex items-center justify-center'
      : 'h-16 rounded-ios-lg glass-btn-ghost flex items-center justify-center';

  return (
    <div
      className={`grid grid-cols-3 w-full ${
        isAuth ? 'max-w-[240px] gap-x-2.5 gap-y-2.5' : 'max-w-[280px] gap-3 pb-nav-safe'
      } ${isAuth ? '' : 'pb-nav-safe'}`}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <motion.button
          key={num}
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => onKey(num.toString())}
          className={keyClass}>
          {num}
        </motion.button>
      ))}
      {biometric ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={onBiometric}
          aria-label="Unlock with biometrics"
          className={
            isAuth
              ? `${actionClass} text-[#1a3d42]`
              : `${actionClass} text-primary bg-primary-light hover:bg-primary-light/80`
          }>
          <Fingerprint
            className={isAuth ? 'w-5 h-5' : 'w-7 h-7'}
            strokeWidth={1.75}
          />
        </motion.button>
      ) : (
        <div />
      )}
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={() => onKey('0')}
        className={keyClass}>
        0
      </motion.button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={onDelete}
        aria-label="Delete"
        className={
          isAuth
            ? `${actionClass} text-slate-500`
            : `${actionClass} text-text-secondary hover:bg-surface-muted`
        }>
        <Delete
          className={isAuth ? 'w-5 h-5' : 'w-5 h-5'}
          strokeWidth={1.75}
        />
      </motion.button>
    </div>
  );
}
