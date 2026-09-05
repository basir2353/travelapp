import { useEffect, useState } from 'react';
import {
  ensureAliasAirports,
  flightAirportAutocomplete,
  preferExactIataMatches,
  POPULAR_FLIGHT_AIRPORTS,
  type FlightAirportOption
} from '../services/guestApi';

type SearchState = {
  results: FlightAirportOption[];
  loading: boolean;
  error: string | null;
  /** True when showing curated hubs (sheet just opened / empty query). */
  isPopular: boolean;
};

/** Keep recent typed searches so retyping the same city is instant. */
const airportCache = new Map<string, FlightAirportOption[]>();

function cacheKey(empName: string): string {
  // Preserve API query semantics (GuestAPI sample uses "Add", "Du", etc.)
  return empName.trim();
}

function rankResults(
  raw: FlightAirportOption[],
  typed: string
): FlightAirportOption[] {
  return preferExactIataMatches(ensureAliasAirports(raw, typed), typed);
}

/**
 * FlightAirportAutocomplete for FROM / TO — mirror GuestAPI empName behaviour.
 * Typing "los" / "LOS" / "Lagos" prefers Lagos (NG), not Los Angeles (LAX).
 * Empty query → popular hubs only (includes Lagos).
 */
export function useFlightAirportAutocomplete(query: string, enabled: boolean) {
  const typed = query.trim();
  const useApi = typed.length >= 1;
  const key = useApi ? cacheKey(typed) : '';

  const [state, setState] = useState<SearchState>(() => ({
    results: POPULAR_FLIGHT_AIRPORTS,
    loading: false,
    error: null,
    isPopular: true
  }));

  useEffect(() => {
    if (!enabled) return;

    if (!useApi) {
      setState({
        results: POPULAR_FLIGHT_AIRPORTS,
        loading: false,
        error: null,
        isPopular: true
      });
      return;
    }

    const cached = airportCache.get(key);
    if (cached) {
      setState({
        results: cached,
        loading: false,
        error: null,
        isPopular: false
      });
      return;
    }

    // Clear previous query rows so stale "Du"/other cities do not linger.
    setState({
      results: [],
      loading: true,
      error: null,
      isPopular: false
    });

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const raw = await flightAirportAutocomplete(typed);
        const results = rankResults(raw, typed);
        if (cancelled) return;
        airportCache.set(key, results);
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
          error:
            err instanceof Error ? err.message : 'Airport search failed',
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
