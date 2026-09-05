import { useEffect, useRef, useState } from 'react';
import { bus1List, getBus } from '../services/guestApi';
import { Trip } from '../components/travel/ethioTravelData';

type BusListState = {
  trips: Trip[];
  loading: boolean;
  error: string | null;
};

const EMPTY: BusListState = {
  trips: [],
  loading: false,
  error: null
};

type Params = {
  origin: string;
  destination: string;
  travelDate: string;
  fromLabel: string;
  toLabel: string;
  currencyCode?: string;
  currencyRate?: number;
  /** Wait until exchange rate matches selected currency (avoids AUD + rate 1 → 5600). */
  currencyReady?: boolean;
  enabled: boolean;
  searchToken?: number;
};

export function useBusList({
  origin,
  destination,
  travelDate,
  fromLabel,
  toLabel,
  currencyCode = 'ETB',
  currencyRate = 1,
  currencyReady = true,
  enabled,
  searchToken = 0
}: Params) {
  const [state, setState] = useState<BusListState>(EMPTY);
  const paramsRef = useRef({
    origin,
    destination,
    travelDate,
    fromLabel,
    toLabel,
    currencyCode,
    currencyRate
  });
  paramsRef.current = {
    origin,
    destination,
    travelDate,
    fromLabel,
    toLabel,
    currencyCode,
    currencyRate
  };

  useEffect(() => {
    const p = paramsRef.current;
    const originId = String(p.origin || '').trim();
    const destId = String(p.destination || '').trim();
    const numericIds = /^\d+$/.test(originId) && /^\d+$/.test(destId);

    if (!enabled || searchToken === 0 || !originId || !destId || !p.travelDate) {
      setState(EMPTY);
      return;
    }

    if (!currencyReady) {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      return;
    }

    let cancelled = false;
    setState({ trips: [], loading: true, error: null });

    const run = numericIds ?
      bus1List({
        origin: originId,
        destination: destId,
        travelDate: p.travelDate,
        fromLabel: p.fromLabel,
        toLabel: p.toLabel,
        currencyCode: p.currencyCode,
        currencyRate: p.currencyRate
      }) :
      Promise.reject(new Error('Select bus cities from the list'));

    run.
    then(async (result) => {
      if (result.trips.length > 0) return result;
      return getBus(p.fromLabel || originId, p.toLabel || destId);
    }).
    then(({ trips }) => {
      if (!cancelled) {
        setState({ trips, loading: false, error: null });
      }
    }).
    catch(async (legacyErr) => {
      try {
        const fallback = await getBus(p.fromLabel || originId, p.toLabel || destId);
        if (!cancelled) {
          setState({
            trips: fallback.trips,
            loading: false,
            error: fallback.trips.length ? null : (legacyErr instanceof Error ? legacyErr.message : 'Failed to load buses')
          });
        }
      } catch {
        const err = legacyErr;
        if (!cancelled) {
          setState({
            trips: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load buses'
          });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, searchToken, currencyCode, currencyRate, currencyReady]);

  return state;
}
