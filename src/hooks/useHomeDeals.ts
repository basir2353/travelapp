import { useEffect, useState } from 'react';
import {
  getFlightDeals,
  getHotelDeals,
  getToursAndActivities,
  getTopDestinations,
  type FlightDeal,
  type HotelDeal,
  type TourActivityDeal,
  type TopDestinationDeal
} from '../services/guestApi/deals';

type HomeDealsState = {
  flights: FlightDeal[];
  hotels: HotelDeal[];
  tours: TourActivityDeal[];
  destinations: TopDestinationDeal[];
  loadingFlights: boolean;
  loadingHotels: boolean;
  loadingTours: boolean;
  loadingDestinations: boolean;
  flightError: string | null;
  hotelError: string | null;
  tourError: string | null;
  destinationError: string | null;
};

const EMPTY: HomeDealsState = {
  flights: [],
  hotels: [],
  tours: [],
  destinations: [],
  loadingFlights: true,
  loadingHotels: true,
  loadingTours: true,
  loadingDestinations: true,
  flightError: null,
  hotelError: null,
  tourError: null,
  destinationError: null
};

/**
 * Loads home deal carousels from GuestAPI.
 * Each section loads independently so one slow call does not block the others.
 */
export function useHomeDeals(enabled = true) {
  const [state, setState] = useState<HomeDealsState>(EMPTY);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setState((prev) => ({
      ...prev,
      loadingFlights: prev.flights.length === 0,
      loadingHotels: prev.hotels.length === 0,
      loadingTours: prev.tours.length === 0,
      loadingDestinations: prev.destinations.length === 0,
      flightError: null,
      hotelError: null,
      tourError: null,
      destinationError: null
    }));

    const load = <T,>(
      promise: Promise<T[]>,
      apply: (items: T[]) => Partial<HomeDealsState>,
      onError: (message: string) => Partial<HomeDealsState>
    ) => {
      void promise
        .then((items) => {
          if (cancelled) return;
          setState((prev) => ({ ...prev, ...apply(items) }));
        })
        .catch((err) => {
          if (cancelled) return;
          const message =
            err instanceof Error ? err.message : 'Failed to load deals';
          setState((prev) => ({ ...prev, ...onError(message) }));
        });
    };

    load(
      getFlightDeals(),
      (flights) => ({ flights, loadingFlights: false, flightError: null }),
      (flightError) => ({
        flights: [],
        loadingFlights: false,
        flightError
      })
    );
    load(
      getHotelDeals(),
      (hotels) => ({ hotels, loadingHotels: false, hotelError: null }),
      (hotelError) => ({ hotels: [], loadingHotels: false, hotelError })
    );
    load(
      getToursAndActivities(),
      (tours) => ({ tours, loadingTours: false, tourError: null }),
      (tourError) => ({ tours: [], loadingTours: false, tourError })
    );
    load(
      getTopDestinations(),
      (destinations) => ({
        destinations,
        loadingDestinations: false,
        destinationError: null
      }),
      (destinationError) => ({
        destinations: [],
        loadingDestinations: false,
        destinationError
      })
    );

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
