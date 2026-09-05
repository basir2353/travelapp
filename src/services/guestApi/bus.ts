import { callGuestApi, callGuestApiWithBody, GuestApiError } from './soapClient';
import { parseJsonStringEntries, parseGuestJsonRecords, firstPlainApiMessage, normalizeJsonSelectBus } from './parseJsonStrings';
import { mapBusItemToTrip, isFullBusListItem } from './mapBusToTrip';
import type { BusListItem } from './mapBusToTrip';
import { Trip } from '../../components/travel/ethioTravelData';
import { parseBusSeatLayout, BusSeatInfo } from './mapBusSeats';
import {
  parseBus3SelectResponse,
  parseBusBookingResponse,
  type Bus3SelectResult,
  type BusBookingInput,
  type BusBookingResult
} from './mapBusBooking';
import { formatFlightApiDate, parseBusTravelDate } from './formatTravelDate';
import {
  busFareLikelyUnconvertedEtb,
  toBusDisplayAmount
} from '../../utils/busDisplayFare';

/** Raw city row from Bus1_CityList (API uses lowercase keys). */
export type BusCity = {
  CityName?: string;
  CityId?: string | number;
  cityname?: string;
  cityId?: string | number;
  City?: string;
  Name?: string;
  Id?: string | number;
};

export type BusCityOption = {
  name: string;
  cityId: string;
  /** Subtitle in the picker (boarding/dropping time). */
  detail?: string;
  /** City name GetBus / Bus1_List should search with. */
  searchName?: string;
};

function pickCityName(row: BusCity): string {
  return String(
    row.cityname ?? row.CityName ?? row.City ?? row.Name ?? ''
  ).trim();
}

function pickCityId(row: BusCity): string {
  const id = row.cityId ?? row.CityId ?? row.Id;
  return id == null ? '' : String(id);
}

export function toBusCityOptions(cities: BusCity[]): BusCityOption[] {
  const options: BusCityOption[] = [];
  const seen = new Set<string>();

  for (const row of cities) {
    const name = pickCityName(row);
    const cityId = pickCityId(row);
    if (!name || !cityId) continue;
    const key = `${cityId}:${name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({ name, cityId });
  }

  return options;
}

function normalizePlaceName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const prev = new Array<number>(cols);
  const curr = new Array<number>(cols);
  for (let j = 0; j < cols; j++) prev[j] = j;
  for (let i = 1; i < rows; i++) {
    curr[0] = i;
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j < cols; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** Map a boarding/dropping address onto Bus1_CityList (handles “Addis Abada”). */
export function matchBusCityId(
  name: string,
  catalog: BusCityOption[]
): string | undefined {
  const n = normalizePlaceName(name);
  if (!n) return undefined;
  const exact = catalog.find((c) => normalizePlaceName(c.name) === n);
  if (exact) return exact.cityId;
  const partial = catalog.find((c) => {
    const cn = normalizePlaceName(c.name);
    return cn.includes(n) || n.includes(cn);
  });
  if (partial) return partial.cityId;
  let best: { cityId: string; distance: number } | undefined;
  for (const city of catalog) {
    const distance = editDistance(n, normalizePlaceName(city.name));
    if (distance > 2) continue;
    if (!best || distance < best.distance) {
      best = { cityId: city.cityId, distance };
    }
  }
  return best?.cityId;
}

function matchBusCityName(
  name: string,
  catalog: BusCityOption[]
): string | undefined {
  const id = matchBusCityId(name, catalog);
  return catalog.find((c) => c.cityId === id)?.name;
}

function slugLocationId(prefix: string, name: string): string {
  const slug = normalizePlaceName(name).replace(/\s+/g, '-') || 'unknown';
  return `${prefix}-${slug}`;
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      out[index] = await mapper(items[index]);
    }
  }
  const workers = Math.min(Math.max(1, limit), items.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return out;
}

function upsertLocation(
  map: Map<string, BusCityOption>,
  option: BusCityOption
) {
  const key = normalizePlaceName(option.name);
  if (!key || map.has(key)) return;
  map.set(key, option);
}

export type BusFromToLocations = {
  from: BusCityOption[];
  to: BusCityOption[];
};

/**
 * From/To picker lists from GetBusBoarding / GetBusDropping.
 * Discovers BusIds via GetBus for each Bus1_CityList city, then loads
 * boarding (From) and dropping (To) addresses for those buses.
 */
export async function getBusFromToLocations(): Promise<BusFromToLocations> {
  const catalog = await bus1CityList('');
  const buses = new Map<
    string,
    { originCityId: string; originName: string }
  >();

  await Promise.all(
    catalog.map(async (city) => {
      try {
        const strings = await callGuestApi('GetBus', [
          { name: 'Name', value: city.name }
        ]);
        const raw = parseJsonStringEntries<BusListItem>(strings);
        for (const item of raw) {
          const busId = String(item.BusId ?? item.BusID ?? '').trim();
          if (!busId || buses.has(busId)) continue;
          buses.set(busId, {
            originCityId: city.cityId,
            originName: city.name
          });
        }
      } catch {
        // skip cities the inventory endpoint does not recognize
      }
    })
  );

  if (buses.size === 0) {
    buses.set('15', { originCityId: '', originName: '' });
  }

  const fromMap = new Map<string, BusCityOption>();
  const toMap = new Map<string, BusCityOption>();

  await mapPool(Array.from(buses.entries()), 5, async ([busId, meta]) => {
    const [boarding, dropping] = await Promise.allSettled([
      getBusBoarding(busId),
      getBusDropping(busId)
    ]);

    if (boarding.status === 'fulfilled') {
      for (const point of boarding.value) {
        const name = point.name.trim();
        if (!name) continue;
        const matchedId = matchBusCityId(name, catalog);
        const cityId = matchedId || meta.originCityId || slugLocationId('from', name);
        upsertLocation(fromMap, {
          name,
          cityId,
          detail: point.time ? `Departs ${point.time}` : 'Boarding location',
          searchName:
            matchBusCityName(name, catalog) || meta.originName || name
        });
      }
    }

    if (dropping.status === 'fulfilled') {
      for (const point of dropping.value) {
        const name = point.name.trim();
        if (!name) continue;
        const matchedId = matchBusCityId(name, catalog);
        upsertLocation(toMap, {
          name,
          cityId: matchedId || slugLocationId('to', name),
          detail: point.time ? `Arrives ${point.time}` : 'Dropping location',
          searchName: matchBusCityName(name, catalog) || name
        });
      }
    }
  });

  return {
    from: Array.from(fromMap.values()),
    to: Array.from(toMap.values())
  };
}

/**
 * Bus1_CityList — search bus cities by partial name.
 * Empty query returns the full city list.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=Bus1_CityList
 */
export async function bus1CityList(city: string): Promise<BusCityOption[]> {
  const strings = await callGuestApi('Bus1_CityList', [
    { name: 'City', value: city.trim() }
  ]);

  const cities = parseJsonStringEntries<BusCity>(strings);
  return toBusCityOptions(cities);
}

/** GetBusRoute — lightweight route autocomplete used by the manual bus API. */
export async function getBusRoute(name: string): Promise<BusCityOption[]> {
  const strings = await callGuestApi('GetBusRoute', [
    { name: 'Name', value: name.trim() }
  ]);
  return toBusCityOptions(parseJsonStringEntries<BusCity>(strings));
}

/** GetBus — manual bus inventory by departure city name. */
export async function getBus(
  name: string,
  destinationLabel?: string
): Promise<BusListResult> {
  const strings = await callGuestApi('GetBus', [
    { name: 'Name', value: name.trim() }
  ]);
  const raw = parseJsonStringEntries<BusListItem>(strings);
  const source = raw.filter(isFullBusListItem);
  const currency = String(source[0]?.DefaultCurrency || 'ETB').toUpperCase();
  return {
    raw: source,
    trips: source.map((item, index) =>
      mapBusItemToTrip(
        item,
        index,
        String(item.Departurename || name),
        String(
          item.DestinationName ||
            item.Arrivalname ||
            destinationLabel ||
            'Destination'
        ),
        currency
      )
    )
  };
}

export type BusBoardingPoint = {
  id: string;
  name: string;
  time: string;
};

export type BusDroppingPoint = {
  id: string;
  name: string;
  time: string;
};

function pickRowString(
  row: Record<string, unknown>,
  names: string[]
): string {
  const lookup = new Map(
    Object.keys(row).map((key) => [key.toLowerCase(), key])
  );
  for (const name of names) {
    const key = lookup.get(name.toLowerCase());
    if (!key) continue;
    const value = row[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return '';
}

/** Numeric BusId for GetBusBoarding / GetBusDropping (rejects "15-0"). */
export function resolveBusNumericId(
  trip: { id?: string; apiPayload?: unknown } | null | undefined
): string {
  const payload =
    trip?.apiPayload && typeof trip.apiPayload === 'object' ?
    (trip.apiPayload as Record<string, unknown>) :
    {};
  const candidates = [
    payload.BusId,
    payload.BusID,
    payload.busId,
    trip?.id
  ];
  for (const candidate of candidates) {
    const match = String(candidate ?? '').match(/(\d+)/);
    if (!match) continue;
    const value = match[1];
    if (value !== '0') return value;
  }
  return '';
}

function mapBoardingRows(
  rows: Record<string, unknown>[]
): BusBoardingPoint[] {
  return rows.
  map((row, index) => ({
    id: pickRowString(row, ['BoardingPointId', 'Id']) || String(index + 1),
    name: pickRowString(row, ['BoardingAddress', 'Address', 'Name']),
    time: pickRowString(row, ['BoardingDeparturetime', 'Time', 'DepartureTime'])
  })).
  filter((point) => Boolean(point.name));
}

function mapDroppingRows(
  rows: Record<string, unknown>[]
): BusDroppingPoint[] {
  return rows.
  map((row, index) => ({
    id: pickRowString(row, ['DroppingPointId', 'Id']) || String(index + 1),
    name: pickRowString(row, ['DroppingAddress', 'Address', 'Name']),
    time: pickRowString(row, ['Droppingtime', 'Time', 'ArrivalTime'])
  })).
  filter((point) => Boolean(point.name));
}

async function parseBusPointResponse(
  operation: 'GetBusBoarding' | 'GetBusDropping',
  busId: string
): Promise<Record<string, unknown>[]> {
  try {
    const { strings, body } = await callGuestApiWithBody(operation, [
      { name: 'BusId', value: busId }
    ]);
    const rows = parseGuestJsonRecords(strings, body);
    if (rows.length > 0) return rows;
    return parseJsonStringEntries(strings);
  } catch (err) {
    const body = err instanceof GuestApiError ? err.body : '';
    if (body) {
      const rows = parseGuestJsonRecords([], body);
      if (rows.length > 0) return rows;
    }
    return [];
  }
}

/** GetBusBoarding — boarding point/time for a bus. */
export async function getBusBoarding(
  busId: string | number
): Promise<BusBoardingPoint[]> {
  const id = String(busId).match(/(\d+)/)?.[1] || String(busId).trim();
  if (!id || id === '0') return [];
  return mapBoardingRows(await parseBusPointResponse('GetBusBoarding', id));
}

/** GetBusDropping — dropping point/time for a bus. */
export async function getBusDropping(
  busId: string | number
): Promise<BusDroppingPoint[]> {
  const id = String(busId).match(/(\d+)/)?.[1] || String(busId).trim();
  if (!id || id === '0') return [];
  return mapDroppingRows(await parseBusPointResponse('GetBusDropping', id));
}

export type BusListParams = {
  origin: string;
  destination: string;
  travelDate: string;
  fromLabel?: string;
  toLabel?: string;
  currencyCode?: string;
  /** 1 ETB = currencyRate display units (GuestAPI Currencyrate). */
  currencyRate?: number | string;
};

export type BusListResult = {
  trips: Trip[];
  raw: BusListItem[];
};

/** GuestAPI Bus1_List sample uses DD-MM-YYYY. */
function toBusListTravelDate(value: string): string {
  const trimmed = value.trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) return trimmed;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return formatFlightApiDate(parseBusTravelDate(trimmed));
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    return formatFlightApiDate(new Date(y, m - 1, d));
  }
  return trimmed;
}

export type BusCurrencyParams = {
  currencyCode?: string;
  currencyRate?: number | string;
};

function resolveBusCurrency(params: BusCurrencyParams): {
  code: string;
  rate: string;
} {
  const code = String(params.currencyCode || 'ETB')
    .trim()
    .toUpperCase();
  const safeCode = /^[A-Z]{3}$/.test(code) ? code : 'ETB';
  if (safeCode === 'ETB') return { code: 'ETB', rate: '1' };

  const rateNum = Number(params.currencyRate);
  // GuestAPI with Currency=AUD + Currencyrate=1 returns the ETB fare (e.g. 5600)
  // labeled as AUD. Only send a real conversion rate (>0 and not the ETB placeholder 1).
  if (!Number.isFinite(rateNum) || rateNum <= 0 || rateNum === 1) {
    return { code: 'ETB', rate: '1' };
  }
  return { code: safeCode, rate: String(rateNum) };
}

/** Bus2/Bus3 SOAP extras from the GuestAPI sample (Currency:ETB, Currencyrate:1). */
function busCurrencySoapParams(params?: BusCurrencyParams) {
  const { code, rate } = resolveBusCurrency(params ?? {});
  return [
    { name: 'Currency', value: code },
    { name: 'Currencyrate', value: rate }
  ];
}

/**
 * Bus1_List — search available buses by origin, destination, and date.
 * Sends Currency + Currencyrate so fares match the UI currency dropdown.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=Bus1_List
 */
export async function bus1List(params: BusListParams): Promise<BusListResult> {
  const { code, rate } = resolveBusCurrency(params);
  const originId = String(params.origin || '').trim();
  const destinationId = String(params.destination || '').trim();
  const strings = await callGuestApi('Bus1_List', [
    { name: 'Origin', value: originId },
    { name: 'Destination', value: destinationId },
    { name: 'TravelDate', value: toBusListTravelDate(params.travelDate) },
    { name: 'Currency', value: code },
    { name: 'Currencyrate', value: rate }
  ]);

  const allItems = parseJsonStringEntries<BusListItem>(strings);
  const fullRows = allItems.filter(isFullBusListItem);
  const source = fullRows.length > 0 ? fullRows : allItems.filter((row) =>
    Object.keys(row).length > 2
  );

  const fromCity = params.fromLabel ?? originId;
  const toCity = params.toLabel ?? destinationId;

  const trips = source.map((item, index) => {
    const enriched: BusListItem = {
      ...item,
      Origin: item.Origin || item.Departurename || fromCity,
      Destination: item.Destination || item.Arrivalname || toCity,
      Arrivalname: item.Arrivalname || toCity,
      RouteId: item.RouteId || item.RouteID || originId,
      BookingAPI: item.BookingAPI || 'Manual',
      ServiceName: item.ServiceName || 'Manual Bus'
    };
    const trip = mapBusItemToTrip(enriched, index, fromCity, toCity, code);
    const rateNum = Number(rate);
    const forceFromEtb = busFareLikelyUnconvertedEtb(trip.apiPayload, code);
    const displayPrice = toBusDisplayAmount(trip.price, {
      displayCurrency: code,
      rate: rateNum,
      forceFromEtb
    });
    const rawPayload =
      trip.apiPayload && typeof trip.apiPayload === 'object' ?
        (trip.apiPayload as Record<string, unknown>) :
        {};
    return {
      ...trip,
      currency: code,
      price: displayPrice,
      apiPayload: forceFromEtb ?
        {
          ...rawPayload,
          ShowPrice: displayPrice,
          ConversionRate:
            Number.isFinite(rateNum) && rateNum > 0 && rateNum !== 1 ?
              rateNum :
              rawPayload.ConversionRate ?? 1
        } :
        trip.apiPayload
    };
  });

  return { trips, raw: source };
}

export type BusSeatLayoutResult = {
  seats: BusSeatInfo[];
  raw: Record<string, unknown>[];
  apiMessage?: string;
};

/**
 * Bus2_SelecSeat — fetch seat layout for a selected bus.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=Bus2_SelecSeat
 */
export async function bus2SelectSeat(
  jsonSelectBus: string,
  currency?: BusCurrencyParams
): Promise<BusSeatLayoutResult> {
  const json = normalizeJsonSelectBus(jsonSelectBus);
  const currencyParams = busCurrencySoapParams(currency);
  const strings = await callGuestApi('Bus2_SelecSeat', [
    { name: 'JsonSelectBus', value: json },
    ...currencyParams
  ]);

  const plainMessage = firstPlainApiMessage(strings);
  const raw = parseJsonStringEntries<Record<string, unknown>>(strings);
  const { seats, apiMessage } = parseBusSeatLayout(raw);

  return {
    seats,
    raw,
    apiMessage: apiMessage || plainMessage
  };
}

/**
 * Bus3_SelecBus — confirm bus + seats and resolve fare.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=Bus3_SelecBus
 */
export async function bus3SelectBus(
  jsonSelectBus: string,
  jsonSelectSeat: string,
  currency?: BusCurrencyParams
): Promise<Bus3SelectResult> {
  const strings = await callGuestApi('Bus3_SelecBus', [
    { name: 'JsonSelectBus', value: jsonSelectBus },
    { name: 'JsonSelectSeat', value: jsonSelectSeat },
    ...busCurrencySoapParams(currency)
  ]);

  return parseBus3SelectResponse(strings);
}

/**
 * Bus_Booking — create the bus booking.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=Bus_Booking
 */
export async function busBooking(
  input: BusBookingInput
): Promise<BusBookingResult> {
  const strings = await callGuestApi('Bus_Booking', [
    { name: 'JsonSelectBus', value: input.jsonSelectBus },
    { name: 'JsonSelectSeat', value: input.jsonSelectSeat },
    { name: 'BookingJson', value: input.bookingJson },
    { name: 'ContactDetailJson', value: input.contactDetailJson },
    { name: 'ReqPassangerJson', value: input.reqPassangerJson },
    { name: 'BoardingPointId', value: input.boardingPointId },
    { name: 'DroppingPointId', value: input.droppingPointId }
  ]);

  return parseBusBookingResponse(strings);
}

export {
  buildJsonSelectBus,
  buildJsonSelectBusForBooking,
  buildJsonSelectSeat
} from './mapBusSeats';
export type { BusSeatInfo, BusSeatStatus } from './mapBusSeats';
export { isBusSeatBooked, findBusApiSeat, cabinSeatToApiKey, chunkBusSeatRows, isOccupiedBusSeat } from './mapBusSeats';
export {
  buildBusBookingJson,
  buildBusContactDetailJson,
  buildBusReqPassengerJson
} from './mapBusBooking';
export type { Bus3SelectResult, BusBookingInput, BusBookingResult } from './mapBusBooking';
