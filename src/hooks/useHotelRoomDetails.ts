import { useEffect, useState } from 'react';
import { hotel3RoomDetails, type HotelRoomDetailsResult } from '../services/guestApi';

type HotelRoomDetailsState = HotelRoomDetailsResult & {
  loading: boolean;
  error: string | null;
};

const EMPTY: HotelRoomDetailsState = {
  room: null,
  pricing: null,
  loading: false,
  error: null,
  apiMessage: undefined
};

type Params = {
  checkInDate: string;
  checkOutDate: string;
  jsonSelectRoom: string;
  selectHotelJson: string;
  totalDays?: number;
  roomCount?: number;
  adultCount?: number;
  childCount?: number;
  currencyCode?: string;
  currencyValue?: number;
  enabled: boolean;
  fetchToken?: number;
};

export function useHotelRoomDetails({
  checkInDate,
  checkOutDate,
  jsonSelectRoom,
  selectHotelJson,
  totalDays = 1,
  roomCount = 1,
  adultCount = 1,
  childCount = 0,
  currencyCode = 'ETB',
  currencyValue = 1,
  enabled,
  fetchToken = 0
}: Params) {
  const [state, setState] = useState<HotelRoomDetailsState>(EMPTY);

  useEffect(() => {
    if (
      !enabled ||
      !jsonSelectRoom ||
      jsonSelectRoom === '[]' ||
      !selectHotelJson ||
      selectHotelJson === '[]'
    ) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState({
      room: null,
      pricing: null,
      loading: true,
      error: null,
      apiMessage: undefined
    });

    hotel3RoomDetails({
      checkInDate,
      checkOutDate,
      jsonSelectRoom,
      selectHotelJson,
      totalDays,
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
        room: null,
        pricing: null,
        loading: false,
        error:
          err instanceof Error ? err.message : 'Failed to load room details',
        apiMessage: undefined
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    checkInDate,
    checkOutDate,
    jsonSelectRoom,
    selectHotelJson,
    totalDays,
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
