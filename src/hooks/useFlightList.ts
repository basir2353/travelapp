import { useEffect, useRef, useState } from 'react';
import {
  getMultiwayList,
  getOnewayList,
  getRoundwayList,
  type MultiwayLeg
} from '../services/guestApi';
import type { FlightListItem } from '../services/guestApi/mapFlightToTrip';
import { Trip } from '../components/travel/ethioTravelData';

export type FlightListState = {
  trips: Trip[];
  raw: FlightListItem[];
  loading: boolean;
  error: string | null;
  apiMessage: string | null;
};

const EMPTY: FlightListState = {
  trips: [],
  raw: [],
  loading: false,
  error: null,
  apiMessage: null
};

type Params = {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  multiLegs?: MultiwayLeg[];
  tripType?: 'oneway' | 'round' | 'multi';
  fromLabel: string;
  toLabel: string;
  enabled: boolean;
  searchToken?: number;
  adultCount?: number;
  childrenCount?: number;
  infantCount?: number;
  cabinClass?: string;
  currencyCode?: string;
  currencyValue?: number;
};

export function useFlightList({
  origin,
  destination,
  departDate,
  returnDate,
  multiLegs,
  tripType = 'oneway',
  fromLabel,
  toLabel,
  enabled,
  searchToken = 0,
  adultCount = 1,
  childrenCount = 0,
  infantCount = 0,
  cabinClass = '2',
  currencyCode = 'ETB',
  currencyValue = 1
}: Params) {
  const [state, setState] = useState<FlightListState>(EMPTY);
  const paramsRef = useRef({
    origin,
    destination,
    departDate,
    returnDate,
    multiLegs,
    tripType,
    fromLabel,
    toLabel,
    adultCount,
    childrenCount,
    infantCount,
    cabinClass,
    currencyCode,
    currencyValue
  });
  paramsRef.current = {
    origin,
    destination,
    departDate,
    returnDate,
    multiLegs,
    tripType,
    fromLabel,
    toLabel,
    adultCount,
    childrenCount,
    infantCount,
    cabinClass,
    currencyCode,
    currencyValue
  };

  useEffect(() => {
    const p = paramsRef.current;
    const isRoundTrip = p.tripType === 'round';
    const isMultiTrip = p.tripType === 'multi';

    if (!enabled || searchToken === 0) {
      setState(EMPTY);
      return;
    }

    if (isMultiTrip) {
      if (!p.multiLegs || p.multiLegs.length < 2) {
        setState(EMPTY);
        return;
      }
      const invalidLeg = p.multiLegs.find(
        (leg) =>
          !leg.origin ||
          leg.origin.length < 2 ||
          !leg.destination ||
          leg.destination.length < 2 ||
          !leg.departDate
      );
      if (invalidLeg) {
        setState(EMPTY);
        return;
      }
    } else if (
      !p.origin ||
      !p.destination ||
      !p.departDate ||
      (isRoundTrip && !p.returnDate)
    ) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({ trips: [], raw: [], loading: true, error: null, apiMessage: null });

    const params = {
      origin: p.origin,
      destination: p.destination,
      departDate: p.departDate,
      fromLabel: p.fromLabel,
      toLabel: p.toLabel,
      adultCount: p.adultCount,
      childrenCount: p.childrenCount,
      infantCount: p.infantCount,
      cabinClass: p.cabinClass,
      currencyCode: p.currencyCode,
      currencyValue: p.currencyValue
    };

    const request =
      isMultiTrip && p.multiLegs ?
      getMultiwayList({
        legs: p.multiLegs,
        fromLabel: p.fromLabel,
        toLabel: p.toLabel,
        adultCount: p.adultCount,
        childrenCount: p.childrenCount,
        infantCount: p.infantCount,
        cabinClass: p.cabinClass,
        currencyCode: p.currencyCode,
        currencyValue: p.currencyValue
      }) :
      isRoundTrip && p.returnDate ?
      getRoundwayList({ ...params, returnDate: p.returnDate }) :
      getOnewayList(params);

    request.
    then(({ trips, raw, apiMessage }) => {
      if (!cancelled) {
        setState({
          trips,
          raw,
          loading: false,
          error: null,
          apiMessage: apiMessage ?? null
        });
      }
    }).
    catch((err) => {
      if (!cancelled) {
        setState({
          trips: [],
          raw: [],
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load flights',
          apiMessage: null
        });
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, searchToken]);

  return state;
}
