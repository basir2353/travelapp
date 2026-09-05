/** Strip airport/terminal codes e.g. "Addis Ababa (ADD)" → "Addis Ababa". */
export function stripCityLabel(city: string): string {
  return city.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export function formatBusTravelDate(date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Display label e.g. "Mon 30 Jun 2026". */
export function formatBusTravelDateLabel(date = new Date()): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/** Parse DD/MM/YYYY into a Date. */
export function parseBusTravelDate(value: string): Date {
  const [dd, mm, yyyy] = value.split('/').map(Number);
  return new Date(yyyy, (mm || 1) - 1, dd || 1);
}

/** Format a Date as YYYY-MM-DD for native date inputs. */
export function toInputDateValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Normalize common travel date strings to YYYY-MM-DD (local). */
export function toIsoTravelDate(value?: string | null): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    return toInputDateValue(parseBusTravelDate(raw));
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split('-').map(Number);
    if (yyyy && mm && dd) return toInputDateValue(new Date(yyyy, mm - 1, dd));
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return toInputDateValue(parsed);
  return '';
}

/** Add calendar days to a YYYY-MM-DD value. */
export function addIsoTravelDays(isoDate: string, days: number): string {
  const base = toIsoTravelDate(isoDate);
  if (!base) return '';
  const [y, m, d] = base.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  date.setDate(date.getDate() + days);
  return toInputDateValue(date);
}

/**
 * Passport must remain valid at least one day after travel ends.
 * Example (Basit): travel 10-Sep / return 23-Sep-2026 → expiry on/after 24-Sep-2026
 * (not before that date).
 */
export function minPassportExpiryIso(travelEndIso?: string | null): string {
  const end = toIsoTravelDate(travelEndIso);
  if (!end) return '';
  return addIsoTravelDays(end, 1);
}

export function isPassportExpiryValidForTravel(
  expiryIso: string,
  travelEndIso?: string | null,
  issueIso?: string | null
): boolean {
  const expiry = toIsoTravelDate(expiryIso);
  if (!expiry) return false;
  const today = toInputDateValue(new Date());
  if (expiry < today) return false;
  const issue = toIsoTravelDate(issueIso);
  if (issue && expiry < issue) return false;
  const minExpiry = minPassportExpiryIso(travelEndIso);
  if (minExpiry && expiry < minExpiry) return false;
  return true;
}

/** Parse YYYY-MM-DD from a native date input. */
export function parseInputDateValue(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Rental days between pickup and return (minimum 1). */
export function rentalDayCount(pickup: string, returnDate: string): number {
  const start = parseBusTravelDate(pickup);
  const end = parseBusTravelDate(returnDate);
  const diff = Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
  return Math.max(1, diff);
}

/** Short label e.g. "16 Jun" from DD/MM/YYYY. */
export function formatCarDateShort(value: string): string {
  return parseBusTravelDate(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short'
  });
}

/** Default pickup date — one week ahead tends to work better with Car1_List. */
export function defaultCarPickupDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

/** Default return date — three days after default pickup. */
export function defaultCarReturnDate(pickup = defaultCarPickupDate()): Date {
  const date = new Date(pickup);
  date.setDate(date.getDate() + 3);
  return date;
}

/** Extract IATA code e.g. "Addis Ababa (ADD)" → "ADD". */
export function extractAirportCode(label: string): string {
  const match = label.match(/\(([A-Z]{3})\)\s*$/);
  if (match) return match[1];
  const trimmed = label.trim();
  if (/^[A-Z]{3}$/.test(trimmed)) return trimmed;
  return '';
}

/** Format date for GetOnewayList — DD-MM-YYYY. */
export function formatFlightApiDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseBusTravelDate(date) : date;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/** Earliest selectable flight depart date — today (no forced lead days). */
export const FLIGHT_MIN_LEAD_DAYS = 0;

/** Default flight depart date — today. */
export function defaultFlightDepartDate(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + FLIGHT_MIN_LEAD_DAYS);
  return date;
}

/** Keep depart on/after today so GetOnewayList still gets searchable dates. */
export function ensureFlightSearchDate(
  date: Date,
  minLeadDays = FLIGHT_MIN_LEAD_DAYS
): Date {
  const min = new Date();
  min.setHours(0, 0, 0, 0);
  min.setDate(min.getDate() + minLeadDays);
  const candidate = new Date(date);
  candidate.setHours(0, 0, 0, 0);
  return candidate.getTime() < min.getTime() ? min : candidate;
}

/** Keep return on or after depart; default to +10 days when invalid. */
export function ensureFlightReturnDate(
  depart: Date,
  returnDate: Date
): Date {
  const departDay = ensureFlightSearchDate(depart);
  const ret = new Date(returnDate);
  ret.setHours(0, 0, 0, 0);
  return ret.getTime() <= departDay.getTime() ?
    defaultFlightReturnDate(departDay) :
    ret;
}

/** Short label e.g. "Fri, 20 Jul". */
export function formatFlightDateLabel(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

/** Earliest selectable depart date for native date inputs. */
export function minimumFlightInputDate(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + FLIGHT_MIN_LEAD_DAYS);
  return date;
}

/** Default flight return date — ten days after default depart. */
export function defaultFlightReturnDate(depart = defaultFlightDepartDate()): Date {
  const date = new Date(depart);
  date.setDate(date.getDate() + 10);
  return date;
}

/** Default hotel check-in — three weeks ahead. */
export function defaultHotelCheckInDate(): Date {
  return defaultFlightDepartDate();
}

/** Default hotel check-out — one night after check-in. */
export function defaultHotelCheckOutDate(checkIn = defaultHotelCheckInDate()): Date {
  const date = new Date(checkIn);
  date.setDate(date.getDate() + 1);
  return date;
}

/** Format date for Hotel1_List — DD-MM-YYYY. */
export function formatHotelApiDate(date: Date | string): string {
  return formatFlightApiDate(date);
}

/** Format date for Car1_List — DD-MM-YYYY (GuestAPI sample uses dashes, not slashes). */
export function formatCarApiDate(date: Date | string): string {
  if (typeof date === 'string') {
    if (date.includes('-')) {
      const [dd, mm, yyyy] = date.split('-').map(Number);
      return `${String(dd).padStart(2, '0')}-${String(mm).padStart(2, '0')}-${yyyy}`;
    }
    return formatFlightApiDate(parseBusTravelDate(date));
  }
  return formatFlightApiDate(date);
}
