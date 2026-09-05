import { Trip } from '../../components/travel/ethioTravelData';
import type { FlightListItem } from './mapFlightToTrip';
import {
  formatCabinBaggage,
  formatCheckedBaggage,
  isRoundwayFlightItem,
  isMultiwayFlightItem
} from './mapFlightToTrip';
import {
  normalizePassengerCounts,
  type PassengerCounts
} from './buildFlightTravellers';

export type FlightBookingPricing = {
  CurrencyCode?: string;
  TotalFare?: string;
  GrandTotal?: string;
  AdualFare?: string;
  AdualCount?: string;
  ChildFare?: string;
  InfantFare?: string;
  AdualTaxFare?: string;
  ChildTaxFare?: string;
  InfantTaxFare?: string;
  TotalGST?: string;
  TotalConvenience?: string;
  TotalDiscount?: string;
  GSTType?: string;
  [key: string]: unknown;
};

/** Confirmed booking row from GetBookingdetails string[0]. */
export type FlightBookingDetail = FlightListItem & {
  DepartAirportName?: string;
  ArrivalAirportName?: string;
  DepartureTerminal?: string;
  ArrivalTerminal?: string;
  BookingPublishedFare?: string | number;
  BookingOfferedFare?: string | number;
  BookingBaseFare?: string | number;
  BookingTax?: string | number;
  BookingDiscount?: string | number;
  BookingServiceFee?: string | number;
  BookingOtherCharges?: string | number;
  CabinBaggage?: string;
  IsPassportRequiredAtBook?: boolean | string;
  IsPassportRequiredAtTicket?: boolean | string;
  LastTicketingDate?: string;
  TicketAdvisory?: string;
  MiniFareRuleType1?: string;
  MiniFareRuleDetails1?: string;
  MiniFareRuleType2?: string;
  MiniFareRuleDetails2?: string;
  MiniFareRuleType3?: string;
  MiniFareRuleDetails3?: string;
  MiniFareRuleType4?: string;
  MiniFareRuleDetails4?: string;
};

export type FlightCabinOption = {
  id: string;
  name: string;
  perk: string;
  /** Baggage line shown on cabin cards (e.g. "23 kg checked · 7 kg cabin"). */
  perkLine1?: string;
  /** Policy / class line (e.g. "Non-Refundable · Class N"). */
  perkLine2?: string;
  extra: number;
  bookingClass?: string;
  /** Search MainRow for this fare — used to switch cabin without dropping other options. */
  sourceRow?: FlightListItem;
  price?: number;
};

export type MiniFareRule = {
  type: string;
  detail: string;
};

export type FlightBookingResult = {
  details: FlightListItem[];
  bookingDetail: FlightBookingDetail | null;
  pricing: FlightBookingPricing | null;
  fareRulesHtml?: string;
  apiMessage?: string;
};

/** Fields the GuestAPI DataTable expects but some carriers / trip types omit. */
const FLIGHT_ROW_DEFAULTS: Record<string, unknown> = {
  IsLCC: null,
  IsLCCFirst: null,
  BrandList: null,
  BrandRef: null,
  BrandTier: null,
  Craft: null,
  EquipmentName: null,
  CarrierName: '',
  ResultIndexID: null,
  ResultIndex: null,
  LegIndex: null,
  LastTicketingDate: '',
  // NDC / GDS fare identifiers — required by GetBookingdetails for some carriers
  ProductOfferingID: null,
  ProductID: null,
  CatalogIdentifier: null,
  CombinableCode: null
};

const ROUNDWAY_ROW_DEFAULTS: Record<string, unknown> = {
  ...FLIGHT_ROW_DEFAULTS,
  IsLCCForward: null,
  IsLCCReturn: null,
  BrandTierForward: '',
  BrandTierReturn: '',
  CraftForward: '',
  CraftReturn: '',
  ProductOfferingIdForward: null,
  ProductOfferingIDReturn: null,
  ProductIDForward: null,
  ProductIDReturn: null,
  CombinableCodeForward: null,
  CombinableCodeReturn: null,
  LastTicketingDate: ''
};

export function normalizeFlightRow(item: FlightListItem): FlightListItem {
  const isLcc = item.IsLCC ?? null;
  const offeringId = item.ProductOfferingID ?? null;
  const productId = item.ProductID ?? null;
  return {
    ...FLIGHT_ROW_DEFAULTS,
    ...item,
    IsLCC: isLcc,
    IsLCCFirst: item.IsLCCFirst ?? isLcc,
    ProductOfferingID: offeringId,
    ProductID: productId,
    CatalogIdentifier: item.CatalogIdentifier ?? item.ItemId ?? null
  };
}

export function normalizeRoundwayRow(item: FlightListItem): FlightListItem {
  const isLccForward = item.IsLCCForward ?? null;
  const isLccReturn = item.IsLCCReturn ?? null;
  const offeringForward =
    item.ProductOfferingIdForward ?? item.ProductOfferingID ?? null;
  const offeringReturn = item.ProductOfferingIDReturn ?? null;
  return {
    ...ROUNDWAY_ROW_DEFAULTS,
    ...item,
    IsLCC: isLccForward,
    IsLCCForward: isLccForward,
    IsLCCReturn: isLccReturn,
    ProductOfferingID: offeringForward,
    ProductOfferingIdForward: offeringForward,
    ProductOfferingIDReturn: offeringReturn,
    ProductID: item.ProductIDForward ?? item.ProductID ?? null,
    ProductIDForward: item.ProductIDForward ?? null,
    ProductIDReturn: item.ProductIDReturn ?? null,
    CatalogIdentifier: item.CatalogIdentifier ?? item.ItemId ?? null
  };
}

export function normalizeRoundwayRows(items: FlightListItem[]): FlightListItem[] {
  return alignBookingRowColumns(
    items.map((item) => sanitizeNdcFareRuleFields(normalizeRoundwayRow(item)))
  );
}

export function normalizeFlightRows(items: FlightListItem[]): FlightListItem[] {
  return alignBookingRowColumns(
    sanitizeNdcSegmentTiming(
      items.map((item) => sanitizeNdcFareRuleFields(normalizeFlightRow(item)))
    )
  );
}

const MULTIWAY_ROW_DEFAULTS: Record<string, unknown> = {
  ...FLIGHT_ROW_DEFAULTS,
  IsLCCFirst: null,
  IsLCCSecond: null,
  IsLCCThird: null,
  IsLCCFourth: null,
  BrandTierFirst: '',
  BrandTierSecond: '',
  BrandTierThird: '',
  BrandTierFourth: '',
  CraftFirst: '',
  CraftSecond: '',
  CraftThird: '',
  CraftFourth: '',
  ProductOfferingIDFirst: null,
  ProductOfferingIDSecond: null,
  ProductOfferingIDThird: null,
  ProductOfferingIDFourth: null,
  ProductIDFirst: null,
  ProductIDSecond: null,
  ProductIDThird: null,
  ProductIDFourth: null,
  LastTicketingDate: ''
};

/**
 * GuestAPI GetBookingdetails builds a DataTable from JSON keys, then reads
 * shared columns like IsLCC / ProductOfferingID. Multiway search rows often
 * only include First/Second/… suffixes — without the base columns the server
 * throws: Column 'X' does not belong to table.
 */
export function normalizeMultiwayRow(item: FlightListItem): FlightListItem {
  const isLccFirst = item.IsLCCFirst ?? item.IsLCC ?? null;
  const offeringFirst =
    item.ProductOfferingIDFirst ?? item.ProductOfferingID ?? null;
  const productFirst = item.ProductIDFirst ?? item.ProductID ?? null;
  return {
    ...MULTIWAY_ROW_DEFAULTS,
    ...item,
    IsLCC: isLccFirst,
    IsLCCFirst: isLccFirst,
    IsLCCSecond: item.IsLCCSecond ?? null,
    IsLCCThird: item.IsLCCThird ?? null,
    IsLCCFourth: item.IsLCCFourth ?? null,
    ProductOfferingID: offeringFirst,
    ProductOfferingIDFirst: offeringFirst,
    ProductOfferingIDSecond: item.ProductOfferingIDSecond ?? null,
    ProductOfferingIDThird: item.ProductOfferingIDThird ?? null,
    ProductOfferingIDFourth: item.ProductOfferingIDFourth ?? null,
    ProductID: productFirst,
    ProductIDFirst: productFirst,
    ProductIDSecond: item.ProductIDSecond ?? null,
    ProductIDThird: item.ProductIDThird ?? null,
    ProductIDFourth: item.ProductIDFourth ?? null,
    CatalogIdentifier: item.CatalogIdentifier ?? item.ItemId ?? null
  };
}

export function normalizeMultiwayRows(items: FlightListItem[]): FlightListItem[] {
  return alignBookingRowColumns(
    items.map((item) => sanitizeNdcFareRuleFields(normalizeMultiwayRow(item)))
  );
}

/**
 * Ensure every row in the SelectedRowJson array shares the same column set.
 * ASP.NET DataTable from JSON is fragile when MainRow/SubRow keys differ.
 */
function alignBookingRowColumns(items: FlightListItem[]): FlightListItem[] {
  if (items.length <= 1) return items;

  const keySet = new Set<string>();
  for (const item of items) {
    for (const key of Object.keys(item)) keySet.add(key);
  }

  return items.map((item) => {
    const next: FlightListItem = { ...item };
    for (const key of keySet) {
      if (!(key in next)) {
        next[key] = null;
      }
    }
    return next;
  });
}

/** GuestAPI expects `Roundway` / `Multiway` for bundled fares (not `Roundtrip`). */
export function resolveBookingTripType(
  main: FlightListItem | undefined
): 'Oneway' | 'Roundway' | 'Multiway' {
  if (main && isRoundwayFlightItem(main)) return 'Roundway';
  if (main && isMultiwayFlightItem(main)) return 'Multiway';
  return 'Oneway';
}

function hasMultiwaySubRows(
  main: FlightListItem,
  allItems: FlightListItem[]
): boolean {
  const mainNumber = main.MainRowNumberFirst;
  if (mainNumber == null) return false;

  return scopedCatalog(main, allItems).some(
    (item) =>
      item !== main &&
      item.MainRowNumberFirst === mainNumber &&
      (item.RowTypeFirst === 'SubRow' ||
        item.RowTypeSecond === 'SubRow' ||
        item.RowTypeThird === 'SubRow' ||
        item.RowTypeFourth === 'SubRow')
  );
}

function hasRoundwaySubRows(
  main: FlightListItem,
  allItems: FlightListItem[]
): boolean {
  const forwardMain = main.MainRowNumberForward;
  const returnMain = main.MainRowNumberReturn;

  return scopedCatalog(main, allItems).some(
    (item) =>
      item !== main &&
      ((item.RowTypeForward === 'SubRow' &&
        forwardMain != null &&
        item.MainRowNumberForward === forwardMain) ||
        (item.RowTypeReturn === 'SubRow' &&
          returnMain != null &&
          item.MainRowNumberReturn === returnMain))
  );
}

/** True when the row is a segment / SubRow (not the priced MainRow). */
export function isSubBookingRow(row: FlightListItem): boolean {
  return (
    row.RowType === 'SubRow' ||
    row.RowTypeFirst === 'SubRow' ||
    row.RowTypeSecond === 'SubRow' ||
    row.RowTypeThird === 'SubRow' ||
    row.RowTypeFourth === 'SubRow' ||
    row.RowTypeForward === 'SubRow' ||
    row.RowTypeReturn === 'SubRow'
  );
}

/** Rows belong to the same priced itinerary as `main`. */
function belongsToSameItem(
  item: FlightListItem,
  main: FlightListItem
): boolean {
  const itemId = main.ItemId;
  if (!itemId) return true;
  if (item.ItemId === itemId) return true;

  // SubRows often omit ItemId — match by itinerary MainRowNumber keys.
  if (!isSubBookingRow(item)) return false;
  if (item.ItemId) return false;

  if (isRoundwayFlightItem(main)) {
    const fwd = main.MainRowNumberForward;
    const ret = main.MainRowNumberReturn;
    if (fwd != null && item.MainRowNumberForward === fwd) return true;
    if (ret != null && item.MainRowNumberReturn === ret) return true;
    return false;
  }

  if (isMultiwayFlightItem(main)) {
    return (
      main.MainRowNumberFirst != null &&
      item.MainRowNumberFirst === main.MainRowNumberFirst
    );
  }

  return (
    main.MainRowNumber != null && item.MainRowNumber === main.MainRowNumber
  );
}

function scopedCatalog(
  main: FlightListItem,
  allItems: FlightListItem[]
): FlightListItem[] {
  return allItems.filter((item) => belongsToSameItem(item, main));
}

function dedupeBookingRows(rows: FlightListItem[]): FlightListItem[] {
  const seen = new Set<string>();
  const out: FlightListItem[] = [];
  for (const row of rows) {
    const key = [
      row.ItemId ?? '',
      row.RowType ?? '',
      row.RowTypeForward ?? '',
      row.RowTypeReturn ?? '',
      row.RowTypeFirst ?? '',
      row.RowTypeSecond ?? '',
      row.FlightNumber ?? '',
      row.FlightNumberForward ?? '',
      row.FlightNumberReturn ?? '',
      row.FlightNumberFirst ?? '',
      row.FlightNumberSecond ?? '',
      row.DepartCityCode ?? '',
      row.ArriveCityCode ?? '',
      row.DepartureDate ?? '',
      row.DepartureDateForward ?? '',
      row.DepartureDateReturn ?? ''
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/**
 * Keep the selected cabin MainRow and remap segment SubRows onto its
 * MainRowNumber / ItemId (cabin siblings often lack their own SubRows).
 */
export function alignSegmentRowsToMain(
  main: FlightListItem,
  rows: FlightListItem[]
): FlightListItem[] {
  const segments = rows.filter(isSubBookingRow);
  if (segments.length === 0) return [main];

  const remapped = segments.map((segment) => {
    const next: FlightListItem = { ...segment };
    if (main.ItemId) next.ItemId = main.ItemId;
    if (main.MainRowNumber != null) next.MainRowNumber = main.MainRowNumber;
    if (main.MainRowNumberForward != null) {
      next.MainRowNumberForward = main.MainRowNumberForward;
    }
    if (main.MainRowNumberReturn != null) {
      next.MainRowNumberReturn = main.MainRowNumberReturn;
    }
    if (main.MainRowNumberFirst != null) {
      next.MainRowNumberFirst = main.MainRowNumberFirst;
    }
    if (main.MainRowNumberSecond != null) {
      next.MainRowNumberSecond = main.MainRowNumberSecond;
    }
    if (main.MainRowNumberThird != null) {
      next.MainRowNumberThird = main.MainRowNumberThird;
    }
    if (main.MainRowNumberFourth != null) {
      next.MainRowNumberFourth = main.MainRowNumberFourth;
    }
    return next;
  });

  return [main, ...remapped];
}

/** Borrow SubRows from the same MainRowNumber or a sibling cabin itinerary. */
function findOnewaySubRowsForMain(
  main: FlightListItem,
  allItems: FlightListItem[]
): FlightListItem[] {
  const mainRowNumber = main.MainRowNumber;
  if (mainRowNumber == null) return [];

  // Prefer SubRows on this MainRowNumber only (ItemId is shared across cabins).
  const direct = allItems.filter(
    (item) => item.MainRowNumber === mainRowNumber && isSubBookingRow(item)
  );
  if (direct.length > 0) return direct;

  const siblings = collectSiblingCabinMains(main, allItems);
  for (const sibling of siblings) {
    if (
      sibling.MainRowNumber == null ||
      sibling.MainRowNumber === mainRowNumber
    ) {
      continue;
    }
    const subs = allItems.filter(
      (item) =>
        item.MainRowNumber === sibling.MainRowNumber && isSubBookingRow(item)
    );
    if (subs.length > 0) return subs;
  }

  // Last resort: find any SubRow group whose flight numbers cover "852 | 905".
  const byFlightNumbers = findOnewaySubRowsByFlightNumbers(main, allItems);
  if (byFlightNumbers.length > 0) return byFlightNumbers;

  return [];
}

/** Split MainRow FlightNumber "852 | 905" / "1428 / 1022" into segment tokens. */
export function onewayFlightNumberParts(main: FlightListItem): string[] {
  return String(main.FlightNumber || '')
    .split(/\s*[|/]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * When MainRowNumber-scoped SubRows are missing (cabin switch / catalog drift),
 * recover segments by matching FlightNumber parts under one shared MainRowNumber.
 */
function findOnewaySubRowsByFlightNumbers(
  main: FlightListItem,
  allItems: FlightListItem[]
): FlightListItem[] {
  const parts = onewayFlightNumberParts(main);
  if (parts.length < 2) return [];

  const carrier = String(main.CarrierCode || '').trim().toUpperCase();
  const partSet = new Set(parts.map((p) => p.replace(/^[A-Z]{2}\s+/i, '').trim()));

  const groups = new Map<number, FlightListItem[]>();
  for (const item of allItems) {
    if (!isSubBookingRow(item) || item.MainRowNumber == null) continue;
    if (carrier) {
      const itemCarrier = String(item.CarrierCode || '').trim().toUpperCase();
      if (itemCarrier && itemCarrier !== carrier) continue;
    }
    const fn = String(item.FlightNumber || '')
      .replace(/^[A-Z]{2}\s+/i, '')
      .trim();
    if (!partSet.has(fn) && !parts.includes(String(item.FlightNumber || '').trim())) {
      continue;
    }
    const list = groups.get(item.MainRowNumber) || [];
    list.push(item);
    groups.set(item.MainRowNumber, list);
  }

  let best: FlightListItem[] = [];
  for (const subs of groups.values()) {
    const fns = new Set(
      subs.map((s) =>
        String(s.FlightNumber || '')
          .replace(/^[A-Z]{2}\s+/i, '')
          .trim()
      )
    );
    const covered = [...partSet].filter((p) => fns.has(p)).length;
    if (covered >= partSet.size && subs.length >= best.length) {
      best = subs;
    }
  }

  return best;
}

/** True when this oneway MainRow needs SubRows in GetBookingdetails jsonstring. */
export function onewayNeedsSegmentSubRows(main: FlightListItem): boolean {
  const stops = Math.max(0, Number(main.StopCount) || 0);
  if (stops > 0) return true;
  const flightNo = String(main.FlightNumber || '');
  // GuestAPI often packs connections as "852 | 905" on a single MainRow.
  const parts = flightNo.
  split(/\s*[|/]\s*/).
  map((p) => p.trim()).
  filter(Boolean);
  return parts.length > 1;
}

/**
 * Oneway segments for GetBookingdetails / SaveBooking.
 *
 * GuestAPI shares one ItemId across many cabin MainRows. Never collect by
 * ItemId alone — that yields 100+ rows and "Expected N rows" faults.
 * Scope SubRows to the selected MainRowNumber (1 Main + its SubRows).
 */
function collectOnewayBookingRows(
  main: FlightListItem,
  allItems: FlightListItem[]
): FlightListItem[] {
  const mainRowNumber = main.MainRowNumber;

  // Nonstop / single-segment: SelectedRowJson must be exactly 1 MainRow.
  if (!onewayNeedsSegmentSubRows(main) || mainRowNumber == null) {
    return [main];
  }

  let subs = allItems.filter(
    (item) =>
      item.MainRowNumber === mainRowNumber && isSubBookingRow(item)
  );

  // Connecting fare with SubRows stored under a sibling cabin MainRowNumber.
  if (subs.length === 0) {
    const siblings = collectSiblingCabinMains(main, allItems);
    for (const sibling of siblings) {
      if (
        sibling.MainRowNumber == null ||
        sibling.MainRowNumber === mainRowNumber
      ) {
        continue;
      }
      const siblingSubs = allItems.filter(
        (item) =>
          item.MainRowNumber === sibling.MainRowNumber &&
          isSubBookingRow(item)
      );
      if (siblingSubs.length > 0) {
        subs = siblingSubs;
        break;
      }
    }
  }

  if (subs.length === 0) {
    subs = findOnewaySubRowsByFlightNumbers(main, allItems);
  }

  if (subs.length === 0) return [main];
  return alignSegmentRowsToMain(main, [main, ...subs]);
}

function collectRoundwayBookingRows(
  main: FlightListItem,
  allItems: FlightListItem[]
): FlightListItem[] {
  const fwd = main.MainRowNumberForward;
  const ret = main.MainRowNumberReturn;

  // OR match — SubRows often only set one side. Do NOT pull every row with
  // the same ItemId (cabins share ItemId and explode the array).
  const matchItinerary = (item: FlightListItem): boolean => {
    const forwardMatch = fwd != null && item.MainRowNumberForward === fwd;
    const returnMatch = ret != null && item.MainRowNumberReturn === ret;
    return forwardMatch || returnMatch;
  };

  const rows = allItems.filter(matchItinerary);
  const mains = rows.filter(isMainBookingRow);
  const selectedMain =
    mains.find((r) => r === main) ||
    mains.find(
      (r) =>
        r.BookingClassName === main.BookingClassName &&
        r.CabinClassName === main.CabinClassName
    ) ||
    main;
  const subs = rows.filter(isSubBookingRow);
  // Dedupe SubRows by flight number keys so cabin clones don't multiply.
  const seen = new Set<string>();
  const uniqueSubs: FlightListItem[] = [];
  for (const sub of subs) {
    const key = [
      sub.FlightNumberForward ?? '',
      sub.FlightNumberReturn ?? '',
      sub.DepartureDateForward ?? '',
      sub.DepartureDateReturn ?? ''
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueSubs.push(sub);
  }

  if (uniqueSubs.length === 0) return [selectedMain];
  return sortRoundwayBookingRows(
    alignSegmentRowsToMain(selectedMain, [selectedMain, ...uniqueSubs])
  );
}

function collectMultiwayBookingRows(
  main: FlightListItem,
  allItems: FlightListItem[]
): FlightListItem[] {
  const mainNumber = main.MainRowNumberFirst;
  if (mainNumber == null) return [main];

  const rows = allItems.filter(
    (item) =>
      item.MainRowNumberFirst === mainNumber &&
      matchesMultiwayLegMainNumbers(item, main)
  );
  const subs = rows.filter(isSubBookingRow);
  const seen = new Set<string>();
  const uniqueSubs: FlightListItem[] = [];
  for (const sub of subs) {
    const key = [
      sub.FlightNumberFirst ?? '',
      sub.FlightNumberSecond ?? '',
      sub.FlightNumberThird ?? '',
      sub.FlightNumberFourth ?? '',
      sub.RowTypeSecond ?? '',
      sub.DepartureDateSecond ?? ''
    ].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueSubs.push(sub);
  }

  if (uniqueSubs.length === 0) return [main];
  return sortMultiwayBookingRows(
    alignSegmentRowsToMain(main, [main, ...uniqueSubs])
  );
}

/** Collect MainRow + SubRows for the selected flight from a search result set. */
export function collectBookingRows(
  main: FlightListItem,
  allItems: FlightListItem[]
): FlightListItem[] {
  if (isRoundwayFlightItem(main)) {
    return collectRoundwayBookingRows(main, allItems);
  }

  if (isMultiwayFlightItem(main)) {
    return collectMultiwayBookingRows(main, allItems);
  }

  return collectOnewayBookingRows(main, allItems);
}

/** Parse "Expected N rows in jsonstring" from GuestAPI fault text. */
export function parseExpectedBookingRowCount(
  message?: string | null
): number | null {
  if (!message) return null;
  const match = String(message).match(/expected\s+(\d+)\s+rows?/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Build row sets to try when GetBookingdetails rejects the jsonstring length.
 * Order: primary collect → broader itinerary → sized by stop/flight parts → MainRow only.
 */
export function buildBookingRowAttempts(
  main: FlightListItem,
  catalog: FlightListItem[],
  preferred?: FlightListItem[]
): FlightListItem[][] {
  const bookableMain = resolveBookableNdcMain(main, catalog);
  const prepared = collectBookingRowsForApi(bookableMain, catalog, preferred);
  const primary = prepared.rows;
  const attempts: FlightListItem[][] = [primary];
  main = prepared.main;

  if (isRoundwayFlightItem(main)) {
    const fwd = main.MainRowNumberForward;
    const ret = main.MainRowNumberReturn;
    const broad = catalog.filter((item) => {
      const forwardMatch = fwd != null && item.MainRowNumberForward === fwd;
      const returnMatch = ret != null && item.MainRowNumberReturn === ret;
      return forwardMatch || returnMatch;
    });
    const subs = broad.filter(isSubBookingRow);
    if (subs.length > 0) {
      attempts.push(
        sanitizeNdcSegmentTiming(alignSegmentRowsToMain(main, [main, ...subs]))
      );
    }
  } else if (isMultiwayFlightItem(main)) {
    const n = main.MainRowNumberFirst;
    if (n != null) {
      const broad = catalog.filter((item) => item.MainRowNumberFirst === n);
      const subs = broad.filter(isSubBookingRow);
      if (subs.length > 0) {
        attempts.push(
          sanitizeNdcSegmentTiming(
            alignSegmentRowsToMain(main, [main, ...subs])
          )
        );
      }
    }
  } else {
    const subs = findOnewaySubRowsForMain(main, catalog);
    if (subs.length > 0) {
      attempts.push(
        sanitizeNdcSegmentTiming(alignSegmentRowsToMain(main, [main, ...subs]))
      );
    }
    // NDC / Qatar connections: recover SubRows from FlightNumber "852 | 905"
    const byFn = findOnewaySubRowsByFlightNumbers(main, catalog);
    if (byFn.length > 0) {
      attempts.push(
        sanitizeNdcSegmentTiming(alignSegmentRowsToMain(main, [main, ...byFn]))
      );
    }
    // NDC multi-stop: GuestAPI wants StopCount+3 (already in primary via
    // collectBookingRowsForApi; keep an explicit pad attempt for retries).
    const ndcExpected = ndcExpectedOnewayRowCount(main);
    if (ndcExpected != null && ndcExpected !== primary.length) {
      attempts.push(
        sanitizeNdcSegmentTiming(
          padBookingRowsToCount(main, primary, ndcExpected)
        )
      );
    }
  }

  attempts.push([main]);

  // Deduplicate attempts by serialized length + first ItemId
  const seen = new Set<string>();
  return attempts.filter((rows) => {
    if (!rows.length) return false;
    const key = `${rows.length}:${rows.map((r) => r.FlightNumber ?? r.FlightNumberForward ?? r.FlightNumberFirst ?? '').join(',')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * GuestAPI NDC multi-stop fares often require more rows than Main+SubRows
 * (e.g. 3 segments → "Expected 5 rows"). Pad by cloning the last SubRow so
 * GetBookingdetails / SaveBooking accept the jsonstring.
 */
export function padBookingRowsToCount(
  main: FlightListItem,
  rows: FlightListItem[],
  count: number
): FlightListItem[] {
  if (count <= 1) return [main];

  const base =
    rows.length > 0 ? alignSegmentRowsToMain(main, rows) : [main];
  if (base.length >= count) {
    return alignSegmentRowsToMain(main, [
      main,
      ...base.filter(isSubBookingRow).slice(0, count - 1)
    ]);
  }

  const padded = [...base];
  while (padded.length < count) {
    const donor =
      [...padded].reverse().find(isSubBookingRow) ||
      padded[padded.length - 1] ||
      main;
    padded.push({
      ...donor,
      RowType: 'SubRow'
    });
  }
  return alignSegmentRowsToMain(main, padded);
}

/** Build a row array with exactly `count` entries for GuestAPI Expected-N retries. */
export function collectBookingRowsForExpectedCount(
  main: FlightListItem,
  catalog: FlightListItem[],
  count: number
): FlightListItem[] {
  if (count <= 1) return [main];

  const attempts = buildBookingRowAttempts(main, catalog);
  const exact = attempts.find((rows) => rows.length === count);
  if (exact) return exact;

  // Prefer the richest SubRow set, then trim/pad to the expected length.
  const richest = [...attempts].sort((a, b) => b.length - a.length)[0] ?? [
    main
  ];
  if (richest.length >= count) {
    return alignSegmentRowsToMain(main, [
      main,
      ...richest.filter(isSubBookingRow).slice(0, count - 1)
    ]);
  }

  // Still short — try flight-number recovery across the full catalog.
  let candidate = richest;
  if (!isRoundwayFlightItem(main) && !isMultiwayFlightItem(main)) {
    const byFn = findOnewaySubRowsByFlightNumbers(main, catalog);
    if (byFn.length + 1 >= count) {
      return alignSegmentRowsToMain(main, [
        main,
        ...byFn.slice(0, count - 1)
      ]);
    }
    if (byFn.length > 0) {
      candidate = alignSegmentRowsToMain(main, [main, ...byFn]);
    }
  }

  // NDC Qatar etc.: pad clones when catalog has fewer SubRows than Expected N.
  if (candidate.length < count) {
    return padBookingRowsToCount(main, candidate, count);
  }

  return candidate;
}

/** ContentSource / ConnectionIndex for NDC (Qatar etc.) fare hosts. */
export function isNdcContentSource(value?: string | null): boolean {
  return String(value || '').trim().toUpperCase() === 'NDC';
}

/**
 * Saudia (SV) NDC ProductID `SVp0` often crashes GuestAPI GetBookingdetails
 * with SOAP fault "Input string was not in a correct format."
 * Sibling fares (`SVp1+`) on the same itinerary fare-check successfully.
 */
export function isBrokenSaudiaNdcProductId(
  productId?: string | null
): boolean {
  const match = String(productId || '')
    .trim()
    .match(/^SVp(\d+)$/i);
  if (!match) return false;
  const n = Number(match[1]);
  return Number.isFinite(n) && n === 0;
}

/** Same oneway schedule / carrier / NDC|GDS source (cabin ProductIDs may differ). */
export function sameOnewayItinerary(
  a: FlightListItem,
  b: FlightListItem
): boolean {
  return (
    String(a.CarrierCode || '') === String(b.CarrierCode || '') &&
    String(a.FlightNumber || '') === String(b.FlightNumber || '') &&
    String(a.DepartureDate || '') === String(b.DepartureDate || '') &&
    String(a.DepartCityCode || '') === String(b.DepartCityCode || '') &&
    String(a.ArriveCityCode || '') === String(b.ArriveCityCode || '') &&
    String(a.ConnectionIndex || '') === String(b.ConnectionIndex || '')
  );
}

/**
 * When the selected NDC MainRow uses a known-broken Saudia ProductID, switch to
 * the closest bookable cabin on the same itinerary so fare check can succeed.
 */
export function resolveBookableNdcMain(
  main: FlightListItem,
  catalog: FlightListItem[]
): FlightListItem {
  if (!isNdcContentSource(String(main.ConnectionIndex || ''))) return main;
  if (!isBrokenSaudiaNdcProductId(main.ProductID as string | undefined)) {
    return main;
  }

  const targetPrice = Number(main.TotalPrice ?? main.AdultTotalFare ?? 0);
  const candidates = catalog.filter(
    (item) =>
      item.RowType === 'MainRow' &&
      sameOnewayItinerary(item, main) &&
      !isBrokenSaudiaNdcProductId(item.ProductID as string | undefined)
  );
  if (candidates.length === 0) return main;

  const sameClass = candidates.filter(
    (item) =>
      String(item.BookingClassName || '') ===
      String(main.BookingClassName || '')
  );
  const pool = sameClass.length > 0 ? sameClass : candidates;
  pool.sort((a, b) => {
    const ap = Number(a.TotalPrice ?? a.AdultTotalFare ?? 0);
    const bp = Number(b.TotalPrice ?? b.AdultTotalFare ?? 0);
    return Math.abs(ap - targetPrice) - Math.abs(bp - targetPrice);
  });
  return pool[0] || main;
}

/** NDC multi-stop (e.g. QR 3-leg): GuestAPI wants StopCount+3 rows. */
export function ndcExpectedOnewayRowCount(
  main: FlightListItem
): number | null {
  if (!isNdcContentSource(String(main.ConnectionIndex || ''))) return null;
  if (isRoundwayFlightItem(main) || isMultiwayFlightItem(main)) return null;
  const stopCount = Number(main.StopCount);
  if (!Number.isFinite(stopCount) || stopCount < 2) return null;
  return stopCount + 3;
}

function minutesBetweenDates(
  depart?: unknown,
  arrive?: unknown
): number {
  if (depart == null || arrive == null) return 0;
  const ms =
    new Date(String(arrive)).getTime() - new Date(String(depart)).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.round(ms / 60_000);
}

function parseDurationMinutes(
  value: unknown,
  depart?: unknown,
  arrive?: unknown
): number {
  const raw = String(value ?? '').trim();
  if (raw && /^\d+$/.test(raw)) {
    const n = Number(raw);
    if (n > 0) return n;
  }
  const hm = raw.match(/^0*(\d+)\s*H\s*0*(\d+)\s*M$/i);
  if (hm) {
    const mins = Number(hm[1]) * 60 + Number(hm[2]);
    if (mins > 0) return mins;
  }
  const iso = raw.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/i);
  if (iso) {
    const mins = Number(iso[1] || 0) * 60 + Number(iso[2] || 0);
    if (mins > 0) return mins;
  }
  return minutesBetweenDates(depart, arrive);
}

function formatDurationHm(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  return `${Math.floor(m / 60)}H${m % 60}M`;
}

/**
 * NDC search rows often ship TravelTime=0 / TotalDuration="00H00M".
 * Recompute from segment times so GetBookingdetails / SaveBooking stay stable.
 */
export function sanitizeNdcSegmentTiming(
  rows: FlightListItem[]
): FlightListItem[] {
  if (rows.length === 0) return rows;
  const isNdc = rows.some((row) =>
    isNdcContentSource(
      String(
        row.ConnectionIndex ||
          row.ConnectionIndexFirst ||
          row.ConnectionIndexForward ||
          ''
      )
    )
  );
  if (!isNdc) return rows;

  const next = rows.map((row) => ({ ...row }));
  const main = next.find(isMainBookingRow) || next[0];
  const subs = next.filter((row) => row !== main && isSubBookingRow(row));
  const segments = subs.length > 0 ? subs : next.filter((row) => row !== main);

  for (const segment of segments) {
    const travel = parseDurationMinutes(
      segment.TravelTime,
      segment.DepartureDate,
      segment.ArrivalDate
    );
    if (travel <= 0) continue;
    segment.TravelTime = travel;
    const td = String(segment.TotalDuration || '');
    if (!td || td === '0' || /^0+H0*M$/i.test(td)) {
      segment.TotalDuration = formatDurationHm(travel);
    }
  }

  if (main) {
    const total = parseDurationMinutes(
      main.TravelTime,
      main.DepartureDate,
      main.ArrivalDate
    );
    if (total > 0) {
      main.TravelTime = total;
      const td = String(main.TotalDuration || '');
      if (!td || td === '0' || /^0+H0*M$/i.test(td)) {
        main.TotalDuration = String(total);
      }
    }
    if (subs.length >= 2) {
      const ground = minutesBetweenDates(
        subs[0].ArrivalDate,
        subs[1].DepartureDate
      );
      if (ground > 0) {
        for (const row of next) {
          const current = Number(row.GroundTime);
          if (!Number.isFinite(current) || current <= 0) {
            row.GroundTime = ground;
          }
        }
      }
    }
  }

  return next;
}

/**
 * Collect Main+SubRows for booking, swapping broken Saudia ProductIDs and
 * padding NDC multi-stop rows to StopCount+3 when needed.
 */
export function collectBookingRowsForApi(
  main: FlightListItem,
  catalog: FlightListItem[],
  preferred?: FlightListItem[]
): { main: FlightListItem; rows: FlightListItem[] } {
  const bookableMain = resolveBookableNdcMain(main, catalog);
  const preferredMainNumber = preferred?.find(isMainBookingRow)?.MainRowNumber;
  const preferredMatchesBookable =
    preferred &&
    preferred.length > 0 &&
    preferredMainNumber != null &&
    preferredMainNumber === bookableMain.MainRowNumber;

  let rows =
    preferredMatchesBookable ?
      preferred :
      collectBookingRows(bookableMain, catalog);

  if (!rows.length) {
    rows = collectBookingRows(bookableMain, catalog);
  }

  const expected = ndcExpectedOnewayRowCount(bookableMain);
  if (expected != null && rows.length > 0 && rows.length < expected) {
    rows = padBookingRowsToCount(bookableMain, rows, expected);
  }

  return {
    main: bookableMain,
    rows: sanitizeNdcSegmentTiming(rows)
  };
}

/**
 * GuestAPI NDC SaveBooking crashes (StartIndex) when MiniFareRuleJourneyPoint
 * is malformed like " / T". Detect before/after GetBookingdetails.
 */
export function hasBrokenNdcFareRules(
  details?: FlightListItem[] | null
): boolean {
  if (!details?.length) return false;
  return details.some((row) => isBrokenMiniFareRulePoint(row));
}

function isBrokenMiniFareRulePoint(row: FlightListItem): boolean {
  for (let i = 1; i <= 8; i++) {
    const key = `MiniFareRuleJourneyPoint${i}`;
    const point = String(
      (row as FlightListItem & Record<string, unknown>)[key] ?? ''
    ).trim();
    if (!point) continue;
    // Healthy: "31AF / T060". Broken NDC: " / T" or "/ T"
    if (/^\/\s*T/i.test(point) || point === '/ T') return true;
  }
  return false;
}

/**
 * Clear / repair malformed NDC MiniFareRuleJourneyPoint* so SaveBooking
 * does not throw StartIndex / FormatException. Prefer empty over " / T".
 */
export function sanitizeNdcFareRuleFields(
  row: FlightListItem
): FlightListItem {
  const next: FlightListItem = { ...row };
  let changed = false;
  for (let i = 1; i <= 8; i++) {
    const key = `MiniFareRuleJourneyPoint${i}`;
    const point = String(
      (next as FlightListItem & Record<string, unknown>)[key] ?? ''
    ).trim();
    if (!point) continue;
    if (/^\/\s*T/i.test(point) || point === '/ T') {
      (next as FlightListItem & Record<string, unknown>)[key] = '';
      changed = true;
    }
  }
  return changed ? next : row;
}

export function sanitizeBookingRowsForSave(
  rows: FlightListItem[]
): FlightListItem[] {
  return rows.map(sanitizeNdcFareRuleFields);
}

/** How many rows GetBookingdetails expects for this selection. */
export function expectedBookingRowCount(
  main: FlightListItem,
  catalog: FlightListItem[]
): number {
  if (catalog.length === 0) return 1;
  return collectBookingRows(main, catalog).length;
}

/** Wait until MainRow + every SubRow is present before calling GetBookingdetails. */
export function isBookingPayloadReady(
  main: FlightListItem,
  rows: FlightListItem[],
  catalog: FlightListItem[]
): boolean {
  if (rows.length === 0) return false;

  if (catalog.length > 0) {
    return rows.length >= expectedBookingRowCount(main, catalog);
  }

  // Connecting fares need the full search catalog to know how many SubRows exist.
  if (isRoundwayFlightItem(main) && hasRoundwaySubRows(main, rows)) {
    return false;
  }

  if (isMultiwayFlightItem(main) && hasMultiwaySubRows(main, rows)) {
    return false;
  }

  return rows.length >= 1;
}

/** Prefer a fresh collect from search raw; fall back to the selection snapshot. */
export function resolveBookingRows(
  main: FlightListItem,
  raw: FlightListItem[],
  snapshot: FlightListItem[] = []
): FlightListItem[] {
  const fromRaw = raw.length > 0 ? collectBookingRows(main, raw) : [];
  const fromSnap =
    snapshot.length > 0 ? alignSegmentRowsToMain(main, snapshot) : [];

  const rawSubs = fromRaw.filter(isSubBookingRow).length;
  const snapSubs = fromSnap.filter(isSubBookingRow).length;

  // Cabin taps often yield MainRow-only fromRaw; keep richer SubRows from snapshot.
  if (rawSubs > 0 && rawSubs >= snapSubs) return fromRaw;
  if (snapSubs > 0) return fromSnap;
  if (fromRaw.length > 0) return fromRaw;
  return fromSnap;
}

/** True when the row carries the priced MainRow for its trip shape. */
export function isMainBookingRow(row: FlightListItem): boolean {
  return (
    row.RowType === 'MainRow' ||
    row.RowTypeFirst === 'MainRow' ||
    row.RowTypeSecond === 'MainRow' ||
    row.RowTypeThird === 'MainRow' ||
    row.RowTypeFourth === 'MainRow' ||
    row.RowTypeForward === 'MainRow' ||
    row.RowTypeReturn === 'MainRow'
  );
}

function matchesMultiwayLegMainNumbers(
  item: FlightListItem,
  main: FlightListItem
): boolean {
  if (item.MainRowNumberFirst !== main.MainRowNumberFirst) return false;

  const legPairs: [string, unknown][] = [
    ['MainRowNumberSecond', main.MainRowNumberSecond],
    ['MainRowNumberThird', main.MainRowNumberThird],
    ['MainRowNumberFourth', main.MainRowNumberFourth]
  ];

  for (const [key, expected] of legPairs) {
    if (expected == null || expected === 0) continue;
    if (item[key] !== expected) return false;
  }

  return true;
}

/** Forward leg SubRow on round-trip — keeps full fare row + pax counts (GuestAPI sample). */
export function isRoundwayForwardActiveSubRow(row: FlightListItem): boolean {
  if (row.RowTypeForward !== 'SubRow') return false;
  const flight = row.FlightNumberForward;
  return flight != null && String(flight).trim() !== '';
}

/** Return-only SubRow on round-trip — forward fields null, counts zeroed in catalog. */
export function isRoundwayReturnOnlySubRow(row: FlightListItem): boolean {
  if (row.RowTypeReturn !== 'SubRow') return false;
  const forwardFlight = row.FlightNumberForward;
  const returnFlight = row.FlightNumberReturn;
  const forwardEmpty =
    forwardFlight == null || String(forwardFlight).trim() === '';
  const returnPresent =
    returnFlight != null && String(returnFlight).trim() !== '';
  return forwardEmpty && returnPresent;
}

/**
 * Align pax counts for SaveBooking / GetBookingdetails jsonstring.
 * MainRow + roundway forward SubRows get traveller counts; other SubRows stay at 0.
 */
export function applyPassengerCountsToRows(
  rows: FlightListItem[],
  counts: PassengerCounts,
  main?: FlightListItem
): FlightListItem[] {
  const { adultCount, childrenCount, infantCount } =
    normalizePassengerCounts(counts);
  const tripMain = main ?? rows.find(isMainBookingRow) ?? rows[0];
  const isRoundway = tripMain ? isRoundwayFlightItem(tripMain) : false;

  const withCounts = {
    AdultCount: adultCount,
    ChildCount: childrenCount,
    InfantCount: infantCount
  };

  return rows.map((row) => {
    if (isMainBookingRow(row)) {
      return { ...row, ...withCounts };
    }

    if (isRoundway && isRoundwayForwardActiveSubRow(row)) {
      return { ...row, ...withCounts };
    }

    return {
      ...row,
      AdultCount: 0,
      ChildCount: 0,
      InfantCount: 0
    };
  });
}

/** Rows returned by GetBookingdetails (display only — SaveBooking uses search rows). */
export function buildSelectedRowJson(details: FlightListItem[]): string {
  if (details.length === 0) return '';
  return JSON.stringify(details);
}

/** Serialize catalog rows for GetBookingdetails / SaveBooking SelectedRowJson. */
export function serializeBookingRows(
  main: FlightListItem,
  rows: FlightListItem[],
  passengerCounts?: PassengerCounts
): string {
  if (rows.length === 0) return JSON.stringify([]);

  const counted =
    passengerCounts ?
    applyPassengerCountsToRows(rows, passengerCounts, main) :
    rows;

  const timed = sanitizeNdcSegmentTiming(counted);

  // Ensure IsLCC / ProductOfferingID / brand columns exist so GuestAPI DataTable won't throw.
  const payload =
    isMultiwayFlightItem(main) ?
    normalizeMultiwayRows(timed) :
    isRoundwayFlightItem(main) ?
    normalizeRoundwayRows(timed) :
    normalizeFlightRows(timed);

  return JSON.stringify(payload);
}

/** SelectedRowJson for SaveBooking — same shape as GetBookingdetails jsonstring. */
export function buildSaveBookingRowJson(
  main: FlightListItem,
  rows: FlightListItem[],
  passengerCounts?: PassengerCounts
): string {
  return serializeBookingRows(main, rows, passengerCounts);
}

function sortMultiwayBookingRows(rows: FlightListItem[]): FlightListItem[] {
  return [...rows].sort((a, b) => {
    const aMain =
      a.RowTypeFirst === 'MainRow' ||
      a.RowTypeSecond === 'MainRow' ||
      a.RowTypeThird === 'MainRow' ||
      a.RowTypeFourth === 'MainRow';
    const bMain =
      b.RowTypeFirst === 'MainRow' ||
      b.RowTypeSecond === 'MainRow' ||
      b.RowTypeThird === 'MainRow' ||
      b.RowTypeFourth === 'MainRow';
    if (aMain && !bMain) return -1;
    if (!aMain && bMain) return 1;
    return 0;
  });
}

function sortRoundwayBookingRows(rows: FlightListItem[]): FlightListItem[] {
  const rank = (row: FlightListItem): number => {
    if (row.RowTypeForward === 'MainRow' || row.RowTypeReturn === 'MainRow') {
      return 0;
    }
    if (row.FlightNumberForward && !row.FlightNumberReturn) return 1;
    if (!row.FlightNumberForward && row.FlightNumberReturn) return 2;
    return 3;
  };

  return [...rows].sort((a, b) => rank(a) - rank(b));
}

/** Build jsonstring — MainRow plus all SubRows for the same MainRowNumber. */
export function buildJsonBookingString(
  trip: Trip,
  allItems: FlightListItem[]
): string {
  const main = trip.apiPayload as FlightListItem | undefined;
  if (!main) {
    return JSON.stringify([]);
  }

  return serializeBookingRows(main, collectBookingRows(main, allItems), undefined);
}

function isPricingPayload(obj: Record<string, unknown>): boolean {
  return (
    obj.GrandTotal != null ||
    obj.TotalFare != null ||
    obj.AdualFare != null ||
    obj.AdualTaxFare != null
  );
}

function isBookingDetailPayload(obj: Record<string, unknown>): boolean {
  if (isPricingPayload(obj)) return false;
  return (
    obj.BookingPublishedFare != null ||
    obj.BookingOfferedFare != null ||
    obj.DepartAirportName != null ||
    (obj.FlightNumber != null && obj.CabinClassName != null) ||
    obj.RowType != null ||
    obj.RowTypeForward != null ||
    obj.RowTypeFirst != null
  );
}

function pickPrimaryBookingDetail(
  details: FlightListItem[]
): FlightBookingDetail | null {
  if (details.length === 0) return null;
  const main =
  details.find((row) => row.RowType === 'MainRow') ??
  details.find((row) => row.RowTypeForward === 'MainRow') ??
  details.find((row) => row.RowTypeFirst === 'MainRow') ??
  details[0];
  return main as FlightBookingDetail;
}

export function extractMiniFareRules(
  detail: FlightBookingDetail | null | undefined
): MiniFareRule[] {
  if (!detail) return [];
  const rules: MiniFareRule[] = [];
  for (let i = 1; i <= 4; i++) {
    const type = detail[`MiniFareRuleType${i}` as keyof FlightBookingDetail];
    const ruleDetail = detail[`MiniFareRuleDetails${i}` as keyof FlightBookingDetail];
    if (type && ruleDetail) {
      rules.push({ type: String(type), detail: String(ruleDetail) });
    }
  }
  return rules;
}

export function formatBookingRouteLabel(
  detail: FlightBookingDetail | null | undefined
): string {
  if (!detail) return '';
  const fromName =
  detail.DepartAirportName?.trim() ||
  detail.DepartCityName?.trim() ||
  detail.DepartCityCode?.trim() ||
  '';
  const toName =
  detail.ArrivalAirportName?.trim() ||
  detail.ArriveCityName?.trim() ||
  detail.ArriveCityCode?.trim() ||
  '';
  const fromCode = detail.DepartCityCode?.trim();
  const toCode = detail.ArriveCityCode?.trim();
  const from =
  fromName && fromCode && !fromName.includes(fromCode) ?
  `${fromName} (${fromCode})` :
  fromName || fromCode || '';
  const to =
  toName && toCode && !toName.includes(toCode) ?
  `${toName} (${toCode})` :
  toName || toCode || '';
  if (from && to) return `${from} → ${to}`;
  return from || to;
}

/** Cabin class label for UI — never use BookingClassName (fare bucket). */
function resolveCabinClassName(row: FlightListItem): string {
  const cabin = String(
    row.CabinClassName ??
    row.CabinClassNameForward ??
    row.CabinClassNameFirst ??
    row.CabinClassNameReturn ??
    ''
  ).trim();
  return cabin || 'Economy';
}

/** Fare bucket e.g. Q — shown as "Class Q", not as the cabin title. */
function resolveBookingClassName(row: FlightListItem): string {
  return String(
    row.BookingClassName ??
    row.BookingClassNameForward ??
    row.BookingClassNameFirst ??
    row.BookingClassNameReturn ??
    ''
  ).trim();
}

function resolveCheckedBaggageRaw(row: FlightListItem): string | undefined {
  const value =
    row.Baggage ??
    row.BaggageForward ??
    row.BaggageFirst ??
    row.BaggageReturn;
  return typeof value === 'string' ? value : undefined;
}

function resolveCabinBaggageRaw(row: FlightListItem): string | undefined {
  const value =
    row.CabinBaggage ??
    row.CabinBaggageForward ??
    row.CabinBaggageFirst ??
    row.CabinBaggageReturn;
  return typeof value === 'string' ? value : undefined;
}

/**
 * Build Select cabin cards from GetBookingdetails (+ optional search siblings).
 * Card title = CabinClassName (e.g. Economy).
 * Perk line = baggage · cabin bag · refundable · Class {BookingClassName}.
 */
function resolveRowDisplayPrice(row: {
  TotalPrice?: unknown;
  OfferedFare?: unknown;
  BookingOfferedFare?: unknown;
  BookingPublishedFare?: unknown;
}): number {
  const totalPrice = Number(row.TotalPrice) || 0;
  const offeredFare =
    Number(row.OfferedFare) || Number(row.BookingOfferedFare) || 0;
  const published = Number(row.BookingPublishedFare) || 0;
  const candidates = [totalPrice, offeredFare, published].filter((n) => n > 0);
  if (candidates.length === 0) return 0;
  // Customer-facing quote is the lowest available fare field.
  return Math.min(...candidates);
}

export function buildFlightCabinOptions(
  detail: FlightBookingDetail | null | undefined,
  details: FlightListItem[] = [],
  catalog: FlightListItem[] = [],
  selectedMain?: FlightListItem | null
): FlightCabinOption[] {
  const siblings =
    selectedMain && catalog.length > 0 ?
    collectSiblingCabinMains(selectedMain, catalog) :
    [];

  const detailMains = details.filter((row) => isMainBookingRow(row));
  // Prefer sibling MainRows from search (same flight, different fare buckets).
  // Fall back to GetBookingdetails MainRow / detail — API returns one selected cabin.
  const sourceRows =
    siblings.length > 0 ?
    siblings :
    detailMains.length > 0 ?
    detailMains :
    detail ?
    [detail] :
    details.length > 0 ?
    [details[0]] :
    [];

  const seen = new Set<string>();
  const options: FlightCabinOption[] = [];
  const prices = sourceRows.
  map((row) => resolveRowDisplayPrice(row)).
  filter((p) => p > 0);
  const basePrice = prices.length ? Math.min(...prices) : 0;

  // Fill baggage gaps on catalog siblings from the confirmed booking detail.
  const fallbackChecked =
    formatCheckedBaggage(resolveCheckedBaggageRaw(detail ?? {})) ||
    formatCheckedBaggage(resolveCheckedBaggageRaw(details[0] ?? {}));
  const fallbackCabinBag =
    formatCabinBaggage(resolveCabinBaggageRaw(detail ?? {})) ||
    formatCabinBaggage(resolveCabinBaggageRaw(details[0] ?? {}));
  const fallbackRefundable = String(
    detail?.Refundable ?? details[0]?.Refundable ?? ''
  ).trim();

  for (const row of sourceRows) {
    // Title must be cabin class (Economy), never fare bucket (Q).
    const cabin = resolveCabinClassName(row);
    const bookingClass = resolveBookingClassName(row);
    const key = `${cabin}|${bookingClass || 'base'}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const perks: string[] = [];
    const checked =
      formatCheckedBaggage(resolveCheckedBaggageRaw(row)) || fallbackChecked;
    const cabinBag =
      formatCabinBaggage(resolveCabinBaggageRaw(row)) || fallbackCabinBag;
    const refundable = String(row.Refundable ?? fallbackRefundable).trim();

    const baggageParts = [checked, cabinBag].filter(Boolean) as string[];
    const policyParts = [
      refundable || undefined,
      bookingClass ? `Class ${bookingClass}` : undefined
    ].filter(Boolean) as string[];

    if (checked) perks.push(checked);
    if (cabinBag) perks.push(cabinBag);
    if (refundable) perks.push(refundable);
    if (bookingClass) perks.push(`Class ${bookingClass}`);

    const perkLine1 = baggageParts.join(' · ');
    const perkLine2 = policyParts.join(' · ');

    const price = resolveRowDisplayPrice(row);
    const extra =
      basePrice > 0 && price > basePrice ? Math.round(price - basePrice) : 0;

    options.push({
      id: key.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: cabin,
      perk: perks.join(' · ') || 'Confirmed fare',
      perkLine1: perkLine1 || undefined,
      perkLine2: perkLine2 || undefined,
      extra,
      bookingClass: bookingClass || undefined,
      sourceRow: row,
      price: price || undefined
    });
  }

  // Keep catalog siblings even when GetBookingdetails only returns the selected fare.
  return options;
}

/** Same itinerary, different cabin/booking-class MainRows from search results. */
export function collectSiblingCabinMains(
  selected: FlightListItem,
  catalog: FlightListItem[]
): FlightListItem[] {
  const flightNo = String(
    selected.FlightNumber ??
    selected.FlightNumberForward ??
    selected.FlightNumberFirst ??
    ''
  ).trim();
  const depart = String(
    selected.DepartureDate ??
    selected.DepartureDateForward ??
    selected.DepartureDateFirst ??
    ''
  ).trim();
  const origin = String(
    selected.DepartCityCode ??
    selected.DepartCityCodeForward ??
    selected.DepartCityCodeFirst ??
    ''
  ).trim();
  const dest = String(
    selected.ArriveCityCode ??
    selected.ArriveCityCodeForward ??
    selected.ArriveCityCodeFirst ??
    ''
  ).trim();
  const carrier = String(
    selected.CarrierCode ??
    selected.CarrierCodeForward ??
    selected.CarrierCodeFirst ??
    ''
  ).trim();

  const mains = catalog.filter((item) => {
    if (!isMainBookingRow(item) && item.RowType != null) return false;
    if (item.RowType === 'SubRow') return false;
    if (item.RowTypeForward === 'SubRow') return false;
    if (item.RowTypeFirst === 'SubRow') return false;

    const itemFlight = String(
      item.FlightNumber ??
      item.FlightNumberForward ??
      item.FlightNumberFirst ??
      ''
    ).trim();
    const itemDepart = String(
      item.DepartureDate ??
      item.DepartureDateForward ??
      item.DepartureDateFirst ??
      ''
    ).trim();
    const itemOrigin = String(
      item.DepartCityCode ??
      item.DepartCityCodeForward ??
      item.DepartCityCodeFirst ??
      ''
    ).trim();
    const itemDest = String(
      item.ArriveCityCode ??
      item.ArriveCityCodeForward ??
      item.ArriveCityCodeFirst ??
      ''
    ).trim();
    const itemCarrier = String(
      item.CarrierCode ??
      item.CarrierCodeForward ??
      item.CarrierCodeFirst ??
      ''
    ).trim();

    if (flightNo && itemFlight && itemFlight !== flightNo) return false;
    if (depart && itemDepart && itemDepart !== depart) return false;
    if (origin && itemOrigin && itemOrigin !== origin) return false;
    if (dest && itemDest && itemDest !== dest) return false;
    if (carrier && itemCarrier && itemCarrier !== carrier) return false;

    // Prefer CabinClassName (Economy) — BookingClassName alone is only a fare bucket.
    const hasCabin = !!(
      item.CabinClassName ||
      item.CabinClassNameForward ||
      item.CabinClassNameFirst ||
      item.CabinClassNameReturn
    );
    return hasCabin || item === selected || isMainBookingRow(item);
  });

  if (mains.length === 0 && isMainBookingRow(selected)) return [selected];
  if (mains.length === 0) return [selected];

  // Prefer MainRow-typed rows; keep selected first
  const sorted = [...mains].sort((a, b) => {
    const aMain = isMainBookingRow(a) ? 0 : 1;
    const bMain = isMainBookingRow(b) ? 0 : 1;
    if (aMain !== bMain) return aMain - bMain;
    const aPrice = resolveRowDisplayPrice(a);
    const bPrice = resolveRowDisplayPrice(b);
    return aPrice - bPrice;
  });

  return sorted;
}

export function parseFlightBookingResponse(
  strings: string[]
): FlightBookingResult {
  let details: FlightListItem[] = [];
  let bookingDetail: FlightBookingDetail | null = null;
  let pricing: FlightBookingPricing | null = null;
  let fareRulesHtml: string | undefined;
  let apiMessage: string | undefined;

  for (const entry of strings) {
    if (!entry || entry === '[]') continue;

    const trimmed = entry.trim();
    if (trimmed.startsWith('<')) {
      fareRulesHtml = trimmed;
      continue;
    }

    if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
      const msg = trimmed;
      if (msg && msg.toLowerCase() !== 'no error') {
        apiMessage = msg;
      }
      continue;
    }

    try {
      const parsed = JSON.parse(trimmed) as
        | Record<string, unknown>
        | Record<string, unknown>[];
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const first = list[0];
      if (!first) continue;

      if (isPricingPayload(first)) {
        pricing = first as unknown as FlightBookingPricing;
        continue;
      }

      if (isBookingDetailPayload(first)) {
        if (Array.isArray(parsed)) {
          details = list as FlightListItem[];
        } else {
          bookingDetail = parsed as FlightBookingDetail;
          details = [parsed as FlightListItem];
        }
      }
    } catch {
      // skip malformed entries
    }
  }

  if (!bookingDetail) {
    bookingDetail = pickPrimaryBookingDetail(details);
  }

  return {
    details,
    bookingDetail,
    pricing,
    fareRulesHtml,
    apiMessage:
    bookingDetail || details.length > 0 || pricing ? undefined : apiMessage
  };
}
