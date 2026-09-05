import React, { useEffect, useState } from 'react';
import { AtSign, Check, LoaderCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { SignupV2Field } from '../SignupV2Field';
import { SignupV2PasswordField } from '../SignupV2PasswordField';
import { travellerUserValidation } from '../../../services/guestApi';
import type { RegisterV2StepProps } from '../../../types/registerV2';

type Availability = 'idle' | 'checking' | 'available' | 'taken';

export function SignupV2AccountStep({ form, errors, update }: RegisterV2StepProps) {
  const [availability, setAvailability] = useState<Availability>('idle');
  const username = form.username;

  useEffect(() => {
    if (!/^[a-zA-Z0-9_.]{3,}$/.test(username)) {
      setAvailability('idle');
      return;
    }
    setAvailability('checking');
    const timer = window.setTimeout(async () => {
      try {
        const lookup = await travellerUserValidation('Username', username);
        setAvailability(lookup.success && lookup.exists ? 'taken' : 'available');
      } catch {
        setAvailability('available');
      }
    }, 550);
    return () => window.clearTimeout(timer);
  }, [username]);

  const suggestions =
    availability === 'taken' ?
      [`${username}.et`, `${username}${new Date().getFullYear() % 100}`] :
      [];

  return (
    <div className="space-y-4">
      <SignupV2Field
        id="register-username"
        label="Create a username"
        value={username}
        onChange={(value) => update({ username: value.replace(/\s/g, '').toLowerCase() })}
        placeholder="amara.osei"
        icon={AtSign}
        autoComplete="username"
        error={errors.username}
        hint={
          availability === 'available' ?
            undefined :
            '3+ characters — letters, numbers, dots or underscores.'
        }>
        {availability !== 'idle' ?
          <span className="absolute right-4 flex items-center" aria-live="polite">
            {availability === 'checking' ?
              <LoaderCircle className="h-4 w-4 animate-spin text-ink-soft" aria-hidden="true" /> :
              availability === 'available' ?
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-sea-600">
                  <Check className="h-3 w-3 text-white" aria-hidden="true" />
                </motion.span> :
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-coral-500">
                  <X className="h-3 w-3 text-white" aria-hidden="true" />
                </span>}
          </span> :
          null}
      </SignupV2Field>

      {availability === 'available' ?
        <p className="-mt-2 text-[13px] font-semibold text-sea-600">
          @{username} is available.
        </p> :
        null}

      {suggestions.length > 0 ?
        <div className="-mt-2">
          <p className="text-[13px] font-medium text-coral-600">
            @{username} is taken. Try one of these:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((suggestion) =>
              <button
                key={suggestion}
                type="button"
                onClick={() => update({ username: suggestion })}
                className="whitespace-nowrap rounded-xl border border-line bg-white px-3 py-1.5 text-[13px] font-bold text-ink transition-colors duration-150 ease-swift hover:bg-sand-50">
                @{suggestion}
              </button>
            )}
          </div>
        </div> :
        null}

      <SignupV2PasswordField
        id="register-password"
        label="Password"
        value={form.password}
        onChange={(password) => update({ password })}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        error={errors.password}
        showStrength
      />

      <div className="pt-1">
        <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-ink-muted">
          <input
            type="checkbox"
            checked={form.acceptedTerms}
            onChange={(event) => update({ acceptedTerms: event.target.checked })}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-sea-600 focus:ring-sea-500"
          />
          <span>
            I agree to the <span className="font-bold text-sea-600">travel terms</span> and{' '}
            <span className="font-bold text-sea-600">privacy policy</span>.
          </span>
        </label>
        {errors.acceptedTerms ?
          <p className="mt-2 text-[13px] font-medium text-coral-600" role="alert">
            {errors.acceptedTerms}
          </p> :
          null}
      </div>
    </div>
  );
}
