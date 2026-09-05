import { Hotel } from '../../components/travel/ethioTravelData';
import { callGuestApi } from './soapClient';
import {
  buildRoomGuestJson,
  mapHotelItemToListing,
  type HotelListItem
} from './mapHotelToListing';
import {
  buildSelectHotelJson,
  parseHotelDetailsResponse,
  mergeHotelWithDetails,
  type HotelDetailsResult
} from './mapHotelDetails';
import {
  buildJsonSelectRoom,
  parseHotelRoomDetailsResponse,
  type HotelRoomDetailsResult
} from './mapHotelRoomDetails';
import {
  buildHotelBookingPayload,
  parseHotelBookingResponse,
  type HotelBookingInput,
  type HotelBookingResult
} from './mapHotelBooking';
import { GUEST_USER_ID, GUEST_USER_TYPE_ID } from './car';

export type { HotelDetailsResult } from './mapHotelDetails';
export type { HotelRoomDetailsResult, HotelRoomPricing } from './mapHotelRoomDetails';
export { buildSelectHotelJson, mergeHotelWithDetails } from './mapHotelDetails';
export { buildJsonSelectRoom } from './mapHotelRoomDetails';

export type HotelListParams = {
  checkInDate: string;
  checkOutDate: string;
  cityName: string;
  countryCode: string;
  roomCount?: number;
  adultCount?: number;
  childCount?: number;
  currencyCode?: string;
  /** GuestAPI CurrencyValue — rate from GetCurrencyExchangerate */
  currencyValue?: number;
  hotelMarkup?: number;
  /** @deprecated use currencyValue */
  defaultCurrencyValue?: number;
  cityLabel?: string;
};

export type HotelListResult = {
  hotels: Hotel[];
  raw: HotelListItem[];
  apiMessage?: string;
};

function resolveHotelCurrency(params: {
  currencyCode?: string;
  currencyValue?: number;
  defaultCurrencyValue?: number;
}): { code: string; value: string } {
  const code = String(params.currencyCode || '')
    .trim()
    .toUpperCase();
  const n = Number(params.currencyValue ?? params.defaultCurrencyValue ?? 1);
  return {
    code: /^[A-Z]{3}$/.test(code) ? code : 'ETB',
    value: Number.isFinite(n) && n > 0 ? String(n) : '1'
  };
}

function extractHotelListItems(strings: string[]): {
  items: HotelListItem[];
  apiMessage?: string;
} {
  let items: HotelListItem[] = [];
  let apiMessage: string | undefined;

  for (const entry of strings) {
    if (!entry || entry === '[]') continue;

    if (!entry.startsWith('[') && !entry.startsWith('{')) {
      const msg = entry.trim();
      if (msg && msg.toLowerCase() !== 'no error') {
        apiMessage = msg;
      }
      continue;
    }

    try {
      const parsed = JSON.parse(entry) as HotelListItem | HotelListItem[];
      const list = Array.isArray(parsed) ? parsed : [parsed];
      if (list.length > 0 && (list[0]?.Hotelname || list[0]?.Hotelcode)) {
        items = list;
      }
    } catch {
      // skip malformed entries
    }
  }

  return {
    items,
    apiMessage: items.length === 0 ? apiMessage?.trim() : undefined
  };
}

/**
 * Hotel1_List — search hotels by city and stay dates.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=Hotel1_List
 */
export async function hotel1List(params: HotelListParams): Promise<HotelListResult> {
  const roomCount = params.roomCount ?? 1;
  const adultCount = params.adultCount ?? 1;
  const childCount = params.childCount ?? 0;
  const { code: currencyCode, value: currencyValue } = resolveHotelCurrency(params);

  const strings = await callGuestApi('Hotel1_List', [
    { name: 'CheckInDate', value: params.checkInDate },
    { name: 'CheckOutDate', value: params.checkOutDate },
    { name: 'CityName', value: params.cityName },
    { name: 'CountryCode', value: params.countryCode },
    { name: 'RoomCount', value: String(roomCount) },
    { name: 'CurrencyCode', value: currencyCode },
    { name: 'CurrencyValue', value: currencyValue },
    { name: 'HotelMarkup', value: String(params.hotelMarkup ?? 0) },
    {
      name: 'RoomGuestJson',
      value: buildRoomGuestJson(roomCount, adultCount, childCount)
    }
  ]);

  const { items, apiMessage } = extractHotelListItems(strings);
  const cityLabel = params.cityLabel ?? params.cityName;
  const hotels = items.map((item, index) =>
    mapHotelItemToListing(item, index, cityLabel, currencyCode)
  );

  return { hotels, raw: items, apiMessage };
}

export type HotelDetailsParams = {
  checkInDate: string;
  checkOutDate: string;
  selectHotelJson: string;
  roomCount?: number;
  adultCount?: number;
  childCount?: number;
  hotelMarkup?: number;
  currencyCode?: string;
  currencyValue?: number;
  /** @deprecated use currencyValue */
  defaultCurrencyValue?: number;
};

/**
 * Hotel2_HotelDetails — gallery, facilities, and room types for a selected hotel.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=Hotel2_HotelDetails
 */
export async function hotel2HotelDetails(
  params: HotelDetailsParams
): Promise<HotelDetailsResult> {
  const roomCount = params.roomCount ?? 1;
  const adultCount = params.adultCount ?? 1;
  const childCount = params.childCount ?? 0;
  const { code: currencyCode, value: currencyValue } = resolveHotelCurrency(params);

  const strings = await callGuestApi('Hotel2_HotelDetails', [
    { name: 'CheckInDate', value: params.checkInDate },
    { name: 'CheckOutDate', value: params.checkOutDate },
    { name: 'CurrencyCode', value: currencyCode },
    { name: 'CurrencyValue', value: currencyValue },
    { name: 'HotelMarkup', value: String(params.hotelMarkup ?? 0) },
    {
      name: 'RoomGuestJson',
      value: buildRoomGuestJson(roomCount, adultCount, childCount)
    },
    { name: 'SelectHoteljson', value: params.selectHotelJson }
  ]);

  return parseHotelDetailsResponse(strings);
}

export type HotelRoomDetailsParams = {
  checkInDate: string;
  checkOutDate: string;
  jsonSelectRoom: string;
  selectHotelJson: string;
  totalDays?: number;
  roomCount?: number;
  adultCount?: number;
  childCount?: number;
  hotelMarkup?: number;
  currencyCode?: string;
  currencyValue?: number;
  /** @deprecated use currencyValue */
  defaultCurrencyValue?: number;
  userTypeId?: number;
  userId?: number;
};

/**
 * Hotel3_RoomDetails — confirm room fare, taxes, and cancellation policy.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=Hotel3_RoomDetails
 */
export async function hotel3RoomDetails(
  params: HotelRoomDetailsParams
): Promise<HotelRoomDetailsResult> {
  const roomCount = params.roomCount ?? 1;
  const adultCount = params.adultCount ?? 1;
  const childCount = params.childCount ?? 0;
  const { code: currencyCode, value: currencyValue } = resolveHotelCurrency(params);

  const strings = await callGuestApi('Hotel3_RoomDetails', [
    {
      name: 'UserTypeId',
      value: String(params.userTypeId ?? GUEST_USER_TYPE_ID)
    },
    { name: 'UserId', value: String(params.userId ?? GUEST_USER_ID) },
    { name: 'CheckInDate', value: params.checkInDate },
    { name: 'CheckOutDate', value: params.checkOutDate },
    { name: 'TotalDays', value: String(params.totalDays ?? 1) },
    { name: 'CurrencyCode', value: currencyCode },
    { name: 'CurrencyValue', value: currencyValue },
    { name: 'HotelMarkup', value: String(params.hotelMarkup ?? 0) },
    { name: 'JsonSelectRoom', value: params.jsonSelectRoom },
    {
      name: 'RoomGuestJson',
      value: buildRoomGuestJson(roomCount, adultCount, childCount)
    },
    { name: 'SelectHoteljson', value: params.selectHotelJson }
  ]);

  return parseHotelRoomDetailsResponse(strings);
}

export type { HotelBookingInput, HotelBookingResult } from './mapHotelBooking';

/**
 * Hotel4_Booking — save hotel reservation after guest details and payment.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=Hotel4_Booking
 */
export async function hotel4Booking(
  input: HotelBookingInput
): Promise<HotelBookingResult> {
  const payload = buildHotelBookingPayload(input);

  const strings = await callGuestApi('Hotel4_Booking', [
    { name: 'UserTypeId', value: payload.userTypeId },
    { name: 'UserId', value: payload.userId },
    { name: 'CheckInDate', value: payload.checkInDate },
    { name: 'CheckOutDate', value: payload.checkOutDate },
    { name: 'HotelStatus', value: payload.hotelStatus },
    { name: 'CurrencyCode', value: payload.currencyCode },
    { name: 'CurrencyValue', value: payload.currencyValue },
    { name: 'HotelMarkup', value: payload.hotelMarkup },
    { name: 'JsonRoomGuest', value: payload.jsonRoomGuest },
    { name: 'SelectHotelJson', value: payload.selectHotelJson },
    { name: 'SelectRoomJson', value: payload.selectRoomJson },
    { name: 'BookingJson', value: payload.bookingJson },
    { name: 'ContactDetailJson', value: payload.contactDetailJson },
    { name: 'ReqPassangerJson', value: payload.reqPassangerJson }
  ]);

  // Prefer Result text (success message / booking ID); fall back to joined payloads.
  const resultText =
  strings.find((entry) => /ID\s*is\s*:?\s*\d+/i.test(entry)) ||
  strings.find((entry) => /successfully saved/i.test(entry)) ||
  strings.join('\n').trim();

  return parseHotelBookingResponse(resultText);
}

export type { HotelListItem } from './mapHotelToListing';
export {
  buildRoomGuestJson,
  normalizeHotelCityLabel,
  resolveHotelSearchLocation
} from './mapHotelToListing';
