import { useEffect, useRef, useState } from 'react';
import { bus2SelectSeat, BusSeatInfo } from '../services/guestApi';

type SeatLayoutState = {
  seats: BusSeatInfo[];
  loading: boolean;
  error: string | null;
  apiMessage: string | null;
};

const EMPTY: SeatLayoutState = {
  seats: [],
  loading: false,
  error: null,
  apiMessage: null
};

type Params = {
  jsonSelectBus: string;
  currencyCode?: string;
  currencyRate?: number | string;
  enabled: boolean;
  fetchToken?: number;
};

export function useBusSeatLayout({
  jsonSelectBus,
  currencyCode = 'ETB',
  currencyRate = 1,
  enabled,
  fetchToken = 0
}: Params) {
  const [state, setState] = useState<SeatLayoutState>(EMPTY);
  const requestRef = useRef({
    jsonSelectBus,
    currencyCode,
    currencyRate
  });
  requestRef.current = {
    jsonSelectBus,
    currencyCode,
    currencyRate
  };

  useEffect(() => {
    const request = requestRef.current;
    if (!enabled || fetchToken === 0 || !request.jsonSelectBus) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null, apiMessage: null }));

    bus2SelectSeat(request.jsonSelectBus, {
      currencyCode: request.currencyCode,
      currencyRate: request.currencyRate
    }).
    then(({ seats, apiMessage }) => {
      if (cancelled) return;
      setState({
        seats,
        loading: false,
        error: null,
        apiMessage: apiMessage ?? null
      });
    }).
    catch((err) => {
      if (cancelled) return;
      setState({
        seats: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load seats',
        apiMessage: null
      });
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, fetchToken]);

  return state;
}
