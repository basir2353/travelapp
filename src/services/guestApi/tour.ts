import { callGuestApi } from './soapClient';
import { GUEST_USER_ID } from './car';
import {
  mapTourItemToActivity,
  type TourActivity,
  type TourListItem
} from './mapTourToListing';
import {
  mapTourDetails,
  parseTourGetDetailsPayload,
  parseTourPackageDetailsPayload,
  type TourDetails
} from './mapTourDetails';
import {
  buildTourBookingParams,
  parseTourBookingResponse,
  type TourBookingInput,
  type TourBookingResult
} from './mapTourBooking';

export type TourListParams = {
  destinationName: string;
  fromDate: string;
  toDate: string;
  adultCount?: number;
  childCount?: number;
  defaultCurrency?: string;
  userId?: number;
};

export type TourListResult = {
  tours: TourActivity[];
  raw: TourListItem[];
  apiMessage?: string;
};

export type TourDetailsParams = {
  tourCode: string;
  fromDate: string;
  toDate: string;
  adultCount?: number;
  childCount?: number;
  defaultCurrency?: string;
  userId?: number;
};

export type TourDetailsResult = {
  details: TourDetails | null;
  apiMessage?: string;
};

type TourListDataset = {
  Table?: TourListItem[];
  Table1?: Array<{ TotalRecords?: number; TotalPage?: number }>;
};

function isTourListItem(value: unknown): value is TourListItem {
  if (!value || typeof value !== 'object') return false;
  const row = value as TourListItem;
  return Boolean(
    row.TourId != null ||
    row.TourPackage ||
    row.name ||
    row.code ||
    row.activityCode
  );
}

function extractTourListItems(strings: string[]): {
  items: TourListItem[];
  apiMessage?: string;
} {
  let items: TourListItem[] = [];
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
      const parsed = JSON.parse(entry) as
        | TourListItem
        | TourListItem[]
        | TourListDataset;

      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && isTourListItem(parsed[0])) {
          items = parsed;
        }
        continue;
      }

      if (parsed && typeof parsed === 'object') {
        const dataset = parsed as TourListDataset;
        if (Array.isArray(dataset.Table)) {
          items = dataset.Table.filter(isTourListItem);
          continue;
        }
        if (isTourListItem(parsed)) {
          items = [parsed as TourListItem];
        }
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
 * TourGetList — search tours by destination city name (e.g. "Dubai").
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=TourGetList
 */
export async function tourGetList(
  params: TourListParams
): Promise<TourListResult> {
  const adultCount = params.adultCount ?? 1;
  const childCount = params.childCount ?? 0;
  const defaultCurrency = (() => {
    const code = String(params.defaultCurrency || '')
      .trim()
      .toUpperCase();
    return /^[A-Z]{3}$/.test(code) ? code : 'ETB';
  })();

  const strings = await callGuestApi('TourGetList', [
    { name: 'DestinationName', value: params.destinationName },
    { name: 'FromDate', value: params.fromDate },
    { name: 'ToDate', value: params.toDate },
    { name: 'AdultCount', value: String(adultCount) },
    { name: 'ChildCount', value: String(childCount) },
    { name: 'DefaultCurrency', value: defaultCurrency },
    { name: 'UserId', value: String(params.userId ?? GUEST_USER_ID) }
  ]);

  const { items, apiMessage } = extractTourListItems(strings);
  return {
    tours: items.map((item, index) =>
      mapTourItemToActivity(item, index, defaultCurrency)
    ),
    raw: items,
    apiMessage
  };
}

/**
 * TourPackageDetails (primary) + TourDetails (pricing fallback).
 * TourCode = TourId from TourGetList.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=TourPackageDetails
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=TourDetails
 */
export async function tourGetDetails(
  params: TourDetailsParams
): Promise<TourDetailsResult> {
  const adultCount = params.adultCount ?? 1;
  const childCount = params.childCount ?? 0;
  const userId = String(params.userId ?? GUEST_USER_ID);
  const currency = (() => {
    const code = String(params.defaultCurrency || '')
      .trim()
      .toUpperCase();
    return /^[A-Z]{3}$/.test(code) ? code : 'ETB';
  })();

  const [packageStrings, detailStrings] = await Promise.all([
    callGuestApi('TourPackageDetails', [
      { name: 'TourCode', value: params.tourCode }
    ]),
    callGuestApi('TourDetails', [
      { name: 'TourCode', value: params.tourCode },
      { name: 'FromDate', value: params.fromDate },
      { name: 'ToDate', value: params.toDate },
      { name: 'AdultCount', value: String(adultCount) },
      { name: 'ChildCount', value: String(childCount) },
      { name: 'UserId', value: userId },
      { name: 'DefaultCurrency', value: currency }
    ]).catch(() => [] as string[])
  ]);

  let apiMessage: string | undefined;
  let packageData: ReturnType<typeof parseTourPackageDetailsPayload> = null;

  for (const entry of packageStrings) {
    if (!entry) continue;
    if (
      !entry.startsWith('{') &&
      !entry.startsWith('[') &&
      entry.toLowerCase() !== 'no error'
    ) {
      apiMessage = entry.trim();
      continue;
    }
    const parsed = parseTourPackageDetailsPayload(entry);
    if (
      parsed &&
      (
        (parsed.Table && parsed.Table.length > 0) ||
        (parsed.Table1 && parsed.Table1.length > 0) ||
        (parsed.Table5 && parsed.Table5.length > 0) ||
        (parsed.Table6 && parsed.Table6.length > 0)
      )
    ) {
      packageData = parsed;
      break;
    }
  }

  let detailInfo: ReturnType<typeof parseTourGetDetailsPayload>['info'] = null;
  let modalities: ReturnType<typeof parseTourGetDetailsPayload>['modalities'] =
    [];
  for (const entry of detailStrings) {
    if (!entry) continue;
    const parsed = parseTourGetDetailsPayload(entry);
    if (parsed.apiMessage && !parsed.info) {
      apiMessage = apiMessage || parsed.apiMessage;
      continue;
    }
    if (parsed.info) {
      detailInfo = parsed.info;
      modalities = parsed.modalities;
      break;
    }
  }

  // Package Table is the content source; TourDetails Table4 fills pricing / currency.
  const packageInfo = packageData?.Table?.[0] ?? null;
  const info = packageInfo ?
    {
      ...(detailInfo ?? {}),
      ...packageInfo,
      // Keep fare breakup + currencies from TourDetails when Package omits them.
      AdultPrice: packageInfo.AdultPrice ?? detailInfo?.AdultPrice,
      ChildPrice: packageInfo.ChildPrice ?? detailInfo?.ChildPrice,
      InfantPrice: packageInfo.InfantPrice ?? detailInfo?.InfantPrice,
      TripCost: detailInfo?.TripCost ?? packageInfo.TripCost,
      TotalServiceFee: detailInfo?.TotalServiceFee ?? packageInfo.TotalServiceFee,
      ServiceFee: detailInfo?.ServiceFee ?? packageInfo.ServiceFee,
      Total: detailInfo?.Total ?? packageInfo.Total,
      GST: detailInfo?.GST ?? packageInfo.GST,
      TotalTourGST: detailInfo?.TotalTourGST ?? packageInfo.TotalTourGST,
      UsersCurrency: detailInfo?.UsersCurrency ?? packageInfo.UsersCurrency,
      DefaultCurrency: detailInfo?.DefaultCurrency ?? packageInfo.DefaultCurrency,
      AdminCurrency: detailInfo?.AdminCurrency ?? packageInfo.AdminCurrency,
      UsersCurrencyRate:
        detailInfo?.UsersCurrencyRate ?? packageInfo.UsersCurrencyRate,
      DefaultCurrencyRate:
        detailInfo?.DefaultCurrencyRate ?? packageInfo.DefaultCurrencyRate,
      AdminCurrencyRate:
        detailInfo?.AdminCurrencyRate ?? packageInfo.AdminCurrencyRate,
      Reviewcount: detailInfo?.Reviewcount ?? packageInfo.Reviewcount,
      StarCount: detailInfo?.StarCount ?? packageInfo.StarCount,
      VideoLink: packageInfo.VideoLink || detailInfo?.VideoLink,
      MapLink: packageInfo.MapLink || detailInfo?.MapLink
    } :
    detailInfo;

  if (!info) {
    return {
      details: null,
      apiMessage: apiMessage || 'No tour package details found'
    };
  }

  return {
    details: mapTourDetails(info, modalities, packageData, currency),
    apiMessage: undefined
  };
}

/**
 * TourBooking — create a tour package booking (updated BookingRequest JSON flow).
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=TourBooking
 */
export async function tourBooking(
  input: TourBookingInput
): Promise<TourBookingResult> {
  const params = buildTourBookingParams(input);
  const strings = await callGuestApi('TourBooking', [
    { name: 'DestCity', value: params.DestCity },
    { name: 'NoofAdults', value: params.NoofAdults },
    { name: 'TravelFromDate', value: params.TravelFromDate },
    { name: 'TravelToDate', value: params.TravelToDate },
    { name: 'NoofChildren', value: params.NoofChildren },
    { name: 'NoofInfants', value: params.NoofInfants },
    { name: 'Currency', value: params.Currency },
    { name: 'Amount', value: params.Amount },
    { name: 'TourId', value: params.TourId },
    { name: 'ChangeCurrency', value: params.ChangeCurrency },
    { name: 'ChangeCurrencyrate', value: params.ChangeCurrencyrate },
    { name: 'JsonHolidayDetail', value: params.JsonHolidayDetail },
    { name: 'ReqPassangerJson', value: params.ReqPassangerJson },
    { name: 'BookingJson', value: params.BookingJson }
  ]);

  const raw = strings.join('\n').trim();
  return parseTourBookingResponse(raw);
}

export type TourCategory = {
  id: number;
  name: string;
};

export type TourTheme = {
  id: number;
  name: string;
};

export const FALLBACK_TOUR_CATEGORIES: TourCategory[] = [
  { id: 1, name: 'Domestic Tour Package' },
  { id: 2, name: 'International Tour Package' }
];

export const FALLBACK_TOUR_THEMES: TourTheme[] = [
  { id: 1033, name: 'All Tour Theme' },
  { id: 1015, name: 'Beach Tour Packages' },
  { id: 1014, name: 'Family Tour Packages' },
  { id: 1016, name: 'Heritage Tour Packages' },
  { id: 1017, name: 'Wildlife Tour Packages' }
];

function parseTourCategoriesResponse(strings: string[]): TourCategory[] {
  for (const entry of strings) {
    if (!entry?.trim() || entry === '[]') continue;
    if (!entry.startsWith('[')) continue;
    try {
      const parsed = JSON.parse(entry) as Array<{
        CategoryId?: number | string;
        CategoryName?: string;
      }>;
      if (!Array.isArray(parsed)) continue;
      const categories = parsed.
        filter((row) => row.CategoryId != null && row.CategoryName?.trim()).
        map((row) => ({
          id: Number(row.CategoryId),
          name: String(row.CategoryName).trim()
        })).
        filter((row) => Number.isFinite(row.id) && row.name);
      if (categories.length > 0) return categories;
    } catch {
      // try next entry
    }
  }
  return [];
}

/**
 * TourCaregories — list tour package categories (Domestic / International, etc.).
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=TourCaregories
 */
export async function tourCategories(): Promise<TourCategory[]> {
  const strings = await callGuestApi('TourCaregories', []);
  const categories = parseTourCategoriesResponse(strings);
  return categories.length > 0 ? categories : FALLBACK_TOUR_CATEGORIES;
}

function parseTourThemesResponse(strings: string[]): TourTheme[] {
  for (const entry of strings) {
    if (!entry?.trim() || entry === '[]') continue;
    if (!entry.startsWith('[')) continue;
    try {
      const parsed = JSON.parse(entry) as Array<{
        Id?: number | string;
        TourTheme?: string;
      }>;
      if (!Array.isArray(parsed)) continue;
      const themes = parsed.
        filter((row) => row.Id != null && row.TourTheme?.trim()).
        map((row) => ({
          id: Number(row.Id),
          name: String(row.TourTheme).trim()
        })).
        filter((row) => Number.isFinite(row.id) && row.name);
      if (themes.length > 0) return themes;
    } catch {
      // try next entry
    }
  }
  return [];
}

/**
 * TourTheme — list tour themes used in holiday theme chips.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=TourTheme
 */
export async function tourThemes(): Promise<TourTheme[]> {
  const strings = await callGuestApi('TourTheme', []);
  const themes = parseTourThemesResponse(strings);
  return themes.length > 0 ? themes : FALLBACK_TOUR_THEMES;
}

export type { TourActivity, TourListItem } from './mapTourToListing';
export type {
  TourDetails,
  TourModality,
  TourItineraryDay,
  TourDayOverview,
  TourFaq,
  TourCancellationRule,
  TourPaymentRule,
  TourPriceBreakdown
} from './mapTourDetails';
export type {
  TourBookingInput,
  TourBookingResult,
  TourHolidayDetailRow,
  TourBookingMeta,
  TourPassengerRow
} from './mapTourBooking';
export {
  mapTourBookingGender,
  buildTourBookingParams,
  buildTourBookingRequest,
  buildTourBookingMeta,
  buildTourHolidayDetail,
  buildReqPassengerJson,
  formatTourTravelDate
} from './mapTourBooking';
export {
  TOUR_DESTINATION_RESULTS,
  extractTourDestinationCode,
  extractTourDestinationName,
  tourCardColor,
  resolveTourImageUrl,
  shortTourCategoryLabel
} from './mapTourToListing';
