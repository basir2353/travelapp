/**
 * Wallet / traveller-validation GuestAPI operations.
 * @see TransactionReport, TravellerUserValidation, BookingDebit
 *
 * Live signatures (confirmed against GuestAPI.asmx?op=<Name>):
 *   TransactionReport(UserId:int, UserTypeId:int, FromDate:string, ToDate:string)
 *   TravellerUserValidation(Type:string, Value:string)   — NOT "UserValidation"
 *   BookingDebit(UserId:int, UserTypeId:int, BookFlightId:int, DebitAmount:decimal)
 */

import { callGuestApi, callGuestApiWithBody } from './soapClient';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ?
    (value as Record<string, unknown>) :
    null;
}

function str(row: Record<string, unknown> | null, ...keys: string[]): string {
  if (!row) return '';
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return '';
}

function num(row: Record<string, unknown> | null, ...keys: string[]): number {
  if (!row) return 0;
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim() !== '') {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

export type WalletTransaction = {
  slNo: number;
  id: number;
  credit: number;
  debit: number;
  transferFrom: string;
  dateCreated: string;
};

/**
 * TransactionReport / BookingDebit both return the same row shape, e.g.:
 * [{"SlNo":1,"Id":320,"Credit":0.00,"Debit":10.00,"TransferFrom":"John Sam","Datecreated":"03 August 2026"}]
 */
function mapWalletRows(rows: unknown[]): WalletTransaction[] {
  return rows.
    map((row) => asRecord(row)).
    filter((row): row is Record<string, unknown> => row != null).
    map((row) => ({
      slNo: num(row, 'SlNo', 'slNo'),
      id: num(row, 'Id', 'ID', 'TransactionId'),
      credit: num(row, 'Credit', 'credit'),
      debit: num(row, 'Debit', 'debit'),
      transferFrom: str(row, 'TransferFrom', 'transferFrom', 'Narration', 'Description') ||
        'Wallet',
      dateCreated: str(
        row,
        'Datecreated',
        'DateCreated',
        'dateCreated',
        'TransactionDate',
        'CreatedOn'
      )
    })).
    filter((row) => row.id > 0 || row.credit > 0 || row.debit > 0 || row.slNo > 0);
}

function extractJsonArrayBlob(raw: string): string | null {
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start < 0 || end <= start) return null;
  return raw.slice(start, end + 1);
}

function parseWalletTransactions(raw: string): WalletTransaction[] {
  const trimmed = String(raw || '').trim();
  if (!trimmed || trimmed === '[]') return [];

  // Decode leftover XML entities / wrapping quotes from SOAP extraction.
  let text = trimmed.
    replace(/^["']+|["']+$/g, '').
    trim();
  if (/&quot;|&lt;|&gt;|&amp;/.test(text)) {
    text = text.
      replace(/&quot;/g, '"').
      replace(/&lt;/g, '<').
      replace(/&gt;/g, '>').
      replace(/&apos;/g, "'").
      replace(/&amp;/g, '&');
  }

  const candidates = [text];
  const blob = extractJsonArrayBlob(text);
  if (blob && blob !== text) candidates.push(blob);

  for (const candidate of candidates) {
    try {
      let parsed: unknown = JSON.parse(candidate);
      // Some SOAP paths return a JSON-encoded string of the array.
      if (typeof parsed === 'string') {
        const inner = parsed.trim();
        if (!inner || inner === '[]') return [];
        parsed = JSON.parse(inner);
      }
      const record = asRecord(parsed);
      const rows = Array.isArray(parsed) ?
        parsed :
        Array.isArray(record?.Table) ?
        (record!.Table as unknown[]) :
        Array.isArray(record?.Table1) ?
        (record!.Table1 as unknown[]) :
        Array.isArray(record?.data) ?
        (record!.data as unknown[]) :
        [];
      if (Array.isArray(parsed) && parsed.length === 0) return [];
      const mapped = mapWalletRows(rows);
      if (mapped.length > 0 || Array.isArray(parsed)) return mapped;
    } catch {
      // try next candidate
    }
  }
  return [];
}

export type TransactionReportParams = {
  userId: number | string;
  userTypeId: number | string;
  /** dd/MM/yyyy per client sample, e.g. "01/08/2026". */
  fromDate: string;
  toDate: string;
};

export type TransactionReportResult = {
  success: boolean;
  transactions: WalletTransaction[];
  message: string;
  raw: string;
};

function decodeSoapResultText(value: string): string {
  return value.
    replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').
    replace(/&quot;/g, '"').
    replace(/&lt;/g, '<').
    replace(/&gt;/g, '>').
    replace(/&apos;/g, "'").
    replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).
    replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16))).
    replace(/&amp;/g, '&').
    trim();
}

/** Pull TransactionReportResult JSON out of a raw SOAP envelope. */
function extractTransactionReportResult(soapBody: string): string {
  const match = String(soapBody || '').match(
    /<TransactionReportResult(?:\s[^>]*)?>([\s\S]*?)<\/TransactionReportResult>/i
  );
  if (match?.[1]) return decodeSoapResultText(match[1]);
  const blob = extractJsonArrayBlob(soapBody);
  return blob ? decodeSoapResultText(blob) : '';
}

function collectWalletTransactions(
  ...chunks: Array<string | null | undefined>
): WalletTransaction[] {
  let sawExplicitEmpty = false;

  for (const chunk of chunks) {
    if (!chunk) continue;
    const parsed = parseWalletTransactions(chunk);
    if (parsed.length > 0) return parsed;
  }

  // Only treat as empty after every chunk failed to yield rows.
  for (const chunk of chunks) {
    if (!chunk) continue;
    const trimmed = chunk.trim();
    const blob = extractJsonArrayBlob(trimmed);
    if (trimmed === '[]' || blob === '[]') {
      sawExplicitEmpty = true;
      continue;
    }
    if (blob) {
      const parsed = parseWalletTransactions(blob);
      if (parsed.length > 0) return parsed;
    }
  }

  return sawExplicitEmpty ? [] : [];
}

/** TransactionReport(UserId, UserTypeId, FromDate, ToDate) — wallet statement. */
export async function transactionReport(
  params: TransactionReportParams
): Promise<TransactionReportResult> {
  try {
    const userId = Number(params.userId);
    const userTypeId = Number(params.userTypeId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return {
        success: false,
        transactions: [],
        message: 'Sign in to view wallet transactions for this account',
        raw: ''
      };
    }
    const { strings, body } = await callGuestApiWithBody(
      'TransactionReport',
      [
        { name: 'UserId', value: String(Math.trunc(userId)) },
        {
          name: 'UserTypeId',
          value: String(
            Number.isFinite(userTypeId) && userTypeId > 0 ? Math.trunc(userTypeId) : 5
          )
        },
        { name: 'FromDate', value: params.fromDate },
        { name: 'ToDate', value: params.toDate }
      ],
      { timeoutMs: 45_000, maxRetries: 0 }
    );

    const fromSoap = extractTransactionReportResult(body);
    const joined = strings.join('\n').trim();
    const transactions = collectWalletTransactions(
      fromSoap,
      joined,
      ...strings,
      body
    );

    return {
      success: true,
      transactions,
      message: transactions.length ?
        'Transactions loaded' :
        'No transactions in this period',
      raw: fromSoap || joined || body
    };
  } catch (err) {
    return {
      success: false,
      transactions: [],
      message:
        err instanceof Error ? err.message : 'Could not load wallet transactions',
      raw: ''
    };
  }
}

export type BookingDebitParams = {
  userId: number | string;
  userTypeId: number | string;
  bookFlightId: number | string;
  debitAmount: number | string;
};

export type BookingDebitResult = {
  success: boolean;
  transactions: WalletTransaction[];
  message: string;
  raw: string;
};

/** BookingDebit(UserId, UserTypeId, BookFlightId, DebitAmount) — debit wallet for a booking. */
export async function bookingDebit(
  params: BookingDebitParams
): Promise<BookingDebitResult> {
  try {
    const strings = await callGuestApi('BookingDebit', [
      { name: 'UserId', value: String(params.userId) },
      { name: 'UserTypeId', value: String(params.userTypeId) },
      { name: 'BookFlightId', value: String(params.bookFlightId) },
      { name: 'DebitAmount', value: String(params.debitAmount) }
    ], { timeoutMs: 45_000 });
    const raw = strings.join('\n').trim();
    const token = raw.replace(/^["']|["']$/g, '').trim();
    const lower = token.toLowerCase();
    if (/^(success|allowed|ok|true)$/i.test(token)) {
      return {
        success: true,
        transactions: [],
        message: 'Wallet debited successfully',
        raw
      };
    }
    if (
      lower.includes('insufficient') ||
      lower.includes('not allowed') ||
      lower.includes('error') ||
      lower.includes('fail')
    ) {
      return { success: false, transactions: [], message: token || raw, raw };
    }
    return {
      success: true,
      transactions: parseWalletTransactions(raw),
      message: 'Wallet debited successfully',
      raw
    };
  } catch (err) {
    return {
      success: false,
      transactions: [],
      message:
        err instanceof Error ?
        err.message :
        'Could not debit wallet for this booking',
      raw: ''
    };
  }
}

export type UserValidationType = 'Email' | 'Phone' | 'Username';

export type UserValidationResult = {
  success: boolean;
  /** true when the server found an existing account for this Type/Value. */
  exists: boolean;
  userId?: number;
  username?: string;
  name?: string;
  email?: string;
  phone?: string;
  message: string;
  raw: string;
};

/**
 * TravellerUserValidation(Type, Value) — look up a traveller by Email, Phone,
 * or Username.
 *
 * Response semantics (do not invert for signup):
 * - Account FOUND:  {"status":"success","message":"allowed","userId":"…",…}
 *   → "allowed" means this identity can log in (already registered).
 * - Account FREE:   {"status":"failed","message":"not allowed","reason":"… not found"}
 *   → safe to use for signup.
 *
 * WARNING: Live GuestAPI often returns userId "1000" for every successful
 * lookup. Use this op for exists-checks only — NEVER for TravellerDashboard /
 * wallet Member ID. Wallet ids must come from TravellerLogin.UserID.
 */
export async function travellerUserValidation(
  type: UserValidationType,
  value: string
): Promise<UserValidationResult> {
  const trimmedValue = String(value || '').trim();
  if (!trimmedValue) {
    return {
      success: false,
      exists: false,
      message: `Enter a ${type.toLowerCase()} to check`,
      raw: ''
    };
  }

  let raw = '';
  try {
    const strings = await callGuestApi('TravellerUserValidation', [
      { name: 'Type', value: type },
      { name: 'Value', value: trimmedValue }
    ]);
    raw = strings.join('\n').trim();
  } catch (err) {
    return {
      success: false,
      exists: false,
      message:
        err instanceof Error ? err.message : 'Could not reach validation service',
      raw: ''
    };
  }

  if (!raw) {
    return { success: false, exists: false, message: 'No response from server', raw };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const status = str(parsed, 'status', 'Status');
    const message = str(parsed, 'message', 'Message');
    const reason = str(parsed, 'reason', 'Reason');
    const userId = num(parsed, 'userId', 'UserId') || undefined;
    const username = str(parsed, 'username', 'Username') || undefined;
    const name = str(parsed, 'name', 'Name') || undefined;
    const email = str(parsed, 'email', 'Email') || undefined;
    const phone = str(parsed, 'phone', 'Phone') || undefined;

    // Live shapes:
    //   found:   {"status":"success","message":"allowed","userId":"1000",...}
    //   missing: {"status":"failed","message":"not allowed","reason":"Email not found"}
    // IMPORTANT: do NOT use /allowed/i — it also matches "not allowed".
    const notFound =
      /^fail/i.test(status) ||
      /^not\s*allow/i.test(message) ||
      /not\s*found/i.test(message) ||
      /not\s*found/i.test(reason);
    const exists =
      !notFound &&
      (/^success$/i.test(status) || /^allowed$/i.test(message)) &&
      Boolean(userId || username);

    return {
      success: true,
      exists,
      userId,
      username: username || undefined,
      name: name || undefined,
      email: email || undefined,
      phone: phone || undefined,
      message:
        reason ||
        message ||
        status ||
        (exists ? 'Account found' : 'Not found'),
      raw
    };
  } catch {
    const lower = raw.toLowerCase();
    const notFound =
      lower.includes('not found') ||
      lower.includes('not allowed') ||
      lower.includes('invalid');
    return {
      success: true,
      exists: false,
      message: notFound ? 'Not found' : raw.slice(0, 160),
      raw
    };
  }
}
