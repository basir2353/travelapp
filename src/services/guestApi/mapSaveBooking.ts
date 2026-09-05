import { GUEST_USER_ID, GUEST_USER_TYPE_ID } from './car';
import type { PaxType } from './buildFlightTravellers';

/**
 * Parse money-like API/UI values ("BRL 7,748.56", "9,200", 9200) into a finite number.
 * Avoids GuestAPI "Input string was not in a correct format" from NaN DebitAmount.
 */
export function parseMoneyAmount(
  value: unknown,
  fallback = 0
): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value ?? '')
    .replace(/[^\d.,\-]/g, '')
    .trim();
  if (!raw) return fallback;
  // Prefer last comma/dot as decimal when both appear (EU vs US).
  let normalized = raw;
  if (raw.includes(',') && raw.includes('.')) {
    normalized =
      raw.lastIndexOf(',') > raw.lastIndexOf('.') ?
        raw.replace(/\./g, '').replace(',', '.') :
        raw.replace(/,/g, '');
  } else if (raw.includes(',')) {
    // "9200,50" vs "9,200"
    normalized =
      /,\d{1,2}$/.test(raw) ?
        raw.replace(',', '.') :
        raw.replace(/,/g, '');
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
}

export type FlightContactDetail = {
  HouseNo: string;
  Address: string;
  City: string;
  ZipCode: string;
  Country: string;
  Email: string;
  MobileNo: string;
  PhoneCode: string;
};

export type FlightDefaultValues = {
  UserId: string;
  UserTypeId: string;
  CurrencyCode: string;
  DefaultCurrencyvalue: string;
  FlightMarkup: string;
  INRCurrencyValue: string;
  FrontCurrencyCode: string;
  FrontCurrencyValue: string;
  MainCurrencyCode: string;
  MainCurrencyvalue: string;
  GSTPercent: string;
  GSTAmt: string;
  ServiceChargePercent: string;
  ServiceCharge: string;
  OfferDiscount: string;
  MarkupAmt: string;
  DebitAmount: string;
  PaymentID: string;
  BookingStatusChk: string;
};

export type FlightPassengerDetail = {
  PassID: string;
  PaxType: string;
  Title: string;
  FirstName: string;
  MiddleName: string;
  LastName: string;
  Gender: string;
  DateOfBirth: string;
  DoumentType: string;
  DoumentNo: string;
  ExpiryDate: string;
  IssueDate: string;
  Nationality: string;
};

export type SaveBookingTraveller = {
  paxType?: PaxType;
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string;
  gender?: string;
  dob?: string;
  nationality?: string;
  country?: string;
  documentType?: string;
  passport?: string;
  passportIssueDate?: string;
  passportExpiry?: string;
  email?: string;
  mobile?: string;
};

export type SaveBookingContact = {
  houseNo?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  email?: string;
  mobile?: string;
  phoneCode?: string;
};

export type SaveBookingInput = {
  selectedRowJson: string;
  travellers: SaveBookingTraveller[];
  debitAmount: number | string;
  paymentId: string;
  userId?: number;
  userTypeId?: number;
  currencyCode?: string;
  currencyValue?: number | string;
  flightMarkup?: number | string;
  contact?: SaveBookingContact;
};

export type SaveBookingResult = {
  success: boolean;
  pnr?: string;
  message: string;
  raw: string;
};

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Guest', lastName: 'User' };
  if (parts.length === 1) return { firstName: parts[0], lastName: 'User' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

function mapTitle(title?: string, paxType?: PaxType): string {
  if (title) {
    if (title === 'Mrs/Ms') return 'Mrs';
    return title.replace('.', '');
  }
  if (paxType === 'Child' || paxType === 'Infant') return 'Mstr';
  return 'Mr';
}

/** GuestAPI SaveBooking expects a 2-letter country code (e.g. `ET`). */
export function formatNationality(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'ET';

  const twoLetter = trimmed.match(/^([A-Z]{2})$/i);
  if (twoLetter) return twoLetter[1].toUpperCase();

  const suffixCode = trimmed.match(/-\s*([A-Z]{2})\s*$/i);
  if (suffixCode) return suffixCode[1].toUpperCase();

  const parenCode = trimmed.match(/\(([A-Z]{2})\s*\)\s*$/i);
  if (parenCode) return parenCode[1].toUpperCase();

  if (/ethiop/i.test(trimmed)) return 'ET';

  const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (/^[A-Z]{2}$/i.test(tokens[i])) {
      return tokens[i].toUpperCase();
    }
  }

  return 'ET';
}

/**
 * GuestAPI contact Country is parsed with IndexOf(" - ").
 * Always send `Name - XX` (spaces around the dash) — `Ethiopia-ET` / bare names crash SaveBooking.
 */
export function formatContactCountry(value?: string | null): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return 'Ethiopia - ET';

  const spaced = trimmed.match(/^(.+?)\s+-\s+([A-Z]{2})$/i);
  if (spaced) {
    return `${spaced[1].trim()} - ${spaced[2].toUpperCase()}`;
  }

  const noSpace = trimmed.match(/^(.+?)-([A-Z]{2})$/i);
  if (noSpace) {
    return `${noSpace[1].trim()} - ${noSpace[2].toUpperCase()}`;
  }

  const paren = trimmed.match(/^(.+?)\s*\(([A-Z]{2})\s*\)\s*$/i);
  if (paren) {
    return `${paren[1].trim()} - ${paren[2].toUpperCase()}`;
  }

  if (/^[A-Z]{2}$/i.test(trimmed)) {
    return `Country - ${trimmed.toUpperCase()}`;
  }

  const code = formatNationality(trimmed);
  const name = trimmed.replace(/\s*\([A-Z]{2}\s*\)\s*$/i, '').replace(/\s*-\s*[A-Z]{2}\s*$/i, '').trim();
  return `${name || 'Country'} - ${code}`;
}

function sanitizePassengerName(value: string): string {
  return value
    .trim()
    .replace(/[^A-Za-z\s'\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\.+$/g, '')
    .trim();
}

function defaultIssueDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().slice(0, 10);
}

export function buildContactDetailJson(
  contact: SaveBookingContact
): string {
  const city = contact.city?.trim() || 'Addis Ababa';
  const country = formatContactCountry(contact.country);
  const phoneCode = contact.phoneCode?.trim().replace(/^\+/, '') || '251';
  let mobile = contact.mobile?.replace(/\D/g, '') || '';
  // Avoid empty MobileNo — some GuestAPI paths IndexOf into it.
  if (!mobile) mobile = '911000000';
  // Drop leading zero / country code duplicate when user typed full international.
  if (phoneCode && mobile.startsWith(phoneCode) && mobile.length > phoneCode.length + 6) {
    mobile = mobile.slice(phoneCode.length);
  }

  const detail: FlightContactDetail = {
    HouseNo: contact.houseNo?.trim() || city,
    Address: contact.address?.trim() || city,
    City: city,
    ZipCode: contact.zipCode?.trim() || '1000',
    Country: country,
    Email: contact.email?.trim() || 'guest@mkash.et',
    MobileNo: mobile,
    PhoneCode: phoneCode
  };

  return JSON.stringify([detail]);
}

export function buildDefaultValueJson(input: {
  debitAmount: number | string;
  paymentId: string;
  userId?: number;
  userTypeId?: number;
  currencyCode?: string;
  currencyValue?: number | string;
  flightMarkup?: number | string;
}): string {
  const currency = (() => {
    const code = String(input.currencyCode || '')
      .trim()
      .toUpperCase();
    return /^[A-Z]{3}$/.test(code) ? code : 'ETB';
  })();
  const rate = parseMoneyAmount(input.currencyValue, 1);
  const debit = parseMoneyAmount(input.debitAmount, 0);
  const markup = parseMoneyAmount(input.flightMarkup, 0);
  const defaults: FlightDefaultValues = {
    UserId: String(input.userId ?? GUEST_USER_ID),
    UserTypeId: String(input.userTypeId ?? GUEST_USER_TYPE_ID),
    CurrencyCode: currency,
    DefaultCurrencyvalue: String(rate),
    FlightMarkup: String(markup),
    INRCurrencyValue: '1',
    FrontCurrencyCode: currency,
    FrontCurrencyValue: String(rate),
    MainCurrencyCode: currency,
    MainCurrencyvalue: String(rate),
    GSTPercent: '0',
    GSTAmt: '0',
    ServiceChargePercent: '0',
    ServiceCharge: '0',
    OfferDiscount: '0',
    MarkupAmt: '0',
    DebitAmount: debit.toFixed(2),
    PaymentID: String(input.paymentId || `MKASH-${Date.now()}`),
    BookingStatusChk: 'BS'
  };

  return JSON.stringify([defaults]);
} 

function sanitizePassengerDate(value: string, fallback: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return fallback;
  // Already ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // dd/mm/yyyy or dd-mm-yyyy
  const dmy = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    return `${dmy[3]}-${mm}-${dd}`;
  }
  // mm/dd/yyyy
  const mdy = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (mdy) {
    // Ambiguous — prefer ISO if day>12 already handled above; keep as yyyy-mm-dd guess
    const a = Number(mdy[1]);
    const b = Number(mdy[2]);
    if (a > 12) return `${mdy[3]}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return fallback;
}

export function buildReqPassengerJson(travellers: SaveBookingTraveller[]): string {
  const passengers: FlightPassengerDetail[] = travellers.map((tr, index) => {
    const fromName = splitName(
      tr.name || `${tr.firstName || ''} ${tr.lastName || ''}`.trim()
    );
    const firstName = sanitizePassengerName(
      tr.firstName?.trim() || fromName.firstName
    );
    const lastName = sanitizePassengerName(
      tr.lastName?.trim() || fromName.lastName
    );
    const paxType = tr.paxType ?? 'Adult';

    return {
      PassID: String(index + 1),
      PaxType: paxType,
      Title: mapTitle(tr.title, paxType),
      FirstName: firstName,
      MiddleName: sanitizePassengerName(tr.middleName?.trim() || ''),
      LastName: lastName,
      Gender: tr.gender?.trim() || 'Male',
      DateOfBirth: sanitizePassengerDate(tr.dob || '', '1990-01-01'),
      DoumentType: tr.documentType?.trim() || 'Passport',
      DoumentNo: tr.passport?.trim() || 'EP000000001',
      ExpiryDate: sanitizePassengerDate(
        tr.passportExpiry || '',
        '2030-12-31'
      ),
      IssueDate: sanitizePassengerDate(
        tr.passportIssueDate || '',
        defaultIssueDate()
      ),
      Nationality: formatNationality(tr.nationality || 'Ethiopian')
    };
  });

  return JSON.stringify(passengers);
}

export function parseSaveBookingResponse(raw: string): SaveBookingResult {
  const text = raw.trim();
  if (!text) {
    return {
      success: false,
      message: 'SaveBooking returned an empty response',
      raw: text
    };
  }

  // GuestAPI often returns a bare PNR in <Result>HJNXXK</Result> (no "PNR :" prefix).
  const xmlResult = text.match(
    /<(?:\w+:)?Result[^>]*>([\s\S]*?)<\/(?:\w+:)?Result>/i
  )?.[1]?.
  trim();
  const xmlError = text.match(
    /<(?:\w+:)?Error[^>]*>([\s\S]*?)<\/(?:\w+:)?Error>/i
  )?.[1]?.
  trim();
  if (xmlError && !/^no error$/i.test(xmlError)) {
    return {
      success: false,
      message: xmlError,
      raw: text
    };
  }
  if (xmlResult && /^[A-Z0-9]{5,10}$/i.test(xmlResult)) {
    const pnr = xmlResult.toUpperCase();
    return {
      success: true,
      pnr,
      message: `PNR : ${pnr}`,
      raw: text
    };
  }

  const pnrMatch = text.match(/PNR\s*:\s*([A-Z0-9]+)/i);
  if (pnrMatch) {
    return {
      success: true,
      pnr: pnrMatch[1],
      message: text,
      raw: text
    };
  }

  if (/^[A-Z0-9]{5,10}$/i.test(text)) {
    return {
      success: true,
      pnr: text.toUpperCase(),
      message: `PNR : ${text.toUpperCase()}`,
      raw: text
    };
  }

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const pnr =
      String(parsed.PNR || parsed.Pnr || parsed.pnr || parsed.BookingRef || '').
      trim() || undefined;
    if (pnr) {
      return {
        success: true,
        pnr,
        message: text,
        raw: text
      };
    }
  } catch {
    // plain text response
  }

  const lower = text.toLowerCase();
  if (
    lower.includes('error') ||
    lower.includes('fail') ||
    lower.includes('invalid') ||
    /expected\s+\d+\s+rows/i.test(lower)
  ) {
    return {
      success: false,
      message: text,
      raw: text
    };
  }

  return {
    success: true,
    message: text,
    raw: text
  };
}

export function buildSaveBookingPayload(input: SaveBookingInput): {
  selectedRowJson: string;
  contactdetailJson: string;
  defaultvalueJson: string;
  reqPassangerJson: string;
} {
  const primary = input.travellers[0] ?? {};
  const contact: SaveBookingContact = {
    email: input.contact?.email ?? primary.email,
    mobile: input.contact?.mobile ?? primary.mobile,
    houseNo: input.contact?.houseNo,
    address: input.contact?.address,
    city: input.contact?.city,
    zipCode: input.contact?.zipCode,
    country: input.contact?.country,
    phoneCode: input.contact?.phoneCode
  };

  return {
    selectedRowJson: input.selectedRowJson,
    contactdetailJson: buildContactDetailJson(contact),
    defaultvalueJson: buildDefaultValueJson({
      debitAmount: input.debitAmount,
      paymentId: input.paymentId,
      userId: input.userId,
      userTypeId: input.userTypeId,
      currencyCode: input.currencyCode,
      currencyValue: input.currencyValue,
      flightMarkup: input.flightMarkup
    }),
    reqPassangerJson: buildReqPassengerJson(input.travellers)
  };
}
