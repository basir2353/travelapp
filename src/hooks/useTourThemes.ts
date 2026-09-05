import { useEffect, useState } from 'react';
import {
  FALLBACK_TOUR_THEMES,
  tourThemes,
  type TourTheme
} from '../services/guestApi/tour';

type TourThemesState = {
  themes: TourTheme[];
  loading: boolean;
  error: string | null;
};

const INITIAL: TourThemesState = {
  themes: FALLBACK_TOUR_THEMES,
  loading: false,
  error: null
};

const THEMES_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Tour themes timed out after ${ms / 1000}s`));
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

export function useTourThemes(enabled = true) {
  const [state, setState] = useState<TourThemesState>(INITIAL);

  useEffect(() => {
    if (!enabled) {
      setState(INITIAL);
      return;
    }

    let cancelled = false;
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null
    }));

    withTimeout(tourThemes(), THEMES_TIMEOUT_MS).
      then((themes) => {
        if (cancelled) return;
        setState({
          themes: themes.length > 0 ? themes : FALLBACK_TOUR_THEMES,
          loading: false,
          error: null
        });
      }).
      catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Failed to load tour themes';
        setState({
          themes: FALLBACK_TOUR_THEMES,
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
