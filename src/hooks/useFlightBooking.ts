import { useEffect, useRef, useState } from 'react';
import {
  getBookingDetails,
  type FlightBookingResult
} from '../services/guestApi';

type FlightBookingState = FlightBookingResult & {
  loading: boolean;
  error: string | null;
};

const EMPTY: FlightBookingState = {
  details: [],
  bookingDetail: null,
  pricing: null,
  loading: false,
  error: null,
  apiMessage: undefined,
  fareRulesHtml: undefined
};

type Params = {
  traceId: string;
  tripType: string;
  contentSource: string;
  jsonstring: string;
  enabled: boolean;
  fetchToken?: number;
  adultCount?: number;
  childrenCount?: number;
  infantCount?: number;
  currencyCode?: string;
  currencyValue?: number;
};

export function useFlightBooking({
  traceId,
  tripType,
  contentSource,
  jsonstring,
  enabled,
  fetchToken = 0,
  adultCount = 1,
  childrenCount = 0,
  infantCount = 0,
  currencyCode = 'ETB',
  currencyValue = 1
}: Params) {
  const [state, setState] = useState<FlightBookingState>(EMPTY);

  const paramsRef = useRef({
    traceId,
    tripType,
    contentSource,
    jsonstring,
    adultCount,
    childrenCount,
    infantCount,
    currencyCode,
    currencyValue
  });
  paramsRef.current = {
    traceId,
    tripType,
    contentSource,
    jsonstring,
    adultCount,
    childrenCount,
    infantCount,
    currencyCode,
    currencyValue
  };

  useEffect(() => {
    const params = paramsRef.current;

    if (!enabled || fetchToken === 0 || !params.jsonstring) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({
      details: [],
      bookingDetail: null,
      pricing: null,
      loading: true,
      error: null,
      apiMessage: undefined,
      fareRulesHtml: undefined
    });

    getBookingDetails({
      traceId: params.traceId,
      tripType: params.tripType,
      contentSource: params.contentSource,
      jsonstring: params.jsonstring,
      adultCount: params.adultCount,
      childrenCount: params.childrenCount,
      infantCount: params.infantCount,
      currencyCode: params.currencyCode,
      currencyValue: params.currencyValue,
      flightMarkup: 0
    }).
    then((result) => {
      if (cancelled) return;
      const fareFailed =
        !result.pricing &&
        !result.bookingDetail &&
        result.details.length === 0;
      setState({
        ...result,
        loading: false,
        error: fareFailed ?
          result.apiMessage || 'Fare check failed. Reselect the flight and try again.' :
          null
      });
    }).
    catch((err) => {
      if (cancelled) return;
      setState({
        details: [],
        bookingDetail: null,
        pricing: null,
        loading: false,
        error:
          err instanceof Error ? err.message : 'Failed to load booking details',
        apiMessage: undefined,
        fareRulesHtml: undefined
      });
    });

    return () => {
      cancelled = true;
    };
    // Only re-run when fetchToken changes — not when jsonstring is rebuilt each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetchToken]);

  return state;
}
