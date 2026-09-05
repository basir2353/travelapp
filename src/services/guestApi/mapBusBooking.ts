import { resolveBusTicketFare } from '../../utils/busDisplayFare';
import type { SaveBookingTraveller } from './mapSaveBooking';
import {
  formatTourTravelDate,
  mapTourBookingGender
} from './mapTourBooking';

export type BusBookingInput = {
  jsonSelectBus: string;
  jsonSelectSeat: string;
  bookingJson: string;
  contactDetailJson: string;
  reqPassangerJson: string;
  boardingPointId: string;
  droppingPointId: string;
};

export type BusBookingResult = {
  success: boolean;
  bookingId?: string;
  message: string;
  raw: string[];
};

export type Bus3SelectResult = {
  success: boolean;
  confirmedPrice: number;
  busJson: string;
  seatJson: string;
  bookingJson: string;
  raw: string[];
  message?: string;
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

function mapTitle(title?: string, gender?: string): string {
  const t = (title || '').trim().replace(/\./g, '');
  if (t) {
    if (/^mrs\/ms$/i.test(t)) return 'Mrs';
    if (/^ms$/i.test(t) || /^miss$/i.test(t)) return 'MS';
    if (/^(mstr|master)$/i.test(t)) return 'Mr';
    if (/^mrs$/i.test(t)) return 'Mrs';
    if (/^mr$/i.test(t)) return 'Mr';
    if (/^MS$/i.test(t)) return 'MS';
  }
  return mapTourBookingGender(gender, title) === 'Female' ? 'MS' : 'Mr';
}

function mapNationality(value?: string): string {
  const raw = String(value || '').trim();
  if (!raw) return 'Ethiopian';
  if (/^(et|eth)$/i.test(raw) || /ethiop/i.test(raw)) return 'Ethiopian';
  if (/^(in|ind)$/i.test(raw) || /^india$/i.test(raw)) return 'Indian';
  if (/^(pk|pak)$/i.test(raw) || /pakistan/i.test(raw)) return 'Pakistani';
  return raw;
}

function mapCountry(value?: string, nationality?: string): string {
  const raw = String(value || '').trim();
  if (raw) {
    if (/^(et|eth)$/i.test(raw)) return 'Ethiopia';
    if (/^(in|ind)$/i.test(raw)) return 'India';
    const named = raw.match(/^(.+?)\s*-\s*[A-Z]{2}$/);
    if (named) return named[1].trim();
    return raw;
  }
  const nat = mapNationality(nationality).toLowerCase();
  if (nat.includes('indian')) return 'India';
  if (nat.includes('pakistan')) return 'Pakistan';
  if (nat.includes('ethiop')) return 'Ethiopia';
  return 'Ethiopia';
}

function newGuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function stampBookingNumber(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `INV-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function buildBusBookingJson(options?: {
  bookingType?: string;
  isRefundable?: boolean;
}): string {
  const bookingId = newGuid();
  const itemId = newGuid();
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 2);

  return JSON.stringify({
    BookingId: bookingId,
    BookingItemID: itemId,
    BookingNumber: stampBookingNumber(),
    BookingCode: `TKT-${Date.now().toString().slice(-6)}`,
    BookingType: options?.bookingType || 'Bus',
    BookingStatus: 'Confirmed',
    Deadline: deadline.toISOString().slice(0, 19),
    IsRefundable: options?.isRefundable ?? true,
    ItemID: `ORD${Date.now().toString().slice(-6)}`
  });
}

export function buildBusContactDetailJson(
  traveller: SaveBookingTraveller,
  options?: { city?: string; country?: string; email?: string; mobile?: string }
): string {
  const fromName = splitName(
    traveller.name ||
      `${traveller.firstName || ''} ${traveller.lastName || ''}`.trim()
  );
  const city = options?.city || 'Addis Ababa';
  const mobile =
    (options?.mobile || traveller.mobile || '').replace(/\D/g, '') ||
    '9876543210';

  return JSON.stringify({
    Title: mapTitle(traveller.title, traveller.gender),
    FirstName: traveller.firstName?.trim() || fromName.firstName,
    LastName: traveller.lastName?.trim() || fromName.lastName,
    Email:
      options?.email ||
      traveller.email?.trim() ||
      'guest@mkash.travel',
    Mobile: mobile,
    AlternateMobile: mobile,
    Address: city,
    City: city,
    State: city,
    Country: mapCountry(options?.country || traveller.country, traveller.nationality),
    Pincode: '1000'
  });
}

/**
 * Bus_Booking ReqPassangerJson — multi-passenger GuestAPI shape (Basit):
 * [{ Title, FirstName, LastName, DOB, Gender, Mobile, Email, Nationality, Country }]
 */
export function buildBusReqPassengerJson(
  travellers: SaveBookingTraveller[],
  options?: {
    seatFare?: number;
    defaultEmail?: string;
    defaultMobile?: string;
  }
): string {
  void options?.seatFare;
  const fallbackEmail = options?.defaultEmail?.trim() || 'guest@mkash.travel';
  const fallbackMobile =
    (options?.defaultMobile || '').replace(/\D/g, '') || '9876543210';

  const list = (
    travellers.length > 0 ?
      travellers :
      [
        {
          name: 'Guest User',
          title: 'Mr',
          firstName: 'Guest',
          lastName: 'User',
          email: fallbackEmail,
          mobile: fallbackMobile,
          gender: 'Male',
          nationality: 'Ethiopian',
          country: 'Ethiopia',
          dob: '1990-01-01'
        } as SaveBookingTraveller
      ]
  ).map((tr, index) => {
    const fromName = splitName(
      tr.name || `${tr.firstName || ''} ${tr.lastName || ''}`.trim()
    );
    const firstName = tr.firstName?.trim() || fromName.firstName;
    const lastName = tr.lastName?.trim() || fromName.lastName;
    const gender = mapTourBookingGender(tr.gender, tr.title);
    const lead = travellers[0];

    return {
      Title: mapTitle(tr.title, gender),
      FirstName: firstName || 'Guest',
      LastName: lastName || 'Traveller',
      DOB: formatTourTravelDate(tr.dob || '1990-01-01'),
      Gender: gender,
      Mobile:
        (tr.mobile || lead?.mobile || fallbackMobile).replace(/\D/g, '') ||
        fallbackMobile,
      Email: tr.email?.trim() || lead?.email?.trim() || fallbackEmail,
      Nationality: mapNationality(tr.nationality || lead?.nationality),
      Country: mapCountry(
        tr.country || lead?.country,
        tr.nationality || lead?.nationality
      )
    };
  });

  return JSON.stringify(list);
}

export function parseBus3SelectResponse(strings: string[]): Bus3SelectResult {
  let confirmedPrice = 0;
  let busJson = '[]';
  let seatJson = '[]';
  let bookingJson = '[]';
  let message: string | undefined;

  for (const entry of strings) {
    if (!entry || entry === '[]') continue;
    try {
      const parsed = JSON.parse(entry) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0] as Record<string, unknown>;
        if (first.BusId != null || first.TravelName != null || first.BusName != null) {
          busJson = entry;
          const price = resolveBusTicketFare(first);
          if (price > 0) confirmedPrice = price;
        } else if (first.SeatName != null || first.SeatFare != null) {
          seatJson = entry;
          const seatFare = Number(
            (parsed as Array<Record<string, unknown>>).reduce(
              (sum, s) => sum + Number(s.SeatFare || s.Price || 0),
              0
            )
          );
          if (seatFare > 0) {
            confirmedPrice =
              confirmedPrice > 0 ?
                Math.max(confirmedPrice, seatFare) :
                seatFare;
          }
        } else if (first.BasePrice != null && Object.keys(first).length <= 2) {
          const price = resolveBusTicketFare(first);
          if (price > 0) confirmedPrice = price;
        } else if (first.BookingId != null || first.BookingNumber != null) {
          bookingJson = entry;
        }
      } else if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        if (obj.BasePrice != null || obj.ShowPrice != null) {
          const price = resolveBusTicketFare(obj);
          if (price > 0) confirmedPrice = price;
        }
        if (obj.ErrorMessage || obj.Message) {
          message = String(obj.ErrorMessage || obj.Message);
        }
      }
    } catch {
      if (/success|fail|error/i.test(entry)) message = entry;
    }
  }

  return {
    success: confirmedPrice > 0 || busJson !== '[]',
    confirmedPrice,
    busJson,
    seatJson,
    bookingJson: bookingJson === '[]' ? buildBusBookingJson() : bookingJson,
    raw: strings,
    message
  };
}

export function parseBusBookingResponse(strings: string[]): BusBookingResult {
  const joined = strings.join(' | ');
  const success = strings.some((s) => /success/i.test(s));
  let bookingId = strings.find(
    (s) => s && !/success|fail|error|\[|{/i.test(s) && s.length < 40
  );

  // Prefer numeric / alphanumeric booking ids from SOAP string list
  for (const entry of strings) {
    if (!entry) continue;
    try {
      const parsed = JSON.parse(entry) as Record<string, unknown> | Record<string, unknown>[];
      const row = Array.isArray(parsed) ? parsed[0] : parsed;
      if (row && typeof row === 'object') {
        const candidate =
          row.BookingNumber ||
          row.BookingCode ||
          row.BookingId ||
          row.BookingID ||
          row.ReferenceNumber ||
          row.ReferenceNo;
        if (candidate != null && String(candidate).trim()) {
          bookingId = String(candidate).trim();
          break;
        }
      }
    } catch {
      // keep scanning
    }
  }

  return {
    success: success || !!bookingId,
    bookingId: bookingId || undefined,
    message: success ?
      'Bus booking confirmed' :
      joined || 'Bus booking failed',
    raw: strings
  };
}
