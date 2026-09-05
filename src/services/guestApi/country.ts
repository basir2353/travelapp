import { callGuestApi, GuestApiError } from './soapClient';

export type GuestCountry = {
  Id: number;
  Name: string;
};

export type GuestCountryOption = {
  id: number;
  name: string;
  label: string;
  code: string;
};

/** Strip trailing ISO code e.g. "Ethiopia (ET)" → "Ethiopia". */
export function parseCountryDisplayName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/** Extract ISO code from API labels like "Ethiopia (ET)" or "Egypt(EG )". */
export function extractCountryCodeFromLabel(label: string): string {
  const match = label.match(/\(([A-Z]{2,3})\s*\)\s*$/i);
  return match?.[1]?.trim().toUpperCase() ?? '';
}

/** Primary airport hub used when a country is selected for flight search. */
const COUNTRY_HUB_AIRPORTS: Record<string, string> = {
  AE: 'DXB',
  BH: 'BAH',
  CN: 'PEK',
  DE: 'FRA',
  EG: 'CAI',
  ET: 'ADD',
  FR: 'CDG',
  GB: 'LHR',
  IN: 'DEL',
  IT: 'FCO',
  JO: 'AMM',
  KE: 'NBO',
  KW: 'KWI',
  LB: 'BEY',
  MA: 'CMN',
  NG: 'LOS',
  OM: 'MCT',
  QA: 'DOH',
  RW: 'KGL',
  SA: 'RUH',
  SD: 'KRT',
  SN: 'DSS',
  TR: 'IST',
  TZ: 'DAR',
  UG: 'EBB',
  US: 'JFK',
  ZA: 'JNB'
};

/**
 * Resolve Origin/Destination IATA codes for flight APIs.
 * Prefers airport labels from FlightAirportAutocomplete ("Addis Ababa (ADD)").
 * Still accepts legacy GetCountry hub labels ("Ethiopia (ET)" → ADD).
 */
export function resolveFlightSearchCode(label: string): string {
  const trimmed = label.trim();
  if (!trimmed || trimmed === 'Where to?') return '';

  const airportMatch = trimmed.match(/\(([A-Z]{3})\)\s*$/i);
  if (airportMatch) return airportMatch[1].toUpperCase();

  if (/^[A-Z]{3}$/i.test(trimmed)) return trimmed.toUpperCase();

  const countryCode = extractCountryCodeFromLabel(trimmed);
  if (countryCode.length === 2) {
    return COUNTRY_HUB_AIRPORTS[countryCode] ?? '';
  }

  if (/^[A-Z]{2}$/i.test(trimmed)) {
    const code = trimmed.toUpperCase();
    return COUNTRY_HUB_AIRPORTS[code] ?? '';
  }

  return '';
}

/** Whether a picker value is a valid flight Origin/Destination (IATA). */
export function isFlightSearchLocation(label: string): boolean {
  const code = resolveFlightSearchCode(label);
  return /^[A-Z]{3}$/.test(code);
}

function dedupeCountries(countries: GuestCountry[]): GuestCountryOption[] {
  const seen = new Set<string>();
  const options: GuestCountryOption[] = [];

  for (const country of countries) {
    if (!country?.Name || country.Id === 0) continue;
    const label = country.Name.trim();
    const name = parseCountryDisplayName(label);
    const code = extractCountryCodeFromLabel(label);
    const key = (code || name).toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    options.push({ id: country.Id, name, label, code });
  }

  return options.sort((a, b) => a.name.localeCompare(b.name));
}

/** Shown when GetCountry is unreachable so forms can still continue. */
export const FALLBACK_COUNTRIES: GuestCountryOption[] = [
  { id: 61, name: 'Ethiopia', label: 'Ethiopia (ET)', code: 'ET' },
  {
    id: 217,
    name: 'United Arab Emirates',
    label: 'United Arab Emirates(AE)',
    code: 'AE'
  },
  { id: 94, name: 'India', label: 'India(IN)', code: 'IN' },
  { id: 69, name: 'United Kingdom', label: 'United Kingdom(GB)', code: 'GB' },
  {
    id: 219,
    name: 'United States of America',
    label: 'United States of America(US)',
    code: 'US'
  },
  { id: 96, name: 'Italy', label: 'Italy(IT)', code: 'IT' },
  { id: 58, name: 'Egypt', label: 'Egypt(EG )', code: 'EG' },
  { id: 100, name: 'Japan', label: 'Japan(JP)', code: 'JP' }
];

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

export function parseGetCountryResponse(strings: string[]): GuestCountryOption[] {
  for (const entry of strings) {
    const trimmed = entry?.trim();
    if (!trimmed?.startsWith('[')) continue;

    try {
      const list = JSON.parse(trimmed) as GuestCountry[];
      const countries = dedupeCountries(list);
      if (countries.length > 0) return countries;
    } catch {
      // try next entry
    }
  }

  return [];
}

/**
 * GetCountry — list all countries for registration and traveller forms.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=GetCountry
 */
export async function getCountry(): Promise<GuestCountryOption[]> {
  try {
    const strings = await callGuestApi('GetCountry', []);
    const countries = parseGetCountryResponse(strings);
    return countries.length > 0 ? countries : FALLBACK_COUNTRIES;
  } catch (error) {
    if (isGuestApiUnreachable(error)) {
      return FALLBACK_COUNTRIES;
    }
    throw error;
  }
}
