import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  icon?: LucideIcon;
  error?: string;
  autoComplete?: string;
  hint?: string;
  children?: React.ReactNode;
}

export function SignupV2Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  icon: Icon,
  error,
  autoComplete,
  hint,
  children
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-semibold text-ink">
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon ?
          <Icon
            className={`pointer-events-none absolute left-4 h-[18px] w-[18px] transition-colors duration-150 ease-swift ${
              error ? 'text-coral-500' : focused ? 'text-sea-600' : 'text-ink-soft'
            }`}
            aria-hidden="true"
          /> :
          null}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-14 w-full rounded-2xl border bg-sand-50 text-[15px] font-medium text-ink outline-none transition-colors duration-150 ease-swift placeholder:font-normal placeholder:text-ink-soft ${
            Icon ? 'pl-12' : 'pl-4'
          } ${children ? 'pr-12' : 'pr-4'} ${
            error ?
              'border-coral-500 bg-coral-500/5' :
              'border-line focus:border-sea-500 focus:bg-white'
          }`}
        />
        {children}
      </div>
      {error ?
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          id={`${id}-error`}
          className="mt-2 text-[13px] font-medium text-coral-600">
          {error}
        </motion.p> :
        hint ?
          <p id={`${id}-hint`} className="mt-2 text-[13px] text-ink-soft">
            {hint}
          </p> :
          null}
    </div>
  );
}
