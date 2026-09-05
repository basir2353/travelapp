/** Common international dial codes for signup / login phone fields. */

export type DialCodeOption = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
  /** Expected national number length (without trunk 0). */
  localLength: number;
};

export const DIAL_CODE_OPTIONS: DialCodeOption[] = [
  { iso: 'ET', name: 'Ethiopia', dial: '251', flag: '🇪🇹', localLength: 9 },
  { iso: 'PK', name: 'Pakistan', dial: '92', flag: '🇵🇰', localLength: 10 },
  { iso: 'KE', name: 'Kenya', dial: '254', flag: '🇰🇪', localLength: 9 },
  { iso: 'UG', name: 'Uganda', dial: '256', flag: '🇺🇬', localLength: 9 },
  { iso: 'TZ', name: 'Tanzania', dial: '255', flag: '🇹🇿', localLength: 9 },
  { iso: 'SO', name: 'Somalia', dial: '252', flag: '🇸🇴', localLength: 8 },
  { iso: 'DJ', name: 'Djibouti', dial: '253', flag: '🇩🇯', localLength: 8 },
  { iso: 'SD', name: 'Sudan', dial: '249', flag: '🇸🇩', localLength: 9 },
  { iso: 'EG', name: 'Egypt', dial: '20', flag: '🇪🇬', localLength: 10 },
  { iso: 'AE', name: 'United Arab Emirates', dial: '971', flag: '🇦🇪', localLength: 9 },
  { iso: 'SA', name: 'Saudi Arabia', dial: '966', flag: '🇸🇦', localLength: 9 },
  { iso: 'US', name: 'United States', dial: '1', flag: '🇺🇸', localLength: 10 },
  { iso: 'GB', name: 'United Kingdom', dial: '44', flag: '🇬🇧', localLength: 10 },
  { iso: 'IN', name: 'India', dial: '91', flag: '🇮🇳', localLength: 10 },
  { iso: 'CN', name: 'China', dial: '86', flag: '🇨🇳', localLength: 11 },
  { iso: 'TR', name: 'Türkiye', dial: '90', flag: '🇹🇷', localLength: 10 },
  { iso: 'DE', name: 'Germany', dial: '49', flag: '🇩🇪', localLength: 10 },
  { iso: 'FR', name: 'France', dial: '33', flag: '🇫🇷', localLength: 9 },
  { iso: 'NG', name: 'Nigeria', dial: '234', flag: '🇳🇬', localLength: 10 },
  { iso: 'ZA', name: 'South Africa', dial: '27', flag: '🇿🇦', localLength: 9 },
  { iso: 'RW', name: 'Rwanda', dial: '250', flag: '🇷🇼', localLength: 9 }
];

export function findDialOption(dialOrIso: string): DialCodeOption {
  const key = String(dialOrIso || '').replace(/\D/g, '');
  const iso = String(dialOrIso || '').toUpperCase();
  return (
    DIAL_CODE_OPTIONS.find((o) => o.dial === key) ||
    DIAL_CODE_OPTIONS.find((o) => o.iso === iso) ||
    DIAL_CODE_OPTIONS[0]
  );
}

/**
 * Build E.164-ish mobile: +{dial}{national without trunk 0}.
 */
export function buildInternationalMobile(
  dialCode: string,
  nationalNumber: string
): string {
  const dial = String(dialCode || '251').replace(/\D/g, '') || '251';
  let local = String(nationalNumber || '').replace(/\D/g, '');
  while (local.startsWith('0')) local = local.slice(1);
  // Avoid doubling country code if user pasted full international
  if (local.startsWith(dial) && local.length > dial.length + 6) {
    local = local.slice(dial.length);
  }
  if (!local) return '';
  return `+${dial}${local}`;
}
