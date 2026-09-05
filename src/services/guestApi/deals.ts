import { callGuestApi } from './soapClient';
import { parseJsonStringEntries } from './parseJsonStrings';

const DEAL_IMAGE_ORIGIN = 'https://travel.afonestop.com';

export type FlightDeal = {
  from: string;
  to: string;
  /** Display price e.g. "ETB 169,050". */
  price: string;
  route: string;
};

export type HotelDeal = {
  id: string;
  name: string;
  location: string;
  country: string;
  rating: number;
  /** Raw API rating e.g. "9.2/10". */
  ratingLabel: string;
  reviews: string;
  stars: string;
  address: string;
  image: string;
  /** Discount text e.g. "Save 3%", or empty. */
  discount: string;
};

export type TourActivityDeal = {
  id: string;
  name: string;
  destination: string;
  duration: string;
  price: string;
  image: string;
};

export type TopDestinationDeal = {
  id: string;
  destination: string;
  price: string;
  image: string;
};

type FlightDealRow = {
  From?: string;
  To?: string;
  Price?: string;
};

type HotelDealRow = {
  HotelName?: string;
  Location?: string;
  Country?: string;
  Rating?: string;
  Reviews?: string;
  Stars?: string;
  Address?: string;
  ImageUrl?: string;
  Discount?: string;
};

type TourActivityRow = {
  TourPackage?: string;
  Destination?: string;
  Image?: string;
  Duration?: string;
  TripCost?: string;
};

type TopDestinationRow = {
  Destination?: string;
  Image?: string;
  TripCost?: string;
};

/** Format "ETB 169050" → "ETB 169,050". */
export function formatDealPrice(raw: string): string {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^([A-Za-z]{3})\s*([\d,.]+)$/);
  if (!match) return trimmed;
  const code = match[1].toUpperCase();
  const digits = match[2].replace(/,/g, '');
  const n = Number(digits);
  if (!Number.isFinite(n)) return trimmed;
  return `${code} ${n.toLocaleString('en-US', {
    maximumFractionDigits: n % 1 === 0 ? 0 : 2
  })}`;
}

/** Format TripCost "75000.00" → "ETB 75,000". */
export function formatTripCost(raw: string): string {
  const n = Number(String(raw || '').replace(/,/g, '').trim());
  if (!Number.isFinite(n) || n <= 0) return '';
  return `ETB ${n.toLocaleString('en-US', {
    maximumFractionDigits: n % 1 === 0 ? 0 : 2
  })}`;
}

/**
 * Absolute image URL for deal cards.
 * Handles full URLs (incl. spaces) and relative paths like ../Images/Tour/...
 */
export function resolveDealImageUrl(raw: string): string {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return encodeURI(trimmed);
    } catch {
      return trimmed.replace(/ /g, '%20');
    }
  }
  const cleaned = trimmed.replace(/^\.\.\//, '').replace(/^\//, '');
  try {
    return encodeURI(`${DEAL_IMAGE_ORIGIN}/${cleaned}`);
  } catch {
    return `${DEAL_IMAGE_ORIGIN}/${cleaned.replace(/ /g, '%20')}`;
  }
}

function parseRatingScore(raw: string): number {
  const text = String(raw || '').trim();
  const beforeSlash = text.split('/')[0]?.trim() ?? '';
  const n = Number(beforeSlash);
  if (Number.isFinite(n) && n > 0) return n;
  const any = text.match(/(\d+(?:\.\d+)?)/);
  return any ? Number(any[1]) : 0;
}

export function parseFlightDeals(strings: string[]): FlightDeal[] {
  const rows = parseJsonStringEntries<FlightDealRow>(strings);
  const deals: FlightDeal[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const from = String(row.From || '')
      .trim()
      .toUpperCase();
    const to = String(row.To || '')
      .trim()
      .toUpperCase();
    const price = formatDealPrice(String(row.Price || ''));
    if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) continue;
    const key = `${from}-${to}-${price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deals.push({
      from,
      to,
      price: price || '—',
      route: `${from} - ${to}`
    });
  }

  return deals;
}

export function parseHotelDeals(strings: string[]): HotelDeal[] {
  const rows = parseJsonStringEntries<HotelDealRow>(strings);
  const deals: HotelDeal[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const name = String(row.HotelName || '').trim();
    if (!name) continue;
    const location = String(row.Location || '').trim();
    const country = String(row.Country || '').trim();
    const image = resolveDealImageUrl(String(row.ImageUrl || ''));
    const discount = String(row.Discount || '').trim();
    const ratingLabel = String(row.Rating || '').trim();
    const key = `${name}|${location}|${image}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deals.push({
      id: key,
      name,
      location: location || country || '—',
      country,
      rating: parseRatingScore(ratingLabel),
      ratingLabel: ratingLabel || (parseRatingScore(ratingLabel) ? String(parseRatingScore(ratingLabel)) : ''),
      reviews: String(row.Reviews || '').trim(),
      stars: String(row.Stars || '').trim(),
      address: String(row.Address || '').trim(),
      image,
      discount
    });
  }

  return deals;
}

export function parseTourActivities(strings: string[]): TourActivityDeal[] {
  const rows = parseJsonStringEntries<TourActivityRow>(strings);
  const deals: TourActivityDeal[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const name = String(row.TourPackage || '').trim();
    if (!name) continue;
    const destination = String(row.Destination || '').trim();
    const duration = String(row.Duration || '').trim();
    const price = formatTripCost(String(row.TripCost || ''));
    const image = resolveDealImageUrl(String(row.Image || ''));
    const key = `${name}|${destination}|${duration}|${price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deals.push({
      id: key,
      name,
      destination: destination || '—',
      duration: duration || '—',
      price: price || '—',
      image
    });
  }

  return deals;
}

export function parseTopDestinations(strings: string[]): TopDestinationDeal[] {
  const rows = parseJsonStringEntries<TopDestinationRow>(strings);
  const deals: TopDestinationDeal[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const destination = String(row.Destination || '').trim();
    if (!destination) continue;
    const price = formatTripCost(String(row.TripCost || ''));
    const image = resolveDealImageUrl(String(row.Image || ''));
    // Dedupe repeated Dubai rows — keep the first occurrence.
    const dedupeKey = destination.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    deals.push({
      id: `${destination}|${price}|${image}`,
      destination,
      price: price ? `From ${price}` : '—',
      image
    });
  }

  return deals;
}

async function fetchDealStrings(operation: string): Promise<string[]> {
  return callGuestApi(operation, [], {
    maxRetries: 1,
    timeoutMs: 20_000
  });
}

/** FlightDeals — home “Best Flight Deals”. */
export async function getFlightDeals(): Promise<FlightDeal[]> {
  return parseFlightDeals(await fetchDealStrings('FlightDeals'));
}

/** HotelDeals — home “Hotel Deals”. */
export async function getHotelDeals(): Promise<HotelDeal[]> {
  return parseHotelDeals(await fetchDealStrings('HotelDeals'));
}

/** ToursandActivities — home “Tours & Activities”. */
export async function getToursAndActivities(): Promise<TourActivityDeal[]> {
  return parseTourActivities(await fetchDealStrings('ToursandActivities'));
}

/** TopDestinations — home “Top Destinations”. */
export async function getTopDestinations(): Promise<TopDestinationDeal[]> {
  return parseTopDestinations(await fetchDealStrings('TopDestinations'));
}
