import { KTA, Trip } from '../../components/travel/ethioTravelData';
import { resolveBusTicketFare } from '../../utils/busDisplayFare';

export type BusListItem = Record<string, unknown>;

const OPERATOR_COLORS = [KTA.navy, KTA.blue, '#2563eb', '#14B8A6', '#dc2626'];

function pickString(item: BusListItem, keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function pickNumber(item: BusListItem, keys: string[]): number {
  for (const key of keys) {
    const raw = item[key];
    if (raw == null || raw === '') continue;
    const value = Number(String(raw).replace(/,/g, ''));
    if (!Number.isNaN(value) && value > 0) return value;
  }
  return 0;
}

function operatorColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return OPERATOR_COLORS[Math.abs(hash) % OPERATOR_COLORS.length];
}

/** Normalize "05.45AM" / "12:30" / .NET "05:45:00.0000000" → display time. */
export function formatBusTime(raw: string): string {
  if (!raw) return '—';
  const cleaned = raw.trim().replace(/\s+/g, '');
  const timeSpan = cleaned.match(/^(\d{1,2}):(\d{2}):(\d{2})/);
  if (timeSpan) {
    let hours = Number(timeSpan[1]);
    const minutes = timeSpan[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    if (hours === 0) hours = 12;
    else if (hours > 12) hours -= 12;
    return `${String(hours).padStart(2, '0')}.${minutes}${ampm}`;
  }
  const ampm = cleaned.match(/^(\d{1,2})[.:](\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    return `${ampm[1].padStart(2, '0')}.${ampm[2]}${ampm[3].toUpperCase()}`;
  }
  const match = cleaned.match(/(\d{1,2}[:.]\d{2})/);
  return match ? match[1].replace(':', '.') : cleaned.slice(0, 8);
}

function buildId(item: BusListItem, index: number): string {
  const busId = pickString(item, ['BusId', 'BusID', 'Id', 'ID']);
  const amenity = pickString(item, ['Amenities', 'Amenity']);
  if (busId) {
    return amenity ? `${busId}-${amenity}` : `${busId}-${index}`;
  }
  return (
    pickString(item, [
      'ReferenceNumber',
      'ReferenceNo',
      'RouteId',
      'RouteID',
      'TraceNo',
      'TripId'
    ]) || `bus-${index}`
  );
}

/** Full bus rows from Bus1_List (skip TravelName-only / time-only summary rows). */
export function isFullBusListItem(item: BusListItem): boolean {
  if (!item || typeof item !== 'object') return false;
  const hasBusId = item.BusId != null || item.BusID != null;
  const hasPrice =
    pickNumber(item, [
      'BasePrice',
      'ShowPrice',
      'PublishedPrice',
      'Fare',
      'Price'
    ]) > 0;
  const hasTimes =
    !!pickString(item, [
      'DepartureTimeFormat',
      'ArrivalTimeFormat',
      'DepartureTime',
      'ArrivalTime'
    ]);
  return hasBusId || (hasPrice && hasTimes) || !!pickString(item, ['BusName']);
}

export function mapBusItemToTrip(
  item: BusListItem,
  index: number,
  fromCity: string,
  toCity: string,
  preferredCurrency?: string
): Trip {
  const operator =
    pickString(item, [
      'TravelName',
      'TravelsName',
      'BusName',
      'OperatorName',
      'Operator',
      'BusOperator',
      'CompanyName',
      'ServiceName'
    ]) || 'Bus Operator';

  const departTime = formatBusTime(
    pickString(item, [
      'DepartureTimeFormat',
      'DepartureTime',
      'DeptTime',
      'DepTime',
      'OriginCityTime',
      'PickUpTime',
      'StartTime',
      'BoardingTime'
    ])
  );

  const arriveTime = formatBusTime(
    pickString(item, [
      'ArrivalTimeFormat',
      'ArrivalTime',
      'ArrTime',
      'DestinationCityTime',
      'DropTime',
      'EndTime'
    ])
  );

  const duration =
    pickString(item, [
      'TotalTravelMinutesFormat',
      'Duration',
      'JourneyDuration',
      'JourneyHours',
      'TravelTime',
      'TotalDuration'
    ]) || '—';

  const price = resolveBusTicketFare(item) || 0;

  const busType = pickString(item, [
    'BusType',
    'BusTypeName',
    'VehicleType',
    'SeatType',
    'Class'
  ]);

  const seatsAvailable = pickNumber(item, [
    'AvailableSeats',
    'SeatsAvailable',
    'SeatAvailable',
    'VacantSeats',
    'NoOfSeats'
  ]);

  const rating = pickNumber(item, ['Rating', 'StarRating', 'AvgRating']);
  const amenity = pickString(item, ['Amenities', 'Amenity']);

  const tags: string[] = [];
  if (busType) tags.push(busType);
  if (amenity) tags.push(amenity);
  if (seatsAvailable > 0) tags.push(`${seatsAvailable} seats`);

  const originLabel =
    pickString(item, ['Departurename', 'Origin', 'BoardingPointsDetails']) ||
    fromCity;
  const destLabel =
    pickString(item, ['Destination', 'Arrivalname', 'DestinationName']) ||
    toCity;

  return {
    id: buildId(item, index),
    operator,
    operatorInitial: operator.charAt(0).toUpperCase() || 'B',
    operatorColor: operatorColor(operator),
    departTime,
    arriveTime,
    duration,
    transfers: 0,
    price,
    currency: (() => {
      const preferred = String(preferredCurrency || '')
        .trim()
        .toUpperCase();
      if (/^[A-Z]{3}$/.test(preferred)) return preferred;
      return (
        pickString(item, ['DefaultCurrency', 'CurrencyCode', 'ShowCurrency']) ||
        'ETB'
      );
    })(),
    co2: '',
    tags,
    fromCity: originLabel,
    toCity: destLabel,
    busType: busType || undefined,
    seatsAvailable: seatsAvailable || undefined,
    rating: rating || undefined,
    apiPayload: item
  };
}
