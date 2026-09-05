import { callGuestApi } from './soapClient';

export type GuestCurrency = {
  name: string;
  code: string;
};

/** Shown immediately while GetAllCurrency loads (or when the API is unreachable). */
export const FALLBACK_CURRENCIES: GuestCurrency[] = [
  { name: 'Australian Dollar', code: 'AUD' },
  { name: 'Brazilian Real', code: 'BRL' },
  { name: 'Canadian dollar', code: 'CAD' },
  { name: 'Egyptian Pounds', code: 'EGP' },
  { name: 'Ethiopian Birr', code: 'ETB' },
  { name: 'Euros', code: 'EUR' },
  { name: 'Indian Rupees', code: 'INR' },
  { name: 'Kenyan Shilling', code: 'KES' },
  { name: 'Mauritian Rupees', code: 'MUR' },
  { name: 'Nigerian Naira', code: 'NGN' },
  { name: 'Omani Riyals', code: 'OMR' },
  { name: 'Pound Sterling', code: 'GBP' },
  { name: 'Sri Lankan Rupee', code: 'LKR' },
  { name: 'UAE Dirham', code: 'AED' },
  { name: 'United States Dollar', code: 'USD' }
];

type CurrencyRow = {
  CurrencyName?: string;
  CurrencyCode?: string;
};

const GET_ALL_CURRENCY_TIMEOUT_MS = 8_000;
const EXCHANGE_RATE_TIMEOUT_MS = 12_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms / 1000}s`));
    }, ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function mapCurrencyRows(rows: CurrencyRow[]): GuestCurrency[] {
  return rows
    .map((row) => ({
      name: String(row.CurrencyName || '').trim(),
      code: String(row.CurrencyCode || '')
        .trim()
        .toUpperCase()
    }))
    .filter((row) => row.name && /^[A-Z]{3}$/.test(row.code));
}

export function parseCurrencyList(strings: string[]): GuestCurrency[] {
  for (const value of strings) {
    const trimmed = value?.trim();
    if (!trimmed) continue;

    // Plain JSON array: [{ CurrencyName, CurrencyCode }, ...]
    if (trimmed.startsWith('[')) {
      try {
        const rows = JSON.parse(trimmed) as CurrencyRow[];
        if (Array.isArray(rows)) {
          const currencies = mapCurrencyRows(rows);
          if (currencies.length > 0) return currencies;
        }
      } catch {
        // Try the next SOAP string.
      }
      continue;
    }

    // Dataset shape: { Table: [...] } / { Table1: [...] }
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed) as Record<string, unknown>;
        for (const key of Object.keys(parsed)) {
          const rows = parsed[key];
          if (!Array.isArray(rows) || rows.length === 0) continue;
          const currencies = mapCurrencyRows(rows as CurrencyRow[]);
          if (currencies.length > 0) return currencies;
        }
      } catch {
        // Try the next SOAP string.
      }
    }
  }
  return [];
}

/** GetAllCurrency — currencies supported by GuestAPI (fast-fail to local list). */
export async function getAllCurrency(): Promise<GuestCurrency[]> {
  try {
    const strings = await withTimeout(
      callGuestApi('GetAllCurrency', [], { maxRetries: 0, timeoutMs: GET_ALL_CURRENCY_TIMEOUT_MS }),
      GET_ALL_CURRENCY_TIMEOUT_MS + 500,
      'GetAllCurrency'
    );
    const currencies = parseCurrencyList(strings);
    return currencies.length > 0 ? currencies : FALLBACK_CURRENCIES;
  } catch {
    return FALLBACK_CURRENCIES;
  }
}

/** GetCurrencyExchangerate — conversion value from the API source currency. */
export async function getCurrencyExchangeRate(code: string): Promise<number> {
  const normalized = code.trim().toUpperCase();
  if (!normalized || normalized === 'ETB') return 1;

  const strings = await withTimeout(
    callGuestApi(
      'GetCurrencyExchangerate',
      [{ name: 'ExchangeCurrency', value: normalized }],
      { maxRetries: 1, timeoutMs: EXCHANGE_RATE_TIMEOUT_MS }
    ),
    EXCHANGE_RATE_TIMEOUT_MS + 500,
    'GetCurrencyExchangerate'
  );
  for (const value of strings) {
    const rate = Number(String(value).trim());
    if (Number.isFinite(rate) && rate > 0) return rate;
  }
  throw new Error(`Exchange rate is unavailable for ${normalized}`);
}
