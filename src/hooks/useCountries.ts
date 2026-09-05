import { useEffect, useState } from 'react';
import { getCountry, GuestCountryOption } from '../services/guestApi';

type CountriesState = {
  countries: GuestCountryOption[];
  loading: boolean;
  error: string | null;
  fromFallback: boolean;
};

const EMPTY: CountriesState = {
  countries: [],
  loading: false,
  error: null,
  fromFallback: false
};

let cachedCountries: GuestCountryOption[] | null = null;

/** Load countries from GetCountry whenever `enabled` is true (e.g. picker opened). */
export function useCountries(enabled = true) {
  const [state, setState] = useState<CountriesState>(() =>
  cachedCountries ?
  {
    countries: cachedCountries,
    loading: false,
    error: null,
    fromFallback: cachedCountries.length <= FALLBACK_COUNTRY_COUNT
  } :
  EMPTY
  );

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setState((prev) => ({
      countries: prev.countries.length > 0 ? prev.countries : cachedCountries ?? [],
      loading: true,
      error: null,
      fromFallback: false
    }));

    getCountry().
    then((countries) => {
      if (cancelled) return;
      cachedCountries = countries;
      const fromFallback = countries.length <= FALLBACK_COUNTRY_COUNT;
      setState({
        countries,
        loading: false,
        error: null,
        fromFallback
      });
    }).
    catch((err) => {
      if (cancelled) return;
      setState((prev) => ({
        countries: prev.countries.length > 0 ? prev.countries : cachedCountries ?? [],
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load countries',
        fromFallback: false
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}

const FALLBACK_COUNTRY_COUNT = 8;
