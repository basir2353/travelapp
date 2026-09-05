import { useEffect, useState } from 'react';
import {
  hotelGetCitiesAutocomplete,
  POPULAR_HOTEL_CITIES,
  type HotelCityOption
} from '../services/guestApi';

type SearchState = {
  results: HotelCityOption[];
  loading: boolean;
  error: string | null;
  /** True when showing curated hubs (sheet just opened / empty query). */
  isPopular: boolean;
};

/** Keep recent typed searches so retyping the same city is instant. */
const cityCache = new Map<string, HotelCityOption[]>();

function cacheKey(cityName: string): string {
  return cityName.trim();
}

/**
 * HotelGetCitiesAutocomplete for Destination — same flow as flight airports:
 * empty query → popular cities; type to search GuestAPI.
 */
export function useHotelCitiesAutocomplete(query: string, enabled: boolean) {
  const typed = query.trim();
  const useApi = typed.length >= 1;
  const key = useApi ? cacheKey(typed) : '';

  const [state, setState] = useState<SearchState>(() => ({
    results: POPULAR_HOTEL_CITIES,
    loading: false,
    error: null,
    isPopular: true
  }));

  useEffect(() => {
    if (!enabled) return;

    if (!useApi) {
      setState({
        results: POPULAR_HOTEL_CITIES,
        loading: false,
        error: null,
        isPopular: true
      });
      return;
    }

    const cached = cityCache.get(key);
    if (cached) {
      setState({
        results: cached,
        loading: false,
        error: null,
        isPopular: false
      });
      return;
    }

    setState({
      results: [],
      loading: true,
      error: null,
      isPopular: false
    });

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const results = await hotelGetCitiesAutocomplete(typed);
        if (cancelled) return;
        cityCache.set(key, results);
        setState({
          results,
          loading: false,
          error: null,
          isPopular: false
        });
      } catch (err) {
        if (cancelled) return;
        setState({
          results: [],
          loading: false,
          error: err instanceof Error ? err.message : 'City search failed',
          isPopular: false
        });
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, enabled, useApi, key, typed]);

  return state;
}
