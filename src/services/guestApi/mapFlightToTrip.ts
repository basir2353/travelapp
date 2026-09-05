import { KTA, Trip, type FlightRoutePoint } from '../../components/travel/ethioTravelData';

function resolveFlightCurrency(
  raw?: string | null,
  preferred?: string | null
): string {
  const preferredCode = String(preferred || '')
    .trim()
    .toUpperCase();
  if (/^[A-Z]{3}$/.test(preferredCode)) return preferredCode;
  const code = String(raw || '')
    .trim()
    .toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : 'ETB';
}

export type FlightListItem = {
  ItemId?: string;
  FlightNumber?: string;
  DepartCityCode?: string;
  ArriveCityCode?: string;
  DepartCityName?: string;
  ArriveCityName?: string;
  DepartureDate?: string;
  ArrivalDate?: string;
  TravelTime?: number;
  CarrierName?: string;
  CarrierCode?: string;
  CabinClassName?: string;
  BookingClassName?: string;
  TotalPrice?: number;
  OfferedFare?: number;
  Currency?: string;
  Refundable?: string;
  Baggage?: string;
  CabinBaggage?: string;
  StopCount?: number;
  TotalDuration?: string;
  OfferedDiscount?: number;
  AdultBaseFare?: number;
  AdultTaxFare?: number;
  AdultTotalFare?: number;
  GroundTime?: number;
  EquipmentCode?: string;
  FareType?: string;
  BookingAPI?: string;
  RowType?: string;
  MainRowNumber?: number;
  ProductID?: string;
  IsLCC?: unknown;
  IsLCCFirst?: unknown;
  ConnectionIndex?: string;
  [key: string]: unknown;
};

const CARRIER_NAMES: Record<string, string> = {
  MS: 'EgyptAir',
  ET: 'Ethiopian Airlines',
  QR: 'Qatar Airways',
  EK: 'Emirates',
  TK: 'Turkish Airlines'
};

const AIRLINE_LOGO_CDN = 'https://images.kiwi.com/airlines/64';

/** Build airline logo URL — API uses Kiwi CDN: …/airlines/64/{CarrierCode}.png */
export function carrierLogoUrl(
  carrierCode?: string,
  explicitUrl?: string
): string | undefined {
  const fromApi = explicitUrl?.trim();
  if (fromApi && /^https?:\/\//i.test(fromApi)) return fromApi;

  const code = carrierCode?.trim().toUpperCase();
  if (!code || code.length < 2) return undefined;
  return `${AIRLINE_LOGO_CDN}/${code}.png`;
}

function resolveCarrierLogo(item: FlightListItem): string | undefined {
  const explicit =
  (item.CarrierLogo ??
    item.AirlineLogo ??
    item.ImagePath ??
    item.LogoUrl ??
    item.CarrierImage) as string | undefined;
  return carrierLogoUrl(item.CarrierCode, explicit);
}

const OPERATOR_COLORS = [KTA.navy, KTA.blue, '#2563eb', '#14B8A6', '#dc2626'];

function operatorColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return OPERATOR_COLORS[Math.abs(hash) % OPERATOR_COLORS.length];
}

function formatTimeFromIso(iso: string | undefined): string {
  if (!iso) return '—';
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (!match) return '—';
  return `${match[1]}:${match[2]}`;
}

function parseTravelTimeMinutes(
  value: number | string | undefined
): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const hm = trimmed.match(/(\d+)\s*[Hh].*?(\d+)\s*[Mm]/);
    if (hm) return parseInt(hm[1], 10) * 60 + parseInt(hm[2], 10);
    const hOnly = trimmed.match(/(\d+)\s*[Hh]/);
    if (hOnly) return parseInt(hOnly[1], 10) * 60;
    const mOnly = trimmed.match(/(\d+)\s*[Mm]/);
    if (mOnly) return parseInt(mOnly[1], 10);
    const num = Number(trimmed);
    if (!Number.isNaN(num)) return num;
  }
  return 0;
}

function formatDuration(
  totalDuration: string | number | undefined,
  travelTimeMinutes: number | string | undefined
): string {
  const travelMins = parseTravelTimeMinutes(travelTimeMinutes);
  const totalStr =
  totalDuration != null ? String(totalDuration) : '';
  if (totalStr && /[hHmM]/.test(totalStr)) {
    return totalStr.replace(/H/gi, 'h').replace(/M/gi, 'm');
  }
  const mins = travelMins || Number(totalDuration) || 0;
  if (mins <= 0 || Number.isNaN(mins)) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function carrierLabel(item: FlightListItem): string {
  const name = item.CarrierName?.trim();
  if (name) return name;
  const code = item.CarrierCode?.trim() || '';
  return CARRIER_NAMES[code] || code || 'Airline';
}

/** Collapse API city strings so we never render "ADD (ADD)". */
export function cityLabel(name?: string, code?: string): string {
  const cityName = name?.trim() || '';
  const cityCode = (code?.trim() || '').toUpperCase();
  if (!cityName && !cityCode) return '';

  const parenCode = cityName.match(/\(([A-Za-z]{3})\)/)?.[1]?.toUpperCase();
  const bare = cityName.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const resolvedCode = cityCode || parenCode || '';

  if (!bare && resolvedCode) return resolvedCode;
  if (!resolvedCode) {
    // Name alone may already be an IATA code.
    if (/^[A-Za-z]{3}$/.test(bare)) return bare.toUpperCase();
    return bare || cityName;
  }
  if (bare.toUpperCase() === resolvedCode) return resolvedCode;
  return `${bare} (${resolvedCode})`;
}

/** Under-time airport label — always a clean IATA code when possible. */
export function airportCodeLabel(code?: string, city?: string): string {
  const fromCode = code?.trim().match(/\b([A-Za-z]{3})\b/)?.[1];
  if (fromCode) return fromCode.toUpperCase();
  const fromParen = city?.match(/\(([A-Za-z]{3})\)/)?.[1];
  if (fromParen) return fromParen.toUpperCase();
  const bare = city?.replace(/\s*\([^)]*\)\s*/g, '').trim() ?? '';
  if (/^[A-Za-z]{3}$/.test(bare)) return bare.toUpperCase();
  return bare || city?.trim() || '—';
}

function formatFlightNumber(
  carrier?: string,
  flightNo?: string
): string | undefined {
  if (!flightNo?.trim()) return undefined;
  const cleaned = flightNo.replace(/\s*\|\s*/g, ' / ');
  const code = carrier?.trim();
  if (!code) return cleaned;
  return cleaned.
  split(' / ').
  map((part) => {
    const segment = part.trim();
    if (!segment) return segment;
    if (/^[A-Z]{2}\s*\d/i.test(segment)) return segment;
    if (/^\d+$/.test(segment)) return `${code} ${segment}`;
    return segment;
  }).
  join(' / ');
}

/** Human-readable checked baggage from API e.g. UPTO50LB/23KG, 23KG + 23KG */
export function formatCheckedBaggage(value?: string): string | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  const kgMatches = [...raw.matchAll(/(\d+)\s*KG/gi)].map((m) => m[1]);
  if (kgMatches.length >= 2) {
    return `${kgMatches[0]} kg checked`;
  }
  if (kgMatches.length === 1) return `${kgMatches[0]} kg checked`;
  if (/CARRYON|CARRY[\s-]?ON/i.test(raw)) return 'Carry-on included';
  return raw;
}

/**
 * Human-readable cabin baggage from API.
 * GuestAPI often returns "CARR" (carrier-defined) with no weight —
 * map that to "Cabin bag included" for Select cabin cards.
 */
export function formatCabinBaggage(value?: string): string | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  const kg = raw.match(/(\d+)\s*KG/i)?.[1];
  if (kg) return `${kg} kg cabin`;
  // CARR / CARRYON / CABIN = included cabin bag (no weight from API)
  if (/^(CARR|CABIN)$/i.test(raw) || /CARRYON|CARRY[\s-]?ON/i.test(raw)) {
    return 'Cabin bag included';
  }
  return raw;
}

export type FlightFareChip = {
  label: string;
  tone: 'neutral' | 'danger' | 'success';
};

/** Header chips for flight cards — baggage + refund policy from API. */
export function flightFareHeaderChips(item: FlightListItem): FlightFareChip[] {
  const chips: FlightFareChip[] = [];
  const cabin = formatCabinBaggage(item.CabinBaggage);
  const checked = formatCheckedBaggage(item.Baggage);
  if (cabin) chips.push({ label: cabin, tone: 'neutral' });
  else if (checked) chips.push({ label: checked, tone: 'neutral' });

  const refundable = item.Refundable?.trim();
  if (refundable) {
    chips.push({
      label: refundable,
      tone: refundable.toLowerCase().includes('non') ? 'danger' : 'success'
    });
  }
  return chips;
}

function resolveFlightPrice(item: FlightListItem): {
  price: number;
  originalPrice?: number;
} {
  const totalPrice = Number(item.TotalPrice) || 0;
  const offeredFare = Number(item.OfferedFare) || 0;
  const offeredDiscount = Number(item.OfferedDiscount) || 0;
  const adultTotal = Number(item.AdultTotalFare) || 0;
  // Prefer the customer-facing offered quote when both exist (often lower than TotalPrice).
  const price =
    offeredFare > 0 && totalPrice > 0 ?
      Math.min(offeredFare, totalPrice) :
      totalPrice || offeredFare || adultTotal;
  let originalPrice: number | undefined;
  if (offeredDiscount > 0 && price > 0) {
    originalPrice = price + offeredDiscount;
  } else if (totalPrice > 0 && offeredFare > 0 && totalPrice !== offeredFare) {
    originalPrice = Math.max(totalPrice, offeredFare);
  }
  return { price, originalPrice };
}

export function isRoundwayFlightItem(item: FlightListItem): boolean {
  return (
    item.TripType === 'Roundway' ||
    item.RowTypeForward != null ||
    item.FlightNumberForward != null
  );
}

const MULTIWAY_LEG_SUFFIXES = ['First', 'Second', 'Third', 'Fourth'] as const;

export function isMultiwayFlightItem(item: FlightListItem): boolean {
  if (isRoundwayFlightItem(item)) return false;
  return (
    item.TripType === 'Multiway' ||
    item.RowTypeFirst != null ||
    (item.FlightNumberFirst != null && item.FlightNumberSecond != null)
  );
}

/** API error placeholder rows — must not treat priced one-way/round rows as errors. */
export function isFlightErrorRow(item: FlightListItem): boolean {
  if (item.RowType === 'Error') return true;

  const flightNo = String(item.FlightNumber ?? '');
  if (flightNo.toUpperCase().includes('ERROR')) return true;

  if (isRoundwayFlightItem(item)) {
    const forward = String(item.FlightNumberForward ?? '');
    return (
      item.RowTypeForward === 'Error' ||
      forward.toUpperCase().includes('ERROR')
    );
  }

  if (isMultiwayFlightItem(item)) {
    const first = String(item.FlightNumberFirst ?? '');
    return (
      item.RowTypeFirst === 'Error' ||
      first.toUpperCase().includes('ERROR')
    );
  }

  return false;
}

function mapMultiwayFirstLegFields(item: FlightListItem): FlightListItem {
  return {
    ...item,
    FlightNumber: item.FlightNumberFirst as string | undefined,
    DepartCityCode: item.DepartCityCodeFirst as string | undefined,
    ArriveCityCode: item.ArriveCityCodeFirst as string | undefined,
    DepartCityName: item.DepartCityNameFirst as string | undefined,
    ArriveCityName: item.ArriveCityNameFirst as string | undefined,
    DepartureDate: item.DepartureDateFirst as string | undefined,
    ArrivalDate: item.ArrivalDateFirst as string | undefined,
    TravelTime: parseTravelTimeMinutes(item.TravelTimeFirst as string | number | undefined),
    CarrierName: item.CarrierNameFirst as string | undefined,
    CarrierCode: item.CarrierCodeFirst as string | undefined,
    CabinClassName: item.CabinClassNameFirst as string | undefined,
    BookingClassName: item.BookingClassNameFirst as string | undefined,
    StopCount: item.StopCountFirst as number | undefined,
    TotalDuration: item.TotalDurationFirst as number | undefined,
    RowType: item.RowTypeFirst as string | undefined,
    MainRowNumber: item.MainRowNumberFirst as number | undefined,
    ProductID: item.ProductIDFirst as string | undefined,
    ConnectionIndex: item.ConnectionIndexFirst as string | undefined,
    IsLCC: item.IsLCCFirst,
    Baggage: item.BaggageFirst as string | undefined
  };
}

function multiwayLegCount(item: FlightListItem): number {
  return MULTIWAY_LEG_SUFFIXES.filter(
    (suffix) => item[`FlightNumber${suffix}`]
  ).length;
}

type FlightLegSlice = {
  from: string;
  to: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  flightNo: string;
  stopCount: number;
  groundMinutes: number;
};

function pickAirportCode(
  code?: string | null,
  name?: string | null
): string {
  const c = String(code || '')
    .trim()
    .toUpperCase();
  if (/^[A-Z]{3}$/.test(c)) return c;
  const fromName = String(name || '').match(/\(([A-Za-z]{3})\)/);
  return fromName ? fromName[1].toUpperCase() : c.slice(0, 3);
}

function formatGroundNote(minutes: number): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m layover`;
  if (h > 0) return `${h}h layover`;
  return `${m}m layover`;
}

type RoutePointsMode = 'connection' | 'multiway';

function buildRoutePointsFromLegs(
  legs: FlightLegSlice[],
  mode: RoutePointsMode = 'connection'
): FlightRoutePoint[] {
  if (legs.length === 0) return [];

  const points: FlightRoutePoint[] = [];
  const first = legs[0];
  points.push({
    code: first.from,
    time: first.departTime,
    kind: 'origin',
    note: first.flightNo || undefined
  });

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const next = legs[i + 1];
    const isLast = i === legs.length - 1;

    if (isLast) {
      points.push({
        code: leg.to,
        time: leg.arriveTime,
        kind: 'destination',
        note: leg.duration || undefined
      });
      continue;
    }

    // Airport between flights — arrive then depart.
    const connectionCode = next?.from || leg.to;
    if (mode === 'multiway') {
      // Separate city-pair flights, not an en-route layover.
      points.push({
        code: connectionCode,
        time: leg.arriveTime,
        timeTo: next?.departTime,
        kind: 'leg',
        note: next?.flightNo ?
          `Next · ${next.flightNo}` :
          'Next flight'
      });
    } else {
      points.push({
        code: connectionCode,
        time: leg.arriveTime,
        timeTo: next?.departTime,
        kind: 'stop',
        note:
          formatGroundNote(next?.groundMinutes || leg.groundMinutes) ||
          (next?.flightNo ? `Connect · ${next.flightNo}` : 'Connection')
      });
    }
  }

  return points;
}

function rowToLegSlice(item: FlightListItem): FlightLegSlice | null {
  const from = pickAirportCode(item.DepartCityCode, item.DepartCityName);
  const to = pickAirportCode(item.ArriveCityCode, item.ArriveCityName);
  if (!from || !to) return null;
  return {
    from,
    to,
    departTime: formatTimeFromIso(item.DepartureDate),
    arriveTime: formatTimeFromIso(item.ArrivalDate),
    duration: formatDuration(item.TotalDuration, item.TravelTime),
    flightNo: formatFlightNumber(item.CarrierCode, item.FlightNumber) || '',
    stopCount: Math.max(0, Number(item.StopCount) || 0),
    groundMinutes: Math.max(0, Number(item.GroundTime) || 0)
  };
}

function segmentSortKey(item: FlightListItem): string {
  return String(item.DepartureDate || item.ArrivalDate || '');
}

/**
 * Build flight legs from MainRow + SubRows so connection airports
 * (the orange stop dots) have real IATA codes from the API.
 */
function extractOnewayLegsFromCatalog(
  main: FlightListItem,
  catalog?: FlightListItem[]
): FlightLegSlice[] {
  if (!catalog?.length || main.MainRowNumber == null) return [];

  const mainNum = main.MainRowNumber;
  const mainItemId = main.ItemId;
  const subRows = catalog.filter(
    (row) =>
      row.MainRowNumber === mainNum &&
      row.RowType === 'SubRow' &&
      row.DepartCityCode &&
      row.ArriveCityCode &&
      row.FlightNumber
  );
  if (subRows.length === 0) return [];

  const sortedSubs = [...subRows].sort((a, b) =>
    segmentSortKey(a).localeCompare(segmentSortKey(b))
  );

  const stopCount = Math.max(0, Number(main.StopCount) || 0);
  const mainFrom = pickAirportCode(main.DepartCityCode, main.DepartCityName);
  const mainTo = pickAirportCode(main.ArriveCityCode, main.ArriveCityName);
  const chainFrom = pickAirportCode(
    sortedSubs[0].DepartCityCode,
    sortedSubs[0].DepartCityName
  );
  const chainTo = pickAirportCode(
    sortedSubs[sortedSubs.length - 1].ArriveCityCode,
    sortedSubs[sortedSubs.length - 1].ArriveCityName
  );

  let segmentRows: FlightListItem[] = sortedSubs;

  // MainRow is a priced summary for the full OD — use SubRows only.
  const mainIsSummary =
    stopCount > 0 &&
    mainFrom != null &&
    mainTo != null &&
    mainFrom === chainFrom &&
    mainTo === chainTo;

  if (!mainIsSummary && main.FlightNumber && mainFrom && mainTo) {
    const mainAlreadyInSubs = sortedSubs.some(
      (s) =>
        pickAirportCode(s.DepartCityCode, s.DepartCityName) === mainFrom &&
        pickAirportCode(s.ArriveCityCode, s.ArriveCityName) === mainTo
    );
    const isOwnMain =
      !mainItemId || !main.ItemId || main.ItemId === mainItemId;
    if (!mainAlreadyInSubs && isOwnMain && main.RowType === 'MainRow') {
      segmentRows = [main, ...sortedSubs];
    }
  }

  segmentRows = [...segmentRows].sort((a, b) =>
    segmentSortKey(a).localeCompare(segmentSortKey(b))
  );

  const seen = new Set<string>();
  const legs: FlightLegSlice[] = [];
  for (const row of segmentRows) {
    const leg = rowToLegSlice(row);
    if (!leg) continue;
    const key = `${leg.flightNo}|${leg.from}|${leg.to}|${leg.departTime}`;
    if (seen.has(key)) continue;
    seen.add(key);
    legs.push(leg);
  }

  return legs.length >= 2 ? legs : [];
}

function extractOnewayLegs(
  item: FlightListItem,
  catalog?: FlightListItem[]
): FlightLegSlice[] {
  const fromCatalog = extractOnewayLegsFromCatalog(item, catalog);
  if (fromCatalog.length >= 2) return fromCatalog;

  const from = pickAirportCode(item.DepartCityCode, item.DepartCityName);
  const to = pickAirportCode(item.ArriveCityCode, item.ArriveCityName);
  if (!from || !to) return [];

  const viaCodes = [
    item.ViaAirportCode,
    item.ViaCityCode,
    item.StopAirportCode,
    item.StopOverAirport,
    item.ConnectingAirport,
    item.ViaAirport,
    item.LayoverAirport,
    item.TransitAirport
  ].
  map((v) => pickAirportCode(v as string | undefined, null)).
  filter((c) => c && c !== from && c !== to) as string[];

  // Prefer an explicit via airport when StopCount > 0.
  if (viaCodes.length > 0) {
    const legs: FlightLegSlice[] = [];
    let prev = from;
    const stops = viaCodes.slice(
      0,
      Math.max(1, Number(item.StopCount) || viaCodes.length)
    );
    for (let i = 0; i < stops.length; i++) {
      legs.push({
        from: prev,
        to: stops[i],
        departTime: i === 0 ? formatTimeFromIso(item.DepartureDate) : '—',
        arriveTime: '—',
        duration: '',
        flightNo:
          i === 0 ?
            formatFlightNumber(item.CarrierCode, item.FlightNumber) || '' :
            '',
        stopCount: 0,
        groundMinutes: Math.max(0, Number(item.GroundTime) || 0)
      });
      prev = stops[i];
    }
    legs.push({
      from: prev,
      to,
      departTime: '—',
      arriveTime: formatTimeFromIso(item.ArrivalDate),
      duration: formatDuration(item.TotalDuration, item.TravelTime),
      flightNo: '',
      stopCount: 0,
      groundMinutes: 0
    });
    return legs;
  }

  return [
    {
      from,
      to,
      departTime: formatTimeFromIso(item.DepartureDate),
      arriveTime: formatTimeFromIso(item.ArrivalDate),
      duration: formatDuration(item.TotalDuration, item.TravelTime),
      flightNo: formatFlightNumber(item.CarrierCode, item.FlightNumber) || '',
      stopCount: Math.max(0, Number(item.StopCount) || 0),
      groundMinutes: Math.max(0, Number(item.GroundTime) || 0)
    }
  ];
}

function extractMultiwayLegs(item: FlightListItem): FlightLegSlice[] {
  const legs: FlightLegSlice[] = [];
  for (const suffix of MULTIWAY_LEG_SUFFIXES) {
    const flightNoRaw = item[`FlightNumber${suffix}`] as string | undefined;
    if (!flightNoRaw) continue;
    const from = pickAirportCode(
      item[`DepartCityCode${suffix}`] as string | undefined,
      item[`DepartCityName${suffix}`] as string | undefined
    );
    const to = pickAirportCode(
      item[`ArriveCityCode${suffix}`] as string | undefined,
      item[`ArriveCityName${suffix}`] as string | undefined
    );
    if (!from || !to) continue;
    const carrier = item[`CarrierCode${suffix}`] as string | undefined;
    legs.push({
      from,
      to,
      departTime: formatTimeFromIso(
        item[`DepartureDate${suffix}`] as string | undefined
      ),
      arriveTime: formatTimeFromIso(
        item[`ArrivalDate${suffix}`] as string | undefined
      ),
      duration: formatDuration(
        item[`TotalDuration${suffix}`] as string | number | undefined,
        item[`TravelTime${suffix}`] as string | number | undefined
      ),
      flightNo: formatFlightNumber(carrier, flightNoRaw),
      stopCount: Math.max(
        0,
        Number(item[`StopCount${suffix}`] as number | undefined) || 0
      ),
      groundMinutes: Math.max(
        0,
        Number(item[`GroundTime${suffix}`] as number | undefined) || 0
      )
    });
  }
  return legs;
}

function extractRoundwayOutboundLegs(item: FlightListItem): FlightLegSlice[] {
  const from = pickAirportCode(
    item.DepartCityCodeForward as string | undefined,
    item.DepartCityNameForward as string | undefined
  );
  const to = pickAirportCode(
    item.ArriveCityCodeForward as string | undefined,
    item.ArriveCityNameForward as string | undefined
  );
  if (!from || !to) return extractOnewayLegs(mapRoundwayForwardFields(item));
  return [
    {
      from,
      to,
      departTime: formatTimeFromIso(
        item.DepartureDateForward as string | undefined
      ),
      arriveTime: formatTimeFromIso(
        item.ArrivalDateForward as string | undefined
      ),
      duration: formatDuration(
        item.TotalDurationForward as string | number | undefined,
        item.TravelTimeForward as number | undefined
      ),
      flightNo: formatFlightNumber(
        item.CarrierCodeForward as string | undefined,
        item.FlightNumberForward as string | undefined
      ),
      stopCount: Math.max(0, Number(item.StopCountForward) || 0),
      groundMinutes: Math.max(0, Number(item.GroundTimeForward) || 0)
    }
  ];
}

/** True en-route stops from API StopCount fields. */
function technicalStopCount(legs: FlightLegSlice[]): number {
  return legs.reduce((sum, leg) => sum + Math.max(0, leg.stopCount || 0), 0);
}

/**
 * Continuous journey (oneway / outbound with connections):
 * StopCount on each segment + one transfer per connection between segments.
 */
function connectionTransfers(legs: FlightLegSlice[]): number {
  if (legs.length === 0) return 0;
  return technicalStopCount(legs) + Math.max(0, legs.length - 1);
}

/**
 * Multi-city: each First/Second/… leg is its own flight.
 * Only API StopCount counts as stops — not the junction between city pairs.
 */
function multiwayStopCount(legs: FlightLegSlice[]): number {
  return technicalStopCount(legs);
}

function stopCountTag(transfers: number): string {
  if (transfers === 0) return 'Non-stop';
  if (transfers === 1) return '1 stop';
  return `${transfers} stops`;
}

function multiwayRouteTags(item: FlightListItem): string[] {
  const tags: string[] = [];
  const legCount = multiwayLegCount(item);
  if (legCount > 1) tags.push(`${legCount} flights`);

  for (const suffix of MULTIWAY_LEG_SUFFIXES) {
    const from = item[`DepartCityCode${suffix}`] as string | undefined;
    const to = item[`ArriveCityCode${suffix}`] as string | undefined;
    if (!from || !to) continue;
    tags.push(`${from} → ${to}`);
  }

  return tags;
}

/** Map a GetMultiwayList MainRow (bundled multi-city itinerary) to a Trip card. */
export function mapMultiwayItemToTrip(
  item: FlightListItem,
  index: number,
  fromLabel: string,
  toLabel: string,
  preferredCurrency?: string
): Trip | null {
  if (isFlightErrorRow(item)) return null;

  const legs = extractMultiwayLegs(item);
  const trip = mapFlightItemToTrip(
    mapMultiwayFirstLegFields(item),
    index,
    fromLabel,
    toLabel,
    preferredCurrency
  );

  const routePoints = buildRoutePointsFromLegs(legs, 'multiway');
  // Use StopCount from each leg — do NOT treat multi-city junctions as stops.
  const transfers = multiwayStopCount(legs);
  trip.transfers = transfers;
  trip.routePoints = routePoints.length >= 2 ? routePoints : trip.routePoints;

  // Replace generic Non-stop / N stops tags with StopCount-driven label.
  trip.tags = (trip.tags ?? []).filter(
    (t) => !/^non-stop$/i.test(t) && !/^\d+\s+stops?$/i.test(t)
  );
  trip.tags.push(stopCountTag(transfers));
  trip.tags = [...trip.tags, ...multiwayRouteTags(item)];

  if (legs.length > 0) {
    const last = legs[legs.length - 1];
    trip.arriveTime = last.arriveTime || trip.arriveTime;
    trip.arriveCityCode = last.to || trip.arriveCityCode;
    trip.toCity = last.to || trip.toCity;
    const totalMins = legs.reduce((sum, leg) => {
      return sum + parseTravelTimeMinutes(leg.duration);
    }, 0);
    if (totalMins > 0) {
      trip.duration = formatDuration(undefined, totalMins);
    }
  }

  trip.apiPayload = item as Record<string, unknown>;
  return trip;
}

/** @deprecated Use isFlightErrorRow */
export const isMultiwayErrorRow = isFlightErrorRow;

function mapRoundwayForwardFields(item: FlightListItem): FlightListItem {
  return {
    ...item,
    FlightNumber: item.FlightNumberForward as string | undefined,
    DepartCityCode: item.DepartCityCodeForward as string | undefined,
    ArriveCityCode: item.ArriveCityCodeForward as string | undefined,
    DepartCityName: item.DepartCityNameForward as string | undefined,
    ArriveCityName: item.ArriveCityNameForward as string | undefined,
    DepartureDate: item.DepartureDateForward as string | undefined,
    ArrivalDate: item.ArrivalDateForward as string | undefined,
    TravelTime: item.TravelTimeForward as number | undefined,
    CarrierName: item.CarrierNameForward as string | undefined,
    CarrierCode: item.CarrierCodeForward as string | undefined,
    CabinClassName: item.CabinClassNameForward as string | undefined,
    BookingClassName: item.BookingClassNameForward as string | undefined,
    StopCount: item.StopCountForward as number | undefined,
    TotalDuration: item.TotalDurationForward as number | undefined,
    RowType: item.RowTypeForward as string | undefined,
    MainRowNumber: item.MainRowNumberForward as number | undefined,
    ProductID: item.ProductIDForward as string | undefined,
    ConnectionIndex: item.ConnectionIndexForward as string | undefined,
    IsLCC: item.IsLCCForward,
    IsLCCFirst: item.IsLCCForward,
    Baggage: item.BaggageForward as string | undefined
  };
}

/** Map a GetRoundwayList MainRow (bundled outbound + return) to a Trip card. */
export function mapRoundwayItemToTrip(
  item: FlightListItem,
  index: number,
  fromLabel: string,
  toLabel: string,
  preferredCurrency?: string
): Trip {
  const trip = mapFlightItemToTrip(
    mapRoundwayForwardFields(item),
    index,
    fromLabel,
    toLabel,
    preferredCurrency
  );

  const outboundLegs = extractRoundwayOutboundLegs(item);
  const routePoints = buildRoutePointsFromLegs(outboundLegs);
  if (routePoints.length >= 2) {
    trip.routePoints = routePoints;
    trip.transfers = connectionTransfers(outboundLegs);
  }

  const returnNo = item.FlightNumberReturn as string | undefined;
  const returnDepart = formatTimeFromIso(item.DepartureDateReturn as string | undefined);
  const returnArrive = formatTimeFromIso(item.ArrivalDateReturn as string | undefined);
  const returnFrom = pickAirportCode(
    item.DepartCityCodeReturn as string | undefined,
    item.DepartCityNameReturn as string | undefined
  );
  const returnTo = pickAirportCode(
    item.ArriveCityCodeReturn as string | undefined,
    item.ArriveCityNameReturn as string | undefined
  );

  if (returnNo) {
    trip.tags = [
      ...(trip.tags ?? []),
      `Return ${returnDepart}–${returnArrive}`,
      ...(returnFrom && returnTo ? [`${returnFrom} → ${returnTo}`] : [])
    ];
  }

  trip.apiPayload = item as Record<string, unknown>;
  return trip;
}

/** Build a return-leg Trip from a roundway MainRow for checkout summaries. */
export function mapRoundwayReturnTrip(
  item: FlightListItem,
  fromLabel: string,
  toLabel: string,
  preferredCurrency?: string
): Trip {
  const operator = carrierLabel({
    CarrierName: item.CarrierNameReturn as string | undefined,
    CarrierCode: item.CarrierCodeReturn as string | undefined
  });
  const code = (item.CarrierCodeReturn as string | undefined)?.trim() || '';
  const stops = Math.max(0, Number(item.StopCountReturn) || 0);
  const departCode = (item.DepartCityCodeReturn as string | undefined)?.trim();
  const arriveCode = (item.ArriveCityCodeReturn as string | undefined)?.trim();

  return {
    id: `return-${item.MainRowNumberReturn ?? item.ItemId ?? 'leg'}`,
    operator,
    operatorInitial: operator.charAt(0).toUpperCase() || 'A',
    operatorColor: operatorColor(operator),
    operatorLogo: carrierLogoUrl(code),
    departTime: formatTimeFromIso(item.DepartureDateReturn as string | undefined),
    arriveTime: formatTimeFromIso(item.ArrivalDateReturn as string | undefined),
    duration: formatDuration(
      item.TotalDurationReturn as string | undefined,
      item.TravelTimeReturn as number | undefined
    ),
    transfers: stops,
    // Round-trip fare is usually bundled on the outbound row — keep 0 when
    // the return leg has no separate amount so summaries don't double-count.
    price: 0,
    currency: resolveFlightCurrency(
      item.Currency as string | undefined,
      preferredCurrency
    ),
    co2: '',
    tags: item.CabinClassNameReturn ?
    [String(item.CabinClassNameReturn)] :
    [],
    fromCity:
    cityLabel(
      item.DepartCityNameReturn as string | undefined,
      departCode
    ) ||
    toLabel ||
    departCode ||
    '',
    toCity:
    cityLabel(
      item.ArriveCityNameReturn as string | undefined,
      arriveCode
    ) ||
    fromLabel ||
    arriveCode ||
    '',
    flightNo: formatFlightNumber(
      code,
      item.FlightNumberReturn as string | undefined
    ),
    departCityCode: departCode,
    arriveCityCode: arriveCode,
    baggage: item.Baggage as string | undefined,
    cabinBaggage: item.CabinBaggage as string | undefined,
    refundable: item.Refundable as string | undefined,
    fareClass: item.BookingClassNameReturn as string | undefined,
    apiPayload: item as Record<string, unknown>
  };
}

export function mapFlightItemToTrip(
  item: FlightListItem,
  index: number,
  fromLabel: string,
  toLabel: string,
  preferredCurrency?: string,
  catalog?: FlightListItem[]
): Trip {
  const operator = carrierLabel(item);
  const { price, originalPrice } = resolveFlightPrice(item);
  const currency = resolveFlightCurrency(item.Currency, preferredCurrency);
  const legs = extractOnewayLegs(item, catalog);
  // Prefer real connection count from segments; don't inflate with bad StopCount.
  const stops =
    legs.length > 1 ?
      connectionTransfers(legs) :
      Math.max(0, Number(item.StopCount) || 0);
  const durationSource =
  stops > 0 && item.TotalDuration ?
  item.TotalDuration :
  item.TravelTime;

  const tags: string[] = [];
  if (item.CabinClassName) tags.push(item.CabinClassName);
  if (item.BookingClassName) tags.push(`Class ${item.BookingClassName}`);
  if (item.Refundable === 'Refundable') tags.push('Refundable');
  else if (item.Refundable?.trim()) tags.push(item.Refundable.trim());
  tags.push(stopCountTag(stops));

  const checkedBag = formatCheckedBaggage(item.Baggage);
  if (checkedBag && !tags.some((t) => t.toLowerCase().includes('kg'))) {
    tags.push(checkedBag);
  }

  const id =
    [
      item.ItemId,
      item.MainRowNumber,
      item.ProductID,
      item.FlightNumber,
      item.BookingClassName
    ].
    filter(Boolean).
    join('-') || `flight-${index}`;

  const routePoints = buildRoutePointsFromLegs(legs);

  const flightNos = legs.
  map((leg) => leg.flightNo).
  filter((n): n is string => !!n && n !== '—');
  const uniqueFlightNos = [...new Set(flightNos)];

  return {
    id,
    operator,
    operatorInitial: operator.charAt(0).toUpperCase() || 'A',
    operatorColor: operatorColor(operator),
    operatorLogo: resolveCarrierLogo(item),
    departTime:
      legs[0]?.departTime || formatTimeFromIso(item.DepartureDate),
    arriveTime:
      legs[legs.length - 1]?.arriveTime ||
      formatTimeFromIso(item.ArrivalDate),
    duration: formatDuration(item.TotalDuration, durationSource),
    transfers: stops,
    price,
    originalPrice,
    currency,
    co2: '',
    tags,
    fromCity:
    cityLabel(item.DepartCityName, item.DepartCityCode) ||
    fromLabel ||
    item.DepartCityCode ||
    '',
    toCity:
    cityLabel(item.ArriveCityName, item.ArriveCityCode) ||
    toLabel ||
    item.ArriveCityCode ||
    '',
    flightNo:
      uniqueFlightNos.length > 0 ?
        uniqueFlightNos.join(' / ') :
        formatFlightNumber(item.CarrierCode, item.FlightNumber),
    baggage: item.Baggage,
    cabinBaggage: item.CabinBaggage,
    refundable: item.Refundable,
    departCityCode: item.DepartCityCode || legs[0]?.from,
    arriveCityCode:
      item.ArriveCityCode || legs[legs.length - 1]?.to,
    fareClass: item.BookingClassName,
    routePoints: routePoints.length >= 2 ? routePoints : undefined,
    apiPayload: item as Record<string, unknown>
  };
}
