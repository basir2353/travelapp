import React from 'react';
import { User } from 'lucide-react';
import { SignupV2Field } from '../SignupV2Field';
import type { RegisterV2StepProps } from '../../types/registerV2';

export function SignupV2NameStep({ form, errors, update }: RegisterV2StepProps) {
  return (
    <div className="space-y-4">
      <SignupV2Field
        id="register-first-name"
        label="First name"
        value={form.firstName}
        onChange={(firstName) => update({ firstName })}
        placeholder="Amara"
        icon={User}
        autoComplete="given-name"
        error={errors.firstName}
      />
      <SignupV2Field
        id="register-middle-name"
        label="Middle name"
        value={form.middleName}
        onChange={(middleName) => update({ middleName })}
        placeholder="Optional"
        autoComplete="additional-name"
        error={errors.middleName}
      />
      <SignupV2Field
        id="register-last-name"
        label="Last name"
        value={form.lastName}
        onChange={(lastName) => update({ lastName })}
        placeholder="Osei"
        autoComplete="family-name"
        error={errors.lastName}
        hint="Use the names exactly as printed on your passport — airlines and visa offices check."
      />
    </div>
  );
}
