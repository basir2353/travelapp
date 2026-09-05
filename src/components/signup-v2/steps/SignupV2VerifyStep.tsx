import React, { useEffect, useState } from 'react';
import { Mail, Pencil } from 'lucide-react';
import { SignupV2OtpInput } from '../SignupV2OtpInput';
import type { RegisterV2StepProps } from '../../../types/registerV2';

interface VerifyStepProps extends RegisterV2StepProps {
  maskedEmail: string;
  onEditEmail: () => void;
  onComplete: (code: string) => void;
  onResend: () => Promise<void>;
  resending?: boolean;
}

export function SignupV2VerifyStep({
  form,
  errors,
  update,
  maskedEmail,
  onEditEmail,
  onComplete,
  onResend,
  resending = false
}: VerifyStepProps) {
  const [resendIn, setResendIn] = useState(30);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const handleResend = async () => {
    await onResend();
    setResendIn(30);
    update({ otp: '' });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-sand-50 px-4 py-3">
        <span className="truncate text-[14px] font-bold text-ink">{maskedEmail}</span>
        <button
          type="button"
          onClick={onEditEmail}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] font-bold text-sea-600 underline-offset-4 hover:underline">
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </button>
      </div>

      <SignupV2OtpInput
        value={form.otp}
        error={Boolean(errors.otp)}
        onChange={(otp) => {
          update({ otp });
          if (otp.length === 6) onComplete(otp);
        }}
      />

      {errors.otp ?
        <p className="mt-3 text-[13px] font-medium text-coral-600" role="alert">
          {errors.otp}
        </p> :
        null}

      <div className="mt-5 flex items-center justify-center gap-1.5 text-[13px] text-ink-muted">
        <Mail className="h-4 w-4" aria-hidden="true" />
        {resendIn > 0 ?
          <span>Resend code in {resendIn}s</span> :
          <button
            type="button"
            disabled={resending}
            onClick={() => {
              void handleResend();
            }}
            className="font-bold text-sea-600 underline-offset-4 hover:underline disabled:opacity-50">
            {resending ? 'Sending…' : 'Send a new code'}
          </button>}
      </div>
    </div>
  );
}
