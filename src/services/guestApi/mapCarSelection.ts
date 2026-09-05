import { CarRental } from '../../components/travel/ethioTravelData';

/** Car2_SelecCar session currency (per GuestAPI spec). */
export const CAR_SELECT_DEFAULT_CURRENCY = 'ETB';
export const CAR_SELECT_DEFAULT_MARKUP = 1;

export type CarSelectContext = {
  pickupDate?: string;
  pickupTime?: string;
  returnDate?: string;
  returnTime?: string;
  pickupLocation?: string;
  returnLocation?: string;
};

export type CarPricing = {
  ShowCurrency: string;
  BaseAmount: string;
  Tax: string;
  TotalFare: string;
  GSTType: string;
  TotalGST: string;
  ConvenienceFees: string;
  GrandTotal: string;
};

export type CarSelectResult = {
  car: Record<string, unknown> | null;
  pricing: CarPricing | null;
  apiMessage?: string;
};

/** GuestAPI car datetimes use US-style `M/D/YYYY h:mm:ss AM/PM`. */
export function formatCarApiDateTime(dateDdMmYyyy: string, time: string): string {
  const [dd, mm, yyyy] = dateDdMmYyyy.split('/').map(Number);
  const [hh, min] = time.split(':').map(Number);
  const hours = hh % 12 || 12;
  const ampm = hh >= 12 ? 'PM' : 'AM';
  return `${mm}/${dd}/${yyyy} ${hours}:${String(min).padStart(2, '0')}:00 ${ampm}`;
}

/** Map city labels to airport codes expected by Car2/Car_Booking. */
export function normalizeCarApiLocationCode(location: string): string {
  const stripped = location.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const lower = stripped.toLowerCase();
  if (lower.includes('dubai')) return 'DXB';
  if (lower.includes('abu dhabi')) return 'AUH';
  return stripped;
}

function pickVisitorsRate(car: CarRental): string | null {
  const api = car.apiPayload as Record<string, unknown> | undefined;
  const raw = api?.VisitorsRate ?? api?.visitorsRate;
  if (raw == null) return null;
  const value = String(raw).trim();
  return value || null;
}

/** Estimate pricing from Car1 VisitorsRate when Car2 is unavailable. */
export function estimateCarPricingFromRental(
  car: CarRental,
  currency = CAR_SELECT_DEFAULT_CURRENCY
): CarPricing | null {
  const rateStr =
    pickVisitorsRate(car) ?? `${car.currency} ${car.pricePerDay}`;
  const match = rateStr.match(/([A-Z]{3})\s*([\d,.]+)/i);
  if (!match) return null;

  const amount = match[2].replace(/,/g, '');
  const showCurrency = currency || match[1].toUpperCase();
  return {
    ShowCurrency: showCurrency,
    BaseAmount: amount,
    Tax: '0.00',
    TotalFare: amount,
    GSTType: '',
    TotalGST: '0.00',
    ConvenienceFees: '0.00',
    GrandTotal: amount
  };
}

/** Scale a daily VisitorsRate estimate across the full rental period. */
export function estimateCarPricingForRental(
  car: CarRental,
  rentalDays: number,
  currency?: string
): CarPricing | null {
  const daily = estimateCarPricingFromRental(
    car,
    currency ?? car.currency ?? CAR_SELECT_DEFAULT_CURRENCY
  );
  if (!daily) return null;

  const days = Math.max(1, rentalDays);
  const total = (Number(daily.GrandTotal) * days).toFixed(2);
  return {
    ...daily,
    BaseAmount: total,
    TotalFare: total,
    GrandTotal: total
  };
}

/** Build JsonSelectCar payload — preserve Car1 row; only fill missing fields. */
export function buildJsonSelectCar(
  car: CarRental,
  context?: CarSelectContext
): string {
  const payload: Record<string, unknown> = car.apiPayload ?
    { ...(car.apiPayload as Record<string, unknown>) } :
    {
      VendorCode: car.supplier,
      VehicleMake: car.name,
      VehicleClassName: car.type,
      VisitorsRate: `${car.currency} ${car.pricePerDay}`,
      RowNum: car.id.replace('car-', '')
    };

  if (payload.PickupLocation) {
    payload.PickupLocation = normalizeCarApiLocationCode(
      String(payload.PickupLocation)
    );
  } else if (context?.pickupLocation) {
    payload.PickupLocation = normalizeCarApiLocationCode(
      context.pickupLocation
    );
  }

  if (payload.ReturnLocation) {
    payload.ReturnLocation = normalizeCarApiLocationCode(
      String(payload.ReturnLocation)
    );
  } else if (context?.returnLocation) {
    payload.ReturnLocation = normalizeCarApiLocationCode(
      context.returnLocation
    );
  }

  if (!payload.PickupDateTime && context?.pickupDate && context.pickupTime) {
    payload.PickupDateTime = formatCarApiDateTime(
      context.pickupDate,
      context.pickupTime
    );
  }
  if (!payload.ReturnDateTime && context?.returnDate && context.returnTime) {
    payload.ReturnDateTime = formatCarApiDateTime(
      context.returnDate,
      context.returnTime
    );
  }

  return JSON.stringify([payload]);
}

export function parseCarSelectResponse(strings: string[]): CarSelectResult {
  let car: Record<string, unknown> | null = null;
  let pricing: CarPricing | null = null;
  let apiMessage: string | undefined;

  for (const entry of strings) {
    if (!entry || entry === '[]') continue;

    if (!entry.startsWith('[') && !entry.startsWith('{')) {
      const msg = entry.trim();
      if (msg && msg.toLowerCase() !== 'no error') {
        apiMessage = msg;
      }
      continue;
    }

    try {
      const parsed = JSON.parse(entry) as
        | Record<string, unknown>
        | Record<string, unknown>[];
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const first = list[0];
      if (!first) continue;

      if (first.GrandTotal != null || first.TotalFare != null) {
        pricing = first as unknown as CarPricing;
      } else if (first.VendorCode != null || first.VehicleMake != null) {
        car = first;
      }
    } catch {
      // skip malformed entries
    }
  }

  if (!pricing && !car && apiMessage) {
    return { car: null, pricing: null, apiMessage };
  }

  if (!pricing && apiMessage) {
    return { car, pricing: null, apiMessage };
  }

  return {
    car,
    pricing,
    apiMessage: pricing || car ? undefined : apiMessage
  };
}
