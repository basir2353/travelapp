import { callGuestApi, GuestApiError } from './soapClient';

/** Raw row from FlightAirportAutocomplete JSON. */
export type FlightAirportRaw = {
  Id?: string;
  Name?: string;
  municipality?: string;
  iso_country?: string;
};

export type FlightAirportOption = {
  /** IATA airport code (e.g. ADD). */
  code: string;
  /** Airport name from API. */
  name: string;
  /** City / municipality when available. */
  city: string;
  /** ISO country code (e.g. ET). */
  countryCode: string;
  /** Display label for FROM/TO fields, e.g. "Addis Ababa (ADD)". */
  label: string;
  /** Secondary line in the picker list. */
  detail: string;
};

/** Popular hubs shown before the user types. */
export const POPULAR_FLIGHT_AIRPORTS: FlightAirportOption[] = [
  {
    code: 'ADD',
    name: 'Addis Ababa Bole International Airport',
    city: 'Addis Ababa',
    countryCode: 'ET',
    label: 'Addis Ababa (ADD)',
    detail: 'Addis Ababa Bole International Airport · ET'
  },
  {
    code: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    countryCode: 'AE',
    label: 'Dubai (DXB)',
    detail: 'Dubai International Airport · AE'
  },
  {
    code: 'DOH',
    name: 'Hamad International Airport',
    city: 'Doha',
    countryCode: 'QA',
    label: 'Doha (DOH)',
    detail: 'Hamad International Airport · QA'
  },
  {
    code: 'NBO',
    name: 'Jomo Kenyatta International Airport',
    city: 'Nairobi',
    countryCode: 'KE',
    label: 'Nairobi (NBO)',
    detail: 'Jomo Kenyatta International Airport · KE'
  },
  {
    code: 'JED',
    name: 'King Abdulaziz International Airport',
    city: 'Jeddah',
    countryCode: 'SA',
    label: 'Jeddah (JED)',
    detail: 'King Abdulaziz International Airport · SA'
  },
  {
    code: 'IST',
    name: 'Istanbul Airport',
    city: 'Istanbul',
    countryCode: 'TR',
    label: 'Istanbul (IST)',
    detail: 'Istanbul Airport · TR'
  },
  {
    code: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    countryCode: 'GB',
    label: 'London (LHR)',
    detail: 'London Heathrow Airport · GB'
  },
  {
    code: 'CAI',
    name: 'Cairo International Airport',
    city: 'Cairo',
    countryCode: 'EG',
    label: 'Cairo (CAI)',
    detail: 'Cairo International Airport · EG'
  },
  {
    code: 'JIJ',
    name: 'Jijiga Garaad International Airport',
    city: 'Jijiga',
    countryCode: 'ET',
    label: 'Jijiga (JIJ)',
    detail: 'Jijiga Garaad International Airport · ET'
  },
  {
    code: 'LOS',
    name: 'Murtala Muhammed International Airport',
    city: 'Lagos',
    countryCode: 'NG',
    label: 'Lagos (LOS)',
    detail: 'Murtala Muhammed International Airport · NG'
  }
];

/** Popular one-way routes shown as chips on the home front display. */
export const POPULAR_FLIGHT_ROUTES: {
  fromCode: string;
  fromLabel: string;
  toCode: string;
  toLabel: string;
  chip: string;
}[] = [
  {
    fromCode: 'ADD',
    fromLabel: 'Addis Ababa (ADD)',
    toCode: 'DXB',
    toLabel: 'Dubai (DXB)',
    chip: 'ADD - DXB'
  },
  {
    fromCode: 'ADD',
    fromLabel: 'Addis Ababa (ADD)',
    toCode: 'NBO',
    toLabel: 'Nairobi (NBO)',
    chip: 'ADD - NBO'
  },
  {
    fromCode: 'DXB',
    fromLabel: 'Dubai (DXB)',
    toCode: 'LHR',
    toLabel: 'London (LHR)',
    chip: 'DXB - LHR'
  },
  {
    fromCode: 'LOS',
    fromLabel: 'Lagos (LOS)',
    toCode: 'DXB',
    toLabel: 'Dubai (DXB)',
    chip: 'LOS - DXB'
  },
  {
    fromCode: 'LOS',
    fromLabel: 'Lagos (LOS)',
    toCode: 'ADD',
    toLabel: 'Addis Ababa (ADD)',
    chip: 'LOS - ADD'
  },
  {
    fromCode: 'ADD',
    fromLabel: 'Addis Ababa (ADD)',
    toCode: 'JIJ',
    toLabel: 'Jijiga (JIJ)',
    chip: 'ADD - JIJ'
  },
  {
    fromCode: 'ADD',
    fromLabel: 'Addis Ababa (ADD)',
    toCode: 'LHR',
    toLabel: 'London (LHR)',
    chip: 'ADD - LHR'
  },
  {
    fromCode: 'ADD',
    fromLabel: 'Addis Ababa (ADD)',
    toCode: 'IST',
    toLabel: 'Istanbul (IST)',
    chip: 'ADD - IST'
  },
  {
    fromCode: 'ADD',
    fromLabel: 'Addis Ababa (ADD)',
    toCode: 'JED',
    toLabel: 'Jeddah (JED)',
    chip: 'ADD - JED'
  }
];

/**
 * Rank FlightAirportAutocomplete rows for typing UX.
 * - Exact IATA (LOS) always first
 * - Typing "los" / "lagos" prefers Lagos (NG) and sinks Los Angeles (LAX)
 * - Remaining rows keep relative API order
 */
export function preferExactIataMatches(
  results: FlightAirportOption[],
  query: string
): FlightAirportOption[] {
  if (results.length <= 1) return results;

  const raw = query.trim();
  const q = raw.toLowerCase();
  const qUp = raw.toUpperCase();
  const wantsLagos = q === 'los' || q === 'lagos' || q.startsWith('lagos');

  const scored = results.map((airport, index) => {
    let score = 50 + index; // stable API-relative order
    if (airport.code === qUp) score = 0;
    else if (wantsLagos && airport.code === 'LOS') score = 0;
    else if (wantsLagos && airport.code === 'LAX') score = 10_000;
    else if (airport.city.toLowerCase() === q) score = 1;
    else if (airport.city.toLowerCase().startsWith(q)) score = 2;
    else if (airport.name.toLowerCase().includes(q)) score = 5;
    return { airport, score, index };
  });

  scored.sort((a, b) => a.score - b.score || a.index - b.index);
  return scored.map((entry) => entry.airport);
}

/** Known IATA hubs that GuestAPI often buries under similar city names. */
export const FLIGHT_AIRPORT_ALIASES: Record<string, FlightAirportOption> = {
  LOS: {
    code: 'LOS',
    name: 'Murtala Muhammed International Airport',
    city: 'Lagos',
    countryCode: 'NG',
    label: 'Lagos (LOS)',
    detail: 'Murtala Muhammed International Airport · NG'
  },
  LAX: {
    code: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    countryCode: 'US',
    label: 'Los Angeles (LAX)',
    detail: 'Los Angeles International Airport · US'
  }
};

/** Ensure Lagos appears when the user clearly means LOS / Lagos. */
export function ensureAliasAirports(
  results: FlightAirportOption[],
  query: string
): FlightAirportOption[] {
  const q = query.trim().toLowerCase();
  if (q !== 'los' && q !== 'lagos' && !q.startsWith('lagos')) {
    return results;
  }
  if (results.some((airport) => airport.code === 'LOS')) return results;
  return [FLIGHT_AIRPORT_ALIASES.LOS, ...results];
}

/** True when the From/To field is Los Angeles (LAX), not Lagos (LOS). */
export function isLosAngelesAirportLabel(label: string): boolean {
  const raw = String(label || '').trim();
  if (!raw) return false;
  if (/^LAX$/i.test(raw)) return true;
  if (/\(LAX\)\s*$/i.test(raw)) return true;
  return /los\s*angeles/i.test(raw);
}

/**
 * Destinations where GuestAPI often has Lagos (LOS) inventory but returns
 * "Parameter name: source" for Los Angeles (LAX).
 */
const LAGOS_PREFERRED_DESTINATIONS = new Set([
  'DXB',
  'ADD',
  'NBO',
  'JED',
  'IST',
  'CAI',
  'DOH',
  'LHR',
  'JIJ',
  'RUH',
  'BAH',
  'MCT',
  'AMM'
]);

/**
 * Users typing "los" often pick Los Angeles (LAX) by mistake.
 * For Africa / Gulf hubs, rewrite From to Lagos (LOS) before search.
 */
export function correctMistakenLosAngelesOrigin(
  fromLabel: string,
  toLabel: string
): string | null {
  if (!isLosAngelesAirportLabel(fromLabel)) return null;
  const dest = String(toLabel || '')
    .trim()
    .match(/\(([A-Z]{3})\)\s*$/i)?.[1]
    ?.toUpperCase();
  const destBare = /^[A-Z]{3}$/i.test(toLabel.trim())
    ? toLabel.trim().toUpperCase()
    : '';
  const code = dest || destBare;
  if (!code || !LAGOS_PREFERRED_DESTINATIONS.has(code)) return null;
  return FLIGHT_AIRPORT_ALIASES.LOS.label;
}

export function formatFlightAirportLabel(airport: {
  code: string;
  city?: string;
  name?: string;
}): string {
  const place = (airport.city || airport.name || airport.code).trim();
  return `${place} (${airport.code})`;
}

function mapAirport(row: FlightAirportRaw): FlightAirportOption | null {
  const code = String(row.Id ?? '')
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return null;

  const name = String(row.Name ?? '').trim() || code;
  const city = String(row.municipality ?? '').trim() || name;
  const countryCode = String(row.iso_country ?? '')
    .trim()
    .toUpperCase();
  const label = formatFlightAirportLabel({ code, city, name });
  const detail = countryCode ?
    `${name} · ${countryCode}` :
    name;

  return { code, name, city, countryCode, label, detail };
}

export function parseFlightAirportAutocompleteResponse(
  strings: string[]
): FlightAirportOption[] {
  const seen = new Set<string>();
  const options: FlightAirportOption[] = [];

  for (const entry of strings) {
    const trimmed = entry?.trim();
    if (!trimmed?.startsWith('[')) continue;

    try {
      const list = JSON.parse(trimmed) as FlightAirportRaw[];
      if (!Array.isArray(list)) continue;

      for (const row of list) {
        const option = mapAirport(row);
        if (!option || seen.has(option.code)) continue;
        seen.add(option.code);
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
 * FlightAirportAutocomplete — search airports by city / airport / IATA code.
 * empName is the search text (e.g. "DU") — API returns matching airports only.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=FlightAirportAutocomplete
 */
export async function flightAirportAutocomplete(
  empName: string
): Promise<FlightAirportOption[]> {
  const query = empName.trim();
  if (query.length < 1) return [];

  try {
    const strings = await callGuestApi('FlightAirportAutocomplete', [
      { name: 'empName', value: query }
    ]);
    return parseFlightAirportAutocompleteResponse(strings);
  } catch (error) {
    if (isGuestApiUnreachable(error)) {
      return [];
    }
    throw error;
  }
}
