import { Trip } from '../../components/travel/ethioTravelData';
import { callGuestApi, GuestApiError } from './soapClient';
import { GUEST_USER_ID, GUEST_USER_TYPE_ID } from './car';
import { SAVE_BOOKING_PARAMS } from './guestApiParams';
import {
  isMultiwayFlightItem,
  isFlightErrorRow,
  isRoundwayFlightItem,
  mapFlightItemToTrip,
  mapMultiwayItemToTrip,
  mapRoundwayItemToTrip,
  type FlightListItem
} from './mapFlightToTrip';
import {
  parseFlightBookingResponse,
  type FlightBookingResult
} from './mapFlightBooking';
import {
  parseSaveBookingResponse,
  type SaveBookingResult
} from './mapSaveBooking';

export type FlightListParams = {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adultCount?: number;
  childrenCount?: number;
  infantCount?: number;
  cabinClass?: string;
  /** GuestAPI CurrencyCode — user-selected display currency */
  currencyCode?: string;
  /** GuestAPI CurrencyValue — exchange rate from GetCurrencyExchangerate */
  currencyValue?: number;
  /** @deprecated use currencyCode */
  defaultCurrency?: string;
  /** @deprecated use currencyValue */
  defaultCurrencyValue?: number;
  flightMarkup?: number;
  fromLabel?: string;
  toLabel?: string;
};

export type MultiwayLeg = {
  origin: string;
  destination: string;
  departDate: string;
};

export type MultiwayListParams = {
  legs: MultiwayLeg[];
  adultCount?: number;
  childrenCount?: number;
  infantCount?: number;
  cabinClass?: string;
  currencyCode?: string;
  currencyValue?: number;
  /** @deprecated use currencyCode */
  defaultCurrency?: string;
  /** @deprecated use currencyValue */
  defaultCurrencyValue?: number;
  flightMarkup?: number;
  fromLabel?: string;
  toLabel?: string;
};

export type FlightListResult = {
  trips: Trip[];
  raw: FlightListItem[];
  apiMessage?: string;
};

export type FlightListKind = 'oneway' | 'roundway' | 'multiway';

function flightListErrorMessage(
  errorRow: FlightListItem,
  kind: FlightListKind
): string {
  const candidates = [
    errorRow.DepartCityNameFirst,
    errorRow.DepartCityName,
    errorRow.DepartCityCodeFirst,
    errorRow.DepartCityCode,
    errorRow.ArriveCityNameFirst,
    errorRow.ArriveCityName,
    errorRow.ArriveCityCodeFirst,
    errorRow.ArriveCityCode
  ];

  for (const value of candidates) {
    const text = String(value ?? '').trim().replace(/,+\s*$/, '');
    if (!text) continue;
    if (text.toUpperCase().includes('ERROR EX')) continue;
    if (text.toUpperCase() === 'ERROR') continue;
    // GuestAPI sometimes embeds .NET ArgumentNullException text in DepartCityCode.
    if (/parameter name:\s*source/i.test(text) || /value cannot be null/i.test(text)) {
      return 'No flights for this route. Check airports (LOS = Lagos NG, not Los Angeles / LAX) and try another date.';
    }
    return text;
  }

  const defaults: Record<FlightListKind, string> = {
    oneway:
      'No flights found for this route. Pick a departure date at least a few days ahead.',
    roundway:
      'No flights found for this round trip. Pick dates at least a few days ahead.',
    multiway:
      'No flights found for this multi-city route. Pick dates at least a few days ahead.'
  };
  return defaults[kind];
}

function extractFlightListItems(
  strings: string[],
  kind: FlightListKind = 'oneway'
): {
  items: FlightListItem[];
  apiMessage?: string;
} {
  let items: FlightListItem[] = [];
  let apiMessage: string | undefined;

  for (const entry of strings) {
    if (!entry || entry === '[]') continue;

    if (!entry.startsWith('[') && !entry.startsWith('{')) {
      apiMessage = entry.trim();
      continue;
    }

    try {
      const parsed = JSON.parse(entry) as FlightListItem | FlightListItem[];
      const list = Array.isArray(parsed) ? parsed : [parsed];
      if (
        list.length > 0 &&
        (list[0]?.RowType ||
          list[0]?.RowTypeForward ||
          list[0]?.RowTypeFirst ||
          list[0]?.FlightNumberFirst)
      ) {
        const errorRow = list.find(isFlightErrorRow);
        if (errorRow && list.every(isFlightErrorRow)) {
          apiMessage = flightListErrorMessage(errorRow, kind);
        }
        items = list.filter((item) => !isFlightErrorRow(item));
      }
    } catch {
      // skip malformed entries
    }
  }

  return {
    items,
    apiMessage: items.length === 0 ? apiMessage?.trim() : undefined
  };
}

function buildFlightListResult(
  items: FlightListItem[],
  params: FlightListParams | MultiwayListParams,
  apiMessage?: string
): FlightListResult {
  let fromLabel = params.fromLabel ?? '';
  let toLabel = params.toLabel ?? '';

  if ('origin' in params) {
    fromLabel = params.fromLabel ?? params.origin;
    toLabel = params.toLabel ?? params.destination;
  } else if (params.legs.length > 0) {
    fromLabel = params.fromLabel ?? params.legs[0].origin;
    toLabel = params.toLabel ?? params.legs[params.legs.length - 1].destination;
  }
  const multiway = items.some(isMultiwayFlightItem);
  const roundway = !multiway && items.some(isRoundwayFlightItem);

  const mainRows = items.filter((item) =>
    multiway ?
    item.RowTypeFirst === 'MainRow' :
    roundway ?
    item.RowTypeForward === 'MainRow' :
    item.RowType === 'MainRow'
  );

  const preferredCurrency = normalizeCurrencyCode(
    params.currencyCode ?? params.defaultCurrency
  );

  const trips = mainRows.
  map((item, index) => {
    if (multiway) {
      return mapMultiwayItemToTrip(
        item,
        index,
        fromLabel,
        toLabel,
        preferredCurrency
      );
    }
    if (roundway) {
      return mapRoundwayItemToTrip(
        item,
        index,
        fromLabel,
        toLabel,
        preferredCurrency
      );
    }
    return mapFlightItemToTrip(
      item,
      index,
      fromLabel,
      toLabel,
      preferredCurrency,
      items
    );
  }).
  filter((trip): trip is Trip => trip != null);

  return { trips, raw: items, apiMessage };
}

function normalizeCurrencyCode(code?: string | null): string {
  const normalized = String(code || '')
    .trim()
    .toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : 'ETB';
}

function normalizeCurrencyValue(value?: number | string | null): string {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? String(n) : '1';
}

function resolveListCurrency(params: {
  currencyCode?: string;
  currencyValue?: number;
  defaultCurrency?: string;
  defaultCurrencyValue?: number;
}): { code: string; value: string } {
  return {
    code: normalizeCurrencyCode(params.currencyCode ?? params.defaultCurrency),
    value: normalizeCurrencyValue(
      params.currencyValue ?? params.defaultCurrencyValue
    )
  };
}

/**
 * GetOnewayList / GetRoundwayList / GetMultiwayList currency params.
 * Live GuestAPI SOAP fields are CurrencyCode + CurrencyValue
 * (exchange rate from GetCurrencyExchangerate).
 */
function flightListSoapParams(
  params: FlightListParams
): { name: string; value: string }[] {
  const { code, value } = resolveListCurrency(params);
  const origin = String(params.origin || '')
    .trim()
    .toUpperCase();
  const destination = String(params.destination || '')
    .trim()
    .toUpperCase();
  return [
    { name: 'AdultCount', value: String(params.adultCount ?? 1) },
    { name: 'ChildrenCount', value: String(params.childrenCount ?? 0) },
    { name: 'InfantCount', value: String(params.infantCount ?? 0) },
    { name: 'DepartDate', value: params.departDate },
    { name: 'CabinClass', value: resolveCabinClassParam(params.cabinClass) },
    { name: 'Origin', value: origin },
    { name: 'Destination', value: destination },
    { name: 'CurrencyCode', value: code },
    { name: 'CurrencyValue', value: value },
    { name: 'FlightMarkup', value: String(params.flightMarkup ?? 0) }
  ];
}

/**
 * GetOnewayList — search one-way flights.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=GetOnewayList
 */
export async function getOnewayList(
  params: FlightListParams
): Promise<FlightListResult> {
  const strings = await callGuestApi(
    'GetOnewayList',
    flightListSoapParams(params),
    // One retry max — flight search should surface results quickly.
    { maxRetries: 1, timeoutMs: 45_000 }
  );

  const { items, apiMessage } = extractFlightListItems(strings, 'oneway');
  return buildFlightListResult(items, params, apiMessage);
}

/**
 * GetRoundwayList — search round-trip flights (outbound + return bundled).
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=GetRoundwayList
 */
export async function getRoundwayList(
  params: FlightListParams & { returnDate: string }
): Promise<FlightListResult> {
  const strings = await callGuestApi(
    'GetRoundwayList',
    [...flightListSoapParams(params), { name: 'ReturnDate', value: params.returnDate }],
    { maxRetries: 1, timeoutMs: 45_000 }
  );

  const { items, apiMessage } = extractFlightListItems(strings, 'roundway');
  return buildFlightListResult(items, params, apiMessage);
}

function multiwayListSoapParams(
  params: MultiwayListParams
): { name: string; value: string }[] {
  const legs = [...params.legs];
  while (legs.length < 4) {
    legs.push({ origin: '', destination: '', departDate: '' });
  }

  const legParams = legs.flatMap((leg, index) => {
    const n = index + 1;
    return [
      { name: `Origin${n}`, value: leg.origin },
      { name: `Destination${n}`, value: leg.destination },
      { name: `DepartDate${n}`, value: leg.departDate }
    ];
  });

  const { code, value } = resolveListCurrency(params);

  return [
    { name: 'AdultCount', value: String(params.adultCount ?? 1) },
    { name: 'ChildrenCount', value: String(params.childrenCount ?? 0) },
    { name: 'InfantCount', value: String(params.infantCount ?? 0) },
    { name: 'CabinClass', value: resolveCabinClassParam(params.cabinClass) },
    ...legParams,
    { name: 'CurrencyCode', value: code },
    { name: 'CurrencyValue', value: value },
    { name: 'FlightMarkup', value: String(params.flightMarkup ?? 0) }
  ];
}

/**
 * GetMultiwayList — search multi-city flights (up to 4 legs).
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=GetMultiwayList
 */
export async function getMultiwayList(
  params: MultiwayListParams
): Promise<FlightListResult> {
  const strings = await callGuestApi(
    'GetMultiwayList',
    multiwayListSoapParams(params),
    { maxRetries: 1, timeoutMs: 45_000 }
  );

  const { items, apiMessage } = extractFlightListItems(strings, 'multiway');
  const firstLeg = params.legs[0];
  const lastLeg = params.legs[params.legs.length - 1];
  return buildFlightListResult(
    items,
    {
      ...params,
      fromLabel: params.fromLabel ?? firstLeg?.origin,
      toLabel: params.toLabel ?? lastLeg?.destination
    },
    apiMessage
  );
}

export type FlightBookingParams = {
  userTypeId?: number;
  userId?: number;
  traceId: string;
  tripType?: string;
  contentSource?: string;
  adultCount?: number;
  childrenCount?: number;
  infantCount?: number;
  jsonstring: string;
  currencyCode?: string;
  currencyValue?: number;
  /** @deprecated use currencyValue */
  defaultCurrencyValue?: number;
  flightMarkup?: number;
};

export type { FlightBookingResult, FlightBookingPricing } from './mapFlightBooking';

/**
 * GetBookingdetails — confirm fare and segment details for a selected flight.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=GetBookingdetails
 */
export async function getBookingDetails(
  params: FlightBookingParams
): Promise<FlightBookingResult> {
  const currency = normalizeCurrencyCode(params.currencyCode);
  const currencyValue = normalizeCurrencyValue(
    params.currencyValue ?? params.defaultCurrencyValue
  );
  try {
    const strings = await callGuestApi('GetBookingdetails', [
      { name: 'UserTypeId', value: String(params.userTypeId ?? GUEST_USER_TYPE_ID) },
      { name: 'UserId', value: String(params.userId ?? GUEST_USER_ID) },
      { name: 'traceId', value: params.traceId },
      { name: 'TripType', value: params.tripType ?? 'Oneway' },
      { name: 'ContentSource', value: params.contentSource ?? 'GDS' },
      { name: 'AdultCount', value: String(params.adultCount ?? 1) },
      { name: 'ChildrenCount', value: String(params.childrenCount ?? 0) },
      { name: 'InfantCount', value: String(params.infantCount ?? 0) },
      { name: 'jsonstring', value: params.jsonstring },
      { name: 'CurrencyCode', value: currency },
      { name: 'CurrencyValue', value: currencyValue },
      { name: 'FlightMarkup', value: String(params.flightMarkup ?? 0) }
    ]);

    return parseFlightBookingResponse(strings);
  } catch (err) {
    // Format / row-count / dictionary faults must be retryable by the UI
    // (alternate jsonstring sizes or bookable NDC ProductIDs) — do not throw.
    if (err instanceof GuestApiError) {
      const soft = softBookingDetailsFaultMessage(err.message);
      if (soft) {
        return {
          details: [],
          bookingDetail: null,
          pricing: null,
          apiMessage: soft
        };
      }
    }
    throw err;
  }
}

/** GuestAPI faults that booking row/ProductID retries can recover from. */
function softBookingDetailsFaultMessage(message?: string | null): string | null {
  const raw = String(message || '').trim();
  if (!raw) return null;
  if (
    !/correct format|dictionary|startindex|expected\s+\d+\s+rows?|invalid json/i.test(
      raw
    )
  ) {
    return null;
  }
  const inner = raw.match(/--->\s*(.+)$/i)?.[1]?.trim();
  return inner || raw;
}

export type SaveBookingParams = {
  selectedRowJson: string;
  contactdetailJson: string;
  defaultvalueJson: string;
  reqPassangerJson: string;
};

export type { SaveBookingResult, SaveBookingInput } from './mapSaveBooking';

/**
 * SaveBooking — create a flight PNR after payment details are collected.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=SaveBooking
 */
export async function saveBooking(
  params: SaveBookingParams
): Promise<SaveBookingResult> {
  const strings = await callGuestApi('SaveBooking', [
    { name: SAVE_BOOKING_PARAMS.selectedRowJson, value: params.selectedRowJson },
    { name: SAVE_BOOKING_PARAMS.contactdetailJson, value: params.contactdetailJson },
    { name: SAVE_BOOKING_PARAMS.defaultvalueJson, value: params.defaultvalueJson },
    { name: SAVE_BOOKING_PARAMS.reqPassangerJson, value: params.reqPassangerJson }
  ]);

  // Prefer a bare PNR token if GuestAPI returned <Result>HJNXXK</Result>.
  for (const entry of strings) {
    const token = String(entry || '').trim();
    if (/^[A-Z0-9]{5,10}$/i.test(token)) {
      return {
        success: true,
        pnr: token.toUpperCase(),
        message: `PNR : ${token.toUpperCase()}`,
        raw: strings.join('\n')
      };
    }
  }

  const raw = strings.join('\n').trim();
  const result = parseSaveBookingResponse(raw);
  if (!result.success) {
    throw new GuestApiError(
      result.message || 'SaveBooking failed',
      undefined,
      raw
    );
  }
  return result;
}

export type FlightBookClassOption = {
  value: string;
  label: string;
};

function formatFlightBookClassName(name: string): string {
  return String(name || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}

const FALLBACK_FLIGHT_BOOK_CLASSES: FlightBookClassOption[] = [
  { value: 'all', label: 'All' },
  { value: '2', label: 'Economy' },
  { value: '3', label: 'Premium Economy' },
  { value: '4', label: 'Business' },
  { value: '5', label: 'Premium Business' },
  { value: '6', label: 'First' }
];

/**
 * GuestAPI CabinClass for GetOnewayList / GetRoundwayList / GetMultiwayList.
 * UI "All" is stored as `all`, but live GuestAPI rejects CabinClass=1 with
 * "CABIN PREFERENCE IS NOT SUPPORTED BY AIRLINE …" (~1.7KB ERROR payload).
 * Map All / empty / 0 / 1 → Economy (`2`), which returns full flight lists.
 */
export function resolveCabinClassParam(cabinClass?: string | null): string {
  const raw = String(cabinClass ?? '').trim();
  const lower = raw.toLowerCase();
  if (!raw || lower === 'all' || raw === '0' || raw === '1') return '2';
  // Guard accidental labels from older UI state.
  if (lower === 'economy') return '2';
  return raw;
}

function withAllCabinOption(
  options: FlightBookClassOption[]
): FlightBookClassOption[] {
  // GuestAPI Id=1 breaks GetOnewayList — drop it and prepend our UI "All".
  const withoutBrokenAll = options.filter(
    (option) =>
      option.value !== '1' &&
      option.value !== 'all' &&
      !/^all$/i.test(option.label.trim())
  );
  const cabins =
    withoutBrokenAll.length > 0 ?
      withoutBrokenAll :
      FALLBACK_FLIGHT_BOOK_CLASSES.filter(
        (option) => option.value !== 'all' && option.value !== '1'
      );
  return [{ value: 'all', label: 'All' }, ...cabins];
}

/** FlightBookClass — cabin options for search (no request parameters). */
export async function getFlightBookClasses(): Promise<FlightBookClassOption[]> {
  const strings = await callGuestApi('FlightBookClass', []);
  const options: FlightBookClassOption[] = [];
  const seen = new Set<string>();

  for (const entry of strings) {
    if (!entry || entry === '[]') continue;
    try {
      const parsed = JSON.parse(entry) as unknown;
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      for (const row of rows) {
        if (!row || typeof row !== 'object') continue;
        const rec = row as Record<string, unknown>;
        const id = rec.Id ?? rec.id;
        const name = rec.Name ?? rec.name;
        if (id == null || !name) continue;
        const value = String(id);
        if (seen.has(value)) continue;
        seen.add(value);
        options.push({
          value,
          label: formatFlightBookClassName(String(name))
        });
      }
    } catch {
      // skip malformed entries
    }
  }

  return withAllCabinOption(
    options.length > 0 ? options : FALLBACK_FLIGHT_BOOK_CLASSES
  );
}
