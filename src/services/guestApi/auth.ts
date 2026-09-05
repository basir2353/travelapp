/**
 * GuestAPI traveller auth operations.
 * @see SignupTraveller, TravellerPhoneEmail, TravellerPhoneEmailSignup,
 *      TravellerLogin, TravellerDashboard
 */

import { callGuestApi } from './soapClient';
import {
  buildSignupTravellerParams,
  parseSignupTravellerResponse,
  type SignupTravellerInput,
  type SignupTravellerResult
} from './mapSignupTraveller';
import {
  looksLikeEmail,
  looksLikePhone,
  parseTravellerDashboardResponse,
  parseTravellerLoginResponse,
  parseTravellerPhoneEmailResponse,
  phoneEmailLookupCandidates,
  friendlyTravellerAuthMessage,
  isTravellerStatusApproved,
  type TravellerDashboardData,
  type TravellerLoginSession,
  type TravellerProfile
} from './mapTravellerAuth';
import {
  travellerUserValidation,
  type UserValidationResult
} from './wallet';
import { loadSignupCreds } from './signupSession';
import {
  rememberWalletUserId,
  recallWalletUserId
} from './walletUserIdCache';

export async function signupTraveller(
  input: SignupTravellerInput
): Promise<SignupTravellerResult> {
  const params = buildSignupTravellerParams(input);
  const strings = await callGuestApi('SignupTraveller', [
    { name: 'TravellerId', value: params.TravellerId },
    { name: 'UDTitleID', value: params.UDTitleID },
    { name: 'UDFirstName', value: params.UDFirstName },
    { name: 'UDMiddName', value: params.UDMiddName },
    { name: 'UDLastName', value: params.UDLastName },
    { name: 'UDDOB', value: params.UDDOB },
    { name: 'GenderId', value: params.GenderId },
    { name: 'UDEMailID', value: params.UDEMailID },
    { name: 'UDUserName', value: params.UDUserName },
    { name: 'UDPassword', value: params.UDPassword },
    { name: 'StreetAddress', value: params.StreetAddress },
    { name: 'City', value: params.City },
    { name: 'State', value: params.State },
    { name: 'PostCode', value: params.PostCode },
    { name: 'UDMobile_No', value: params.UDMobile_No }
  ]);

  const raw = strings.join('\n').trim();
  return parseSignupTravellerResponse(raw);
}

/**
 * Lookup traveller by email OR phone (TravellerPhoneEmail).
 * Uses 1–2 candidates max so login does not hang on retries.
 */
export async function travellerPhoneEmail(phoneEmail: string): Promise<{
  success: boolean;
  profile?: TravellerProfile;
  message: string;
  raw: string;
}> {
  const candidates = phoneEmailLookupCandidates(phoneEmail);
  if (candidates.length === 0) {
    return {
      success: false,
      message: 'Enter a valid phone or email',
      raw: ''
    };
  }

  let last: {
    success: boolean;
    profile?: TravellerProfile;
    message: string;
    raw: string;
  } = {
    success: false,
    message: 'Phone or email not found',
    raw: ''
  };

  for (const candidate of candidates) {
    try {
      const strings = await callGuestApi(
        'TravellerPhoneEmail',
        [{ name: 'PhoneEmail', value: candidate }],
        { timeoutMs: 45_000, maxRetries: 0 }
      );
      const parsed = parseTravellerPhoneEmailResponse(strings.join('\n').trim());
      if (parsed.success && parsed.profile?.username) {
        return parsed;
      }
      last = parsed;
    } catch (err) {
      last = {
        success: false,
        message:
          err instanceof Error ? err.message : 'Could not reach traveller lookup',
        raw: ''
      };
    }
  }

  const lookedUp = candidates[0];
  return {
    ...last,
    message: friendlyTravellerAuthMessage(
      last.raw || last.message,
      lookedUp
        ? `No account found for ${lookedUp}`
        : 'Phone or email not found'
    )
  };
}

/**
 * Signup-only lookup — TravellerPhoneEmailSignup(PhoneEmail, Name).
 * Client requirement: the signup flow must use this instead of
 * TravellerPhoneEmail (which stays reserved for login).
 */
export async function travellerPhoneEmailSignup(
  phoneEmail: string,
  name: string
): Promise<{
  success: boolean;
  profile?: TravellerProfile;
  message: string;
  raw: string;
}> {
  const value = phoneEmail.trim();
  if (!value) {
    return { success: false, message: 'Enter a valid phone or email', raw: '' };
  }
  try {
    const strings = await callGuestApi(
      'TravellerPhoneEmailSignup',
      [
        { name: 'PhoneEmail', value },
        { name: 'Name', value: name.trim() }
      ],
      { timeoutMs: 45_000, maxRetries: 0 }
    );
    const raw = strings.join('\n').trim();
    return parseTravellerPhoneEmailResponse(raw);
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ? err.message : 'Could not reach signup verification',
      raw: ''
    };
  }
}

/**
 * Trigger signup OTP delivery via TravellerPhoneEmailSignup(PhoneEmail, Name).
 * Called right after SignupTraveller — unlike requestTravellerOtp (login),
 * this includes the newly created traveller's name per client spec, and does
 * not loop over phone/email candidates since signup already knows the exact
 * value that was just registered.
 */
export async function requestSignupOtp(
  phoneEmail: string,
  name: string
): Promise<{
  success: boolean;
  message: string;
  profile?: TravellerProfile;
  raw: string;
}> {
  const value = phoneEmail.trim();
  if (!value) {
    return { success: false, message: 'Enter a valid phone or email', raw: '' };
  }

  try {
    const strings = await callGuestApi(
      'TravellerPhoneEmailSignup',
      [
        { name: 'PhoneEmail', value },
        { name: 'Name', value: name.trim() }
      ],
      { timeoutMs: 45_000, maxRetries: 0 }
    );
    const raw = strings.join('\n').trim();
      const parsed = parseTravellerPhoneEmailResponse(raw);
      if (parsed.success) {
        return {
          success: true,
          message: 'Verification code sent',
          profile: parsed.profile,
          raw
        };
      }

      return {
        success: false,
        message: friendlyTravellerAuthMessage(
          raw || parsed.message,
          'Could not send verification code'
        ),
        raw
      };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof Error ?
        err.message :
        'Could not reach signup verification service',
      raw: ''
    };
  }
}

export async function travellerLogin(
  username: string,
  password: string
): Promise<{
  success: boolean;
  session?: TravellerLoginSession;
  message: string;
  raw: string;
}> {
  const strings = await callGuestApi('TravellerLogin', [
    { name: 'Username', value: username.trim() },
    { name: 'Password', value: password }
  ]);
  return parseTravellerLoginResponse(strings.join('\n').trim());
}

export async function travellerEmailLogin(
  email: string,
  password: string
): Promise<{
  success: boolean;
  session?: TravellerLoginSession;
  message: string;
  raw: string;
}> {
  const strings = await callGuestApi('TravellerEmailLogin', [
    { name: 'Email', value: email.trim() },
    { name: 'Password', value: password }
  ]);
  return parseTravellerLoginResponse(strings.join('\n').trim());
}

export async function travellerMobileLogin(
  mobile: string,
  password: string
): Promise<{
  success: boolean;
  session?: TravellerLoginSession;
  message: string;
  raw: string;
}> {
  const strings = await callGuestApi('TravellerMobileLogin', [
    { name: 'Mobile', value: mobile.trim() },
    { name: 'Password', value: password }
  ]);
  return parseTravellerLoginResponse(strings.join('\n').trim());
}

export async function travellerDashboard(
  userTypeId: number | string,
  userId: number | string
): Promise<{
  success: boolean;
  dashboard?: TravellerDashboardData;
  message: string;
  raw: string;
}> {
  const strings = await callGuestApi('TravellerDashboard', [
    { name: 'UserTypeId', value: String(userTypeId) },
    { name: 'UserId', value: String(userId) }
  ]);
  return parseTravellerDashboardResponse(strings.join('\n').trim());
}

export type TravellerAuthResult = {
  success: boolean;
  message: string;
  profile?: TravellerProfile;
  session?: TravellerLoginSession;
  dashboard?: TravellerDashboardData;
};

/**
 * Legacy combined login. Prefer tab helpers:
 * validateTravellerPhoneEmail → OTP → completeLoginAfterOtp
 * or loginWithUsernamePassword.
 */
export async function loginTravellerFlow(input: {
  identifier: string;
  password: string;
}): Promise<TravellerAuthResult> {
  const identifier = input.identifier.trim();
  const password = input.password;
  if (!identifier || !password) {
    return {
      success: false,
      message: 'Enter your email/phone/username and password'
    };
  }

  let username = identifier;
  let profile: TravellerProfile | undefined;
  let lookupMessage = '';

  if (looksLikeEmail(identifier) || looksLikePhone(identifier)) {
    const lookup = await travellerPhoneEmail(identifier);
    if (lookup.success && lookup.profile?.username) {
      profile = lookup.profile;
      username = lookup.profile.username;
    } else if (looksLikeEmail(identifier)) {
      return {
        success: false,
        message: friendlyTravellerAuthMessage(
          lookup.raw || lookup.message,
          'No traveller account found for that email'
        )
      };
    } else {
      lookupMessage = friendlyTravellerAuthMessage(
        lookup.raw || lookup.message,
        'Phone or email not found'
      );
      username = identifier;
    }
  }

  return completeTravellerSession({ username, password, profile });
}

function profileFromUserValidation(
  result: UserValidationResult
): TravellerProfile | null {
  if (!result.exists) return null;
  const fullName = result.name || result.username || 'Traveller';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  // IMPORTANT: Do NOT use TravellerUserValidation.userId as travellerId.
  // Live GuestAPI returns userId "1000" for every successful Email/Phone/Username
  // lookup, which would load another account's TravellerDashboard balance.
  return {
    travellerId: 0,
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
    email: result.email || '',
    username: result.username || '',
    mobile: result.phone || '',
    status: 'Allowed',
    fullName,
    raw: {
      validationUserId: result.userId,
      username: result.username,
      name: result.name,
      email: result.email,
      phone: result.phone
    }
  };
}

async function lookupTravellerValidation(
  type: 'Email' | 'Phone',
  value: string
): Promise<UserValidationResult> {
  if (type === 'Email') {
    return travellerUserValidation('Email', value.toLowerCase());
  }
  const candidates = phoneEmailLookupCandidates(value);
  let last = await travellerUserValidation('Phone', value);
  if (last.success && last.exists) return last;
  for (const candidate of candidates) {
    if (candidate === value) continue;
    const next = await travellerUserValidation('Phone', candidate);
    if (next.success && next.exists) return next;
    last = next;
  }
  return last;
}

/**
 * Phone / Email tab:
 *   1. TravellerUserValidation — confirm the account exists / is allowed
 *   2. TravellerPhoneEmail — send the OTP (live response is "OTP sent successfully.")
 */
export async function validateTravellerPhoneEmail(input: {
  phoneEmail: string;
  channel: 'phone' | 'email';
}): Promise<{
  success: boolean;
  approved: boolean;
  profile?: TravellerProfile;
  message: string;
  raw?: string;
}> {
  const value = input.phoneEmail.trim();
  if (!value) {
    return {
      success: false,
      approved: false,
      message:
        input.channel === 'phone' ?
          'Enter your phone number' :
          'Enter your email address'
    };
  }

  if (input.channel === 'email' && !looksLikeEmail(value)) {
    return {
      success: false,
      approved: false,
      message: 'Enter a valid email address'
    };
  }

  const lookupValue =
    input.channel === 'email' ? value.toLowerCase() : value;
  const validation = await lookupTravellerValidation(
    input.channel === 'phone' ? 'Phone' : 'Email',
    lookupValue
  );
  const profile = profileFromUserValidation(validation);
  if (!validation.success || !validation.exists || !profile) {
    return {
      success: false,
      approved: false,
      message:
        validation.message && !/success|allowed/i.test(validation.message) ?
          validation.message :
          input.channel === 'phone' ?
            'Phone not found' :
            'Email not found',
      raw: validation.raw
    };
  }

  const otpSend = await requestTravellerOtp(lookupValue);
  if (!otpSend.success) {
    return {
      success: false,
      approved: true,
      profile,
      message: otpSend.message || 'Could not send verification code',
      raw: otpSend.raw
    };
  }

  return {
    success: true,
    approved: true,
    profile,
    message: otpSend.message || 'OTP sent successfully.',
    raw: otpSend.raw
  };
}

function profileFromLoginSession(
  session: TravellerLoginSession
): TravellerProfile {
  const fullName = session.name || session.username || 'Traveller';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    travellerId: session.userId,
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
    email: session.email || '',
    username: session.username || '',
    mobile: session.mobile || '',
    status: session.loginStatus || 'Allowed',
    currency: session.currencyCode,
    fullName,
    raw: session.raw
  };
}

async function finishTravellerSession(
  login: {
    success: boolean;
    session?: TravellerLoginSession;
    message: string;
    raw: string;
  },
  profile?: TravellerProfile
): Promise<TravellerAuthResult> {
  if (!login.success || !login.session) {
    return {
      success: false,
      message: friendlyTravellerAuthMessage(
        login.raw || login.message,
        login.message || 'Invalid username or password'
      ),
      profile
    };
  }

  const session = login.session;
  const resolvedProfile = profile ?? profileFromLoginSession(session);
  const dash = await travellerDashboard(
    session.userTypeId || 5,
    session.userId
  );

  rememberWalletUserId({
    userId: session.userId,
    email: session.email || resolvedProfile.email,
    username: session.username,
    phone: session.mobile || resolvedProfile.mobile
  });

  return {
    success: true,
    message: 'Login successful',
    profile: resolvedProfile,
    session,
    dashboard: dash.dashboard || {
      totalBookings: 0,
      availableCredit: 'ETB 0.00',
      status: 1,
      raw: {}
    }
  };
}

/**
 * Phone / Email tab — password only, no OTP.
 * Email → TravellerEmailLogin → TravellerDashboard
 * Phone → TravellerMobileLogin → TravellerDashboard
 */
export async function loginWithPhoneEmailPassword(input: {
  phoneEmail: string;
  channel: 'phone' | 'email';
  password: string;
}): Promise<TravellerAuthResult> {
  const value = input.phoneEmail.trim();
  const password = input.password;

  if (!value) {
    return {
      success: false,
      message:
        input.channel === 'phone' ?
          'Enter your phone number' :
          'Enter your email address'
    };
  }
  if (input.channel === 'email' && !looksLikeEmail(value)) {
    return { success: false, message: 'Enter a valid email address' };
  }
  if (!password) {
    return {
      success: false,
      message: 'Enter your travel app password (the one you set at signup)'
    };
  }

  const login =
    input.channel === 'email' ?
      await travellerEmailLogin(value.toLowerCase(), password) :
      await travellerMobileLogin(value, password);

  return finishTravellerSession(login);
}

/** TravellerLogin + TravellerDashboard. */
export async function completeTravellerSession(input: {
  username: string;
  password: string;
  profile?: TravellerProfile;
}): Promise<TravellerAuthResult> {
  const username = input.username.trim();
  const password = input.password;
  if (!username || !password) {
    return {
      success: false,
      message: 'Username and password are required'
    };
  }

  const login = await travellerLogin(username, password);
  return finishTravellerSession(login, input.profile);
}

/**
 * Username tab — username + password only (not phone/email).
 * TravellerLogin → TravellerDashboard.
 */
export async function loginWithUsernamePassword(input: {
  username: string;
  password: string;
}): Promise<TravellerAuthResult> {
  const username = input.username.trim();
  const password = input.password;
  if (!username || !password) {
    return {
      success: false,
      message: 'Enter your username and password'
    };
  }
  if (looksLikePhone(username) || looksLikeEmail(username)) {
    return {
      success: false,
      message: 'Use the Phone or Email tab for phone/email login'
    };
  }
  return completeTravellerSession({ username, password });
}

/**
 * Trigger GuestAPI OTP delivery via TravellerPhoneEmail(PhoneEmail).
 * Unlike validateTravellerPhoneEmail, approval is not required — calling the
 * endpoint is what sends the SMS/email code.
 */
export async function requestTravellerOtp(phoneEmail: string): Promise<{
  success: boolean;
  message: string;
  profile?: TravellerProfile;
  raw: string;
}> {
  const candidates = phoneEmailLookupCandidates(phoneEmail);
  if (candidates.length === 0) {
    return {
      success: false,
      message: 'Enter a valid phone or email',
      raw: ''
    };
  }

  let lastRaw = '';
  let lastMessage = 'Could not send verification code';

  for (const candidate of candidates) {
    try {
      const strings = await callGuestApi(
        'TravellerPhoneEmail',
        [{ name: 'PhoneEmail', value: candidate }],
        { timeoutMs: 45_000, maxRetries: 0 }
      );
      const raw = strings.join('\n').trim();
      lastRaw = raw;
      const parsed = parseTravellerPhoneEmailResponse(raw);
      if (parsed.success) {
        return {
          success: true,
          message: 'Verification code sent',
          profile: parsed.profile,
          raw
        };
      }

      lastMessage = friendlyTravellerAuthMessage(
        raw || parsed.message,
        'Phone or email not found'
      );
    } catch (err) {
      lastMessage =
        err instanceof Error ? err.message : 'Could not reach traveller OTP API';
    }
  }

  return {
    success: false,
    message: lastMessage,
    raw: lastRaw
  };
}

/**
 * Verify the OTP that TravellerPhoneEmail delivered (UserOTPCheck).
 * Result is typically "Allowed" / "NotAllowed".
 */
export async function userOtpCheck(otp: string): Promise<{
  success: boolean;
  message: string;
  raw: string;
}> {
  const code = String(otp || '').replace(/\D/g, '').trim();
  if (code.length < 4) {
    return {
      success: false,
      message: 'Enter the verification code',
      raw: ''
    };
  }

  const strings = await callGuestApi(
    'UserOTPCheck',
    [{ name: 'otp', value: code }],
    { timeoutMs: 45_000, maxRetries: 0 }
  );
  const raw = strings.join('\n').trim();
  const token = raw.replace(/^["']|["']$/g, '').trim();
  let status = token;
  let message = '';

  try {
    const parsed = JSON.parse(token) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object') {
      status = String(
        parsed.Status ?? parsed.status ?? parsed.Result ?? parsed.result ?? token
      ).trim();
      message = String(
        parsed.Message ?? parsed.message ?? ''
      ).trim();
    }
  } catch {
    // plain string result
  }

  const ok = /^(allowed|approved|success|verified|ok|true|valid)$/i.test(status);
  if (ok) {
    return {
      success: true,
      message: message || 'Verified',
      raw
    };
  }

  return {
    success: false,
    message:
      message ||
      (/not\s*allow/i.test(status) ?
        'Invalid or expired verification code' :
        status || 'Invalid verification code'),
    raw
  };
}

/**
 * After SMS/email OTP — open the session with TravellerLogin UserID +
 * TravellerDashboard. Validation.userId is never used for wallet.
 */
export async function completeLoginAfterOtp(
  profile: TravellerProfile,
  password?: string
): Promise<TravellerAuthResult> {
  const username = profile.username?.trim();
  const candidates = [
    password,
    profile.password,
    loadSignupCreds()?.password
  ].
    map((value) => String(value || '')).
    filter((value, index, all) => value.length >= 4 && all.indexOf(value) === index);

  if (username && candidates.length > 0) {
    let lastFail: TravellerAuthResult | null = null;
    for (const pw of candidates) {
      const loggedIn = await completeTravellerSession({
        username,
        password: pw,
        profile
      });
      if (loggedIn.success && loggedIn.session?.userId) {
        return loggedIn;
      }
      lastFail = loggedIn;
    }
    // OTP is valid — only the travel-app password failed.
    return {
      success: false,
      message:
        lastFail?.message && /invalid|password|not allowed/i.test(lastFail.message) ?
          `OTP verified, but the password is wrong for username "${username}". Use your travel app password (not your Gmail password), or switch to Username login.` :
          lastFail?.message ||
            `OTP verified. Enter the travel app password for username "${username}".`,
      profile
    };
  }

  // Previously successful TravellerLogin for this identity — reuse UserID.
  const remembered = recallWalletUserId({
    email: profile.email,
    username,
    phone: profile.mobile
  });
  if (remembered) {
    const userTypeId = 5;
    const dash = await travellerDashboard(userTypeId, remembered);
    return {
      success: true,
      message: 'Login successful',
      profile,
      session: {
        userType: 'TRA',
        userTypeId,
        userId: remembered,
        username: username || profile.email || String(remembered),
        name: profile.fullName || username || 'Traveller',
        email: profile.email,
        mobile: profile.mobile,
        loginStatus: 'Allowed',
        isActive: true,
        raw: profile.raw
      },
      dashboard: dash.dashboard || {
        totalBookings: 0,
        availableCredit: 'ETB 0.00',
        status: 1,
        raw: {}
      }
    };
  }

  if (!username) {
    return {
      success: false,
      message:
        'Could not resolve your traveller username. Log in with Username + password.',
      profile
    };
  }

  return {
    success: false,
    message: `OTP verified. Enter the travel app password for username "${username}" (not your Gmail password).`,
    profile
  };
}

export type { SignupTravellerInput, SignupTravellerResult } from './mapSignupTraveller';
export type {
  TravellerDashboardData,
  TravellerLoginSession,
  TravellerProfile
} from './mapTravellerAuth';
export {
  buildSignupTravellerParams,
  parseSignupTravellerResponse,
  formatSignupDob,
  mapSignupGenderId,
  mapSignupTitleId,
  normalizeSignupMobile,
  suggestSignupUsername
} from './mapSignupTraveller';
export {
  looksLikeEmail,
  looksLikePhone,
  normalizePhoneEmailIdentifier,
  normalizeEthiopiaMobile,
  phoneEmailLookupCandidates,
  friendlyTravellerAuthMessage,
  isTravellerStatusApproved,
  parseTravellerDashboardResponse,
  parseTravellerLoginResponse,
  parseTravellerPhoneEmailResponse
} from './mapTravellerAuth';
