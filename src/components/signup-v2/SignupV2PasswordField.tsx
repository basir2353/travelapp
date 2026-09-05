import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { SignupV2Field } from './SignupV2Field';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  showStrength?: boolean;
}

const levels = [
  { label: 'Too short', bar: 'bg-coral-500', text: 'text-coral-600' },
  { label: 'Getting there', bar: 'bg-coral-500', text: 'text-coral-600' },
  { label: 'Good password', bar: 'bg-sea-400', text: 'text-sea-700' },
  { label: 'Strong password', bar: 'bg-sea-600', text: 'text-sea-700' }
];

function scorePassword(value: string): number {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 3);
}

export function SignupV2PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  showStrength = false
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const score = scorePassword(value);
  const level = levels[score];

  return (
    <div>
      <SignupV2Field
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        icon={Lock}
        error={error}
        autoComplete={autoComplete}>
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-soft transition-colors duration-150 ease-swift hover:bg-sand-100 hover:text-ink">
          {visible ?
            <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" /> :
            <Eye className="h-[18px] w-[18px]" aria-hidden="true" />}
        </button>
      </SignupV2Field>
      {showStrength && value.length > 0 && !error ?
        <div className="mt-2.5 flex items-center gap-3">
          <div className="flex flex-1 gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((index) =>
              <span
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors duration-200 ease-swift ${
                  index <= score ? level.bar : 'bg-sand-200'
                }`}
              />
            )}
          </div>
          <span className={`text-xs font-medium ${level.text}`} aria-live="polite">
            {level.label}
          </span>
        </div> :
        null}
    </div>
  );
}
