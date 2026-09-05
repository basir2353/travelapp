/**
 * OTP via GuestAPI:
 *   Send (login)  → TravellerPhoneEmail(PhoneEmail) — server delivers SMS/email OTP
 *   Send (signup) → TravellerPhoneEmailSignup(PhoneEmail, Name)
 *   Verify        → UserOTPCheck(otp)
 *
 * No local /api/otp/send, FormSubmit, or Textbelt.
 */

import { requestTravellerOtp, requestSignupOtp, userOtpCheck } from './guestApi';

const OTP_TTL_MS = 10 * 60 * 1000;
const STORAGE_KEY = 'mkash-otp-challenge';

export type OtpChannel = 'sms' | 'email';

type OtpChallenge = {
  destination: string;
  altDestinations: string[];
  channel: OtpChannel;
  expiresAt: number;
};

export type IssueOtpResult = {
  ok: boolean;
  message: string;
  channel: OtpChannel;
  destination: string;
  previewCode?: string;
};

/** Normalize phone to E.164-ish (+digits) or email lowercase. */
export function normalizeDestination(
  destination: string,
  channel: OtpChannel
): string {
  const trimmed = destination.trim();
  if (channel === 'email') return trimmed.toLowerCase();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (trimmed.startsWith('+')) return `+${digits}`;
  return `+${digits}`;
}

function readChallenge(): OtpChallenge | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OtpChallenge;
    if (!Array.isArray(parsed.altDestinations)) parsed.altDestinations = [];
    return parsed;
  } catch {
    return null;
  }
}

function writeChallenge(challenge: OtpChallenge) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(challenge));
}

export function clearOtpChallenge() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length < 6) return phone;
  const cc =
    d.startsWith('92') ? '92' :
    d.startsWith('251') ? '251' :
    d.length > 10 ? d.slice(0, d.length - 10) :
    '';
  const national = cc ? d.slice(cc.length) : d;
  const head = national.slice(0, 2);
  const tail = national.slice(-2);
  return `+${cc || ''}${cc ? ' ' : ''}${head}*** ***${tail}`;
}

/**
 * Ask GuestAPI to send OTP by looking up the phone or email.
 * TravellerPhoneEmail delivers the code server-side.
 */
export async function issueOtp(input: {
  destination: string;
  channel: OtpChannel;
}): Promise<IssueOtpResult> {
  const channel = input.channel;
  const destination = normalizeDestination(input.destination, channel);

  if (channel === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) {
      return {
        ok: false,
        message: 'Invalid email address',
        channel,
        destination
      };
    }
  } else {
    const digits = destination.replace(/\D/g, '');
    if (digits.length < 9) {
      return {
        ok: false,
        message: 'Invalid phone number',
        channel,
        destination
      };
    }
  }

  try {
    const lookup = await requestTravellerOtp(destination);
    if (!lookup.success) {
      return {
        ok: false,
        message:
          lookup.message ||
          (channel === 'sms' ?
            'Could not send SMS code for this phone' :
            'Could not send email code for this address'),
        channel,
        destination
      };
    }

    writeChallenge({
      destination,
      altDestinations: [],
      channel,
      expiresAt: Date.now() + OTP_TTL_MS
    });

    const masked =
      channel === 'email' ? maskOtpDestination(destination, 'email') : maskPhone(destination);

    return {
      ok: true,
      channel,
      destination,
      message:
        channel === 'email' ?
          `Code sent to ${masked}. Check your inbox and spam folder.` :
          `Code sent to ${masked}. Check your SMS messages.`
    };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error ?
          err.message :
          'Could not send verification code',
      channel,
      destination
    };
  }
}

/**
 * Signup-only OTP send — TravellerPhoneEmailSignup(PhoneEmail, Name).
 * Client requirement: do not reuse TravellerPhoneEmail (login lookup) for the
 * signup flow; this variant includes the newly-registered traveller's name.
 */
export async function issueSignupOtp(input: {
  destination: string;
  channel: OtpChannel;
  name: string;
}): Promise<IssueOtpResult> {
  const channel = input.channel;
  const destination = normalizeDestination(input.destination, channel);

  if (channel === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) {
      return { ok: false, message: 'Invalid email address', channel, destination };
    }
  } else {
    const digits = destination.replace(/\D/g, '');
    if (digits.length < 9) {
      return { ok: false, message: 'Invalid phone number', channel, destination };
    }
  }

  try {
    const lookup = await requestSignupOtp(destination, input.name);
    if (!lookup.success) {
      return {
        ok: false,
        message:
          lookup.message ||
          (channel === 'sms' ?
            'Could not send SMS code for this phone' :
            'Could not send email code for this address'),
        channel,
        destination
      };
    }

    writeChallenge({
      destination,
      altDestinations: [],
      channel,
      expiresAt: Date.now() + OTP_TTL_MS
    });

    const masked =
      channel === 'email' ?
      maskOtpDestination(destination, 'email') :
      maskPhone(destination);

    return {
      ok: true,
      channel,
      destination,
      message:
        channel === 'email' ?
          `Code sent to ${masked}. Check your inbox and spam folder.` :
          `Code sent to ${masked}. Check your SMS messages.`
    };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : 'Could not send verification code',
      channel,
      destination
    };
  }
}

export function issueSignupEmailOtp(
  email: string,
  name: string
): Promise<IssueOtpResult> {
  return issueSignupOtp({ destination: email, channel: 'email', name });
}

export function issueSmsOtp(phone: string): Promise<IssueOtpResult> {
  return issueOtp({
    destination: phone,
    channel: 'sms'
  });
}

export function issueEmailOtp(email: string): Promise<IssueOtpResult> {
  return issueOtp({ destination: email, channel: 'email' });
}

/**
 * Mark OTP as already requested (e.g. login just called TravellerPhoneEmail
 * via validateTravellerPhoneEmail — avoid sending twice).
 */
export function markOtpIssued(input: {
  destination: string;
  channel: OtpChannel;
}): IssueOtpResult {
  const channel = input.channel;
  const destination = normalizeDestination(input.destination, channel);
  writeChallenge({
    destination,
    altDestinations: [],
    channel,
    expiresAt: Date.now() + OTP_TTL_MS
  });
  const masked =
    channel === 'email' ?
      maskOtpDestination(destination, 'email') :
      maskPhone(destination);
  return {
    ok: true,
    channel,
    destination,
    message:
      channel === 'email' ?
        `Code sent to ${masked}. Check your inbox and spam folder.` :
        `Code sent to ${masked}. Check your SMS messages.`
  };
}

/** Verify via GuestAPI UserOTPCheck. */
export async function verifyOtpCode(
  destination: string,
  code: string,
  channel?: OtpChannel
): Promise<{ ok: boolean; message: string }> {
  const challenge = readChallenge();
  const trimmed = code.replace(/\D/g, '');

  if (trimmed.length < 4) {
    return {
      ok: false,
      message: `Enter the code from your ${
        (channel || challenge?.channel) === 'sms' ? 'SMS' : 'email'
      }.`
    };
  }

  // Local challenge is UX-only. GuestAPI UserOTPCheck is the source of truth —
  // do not block verify when sessionStorage was cleared (e.g. double-submit).
  if (challenge && challenge.expiresAt < Date.now()) {
    clearOtpChallenge();
    return { ok: false, message: 'Code expired. Please resend a new code.' };
  }

  void destination;

  try {
    const checked = await userOtpCheck(trimmed);
    if (!checked.success) {
      return {
        ok: false,
        message: checked.message || 'Invalid verification code'
      };
    }
    // Keep challenge until login finishes — cleared by clearOtpChallenge() after session opens.
    return { ok: true, message: checked.message || 'Verified' };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : 'Could not verify code'
    };
  }
}

export function maskOtpDestination(
  destination: string,
  channel: OtpChannel
): string {
  if (channel === 'email') {
    const [user, domain] = destination.split('@');
    if (!user || !domain) return destination;
    const visible = user.slice(0, Math.min(2, user.length));
    return `${visible}***@${domain}`;
  }
  return maskPhone(destination);
}
