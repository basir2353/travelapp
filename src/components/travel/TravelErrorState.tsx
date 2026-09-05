import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/** Decode common SOAP / XML entities. */
function decodeEntities(value: string): string {
  return value.
  replace(/&lt;/g, '<').
  replace(/&gt;/g, '>').
  replace(/&amp;/g, '&').
  replace(/&quot;/g, '"').
  replace(/&#39;/g, "'").
  replace(/&apos;/g, "'");
}

/**
 * Keep the real API / SOAP fault text.
 * Unwraps .NET "--->" chains so the innermost cause is shown first.
 */
export function formatTravelApiError(error: unknown, fallback?: string): string {
  const raw =
    typeof error === 'string' && error.trim() ?
      error :
      error instanceof Error && error.message.trim() ?
        error.message :
        fallback || 'Something went wrong. Please try again.';

  let text = decodeEntities(String(raw)).
  replace(/^GuestAPI\s+\w+\s*(failed\s*\(\d+\))?\s*:?\s*/i, '').
  replace(/\s+/g, ' ').
  trim();

  if (!text) return 'Something went wrong. Please try again.';

  // .NET nested faults: "A ---> B ---> C" → prefer the real innermost message
  if (text.includes('--->')) {
    const parts = text.
    split(/--->/g).
    map((part) => part.trim()).
    filter(Boolean);
    const inner = parts[parts.length - 1];
    const outer = parts[0];
    if (inner && inner.toLowerCase() !== outer.toLowerCase()) {
      text = inner.length >= 12 ? inner : text;
    }
  }

  return text;
}

/**
 * Top-center toast — clean white card (not red fill), shows the real error text.
 */
export function showTravelError(
  message: string,
  options?: { id?: string; duration?: number; title?: string }
): void {
  const body = formatTravelApiError(message);
  const title = options?.title?.trim();
  toast(title || body, {
    id: options?.id ?? 'travel-error',
    duration: options?.duration ?? 6500,
    closeButton: true,
    className: 'travel-error-toast',
    description: title && title !== body ? body : undefined
  });
}

/**
 * Declarative helper — shows the toast when `message` is set.
 * Renders nothing in the layout.
 */
export function TravelErrorState({
  title,
  message,
  variant: _variant,
  onRetry: _onRetry,
  onDismiss: _onDismiss,
  retryLabel: _retryLabel,
  className: _className
}: {
  title?: string;
  message: string;
  variant?: 'banner' | 'panel' | 'inline';
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  const lastShown = useRef<string | null>(null);

  useEffect(() => {
    const body = formatTravelApiError(message);
    if (!body || body === lastShown.current) return;
    lastShown.current = body;
    showTravelError(body, { title });
  }, [message, title]);

  return null;
}
