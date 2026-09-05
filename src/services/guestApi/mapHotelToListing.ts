import { KTA, Hotel } from '../../components/travel/ethioTravelData';

export type HotelListItem = {
  APIName?: string;
  AddressShortText?: string;
  Hotelname?: string;
  Hotelcode?: string;
  Imageurl?: string;
  UsersCurrency?: string;
  Currency?: string;
  CurrencyCode?: string;
  StrikeTotlaPrice?: number;
  LowRateWithMarkup?: number;
  TotalDays?: string;
  AccessToken?: string;
  ItemId?: string;
  TotalPrice?: number;
  RefundString?: string;
  TraceId?: string;
  ResultIndex?: string;
  StarDiv?: string;
  Starcategory?: string;
  PropertyCode?: string;
  ChainCode?: string;
};

const HOTEL_COLORS = [KTA.navy, KTA.blue, '#2563eb', '#14B8A6', '#0d9488'];

type HotelCityMeta = {
  cityName: string;
  countryCode: string;
};

const HOTEL_CITY_MAP: Record<string, HotelCityMeta> = {
  dubai: { cityName: 'dubai', countryCode: 'AE' },
  'abu dhabi': { cityName: 'abu dhabi', countryCode: 'AE' },
  sharjah: { cityName: 'sharjah', countryCode: 'AE' },
  ajman: { cityName: 'ajman', countryCode: 'AE' },
  'addis ababa': { cityName: 'addis ababa', countryCode: 'ET' },
  'bahir dar': { cityName: 'bahir dar', countryCode: 'ET' },
  hawassa: { cityName: 'hawassa', countryCode: 'ET' },
  'dire dawa': { cityName: 'dire dawa', countryCode: 'ET' },
  gondar: { cityName: 'gondar', countryCode: 'ET' },
  mekelle: { cityName: 'mekelle', countryCode: 'ET' },
  cairo: { cityName: 'cairo', countryCode: 'EG' },
  nairobi: { cityName: 'nairobi', countryCode: 'KE' },
  london: { cityName: 'london', countryCode: 'GB' },
  paris: { cityName: 'paris', countryCode: 'FR' },
  istanbul: { cityName: 'istanbul', countryCode: 'TR' }
};

export function normalizeHotelCityLabel(label: string): string {
  return label.
  replace(/\s*\([A-Z]{3}\)\s*$/i, '').
  replace(/\s+/g, ' ').
  trim();
}

export function resolveHotelSearchLocation(label: string): HotelCityMeta {
  const normalized = normalizeHotelCityLabel(label).toLowerCase();
  const titleCase = (value: string) =>
  value.replace(/\b\w/g, (ch) => ch.toUpperCase());

  if (HOTEL_CITY_MAP[normalized]) {
    const hit = HOTEL_CITY_MAP[normalized];
    return {
      cityName: titleCase(hit.cityName),
      countryCode: hit.countryCode
    };
  }

  const partial = Object.entries(HOTEL_CITY_MAP).find(([key]) =>
  normalized.includes(key) || key.includes(normalized)
  );
  if (partial) {
    return {
      cityName: titleCase(partial[1].cityName),
      countryCode: partial[1].countryCode
    };
  }

  return {
    cityName: titleCase(normalized || 'dubai'),
    countryCode: 'AE'
  };
}

export function buildRoomGuestJson(
  roomCount: number,
  adultCount: number,
  childCount = 0
): string {
  const rooms = Math.max(1, roomCount);
  const adults = Math.max(1, adultCount);
  const payload = Array.from({ length: rooms }, (_, index) => ({
    Roomno: String(index + 1),
    Adult: String(Math.max(1, Math.ceil(adults / rooms))),
    Child: String(childCount),
    Child1Age: '0',
    Child2Age: '0'
  }));
  return JSON.stringify(payload);
}

function hotelCurrency(code?: string, preferred?: string): string {
  const fallback = String(preferred || '')
    .trim()
    .toUpperCase();
  if (/^[A-Z]{3}$/.test(fallback)) return fallback;
  const fromApi = String(code || '')
    .trim()
    .toUpperCase();
  return /^[A-Z]{3}$/.test(fromApi) ? fromApi : 'ETB';
}

function refundTag(refundString?: string): string[] {
  const value = refundString?.trim();
  if (!value) return ['Hotel'];
  return [value];
}

function amenityTags(stars: number, refundString?: string): string[] {
  const tags = ['Free Wi-Fi'];
  if (stars >= 4) tags.push('Pool');
  if (stars >= 5) tags.push('Spa');
  if (refundString?.toLowerCase().includes('refund')) {
    tags.push(refundString);
  }
  return tags.slice(0, 3);
}

export function mapHotelItemToListing(
  item: HotelListItem,
  index: number,
  cityLabel: string,
  preferredCurrency?: string
): Hotel {
  const rawStars = Number(item.Starcategory);
  // Starcategory "0" is valid (unrated). Missing/invalid → 0 so star filters stay accurate.
  const stars = Number.isFinite(rawStars) ?
  Math.max(0, Math.min(5, rawStars)) :
  0;
  const nights = Math.max(1, Number(item.TotalDays) || 1);
  const totalPrice = Number(item.TotalPrice ?? item.LowRateWithMarkup ?? 0);
  const strikePrice = Number(item.StrikeTotlaPrice ?? 0);
  const pricePerNight = totalPrice > 0 ? Math.round(totalPrice / nights) : 0;
  const currency = hotelCurrency(
    item.UsersCurrency || item.Currency || item.CurrencyCode,
    preferredCurrency
  );
  const refund = item.RefundString?.trim();
  const location = normalizeHotelCityLabel(cityLabel) || 'Dubai';

  return {
    id: item.ItemId || item.Hotelcode || `hotel-${index}`,
    name: item.Hotelname?.trim() || 'Hotel',
    location,
    stars,
    reviews: Math.round(40 + stars * 90 + index * 3),
    roomType: refund || 'Standard Room',
    pricePerNight,
    priceBeforeDiscount:
      strikePrice > totalPrice ? Math.round(strikePrice / nights) : undefined,
    currency,
    amenities: amenityTags(stars, refund),
    color: HOTEL_COLORS[index % HOTEL_COLORS.length],
    image: item.Imageurl?.trim() || undefined,
    tags: refundTag(refund),
    address: item.AddressShortText?.trim(),
    rating: Math.min(5, stars + 0.2),
    ratingLabel: stars >= 5 ? 'Excellent' : stars >= 4 ? 'Very good' : 'Good',
    description: `Stay at ${item.Hotelname ?? 'this hotel'} in ${location}. ${refund ?? 'Flexible booking options may apply.'}`,
    facilities: amenityTags(stars, refund),
    totalStayPrice: totalPrice,
    totalNights: nights,
    traceId: item.TraceId,
    apiPayload: item
  };
}
