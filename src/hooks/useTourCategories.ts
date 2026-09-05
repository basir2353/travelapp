import { useEffect, useState } from 'react';
import {
  FALLBACK_TOUR_CATEGORIES,
  tourCategories,
  type TourCategory
} from '../services/guestApi/tour';

type TourCategoriesState = {
  categories: TourCategory[];
  loading: boolean;
  error: string | null;
};

const INITIAL: TourCategoriesState = {
  categories: FALLBACK_TOUR_CATEGORIES,
  loading: false,
  error: null
};

const CATEGORIES_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Tour categories timed out after ${ms / 1000}s`));
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

export function useTourCategories(enabled = true) {
  const [state, setState] = useState<TourCategoriesState>(INITIAL);

  useEffect(() => {
    if (!enabled) {
      setState(INITIAL);
      return;
    }

    let cancelled = false;
    // Soft refresh — keep FALLBACK chips visible; never block the tour list.
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null
    }));

    withTimeout(tourCategories(), CATEGORIES_TIMEOUT_MS).
      then((categories) => {
        if (cancelled) return;
        setState({
          categories: categories.length > 0 ? categories : FALLBACK_TOUR_CATEGORIES,
          loading: false,
          error: null
        });
      }).
      catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Failed to load tour categories';
        setState({
          categories: FALLBACK_TOUR_CATEGORIES,
          loading: false,
          error: message
        });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
