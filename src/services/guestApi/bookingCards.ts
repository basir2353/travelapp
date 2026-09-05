import { callGuestApi } from './soapClient';
import { GUEST_USER_ID, GUEST_USER_TYPE_ID } from './car';

/** Item from BookingCardListGet → Table[]. */
export type BookingCardItem = {
  BookFlightId: number;
  BookingType: string;
  UserTypeId: number;
  UserId: number;
  SlNo: number;
  BookingId: string;
  BookingNumber: string;
  BookingCode: string;
  BookedOn: string;
  TicketNo: string;
  AuthorizedStatus: string;
  InvoiceAmount: string | null;
  BookingAmount: string | null;
  BookingStatus: string;
  BookCardDiscription: string;
};

export type BookingListResult = {
  bookings: BookingCardItem[];
  totalRecords: number;
  totalPages: number;
};

export type BookingListParams = {
  userTypeId?: number;
  userId?: number;
  /** '' for all, or 'Flight' | 'Hotel' | ... */
  bookingType?: string;
};

/** Strip inline HTML (e.g. <span style=…>) from BookCardDiscription. */
export function cleanBookingDescription(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Format the route-ish description, e.g. "ADD(), CAI(CAI) CAI(), DXB(DXB)" → "ADD → CAI → DXB". */
export function formatFlightSegments(raw: string): string {
  const codes: string[] = [];
  const re = /([A-Z]{3})\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const code = m[1];
    if (codes[codes.length - 1] !== code) codes.push(code);
  }
  if (codes.length < 2) return cleanBookingDescription(raw);
  return codes.join(' → ');
}

/** "07/10/26 11:39:40 AM" → "10 Jul 2026". */
export function formatBookedOnLabel(raw: string): string {
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{2})/);
  if (!m) return raw;
  const [, mm, dd, yy] = m;
  const date = new Date(2000 + Number(yy), Number(mm) - 1, Number(dd));
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function parseJsonPayload(strings: string[]): any {
  for (const entry of strings) {
    const trimmed = (entry ?? '').trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) continue;
    try {
      return JSON.parse(trimmed);
    } catch {
      // try next entry
    }
  }
  return null;
}

/**
 * BookingCardListGet — list all bookings for a user.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=BookingCardListGet
 */
export async function bookingCardListGet(
  params: BookingListParams = {}
): Promise<BookingListResult> {
  const userId = params.userId ?? GUEST_USER_ID;
  const userTypeId = params.userTypeId ?? GUEST_USER_TYPE_ID;
  const strings = await callGuestApi('BookingCardListGet', [
    { name: 'UserTypeId', value: String(userTypeId) },
    { name: 'UserId', value: String(userId) },
    { name: 'BookingType', value: params.bookingType ?? '' }
  ]);

  const payload = parseJsonPayload(strings);
  const table = Array.isArray(payload?.Table) ? payload.Table : [];
  const meta = Array.isArray(payload?.Table1) ? payload.Table1[0] : undefined;

  return {
    bookings: table as BookingCardItem[],
    totalRecords: Number(meta?.TotalRecords ?? table.length),
    totalPages: Number(meta?.TotalPage ?? 1)
  };
}

// ===== BookingCardViewGet (booking detail) =====

export type BookingDetailSummary = {
  bookFlightId: number;
  bookingId: string;
  bookingType: string;
  bookingStatus: string;
  confirmStatus: string;
  /** Ticket / PNR reference shown on the booking. */
  ticketNo: string;
  ticketCode: string;
  bookingNumber: string;
  bookedOn: string;
  dueDate: string;
  totalAmount: string;
  bookingApi: string;
  payStatus: string;
  paidStatus: string;
  tripType: string;
  pnr: string;
};

export type BookingDetailSegment = {
  pnr: string;
  ticketNo: string;
  airline: string;
  flightNumber: string;
  flightLeg: string;
  depAirport: string;
  arrAirport: string;
  depDate: string;
  arrDate: string;
  depTime: string;
  arrTime: string;
  duration: string;
  className: string;
  stops: number;
  equipment: string;
  terminalDep?: string;
  terminalArr?: string;
};

export type BookingDetailHotel = {
  hotelName: string;
  starCategory: string;
  address: string;
  nights: number;
  checkIn: string;
  checkOut: string;
  roomType: string;
  guests: string;
  phone: string;
  email: string;
  status: string;
};

export type BookingDetailFare = {
  currency: string;
  baseFare: string;
  /** Airline tax / InputTax from GuestAPI. */
  taxAmount: number;
  serviceTaxAmount: number;
  discountAmount: string | number;
  grandTotal: number;
  totalNett?: number;
  /** GST when present (separate from InputTax). */
  gstAmount?: number;
  inputTax?: number;
};

export type BookingDetailPassenger = {
  name: string;
  type: string;
  email: string;
  phone: string;
  pnr: string;
  dob: string;
  ticketNo: string;
  identityNo: string;
};

export type BookingDetailPayment = {
  transactionDate: string;
  amount: number;
  mode: string;
  receiptNo: string;
  status: string;
  currency: string;
};

export type BookingDetailBalance = {
  currency: string;
  allocatedAmount: number;
  balanceAmount: number;
  bookingAmount: number;
  totalRefund: number;
  paidAmount?: number;
};

export type BookingDetailPolicy = {
  isRefundable: string;
  deadline: string;
  cancellationConditions: string;
  cancellationPolicy: string;
};

export type BookingDetailCorporate = {
  name: string;
  phone: string;
  email: string;
  address: string;
  username?: string;
};

export type BookingDetailResult = {
  summary: BookingDetailSummary | null;
  hotel: BookingDetailHotel | null;
  fare: BookingDetailFare | null;
  passengers: BookingDetailPassenger[];
  segments: BookingDetailSegment[];
  payments: BookingDetailPayment[];
  balance: BookingDetailBalance | null;
  policy: BookingDetailPolicy | null;
  corporate: BookingDetailCorporate | null;
  travelStart: string | null;
  travelEnd: string | null;
};

function normalizeBookingToken(value: unknown): string {
  return String(value ?? '').trim();
}

function airportCodeLabel(raw: unknown): string {
  const value = normalizeBookingToken(raw);
  if (!value) return '';
  const match =
    value.match(/([A-Z]{3})\s*\(/i) ??
    value.match(/^([A-Z]{3})$/i) ??
    value.match(/([A-Z]{3})/i);
  if (match) return match[1].toUpperCase();
  return value.replace(/\(\)/g, '').trim();
}

function timeLabel(raw: unknown): string {
  const value = normalizeBookingToken(raw);
  if (!value) return '';
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

/**
 * GuestAPI sometimes labels connecting Oneway legs as "Return".
 * Normalize for display: Oneway → Onward / Connecting; Roundway keeps Onward / Return.
 */
export function normalizeFlightLegLabel(
  rawLeg: string,
  tripType: string,
  index: number,
  total: number
): string {
  const leg = normalizeBookingToken(rawLeg);
  const trip = tripType.toLowerCase();

  if (trip.includes('round')) {
    if (/return/i.test(leg)) return 'Return';
    if (/onward|outbound|depart/i.test(leg)) return 'Onward';
    return index === 0 ? 'Onward' : 'Return';
  }

  if (trip.includes('multi')) {
    return leg || `Leg ${index + 1}`;
  }

  // Oneway (including connections mislabeled as Return)
  if (total <= 1) return 'Onward';
  if (index === 0) return 'Onward';
  if (/return/i.test(leg)) return 'Connecting';
  if (/onward|outbound|depart/i.test(leg) && index > 0) return 'Connecting';
  return leg || 'Connecting';
}

function formatRefundableLabel(raw: unknown): string {
  const value = normalizeBookingToken(raw);
  if (!value) return '';
  if (/^(yes|true|y|1)$/i.test(value)) return 'Yes';
  if (/^(no|false|n|0|non[\s-]?refundable)$/i.test(value)) return 'No';
  return value;
}

function parseFareAmount(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const text = String(raw ?? '').replace(/,/g, '').trim();
  if (!text) return 0;
  const match = text.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

/**
 * Real airline ticket number only — never echo BookingNumber / BookingId / PNR.
 * TravelPort often puts the PNR into TicketNo; Table2/Table4 TicketNo is the
 * authoritative source when present.
 */
export function resolveBookingTicketNo(opts: {
  bookingTicketNo?: string | null;
  ticketCode?: string | null;
  bookingNumber?: string | null;
  bookingId?: string | null;
  pnr?: string | null;
  bookingStatus?: string | null;
  passengerTicketNos?: Array<string | null | undefined>;
  segmentTicketNos?: Array<string | null | undefined>;
}): string {
  const refs = [
    normalizeBookingToken(opts.bookingNumber),
    normalizeBookingToken(opts.bookingId),
    normalizeBookingToken(opts.pnr)
  ].filter(Boolean);

  const isBookingAlias = (ticket: string) => {
    const t = ticket.toLowerCase();
    if (!t) return true;
    return refs.some((ref) => ref.toLowerCase() === t);
  };

  const fromPassengers = [...new Set(
    (opts.passengerTicketNos ?? [])
      .map(normalizeBookingToken)
      .filter((ticket) => ticket && !isBookingAlias(ticket))
  )];
  if (fromPassengers.length > 0) return fromPassengers.join(', ');

  const fromSegments = [...new Set(
    (opts.segmentTicketNos ?? [])
      .map(normalizeBookingToken)
      .filter((ticket) => ticket && !isBookingAlias(ticket))
  )];
  if (fromSegments.length > 0) return fromSegments.join(', ');

  const ticketCode = normalizeBookingToken(opts.ticketCode);
  if (ticketCode && !isBookingAlias(ticketCode)) return ticketCode;

  const bookingTicket = normalizeBookingToken(opts.bookingTicketNo);
  if (bookingTicket && !isBookingAlias(bookingTicket)) return bookingTicket;

  return '';
}

/** Empty when no real ticket — UI shows "None" instead of echoing PNR. */
export function displayTicketNo(ticketNo: string | null | undefined): string {
  return normalizeBookingToken(ticketNo) || 'None';
}

export type BookingSegment = 'scheduled' | 'past';

export type EnrichedBookingCardItem = BookingCardItem & {
  segment: BookingSegment;
  travelStart: string | null;
  travelEnd: string | null;
};

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

/** Parse API date strings such as "31-Jul-2026" or "31 July 2026 00:00". */
export function parseTravelApiDate(raw: string | null | undefined): Date | null {
  const value = (raw ?? '').trim();
  if (!value) return null;

  const dashed = value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
  if (dashed) {
    const day = Number(dashed[1]);
    const month = MONTHS[dashed[2].toLowerCase()];
    const year = Number(dashed[3]);
    if (month == null || Number.isNaN(day) || Number.isNaN(year)) return null;
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const longForm = value.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (longForm) {
    const day = Number(longForm[1]);
    const month = MONTHS[longForm[2].slice(0, 3).toLowerCase()];
    const year = Number(longForm[3]);
    if (month == null || Number.isNaN(day) || Number.isNaN(year)) return null;
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatTravelLabel(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function isTerminalBookingStatus(status: string): boolean {
  const s = status.toLowerCase();
  return (
    s.includes('cancel') ||
    s.includes('refund') ||
    s.includes('complete') ||
    s.includes('closed') ||
    s.includes('void')
  );
}

function extractTravelDatesFromPayload(
  payload: any,
  bookingType: string
): { travelStart: string | null; travelEnd: string | null } {
  const type = bookingType.toLowerCase();
  const table = (name: string): any[] =>
    Array.isArray(payload?.[name]) ? payload[name] : [];

  if (type.includes('hotel')) {
    const hotel = table('Table8')[0];
    const start = parseTravelApiDate(hotel?.CheckInDtt ?? hotel?.CheckInDt);
    const end = parseTravelApiDate(hotel?.CheckOutDtt ?? hotel?.CheckOutDt);
    return {
      travelStart: formatTravelLabel(start),
      travelEnd: formatTravelLabel(end ?? start)
    };
  }

  if (type.includes('car') || type.includes('rent')) {
    const car = table('Table13')[0] ?? table('Table14')[0] ?? table('Table2')[0];
    const start = parseTravelApiDate(
      car?.PickupDtt ?? car?.PickupDt ?? car?.PickupDateTime ?? car?.TFSDepDatedt
    );
    const end = parseTravelApiDate(
      car?.ReturnDtt ?? car?.ReturnDt ?? car?.ReturnDateTime ?? car?.TFSArrDatedt
    );
    return {
      travelStart: formatTravelLabel(start),
      travelEnd: formatTravelLabel(end ?? start)
    };
  }

  const segments = table('Table2');
  const depDates = segments
    .map((seg) => parseTravelApiDate(seg?.TFSDepDatedt))
    .filter((date): date is Date => date != null);
  const arrDates = segments
    .map((seg) => parseTravelApiDate(seg?.TFSArrDatedt))
    .filter((date): date is Date => date != null);

  if (depDates.length > 0 || arrDates.length > 0) {
    const start = depDates.length > 0 ? new Date(Math.min(...depDates.map((d) => d.getTime()))) : null;
    const end = arrDates.length > 0 ? new Date(Math.max(...arrDates.map((d) => d.getTime()))) : start;
    return {
      travelStart: formatTravelLabel(start),
      travelEnd: formatTravelLabel(end)
    };
  }

  const summary = table('Table')[0];
  const due = parseTravelApiDate(summary?.DueDate);
  return {
    travelStart: formatTravelLabel(due),
    travelEnd: formatTravelLabel(due)
  };
}

export function classifyBookingSegment(
  item: BookingCardItem,
  travelStart: string | null,
  travelEnd: string | null
): BookingSegment {
  const status = `${item.BookingStatus ?? ''} ${item.AuthorizedStatus ?? ''}`.trim();
  if (isTerminalBookingStatus(status)) return 'past';

  const endDate = parseTravelApiDate(travelEnd) ?? parseTravelApiDate(travelStart);
  if (endDate) {
    return endDate < startOfDay(new Date()) ? 'past' : 'scheduled';
  }

  return classifyBookingSegmentFromList(item);
}

/** Fast list-only classification — used before travel dates are loaded. */
export function classifyBookingSegmentFromList(item: BookingCardItem): BookingSegment {
  const status = `${item.BookingStatus ?? ''} ${item.AuthorizedStatus ?? ''}`.trim();
  if (isTerminalBookingStatus(status)) return 'past';

  const bookedOn = parseBookedOnDate(item.BookedOn);
  if (bookedOn) {
    const today = startOfDay(new Date());
    const bookedDay = startOfDay(bookedOn);
    const ageDays = Math.floor((today.getTime() - bookedDay.getTime()) / 86_400_000);
    if (ageDays > 21) return 'past';
  }

  return 'scheduled';
}

function parseBookedOnDate(raw: string | null | undefined): Date | null {
  const value = (raw ?? '').trim();
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{2})/);
  if (!match) return null;
  const [, mm, dd, yy] = match;
  const date = new Date(2000 + Number(yy), Number(mm) - 1, Number(dd));
  return Number.isNaN(date.getTime()) ? null : date;
}

const segmentCache = new Map<
  number,
  { segment: BookingSegment; travelStart: string | null; travelEnd: string | null }
>();

export function rememberBookingSegment(
  bookFlightId: number,
  segment: BookingSegment,
  travelStart: string | null = null,
  travelEnd: string | null = null
): void {
  segmentCache.set(bookFlightId, { segment, travelStart, travelEnd });
}

export function enrichBookingsFromCache(
  bookings: BookingCardItem[]
): EnrichedBookingCardItem[] {
  return bookings.map((item) => {
    const cached = segmentCache.get(item.BookFlightId);
    if (cached) {
      return { ...item, ...cached };
    }
    return {
      ...item,
      segment: classifyBookingSegmentFromList(item),
      travelStart: null,
      travelEnd: null
    };
  });
}

export function toProvisionalEnrichedBookings(
  bookings: BookingCardItem[]
): EnrichedBookingCardItem[] {
  return enrichBookingsFromCache(bookings);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), ms);
    promise.
      then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      }).
      catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index++;
      results[current] = await mapper(items[current]);
    }
  });
  await Promise.all(workers);
  return results;
}

type EnrichOptions = {
  concurrency?: number;
  timeoutMs?: number;
};

/**
 * Refine the most recent bookings using travel dates from the detail API.
 * Runs in the background and updates the segment cache.
 */
export async function enrichRecentBookingsWithSegments(
  bookings: BookingCardItem[],
  options: EnrichOptions = {}
): Promise<EnrichedBookingCardItem[]> {
  const { concurrency = 3, timeoutMs = 10_000 } = options;
  const recent = [...bookings].
    sort((a, b) => Number(b.SlNo ?? 0) - Number(a.SlNo ?? 0)).
    slice(0, 12);

  await mapWithConcurrency(recent, concurrency, async (item) => {
    try {
      const detail = await withTimeout(
        bookingCardViewGet(item.BookFlightId),
        timeoutMs
      );
      const segment = classifyBookingSegment(item, detail.travelStart, detail.travelEnd);
      rememberBookingSegment(
        item.BookFlightId,
        segment,
        detail.travelStart,
        detail.travelEnd
      );
    } catch {
      // Keep list-based classification for this booking.
    }
  });

  return enrichBookingsFromCache(bookings);
}

/** @deprecated Use enrichRecentBookingsWithSegments instead. */
export async function enrichBookingsWithSegments(
  bookings: BookingCardItem[],
  options: EnrichOptions = {}
): Promise<EnrichedBookingCardItem[]> {
  return enrichRecentBookingsWithSegments(bookings, options);
}

export function filterBookingsBySegment(
  bookings: EnrichedBookingCardItem[],
  segment: BookingSegment
): EnrichedBookingCardItem[] {
  return bookings.filter((item) => item.segment === segment);
}

/**
 * BookingCardViewGet — full detail for one booking.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=BookingCardViewGet
 */
export async function bookingCardViewGet(
  bookFlightId: number
): Promise<BookingDetailResult> {
  const strings = await callGuestApi('BookingCardViewGet', [
    { name: 'BookFlightId', value: String(bookFlightId) }
  ]);

  const empty: BookingDetailResult = {
    summary: null,
    hotel: null,
    fare: null,
    passengers: [],
    segments: [],
    payments: [],
    balance: null,
    policy: null,
    corporate: null,
    travelStart: null,
    travelEnd: null
  };

  const payload = parseJsonPayload(strings);
  if (!payload) return empty;

  const travelDates = extractTravelDatesFromPayload(
    payload,
    String(payload?.Table?.[0]?.BookingType ?? '')
  );

  const t = (name: string): any[] =>
    Array.isArray(payload[name]) ? payload[name] : [];

  const s = t('Table')[0];
  const tripType = normalizeBookingToken(s?.TripType);
  const rawSegments = t('Table2');

  // Flight travellers live in Table4; some hotel flows use Table10.
  const rawPassengers =
    t('Table4').length > 0 ? t('Table4') : t('Table10');

  const segments: BookingDetailSegment[] = rawSegments.map(
    (seg: any, index: number) => ({
      pnr: normalizeBookingToken(seg.PNR),
      ticketNo: normalizeBookingToken(seg.TicketNo),
      airline: normalizeBookingToken(seg.TFSAirline),
      flightNumber: normalizeBookingToken(seg.TFSFlightNumber),
      flightLeg: normalizeFlightLegLabel(
        String(seg.TFSFlight ?? ''),
        tripType,
        index,
        rawSegments.length
      ),
      depAirport: airportCodeLabel(seg.TFSDepAirport),
      arrAirport: airportCodeLabel(seg.TFSArrAirport),
      depDate: normalizeBookingToken(seg.TFSDepDatedt),
      arrDate: normalizeBookingToken(seg.TFSArrDatedt),
      depTime: timeLabel(seg.TFSDepTime),
      arrTime: timeLabel(seg.TFSArrTime),
      duration: normalizeBookingToken(seg.TFSDuration || seg.TFSDuration1),
      className: normalizeBookingToken(seg.TFSClassName),
      stops: Number(seg.TFSTotalStop ?? seg.TFSTotalStop1 ?? 0),
      equipment: normalizeBookingToken(seg.Equipment),
      terminalDep: normalizeBookingToken(seg.TFSDepTerminal) || undefined,
      terminalArr: normalizeBookingToken(seg.TFSArrTerminal) || undefined
    })
  );

  const passengers: BookingDetailPassenger[] = rawPassengers.map((p: any) => ({
    name: normalizeBookingToken(p.Passenger ?? p.Name),
    type: normalizeBookingToken(p.Type),
    email: normalizeBookingToken(p.TFPEmail ?? p.Email ?? p.CustEmail),
    phone: normalizeBookingToken(p.TFPPhoneNo ?? p.PhoneNo ?? p.CustPhone),
    pnr: normalizeBookingToken(p.PNR),
    dob: normalizeBookingToken(p.TFPDOB),
    ticketNo: normalizeBookingToken(p.TicketNo),
    identityNo: normalizeBookingToken(p.TFPIdentityNo)
  }));

  const bookingNumber = normalizeBookingToken(s?.BookingNumber);
  const bookingId = normalizeBookingToken(s?.BookingId);
  const bookingStatus = normalizeBookingToken(s?.BookingStatus);
  const segmentPnr =
    segments.map((seg) => seg.pnr).find(Boolean) ??
    bookingId ??
    bookingNumber ??
    '';
  const resolvedTicketNo = resolveBookingTicketNo({
    bookingTicketNo: s?.TicketNo,
    ticketCode: s?.TicketCode,
    bookingNumber,
    bookingId,
    pnr: segmentPnr,
    bookingStatus,
    passengerTicketNos: passengers.map((p) => p.ticketNo),
    segmentTicketNos: segments.map((seg) => seg.ticketNo)
  });

  const summary: BookingDetailSummary | null = s ?
  {
    bookFlightId: Number(s.BookFlightId ?? bookFlightId),
    bookingId,
    bookingType: normalizeBookingToken(s.BookingType),
    bookingStatus,
    confirmStatus: normalizeBookingToken(s.ConfirmStatus),
    ticketNo: resolvedTicketNo,
    ticketCode: normalizeBookingToken(s.TicketCode),
    bookingNumber,
    bookedOn: normalizeBookingToken(s.BookedOnDt),
    dueDate: normalizeBookingToken(s.DueDate),
    totalAmount: normalizeBookingToken(s.BookingTotalAmount),
    bookingApi: normalizeBookingToken(s.BookingAPI),
    payStatus: normalizeBookingToken(s.PayStatus),
    paidStatus: normalizeBookingToken(s.PaidStatus),
    tripType,
    pnr: segmentPnr || bookingId
  } :
  null;

  const h = t('Table8')[0];
  const hotel: BookingDetailHotel | null = h ?
  {
    hotelName: h.HotelName ?? '',
    starCategory: h.StarCategory ?? '',
    address: h.HotelAddress ?? '',
    nights: Number(h.NoofNights ?? 0),
    checkIn: h.CheckInDtt ?? h.CheckInDt ?? '',
    checkOut: h.CheckOutDtt ?? h.CheckOutDt ?? '',
    roomType: h.RoomType ?? '',
    guests: (h.Count ?? '').trim(),
    phone: h.Phone ?? '',
    email: h.Email ?? '',
    status: h.BookingStatus ?? ''
  } :
  null;

  // Table6 has correct numeric BaseFare / InputTax; Table11 BaseFare can be the total string.
  const f = t('Table6')[0] ?? t('Table11')[0] ?? t('Table15')[0];
  const fare: BookingDetailFare | null = f ?
  (() => {
    const currency = normalizeBookingToken(f.Currency) || 'ETB';
    const baseFare = parseFareAmount(f.BaseFare);
    const inputTax = parseFareAmount(f.InputTax);
    const gstAmount = parseFareAmount(f.GSTAmount);
    const serviceTaxAmount = parseFareAmount(f.ServiceTaxAmount);
    const discountAmount = parseFareAmount(f.DiscountAmount);
    const grandTotal = parseFareAmount(
      f.GrandTotal ?? f.GrandTotal1 ?? f.TotalFare ?? f.TotalNett
    );
    return {
      currency,
      baseFare: baseFare ? String(baseFare) : normalizeBookingToken(f.BaseFare),
      // Primary tax line = InputTax (airline tax); GST/service shown separately.
      taxAmount: inputTax,
      serviceTaxAmount,
      discountAmount,
      grandTotal,
      totalNett: parseFareAmount(f.TotalNett ?? f.TotalFare) || undefined,
      gstAmount: gstAmount || undefined,
      inputTax: inputTax || undefined
    };
  })() :
  null;

  const payments: BookingDetailPayment[] = t('Table26').map((p: any) => ({
    transactionDate: normalizeBookingToken(p.TransactionDate),
    amount: Number(p.TransactionAmount ?? 0),
    mode: normalizeBookingToken(p.ModeofPayment),
    receiptNo: normalizeBookingToken(p.ReceiptNo_TransId),
    status: normalizeBookingToken(p.Status),
    currency: normalizeBookingToken(p.Currency) || 'ETB'
  }));

  const paidRow = t('Table38')[0] ?? t('Table46')[0];
  const paidAmount = paidRow ? parseFareAmount(paidRow.PaidAmount) : undefined;

  const b = t('Table34')[0];
  const balance: BookingDetailBalance | null = b ?
  {
    currency: normalizeBookingToken(b.Currency) || 'ETB',
    allocatedAmount: Number(b.AllocatedAmount ?? 0),
    balanceAmount: Number(b.BalanceAmount ?? 0),
    bookingAmount: Number(b.BookingAmount ?? 0),
    totalRefund: Number(b.TotalRefund ?? 0),
    paidAmount
  } :
  paidAmount != null ?
  {
    currency: fare?.currency || 'ETB',
    allocatedAmount: 0,
    balanceAmount: Math.max(0, (fare?.grandTotal ?? 0) - paidAmount),
    bookingAmount: fare?.grandTotal ?? 0,
    totalRefund: 0,
    paidAmount
  } :
  null;

  const pol = t('Table12')[0] ?? t('Table21')[0];
  const roomPolicy = t('Table42')[0];
  const conditions = t('Table9')[0] ?? t('Table18')[0];
  const policy: BookingDetailPolicy | null =
  pol || roomPolicy || conditions ?
  {
    isRefundable: formatRefundableLabel(pol?.IsRefundable),
    deadline: normalizeBookingToken(pol?.Deadline),
    cancellationConditions: normalizeBookingToken(
      conditions?.CancellationConditions
    ),
    cancellationPolicy: normalizeBookingToken(roomPolicy?.CancellationPolicy)
  } :
  null;

  const corp = t('Table48')[0] ?? t('Table47')[0];
  const corporate: BookingDetailCorporate | null = corp ?
  {
    name: normalizeBookingToken(
      corp.Name ?? corp['Corporate Name'] ?? corp.Username
    ),
    phone: normalizeBookingToken(corp.Phone),
    email: normalizeBookingToken(corp.EMail ?? corp.Email),
    address: normalizeBookingToken(
      corp.Address ||
      [
        corp.AddressLine1,
        corp.AddressLine2,
        corp.City,
        corp.PostCode
      ].
      filter(Boolean).
      join(', ')
    ),
    username: normalizeBookingToken(corp.Username) || undefined
  } :
  null;

  return {
    summary,
    hotel,
    fare,
    passengers,
    segments,
    payments,
    balance,
    policy,
    corporate,
    travelStart: travelDates.travelStart,
    travelEnd: travelDates.travelEnd
  };
}
