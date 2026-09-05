import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, LoaderCircle } from 'lucide-react';
import { SignupV2AuthShell } from '../components/signup-v2/SignupV2AuthShell';
import { SignupV2GradientButton } from '../components/signup-v2/SignupV2GradientButton';
import { SignupV2StepProgress } from '../components/signup-v2/SignupV2StepProgress';
import { SignupV2NameStep } from '../components/signup-v2/steps/SignupV2NameStep';
import { SignupV2ContactStep } from '../components/signup-v2/steps/SignupV2ContactStep';
import { SignupV2VerifyStep } from '../components/signup-v2/steps/SignupV2VerifyStep';
import { SignupV2AccountStep } from '../components/signup-v2/steps/SignupV2AccountStep';
import { SignupV2PreferencesStep } from '../components/signup-v2/steps/SignupV2PreferencesStep';
import { signupV2Services } from '../data/signupV2Services';
import type { RegisterV2Errors, RegisterV2Form } from '../types/registerV2';
import {
  buildInternationalMobile,
  findDialOption
} from '../data/dialCodes';
import {
  signupTraveller,
  suggestSignupUsername,
  saveSignupCreds,
  loginWithRetry,
  loginWithUsernamePassword,
  rememberWalletUserId,
  travellerUserValidation
} from '../services/guestApi';
import {
  issueSignupEmailOtp,
  verifyOtpCode,
  maskOtpDestination,
  markOtpIssued
} from '../services/otpService';
import { formatTravelApiError } from '../components/travel/TravelErrorState';
import { applyTravelCurrencyPreference } from '../hooks/useTravelCurrency';
import { SignupV2AccountReadyScreen } from '../components/signup-v2/SignupV2AccountReadyScreen';

const easing = [0.23, 1, 0.32, 1] as const;

const stepLabels = ['Your name', 'Contact', 'Verify', 'Account', 'Preferences'];

const stepCopy = [
  {
    title: 'What should we\ncall you?',
    subtitle: 'Use the names on your passport — airlines and visa offices check them.'
  },
  {
    title: 'How do we\nreach you?',
    subtitle: 'Your number signs you in and carries tickets, gate changes and visa updates.'
  },
  {
    title: 'Verify your\nemail',
    subtitle: 'Enter the 6-digit code we just sent you. It expires in 10 minutes.'
  },
  {
    title: 'Create your\naccount',
    subtitle: 'Pick a username and a password for KTA Travel.'
  },
  {
    title: 'Set up\nyour feed',
    subtitle: 'Tell us what you book and which currency you pay in.'
  }
];

const emptyForm: RegisterV2Form = {
  firstName: '',
  middleName: '',
  lastName: '',
  dialCode: '+251',
  phone: '',
  email: '',
  otp: '',
  username: '',
  password: '',
  acceptedTerms: false,
  interests: signupV2Services.map((service) => service.id),
  currency: 'ETB',
  homeAirport: ''
};

function dialCodeToApp(dialCode: string): string {
  return dialCode.replace(/\D/g, '') || '251';
}

function syncToParentForm(form: RegisterV2Form) {
  const dial = dialCodeToApp(form.dialCode);
  const dialOption = findDialOption(dial);
  const phone = (form.phone || '').replace(/\D/g, '');
  const phoneNormalized = buildInternationalMobile(dialOption.dial, phone);

  applyTravelCurrencyPreference(form.currency);

  return {
    title: 'Mr',
    firstName: form.firstName.trim(),
    middleName: form.middleName.trim(),
    lastName: form.lastName.trim(),
    phone,
    dialCode: dial,
    dialIso: dialOption.iso,
    email: form.email.trim().toLowerCase(),
    username: form.username.trim() || suggestSignupUsername(form.firstName, form.lastName),
    password: form.password,
    dob: '1990-01-01',
    gender: 'male',
    country: 'Ethiopia',
    countryId: 61,
    countryCode: 'ET',
    region: 'Addis Ababa',
    city: 'Addis Ababa',
    streetAddress: form.homeAirport.trim() || 'Addis Ababa',
    postCode: '1000',
    travellerId: undefined as number | undefined
  };
}

export function RegisterV2Screen({
  onBack,
  onGoLogin,
  onComplete,
  formData,
  setFormData
}: {
  onBack: () => void;
  onGoLogin?: (email?: string) => void;
  onComplete: () => void;
  formData: any;
  setFormData: (v: any) => void;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegisterV2Form>(() => ({
    ...emptyForm,
    firstName: formData.firstName || '',
    middleName: formData.middleName || '',
    lastName: formData.lastName || '',
    dialCode: formData.dialCode ? `+${formData.dialCode.replace(/\D/g, '')}` : '+251',
    phone: formData.phone || '',
    email: formData.email || '',
    username: formData.username || ''
  }));
  const [errors, setErrors] = useState<RegisterV2Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [checkingContact, setCheckingContact] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [showAccountReady, setShowAccountReady] = useState(false);
  const [signupReady, setSignupReady] = useState(false);

  const update = (patch: Partial<RegisterV2Form>) => {
    setForm((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      Object.keys(patch).forEach((key) => delete next[key as keyof RegisterV2Form]);
      return next;
    });
    setFlowError(null);
  };

  const fullName = [form.firstName, form.middleName, form.lastName]
    .filter((part) => part.trim())
    .join(' ')
    .trim() || 'Traveller';

  const emailTo = form.email.trim().toLowerCase();
  const dial = dialCodeToApp(form.dialCode);
  const dialOption = findDialOption(dial);
  const phoneNormalized = buildInternationalMobile(dialOption.dial, form.phone.replace(/\D/g, ''));

  const sendEmailOtp = async () => {
    const sent = await issueSignupEmailOtp(emailTo, fullName);
    if (!sent.ok) {
      markOtpIssued({ destination: emailTo, channel: 'email' });
    }
    return sent;
  };

  const validate = (index: number): RegisterV2Errors => {
    const next: RegisterV2Errors = {};

    if (index === 0) {
      if (form.firstName.trim().length < 2) next.firstName = 'Enter your first name.';
      if (form.lastName.trim().length < 2) next.lastName = 'Enter your last name.';
    }
    if (index === 1) {
      if (form.phone.replace(/\D/g, '').length < 7) next.phone = 'Enter your full mobile number.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo)) {
        next.email = 'Enter a valid email address.';
      }
    }
    if (index === 2 && form.otp.length < 6) {
      next.otp = 'Enter the full 6-digit code.';
    }
    if (index === 3) {
      if (!/^[a-zA-Z0-9_.]{3,}$/.test(form.username)) {
        next.username = 'Usernames are 3+ letters, numbers, dots or underscores.';
      }
      if (form.password.length < 8) next.password = 'Use at least 8 characters.';
      if (!form.acceptedTerms) next.acceptedTerms = 'Please accept the terms to continue.';
    }
    if (index === 4 && form.interests.length === 0) {
      next.interests = 'Choose at least one service.';
    }

    return next;
  };

  const handleVerifyOtp = async (code: string) => {
    if (code.length < 6 || verifyingOtp) return;
    setVerifyingOtp(true);
    setFlowError(null);
    try {
      const verified = await verifyOtpCode(emailTo, code, 'email');
      if (!verified.ok) {
        setErrors({ otp: verified.message || "That code doesn't match. Try again." });
        return;
      }
      setErrors({});
      setStep(3);
    } catch (err) {
      setErrors({
        otp: formatTravelApiError(err, "That code doesn't match. Try again.")
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const goNext = async () => {
    const nextErrors = validate(step);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (step === 1) {
      setCheckingContact(true);
      setFlowError(null);
      try {
        const [emailLookup, phoneLookup] = await Promise.all([
          travellerUserValidation('Email', emailTo),
          phoneNormalized ?
            travellerUserValidation('Phone', phoneNormalized) :
            Promise.resolve(null)
        ]);
        if (emailLookup.success && emailLookup.exists) {
          setFlowError(
            emailLookup.username ?
              `This email is already registered (username: ${emailLookup.username}). Log in instead.` :
              'This email is already registered. Log in instead.'
          );
          return;
        }
        if (phoneLookup?.success && phoneLookup.exists) {
          setFlowError('This phone is already registered. Use a different number or log in.');
          return;
        }

        const sent = await sendEmailOtp();
        if (!sent.ok) {
          setFlowError(sent.message || 'Could not send verification code');
          return;
        }
        setStep(2);
      } catch (err) {
        setFlowError(formatTravelApiError(err, 'Could not continue'));
      } finally {
        setCheckingContact(false);
      }
      return;
    }

    if (step === 2) {
      await handleVerifyOtp(form.otp);
      return;
    }

    if (step === 3 && !form.username.trim()) {
      update({ username: suggestSignupUsername(form.firstName, form.lastName) });
    }

    if (step < stepLabels.length - 1) {
      setStep(step + 1);
      return;
    }

    setSubmitting(true);
    setFlowError(null);
    setShowAccountReady(true);
    setSignupReady(false);
    try {
      const synced = syncToParentForm(form);
      const result = await signupTraveller({
        travellerId: 0,
        title: synced.title,
        firstName: synced.firstName,
        middleName: synced.middleName,
        lastName: synced.lastName,
        dateOfBirth: synced.dob,
        gender: synced.gender,
        email: synced.email,
        username: synced.username,
        password: synced.password,
        streetAddress: synced.streetAddress,
        city: synced.city,
        state: synced.region,
        postCode: synced.postCode,
        mobile: phoneNormalized || synced.phone
      });

      if (!result.success) {
        throw new Error(result.message || 'Signup failed');
      }

      saveSignupCreds({
        username: synced.username,
        password: synced.password,
        email: synced.email
      });

      let resolvedId = result.travellerId;
      const login = await loginWithRetry(
        loginWithUsernamePassword,
        synced.username,
        synced.password,
        3
      );
      if (login.success && login.session?.userId) {
        resolvedId = login.session.userId;
        rememberWalletUserId({
          userId: resolvedId,
          email: synced.email,
          username: synced.username,
          phone: phoneNormalized || synced.phone
        });
      }

      const nextForm = { ...synced, travellerId: resolvedId };
      setFormData(nextForm);
      try {
        localStorage.setItem(
          'mkash-profile',
          JSON.stringify({ ...nextForm, password: undefined })
        );
        localStorage.removeItem('mkash-traveller-session');
      } catch {
        // ignore
      }
      setSignupReady(true);
    } catch (err) {
      setShowAccountReady(false);
      setFlowError(formatTravelApiError(err, 'Signup failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 0) {
      onBack();
      return;
    }
    setErrors({});
    setFlowError(null);
    setStep(step - 1);
  };

  const copy = stepCopy[step];
  const isLastStep = step === stepLabels.length - 1;
  const maskedEmail = maskOtpDestination(emailTo || form.email, 'email');
  const busy = submitting || checkingContact || verifyingOtp;
  const displayName = form.username.trim() || form.firstName.trim() || 'Traveller';

  if (showAccountReady) {
    return (
      <SignupV2AccountReadyScreen
        displayName={displayName}
        ready={signupReady}
        onComplete={onComplete}
        onSkip={onComplete}
      />
    );
  }

  return (
    <SignupV2AuthShell
      title={copy.title}
      subtitle={
        step === 2 ?
          `Enter the 6-digit code we sent to ${maskedEmail}.` :
          copy.subtitle
      }
      onBack={goBack}
      footer={
        <>
          <SignupV2GradientButton
            type="button"
            onClick={() => {
              void goNext();
            }}
            shimmer={isLastStep && !submitting}
            disabled={busy || (step === 2 && form.otp.length < 6)}>
            {submitting ?
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                Creating account
              </> :
              checkingContact ?
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                  Checking…
                </> :
                verifyingOtp ?
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Verifying…
                  </> :
                  isLastStep ?
                    'Create account' :
                    <>
                      {step === 2 ? 'Verify and continue' : 'Continue'}
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </>
            }
          </SignupV2GradientButton>
          {step === 0 && onGoLogin ?
            <button
              type="button"
              onClick={() => onGoLogin(form.email)}
              className="mt-4 w-full py-2 text-center text-[14px] text-ink-muted">
              Already have an account?{' '}
              <span className="font-bold text-sea-600">Sign in</span>
            </button> :
            null}
        </>
      }>
      <div className="mt-6">
        <SignupV2StepProgress steps={stepLabels} current={step} />
      </div>

      {flowError ?
        <div className="mt-4 rounded-2xl border border-coral-100 bg-coral-100/40 px-4 py-3 text-[13px] text-coral-600">
          {flowError}
          {flowError.includes('already registered') && onGoLogin ?
            <button
              type="button"
              onClick={() => onGoLogin(emailTo)}
              className="mt-2 block font-bold text-sea-600 underline-offset-4 hover:underline">
              Log in instead
            </button> :
            null}
        </div> :
        null}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.24, ease: easing }}
          className="mt-6 min-w-0">
          {step === 0 ? <SignupV2NameStep form={form} errors={errors} update={update} /> : null}
          {step === 1 ? <SignupV2ContactStep form={form} errors={errors} update={update} /> : null}
          {step === 2 ?
            <SignupV2VerifyStep
              form={form}
              errors={errors}
              update={update}
              maskedEmail={maskedEmail}
              onEditEmail={() => setStep(1)}
              onComplete={(code) => {
                void handleVerifyOtp(code);
              }}
              onResend={async () => {
                setResendingOtp(true);
                try {
                  await sendEmailOtp();
                } finally {
                  setResendingOtp(false);
                }
              }}
              resending={resendingOtp}
            /> :
            null}
          {step === 3 ? <SignupV2AccountStep form={form} errors={errors} update={update} /> : null}
          {step === 4 ? <SignupV2PreferencesStep form={form} errors={errors} update={update} /> : null}
        </motion.div>
      </AnimatePresence>
    </SignupV2AuthShell>
  );
}
