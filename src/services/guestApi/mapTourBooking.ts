/**
 * TourBooking — GuestAPI multi-passenger holiday booking.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=TourBooking
 *
 * SOAP params:
 *   DestCity, NoofAdults, TravelFromDate, TravelToDate, NoofChildren, NoofInfants,
 *   Currency, Amount, TourId, ChangeCurrency, ChangeCurrencyrate,
 *   JsonHolidayDetail, ReqPassangerJson, BookingJson
 *
 * Sample shapes (Basit / GuestAPI):
 * JsonHolidayDetail: [{ TourId, PackageCategoryId, FromDate, ToDate, PackageName,
 *   ImgURL, Destination, TotalPrice, Currency }]
 * BookingJson: { BookingId, BookingItemID, BookingNumber, BookingCode, BookingType,
 *   BookingStatus, Deadline, IsRefundable, ItemID }
 * ReqPassangerJson: [{ Title, FirstName, LastName, DOB, Gender, Mobile, Email,
 *   Nationality, Country }]
 */

import { formatFlightApiDate } from './formatTravelDate';
import type { SaveBookingTraveller } from './mapSaveBooking';

export type TourHolidayDetailRow = {
  TourId: string;
  PackageCategoryId: string;
  FromDate: string;
  ToDate: string;
  PackageName: string;
  ImgURL: string;
  Destination: string;
  TotalPrice: string;
  Currency: string;
};

export type TourBookingMeta = {
  BookingId: string;
  BookingItemID: string;
  BookingNumber: string;
  BookingCode: string;
  BookingType: string;
  BookingStatus: string;
  Deadline: string;
  IsRefundable: boolean;
  ItemID: string;
};

export type TourPassengerRow = {
  Title: string;
  FirstName: string;
  LastName: string;
  DOB: string;
  Gender: string;
  Mobile: string;
  Email: string;
  Nationality: string;
  Country: string;
};

/** @deprecated Use TourBookingMeta — kept for export compatibility. */
export type TourBookingRequest = TourBookingMeta;

export type TourBookingInput = {
  clientFirstName: string;
  lastName?: string;
  gender: string;
  emailId: string;
  location: string;
  destCity: string;
  noOfAdults: number;
  phoneNo: string;
  travelFromDate: string;
  travelToDate: string;
  noOfChildren?: number;
  noOfInfants?: number;
  amount: number | string;
  tourId: string | number;
  tourName: string;
  ticketType?: string;
  duration?: string;
  currency?: string;
  changeCurrency?: string;
  changeCurrencyRate?: number | string;
  packageCategoryId?: string | number;
  imgUrl?: string;
  bookingId?: string;
  bookingItemId?: string;
  bookingNumber?: string;
  bookingCode?: string;
  itemId?: string;
  bookingStatus?: string;
  isRefundable?: boolean;
  deadline?: string;
  travellers?: SaveBookingTraveller[];
  /** Raw list/detail row — used for PackageCategoryId / ImgURL fallbacks */
  holidayDetail?: Record<string, unknown>;
};

export type TourBookingResult = {
  success: boolean;
  referenceNumber?: string;
  status?: string;
  message: string;
  raw: string;
};

export type TourBookingSoapParams = {
  DestCity: string;
  NoofAdults: string;
  TravelFromDate: string;
  TravelToDate: string;
  NoofChildren: string;
  NoofInfants: string;
  Currency: string;
  Amount: string;
  TourId: string;
  ChangeCurrency: string;
  ChangeCurrencyrate: string;
  JsonHolidayDetail: string;
  ReqPassangerJson: string;
  BookingJson: string;
};

/** Normalize UI gender / title into Male | Female for TourBooking. */
export function mapTourBookingGender(
  gender?: string,
  title?: string
): string {
  const g = (gender || '').trim().toLowerCase();
  if (g === 'male' || g === 'm') return 'Male';
  if (g === 'female' || g === 'f') return 'Female';
  const t = (title || '').trim().toLowerCase();
  if (t === 'mrs' || t === 'mrs/ms' || t === 'miss' || t === 'ms') return 'Female';
  if (t === 'mr' || t === 'mstr' || t === 'master') return 'Male';
  return 'Male';
}

function mapPassengerTitle(title?: string, gender?: string): string {
  const t = (title || '').trim().replace(/\./g, '');
  if (t) {
    if (/^mrs\/ms$/i.test(t)) return 'Mrs';
    if (/^ms$/i.test(t)) return 'MS';
    if (/^(mr|mrs|miss|mstr|master)$/i.test(t)) {
      if (/^miss$/i.test(t)) return 'MS';
      if (/^(mstr|master)$/i.test(t)) return 'Mr';
      return t[0].toUpperCase() + t.slice(1).toLowerCase();
    }
    if (/^MS$/i.test(t)) return 'MS';
  }
  return mapTourBookingGender(gender, title) === 'Female' ? 'MS' : 'Mr';
}

/** GuestAPI TourBooking dates expect DD-MM-YYYY. */
export function formatTourTravelDate(value: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed) return formatFlightApiDate(new Date());

  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return trimmed;

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;

  const slash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) return `${slash[1]}-${slash[2]}-${slash[3]}`;

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return formatFlightApiDate(parsed);

  return trimmed;
}

/** @deprecated ISO helper from prior BookingRequest shape. */
export function formatTourBookingRequestDate(value: string): string {
  const trimmed = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  return formatTourTravelDate(trimmed);
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatBookingStamp(date = new Date()): string {
  return (
    `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}` +
    `${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`
  );
}

function formatDeadlineIso(date = new Date()): string {
  // Sample: "2026-07-15T17:30:00" (local, no Z)
  return (
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` +
    `T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
  );
}

function amountString(amount: number | string): string {
  if (typeof amount === 'number') {
    return String(Math.round(amount * 100) / 100);
  }
  return String(amount).trim() || '0';
}

function currencyCode(value?: string, fallback = 'ETB'): string {
  const code = String(value || '')
    .trim()
    .toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : fallback;
}

/** Prefer GuestAPI relative path (`../Images/Tour/...`) over absolute CDN URL. */
function resolveTourImgUrl(
  explicit?: string,
  holidayDetail?: Record<string, unknown>
): string {
  const candidates = [
    explicit,
    holidayDetail?.ImgURL,
    holidayDetail?.imgURL,
    holidayDetail?.image1,
    holidayDetail?.Image1,
    holidayDetail?.imgUrl
  ];
  for (const raw of candidates) {
    const value = String(raw || '').trim();
    if (!value) continue;
    // Absolute → recover relative GuestAPI path when possible
    const tourMatch = value.match(/\/Images\/Tour\/[^?#]+/i);
    if (tourMatch) return `..${tourMatch[0]}`;
    if (value.startsWith('../') || value.startsWith('/Images/')) {
      return value.startsWith('/Images/') ? `..${value}` : value;
    }
    if (!/^https?:\/\//i.test(value)) return value;
  }
  return '';
}

function resolvePackageCategoryId(
  input: TourBookingInput
): string {
  const fromInput = input.packageCategoryId;
  if (fromInput != null && String(fromInput).trim() !== '') {
    return String(fromInput).trim();
  }
  const detail = input.holidayDetail || {};
  const fromDetail =
    detail.PackageCategoryId ?? detail.CategoryId ?? detail.PackageCategoryID;
  if (fromDetail != null && String(fromDetail).trim() !== '') {
    return String(fromDetail).trim();
  }
  return '1';
}

function mapNationality(value?: string): string {
  const raw = String(value || '').trim();
  if (!raw) return 'Ethiopian';
  if (/^(et|eth)$/i.test(raw) || /ethiop/i.test(raw)) return 'Ethiopian';
  if (/^(in|ind)$/i.test(raw) || /^india$/i.test(raw)) return 'Indian';
  if (/^(pk|pak)$/i.test(raw) || /pakistan/i.test(raw)) return 'Pakistani';
  if (/^(ae|uae)$/i.test(raw) || /united arab|emirates|dubai/i.test(raw)) {
    return 'Emirati';
  }
  if (/^(us|usa)$/i.test(raw) || /united states|america/i.test(raw)) {
    return 'American';
  }
  if (/^(gb|uk)$/i.test(raw) || /united kingdom|britain|england/i.test(raw)) {
    return 'British';
  }
  // Already a demonym / free-text nationality
  return raw;
}

function mapCountry(value?: string, nationality?: string): string {
  const raw = String(value || '').trim();
  if (raw) {
    if (/^(et|eth)$/i.test(raw)) return 'Ethiopia';
    if (/^(in|ind)$/i.test(raw)) return 'India';
    // "Ethiopia - ET" → Ethiopia
    const named = raw.match(/^(.+?)\s*-\s*[A-Z]{2}$/);
    if (named) return named[1].trim();
    return raw;
  }
  const nat = mapNationality(nationality).toLowerCase();
  if (nat.includes('indian')) return 'India';
  if (nat.includes('ethiop')) return 'Ethiopia';
  return 'Ethiopia';
}

export function buildTourHolidayDetail(
  input: TourBookingInput
): TourHolidayDetailRow {
  const travelFrom = formatTourTravelDate(input.travelFromDate);
  const travelTo = formatTourTravelDate(input.travelToDate);
  const currency = currencyCode(input.currency);
  return {
    TourId: String(input.tourId),
    PackageCategoryId: resolvePackageCategoryId(input),
    FromDate: travelFrom,
    ToDate: travelTo,
    PackageName: input.tourName.trim() || 'Tour package',
    ImgURL: resolveTourImgUrl(input.imgUrl, input.holidayDetail),
    Destination: input.destCity.trim() || 'Dubai',
    TotalPrice: amountString(input.amount),
    Currency: currency
  };
}

export function buildTourBookingMeta(
  input: TourBookingInput
): TourBookingMeta {
  const stamp = formatBookingStamp();
  const deadlineDate = new Date();
  deadlineDate.setHours(deadlineDate.getHours() + 2);

  return {
    BookingId: input.bookingId?.trim() || newId(),
    BookingItemID: input.bookingItemId?.trim() || newId(),
    BookingNumber: input.bookingNumber?.trim() || `INV-${stamp}`,
    BookingCode: input.bookingCode?.trim() || `TKT-${stamp.slice(-6)}`,
    BookingType: 'Holiday',
    BookingStatus: input.bookingStatus?.trim() || 'Confirmed',
    Deadline: input.deadline?.trim() || formatDeadlineIso(deadlineDate),
    IsRefundable: input.isRefundable !== false,
    ItemID: input.itemId?.trim() || `ORD${stamp}`
  };
}

/** @deprecated Use buildTourBookingMeta. */
export function buildTourBookingRequest(
  input: TourBookingInput,
  _gender?: string
): TourBookingMeta {
  return buildTourBookingMeta(input);
}

export function buildReqPassengerJson(
  input: TourBookingInput,
  gender: string
): TourPassengerRow[] {
  if (input.travellers && input.travellers.length > 0) {
    return input.travellers.map((tr) => {
      const first =
        tr.firstName?.trim() ||
        tr.name?.trim().split(/\s+/)[0] ||
        input.clientFirstName;
      const last =
        tr.lastName?.trim() ||
        tr.name?.trim().split(/\s+/).slice(1).join(' ') ||
        input.lastName ||
        '';
      const paxGender = mapTourBookingGender(tr.gender, tr.title) || gender;
      return {
        Title: mapPassengerTitle(tr.title, paxGender),
        FirstName: first || 'Guest',
        LastName: last || 'Traveller',
        DOB: formatTourTravelDate(tr.dob || '1990-01-01'),
        Gender: paxGender,
        Mobile: (tr.mobile || input.phoneNo).replace(/\D/g, ''),
        Email: tr.email?.trim() || input.emailId,
        Nationality: mapNationality(tr.nationality),
        Country: mapCountry(tr.country, tr.nationality)
      };
    });
  }

  return [
    {
      Title: mapPassengerTitle(undefined, gender),
      FirstName: input.clientFirstName.trim() || 'Guest',
      LastName: input.lastName?.trim() || 'Traveller',
      DOB: '01-01-1990',
      Gender: gender,
      Mobile: input.phoneNo.replace(/\D/g, ''),
      Email: input.emailId.trim(),
      Nationality: 'Ethiopian',
      Country: 'Ethiopia'
    }
  ];
}

export function buildTourBookingParams(
  input: TourBookingInput
): TourBookingSoapParams {
  const gender = mapTourBookingGender(input.gender);
  const travelFrom = formatTourTravelDate(input.travelFromDate);
  const travelTo = formatTourTravelDate(input.travelToDate);
  const currency = currencyCode(input.currency);
  const changeCurrency = currencyCode(input.changeCurrency, currency);
  const rateRaw = Number(input.changeCurrencyRate);
  const changeRate =
    Number.isFinite(rateRaw) && rateRaw > 0 ? String(rateRaw) : '1';
  const amount = amountString(input.amount);
  const holidayRow = buildTourHolidayDetail(input);
  const bookingMeta = buildTourBookingMeta(input);
  const passengers = buildReqPassengerJson(input, gender);

  return {
    DestCity: input.destCity.trim() || 'Dubai',
    NoofAdults: String(Math.max(1, Number(input.noOfAdults) || 1)),
    TravelFromDate: travelFrom,
    TravelToDate: travelTo,
    NoofChildren: String(Math.max(0, Number(input.noOfChildren) || 0)),
    NoofInfants: String(Math.max(0, Number(input.noOfInfants) || 0)),
    Currency: currency,
    Amount: amount,
    TourId: String(input.tourId),
    ChangeCurrency: changeCurrency,
    ChangeCurrencyrate: changeRate,
    JsonHolidayDetail: JSON.stringify([holidayRow]),
    ReqPassangerJson: JSON.stringify(passengers),
    BookingJson: JSON.stringify(bookingMeta)
  };
}

/**
 * Response examples:
 *   ArrayOfString: ["1268","SUCCESS"]
 *   [{"ReferenceNumber":1000,"Status":"Confirmed"}]
 *   plain error text
 */
export function parseTourBookingResponse(raw: string): TourBookingResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      success: false,
      message: 'TourBooking returned an empty response',
      raw
    };
  }

  // ArrayOfString join: "1268\nSUCCESS" or "1268 SUCCESS"
  const lines = trimmed.
    split(/[\n\r]+/).
    map((line) => line.trim()).
    filter(Boolean);
  if (lines.length >= 2) {
    const [ref, status, ...rest] = lines;
    const statusText = [status, ...rest].join(' ').trim();
    if (
      /^\d{3,}$/.test(ref) ||
      /^[A-Z0-9-]{5,}$/i.test(ref)
    ) {
      const ok = /success|confirm|ok|booked|received/i.test(statusText);
      const fail = /fail|error|invalid|object reference/i.test(statusText);
      return {
        success: ok || (!fail && !/fail|error/i.test(statusText)),
        referenceNumber: ref,
        status: statusText || undefined,
        message:
          ok || !fail ?
            `Tour booking ${statusText || 'confirmed'} (${ref})` :
            statusText || 'Tour booking failed',
        raw
      };
    }
  }

  try {
    const parsed = JSON.parse(trimmed) as
      | Array<Record<string, unknown>>
      | Record<string, unknown>;

    const row = (Array.isArray(parsed) ? parsed[0] : parsed) as
      | Record<string, unknown>
      | undefined;

    if (row) {
      const status = String(row.Status || row.BookingStatus || '').trim();
      const reference =
        row.ReferenceNumber ??
        row.BookingNumber ??
        row.BookingCode ??
        row.BookingId ??
        row.ItemID;
      if (reference != null || status) {
        const ok =
          !status ||
          /confirm|success|ok|booked|received|enquir/i.test(status);
        return {
          success: ok,
          referenceNumber: reference != null ? String(reference) : undefined,
          status: status || undefined,
          message:
            ok ?
              status ?
                `Tour booking ${status}` :
                'Tour booking confirmed' :
              status || 'Tour booking failed',
          raw
        };
      }
    }
  } catch {
    // plain text
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.includes('error') ||
    lower.includes('fail') ||
    lower.includes('invalid') ||
    lower.includes('object reference')
  ) {
    return { success: false, message: trimmed, raw };
  }

  if (/^\d{3,}$/.test(trimmed) || /^[A-Z0-9-]{5,}$/i.test(trimmed)) {
    return {
      success: true,
      referenceNumber: trimmed,
      message: `Tour booking confirmed (${trimmed})`,
      raw
    };
  }

  return {
    success: true,
    message: trimmed,
    raw
  };
}
