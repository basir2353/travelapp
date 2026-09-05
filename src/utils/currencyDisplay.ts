/** Flag emoji for common GuestAPI currency codes (GetAllCurrency has no flag field). */
const CURRENCY_FLAGS: Record<string, string> = {
  ETB: '🇪🇹',
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  AED: '🇦🇪',
  KES: '🇰🇪',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  BRL: '🇧🇷',
  EGP: '🇪🇬',
  INR: '🇮🇳',
  NGN: '🇳🇬',
  OMR: '🇴🇲',
  MUR: '🇲🇺',
  LKR: '🇱🇰',
  JPY: '🇯🇵',
  CNY: '🇨🇳',
  ZAR: '🇿🇦',
  SAR: '🇸🇦',
  QAR: '🇶🇦',
  KWD: '🇰🇼',
  BHD: '🇧🇭',
  CHF: '🇨🇭',
  SEK: '🇸🇪',
  NOK: '🇳🇴',
  DKK: '🇩🇰',
  SGD: '🇸🇬',
  HKD: '🇭🇰',
  NZD: '🇳🇿',
  PKR: '🇵🇰',
  THB: '🇹🇭',
  TRY: '🇹🇷'
};

export function currencyFlagEmoji(code: string): string {
  const normalized = String(code || '')
    .trim()
    .toUpperCase();
  return CURRENCY_FLAGS[normalized] || '💱';
}

/** ETB first, then alphabetical by code. */
export function sortGuestCurrencies<T extends { code: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.code === 'ETB') return -1;
    if (b.code === 'ETB') return 1;
    return a.code.localeCompare(b.code);
  });
}
