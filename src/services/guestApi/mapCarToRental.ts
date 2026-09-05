import { KTA, CarRental } from '../../components/travel/ethioTravelData';

export type CarListItem = Record<string, unknown>;

const SUPPLIER_COLORS = [KTA.blue, KTA.navy, '#2563eb', '#14B8A6', '#dc2626'];

function pickString(item: CarListItem, keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function supplierColor(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SUPPLIER_COLORS[Math.abs(hash) % SUPPLIER_COLORS.length];
}

function parseRate(
  visitorsRate: string
): { price: number; currency: string } {
  const match = visitorsRate.match(/([A-Z]{3})\s*([\d,.]+)/i);
  if (!match) return { price: 0, currency: 'USD' };

  const code = match[1].toUpperCase();
  const price = Number(match[2].replace(/,/g, ''));

  return {
    price: Number.isNaN(price) ? 0 : price,
    currency: /^[A-Z]{3}$/.test(code) ? code : 'USD'
  };
}

const CATEGORY_IMAGES: Record<string, string> = {
  Car: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600&q=80',
  SUV: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80',
  Van: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80'
};

export function mapCarItemToRental(
  item: CarListItem,
  index: number,
  preferredCurrency?: string
): CarRental {
  const vehicleMake = pickString(item, ['VehicleMake', 'vehicleMake']) || 'Vehicle';
  const vehicleClass = pickString(item, ['VehicleClassName', 'vehicleClassName']);
  const category = pickString(item, ['Category', 'category']) || 'Car';
  const vendorCode = pickString(item, ['VendorCode', 'vendorCode']) || 'Rental';
  const transmissionRaw = pickString(item, ['TransmissionType', 'transmissionType']);
  const transmission: CarRental['transmission'] =
  transmissionRaw.toLowerCase().includes('auto') ? 'Auto' : 'Manual';
  const visitorsRate = pickString(item, ['VisitorsRate', 'visitorsRate']);
  const { price, currency: parsedCurrency } = parseRate(visitorsRate);
  const preferred = String(preferredCurrency || '')
    .trim()
    .toUpperCase();
  const currency =
    /^[A-Z]{3}$/.test(preferred) ? preferred :
    parsedCurrency;
  const seats = Number(item.Seats ?? item.seats ?? 5) || 5;
  const availability = pickString(item, ['RateAvailability', 'rateAvailability']);
  const location = pickString(item, ['Location', 'location']);
  const rowNum = pickString(item, ['RowNum', 'rowNum']);
  const traceId = pickString(item, ['TraceId', 'traceId']);

  const tags = [
  availability || 'Available',
  transmission === 'Auto' ? 'Automatic' : 'Manual',
  pickString(item, ['RatePeriod', 'ratePeriod']) || 'Daily'].
  filter(Boolean);

  return {
    id: rowNum ? `car-${rowNum}` : traceId ? `car-${traceId}-${index}` : `car-${index}`,
    name: vehicleMake,
    type: vehicleClass ? `${category} · ${vehicleClass}` : category,
    seats,
    transmission,
    pricePerDay: price,
    currency,
    supplier: vendorCode,
    color: supplierColor(vendorCode),
    image:
    pickString(item, ['ImageUrl', 'imageUrl']) ||
    CATEGORY_IMAGES[category] ||
    CATEGORY_IMAGES.Car,
    tags,
    apiPayload: item
  };
}

export const SUPPORTED_CAR_LOCATIONS = ['Dubai', 'Abu Dhabi'] as const;

/** Pickup options shown in the car-rental city picker. */
export const CAR_RENTAL_CITY_RESULTS = [
  {
    name: 'Dubai',
    detail: 'United Arab Emirates · DXB',
    kind: 'airport' as const,
    code: 'DXB'
  },
  {
    name: 'Abu Dhabi',
    detail: 'United Arab Emirates · AUH',
    kind: 'airport' as const,
    code: 'AUH'
  }
];

/** Map UI city labels to API pickup/return location names. */
export function normalizeCarLocation(location: string): string {
  const stripped = location.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const lower = stripped.toLowerCase();
  if (lower.includes('dubai')) return 'Dubai';
  if (lower.includes('abu dhabi')) return 'Abu Dhabi';
  return stripped;
}

export function isCarLocationSupported(location: string): boolean {
  const normalized = normalizeCarLocation(location);
  return SUPPORTED_CAR_LOCATIONS.some(
    (loc) => loc.toLowerCase() === normalized.toLowerCase()
  );
}

/** True for Car1_List fallback rows — they must not be sent to Car2/Car_Booking. */
export function isCarDemoItem(car: CarRental | CarListItem): boolean {
  const api = (
    'apiPayload' in car && car.apiPayload ?
      car.apiPayload :
      car
  ) as CarListItem;
  const token = String(api.RateToken ?? api.rateToken ?? '').trim().toUpperCase();
  const traceId = String(api.TraceId ?? api.traceId ?? '').trim().toLowerCase();
  return token === 'DEMO' || traceId.startsWith('car-fallback');
}

/** Shown when Car1_List is down and sample inventory is displayed. */
export const CAR_SAMPLE_BOOKING_NOTICE =
  'Live car rates are temporarily unavailable. You can complete a demo booking with sample pricing.';

/** @deprecated Use CAR_SAMPLE_BOOKING_NOTICE */
export const CAR_SAMPLE_ONLY_MESSAGE = CAR_SAMPLE_BOOKING_NOTICE;

export function currencyForLocation(location: string): {
  code: string;
  defaultValue: number;
} {
  const loc = location.toLowerCase();
  if (loc.includes('dubai') || loc.includes('uae') || loc.includes('abu dhabi')) {
    return { code: 'AED', defaultValue: 1 };
  }
  if (
    loc.includes('ethiopia') ||
    loc.includes('addis') ||
    loc.includes('bahir') ||
    loc.includes('hawassa')
  ) {
    return { code: 'ETB', defaultValue: 1 };
  }
  return { code: 'USD', defaultValue: 1 };
}
