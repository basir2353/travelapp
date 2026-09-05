import { useCallback, useEffect, useRef, useState } from 'react';
import {
  bookingCardListGet,
  enrichRecentBookingsWithSegments,
  enrichBookingsFromCache,
  filterBookingsBySegment,
  type BookingCardItem,
  type BookingSegment,
  type EnrichedBookingCardItem
} from '../services/guestApi';

type BookingListState = {
  bookings: EnrichedBookingCardItem[];
  loading: boolean;
  error: string | null;
  totalRecords: number;
};

const EMPTY: BookingListState = {
  bookings: [],
  loading: false,
  error: null,
  totalRecords: 0
};

type Params = {
  enabled?: boolean;
  refreshToken?: number;
  active?: boolean;
  segment?: BookingSegment;
  /** Logged-in traveller UserId from TravellerLogin (required for per-user trips). */
  userId?: number | null;
  /** Logged-in traveller UserTypeId from TravellerLogin (TRA ≈ 5). */
  userTypeId?: number | null;
};

export function useBookingList({
  enabled = true,
  refreshToken = 0,
  active = true,
  segment = 'past',
  userId = null,
  userTypeId = null
}: Params = {}) {
  const [state, setState] = useState<BookingListState>(EMPTY);
  const [allBookings, setAllBookings] = useState<EnrichedBookingCardItem[]>([]);
  const enabledRef = useRef(enabled);
  const segmentRef = useRef(segment);
  const userIdRef = useRef(userId);
  const userTypeIdRef = useRef(userTypeId);
  const fetchGenerationRef = useRef(0);
  enabledRef.current = enabled;
  segmentRef.current = segment;
  userIdRef.current = userId;
  userTypeIdRef.current = userTypeId;

  const applySegment = useCallback(
    (bookings: EnrichedBookingCardItem[]) =>
      filterBookingsBySegment(bookings, segmentRef.current),
    []
  );

  const reload = useCallback(async () => {
    if (!enabledRef.current) return;
    const uid = userIdRef.current;
    if (uid == null || !Number.isFinite(Number(uid)) || Number(uid) <= 0) {
      setAllBookings([]);
      setState({
        bookings: [],
        loading: false,
        // Soft empty — profile/signup may not have TravellerLogin yet
        error: null,
        totalRecords: 0
      });
      return;
    }

    const generation = ++fetchGenerationRef.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { bookings, totalRecords } = await bookingCardListGet({
        userId: Number(uid),
        userTypeId:
          userTypeIdRef.current != null && Number(userTypeIdRef.current) > 0 ?
            Number(userTypeIdRef.current) :
            undefined
      });
      if (!enabledRef.current) return;

      const initial = enrichBookingsFromCache(bookings as BookingCardItem[]);
      setAllBookings(initial);
      setState({
        bookings: applySegment(initial),
        loading: false,
        error: null,
        totalRecords
      });

      void enrichRecentBookingsWithSegments(bookings as BookingCardItem[], {
        concurrency: 3,
        timeoutMs: 10_000
      }).
        then((enriched) => {
          if (!enabledRef.current || generation !== fetchGenerationRef.current) return;
          setAllBookings(enriched);
          setState((prev) => ({
            ...prev,
            bookings: applySegment(enriched)
          }));
        }).
        catch(() => {
          // Keep the list response already shown.
        });
    } catch (err) {
      if (!enabledRef.current) return;
      setAllBookings([]);
      setState({
        bookings: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load bookings',
        totalRecords: 0
      });
    }
  }, [applySegment]);

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY);
      setAllBookings([]);
      return;
    }
    if (!active) return;
    void reload();
  }, [enabled, active, refreshToken, userId, userTypeId, reload]);

  useEffect(() => {
    if (!enabled) return;
    setState((prev) => ({
      ...prev,
      bookings: filterBookingsBySegment(allBookings, segment)
    }));
  }, [allBookings, enabled, segment]);

  return { ...state, reload };
}
