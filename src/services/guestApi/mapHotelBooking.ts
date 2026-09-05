import { GUEST_USER_ID, GUEST_USER_TYPE_ID } from './car';
import type { HotelRoomPricing } from './mapHotelRoomDetails';
import { buildRoomGuestJson } from './mapHotelToListing';
import type { SaveBookingTraveller } from './mapSaveBooking';

export type HotelContactDetail = {
  Email: string;
  MobileNo: string;
  Address: string;
  City: string;
  Country: string;
};

export type HotelPassengerDetail = {
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

export type HotelBookingInput = {
  checkInDate: string;
  checkOutDate: string;
  selectHotelJson: string;
  selectRoomJson: string;
  bookingJson: string;
  travellers: SaveBookingTraveller[];
  roomCount?: number;
  adultCount?: number;
  childCount?: number;
  userId?: number;
  userTypeId?: number;
  currencyCode?: string;
  currencyValue?: number;
  hotelMarkup?: number;
  /** @deprecated use currencyValue */
  defaultCurrencyValue?: number;
  hotelStatus?: number;
  regionId?: string;
  city?: string;
  country?: string;
};

export type HotelBookingResult = {
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

function formatHotelNationality(value: string): string {
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

export function buildBookingJsonFromPricing(
  pricing: HotelRoomPricing | null | undefined
): string {
  if (!pricing) return '[]';
  return JSON.stringify([pricing]);
}

export function buildHotelContactDetailJson(
  traveller: SaveBookingTraveller,
  options?: {
    city?: string;
    country?: string;
  }
): string {
  const city = options?.city ?? 'Addis Ababa';
  const country = options?.country ?? 'Ethiopia-ET';
  const mobile = traveller.mobile?.replace(/\D/g, '') || '912345678';

  const contact: HotelContactDetail = {
    Email: traveller.email?.trim() || 'guest@mkash.et',
    MobileNo: mobile,
    Address: city,
    City: city,
    Country: country
  };

  return JSON.stringify([contact]);
}

export function buildHotelReqPassengerJson(
  travellers: SaveBookingTraveller[],
  pricing?: HotelRoomPricing | null
): string {
  const baseFare = String(pricing?.RoomFare ?? '0');
  const taxFare = String(pricing?.HotelTax ?? '0');

  const passengers: HotelPassengerDetail[] = travellers.map((tr, index) => {
    const fromName = splitName(
      tr.name || `${tr.firstName || ''} ${tr.lastName || ''}`.trim()
    );
    const firstName = tr.firstName?.trim() || fromName.firstName;
    const lastName = tr.lastName?.trim() || fromName.lastName;

    return {
      PassID: String(index + 1),
      PaxType: 'Adult',
      Title: mapTitle(tr.title),
      FirstName: firstName,
      LastName: lastName,
      Gender: tr.gender?.trim() || 'Male',
      DateOfBirth: tr.dob?.trim() || '1990-01-01',
      DoumentType: 'Passport',
      DoumentNo: tr.passport?.trim() || 'EP000000001',
      ExpiryDate: tr.passportExpiry?.trim() || '2030-12-31',
      IssueDate: defaultIssueDate(),
      Nationality: formatHotelNationality(tr.nationality || 'Ethiopian'),
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

export function buildHotelBookingPayload(input: HotelBookingInput): {
  userTypeId: string;
  userId: string;
  checkInDate: string;
  checkOutDate: string;
  hotelStatus: string;
  currencyCode: string;
  currencyValue: string;
  hotelMarkup: string;
  jsonRoomGuest: string;
  selectHotelJson: string;
  selectRoomJson: string;
  bookingJson: string;
  contactDetailJson: string;
  reqPassangerJson: string;
} {
  const roomCount = input.roomCount ?? 1;
  const adultCount = input.adultCount ?? 1;
  const childCount = input.childCount ?? 0;
  const currency = (() => {
    const code = String(input.currencyCode || '')
      .trim()
      .toUpperCase();
    return /^[A-Z]{3}$/.test(code) ? code : 'ETB';
  })();
  const rateRaw = Number(
    input.currencyValue ?? input.defaultCurrencyValue ?? 1
  );
  const currencyValue =
    Number.isFinite(rateRaw) && rateRaw > 0 ? String(rateRaw) : '1';
  const primary = input.travellers[0] ?? {};

  return {
    userTypeId: String(input.userTypeId ?? GUEST_USER_TYPE_ID),
    userId: String(input.userId ?? GUEST_USER_ID),
    checkInDate: input.checkInDate,
    checkOutDate: input.checkOutDate,
    // GuestAPI sample uses HotelStatus=1 for a confirmed/paid hold.
    hotelStatus: String(input.hotelStatus ?? 1),
    currencyCode: currency,
    currencyValue,
    hotelMarkup: String(input.hotelMarkup ?? 0),
    jsonRoomGuest: buildRoomGuestJson(roomCount, adultCount, childCount),
    selectHotelJson: input.selectHotelJson,
    selectRoomJson: input.selectRoomJson,
    bookingJson: input.bookingJson,
    contactDetailJson: buildHotelContactDetailJson(primary, {
      city: input.city,
      country: input.country
    }),
    reqPassangerJson: buildHotelReqPassengerJson(
      input.travellers,
      parseBookingPricing(input.bookingJson)
    )
  };
}

function parseBookingPricing(bookingJson: string): HotelRoomPricing | null {
  if (!bookingJson || bookingJson === '[]') return null;
  try {
    const parsed = JSON.parse(bookingJson) as
      | HotelRoomPricing
      | HotelRoomPricing[];
    const row = Array.isArray(parsed) ? parsed[0] : parsed;
    return row ?? null;
  } catch {
    return null;
  }
}

export function parseHotelBookingResponse(raw: string): HotelBookingResult {
  const text = raw.trim();
  if (!text) {
    return {
      success: false,
      message: 'Hotel4_Booking returned an empty response',
      raw: text
    };
  }

  const idMatch = text.match(/ID\s*is\s*:?\s*(\d+)/i);
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
