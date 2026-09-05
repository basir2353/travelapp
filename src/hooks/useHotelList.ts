import { useEffect, useRef, useState } from 'react';
import { hotel1List } from '../services/guestApi';
import { Hotel } from '../components/travel/ethioTravelData';
import type { HotelListItem } from '../services/guestApi/hotel';

type HotelListState = {
  hotels: Hotel[];
  raw: HotelListItem[];
  loading: boolean;
  error: string | null;
  apiMessage: string | null;
};

const EMPTY: HotelListState = {
  hotels: [],
  raw: [],
  loading: false,
  error: null,
  apiMessage: null
};

type Params = {
  checkInDate: string;
  checkOutDate: string;
  cityName: string;
  countryCode: string;
  cityLabel: string;
  roomCount: number;
  adultCount: number;
  childCount?: number;
  currencyCode?: string;
  currencyValue?: number;
  enabled: boolean;
  searchToken?: number;
};

export function useHotelList({
  checkInDate,
  checkOutDate,
  cityName,
  countryCode,
  cityLabel,
  roomCount,
  adultCount,
  childCount = 0,
  currencyCode = 'ETB',
  currencyValue = 1,
  enabled,
  searchToken = 0
}: Params) {
  const [state, setState] = useState<HotelListState>(EMPTY);
  const paramsRef = useRef({
    checkInDate,
    checkOutDate,
    cityName,
    countryCode,
    cityLabel,
    roomCount,
    adultCount,
    childCount,
    currencyCode,
    currencyValue
  });
  paramsRef.current = {
    checkInDate,
    checkOutDate,
    cityName,
    countryCode,
    cityLabel,
    roomCount,
    adultCount,
    childCount,
    currencyCode,
    currencyValue
  };

  useEffect(() => {
    const p = paramsRef.current;

    if (
      !enabled ||
      searchToken === 0 ||
      !p.checkInDate ||
      !p.checkOutDate ||
      !p.cityName ||
      !p.countryCode
    ) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({
      hotels: [],
      raw: [],
      loading: true,
      error: null,
      apiMessage: null
    });

    hotel1List({
      checkInDate: p.checkInDate,
      checkOutDate: p.checkOutDate,
      cityName: p.cityName,
      countryCode: p.countryCode,
      roomCount: p.roomCount,
      adultCount: p.adultCount,
      childCount: p.childCount,
      currencyCode: p.currencyCode,
      currencyValue: p.currencyValue,
      defaultCurrencyValue: p.currencyValue,
      cityLabel: p.cityLabel
    }).
    then(({ hotels, raw, apiMessage }) => {
      if (cancelled) return;
      setState({
        hotels,
        raw,
        loading: false,
        error: null,
        apiMessage: apiMessage ?? null
      });
    }).
    catch((err) => {
      if (cancelled) return;
      setState({
        hotels: [],
        raw: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load hotels',
        apiMessage: null
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, searchToken]);

  return state;
}
