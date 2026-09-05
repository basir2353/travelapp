/**
 * Traveller auth helpers — PhoneEmail lookup, Login, Dashboard.
 * Live GuestAPI ops:
 *   TravellerPhoneEmail (email or phone)
 *   TravellerLogin
 *   TravellerDashboard
 */

export type TravellerProfile = {
  travellerId: number;
  employeeCode?: string;
  titleId?: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  genderId?: number;
  email: string;
  username: string;
  password?: string;
  mobile: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postCode?: string;
  status?: string;
  currency?: string;
  fullName: string;
  raw: Record<string, unknown>;
};

export type TravellerLoginSession = {
  userType: string;
  userTypeId: number;
  userId: number;
  username: string;
  name: string;
  email: string;
  mobile: string;
  loginStatus: string;
  isActive: boolean;
  approveStatus?: number;
  currencyCode?: string;
  currencySymbol?: string;
  raw: Record<string, unknown>;
};

export type TravellerDashboardData = {
  totalBookings: number;
  availableCredit: string;
  status: number;
  raw: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ?
    (value as Record<string, unknown>) :
    null;
}

function isAllowedStatus(status: string): boolean {
  const s = status.trim();
  // Client docs: Approved / Not Approved. Live API also returns Allowed / Not Allowed.
  return /^(allowed|approved)$/i.test(s);
}

/** True when TravellerPhoneEmail profile Status is Approved/Allowed. */
export function isTravellerStatusApproved(status?: string | null): boolean {
  if (!status || !String(status).trim()) return false;
  return isAllowedStatus(String(status));
}

function firstTableRow(parsed: unknown): Record<string, unknown> | null {
  const root = asRecord(parsed);
  if (!root) return null;
  const table = root.Table;
  if (Array.isArray(table) && table.length > 0) {
    return asRecord(table[0]);
  }
  if (Array.isArray(parsed) && parsed.length > 0) {
    return asRecord(parsed[0]);
  }
  // Don't treat {"Status":"Not Allowed","Message":"..."} as a profile row
  if (root.Status != null || root.Message != null) {
    if (root.UDUserName == null && root.Username == null && root.UserID == null) {
      return null;
    }
  }
  return asRecord(parsed);
}

function str(row: Record<string, unknown> | null, ...keys: string[]): string {
  if (!row) return '';
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return '';
}

function num(row: Record<string, unknown> | null, ...keys: string[]): number {
  const raw = str(row, ...keys);
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function looksLikePhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || looksLikeEmail(trimmed)) return false;
  // Digits / phone punctuation only — usernames with letters skip phone lookup
  if (!/^[+\d\s\-()]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 9;
}

/**
 * Canonical Ethiopian mobile for GuestAPI: +251 + local (no trunk 0).
 * Only rewrites numbers that are clearly Ethiopian — never mangles +92 / other countries.
 * `0987654321` / `+2510987654321` / `987654321` → `+251987654321`
 */
export function normalizeEthiopiaMobile(value: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  // Already international non-Ethiopia (e.g. +92…) — do not rewrite
  if (trimmed.startsWith('+') && !digits.startsWith('251')) {
    return '';
  }
  // Bare international without + but starts with another country code (92, 254, …)
  // Ethiopia local mobiles are typically 9 digits (9xxxxxxxx). Longer digit strings
  // that start with a non-251 country code are left alone.
  if (!trimmed.startsWith('+') && !digits.startsWith('251') && digits.length > 9) {
    return '';
  }

  if (digits.startsWith('251') && digits.length >= 12) {
    digits = digits.slice(3);
  }
  while (digits.startsWith('0')) digits = digits.slice(1);
  // Ethiopian mobiles: 9 digits starting with 7/9 typically
  if (digits.length < 8 || digits.length > 10) return '';
  return `+251${digits}`;
}

/** Normalize identifier for TravellerPhoneEmail. */
export function normalizePhoneEmailIdentifier(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (looksLikeEmail(trimmed)) return trimmed.toLowerCase();
  const et = normalizeEthiopiaMobile(trimmed);
  if (et) return et;
  if (trimmed.startsWith('+')) return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  const digits = trimmed.replace(/\D/g, '');
  return digits ? `+${digits}` : trimmed;
}

/**
 * Phone/email variants to try against TravellerPhoneEmail.
 * Keep this short — each candidate is a full SOAP round-trip.
 * Live API expects E.164 with leading + for international (e.g. +923017863179).
 */
export function phoneEmailLookupCandidates(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (looksLikeEmail(trimmed)) {
    const email = trimmed.toLowerCase();
    return email === trimmed ? [trimmed] : [email, trimmed];
  }

  const out: string[] = [];
  const push = (v: string) => {
    const s = v.trim();
    if (s && !out.includes(s)) out.push(s);
  };

  // Prefer exact E.164 when provided
  if (trimmed.startsWith('+')) {
    push(`+${trimmed.slice(1).replace(/\D/g, '')}`);
  }

  const et = normalizeEthiopiaMobile(trimmed);
  if (et) push(et);

  const digits = trimmed.replace(/\D/g, '');
  if (digits) {
    // International without + (e.g. 923017863179) → +923017863179
    if (!trimmed.startsWith('+') && digits.length >= 11) {
      push(`+${digits}`);
    }
    // Local national with known dial already embedded above via +
  }

  // Last resort: as typed
  push(trimmed);

  return out.slice(0, 3);
}

/** Prefer API Message field over raw JSON blobs in the UI. */
export function friendlyTravellerAuthMessage(
  raw: string,
  fallback = 'Sign in failed'
): string {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return fallback;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const root = asRecord(parsed);
    if (root) {
      const message = str(root, 'Message', 'message', 'error', 'Error');
      const status = str(root, 'Status', 'status');
      if (message) return message;
      if (status) {
        if (/^not\s*allow/i.test(status) || !isAllowedStatus(status)) {
          return message || 'Phone, email, or account not found';
        }
        return status;
      }
    }
  } catch {
    // not JSON
  }
  if (/not found/i.test(trimmed)) {
    return 'Phone or email not found';
  }
  if (/not allow/i.test(trimmed) && trimmed.length < 80) {
    return trimmed;
  }
  // Avoid dumping huge SOAP/JSON into the UI
  if (trimmed.startsWith('{') || trimmed.startsWith('<') || trimmed.length > 160) {
    return fallback;
  }
  return trimmed;
}

export function parseTravellerPhoneEmailResponse(raw: string): {
  success: boolean;
  profile?: TravellerProfile;
  message: string;
  raw: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { success: false, message: 'No traveller found', raw };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const root = asRecord(parsed);

    // Live login OTP shape (no profile table):
    // {"Status":"Allowed","Message":"OTP sent successfully."}
    if (root && (root.Status != null || root.Message != null) && !root.Table) {
      const status = str(root, 'Status', 'status');
      const message = str(root, 'Message', 'message') || status;
      if (isAllowedStatus(status) || /otp\s*sent|successfully/i.test(message)) {
        return {
          success: true,
          message: message || 'OTP sent successfully.',
          raw
        };
      }
      return {
        success: false,
        message: friendlyTravellerAuthMessage(
          trimmed,
          'Phone or email not found'
        ),
        raw
      };
    }

    const row = firstTableRow(parsed);
    if (!row) {
      return {
        success: false,
        message: friendlyTravellerAuthMessage(trimmed, 'No traveller profile returned'),
        raw
      };
    }
    const status = str(row, 'Status');
    if (status && !isAllowedStatus(status)) {
      return {
        success: false,
        message: friendlyTravellerAuthMessage(trimmed, status),
        raw
      };
    }
    const firstName = str(row, 'UDFirstName', 'FirstName');
    const middleName = str(row, 'UDMiddName', 'MiddleName');
    const lastName = str(row, 'UDLastName', 'LastName');
    const fullName =
      [firstName, middleName, lastName].filter(Boolean).join(' ') ||
      str(row, 'UDUserName', 'Name') ||
      'Traveller';

    return {
      success: true,
      profile: {
        travellerId: num(row, 'TravellerId', 'UserId', 'UserID'),
        employeeCode: str(row, 'UDEmployeeCode') || undefined,
        titleId: num(row, 'UDTitleID') || undefined,
        firstName,
        middleName: middleName || undefined,
        lastName,
        genderId: num(row, 'GenderId') || undefined,
        email: str(row, 'UDEMailID', 'Email'),
        username: str(row, 'UDUserName', 'Username'),
        password: str(row, 'UDPassword') || undefined,
        mobile: str(row, 'UDMobile_No', 'Mobile'),
        streetAddress: str(row, 'StreetAddress') || undefined,
        city: str(row, 'City') || undefined,
        state: str(row, 'State') || undefined,
        postCode: str(row, 'PostCode') || undefined,
        status: status || undefined,
        currency: str(row, 'UsersCurrency', 'DefaultCurrency', 'CurrencyName') || undefined,
        fullName,
        raw: row
      },
      message: 'Traveller found',
      raw
    };
  } catch {
    const token = trimmed.replace(/^["']|["']$/g, '').trim();
    const lower = token.toLowerCase();
    // Signup OTP shape: plain "Allowed"
    if (
      /^(allowed|approved|success|ok|true)$/i.test(token) ||
      /otp\s*sent/i.test(lower)
    ) {
      return {
        success: true,
        message: /otp/i.test(lower) ? token : 'Verification code sent',
        raw
      };
    }
    if (
      lower.includes('not found') ||
      lower.includes('not allowed') ||
      lower.includes('invalid') ||
      lower.includes('no record')
    ) {
      return {
        success: false,
        message: friendlyTravellerAuthMessage(trimmed, 'Phone or email not found'),
        raw
      };
    }
    return {
      success: false,
      message: friendlyTravellerAuthMessage(trimmed, trimmed),
      raw
    };
  }
}

export function parseTravellerLoginResponse(raw: string): {
  success: boolean;
  session?: TravellerLoginSession;
  message: string;
  raw: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { success: false, message: 'Login returned an empty response', raw };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const root = asRecord(parsed);
    // Explicit failure shape: {"Status":"Not Allowed","Message":"..."}
    if (root && root.Status && !root.Table) {
      const status = str(root, 'Status');
      const message = str(root, 'Message') || status || 'Login failed';
      if (!isAllowedStatus(status)) {
        return { success: false, message, raw };
      }
    }

    const row = firstTableRow(parsed);
    if (!row) {
      return { success: false, message: 'Invalid username or password', raw };
    }

    const loginStatus = str(row, 'LoginStatus', 'Status');
    if (loginStatus && !isAllowedStatus(loginStatus)) {
      return {
        success: false,
        message: loginStatus || 'Login not allowed',
        raw
      };
    }

    const userId = num(row, 'UserID', 'UserId', 'TravellerId');
    const userTypeId = num(row, 'UserTypeId', 'UserTypeID');
    if (!userId) {
      return { success: false, message: 'Login did not return a user id', raw };
    }

    const currencyRow = (() => {
      const r = asRecord(parsed);
      const t1 = r?.Table1;
      if (Array.isArray(t1) && t1[0]) return asRecord(t1[0]);
      const t4 = r?.Table4;
      if (Array.isArray(t4) && t4[0]) return asRecord(t4[0]);
      return null;
    })();

    return {
      success: true,
      session: {
        userType: str(row, 'UserType') || 'TRA',
        userTypeId: userTypeId || 5,
        userId,
        username: str(row, 'Username', 'UDUserName'),
        name: str(row, 'Name') || str(row, 'Username'),
        email: str(row, 'ContactEmail', 'UDEMailID', 'Email'),
        mobile: str(row, 'Mobile', 'UDMobile_No'),
        loginStatus: loginStatus || 'Allowed',
        isActive: num(row, 'IsActive') !== 0,
        approveStatus: num(row, 'ApproveStatus'),
        currencyCode: str(currencyRow, 'Code', 'CurrencyCode') || undefined,
        currencySymbol: str(currencyRow, 'Symbol') || undefined,
        raw: row
      },
      message: 'Login successful',
      raw
    };
  } catch {
    const lower = trimmed.toLowerCase();
    if (lower.includes('invalid') || lower.includes('not allowed')) {
      return { success: false, message: trimmed, raw };
    }
    return { success: false, message: trimmed || 'Login failed', raw };
  }
}

export function parseTravellerDashboardResponse(raw: string): {
  success: boolean;
  dashboard?: TravellerDashboardData;
  message: string;
  raw: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { success: false, message: 'Dashboard returned an empty response', raw };
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const row = firstTableRow(parsed);
    if (!row) {
      return { success: false, message: 'Dashboard data missing', raw };
    }
    return {
      success: true,
      dashboard: {
        totalBookings: num(row, 'TotalBookings'),
        availableCredit: str(row, 'AvailableCredit') || 'ETB 0.00',
        status: num(row, 'Status'),
        raw: row
      },
      message: 'Dashboard loaded',
      raw
    };
  } catch {
    return { success: false, message: trimmed, raw };
  }
}
