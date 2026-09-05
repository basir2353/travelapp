import { GUEST_USER_ID, GUEST_USER_TYPE_ID } from './car';
import type { CarPricing } from './mapCarSelection';
import type { SaveBookingTraveller } from './mapSaveBooking';

export type CarContactDetail = {
  Email: string;
  MobileNo: string;
  Address: string;
  City: string;
  Country: string;
};

export type CarPassengerDetail = {
  PassID: string;
  PaxType: string;
  Title: string;
  FirstName: string;
  LastName: string;
  Gender: string;
  DateOfBirth: string;
  DoumentType: string;
  DoumentNo: string;
  ExpiryDate: string;
  IssueDate: string;
  Nationality: string;
  BaseFare: string;
  TaxFare: string;
};

export type CarDriverDetail = {
  DriverID: string;
  Title: string;
  FirstName: string;
  LastName: string;
  Age: string;
  LicenseNo: string;
  LicenseExpiry: string;
  LicenseIssueCountry: string;
  DateOfBirth: string;
};

export type CarBookingInput = {
  jsonSelectCar: string;
  bookingJson: string;
  travellers: SaveBookingTraveller[];
  userId?: number;
  userTypeId?: number;
  defaultCurrency?: string;
  defaultCurrencyValue?: number;
  carMarkup?: number;
  city?: string;
  country?: string;
};

export type CarBookingResult = {
  success: boolean;
  bookingId?: string;
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

function mapTitle(title?: string): string {
  if (!title) return 'Mr';
  if (title === 'Mrs/Ms') return 'Mrs';
  return title.replace('.', '');
}

function formatCarNationality(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'Ethiopian-ET';
  if (trimmed.includes('-')) return trimmed.replace(/\s*-\s*/g, '-');
  if (/^[A-Z]{2}$/i.test(trimmed)) return `Ethiopian-${trimmed.toUpperCase()}`;
  if (/ethiop/i.test(trimmed)) return 'Ethiopian-ET';
  return `${trimmed}-ET`;
}

function defaultIssueDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().slice(0, 10);
}

function driverAge(dob: string): string {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return '30';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || monthDelta === 0 && today.getDate() < birth.getDate()) {
    age -= 1;
  }
  return String(Math.max(age, 21));
}

export function buildBookingJsonFromCarPricing(
  pricing: CarPricing | null | undefined
): string {
  if (!pricing) return '[]';
  return JSON.stringify([pricing]);
}

export function buildCarContactDetailJson(
  traveller: SaveBookingTraveller,
  options?: {
    city?: string;
    country?: string;
  }
): string {
  const city = options?.city ?? 'Addis Ababa';
  const country = options?.country ?? 'Ethiopia-ET';
  const mobile = traveller.mobile?.replace(/\D/g, '') || '912345678';

  const contact: CarContactDetail = {
    Email: traveller.email?.trim() || 'guest@mkash.et',
    MobileNo: mobile,
    Address: city,
    City: city,
    Country: country
  };

  return JSON.stringify([contact]);
}

export function buildCarReqPassengerJson(
  travellers: SaveBookingTraveller[],
  pricing?: CarPricing | null
): string {
  const baseFare = String(pricing?.BaseAmount ?? pricing?.TotalFare ?? '0');
  const taxFare = String(pricing?.Tax ?? '0');

  const passengers: CarPassengerDetail[] = travellers.map((tr, index) => {
    const fromName = splitName(
      tr.name || `${tr.firstName || ''} ${tr.lastName || ''}`.trim()
    );
    const firstName = tr.firstName?.trim() || fromName.firstName;
    const lastName = tr.lastName?.trim() || fromName.lastName;
    const dob = tr.dob?.trim() || '1990-01-01';

    return {
      PassID: String(index + 1),
      PaxType: 'Adult',
      Title: mapTitle(tr.title),
      FirstName: firstName,
      LastName: lastName,
      Gender: tr.gender?.trim() || 'Male',
      DateOfBirth: dob,
      DoumentType: 'Passport',
      DoumentNo: tr.passport?.trim() || 'EP000000001',
      ExpiryDate: tr.passportExpiry?.trim() || '2030-12-31',
      IssueDate: defaultIssueDate(),
      Nationality: formatCarNationality(tr.nationality || 'Ethiopian'),
      BaseFare: baseFare,
      TaxFare: taxFare
    };
  });

  return JSON.stringify(
    passengers.length > 0 ? passengers : [
      {
        PassID: '1',
        PaxType: 'Adult',
        Title: 'Mr',
        FirstName: 'Guest',
        LastName: 'User',
        Gender: 'Male',
        DateOfBirth: '1990-01-01',
        DoumentType: 'Passport',
        DoumentNo: 'EP000000001',
        ExpiryDate: '2030-12-31',
        IssueDate: defaultIssueDate(),
        Nationality: 'Ethiopian-ET',
        BaseFare: baseFare,
        TaxFare: taxFare
      }
    ]
  );
}

export function buildCarRegDriverJson(
  traveller: SaveBookingTraveller
): string {
  const fromName = splitName(
    traveller.name || `${traveller.firstName || ''} ${traveller.lastName || ''}`.trim()
  );
  const firstName = traveller.firstName?.trim() || fromName.firstName;
  const lastName = traveller.lastName?.trim() || fromName.lastName;
  const dob = traveller.dob?.trim() || '1990-01-01';

  const driver: CarDriverDetail = {
    DriverID: '1',
    Title: mapTitle(traveller.title),
    FirstName: firstName,
    LastName: lastName,
    Age: driverAge(dob),
    LicenseNo: traveller.passport?.trim() || 'DL000000001',
    LicenseExpiry: traveller.passportExpiry?.trim() || '2030-12-31',
    LicenseIssueCountry: formatCarNationality(traveller.nationality || 'Ethiopian'),
    DateOfBirth: dob
  };

  return JSON.stringify([driver]);
}

function parseBookingPricing(bookingJson: string): CarPricing | null {
  if (!bookingJson || bookingJson === '[]') return null;
  try {
    const parsed = JSON.parse(bookingJson) as CarPricing | CarPricing[];
    const row = Array.isArray(parsed) ? parsed[0] : parsed;
    return row ?? null;
  } catch {
    return null;
  }
}

export function buildCarBookingPayload(input: CarBookingInput): {
  userTypeId: string;
  userId: string;
  currencyCode: string;
  currencyValue: string;
  carMarkup: string;
  jsonSelectCar: string;
  bookingJson: string;
  contactDetailJson: string;
  reqPassangerJson: string;
  regDriverJson: string;
} {
  const currency = (() => {
    const code = String(input.defaultCurrency || '')
      .trim()
      .toUpperCase();
    return /^[A-Z]{3}$/.test(code) ? code : 'ETB';
  })();
  const rateRaw = Number(input.defaultCurrencyValue ?? 1);
  const currencyValue =
    Number.isFinite(rateRaw) && rateRaw > 0 ? String(rateRaw) : '1';
  const primary = input.travellers[0] ?? {};
  const pricing = parseBookingPricing(input.bookingJson);

  return {
    userTypeId: String(input.userTypeId ?? GUEST_USER_TYPE_ID),
    userId: String(input.userId ?? GUEST_USER_ID),
    currencyCode: currency,
    currencyValue,
    carMarkup: String(input.carMarkup ?? 0),
    jsonSelectCar: input.jsonSelectCar,
    bookingJson: input.bookingJson,
    contactDetailJson: buildCarContactDetailJson(primary, {
      city: input.city,
      country: input.country
    }),
    reqPassangerJson: buildCarReqPassengerJson(input.travellers, pricing),
    regDriverJson: buildCarRegDriverJson(primary)
  };
}

export function parseCarBookingResponse(raw: string): CarBookingResult {
  const text = raw.trim();
  if (!text) {
    return {
      success: false,
      message: 'Car_Booking returned an empty response',
      raw: text
    };
  }

  const idMatch = text.match(/ID\s*(?:is\s*)?:?\s*(\d+)/i);
  if (idMatch) {
    return {
      success: true,
      bookingId: idMatch[1],
      message: text,
      raw: text
    };
  }

  const lower = text.toLowerCase();
  if (
    lower.includes('successfully saved') ||
    lower.includes('booking successfully')
  ) {
    return {
      success: true,
      message: text,
      raw: text
    };
  }

  if (
    lower.includes('error') ||
    lower.includes('fail') ||
    lower.includes('invalid')
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
