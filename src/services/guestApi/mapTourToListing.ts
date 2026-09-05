import { KTA } from '../../components/travel/ethioTravelData';

/** Raw row from TourGetList `Table` (plus legacy Hotelbeds-style fields). */
export type TourListItem = {
  TourId?: number | string;
  TourPackage?: string;
  Destination?: string;
  Duration?: string;
  MaximumPersons?: string | number;
  Reviewcount?: number | string;
  StarCount?: number | string;
  TripCost?: number | string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  image6?: string;
  code?: string;
  activityCode?: string;
  name?: string;
  type?: string;
  countryCode?: string;
  countryname?: string;
  source?: string;
  currency?: string;
  currencyName?: string;
  order?: string;
  CategoryId?: number | string;
  PackageCategoryId?: number | string;
  amount?: string;
  destinationcode?: string;
  destinationname?: string;
  travelpolicy?: string;
  featuresInclusion?: string;
  guidingOptions?: string;
  durationmetric?: string;
  durationvalue?: string;
  defaultCurrency?: string;
  defaultCurrencyvalue?: string;
  sightSeeingMarkup?: string;
  [key: string]: unknown;
};

export type TourActivity = {
  id: string;
  code: string;
  name: string;
  location: string;
  destinationCode: string;
  duration: string;
  price: number;
  currency: string;
  image?: string;
  /** One absolute URL per API image field (image1…image6). */
  images: string[];
  guide: string;
  inclusionsHtml: string;
  inclusions: string[];
  type: string;
  category: string;
  /** GuestAPI TourCaregories id when present on list/detail rows. */
  categoryId?: number;
  country: string;
  stars?: number;
  reviewCount?: number;
  maxPersons?: string;
  apiPayload?: TourListItem;
};

const TOUR_COLORS = [KTA.blue, KTA.navy, '#0D9488', '#F97316', '#2563eb'];

/**
 * Host that actually serves GuestAPI relative tour images
 * (`../Images/Tour/...` → `/Images/Tour/...`).
 * `apitravel.afonestop.com/Images/...` returns 404.
 */
export const TOUR_IMAGE_ORIGIN = 'https://travel.afonestop.com';

export const TOUR_DESTINATION_RESULTS = [
  {
    name: 'Dubai',
    detail: 'United Arab Emirates · DXB',
    kind: 'airport' as const,
    code: 'DXB',
    icon: '🏖️' as const
  },
  {
    name: 'Abu Dhabi',
    detail: 'United Arab Emirates · AUH',
    kind: 'airport' as const,
    code: 'AUH',
    icon: '🕌' as const
  },
  {
    name: 'Singapore',
    detail: 'Singapore · SIN',
    kind: 'airport' as const,
    code: 'SIN',
    icon: '🏙️' as const
  }
];

function stripHtml(html: string): string[] {
  if (!html?.trim()) return [];
  const text = html.
  replace(/<br\s*\/?>/gi, '\n').
  replace(/<\/(?:span|div|p|li)>/gi, '\n').
  replace(/<[^>]+>/g, ' ').
  replace(/&nbsp;/gi, ' ').
  replace(/&amp;/gi, '&').
  replace(/&lt;/gi, '<').
  replace(/&gt;/gi, '>').
  replace(/&quot;/gi, '"');
  return text.
  split(/\n+/).
  map((line) => line.replace(/\s+/g, ' ').trim()).
  filter(Boolean);
}

function mapCurrency(code?: string, preferred?: string): string {
  const c = String(code || preferred || 'ETB')
    .trim()
    .toUpperCase();
  return /^[A-Z]{3}$/.test(c) ? c : 'ETB';
}

function formatDuration(value?: string, metric?: string): string {
  const n = Number(value) || 0;
  const m = (metric || 'DAYS').toUpperCase();
  if (m.includes('HOUR')) return n === 1 ? '1 hour' : `${n} hours`;
  if (m.includes('DAY')) return n === 1 ? '1 day' : `${n} days`;
  if (n > 0) return `${n} ${m.toLowerCase()}`;
  return '1 day';
}

/**
 * `../Images/Tour/Tour_image11215.jpg` → `/Images/Tour/Tour_image11215.jpg`
 */
export function normalizeTourImagePath(path?: string | null): string | undefined {
  if (!path?.trim()) return undefined;
  const raw = path.trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  const cleaned = raw.
  replace(/\\/g, '/').
  replace(/^(?:\.\.\/)+/, '/').
  replace(/^\.\//, '/');
  if (!cleaned || cleaned === '/') return undefined;
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

/**
 * Build loadable URL candidates for one GuestAPI image path.
 * - Dev web: same-origin Vite proxy (avoids CORP blocking + CF quirks)
 * - Native/prod: absolute travel portal URL (loaded via CapacitorHttp)
 */
export function resolveTourImageCandidates(path?: string | null): string[] {
  const normalized = normalizeTourImagePath(path);
  if (!normalized) return [];
  if (/^https?:\/\//i.test(normalized)) return [normalized];
  if (!/\/images\//i.test(normalized)) return [];

  const absolute = `${TOUR_IMAGE_ORIGIN}${normalized}`;
  if (import.meta.env.DEV) {
    return [`/api/tour-images${normalized}`];
  }
  return [absolute];
}

/** First candidate URL for one GuestAPI image path. */
export function resolveTourImageUrl(path?: string | null): string | undefined {
  return resolveTourImageCandidates(path)[0];
}

/** Only API-sourced image1…image20 / imgUrl paths (no stock fillers). */
export function collectTourImageUrls(item: TourListItem): string[] {
  const out: string[] = [];
  const push = (url?: string) => {
    if (url && !out.includes(url)) out.push(url);
  };

  for (let i = 1; i <= 20; i++) {
    const key = `image${i}`;
    const value = item[key];
    if (typeof value !== 'string' || !value.trim()) continue;
    for (const url of resolveTourImageCandidates(value)) push(url);
  }
  for (const url of resolveTourImageCandidates(item.imgUrl)) push(url);

  return out;
}

export function mapTourItemToActivity(
  item: TourListItem,
  index: number,
  defaultCurrency = 'ETB'
): TourActivity {
  const code = String(
    item.TourId ?? item.activityCode ?? item.code ?? `tour-${index}`
  );
  const price =
    Number(
      String(item.TripCost ?? item.amount ?? '0').replace(/,/g, '')
    ) || 0;
  const inclusionsHtml = String(item.featuresInclusion || '');
  const stars = Number(item.StarCount) || undefined;
  const reviewCount = Number(item.Reviewcount) || undefined;
  const maxPersons = item.MaximumPersons != null ?
    String(item.MaximumPersons).trim() :
    '';
  const duration =
    item.Duration?.trim() ||
    formatDuration(item.durationvalue, item.durationmetric);
  const destination = String(
    item.Destination || item.destinationname || item.destinationcode || '—'
  ).trim();
  const images = collectTourImageUrls(item);
  const categoryIdRaw = item.CategoryId ?? item.PackageCategoryId;
  const categoryId =
    categoryIdRaw != null && String(categoryIdRaw).trim() !== '' ?
      Number(categoryIdRaw) :
      undefined;

  return {
    id: code,
    code,
    name: String(item.TourPackage || item.name || 'Tour activity').trim(),
    location: destination || '—',
    destinationCode: String(item.destinationcode || ''),
    duration,
    price,
    currency: mapCurrency(
      defaultCurrency,
      item.currency || item.defaultCurrency
    ),
    image: images[0],
    images,
    guide: maxPersons ? `Up to ${maxPersons} guests` : 'Guide info unavailable',
    inclusionsHtml,
    inclusions: stripHtml(inclusionsHtml),
    type: String(item.type || 'PACKAGE'),
    category: String(
      item.activityFactsheetType ||
      (stars ? `${stars} Star` : 'TOUR PACKAGE')
    ),
    categoryId: Number.isFinite(categoryId) ? categoryId : undefined,
    country: String(item.countryname || item.countryCode || ''),
    stars,
    reviewCount,
    maxPersons: maxPersons || undefined,
    apiPayload: item
  };
}

export function tourCardColor(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TOUR_COLORS[Math.abs(hash) % TOUR_COLORS.length];
}

/** Short label for TourCaregories names, e.g. "Domestic Tour Package" → "Domestic". */
export function shortTourCategoryLabel(name: string): string {
  return (
    name.
      replace(/\btour package\b/gi, '').
      replace(/\s+/g, ' ').
      trim() || name.trim()
  );
}

/**
 * DestinationName for TourGetList — city name ("Dubai"), not IATA ("DXB").
 */
export function extractTourDestinationName(label: string): string {
  const trimmed = label.trim();
  if (!trimmed || trimmed === 'Where to?') return '';

  const withCode = trimmed.match(/^(.+?)\s*\(([A-Z]{3})\)\s*$/i);
  if (withCode) {
    const namePart = withCode[1].trim();
    const codePart = withCode[2].toUpperCase();
    const known = TOUR_DESTINATION_RESULTS.find(
      (d) =>
      d.code === codePart ||
      d.name.toLowerCase() === namePart.toLowerCase()
    );
    return known?.name ?? namePart;
  }

  if (/^[A-Z]{3}$/i.test(trimmed)) {
    const known = TOUR_DESTINATION_RESULTS.find(
      (d) => d.code.toLowerCase() === trimmed.toLowerCase()
    );
    return known?.name ?? '';
  }

  const known = TOUR_DESTINATION_RESULTS.find(
    (d) =>
    d.name.toLowerCase() === trimmed.toLowerCase() ||
    d.name.toLowerCase().startsWith(trimmed.toLowerCase())
  );
  return known?.name ?? trimmed;
}

/** @deprecated Prefer extractTourDestinationName */
export function extractTourDestinationCode(label: string): string {
  const name = extractTourDestinationName(label);
  if (!name) return '';
  const known = TOUR_DESTINATION_RESULTS.find(
    (d) => d.name.toLowerCase() === name.toLowerCase()
  );
  return known?.code ?? '';
}
