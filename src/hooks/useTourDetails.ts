import { useEffect, useState } from 'react';
import {
  tourGetDetails,
  type TourDetails,
  type TourDetailsResult
} from '../services/guestApi';

type TourDetailsState = {
  details: TourDetails | null;
  loading: boolean;
  error: string | null;
  apiMessage: string | null;
};

const EMPTY: TourDetailsState = {
  details: null,
  loading: false,
  error: null,
  apiMessage: null
};

type Params = {
  tourCode: string;
  fromDate: string;
  toDate: string;
  adultCount?: number;
  childCount?: number;
  currencyCode?: string;
  enabled: boolean;
  fetchToken?: number;
};

export function useTourDetails({
  tourCode,
  fromDate,
  toDate,
  adultCount = 1,
  childCount = 0,
  currencyCode = 'ETB',
  enabled,
  fetchToken = 0
}: Params) {
  const [state, setState] = useState<TourDetailsState>(EMPTY);

  useEffect(() => {
    if (!enabled || !tourCode || !fromDate || !toDate || fetchToken === 0) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({
      details: null,
      loading: true,
      error: null,
      apiMessage: null
    });

    tourGetDetails({
      tourCode,
      fromDate,
      toDate,
      adultCount,
      childCount,
      defaultCurrency: currencyCode
    }).
    then((result: TourDetailsResult) => {
      if (cancelled) return;
      setState({
        details: result.details,
        loading: false,
        error: result.details ? null : result.apiMessage || 'No tour details',
        apiMessage: result.apiMessage ?? null
      });
    }).
    catch((err: unknown) => {
      if (cancelled) return;
      setState({
        details: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load tour details',
        apiMessage: null
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    fetchToken,
    tourCode,
    fromDate,
    toDate,
    adultCount,
    childCount,
    currencyCode
  ]);

  return state;
}
