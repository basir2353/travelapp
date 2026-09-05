import { Trip } from '../../components/travel/ethioTravelData';
import { resolveBusTicketFare } from '../../utils/busDisplayFare';
import type { BusListItem } from './mapBusToTrip';

function pickString(item: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function pickNumber(item: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const raw = item[key];
    if (raw == null || raw === '') continue;
    const value = Number(String(raw).replace(/,/g, ''));
    if (!Number.isNaN(value) && value > 0) return value;
  }
  return 0;
}

/** Bus2 rejects non-numeric BusId values like "23-0" with invalid JSON / 500. */
function numericId(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  const match = String(raw ?? '').match(/\d+/);
  if (!match) return 0;
  const value = Number(match[0]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Build JsonSelectBus for Bus2_SelecSeat.
 * Matches GuestAPI sample: RouteId + Manual Bus fields (no extra list-row keys).
 */
export function buildJsonSelectBus(
  trip: Trip,
  options?: { originLabel?: string; originCityId?: string }
): string {
  const item = (trip.apiPayload ?? {}) as BusListItem;
  const origin =
    options?.originLabel ||
    pickString(item, ['Origin', 'Departurename', 'BoardingPointsDetails']) ||
    trip.fromCity ||
    'Addis Ababa';
  const busId =
    numericId(item.BusId) ||
    numericId(item.BusID) ||
    numericId(trip.id);
    const basePrice =
    resolveBusTicketFare(item) ||
    pickNumber(item, [
      'ShowPrice',
      'BasePrice',
      'PublishedPrice',
      'OfferedPrice',
      'Fare'
    ]) || trip.price || 0;
  const showPrice = (() => {
    const raw = pickString(item, ['ShowPrice']) || String(basePrice);
    const n = Number(String(raw).replace(/,/g, ''));
    return Number.isFinite(n) && n > 0 ? n.toFixed(2) : basePrice.toFixed(2);
  })();
  const depart = (
    pickString(item, ['DepartureTimeFormat', 'DepartureTime', 'OriginCityTime']) ||
    trip.departTime
  ).replace(/\s+/g, '');
  const arrive = (
    pickString(item, ['ArrivalTimeFormat', 'ArrivalTime', 'DestinationCityTime']) ||
    trip.arriveTime
  ).replace(/\s+/g, '');
  const travelName =
    pickString(item, ['TravelName', 'TravelsName', 'BusName']) || trip.operator;
  const busType = pickString(item, ['BusType']) || trip.busType || 'A/C Sleeper';
  const seats =
    pickNumber(item, ['AvailableSeats']) || trip.seatsAvailable || 40;
  const routeId =
    numericId(item.RouteId) ||
    numericId(item.RouteID) ||
    numericId(options?.originCityId) ||
    busId ||
    4;

  const payload: Record<string, unknown> = {
    TraceId: pickString(item, ['TraceId', 'TraceID']) || '',
    ResultIndex: String(
      item.ResultIndex != null && item.ResultIndex !== '' ?
        item.ResultIndex :
        '1'
    ),
    Origin: origin,
    RouteId: String(routeId),
    ArrivalTimeFormat: arrive,
    AvailableSeats: seats,
    DepartureTimeFormat: depart,
    TotalTravelMinutesFormat:
      pickString(item, ['TotalTravelMinutesFormat']) || trip.duration || '',
    BusType: busType,
    ServiceName: pickString(item, ['ServiceName']) || 'Manual Bus',
    TravelName: travelName,
    IdProofRequired: false,
    IsDropPointMandatory: false,
    LiveTrackingAvailable: false,
    MTicketEnabled: true,
    MaxSeatsPerTicket: 6,
    OperatorId: Number(item.OperatorId) || 1,
    PartialCancellationAllowed: false,
    CurrencyCode: pickString(item, ['CurrencyCode', 'DefaultCurrency']) || 'ETB',
    BasePrice: basePrice,
    Tax: Number(item.Tax) || 0,
    OtherCharges: Number(item.OtherCharges) || 0,
    Discount: Number(item.Discount) || 0,
    PublishedPrice: Number(item.PublishedPrice) || basePrice,
    PublishedPriceRoundedOff:
      Number(item.PublishedPriceRoundedOff) || basePrice,
    OfferedPrice: Number(item.OfferedPrice) || basePrice,
    OfferedPriceRoundedOff: Number(item.OfferedPriceRoundedOff) || basePrice,
    AgentCommission: Number(item.AgentCommission) || 0,
    AgentMarkUp: Number(item.AgentMarkUp) || 0,
    TDS: Number(item.TDS) || 0,
    IGSTAmount: Number(item.IGSTAmount) || 0,
    IGSTRate: Number(item.IGSTRate) || 0,
    ResultIndexOrg: String(item.ResultIndexOrg ?? item.ResultIndex ?? '1'),
    DefaultCurrency: pickString(item, ['DefaultCurrency']) || 'INR',
    BookingAPI: pickString(item, ['BookingAPI']) || 'Manual',
    BoardingPointsDetails:
      pickString(item, ['BoardingPointsDetails']) || origin,
    CancellationDetails: pickString(item, ['CancellationDetails']) || '',
    APICurrency: pickString(item, ['APICurrency']) || 'INR',
    ShowCurrency: pickString(item, ['ShowCurrency']) || 'INR',
    ConversionRate: Number(item.ConversionRate) || 1,
    ShowPrice: showPrice
  };
  if (busId > 0) payload.BusId = busId;

  return JSON.stringify([payload]);
}

/** Compact bus object for Bus3_SelecBus / Bus_Booking. */
export function buildJsonSelectBusForBooking(
  trip: Trip,
  options?: {
    originLabel?: string;
    destinationLabel?: string;
    travelDateIso?: string;
    arrivalDateIso?: string;
  }
): string {
  const item = (trip.apiPayload ?? {}) as BusListItem;
  const busId = Number(pickString(item, ['BusId', 'BusID']) || trip.id) || 0;
  const basePrice =
    resolveBusTicketFare(item) ||
    pickNumber(item, ['ShowPrice', 'BasePrice', 'PublishedPrice']) ||
    trip.price ||
    0;
  const origin =
    options?.originLabel ||
    pickString(item, ['Origin', 'Departurename']) ||
    trip.fromCity;
  const destination =
    options?.destinationLabel ||
    pickString(item, ['Destination']) ||
    trip.toCity;

  const payload = {
    Id: Number(pickString(item, ['Id', 'RouteId', 'RouteID'])) || busId || 4,
    BusId: busId || 23,
    AvailableSeats: String(
      pickNumber(item, ['AvailableSeats']) || trip.seatsAvailable || 120
    ),
    BusName:
      pickString(item, ['BusName', 'TravelName']) || trip.operator,
    TravelName:
      pickString(item, ['TravelName', 'TravelsName']) || trip.operator,
    Origin: origin,
    Destination: destination,
    BusType: pickString(item, ['BusType']) || trip.busType || 'A/C Sleeper',
    DepartureDateFormat: options?.travelDateIso || '',
    DepartureTimeFormat:
      pickString(item, ['DepartureTimeFormat']) || trip.departTime,
    ArrivalDateFormat: options?.arrivalDateIso || options?.travelDateIso || '',
    ArrivalTimeFormat:
      pickString(item, ['ArrivalTimeFormat']) || trip.arriveTime,
    OriginCityTime:
      pickString(item, ['OriginCityTime', 'DepartureTimeFormat']) ||
      trip.departTime,
    DestinationCityTime:
      pickString(item, ['DestinationCityTime', 'ArrivalTimeFormat']) ||
      trip.arriveTime,
    BasePrice: basePrice
  };

  return JSON.stringify([payload]);
}

export function buildJsonSelectSeat(
  seats: Array<{ seatName: string; seatFare: number }>
): string {
  return JSON.stringify(
    seats.map((s) => ({
      SeatName: s.seatName,
      SeatFare: s.seatFare
    }))
  );
}

export type BusSeatStatus = 'available' | 'booked' | 'premium';

export type BusSeatInfo = {
  seatId: string;
  status: BusSeatStatus;
  price?: number;
  seatType?: string;
  isAvailable?: boolean;
  isLadiesSeat?: boolean;
  isUpper?: boolean;
  busId?: string;
  raw?: Record<string, unknown>;
};

type SeatRecord = Record<string, unknown>;

function normalizeSeatId(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

function parseFlag(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value == null || value === '') return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (
    normalized === 'false' ||
    normalized === '0' ||
    normalized === 'no' ||
    normalized === 'n'
  ) {
    return false;
  }
  if (
    normalized === 'true' ||
    normalized === '1' ||
    normalized === 'yes' ||
    normalized === 'y'
  ) {
    return true;
  }
  return undefined;
}

/** GuestAPI Bus2 sample: SeatStatus "Booked" and IsAvailable false. */
export function isBusSeatBooked(
  seatStatus: string,
  isAvailable?: boolean
): boolean {
  if (isAvailable === false) return true;
  const normalized = seatStatus.trim().toLowerCase();
  return (
    normalized === 'booked' ||
    normalized.includes('book') ||
    normalized.includes('sold') ||
    normalized.includes('reserved') ||
    normalized.includes('unavailable') ||
    normalized === '0' ||
    normalized === 'false'
  );
}

function seatStatusFromValue(
  value: string,
  isAvailable?: boolean,
  isLadiesSeat?: boolean
): BusSeatStatus {
  if (isBusSeatBooked(value, isAvailable)) return 'booked';
  if (
    isLadiesSeat ||
    value.toLowerCase().includes('premium') ||
    value.toLowerCase().includes('ladies')
  ) {
    return 'premium';
  }
  return 'available';
}

function recordToSeat(item: SeatRecord): BusSeatInfo | null {
  const seatId = normalizeSeatId(
    pickString(item, [
      'SeatNo',
      'SeatNumber',
      'SeatName',
      'SeatId',
      'SeatID',
      'Number',
      'Name'
    ])
  );
  if (!seatId) return null;

  const statusValue = pickString(item, ['SeatStatus', 'Status', 'Availability']);
  const isAvailable = parseFlag(item.IsAvailable ?? item.Available);
  const isLadiesSeat = parseFlag(item.IsLadiesSeat) === true;
  const isUpper = parseFlag(item.IsUpper) === true;

  const price = resolveBusTicketFare(item) || pickNumber(item, ['Price', 'SeatFare', 'Fare', 'BasePrice']);

  return {
    seatId,
    status:
      statusValue || isAvailable != null || isLadiesSeat ?
        seatStatusFromValue(statusValue, isAvailable, isLadiesSeat) :
        'available',
    price: price || undefined,
    seatType: pickString(item, ['SeatType']) || undefined,
    isAvailable,
    isLadiesSeat,
    isUpper,
    busId: pickString(item, ['BusId', 'BusID']) || undefined,
    raw: item
  };
}

function collectSeatRecords(value: unknown, bucket: SeatRecord[]): void {
  if (!value) return;

  if (Array.isArray(value)) {
    for (const entry of value) {
      collectSeatRecords(entry, bucket);
    }
    return;
  }

  if (typeof value !== 'object') return;

  const record = value as SeatRecord;
  const seat = recordToSeat(record);
  if (seat) {
    bucket.push(record);
    return;
  }

  for (const nested of Object.values(record)) {
    if (Array.isArray(nested) || (nested && typeof nested === 'object')) {
      collectSeatRecords(nested, bucket);
    }
  }
}

export function parseBusSeatLayout(
  items: SeatRecord[]
): { seats: BusSeatInfo[]; apiMessage?: string } {
  const seatRecords: SeatRecord[] = [];
  let apiMessage: string | undefined;

  for (const item of items) {
    const errorMessage = pickString(item, [
      'ErrorMessage',
      'errorMessage',
      'Message'
    ]);
    if (errorMessage) apiMessage = errorMessage;
    collectSeatRecords(item, seatRecords);
  }

  const seats = seatRecords.
  map(recordToSeat).
  filter((seat): seat is BusSeatInfo => seat !== null);

  const unique = new Map<string, BusSeatInfo>();
  for (const seat of seats) {
    unique.set(seat.seatId, seat);
  }

  return {
    seats: Array.from(unique.values()).sort((a, b) => {
      const an = Number(a.seatId);
      const bn = Number(b.seatId);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
      return a.seatId.localeCompare(b.seatId);
    }),
    apiMessage
  };
}

/** Map cabin label (1A) to Bus2 numeric SeatNo (1) when the API returns numbers. */
export function cabinSeatToApiKey(seatId: string): string {
  const lettered = seatId.match(/^(\d+)([A-D])$/i);
  if (!lettered) return seatId.replace(/\s+/g, '').toUpperCase();
  const row = Number(lettered[1]);
  const col = lettered[2].toUpperCase() as 'A' | 'B' | 'C' | 'D';
  const colIdx = { A: 0, B: 1, C: 2, D: 3 }[col] ?? 0;
  return String((row - 1) * 4 + colIdx + 1);
}

export function findBusApiSeat(
  seats: BusSeatInfo[],
  seatId: string
): BusSeatInfo | undefined {
  const normalized = seatId.replace(/\s+/g, '').toUpperCase();
  const apiKey = cabinSeatToApiKey(seatId);
  return (
    seats.find((s) => s.seatId === seatId) ||
    seats.find((s) => s.seatId === normalized) ||
    seats.find((s) => s.seatId === apiKey) ||
    seats.find((s) => s.seatId === String(Number(apiKey)))
  );
}

export function isOccupiedBusSeat(seat: BusSeatInfo): boolean {
  return seat.status === 'booked' || seat.isAvailable === false;
}

/** Bus2 returns a flat SeatNo list (1..120). Cabin is 2-2: 1,2 | aisle | 3,4. */
export function chunkBusSeatRows(
  seats: BusSeatInfo[],
  seatsPerRow = 4
): BusSeatInfo[][] {
  const rows: BusSeatInfo[][] = [];
  for (let i = 0; i < seats.length; i += seatsPerRow) {
    rows.push(seats.slice(i, i + seatsPerRow));
  }
  return rows;
}
