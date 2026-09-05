/**
 * SignupTraveller — GuestAPI traveller registration.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=SignupTraveller
 *
 * Sample docs show UDDOB like `10-08-1985`, but the live API stores that as
 * `1985-10-08` — i.e. SQL Server parses MM-DD-YYYY. Sending DD-MM-YYYY with
 * day > 12 causes: "nvarchar to datetime … out-of-range".
 */

export type SignupTravellerInput = {
  travellerId?: number;
  /** 1 = Mr, 2 = Mrs/Ms (GuestAPI convention from sample) */
  titleId?: number;
  title?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  /** ISO yyyy-mm-dd (from date inputs) or Date-parseable */
  dateOfBirth: string;
  /** male | female | Male | Female | 1 | 2 */
  gender: string;
  email: string;
  username: string;
  password: string;
  streetAddress: string;
  city: string;
  state: string;
  postCode: string;
  mobile: string;
};

export type SignupTravellerSoapParams = {
  TravellerId: string;
  UDTitleID: string;
  UDFirstName: string;
  UDMiddName: string;
  UDLastName: string;
  UDDOB: string;
  GenderId: string;
  UDEMailID: string;
  UDUserName: string;
  UDPassword: string;
  StreetAddress: string;
  City: string;
  State: string;
  PostCode: string;
  UDMobile_No: string;
};

export type SignupTravellerResult = {
  success: boolean;
  travellerId?: number;
  message: string;
  raw: string;
};

/** GuestAPI title ids used by SignupTraveller. */
export function mapSignupTitleId(title?: string, gender?: string): number {
  const t = String(title || '').trim().toLowerCase().replace(/\./g, '');
  if (t === '1' || t === 'mr') return 1;
  if (t === '2' || t === 'mrs' || t === 'ms' || t === 'miss' || t === 'mrs/ms') {
    return 2;
  }
  const g = String(gender || '').trim().toLowerCase();
  if (g === 'female' || g === 'f' || g === '2') return 2;
  return 1;
}

/** GuestAPI gender ids: 1 = Male, 2 = Female. */
export function mapSignupGenderId(gender?: string, title?: string): string {
  const g = String(gender || '').trim().toLowerCase();
  if (g === '2' || g === 'female' || g === 'f') return '2';
  if (g === '1' || g === 'male' || g === 'm') return '1';
  return mapSignupTitleId(title, gender) === 2 ? '2' : '1';
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Format a calendar date as MM-DD-YYYY for SignupTraveller / SQL Server. */
function toSignupDobParts(month: number, day: number, year: number): string {
  return `${pad2(month)}-${pad2(day)}-${year}`;
}

/**
 * SignupTraveller UDDOB must be MM-DD-YYYY (US-style), not DD-MM-YYYY.
 * Live check: `07-27-1990` → 200; `27-07-1990` → datetime out-of-range 500.
 */
export function formatSignupDob(value: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    const d = new Date();
    return toSignupDobParts(d.getMonth() + 1, d.getDate(), d.getFullYear());
  }

  // <input type="date"> → yyyy-mm-dd
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return toSignupDobParts(Number(iso[2]), Number(iso[3]), Number(iso[1]));
  }

  const dashed = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashed) {
    const a = Number(dashed[1]);
    const b = Number(dashed[2]);
    const y = Number(dashed[3]);
    // Day-first (DD-MM-YYYY) when first part can't be a month
    if (a > 12 && b >= 1 && b <= 12) {
      return toSignupDobParts(b, a, y);
    }
    // Otherwise treat as MM-DD-YYYY
    if (a >= 1 && a <= 12 && b >= 1 && b <= 31) {
      return toSignupDobParts(a, b, y);
    }
  }

  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const y = Number(slash[3]);
    if (a > 12 && b >= 1 && b <= 12) {
      return toSignupDobParts(b, a, y);
    }
    return toSignupDobParts(a, b, y);
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return toSignupDobParts(
      parsed.getMonth() + 1,
      parsed.getDate(),
      parsed.getFullYear()
    );
  }

  return trimmed;
}

export function normalizeSignupMobile(
  mobile: string,
  dialCode = '251'
): string {
  const raw = String(mobile || '').trim();
  if (!raw) return '';
  const dial = String(dialCode || '251').replace(/\D/g, '') || '251';

  // Already international
  if (raw.startsWith('+')) {
    const digits = raw.slice(1).replace(/\D/g, '');
    return digits ? `+${digits}` : '';
  }

  let local = raw.replace(/\D/g, '');
  if (local.startsWith(dial) && local.length > dial.length + 6) {
    local = local.slice(dial.length);
  }
  while (local.startsWith('0')) local = local.slice(1);
  if (!local) return '';
  return `+${dial}${local}`;
}

export function suggestSignupUsername(
  firstName: string,
  lastName: string
): string {
  const base = `${firstName}${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 16);
  return base || `user${Date.now().toString().slice(-6)}`;
}

export function buildSignupTravellerParams(
  input: SignupTravellerInput
): SignupTravellerSoapParams {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const username =
    input.username.trim() || suggestSignupUsername(firstName, lastName);

  return {
    TravellerId: String(input.travellerId ?? 0),
    UDTitleID: String(
      input.titleId ?? mapSignupTitleId(input.title, input.gender)
    ),
    UDFirstName: firstName,
    UDMiddName: (input.middleName || '').trim(),
    UDLastName: lastName,
    UDDOB: formatSignupDob(input.dateOfBirth),
    GenderId: mapSignupGenderId(input.gender, input.title),
    UDEMailID: input.email.trim().toLowerCase(),
    UDUserName: username,
    UDPassword: input.password,
    StreetAddress: input.streetAddress.trim() || input.city.trim(),
    City: input.city.trim(),
    State: input.state.trim() || input.city.trim(),
    PostCode: input.postCode.trim() || '1000',
    UDMobile_No: normalizeSignupMobile(input.mobile)
  };
}

/**
 * Responses observed:
 *   success-ish: [{"totalpage":27,"KeyId1":0}]
 *   fail: "Email Not Allowed" | "Mobile Not Allowed" | datetime errors
 */
export function parseSignupTravellerResponse(raw: string): SignupTravellerResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      success: false,
      message: 'Signup returned an empty response',
      raw
    };
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes('email not allowed')) {
    return {
      success: false,
      message:
        'This email is already registered. Please log in with Email + OTP instead of creating a new account.',
      raw
    };
  }
  if (lower.includes('mobile not allowed')) {
    return {
      success: false,
      message:
        'This phone number is already registered. Please log in with Phone or Email instead.',
      raw
    };
  }
  if (
    lower.includes('nvarchar') &&
    lower.includes('datetime')
  ) {
    return {
      success: false,
      message:
        'Invalid date of birth format. Please pick your DOB again and retry.',
      raw
    };
  }
  if (
    lower.includes('not allowed') ||
    lower.includes('already') ||
    lower.includes('exist') ||
    lower.includes('invalid') ||
    lower.includes('error') ||
    lower.includes('fail') ||
    lower.includes('out-of-range') ||
    lower.includes('terminated')
  ) {
    return { success: false, message: trimmed, raw };
  }

  try {
    const parsed = JSON.parse(trimmed) as
      | Array<Record<string, unknown>>
      | Record<string, unknown>;
    const row = (Array.isArray(parsed) ? parsed[0] : parsed) as
      | Record<string, unknown>
      | undefined;
    if (row) {
      const key =
        row.KeyId1 ??
        row.TravellerId ??
        row.travellerId ??
        row.Id ??
        row.id;
      const travellerId =
        key != null && Number.isFinite(Number(key)) ? Number(key) : undefined;
      return {
        success: true,
        travellerId:
          travellerId != null && travellerId > 0 ? travellerId : undefined,
        message: 'Account created successfully',
        raw
      };
    }
  } catch {
    // plain success text
  }

  if (/success|created|registered|ok/i.test(trimmed)) {
    return {
      success: true,
      message: trimmed,
      raw
    };
  }

  // Numeric id only
  if (/^\d{1,}$/.test(trimmed)) {
    const id = Number(trimmed);
    return {
      success: id >= 0,
      travellerId: id > 0 ? id : undefined,
      message: id > 0 ? `Account created (${id})` : 'Account created successfully',
      raw
    };
  }

  // Default: treat non-error payload as success (GuestAPI often returns list JSON)
  return {
    success: true,
    message: 'Account created successfully',
    raw
  };
}
