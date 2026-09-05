/**
 * Bus1 ShowPrice is usually already in the UI currency when Currencyrate is real.
 * Bus2/Bus3 SeatFare / confirmedPrice (and list ShowPrice when rate was skipped)
 * can still be source ETB. Normalize so we never label ETB 5600 as "EUR 5,600".
 */
export function toBusDisplayAmount(
  amount: number | null | undefined,
  opts: {
    referenceDisplayAmount?: number | null;
    displayCurrency?: string | null;
    rate?: number | null;
    /**
     * When true (ShowPrice still equals BasePrice / rate never applied),
     * treat `amount` as ETB and multiply by rate.
     */
    forceFromEtb?: boolean;
  }
): number {
  const raw = Number(amount);
  const ref = Number(opts.referenceDisplayAmount);
  const hasRef = Number.isFinite(ref) && ref > 0;
  if (!Number.isFinite(raw) || raw <= 0) {
    return hasRef ? ref : 0;
  }

  const code = String(opts.displayCurrency || 'ETB')
    .trim()
    .toUpperCase();
  if (code === 'ETB') {
    return hasRef ? coalesceBusFare(raw, ref) : raw;
  }

  const rate = Number(opts.rate);
  const canConvert = Number.isFinite(rate) && rate > 0 && rate !== 1;
  if (!canConvert) {
    return hasRef ? ref : raw;
  }

  const converted = raw * rate;
  if (opts.forceFromEtb) return converted;

  if (hasRef) {
    const errRaw = Math.abs(raw - ref) / ref;
    const errConv = Math.abs(converted - ref) / ref;
    return errConv < errRaw ? converted : raw;
  }
  return converted;
}

/** Per-seat list fare already in UI currency × seat count. */
export function busListFareTotal(
  unitListFare: number | null | undefined,
  seatCount: number
): number {
  const unit = Number(unitListFare);
  const n = Math.max(0, Math.floor(Number(seatCount) || 0));
  if (!Number.isFinite(unit) || unit <= 0 || n <= 0) return 0;
  return unit * n;
}

const BUS_FARE_KEYS = [
  'ShowPrice',
  'PublishedPrice',
  'PublishedPriceRoundedOff',
  'OfferedPrice',
  'OfferedPriceRoundedOff',
  'BasePrice',
  'Fare',
  'TicketFare',
  'TotalFare',
  'NetFare',
  'Price',
  'Amount',
  'SeatFare'
];

/**
 * Bus rows mix source INR (`BasePrice` 50) with ETB display (`ShowPrice` 5095).
 * Prefer the real ticket amount so list, journey sheet, and Pay now match.
 */
export function resolveBusTicketFare(
  row: Record<string, unknown> | null | undefined
): number {
  if (!row || typeof row !== 'object') return 0;
  const amounts: number[] = [];
  for (const key of BUS_FARE_KEYS) {
    const value = pickPayloadNumber(row, [key]);
    if (value > 0) amounts.push(value);
  }
  if (amounts.length === 0) return 0;

  const max = Math.max(...amounts);
  const min = Math.min(...amounts);
  if (max >= min * 4) return max;

  const show = pickPayloadNumber(row, ['ShowPrice']);
  const base = pickPayloadNumber(row, ['BasePrice', 'PublishedPrice']);
  const amount = show || base || max;
  const conversion = Number(row.ConversionRate ?? row.conversionRate ?? 1);
  const source = String(
    row.APICurrency ?? row.DefaultCurrency ?? row.CurrencyCode ?? ''
  )
    .trim()
    .toUpperCase();
  const showCur = String(row.ShowCurrency ?? row.CurrencyCode ?? '')
    .trim()
    .toUpperCase();
  const unconverted =
    Number.isFinite(conversion) &&
    conversion > 1.05 &&
    source !== 'ETB' &&
    showCur !== 'ETB' &&
    (show <= 0 ||
      base <= 0 ||
      Math.abs(show - base) / Math.max(show, base) < 0.05);
  if (unconverted) {
    return Math.round(amount * conversion * 100) / 100;
  }
  return amount;
}

/** When one fare is a leftover source amount (50) and the other is ETB (5095), keep 5095. */
export function coalesceBusFare(
  primary: number | null | undefined,
  fallback: number | null | undefined
): number {
  const a = Number(primary);
  const b = Number(fallback);
  const left = Number.isFinite(a) && a > 0 ? a : 0;
  const right = Number.isFinite(b) && b > 0 ? b : 0;
  if (!left) return right;
  if (!right) return left;
  const high = Math.max(left, right);
  const low = Math.min(left, right);
  if (high >= low * 4) return high;
  return left;
}

function pickPayloadNumber(
  row: Record<string, unknown>,
  keys: string[]
): number {
  for (const key of keys) {
    const value = Number(
      String(row[key] ?? '')
        .replace(/,/g, '')
        .trim()
    );
    if (Number.isFinite(value) && value > 0) return value;
  }
  return 0;
}

/**
 * True when list fare was never converted (ShowPrice still equals BasePrice)
 * while the UI currency is not ETB.
 */
export function busFareLikelyUnconvertedEtb(
  apiPayload: unknown,
  displayCurrency?: string | null
): boolean {
  const code = String(displayCurrency || 'ETB')
    .trim()
    .toUpperCase();
  if (code === 'ETB') return false;
  if (!apiPayload || typeof apiPayload !== 'object') return false;
  const row = apiPayload as Record<string, unknown>;
  const base = pickPayloadNumber(row, [
    'BasePrice',
    'PublishedPrice',
    'OfferedPrice',
    'Fare'
  ]);
  const show = pickPayloadNumber(row, ['ShowPrice', 'showPrice']);
  if (base > 0 && show > 0) {
    return Math.abs(base - show) / base < 0.02;
  }
  const conversion = Number(row.ConversionRate ?? row.conversionRate);
  return Number.isFinite(conversion) && conversion === 1;
}
