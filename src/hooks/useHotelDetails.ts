import { useEffect, useState } from 'react';
import { hotel2HotelDetails, type HotelDetailsResult } from '../services/guestApi';

type HotelDetailsState = HotelDetailsResult & {
  loading: boolean;
  error: string | null;
};

const EMPTY: HotelDetailsState = {
  details: null,
  images: [],
  facilities: [],
  roomTypes: [],
  extras: [],
  loading: false,
  error: null,
  apiMessage: undefined
};

type Params = {
  checkInDate: string;
  checkOutDate: string;
  selectHotelJson: string;
  roomCount?: number;
  adultCount?: number;
  childCount?: number;
  currencyCode?: string;
  currencyValue?: number;
  enabled: boolean;
  fetchToken?: number;
};

export function useHotelDetails({
  checkInDate,
  checkOutDate,
  selectHotelJson,
  roomCount = 1,
  adultCount = 1,
  childCount = 0,
  currencyCode = 'ETB',
  currencyValue = 1,
  enabled,
  fetchToken = 0
}: Params) {
  const [state, setState] = useState<HotelDetailsState>(EMPTY);

  useEffect(() => {
    if (!enabled || !selectHotelJson || selectHotelJson === '[]') {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({
      details: null,
      images: [],
      facilities: [],
      roomTypes: [],
      extras: [],
      loading: true,
      error: null,
      apiMessage: undefined
    });

    hotel2HotelDetails({
      checkInDate,
      checkOutDate,
      selectHotelJson,
      roomCount,
      adultCount,
      childCount,
      currencyCode,
      currencyValue,
      defaultCurrencyValue: currencyValue
    }).
    then((result) => {
      if (cancelled) return;
      setState({
        ...result,
        loading: false,
        error: null
      });
    }).
    catch((err) => {
      if (cancelled) return;
      setState({
        details: null,
        images: [],
        facilities: [],
        roomTypes: [],
        extras: [],
        loading: false,
        error:
          err instanceof Error ? err.message : 'Failed to load hotel details',
        apiMessage: undefined
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    checkInDate,
    checkOutDate,
    selectHotelJson,
    roomCount,
    adultCount,
    childCount,
    currencyCode,
    currencyValue,
    enabled,
    fetchToken
  ]);

  return state;
}
