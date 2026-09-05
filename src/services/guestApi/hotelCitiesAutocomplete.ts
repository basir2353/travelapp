import { callGuestApi, GuestApiError } from './soapClient';

/** Raw row from HotelGetCitiesAutocomplete JSON. */
export type HotelCityRaw = {
  latinFullName?: string;
  regionid?: string;
  CountryCode?: string;
  category?: string;
  class_Name?: string;
  search_type?: string;
};

export type HotelCityOption = {
  /** Full display name, e.g. "Dehradun, Uttarakhand, India". */
  label: string;
  /** Short city name for Hotel1_List CityName. */
  cityName: string;
  countryCode: string;
  regionId: string;
  category: string;
};

/** City name used when Destination is opened (matches GuestAPI sample). */
export const HOTEL_CITY_OPEN_QUERY = 'Du';

/** Curated hubs shown when Destination opens (empty query) — same idea as popular airports. */
export const POPULAR_HOTEL_CITIES: HotelCityOption[] = [
  {
    label: 'Addis Ababa, Ethiopia',
    cityName: 'Addis Ababa',
    countryCode: 'ET',
    regionId: '',
    category: 'cities'
  },
  {
    label: 'Dubai, United Arab Emirates',
    cityName: 'Dubai',
    countryCode: 'AE',
    regionId: '',
    category: 'cities'
  },
  {
    label: 'Abu Dhabi, United Arab Emirates',
    cityName: 'Abu Dhabi',
    countryCode: 'AE',
    regionId: '',
    category: 'cities'
  },
  {
    label: 'Nairobi, Kenya',
    cityName: 'Nairobi',
    countryCode: 'KE',
    regionId: '',
    category: 'cities'
  },
  {
    label: 'Cairo, Egypt',
    cityName: 'Cairo',
    countryCode: 'EG',
    regionId: '',
    category: 'cities'
  },
  {
    label: 'Istanbul, Turkey',
    cityName: 'Istanbul',
    countryCode: 'TR',
    regionId: '',
    category: 'cities'
  },
  {
    label: 'London, United Kingdom',
    cityName: 'London',
    countryCode: 'GB',
    regionId: '',
    category: 'cities'
  },
  {
    label: 'Paris, France',
    cityName: 'Paris',
    countryCode: 'FR',
    regionId: '',
    category: 'cities'
  },
  {
    label: 'Bahir Dar, Ethiopia',
    cityName: 'Bahir Dar',
    countryCode: 'ET',
    regionId: '',
    category: 'cities'
  },
  {
    label: 'Dire Dawa, Ethiopia',
    cityName: 'Dire Dawa',
    countryCode: 'ET',
    regionId: '',
    category: 'cities'
  },
  {
    label: 'Hawassa, Ethiopia',
    cityName: 'Hawassa',
    countryCode: 'ET',
    regionId: '',
    category: 'cities'
  },
  {
    label: 'Sharjah, United Arab Emirates',
    cityName: 'Sharjah',
    countryCode: 'AE',
    regionId: '',
    category: 'cities'
  }
];

export function parseHotelCityName(latinFullName: string): string {
  const first = latinFullName.split(',')[0]?.trim();
  return first || latinFullName.trim();
}

function mapCity(row: HotelCityRaw): HotelCityOption | null {
  const label = String(row.latinFullName ?? '').trim();
  if (!label) return null;

  const countryCode = String(row.CountryCode ?? '')
    .trim()
    .toUpperCase();
  const regionId = String(row.regionid ?? '').trim();
  const category = String(row.category ?? row.class_Name ?? 'cities').trim();

  return {
    label,
    cityName: parseHotelCityName(label),
    countryCode: countryCode || 'IN',
    regionId,
    category
  };
}

export function parseHotelCitiesAutocompleteResponse(
  strings: string[]
): HotelCityOption[] {
  const seen = new Set<string>();
  const options: HotelCityOption[] = [];

  for (const entry of strings) {
    const trimmed = entry?.trim();
    if (!trimmed?.startsWith('[')) continue;

    try {
      const list = JSON.parse(trimmed) as HotelCityRaw[];
      if (!Array.isArray(list)) continue;

      for (const row of list) {
        const option = mapCity(row);
        if (!option) continue;
        const key = option.regionId || option.label.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        options.push(option);
      }
    } catch {
      // try next entry
    }
  }

  return options;
}

function isGuestApiUnreachable(error: unknown): boolean {
  if (!(error instanceof GuestApiError)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('cannot reach') ||
    msg.includes('timed out') ||
    msg.includes('failed (500)') ||
    msg.includes('failed (502)') ||
    msg.includes('failed (503)') ||
    msg.includes('empty response')
  );
}

/**
 * HotelGetCitiesAutocomplete — hotel destination city search.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=HotelGetCitiesAutocomplete
 */
export async function hotelGetCitiesAutocomplete(
  cityName: string
): Promise<HotelCityOption[]> {
  const query = cityName.trim();

  try {
    const strings = await callGuestApi('HotelGetCitiesAutocomplete', [
      { name: 'cityName', value: query }
    ]);
    return parseHotelCitiesAutocompleteResponse(strings);
  } catch (error) {
    if (isGuestApiUnreachable(error)) {
      return [];
    }
    throw error;
  }
}
