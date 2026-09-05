export const GUEST_API_NAMESPACE = 'http://tempuri.org/';

const DEFAULT_GUEST_API_ORIGIN = 'https://apitravel.afonestop.com';

/** API host — override with VITE_GUEST_API_ORIGIN if DNS blocks the default host. */
export const GUEST_API_ORIGIN =
  import.meta.env.VITE_GUEST_API_ORIGIN || DEFAULT_GUEST_API_ORIGIN;

/** Dev uses Vite proxy to avoid CORS; prod hits the API directly. */
export const GUEST_API_URL =
  import.meta.env.DEV ?
  '/api/guest' :
  `${GUEST_API_ORIGIN}/GuestAPI.asmx`;

/**
 * Request URL for a GuestAPI operation.
 * In dev, includes the operation name so Network tab shows e.g. GetBookingdetails
 * instead of a generic "guest". The Vite proxy forwards all paths to GuestAPI.asmx.
 */
export function buildGuestApiUrl(operation: string): string {
  if (import.meta.env.DEV) {
    return `${GUEST_API_URL}/${operation}`;
  }
  return GUEST_API_URL;
}
