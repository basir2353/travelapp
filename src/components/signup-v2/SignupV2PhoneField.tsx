import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { CountryFlag } from '../CountryFlag';

export const signupV2DialCodes = [
  { code: '+44', iso: 'GB', country: 'United Kingdom' },
  { code: '+251', iso: 'ET', country: 'Ethiopia' },
  { code: '+971', iso: 'AE', country: 'United Arab Emirates' },
  { code: '+1', iso: 'US', country: 'United States' },
  { code: '+254', iso: 'KE', country: 'Kenya' }
];

interface PhoneFieldProps {
  id: string;
  label: string;
  dialCode: string;
  onDialCodeChange: (code: string) => void;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function SignupV2PhoneField({
  id,
  label,
  dialCode,
  onDialCodeChange,
  value,
  onChange,
  error
}: PhoneFieldProps) {
  const [focused, setFocused] = useState(false);
  const active =
    signupV2DialCodes.find((item) => item.code === dialCode) ?? signupV2DialCodes[1];

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-semibold text-ink">
        {label}
      </label>
      <div className="flex gap-2.5">
        <div
          className={`relative flex h-14 shrink-0 items-center rounded-2xl border bg-sand-50 pl-3.5 pr-2 transition-colors duration-150 ease-swift ${
            error ? 'border-coral-500' : 'border-line'
          }`}>
          <CountryFlag iso={active.iso} size={18} className="mr-1.5" />
          <span className="text-[15px] font-semibold text-ink">{active.code}</span>
          <ChevronDown className="ml-1 h-4 w-4 text-ink-soft" aria-hidden="true" />
          <select
            aria-label="Country dialling code"
            value={dialCode}
            onChange={(event) => onDialCodeChange(event.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0">
            {signupV2DialCodes.map((item) =>
              <option key={item.code} value={item.code}>
                {item.country} ({item.code})
              </option>
            )}
          </select>
        </div>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/[^\d\s]/g, ''))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="987654321"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-14 w-full rounded-2xl border bg-sand-50 px-4 text-[15px] font-medium tracking-wide text-ink outline-none transition-colors duration-150 ease-swift placeholder:font-normal placeholder:text-ink-soft ${
            error ?
              'border-coral-500 bg-coral-500/5' :
              focused ?
                'border-sea-500 bg-white' :
                'border-line'
          }`}
        />
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
        null}
    </div>
  );
}
