const TEMPURI_NS = 'http://tempuri.org/';

/**
 * Named fields used by Hotel1–Hotel4 SOAP / HTTP form responses.
 * Keep each field separate — textContent concat breaks Hotel2/Hotel3.
 */
const HOTEL_PAYLOAD_FIELDS = [
  'Error',
  'HotelList',
  'HotelInfo',
  'Images',
  'RoomInfo',
  'Facilities',
  'Attrated',
  'FareSummary',
  'Result'
] as const;

/** Named JSON fields under FlightListResponse / Get*wayListResult. */
const FLIGHT_PAYLOAD_FIELDS = ['AirlineList', 'FlightList', 'Error', 'Result'] as const;

function getElementsByLocalName(
  parent: Element | Document,
  localName: string
): Element[] {
  return Array.from(parent.getElementsByTagNameNS('*', localName));
}

function escapeXml(value: string): string {
  return value.
  replace(/&/g, '&amp;').
  replace(/</g, '&lt;').
  replace(/>/g, '&gt;').
  replace(/"/g, '&quot;').
  replace(/'/g, '&apos;');
}

function decodeXmlEntities(value: string): string {
  return value.
  replace(/&lt;/g, '<').
  replace(/&gt;/g, '>').
  replace(/&amp;/g, '&').
  replace(/&quot;/g, '"').
  replace(/&apos;/g, "'");
}

/**
 * Named JSON fields under Hotel *Result / HTTP responses
 * (HotelList, HotelInfo, Images, RoomInfo, …). Keep each field separate —
 * concatenating textContent breaks Hotel2_HotelDetails parsing.
 */
function extractDirectChildTexts(el: Element): string[] {
  return Array.from(el.children).
  map((child) => child.textContent?.trim() ?? '').
  filter(Boolean);
}

/**
 * Regex extraction for hotel compound responses. More reliable than
 * textContent concatenation when multiple JSON arrays sit side by side.
 */
function isHotelCompoundResponse(xml: string): boolean {
  return /<(?:HotelList|HotelInfo|RoomInfo|Images|FareSummary|HotelListResponse|HotelDetailResponse|HotelRoomResponse|HotelBookingResponse|Hotel1_ListResult|Hotel2_HotelDetailsResult|Hotel3_RoomDetailsResult|Hotel4_BookingResult)\b/i.test(
    xml
  );
}

function extractHotelPayloadFields(xml: string): string[] {
  if (!isHotelCompoundResponse(xml)) {
    return [];
  }

  const out: string[] = [];
  for (const name of HOTEL_PAYLOAD_FIELDS) {
    const re = new RegExp(
      `<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`,
      'i'
    );
    const match = xml.match(re);
    if (!match?.[1]) continue;
    const text = decodeXmlEntities(match[1].trim());
    if (text) out.push(text);
  }
  return out;
}

function isFlightCompoundResponse(xml: string): boolean {
  return /<(?:FlightList|AirlineList|FlightListResponse|GetOnewayListResult|GetOneWayListResult|GetRoundwayListResult|GetMultiwayListResult)\b/i.test(
    xml
  );
}

function extractFlightPayloadFields(xml: string): string[] {
  if (!isFlightCompoundResponse(xml)) {
    return [];
  }

  const out: string[] = [];
  for (const name of FLIGHT_PAYLOAD_FIELDS) {
    const re = new RegExp(
      `<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`,
      'i'
    );
    const match = xml.match(re);
    if (!match?.[1]) continue;
    const text = decodeXmlEntities(match[1].trim());
    if (text) out.push(text);
  }
  return out;
}

function wrapAsStringRoot(parts: string[]): string {
  const chunks = parts.
  map((text) => `<string>${escapeXml(text)}</string>`).
  join('');
  return `<root xmlns="${TEMPURI_NS}">${chunks}</root>`;
}

/** Extract `<string>` text nodes from SOAP, HTTP GET, or plain JSON/text responses. */
export function extractStringResults(xml: string): string[] {
  const trimmed = xml.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return [trimmed];
  }

  // Plain text payloads (e.g. SaveBooking "PNR : ABC123").
  if (!trimmed.startsWith('<')) {
    return [trimmed];
  }

  // Hotel1/Hotel2 compound payloads — extract before DOM textContent merge.
  const hotelFields = extractHotelPayloadFields(trimmed);
  if (hotelFields.length > 0) return hotelFields;

  // Flight list compound payloads (FlightList JSON inside XML).
  const flightFields = extractFlightPayloadFields(trimmed);
  if (flightFields.length > 0) return flightFields;

  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Failed to parse GuestAPI response');
  }

  const strings = getElementsByLocalName(doc, 'string');
  const fromStrings = strings.
  map((el) => el.textContent?.trim() ?? '').
  filter(Boolean);
  if (fromStrings.length > 0) return fromStrings;

  // Hotel1/Hotel2 compound *Result: one child per JSON payload.
  const resultEl = getElementsByLocalName(doc, '*').find((el) =>
  el.localName.endsWith('Result')
  );
  if (resultEl) {
    const named = extractDirectChildTexts(resultEl);
    if (named.length > 0) return named;
    const text = resultEl.textContent?.trim();
    if (text) return [text];
  }

  // HTTP GET/POST form responses for hotel / flight ops.
  const namedResponseEl = getElementsByLocalName(doc, '*').find(
    (el) =>
    el.localName === 'HotelListResponse' ||
    el.localName === 'HotelDetailResponse' ||
    el.localName === 'HotelRoomResponse' ||
    el.localName === 'HotelBookingResponse' ||
    el.localName === 'FlightListResponse'
  );
  if (namedResponseEl) {
    const named = extractDirectChildTexts(namedResponseEl);
    if (named.length > 0) return named;
  }

  return [];
}

/** Parse JSON array payloads returned inside `<string>` elements. */
export function parseJsonStringResults<T>(xml: string): T[] {
  const raw = extractStringResults(xml);
  const items: T[] = [];

  for (const entry of raw) {
    if (entry === '[]') continue;
    try {
      const parsed = JSON.parse(entry) as T | T[];
      if (Array.isArray(parsed)) {
        items.push(...parsed);
      } else {
        items.push(parsed);
      }
    } catch {
      // Some endpoints may return plain strings instead of JSON.
      if (entry) items.push(entry as unknown as T);
    }
  }

  return items;
}

/** Read `{Operation}Result` from a SOAP envelope when present. */
export function extractSoapResultXml(xml: string): string {
  const hotelFields = extractHotelPayloadFields(xml);
  if (hotelFields.length > 1) {
    return wrapAsStringRoot(hotelFields);
  }
  if (hotelFields.length === 1) {
    return hotelFields[0];
  }

  const flightFields = extractFlightPayloadFields(xml);
  if (flightFields.length > 1) {
    return wrapAsStringRoot(flightFields);
  }
  if (flightFields.length === 1) {
    return flightFields[0];
  }

  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Failed to parse GuestAPI response');
  }

  const body = getElementsByLocalName(doc, 'Body')[0];
  if (!body) return xml;

  const resultEl = getElementsByLocalName(body, '*').find((el) =>
  el.localName.endsWith('Result')
  );
  if (!resultEl) return xml;

  const stringEls = getElementsByLocalName(resultEl, 'string');
  if (stringEls.length > 0) {
    const chunks = stringEls.
    map((el) => el.outerHTML).
    join('');
    return `<root xmlns="${TEMPURI_NS}">${chunks}</root>`;
  }

  // Prefer named child fields (HotelInfo + Images + RoomInfo…) over
  // concatenated textContent, which is invalid for multi-field hotel ops.
  const named = extractDirectChildTexts(resultEl);
  if (named.length > 1) {
    return wrapAsStringRoot(named);
  }
  if (named.length === 1) {
    return named[0];
  }

  const text = resultEl.textContent?.trim();
  if (text) return text;

  if (resultEl.innerHTML.trim()) {
    return `<root xmlns="${TEMPURI_NS}">${resultEl.innerHTML}</root>`;
  }

  return xml;
}

/** Return SOAP fault message when the envelope contains a fault. */
export function extractSoapFault(xml: string): string | null {
  const trimmed = xml.trim();
  if (!trimmed) return null;

  const regexMatch = trimmed.match(
    /<faultstring[^>]*>([\s\S]*?)<\/faultstring>/i
  );
  if (regexMatch?.[1]) {
    const decoded = decodeXmlEntities(regexMatch[1].trim());
    if (decoded) return decoded;
  }

  const doc = new DOMParser().parseFromString(trimmed, 'text/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) return null;

  const fault = getElementsByLocalName(doc, 'Fault')[0];
  if (!fault) return null;

  const faultString = getElementsByLocalName(fault, 'faultstring')[0];
  const text = faultString?.textContent?.trim();
  return text || 'GuestAPI SOAP fault';
}
