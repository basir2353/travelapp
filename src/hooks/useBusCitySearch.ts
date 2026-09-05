import { useEffect, useMemo, useState } from 'react';
import {
  bus1CityList,
  getBusFromToLocations,
  BusCityOption
} from '../services/guestApi';

type SearchState = {
  results: BusCityOption[];
  loading: boolean;
  error: string | null;
};

export type BusLocationField = 'from' | 'to';

type LocationCache = {
  from: BusCityOption[];
  to: BusCityOption[];
};

let cachedLocations: LocationCache | null = null;
let cachePromise: Promise<LocationCache> | null = null;

function mergeBusCities(...groups: BusCityOption[][]): BusCityOption[] {
  const seen = new Set<string>();
  return groups.flat().filter((city) => {
    const key = `${city.cityId}:${city.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function locationsForField(
  cache: LocationCache,
  field?: BusLocationField
): BusCityOption[] {
  if (field === 'from') return cache.from;
  if (field === 'to') return cache.to;
  return mergeBusCities(cache.from, cache.to);
}

async function loadBusLocations(): Promise<LocationCache> {
  try {
    const locations = await getBusFromToLocations();
    if (locations.from.length > 0 || locations.to.length > 0) {
      return {
        from: locations.from.length > 0 ? locations.from : locations.to,
        to: locations.to.length > 0 ? locations.to : locations.from
      };
    }
  } catch {
    // fall through to Bus1_CityList
  }

  const cities = await bus1CityList('');
  if (cities.length === 0) {
    throw new Error('No bus boarding or dropping locations returned');
  }
  return { from: cities, to: cities };
}

/** Prefetch GetBusBoarding / GetBusDropping so the picker opens with locations. */
export function warmBusCityCache(): Promise<BusCityOption[]> {
  return warmBusLocationCache().then((cache) =>
    mergeBusCities(cache.from, cache.to)
  );
}

function warmBusLocationCache(): Promise<LocationCache> {
  if (cachedLocations) return Promise.resolve(cachedLocations);
  if (!cachePromise) {
    cachePromise = loadBusLocations().
    then((cache) => {
      cachedLocations = cache;
      return cache;
    }).
    catch((err) => {
      cachePromise = null;
      throw err;
    });
  }
  return cachePromise;
}

function filterCities(cities: BusCityOption[], query: string): BusCityOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return cities;
  return cities.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.cityId.toLowerCase().includes(q) ||
      (c.detail || '').toLowerCase().includes(q) ||
      (c.searchName || '').toLowerCase().includes(q)
  );
}

/**
 * Bus From/To picker — From = GetBusBoarding, To = GetBusDropping.
 * Shows the cached list immediately (no “Searching…” flash).
 */
export function useBusCitySearch(
  query: string,
  enabled: boolean,
  field?: BusLocationField
) {
  const [cache, setCache] = useState<LocationCache | null>(
    () => cachedLocations
  );
  const [loading, setLoading] = useState(() => enabled && !cachedLocations);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      return;
    }

    if (cachedLocations) {
      setCache(cachedLocations);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(!cache);
    setError(null);

    warmBusLocationCache().
    then((next) => {
      if (cancelled) return;
      setCache(next);
      setLoading(false);
    }).
    catch((err) => {
      if (cancelled) return;
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Location search failed');
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const allCities = useMemo(
    () => (cache ? locationsForField(cache, field) : []),
    [cache, field]
  );

  const results = useMemo(
    () => filterCities(allCities, query),
    [allCities, query]
  );

  const state: SearchState = {
    results,
    loading: loading && results.length === 0 && allCities.length === 0,
    error
  };

  return state;
}

// Warm cache as soon as the module loads (home / travel screens)
void warmBusCityCache().catch(() => {
  /* ignore warm failures — picker will retry on open */
});
