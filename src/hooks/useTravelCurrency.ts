import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAllCurrency,
  getCurrencyExchangeRate,
  FALLBACK_CURRENCIES,
  type GuestCurrency
} from '../services/guestApi/currency';

export const SOURCE_CURRENCY = 'ETB';
const ENABLED_KEY = 'mkash-travel-currency-enabled';
const SELECTED_KEY = 'mkash-travel-currency-code';
const PREFERENCE_KEY = 'mkash-travel-currency-preference';

type PreferenceMode = 'source' | 'auto' | 'manual';

type TravelCurrencyPreference = {
  mode: PreferenceMode;
  code: string;
  countryCode?: string;
  inferredFrom?: 'locale';
  updatedAt: number;
};

/** ISO country → GuestAPI-supported display currency. */
const COUNTRY_CURRENCY: Record<string, string> = {
  ET: 'ETB',
  KE: 'KES',
  AE: 'AED',
  US: 'USD',
  GB: 'GBP',
  AU: 'AUD',
  CA: 'CAD',
  EG: 'EGP',
  IN: 'INR',
  NG: 'NGN',
  OM: 'OMR',
  MU: 'MUR',
  LK: 'LKR',
  BR: 'BRL',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  IE: 'EUR',
  PT: 'EUR',
  FI: 'EUR'
};

export function normalizeCurrencyCode(code?: string | null): string {
  const normalized = String(code || '')
    .trim()
    .toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : SOURCE_CURRENCY;
}

export function normalizeCurrencyValue(value?: number | string | null): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** GuestAPI never returns a real 1:1 rate for non-ETB — treat that as invalid. */
export function isValidExchangeRate(
  code?: string | null,
  rate?: number | string | null
): boolean {
  const normalized = normalizeCurrencyCode(code);
  const safe = normalizeCurrencyValue(rate);
  if (normalized === SOURCE_CURRENCY) return true;
  return safe > 0 && safe !== 1;
}

function resetToSourcePreference(
  countryCode?: string,
  inferredFrom?: TravelCurrencyPreference['inferredFrom']
): TravelCurrencyPreference {
  const pref: TravelCurrencyPreference = {
    mode: 'source',
    code: SOURCE_CURRENCY,
    countryCode,
    inferredFrom,
    updatedAt: Date.now()
  };
  try {
    localStorage.setItem(ENABLED_KEY, 'false');
    localStorage.setItem(SELECTED_KEY, SOURCE_CURRENCY);
  } catch {
    // Storage can be unavailable in private WebViews.
  }
  writePreference(pref);
  return pref;
}

function readEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

function readSelectedCode(): string {
  try {
    return normalizeCurrencyCode(localStorage.getItem(SELECTED_KEY));
  } catch {
    return SOURCE_CURRENCY;
  }
}

function readPreference(): TravelCurrencyPreference | null {
  try {
    const raw = localStorage.getItem(PREFERENCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TravelCurrencyPreference;
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.mode !== 'source' && parsed.mode !== 'auto' && parsed.mode !== 'manual') {
      return null;
    }
    return {
      mode: parsed.mode,
      code: normalizeCurrencyCode(parsed.code),
      countryCode: parsed.countryCode,
      inferredFrom: parsed.inferredFrom === 'locale' ? 'locale' : undefined,
      updatedAt: Number(parsed.updatedAt) || Date.now()
    };
  } catch {
    return null;
  }
}

function writePreference(pref: TravelCurrencyPreference) {
  try {
    localStorage.setItem(PREFERENCE_KEY, JSON.stringify(pref));
  } catch {
    // Storage can be unavailable in private WebViews.
  }
}

function migrateLegacyPreference(): TravelCurrencyPreference | null {
  const existing = readPreference();
  if (existing) return existing;

  let enabledRaw: string | null = null;
  let selectedRaw: string | null = null;
  try {
    enabledRaw = localStorage.getItem(ENABLED_KEY);
    selectedRaw = localStorage.getItem(SELECTED_KEY);
  } catch {
    return null;
  }

  // No legacy keys → allow first-run auto detection.
  if (enabledRaw === null && selectedRaw === null) return null;

  const enabled = enabledRaw === 'true';
  const code = normalizeCurrencyCode(selectedRaw);
  const pref: TravelCurrencyPreference = enabled ?
    {
      mode: 'manual',
      code,
      updatedAt: Date.now()
    } :
    {
      mode: 'source',
      code: SOURCE_CURRENCY,
      updatedAt: Date.now()
    };
  writePreference(pref);
  return pref;
}

function detectLocaleCountry(): string | null {
  try {
    const locales = [
      ...(Array.isArray(navigator.languages) ? navigator.languages : []),
      navigator.language
    ].filter(Boolean);

    for (const locale of locales) {
      try {
        const region = new Intl.Locale(locale).maximize().region;
        if (region && /^[A-Za-z]{2}$/.test(region)) {
          return region.toUpperCase();
        }
      } catch {
        // Fall through to tag parsing.
      }
      const match = String(locale).match(/[-_]([A-Za-z]{2})\b/);
      if (match?.[1]) return match[1].toUpperCase();
    }
  } catch {
    // Ignore locale detection failures.
  }
  return null;
}

/** Map ISO country (e.g. AU) → display currency (e.g. AUD). */
export function currencyCodeForCountryIso(
  countryCode?: string | null
): string {
  const iso = String(countryCode || '')
    .trim()
    .toUpperCase();
  if (!iso) return SOURCE_CURRENCY;
  return normalizeCurrencyCode(COUNTRY_CURRENCY[iso] || SOURCE_CURRENCY);
}

/** Persist + return display currency for a signup country ISO (ET→ETB, AU→AUD). */
export function applyCurrencyFromSignupCountry(
  countryIso?: string | null
): string {
  const iso = String(countryIso || '')
    .trim()
    .toUpperCase();
  const currency = currencyCodeForCountryIso(iso || 'ET');
  try {
    if (currency === SOURCE_CURRENCY) {
      localStorage.setItem(ENABLED_KEY, 'false');
      localStorage.setItem(SELECTED_KEY, SOURCE_CURRENCY);
      writePreference({
        mode: 'source',
        code: SOURCE_CURRENCY,
        countryCode: iso || 'ET',
        updatedAt: Date.now()
      });
    } else {
      localStorage.setItem(ENABLED_KEY, 'true');
      localStorage.setItem(SELECTED_KEY, currency);
      writePreference({
        mode: 'manual',
        code: currency,
        countryCode: iso || undefined,
        updatedAt: Date.now()
      });
    }
  } catch {
    // Storage can be unavailable in private WebViews.
  }
  return currency;
}

/** Persist a user-picked display currency (signup preferences, settings). */
export function applyTravelCurrencyPreference(code?: string | null): string {
  const normalized = normalizeCurrencyCode(code);
  if (normalized === SOURCE_CURRENCY) {
    return applyCurrencyFromSignupCountry('ET');
  }
  try {
    localStorage.setItem(ENABLED_KEY, 'true');
    localStorage.setItem(SELECTED_KEY, normalized);
    writePreference({
      mode: 'manual',
      code: normalized,
      updatedAt: Date.now()
    });
  } catch {
    // Storage can be unavailable in private WebViews.
  }
  return normalized;
}

function currencyForCountry(
  countryCode: string | null,
  supported: GuestCurrency[]
): string | null {
  if (!countryCode) return null;
  const mapped = COUNTRY_CURRENCY[countryCode];
  if (!mapped) return null;
  const code = normalizeCurrencyCode(mapped);
  if (code === SOURCE_CURRENCY) return code;
  const ok = supported.some((item) => item.code === code);
  return ok ? code : null;
}

export function useTravelCurrency() {
  const [preference, setPreference] = useState<TravelCurrencyPreference | null>(
    () => migrateLegacyPreference()
  );
  const [enabled, setEnabledState] = useState(() => {
    const pref = migrateLegacyPreference();
    if (pref) return pref.mode === 'auto' || pref.mode === 'manual';
    return readEnabled();
  });
  const [selectedCode, setSelectedCodeState] = useState(() => {
    const pref = migrateLegacyPreference();
    if (pref && (pref.mode === 'auto' || pref.mode === 'manual')) {
      return pref.code;
    }
    return readSelectedCode();
  });
  const [currencies, setCurrencies] = useState<GuestCurrency[]>(FALLBACK_CURRENCIES);
  const [rate, setRate] = useState(1);
  const [loadedRateCode, setLoadedRateCode] = useState(SOURCE_CURRENCY);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoHint, setAutoHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Soft refresh — picker already has FALLBACK_CURRENCIES so it never blocks.
    setLoadingCurrencies(true);
    getAllCurrency()
      .then((items) => {
        if (cancelled) return;
        setCurrencies(items.length > 0 ? items : FALLBACK_CURRENCIES);
        setLoadingCurrencies(false);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setCurrencies(FALLBACK_CURRENCIES);
        setLoadingCurrencies(false);
        setError('Using offline currency list');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // First-run auto default from device locale — never overrides saved preference.
  useEffect(() => {
    if (loadingCurrencies || preference) return;

    const countryCode = detectLocaleCountry();
    const localCode = currencyForCountry(countryCode, currencies);
    if (!localCode || localCode === SOURCE_CURRENCY) {
      const sourcePref: TravelCurrencyPreference = {
        mode: 'source',
        code: SOURCE_CURRENCY,
        countryCode: countryCode || undefined,
        inferredFrom: countryCode ? 'locale' : undefined,
        updatedAt: Date.now()
      };
      writePreference(sourcePref);
      setPreference(sourcePref);
      return;
    }

    let cancelled = false;
    setLoadingRate(true);
    getCurrencyExchangeRate(localCode)
      .then((value) => {
        if (cancelled) return;
        // Signup country (or manual pick) may have locked currency while this loaded.
        const existing = readPreference();
        if (existing) return;
        const safe = normalizeCurrencyValue(value);
        // Reject missing/suspicious 1:1 rates for non-source currencies.
        if (!isValidExchangeRate(localCode, safe)) {
          const sourcePref = resetToSourcePreference(
            countryCode || undefined,
            'locale'
          );
          writePreference(sourcePref);
          setPreference(sourcePref);
          setLoadingRate(false);
          return;
        }
        const autoPref: TravelCurrencyPreference = {
          mode: 'auto',
          code: localCode,
          countryCode: countryCode || undefined,
          inferredFrom: 'locale',
          updatedAt: Date.now()
        };
        writePreference(autoPref);
        try {
          localStorage.setItem(SELECTED_KEY, localCode);
          localStorage.setItem(ENABLED_KEY, 'true');
        } catch {
          // ignore
        }
        setPreference(autoPref);
        setSelectedCodeState(localCode);
        setEnabledState(true);
        setRate(safe);
        setLoadedRateCode(localCode);
        setLoadingRate(false);
        setAutoHint(`Detected local currency · ${localCode}`);
      })
      .catch(() => {
        if (cancelled) return;
        if (readPreference()) return;
        const sourcePref: TravelCurrencyPreference = {
          mode: 'source',
          code: SOURCE_CURRENCY,
          countryCode: countryCode || undefined,
          inferredFrom: 'locale',
          updatedAt: Date.now()
        };
        writePreference(sourcePref);
        setPreference(sourcePref);
        setLoadingRate(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currencies, loadingCurrencies, preference]);

  const activeCode = normalizeCurrencyCode(
    enabled ? selectedCode : SOURCE_CURRENCY
  );

  useEffect(() => {
    let cancelled = false;
    if (activeCode === SOURCE_CURRENCY) {
      setRate(1);
      setLoadedRateCode(SOURCE_CURRENCY);
      setLoadingRate(false);
      setError(null);
      return;
    }

    setLoadingRate(true);
    setError(null);
    getCurrencyExchangeRate(activeCode)
      .then((value) => {
        if (cancelled) return;
        const safe = normalizeCurrencyValue(value);
        if (!isValidExchangeRate(activeCode, safe)) {
          // Keep wallet/labels in ETB instead of painting a fake 1:1 AUD/USD amount.
          const sourcePref = resetToSourcePreference(preference?.countryCode);
          setPreference(sourcePref);
          setEnabledState(false);
          setSelectedCodeState(SOURCE_CURRENCY);
          setRate(1);
          setLoadedRateCode(SOURCE_CURRENCY);
          setLoadingRate(false);
          setError(`Exchange rate unavailable for ${activeCode}`);
          return;
        }
        setRate(safe);
        setLoadedRateCode(activeCode);
        setLoadingRate(false);
      })
      .catch((err) => {
        if (cancelled) return;
        const sourcePref = resetToSourcePreference(preference?.countryCode);
        setPreference(sourcePref);
        setEnabledState(false);
        setSelectedCodeState(SOURCE_CURRENCY);
        setRate(1);
        setLoadedRateCode(SOURCE_CURRENCY);
        setLoadingRate(false);
        setError(
          err instanceof Error ? err.message : 'Could not load exchange rate'
        );
      });
    return () => {
      cancelled = true;
    };
  }, [activeCode, preference?.countryCode]);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    try {
      localStorage.setItem(ENABLED_KEY, String(value));
    } catch {
      // Storage can be unavailable in private WebViews.
    }
    const next: TravelCurrencyPreference = value ?
      {
        mode: preference?.mode === 'auto' ? 'auto' : 'manual',
        code: normalizeCurrencyCode(selectedCode),
        countryCode: preference?.countryCode,
        inferredFrom: preference?.inferredFrom,
        updatedAt: Date.now()
      } :
      {
        mode: 'source',
        code: SOURCE_CURRENCY,
        countryCode: preference?.countryCode,
        inferredFrom: preference?.inferredFrom,
        updatedAt: Date.now()
      };
    writePreference(next);
    setPreference(next);
  }, [preference?.countryCode, preference?.inferredFrom, preference?.mode, selectedCode]);

  const selectCurrency = useCallback((code: string) => {
    const normalized = normalizeCurrencyCode(code);
    setAutoHint(null);
    // Mark rate as loading immediately so consumers (e.g. Bus1_List) do not
    // fire one frame with Currency=AUD + Currencyrate=1 (ETB fare, wrong label).
    if (normalized === SOURCE_CURRENCY) {
      setSelectedCodeState(SOURCE_CURRENCY);
      setEnabledState(false);
      setRate(1);
      setLoadedRateCode(SOURCE_CURRENCY);
      setLoadingRate(false);
      setError(null);
      try {
        localStorage.setItem(SELECTED_KEY, SOURCE_CURRENCY);
        localStorage.setItem(ENABLED_KEY, 'false');
      } catch {
        // Storage can be unavailable in private WebViews.
      }
      const next = resetToSourcePreference(preference?.countryCode);
      setPreference(next);
      return;
    }

    setSelectedCodeState(normalized);
    setEnabledState(true);
    setLoadingRate(true);
    setError(null);
    try {
      localStorage.setItem(SELECTED_KEY, normalized);
      localStorage.setItem(ENABLED_KEY, 'true');
    } catch {
      // Storage can be unavailable in private WebViews.
    }
    const next: TravelCurrencyPreference = {
      mode: 'manual',
      code: normalized,
      countryCode: preference?.countryCode,
      updatedAt: Date.now()
    };
    writePreference(next);
    setPreference(next);
  }, [preference?.countryCode]);

  /** Lock UI currency to the country chosen at signup (Ethiopia→ETB, Australia→AUD). */
  const applyFromSignupCountry = useCallback((countryIso?: string | null) => {
    const currency = applyCurrencyFromSignupCountry(countryIso);
    setAutoHint(null);
    if (currency === SOURCE_CURRENCY) {
      setSelectedCodeState(SOURCE_CURRENCY);
      setEnabledState(false);
      setRate(1);
      setLoadedRateCode(SOURCE_CURRENCY);
      setLoadingRate(false);
      setError(null);
      setPreference({
        mode: 'source',
        code: SOURCE_CURRENCY,
        countryCode: String(countryIso || 'ET')
          .trim()
          .toUpperCase() || 'ET',
        updatedAt: Date.now()
      });
      return SOURCE_CURRENCY;
    }
    selectCurrency(currency);
    return currency;
  }, [selectCurrency]);

  const selectedCurrency = useMemo(
    () => currencies.find((item) => item.code === activeCode),
    [activeCode, currencies]
  );

  const rateMatchesActive =
    activeCode === SOURCE_CURRENCY || loadedRateCode === activeCode;
  const rawRate = normalizeCurrencyValue(
    activeCode === SOURCE_CURRENCY ? 1 : rateMatchesActive ? rate : 1
  );
  // While a foreign rate is loading/missing, expose ETB so wallet never shows
  // "AUD 1,000,335" for an ETB balance at a fake 1:1 rate.
  const rateReady =
    activeCode === SOURCE_CURRENCY ||
    (rateMatchesActive && isValidExchangeRate(activeCode, rawRate));
  const displayCode = rateReady ? activeCode : SOURCE_CURRENCY;
  const safeRate = normalizeCurrencyValue(
    displayCode === SOURCE_CURRENCY ? 1 : rawRate
  );
  const ready =
    displayCode === SOURCE_CURRENCY ||
    (!loadingRate && !error && rateReady && safeRate > 0);

  return {
    enabled: displayCode === SOURCE_CURRENCY ? false : enabled,
    setEnabled,
    selectCurrency,
    applyFromSignupCountry,
    currencies,
    code: displayCode,
    rate: safeRate,
    /** Ready for API calls — rate finished loading for non-source currencies. */
    ready,
    selectedCurrency,
    loadingCurrencies,
    loadingRate: loadingRate && activeCode !== SOURCE_CURRENCY,
    error,
    sourceCode: SOURCE_CURRENCY,
    preferenceMode:
      displayCode === SOURCE_CURRENCY ? 'source' : preference?.mode ?? 'source',
    autoHint,
    clearAutoHint: () => setAutoHint(null)
  };
}
