import { callGuestApiWithBody, GuestApiError } from './soapClient';
import { parseGuestJsonRecords, parseJsonStringEntries } from './parseJsonStrings';

export type ApiPaymentType = {
  Id: number;
  PaymentType: string;
  Percentage?: string;
  Status?: number;
  AmountFrom?: string;
  AmountTo?: string;
  datecreated?: string;
  Type?: string | null;
  Country?: string | null;
};

export type PaymentTypeListResult = {
  paymentTypes: ApiPaymentType[];
  totalRecords: number;
  totalPages: number;
};

export type PaymentTypeKind = 'wallet' | 'card' | 'bank' | 'upi' | 'other';

function pickRowString(
  row: Record<string, unknown>,
  names: string[]
): string {
  const lookup = new Map(
    Object.keys(row).map((key) => [key.toLowerCase(), key])
  );
  for (const name of names) {
    const key = lookup.get(name.toLowerCase());
    if (!key) continue;
    const value = row[key];
    if (value == null) continue;
    const text = String(value).trim();
    if (text && text !== 'null') return text;
  }
  return '';
}

export function mapPaymentTypeRow(
  row: Record<string, unknown>
): ApiPaymentType | null {
  const id = Number(pickRowString(row, ['Id']) || row.Id);
  const name = pickRowString(row, ['PaymentType', 'Name']);
  if (!Number.isFinite(id) || id <= 0 || !name) return null;
  const statusRaw = pickRowString(row, ['Status']);
  const status = statusRaw ? Number(statusRaw) : Number(row.Status ?? 1);
  return {
    Id: id,
    PaymentType: name,
    Percentage: pickRowString(row, ['Percentage']) || undefined,
    Status: Number.isFinite(status) ? status : 1,
    AmountFrom: pickRowString(row, ['AmountFrom']) || undefined,
    AmountTo: pickRowString(row, ['AmountTo']) || undefined,
    datecreated: pickRowString(row, ['datecreated', 'DateCreated']) || undefined,
    Type: pickRowString(row, ['Type']) || null,
    Country: pickRowString(row, ['Country']) || null
  };
}

export function paymentTypeKind(type: ApiPaymentType): PaymentTypeKind {
  const name = type.PaymentType.toLowerCase();
  if (name.includes('wallet')) return 'wallet';
  if (name.includes('upi')) return 'upi';
  if (name.includes('net banking') || name === 'bank') return 'bank';
  if (
    name.includes('card') ||
    name.includes('amex') ||
    name.includes('rupay') ||
    name.includes('abev')
  ) {
    return 'card';
  }
  return 'other';
}

export function isInternationalPaymentType(type: ApiPaymentType): boolean {
  const typeField = String(type.Type || '').toLowerCase();
  const name = type.PaymentType.toLowerCase();
  return typeField.includes('international') || name.includes('international');
}

/** Parse `"0.40 %"` / `"7.00 %"` → `0.4` / `7`. */
export function parsePaymentPercent(raw?: string | null): number {
  const match = String(raw || '').replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Ticket `8000` × `0.4` / 100 = `32`. */
export function paymentConvenienceFee(
  baseAmount: number,
  percent: number
): number {
  const base = Number(baseAmount);
  if (!Number.isFinite(base) || base <= 0 || percent <= 0) return 0;
  return Math.round((base * percent) / 100 * 100) / 100;
}

export function paymentTotalWithFee(
  baseAmount: number,
  percent: number
): number {
  const base = Number(baseAmount) || 0;
  return base + paymentConvenienceFee(base, percent);
}

export function paymentTypeSubtitle(type: ApiPaymentType): string {
  const parts: string[] = [];
  if (type.Percentage && !/^0+(\.0+)?\s*%$/i.test(type.Percentage.trim())) {
    parts.push(`${type.Percentage.trim()} fee`);
  } else {
    parts.push('No extra fee');
  }
  const from = type.AmountFrom?.trim();
  const to = type.AmountTo?.trim();
  if (from && to) parts.push(`${from} – ${to}`);
  if (type.Country) parts.push(type.Country);
  return parts.join(' · ');
}

function parsePaymentTypeResult(
  strings: string[],
  rawXml?: string
): PaymentTypeListResult {
  const records = parseGuestJsonRecords(strings, rawXml);
  const wrapped =
    records.find((row) => Array.isArray(row.Table)) ||
    parseJsonStringEntries(strings).find((row) => Array.isArray(row.Table));

  const rawRows = Array.isArray(wrapped?.Table) ?
    (wrapped.Table as Record<string, unknown>[]) :
    records.filter((row) => row.PaymentType != null || row.Id != null);

  const mapped = rawRows.
  map((row) => mapPaymentTypeRow(row)).
  filter((row): row is ApiPaymentType => row != null);

  const active = mapped.filter((type) => Number(type.Status ?? 1) === 1);
  const meta = Array.isArray(wrapped?.Table1) ?
    (wrapped.Table1[0] as Record<string, unknown> | undefined) :
    undefined;

  return {
    paymentTypes: active,
    totalRecords: Number(meta?.TotalRecords) || active.length,
    totalPages: Number(meta?.TotalPage) || (active.length > 0 ? 1 : 0)
  };
}

/**
 * PayemnttypeGetData — GuestAPI payment methods (note the API spelling).
 * WSDL takes no SOAP parameters; result is `{ Table, Table1 }`.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=PayemnttypeGetData
 */
export async function getPaymentTypes(params?: {
  userTypeId?: number;
  userId?: number;
}): Promise<PaymentTypeListResult> {
  const tryCall = async (withUser: boolean) => {
    const soapParams =
      withUser && params?.userTypeId != null && params?.userId != null ?
      [
        { name: 'UserTypeId', value: String(params.userTypeId) },
        { name: 'UserId', value: String(params.userId) }
      ] :
      [];
    return callGuestApiWithBody('PayemnttypeGetData', soapParams);
  };

  try {
    const { strings, body } = await tryCall(false);
    const parsed = parsePaymentTypeResult(strings, body);
    if (parsed.paymentTypes.length > 0) return parsed;
    if (params?.userTypeId != null && params?.userId != null) {
      const retry = await tryCall(true);
      return parsePaymentTypeResult(retry.strings, retry.body);
    }
    return parsed;
  } catch (err) {
    const body = err instanceof GuestApiError ? err.body : '';
    if (body) {
      const parsed = parsePaymentTypeResult([], body);
      if (parsed.paymentTypes.length > 0) return parsed;
    }
    if (params?.userTypeId != null && params?.userId != null) {
      try {
        const retry = await tryCall(true);
        return parsePaymentTypeResult(retry.strings, retry.body);
      } catch {
        // fall through
      }
    }
    throw err instanceof Error ?
    err :
    new Error('Could not load payment types');
  }
}
