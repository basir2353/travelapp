import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
}

export function SignupV2OtpInput({
  value,
  onChange,
  length = 6,
  error = false
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const setDigit = (index: number, digit: string) => {
    const next = value.split('');
    next[index] = digit;
    onChange(next.join('').slice(0, length));
  };

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setDigit(index, '');
      return;
    }
    if (digits.length > 1) {
      onChange((value.slice(0, index) + digits).slice(0, length));
      refs.current[Math.min(index + digits.length, length - 1)]?.focus();
      return;
    }
    setDigit(index, digits);
    if (index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus();
  };

  return (
    <motion.div
      animate={error ? { x: [0, -8, 8, -5, 0] } : { x: 0 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      className="flex gap-2.5">
      {Array.from({ length }).map((_, index) =>
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          value={value[index] ?? ''}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={`Digit ${index + 1}`}
          className={`h-14 w-full rounded-2xl border bg-sand-50 text-center text-[20px] font-extrabold text-ink outline-none transition-colors duration-150 ease-swift ${
            error ?
              'border-coral-500 bg-coral-500/5' :
              value[index] ?
                'border-sea-500 bg-white' :
                'border-line focus:border-sea-500 focus:bg-white'
          }`}
        />
      )}
    </motion.div>
  );
}
