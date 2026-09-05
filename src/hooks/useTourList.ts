import { useEffect, useRef, useState } from 'react';
import { tourGetList, type TourActivity } from '../services/guestApi/tour';
import type { TourListItem } from '../services/guestApi/mapTourToListing';
import { firstWorkingTourImage } from '../services/guestApi/tourImageLoader';

type TourListState = {
  tours: TourActivity[];
  raw: TourListItem[];
  loading: boolean;
  error: string | null;
  apiMessage: string | null;
};

const EMPTY: TourListState = {
  tours: [],
  raw: [],
  loading: false,
  error: null,
  apiMessage: null
};

const TOUR_LIST_TIMEOUT_MS = 45_000;

type Params = {
  destinationName: string;
  fromDate: string;
  toDate: string;
  adultCount: number;
  childCount?: number;
  currencyCode?: string;
  enabled: boolean;
  searchToken?: number;
};

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms / 1000}s`));
    }, ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/** Put tours with a real CDN photo first so the list isn't empty-looking. */
async function sortToursByLiveImages(
  tours: TourActivity[]
): Promise<TourActivity[]> {
  if (tours.length === 0) return tours;

  const scored = await Promise.all(
    tours.map(async (tour) => {
      if (!tour.images.length) return { tour, live: false };
      try {
        const live = Boolean(
          await Promise.race([
            firstWorkingTourImage(tour.images.slice(0, 2)),
            new Promise<null>((resolve) => {
              window.setTimeout(() => resolve(null), 1500);
            })
          ])
        );
        return { tour, live };
      } catch {
        return { tour, live: false };
      }
    })
  );
  return [
    ...scored.filter((s) => s.live).map((s) => s.tour),
    ...scored.filter((s) => !s.live).map((s) => s.tour)
  ];
}

export function useTourList({
  destinationName,
  fromDate,
  toDate,
  adultCount,
  childCount = 0,
  currencyCode = 'ETB',
  enabled,
  searchToken = 0
}: Params) {
  const [state, setState] = useState<TourListState>(EMPTY);
  const fetchIdRef = useRef(0);
  const paramsRef = useRef({
    destinationName,
    fromDate,
    toDate,
    adultCount,
    childCount,
    currencyCode
  });
  paramsRef.current = {
    destinationName,
    fromDate,
    toDate,
    adultCount,
    childCount,
    currencyCode
  };

  useEffect(() => {
    const p = paramsRef.current;

    if (
      !enabled ||
      searchToken === 0 ||
      !p.destinationName ||
      !p.fromDate ||
      !p.toDate
    ) {
      fetchIdRef.current += 1;
      setState(EMPTY);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      apiMessage: null
    }));

    withTimeout(
      tourGetList({
        destinationName: p.destinationName,
        fromDate: p.fromDate,
        toDate: p.toDate,
        adultCount: p.adultCount,
        childCount: p.childCount,
        defaultCurrency: p.currencyCode
      }),
      TOUR_LIST_TIMEOUT_MS,
      'TourGetList'
    ).
    then(async (result) => {
      // Ignore superseded searches, but never leave loading stuck.
      if (fetchId !== fetchIdRef.current) return;
      setState({
        tours: result.tours,
        raw: result.raw,
        loading: false,
        error: null,
        apiMessage: result.apiMessage ?? null
      });
      const sorted = await sortToursByLiveImages(result.tours);
      if (fetchId !== fetchIdRef.current) return;
      setState((prev) => ({
        ...prev,
        tours: sorted
      }));
    }).
    catch((err: unknown) => {
      if (fetchId !== fetchIdRef.current) return;
      const message =
      err instanceof Error ? err.message : 'Failed to load tours';
      setState({
        tours: [],
        raw: [],
        loading: false,
        error: message,
        apiMessage: null
      });
    });
  }, [enabled, searchToken]);

  return state;
}
