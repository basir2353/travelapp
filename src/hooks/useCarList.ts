import { useEffect, useRef, useState } from 'react';
import { car1List } from '../services/guestApi';
import { CarRental } from '../components/travel/ethioTravelData';

type CarListState = {
  cars: CarRental[];
  loading: boolean;
  error: string | null;
  apiMessage: string | null;
  fromFallback?: boolean;
};

const EMPTY: CarListState = {
  cars: [],
  loading: false,
  error: null,
  apiMessage: null,
  fromFallback: false
};

type Params = {
  pickupLocation: string;
  returnLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  currencyCode: string;
  defaultCurrencyValue: number;
  enabled: boolean;
  searchToken?: number;
};

export function useCarList({
  pickupLocation,
  returnLocation,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  currencyCode,
  defaultCurrencyValue,
  enabled,
  searchToken = 0
}: Params) {
  const [state, setState] = useState<CarListState>(EMPTY);
  const paramsRef = useRef({
    pickupLocation,
    returnLocation,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    currencyCode,
    defaultCurrencyValue
  });
  paramsRef.current = {
    pickupLocation,
    returnLocation,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    currencyCode,
    defaultCurrencyValue
  };

  useEffect(() => {
    const p = paramsRef.current;

    if (!enabled || searchToken === 0) {
      setState(EMPTY);
      return;
    }

    if (!p.pickupLocation || !p.returnLocation || !p.pickupDate || !p.returnDate) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({ cars: [], loading: true, error: null, apiMessage: null, fromFallback: false });

    car1List({
      pickupLocation: p.pickupLocation,
      returnLocation: p.returnLocation,
      pickupDate: p.pickupDate,
      pickupTime: p.pickupTime,
      returnDate: p.returnDate,
      returnTime: p.returnTime,
      currencyCode: p.currencyCode,
      defaultCurrencyValue: p.defaultCurrencyValue
    }).
    then(({ cars, apiMessage, fromFallback }) => {
      if (!cancelled) {
        setState({
          cars,
          loading: false,
          error: null,
          apiMessage: apiMessage ?? null,
          fromFallback: fromFallback ?? false
        });
      }
    }).
    catch((err) => {
      if (!cancelled) {
        setState({
          cars: [],
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load cars',
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
