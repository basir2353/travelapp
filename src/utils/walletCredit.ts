/**
 * Parse TravellerDashboard.AvailableCredit (e.g. "ETB 12450.75", "ETB -1.00").
 * Wallet amounts from GuestAPI are always in source currency (ETB).
 */
export type ParsedWalletCredit = {
  currency: string;
  amount: number;
  raw: string;
};

export type WalletCreditFormatOpts = {
  /** Selected display currency (e.g. ETB, AUD). Defaults to parsed/API currency. */
  currencyCode?: string | null;
  /**
   * Exchange rate: 1 ETB = `rate` display-currency units.
   * When display currency is ETB (or rate missing), amount is shown as-is.
   */
  rate?: number | null;
  compact?: boolean;
};

export function parseWalletCredit(raw?: string | null): ParsedWalletCredit {
  const text = String(raw || '').trim();
  if (!text) {
    return { currency: 'ETB', amount: 0, raw: 'ETB 0.00' };
  }

  const match = text.match(/^([A-Za-z]{2,4})\s*(-?[\d,]+(?:\.\d+)?)/);
  if (match) {
    const amount = Number(match[2].replace(/,/g, ''));
    return {
      currency: match[1].toUpperCase(),
      // Always positive for UI — never show a leading minus on credit.
      amount: Number.isFinite(amount) ? Math.abs(amount) : 0,
      raw: text
    };
  }

  const numeric = Number(text.replace(/[^\d.-]/g, ''));
  return {
    currency: 'ETB',
    amount: Number.isFinite(numeric) ? Math.abs(numeric) : 0,
    raw: text
  };
}

function normalizeCode(code?: string | null, fallback = 'ETB'): string {
  const c = String(code || '').trim().toUpperCase();
  return /^[A-Z]{2,4}$/.test(c) ? c : fallback;
}

/** Format wallet credit using the user's selected currency code (not hardcoded Br). */
export function formatWalletCreditLabel(
  raw?: string | null,
  opts?: WalletCreditFormatOpts
): string {
  const parsed = parseWalletCredit(raw);
  const sourceCode = normalizeCode(parsed.currency, 'ETB');
  const requestedCode = normalizeCode(opts?.currencyCode, sourceCode);
  const rate = Number(opts?.rate);
  // Never relabel an ETB balance as AUD/USD/etc at a missing or fake 1:1 rate.
  const canConvert =
    requestedCode !== sourceCode &&
    Number.isFinite(rate) &&
    rate > 0 &&
    rate !== 1;

  const displayCode = canConvert ? requestedCode : sourceCode;
  const amount = canConvert ? Math.abs(parsed.amount) * rate : Math.abs(parsed.amount);
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const label = `${displayCode} ${formatted}`;
  if (opts?.compact) {
    return label.length > 14 ? label.slice(0, 14) : label;
  }
  return label;
}

export function formatWalletCreditAmount(
  amount: number,
  currencyCode = 'ETB'
): string {
  const code = normalizeCode(currencyCode, 'ETB');
  return `${code} ${Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/** Convert wallet ETB amount into the UI display currency. */
export function walletAmountInDisplayCurrency(
  amountEtb: number,
  currencyCode?: string | null,
  rate?: number | null
): number {
  const code = normalizeCode(currencyCode, 'ETB');
  const r = Number(rate);
  if (code === 'ETB' || !Number.isFinite(r) || r <= 0 || r === 1) {
    return Math.abs(amountEtb);
  }
  return Math.abs(amountEtb) * r;
}

/** True when live wallet credit covers `total` (total already in display currency). */
export function isWalletBalanceSufficient(
  amountEtb: number,
  totalDisplay: number,
  currencyCode?: string | null,
  rate?: number | null
): boolean {
  const available = walletAmountInDisplayCurrency(amountEtb, currencyCode, rate);
  const need = Number(totalDisplay);
  if (!Number.isFinite(need) || need <= 0) return true;
  return available + 0.005 >= need;
}
