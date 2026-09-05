import React from 'react';
import { Mail, ShieldCheck } from 'lucide-react';
import { SignupV2Field } from '../SignupV2Field';
import { SignupV2PhoneField } from '../SignupV2PhoneField';
import type { RegisterV2StepProps } from '../../../types/registerV2';

export function SignupV2ContactStep({ form, errors, update }: RegisterV2StepProps) {
  return (
    <div className="space-y-4">
      <SignupV2PhoneField
        id="register-phone"
        label="Mobile number"
        dialCode={form.dialCode}
        onDialCodeChange={(dialCode) => update({ dialCode })}
        value={form.phone}
        onChange={(phone) => update({ phone })}
        error={errors.phone}
      />
      <SignupV2Field
        id="register-email"
        label="Email address"
        value={form.email}
        onChange={(email) => update({ email })}
        type="email"
        placeholder="you@example.com"
        icon={Mail}
        autoComplete="email"
        error={errors.email}
      />
      <p className="flex items-start gap-2.5 rounded-2xl border border-line bg-sand-50 px-4 py-3 text-[13px] leading-relaxed text-ink-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sea-600" aria-hidden="true" />
        We email a code to this address next. Tickets, gate changes and visa updates go here too.
      </p>
    </div>
  );
}
