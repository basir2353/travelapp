import { callGuestApi, GuestApiError } from './soapClient';
import { CarRental } from '../../components/travel/ethioTravelData';
import {
  mapCarItemToRental,
  type CarListItem } from
'./mapCarToRental';
import {
  parseCarSelectResponse,
  type CarSelectResult } from
'./mapCarSelection';
import {
  buildCarBookingPayload,
  parseCarBookingResponse,
  type CarBookingInput,
  type CarBookingResult } from
'./mapCarBooking';
import { CAR_LIST_FALLBACK_RAW } from './carListFallback';
import {
  formatBusTravelDate,
  formatCarApiDate,
  defaultCarPickupDate,
  defaultCarReturnDate } from
'./formatTravelDate';

export const GUEST_USER_TYPE_ID = 2;
export const GUEST_USER_ID = 1000;

export type CarSelectParams = {
  userTypeId?: number;
  userId?: number;
  defaultCurrency: string;
  defaultCurrencyValue: number;
  carMarkup?: number;
  jsonSelectCar: string;
};

export type { CarSelectResult, CarPricing } from './mapCarSelection';

export type CarListParams = {
  pickupLocation: string;
  returnLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  currencyCode: string;
  defaultCurrencyValue: number;
};

export type CarListResult = {
  cars: CarRental[];
  raw: CarListItem[];
  apiMessage?: string;
  fromFallback?: boolean;
};

function extractCarListItems(strings: string[]): {
  items: CarListItem[];
  apiMessage?: string;
} {
  let items: CarListItem[] = [];
  let apiMessage: string | undefined;

  for (const entry of strings) {
    if (!entry || entry === '[]') continue;

    if (!entry.startsWith('[') && !entry.startsWith('{')) {
      apiMessage = entry.trim();
      continue;
    }

    try {
      const parsed = JSON.parse(entry) as CarListItem | CarListItem[];
      const list = Array.isArray(parsed) ? parsed : [parsed];
      if (list[0]?.VendorCode || list[0]?.vendorCode) {
        const fieldCount = Object.keys(list[0]).length;
        const existingCount =
          items[0] ? Object.keys(items[0]).length : 0;
        if (items.length === 0 || fieldCount > existingCount) {
          items = list;
        }
      }
    } catch {
      // skip malformed entries
    }
  }

  // API often appends "API Error" even when cars were returned successfully.
  return {
    items,
    apiMessage: items.length === 0 ? apiMessage?.trim() : undefined
  };
}


async function fetchCarListOnce(params: CarListParams): Promise<CarListResult> {
  const strings = await callGuestApi('Car1_List', [
    { name: 'pickupLocation', value: params.pickupLocation },
    { name: 'returnLocation', value: params.returnLocation },
    { name: 'pickupDate', value: params.pickupDate },
    { name: 'pickupTime', value: params.pickupTime },
    { name: 'returnDate', value: params.returnDate },
    { name: 'returnTime', value: params.returnTime },
    {
      name: 'CurrencyCode',
      value: (() => {
        const code = String(params.currencyCode || '')
          .trim()
          .toUpperCase();
        return /^[A-Z]{3}$/.test(code) ? code : 'ETB';
      })()
    },
    {
      name: 'CurrencyValue',
      value: (() => {
        const n = Number(params.defaultCurrencyValue);
        return Number.isFinite(n) && n > 0 ? String(n) : '1';
      })()
    }
  ]);

  const { items, apiMessage } = extractCarListItems(strings);
  const preferred = (() => {
    const code = String(params.currencyCode || '')
      .trim()
      .toUpperCase();
    return /^[A-Z]{3}$/.test(code) ? code : 'ETB';
  })();
  const cars = items.map((item, index) =>
    mapCarItemToRental(item, index, preferred)
  );

  return { cars, raw: items, apiMessage };
}

function isGuestApiUnreachable(error: unknown): boolean {
  if (!(error instanceof GuestApiError)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('cannot reach') ||
    msg.includes('timed out') ||
    msg.includes('failed (500)') ||
    msg.includes('failed (502)') ||
    msg.includes('failed (503)') ||
    msg.includes('empty response')
  );
}

/** Car1_List upstream failures (e.g. rental provider 401) — show sample inventory instead of a raw fault. */
function isCarListRecoverableError(error: unknown): boolean {
  if (!(error instanceof GuestApiError)) return false;
  if (isGuestApiUnreachable(error)) return true;

  const msg = error.message.toLowerCase();
  return (
    error.status === 401 ||
    error.status === 500 ||
    msg.includes('401') ||
    msg.includes('unauthorized') ||
    msg.includes('server was unable to process')
  );
}

function buildFallbackCarList(preferredCurrency = 'ETB'): CarListResult {
  const code = (() => {
    const c = String(preferredCurrency || '')
      .trim()
      .toUpperCase();
    return /^[A-Z]{3}$/.test(c) ? c : 'ETB';
  })();
  const cars = CAR_LIST_FALLBACK_RAW.map((item, index) =>
    mapCarItemToRental(item, index, code)
  );
  return {
    cars,
    raw: CAR_LIST_FALLBACK_RAW,
    fromFallback: true
  };
}

async function fetchCarListWithDateFallback(
  params: CarListParams
): Promise<CarListResult> {
  let result = await fetchCarListOnce(params);

  if (result.cars.length > 0) {
    return result;
  }

  const pickup = defaultCarPickupDate();
  const returnDate = defaultCarReturnDate(pickup);
  const altPickup = formatBusTravelDate(pickup);
  const altReturn = formatBusTravelDate(returnDate);

  if (params.pickupDate !== altPickup || params.returnDate !== altReturn) {
    result = await fetchCarListOnce({
      ...params,
      pickupDate: altPickup,
      returnDate: altReturn
    });
  }

  return result;
}

/**
 * Car1_List — search available rental cars.
 * Retries with adjusted dates, then sample data if the live API is empty.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=Car1_List
 */
export async function car1List(params: CarListParams): Promise<CarListResult> {
  try {
    const result = await fetchCarListWithDateFallback(params);

    const preferred = (() => {
      const c = String(params.currencyCode || '')
        .trim()
        .toUpperCase();
      return /^[A-Z]{3}$/.test(c) ? c : 'ETB';
    })();

    if (result.cars.length === 0) {
      return buildFallbackCarList(preferred);
    }

    return {
      ...result,
      cars: result.cars.map((car) => ({
        ...car,
        currency: preferred
      }))
    };
  } catch (error) {
    const preferred = (() => {
      const c = String(params.currencyCode || '')
        .trim()
        .toUpperCase();
      return /^[A-Z]{3}$/.test(c) ? c : 'ETB';
    })();
    if (isCarListRecoverableError(error)) {
      return buildFallbackCarList(preferred);
    }
    throw error;
  }
}

/**
 * Car2_SelecCar — confirm car selection and fetch pricing.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=Car2_SelecCar
 */
export async function car2SelectCar(
  params: CarSelectParams
): Promise<CarSelectResult> {
  try {
    const strings = await callGuestApi('Car2_SelecCar', [
      { name: 'UserTypeId', value: String(params.userTypeId ?? GUEST_USER_TYPE_ID) },
      { name: 'UserId', value: String(params.userId ?? GUEST_USER_ID) },
      {
        name: 'CurrencyCode',
        value: (() => {
          const code = String(params.defaultCurrency || '')
            .trim()
            .toUpperCase();
          return /^[A-Z]{3}$/.test(code) ? code : 'ETB';
        })()
      },
      {
        name: 'CurrencyValue',
        value: (() => {
          const n = Number(params.defaultCurrencyValue ?? 1);
          return Number.isFinite(n) && n > 0 ? String(n) : '1';
        })()
      },
      { name: 'CarMarkup', value: String(params.carMarkup ?? 0) },
      { name: 'JsonSelectCar', value: params.jsonSelectCar }
    ]);

    return parseCarSelectResponse(strings);
  } catch (error) {
    if (error instanceof GuestApiError) {
      return {
        car: null,
        pricing: null,
        apiMessage: error.message
      };
    }
    throw error;
  }
}

export type { CarBookingInput, CarBookingResult } from './mapCarBooking';

/**
 * Car_Booking — save car rental after driver details and payment.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=Car_Booking
 */
export async function carBooking(
  input: CarBookingInput
): Promise<CarBookingResult> {
  const payload = buildCarBookingPayload(input);

  const strings = await callGuestApi('Car_Booking', [
    { name: 'UserTypeId', value: payload.userTypeId },
    { name: 'UserId', value: payload.userId },
    { name: 'CurrencyCode', value: payload.currencyCode },
    { name: 'CurrencyValue', value: payload.currencyValue },
    { name: 'CarMarkup', value: payload.carMarkup },
    { name: 'JsonSelectCar', value: payload.jsonSelectCar },
    { name: 'BookingJson', value: payload.bookingJson },
    { name: 'ContactDetailJson', value: payload.contactDetailJson },
    { name: 'ReqPassangerJson', value: payload.reqPassangerJson },
    { name: 'RegDriverJson', value: payload.regDriverJson }
  ]);

  const raw = strings.join('\n').trim();
  return parseCarBookingResponse(raw);
}
