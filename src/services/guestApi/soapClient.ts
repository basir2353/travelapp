import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { GUEST_API_NAMESPACE, buildGuestApiUrl } from './config';
import { extractSoapFault, extractSoapResultXml, extractStringResults } from './parseResponse';

export type SoapParam = {
  name: string;
  value: string;
};

const DEFAULT_TIMEOUT_MS = 60_000;
/** SaveBooking / fare confirm can be slow on mobile networks. */
const LONG_TIMEOUT_MS = 120_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_500;

const LONG_OPS = new Set([
  'SaveBooking',
  'GetBookingdetails',
  'Hotel4_Booking',
  'Car_Booking',
  'TourBooking',
  'TourPackageDetails',
  'TourDetails',
  'TourGetList',
  'SignupTraveller'
]);

function timeoutForOperation(operation: string): number {
  return LONG_OPS.has(operation) ? LONG_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
}

function isRetryableNetworkError(error: unknown): boolean {
  if (error instanceof GuestApiError) {
    const msg = error.message.toLowerCase();
    // NullReference from TourBooking is a deterministic server bug — do not retry.
    if (msg.includes('object reference not set')) return false;
    return (
      msg.includes('timed out') ||
      msg.includes('cannot reach') ||
      msg.includes('failed (500)') ||
      msg.includes('failed (502)') ||
      msg.includes('failed (503)') ||
      msg.includes('empty response')
    );
  }
  if (error instanceof TypeError) return true;
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function escapeXml(value: string): string {
  return value.
  replace(/&/g, '&amp;').
  replace(/</g, '&lt;').
  replace(/>/g, '&gt;').
  replace(/"/g, '&quot;').
  replace(/'/g, '&apos;');
}

function buildSoapEnvelope(operation: string, params: SoapParam[]): string {
  const bodyParams = params.
  map(
    ({ name, value }) => `<${name}>${escapeXml(value)}</${name}>`
  ).
  join('');

  const operationTag =
  params.length === 0 ?
  `<${operation} xmlns="${GUEST_API_NAMESPACE}" />` :
  `<${operation} xmlns="${GUEST_API_NAMESPACE}">${bodyParams}</${operation}>`;

  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    ${operationTag}
  </soap:Body>
</soap:Envelope>`;
}

export class GuestApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: string
  ) {
    super(message);
    this.name = 'GuestApiError';
  }
}

function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return (
      typeof window !== 'undefined' &&
      /capacitor/i.test(window.navigator.userAgent)
    );
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new GuestApiError(
        `GuestAPI request timed out after ${timeoutMs / 1000}s. The travel server may be slow or unreachable — check your connection and try again.`
      );
    }
    if (error instanceof TypeError) {
      throw new GuestApiError(
        isNativeApp() ?
        'Cannot reach the travel API server. Check your internet connection or try again on a different network if your carrier blocks apitravel.afonestop.com.' :
        'Cannot reach the travel API server. Check your internet connection, restart `npm run dev`, or set VITE_GUEST_API_ORIGIN in .env if DNS blocks apitravel.afonestop.com.'
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function normalizeResponseBody(data: unknown): string {
  if (data == null) return '';
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    try {
      return JSON.stringify(data);
    } catch {
      return String(data);
    }
  }
  return String(data);
}

function parseGuestApiResponse(
  operation: string,
  status: number,
  text: string
): string[] {
  const fault = text.trim() ? extractSoapFault(text) : null;
  if (fault) {
    throw new GuestApiError(fault, status, text);
  }

  if (!text.trim()) {
    const connectivityHint = import.meta.env.DEV ?
    ' If you are on local dev, restart `npm run dev` after pulling the latest proxy fix, or set VITE_GUEST_API_ORIGIN in .env when your network cannot resolve apitravel.afonestop.com.' :
    '';
    throw new GuestApiError(
      status ?
      `GuestAPI ${operation} failed (${status}) with an empty response from the server.${connectivityHint} Please try again.` :
      `GuestAPI ${operation} returned an empty response`,
      status,
      text
    );
  }

  if (status < 200 || status >= 300) {
    const snippet = text.
    replace(/<[^>]+>/g, ' ').
    replace(/\s+/g, ' ').
    trim().
    slice(0, 180);
    throw new GuestApiError(
      snippet ?
      `GuestAPI ${operation} failed (${status}): ${snippet}` :
      `GuestAPI ${operation} failed (${status})`,
      status,
      text
    );
  }

  const payload = extractSoapResultXml(text);
  let strings = extractStringResults(payload);
  if (strings.length === 0) {
    strings = extractStringResults(text);
  }
  if (strings.length === 0) {
    throw new GuestApiError(
      `GuestAPI ${operation} returned no data`,
      status,
      text
    );
  }

  return strings;
}

type HttpResult = { status: number; text: string };

/** Native Android/iOS — CapacitorHttp bypasses WebView CORS and is reliable for large SOAP bodies. */
async function postSoapNative(
  url: string,
  envelope: string,
  operation: string,
  timeoutMs: number
): Promise<HttpResult> {
  const response = await CapacitorHttp.request({
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      Accept: 'text/xml, application/soap+xml, */*',
      SOAPAction: `"${GUEST_API_NAMESPACE}${operation}"`
    },
    data: envelope,
    responseType: 'text',
    connectTimeout: timeoutMs,
    readTimeout: timeoutMs
  });

  return {
    status: response.status,
    text: normalizeResponseBody(response.data)
  };
}

async function postSoapWeb(
  url: string,
  envelope: string,
  operation: string,
  timeoutMs: number
): Promise<HttpResult> {
  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        Accept: 'text/xml, application/soap+xml, */*',
        SOAPAction: `"${GUEST_API_NAMESPACE}${operation}"`
      },
      body: envelope
    },
    timeoutMs
  );
  const text = await response.text();
  return { status: response.status, text };
}

export type CallGuestApiOptions = {
  /** Override default timeout for this call. */
  timeoutMs?: number;
  /** Override retry count (default MAX_RETRIES). Use 0 for no retries. */
  maxRetries?: number;
};

/** SOAP POST — used for all GuestAPI operations. */
async function callGuestApiSoap(
  operation: string,
  params: SoapParam[],
  options?: CallGuestApiOptions
): Promise<string[]> {
  const { strings } = await callGuestApiSoapWithBody(operation, params, options);
  return strings;
}

async function callGuestApiSoapWithBody(
  operation: string,
  params: SoapParam[],
  options?: CallGuestApiOptions
): Promise<{ strings: string[]; body: string }> {
  const envelope = buildSoapEnvelope(operation, params);
  const url = buildGuestApiUrl(operation);
  const timeoutMs = options?.timeoutMs ?? timeoutForOperation(operation);
  const maxRetries = options?.maxRetries ?? MAX_RETRIES;
  const useNative = isNativeApp();
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { status, text } = useNative ?
      await postSoapNative(url, envelope, operation, timeoutMs) :
      await postSoapWeb(url, envelope, operation, timeoutMs);

      const strings = parseGuestApiResponse(operation, status, text);
      return { strings, body: text };
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries && isRetryableNetworkError(error)) {
        await delay(RETRY_DELAY_MS);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Call a GuestAPI operation and return raw string payloads.
 * All operations use SOAP POST on the service root (per ASMX spec).
 * On Capacitor Android/iOS, uses native CapacitorHttp so SaveBooking and
 * other large SOAP calls work outside the WebView networking stack.
 */
export async function callGuestApi(
  operation: string,
  params: SoapParam[] = [],
  options?: CallGuestApiOptions
): Promise<string[]> {
  return callGuestApiSoap(operation, params, options);
}

/** Same as callGuestApi, plus the raw SOAP/HTTP response body. */
export async function callGuestApiWithBody(
  operation: string,
  params: SoapParam[] = [],
  options?: CallGuestApiOptions
): Promise<{ strings: string[]; body: string }> {
  return callGuestApiSoapWithBody(operation, params, options);
}
