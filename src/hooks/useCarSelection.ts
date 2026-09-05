import { useEffect, useRef, useState } from 'react';
import {
  car2SelectCar,
  CAR_SELECT_DEFAULT_CURRENCY,
  CAR_SELECT_DEFAULT_MARKUP,
  type CarSelectResult
} from '../services/guestApi';

type CarSelectionState = CarSelectResult & {
  loading: boolean;
  error: string | null;
};

const EMPTY: CarSelectionState = {
  car: null,
  pricing: null,
  loading: false,
  error: null,
  apiMessage: undefined
};

type Params = {
  jsonSelectCar: string;
  defaultCurrency?: string;
  defaultCurrencyValue?: number;
  carMarkup?: number;
  enabled: boolean;
  fetchToken?: number;
};

export function useCarSelection({
  jsonSelectCar,
  defaultCurrency = CAR_SELECT_DEFAULT_CURRENCY,
  defaultCurrencyValue = 1,
  carMarkup = CAR_SELECT_DEFAULT_MARKUP,
  enabled,
  fetchToken = 0
}: Params) {
  const [state, setState] = useState<CarSelectionState>(EMPTY);

  // Keep latest params in refs so the fetch effect can read them without
  // re-firing. Car2_SelecCar must run once per fetchToken, not on every
  // render where jsonSelectCar happens to be rebuilt.
  const paramsRef = useRef({
    jsonSelectCar,
    defaultCurrency,
    defaultCurrencyValue,
    carMarkup
  });
  paramsRef.current = {
    jsonSelectCar,
    defaultCurrency,
    defaultCurrencyValue,
    carMarkup
  };

  useEffect(() => {
    const { jsonSelectCar: json, ...rest } = paramsRef.current;

    if (!enabled || fetchToken === 0 || !json) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({
      car: null,
      pricing: null,
      loading: true,
      error: null,
      apiMessage: undefined
    });

    car2SelectCar({
      defaultCurrency: rest.defaultCurrency,
      defaultCurrencyValue: rest.defaultCurrencyValue,
      carMarkup: rest.carMarkup,
      jsonSelectCar: json
    }).
    then((result) => {
      if (cancelled) return;
      const error =
        !result.pricing && result.apiMessage ?
        result.apiMessage :
        null;
      setState({
        ...result,
        loading: false,
        error
      });
    }).
    catch((err) => {
      if (cancelled) return;
      setState({
        car: null,
        pricing: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load car details',
        apiMessage: undefined
      });
    });

    return () => {
      cancelled = true;
    };
    // Only re-run when the user selects a new car (fetchToken) or toggles
    // enablement — NOT when jsonSelectCar is rebuilt on unrelated renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetchToken]);

  return state;
}
