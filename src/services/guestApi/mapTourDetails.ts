import type { TourActivity } from './mapTourToListing';
import { resolveTourImageUrl } from './mapTourToListing';

/** Core package row from TourPackageDetails `Table` / TourDetails `Table4`. */
export type TourDetailRaw = {
  TourID?: number | string;
  TourId?: number | string;
  CategoryId?: number | string;
  PackageCategoryId?: number | string;
  TourThemeId?: number | string;
  Destination?: string;
  Source?: string;
  TourPackage?: string;
  TourPackage2?: string;
  TourPackage3?: string;
  Duration?: string;
  ValidFrom?: string;
  ValidTo?: string;
  AdultPrice?: number | string;
  ChildPrice?: number | string;
  InfantPrice?: number | string;
  VideoLink?: string;
  MapLink?: string;
  Description?: string;
  Terms?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  image4?: string;
  image5?: string;
  image6?: string;
  MaximumPersons?: string | number;
  Category?: string;
  TourTheme?: string;
  PackageCategory?: string | null;
  UsersCurrency?: string;
  UsersCurrencyRate?: number | string;
  DefaultCurrency?: string;
  DefaultCurrencyRate?: number | string;
  AdminCurrency?: string;
  AdminCurrencyRate?: number | string;
  Reviewcount?: number | string;
  StarCount?: number | string;
  TripCost?: number | string;
  TotalServiceFee?: number | string;
  ServiceFee?: number | string;
  Total?: number | string;
  GST?: number | string;
  TotalTourGST?: number | string;
  [key: string]: unknown;
};

export type TourModalityRaw = {
  modalities_code?: string;
  modalities_name?: string;
  modalities_rate?: string;
  modalities_rateKey?: string;
  durationvalue?: string;
  durationmetric?: string;
  cancelpolicyDate?: string;
  cancelpolicypAmount?: string;
  amountWithoutTax?: string;
  [key: string]: unknown;
};

export type TourModality = {
  id: string;
  code: string;
  name: string;
  rate: number;
  rateKey: string;
  duration: string;
  cancelBy?: string;
  cancelAmount?: number;
  amountWithoutTax?: number;
};

export type TourItineraryDay = {
  id: string;
  title: string;
  image?: string;
  description: string;
  meals?: string;
  transfer?: string;
  sightseeing?: string;
  flight?: string;
};

export type TourDayOverview = {
  day: string;
  morning?: string;
  noon?: string;
  evening?: string;
  fullday?: string;
};

export type TourFaq = {
  id: string;
  question: string;
  answer: string;
};

export type TourCancellationRule = {
  id: string;
  window: string;
  charge: string;
};

export type TourPaymentRule = {
  id: string;
  window: string;
  amount: string;
};

export type TourPriceBreakdown = {
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  tripCost: number;
  serviceFeePercent: number;
  totalServiceFee: number;
  total: number;
  gst: number;
  totalTourGst: number;
  usersCurrency: string;
  defaultCurrency: string;
  adminCurrency: string;
  /** Currency that matches the priced amounts from TourDetails. */
  displayCurrency: string;
};

export type TourDetails = {
  code: string;
  activityCode: string;
  name: string;
  /** Secondary package labels (TourPackage2 / TourPackage3). */
  nameAlt?: string;
  nameAlt2?: string;
  location: string;
  source?: string;
  destinationCode: string;
  country: string;
  category: string;
  theme?: string;
  descriptionHtml: string;
  descriptionText: string;
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  packageTags: string[];
  operationDays: string[];
  itinerary: TourItineraryDay[];
  dayOverview: TourDayOverview[];
  faqs: TourFaq[];
  terms?: string;
  cancellationPolicy: TourCancellationRule[];
  paymentPolicy: TourPaymentRule[];
  images: string[];
  thumbnails: string[];
  price: number;
  childPrice?: number;
  infantPrice?: number;
  currency: TourActivity['currency'];
  priceBreakdown: TourPriceBreakdown;
  duration?: string;
  maxPersons?: string;
  stars?: number;
  reviewCount?: number;
  validFrom?: string;
  validTo?: string;
  videoLink?: string;
  mapLink?: string;
  modalityName?: string;
  modalities: TourModality[];
  apiPayload?: TourDetailRaw;
};

export type TourPackageDetailsDataset = {
  Table?: TourDetailRaw[];
  Table1?: Array<{ HighlightID?: number; Highlight?: string; TourId?: number }>;
  Table2?: Array<{
    PackageHighlightId?: number;
    PackageHighlight?: string;
    TourId?: number;
  }>;
  Table3?: Array<{ InclusionsID?: number; Inclusions?: string; TourId?: number }>;
  Table4?: Array<{ ExclusionsID?: number; Exclusions?: string; TourId?: number }>;
  Table5?: Array<{
    ItineraryID?: number;
    ItineraryTitle?: string;
    Image?: string;
    Description?: string | null;
    Fight?: string;
    Hotel?: string;
    Car?: string;
    Bus?: string;
    Visa?: string;
    Meals?: string;
    Transfer?: string;
    Sightseeing?: string;
    TourId?: number;
  }>;
  Table6?: Array<{
    dayOverviewId?: number;
    Days?: string;
    Morning?: string;
    Noon?: string;
    Evening?: string;
    Fullday?: string;
    TourId?: number;
  }>;
  Table7?: Array<{
    TeamConId?: number;
    TeamConTitle?: string | null;
    TeamCon?: string;
    TourId?: number;
  }>;
  Table8?: Array<{
    CancellationId?: number;
    Daysbeforedep?: string;
    CancellationCharge?: string;
    TourId?: number;
  }>;
  Table9?: Array<{
    FAQID?: number;
    FAQ?: string;
    Answer?: string;
    TourId?: number;
  }>;
  Table10?: Array<{
    PaymentPolicyId?: number;
    PaymentPolicy?: string;
    OnAdWebsite?: string;
    TourId?: number;
  }>;
  [key: string]: unknown;
};

function mapCurrency(code?: string, preferred?: string): string {
  const c = String(code || preferred || 'ETB')
    .trim()
    .toUpperCase();
  return /^[A-Z]{3}$/.test(c) ? c : 'ETB';
}

function stripHtmlToText(html: string): string {
  if (!html?.trim()) return '';
  return html.
  replace(/<br\s*\/?>/gi, '\n').
  replace(/<\/p>/gi, '\n\n').
  replace(/<[^>]+>/g, ' ').
  replace(/&nbsp;/gi, ' ').
  replace(/&amp;/gi, '&').
  replace(/&lt;/gi, '<').
  replace(/&gt;/gi, '>').
  replace(/&quot;/gi, '"').
  replace(/&#39;/gi, "'").
  replace(/\s+\n/g, '\n').
  replace(/\n{3,}/g, '\n\n').
  replace(/[ \t]{2,}/g, ' ').
  trim();
}

function decodeApiText(value: string): string {
  return stripHtmlToText(value);
}

function toMoneyNumber(value: unknown): number {
  if (value == null || value === '') return 0;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function uniqueFaqs(rows: TourFaq[]): TourFaq[] {
  const seen = new Set<string>();
  const out: TourFaq[] = [];
  for (const faq of rows) {
    const key = faq.question.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(faq);
  }
  return out;
}

function resolvePriceCurrency(info: TourDetailRaw, preferred?: string): string {
  const users = String(info.UsersCurrency || '').trim().toUpperCase();
  const def = String(info.DefaultCurrency || '').trim().toUpperCase();
  const admin = String(info.AdminCurrency || '').trim().toUpperCase();
  const pref = String(preferred || '').trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(users)) return users;
  if (/^[A-Z]{3}$/.test(pref)) return pref;
  if (/^[A-Z]{3}$/.test(def)) return def;
  if (/^[A-Z]{3}$/.test(admin)) return admin;
  return 'ETB';
}

function uniqueStrings(values: string[]): string[] {
  const out: string[] = [];
  for (const v of values) {
    const t = v.trim();
    if (t && !out.includes(t)) out.push(t);
  }
  return out;
}

function collectPackageImages(info: TourDetailRaw): string[] {
  const fromFields: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const key = `image${i}`;
    const url = resolveTourImageUrl(
      typeof info[key] === 'string' ? (info[key] as string) : undefined
    );
    if (url && !fromFields.includes(url)) fromFields.push(url);
  }
  return fromFields;
}

function formatDuration(value?: string, metric?: string): string {
  const n = Number(value) || 0;
  const m = (metric || 'DAYS').toUpperCase();
  if (m.includes('HOUR')) return n === 1 ? '1 hour' : `${n} hours`;
  if (m.includes('DAY')) return n === 1 ? '1 day' : `${n} days`;
  if (n > 0) return `${n} ${m.toLowerCase()}`;
  return '1 day';
}

export function mapTourModality(raw: TourModalityRaw, index: number): TourModality {
  const code = String(raw.modalities_code || `mod-${index}`);
  const rate = Number(String(raw.modalities_rate ?? '0').replace(/,/g, '')) || 0;
  return {
    id: code,
    code,
    name: String(raw.modalities_name || 'Option').trim(),
    rate,
    rateKey: String(raw.modalities_rateKey || '').trim(),
    duration: formatDuration(raw.durationvalue, raw.durationmetric),
    cancelBy: raw.cancelpolicyDate?.trim() || undefined,
    cancelAmount:
      raw.cancelpolicypAmount != null ?
        Number(String(raw.cancelpolicypAmount).replace(/,/g, '')) || undefined :
        undefined,
    amountWithoutTax:
      raw.amountWithoutTax != null ?
        Number(String(raw.amountWithoutTax).replace(/,/g, '')) || undefined :
        undefined
  };
}

function joinItineraryText(row: NonNullable<TourPackageDetailsDataset['Table5']>[number]): string {
  const parts = [
    row.Description,
    row.Fight,
    row.Hotel,
    row.Car,
    row.Bus,
    row.Visa,
    row.Transfer,
    row.Sightseeing
  ].
  map((p) => stripHtmlToText(String(p || ''))).
  filter(Boolean);
  return uniqueStrings(parts).join('\n\n');
}

/**
 * Map TourPackageDetails (+ optional TourDetails/modalities) into UI model.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=TourPackageDetails
 */
export function mapTourDetails(
  info: TourDetailRaw,
  modalitiesRaw: TourModalityRaw[] = [],
  packageData?: TourPackageDetailsDataset | null,
  preferredCurrency?: string
): TourDetails {
  const descriptionHtml = String(info.Description || info.description || '');
  const packageImages = collectPackageImages(info);
  const modalities = modalitiesRaw.map(mapTourModality);
  const adultPrice = toMoneyNumber(info.AdultPrice);
  const tripCost = toMoneyNumber(info.TripCost) || adultPrice;
  const amount = adultPrice || tripCost;
  const childPrice = toMoneyNumber(info.ChildPrice);
  const infantPrice = toMoneyNumber(info.InfantPrice);
  const totalServiceFee = toMoneyNumber(info.TotalServiceFee);
  const serviceFeePercent = toMoneyNumber(info.ServiceFee);
  const total = toMoneyNumber(info.Total) || tripCost + totalServiceFee;
  const gst = toMoneyNumber(info.GST);
  const totalTourGst = toMoneyNumber(info.TotalTourGST);
  const usersCurrency = String(info.UsersCurrency || '').trim().toUpperCase();
  const defaultCurrency = String(info.DefaultCurrency || '').trim().toUpperCase();
  const adminCurrency = String(info.AdminCurrency || '').trim().toUpperCase();
  const displayCurrency = resolvePriceCurrency(info, preferredCurrency);
  const lowestModality = modalities.length ?
    Math.min(...modalities.map((m) => m.rate).filter((n) => n > 0)) :
    0;
  const code = String(info.TourID ?? info.TourId ?? '');
  const destination = String(info.Destination || '').trim();
  const source = String(info.Source || '').trim() || undefined;
  const location = destination || source || '—';
  const theme = String(info.TourTheme || '').trim() || undefined;
  const category = String(
    info.Category ||
    info.PackageCategory ||
    theme ||
    'TOUR PACKAGE'
  ).trim();
  const nameAlt = String(info.TourPackage2 || '').trim() || undefined;
  const nameAlt2 = String(info.TourPackage3 || '').trim() || undefined;

  const highlights = uniqueStrings(
    (packageData?.Table1 || []).map((r) => decodeApiText(String(r.Highlight || '')))
  );
  const packageTags = uniqueStrings(
    (packageData?.Table2 || []).map((r) =>
      decodeApiText(String(r.PackageHighlight || ''))
    )
  );
  const inclusions = uniqueStrings(
    (packageData?.Table3 || []).map((r) =>
      decodeApiText(String(r.Inclusions || ''))
    )
  );
  const exclusions = uniqueStrings(
    (packageData?.Table4 || []).map((r) =>
      decodeApiText(String(r.Exclusions || ''))
    )
  );

  const itinerarySeen = new Set<string>();
  const itinerary: TourItineraryDay[] = [];
  for (const row of packageData?.Table5 || []) {
    const title = decodeApiText(String(row.ItineraryTitle || 'Day'));
    const description = joinItineraryText(row);
    const key = `${title}|${description.slice(0, 80)}`;
    if (itinerarySeen.has(key)) continue;
    itinerarySeen.add(key);
    itinerary.push({
      id: String(row.ItineraryID ?? itinerary.length),
      title,
      image: resolveTourImageUrl(row.Image),
      description,
      meals: row.Meals?.trim() || undefined,
      transfer: row.Transfer?.trim() || undefined,
      sightseeing: row.Sightseeing?.trim() || undefined,
      flight: row.Fight?.trim() || undefined
    });
  }

  const daySeen = new Set<string>();
  const dayOverview: TourDayOverview[] = [];
  for (const row of packageData?.Table6 || []) {
    const day = String(row.Days || '').trim();
    if (!day || daySeen.has(day)) continue;
    daySeen.add(day);
    dayOverview.push({
      day,
      morning: decodeApiText(String(row.Morning || '')) || undefined,
      noon: decodeApiText(String(row.Noon || '')) || undefined,
      evening: decodeApiText(String(row.Evening || '')) || undefined,
      fullday: decodeApiText(String(row.Fullday || '')) || undefined
    });
  }

  const terms = uniqueStrings(
    (packageData?.Table7 || []).map((r) => decodeApiText(String(r.TeamCon || '')))
  ).join('\n\n') || (info.Terms?.trim() || undefined);

  const cancellationPolicy: TourCancellationRule[] = (packageData?.Table8 || []).
  map((row, i) => ({
    id: String(row.CancellationId ?? i),
    window: decodeApiText(String(row.Daysbeforedep || '')),
    charge: decodeApiText(String(row.CancellationCharge || ''))
  })).
  filter((r) => r.window || r.charge);

  const faqs: TourFaq[] = uniqueFaqs(
    (packageData?.Table9 || []).
    map((row, i) => ({
      id: String(row.FAQID ?? i),
      question: decodeApiText(String(row.FAQ || '')),
      answer: decodeApiText(String(row.Answer || ''))
    })).
    filter((f) => f.question && f.answer)
  );

  const paymentPolicy: TourPaymentRule[] = (packageData?.Table10 || []).
  map((row, i) => ({
    id: String(row.PaymentPolicyId ?? i),
    window: decodeApiText(String(row.PaymentPolicy || '')),
    amount: decodeApiText(String(row.OnAdWebsite || ''))
  })).
  filter((r) => r.window || r.amount);

  const stars = Number(info.StarCount) || undefined;
  const reviewCount = Number(info.Reviewcount) || undefined;
  const maxPersons = info.MaximumPersons != null ?
    String(info.MaximumPersons).trim() :
    undefined;
  const videoLink = String(info.VideoLink || '').trim() || undefined;
  const mapLink = String(info.MapLink || '').trim() || undefined;

  const priceBreakdown: TourPriceBreakdown = {
    adultPrice,
    childPrice,
    infantPrice,
    tripCost,
    serviceFeePercent,
    totalServiceFee,
    total,
    gst,
    totalTourGst,
    usersCurrency,
    defaultCurrency,
    adminCurrency,
    displayCurrency
  };

  return {
    code,
    activityCode: code,
    name: String(info.TourPackage || 'Tour').trim(),
    nameAlt,
    nameAlt2,
    location,
    source,
    destinationCode: '',
    country: '',
    category,
    theme,
    descriptionHtml,
    descriptionText: stripHtmlToText(descriptionHtml),
    inclusions,
    exclusions,
    highlights,
    packageTags,
    operationDays: [],
    itinerary,
    dayOverview,
    faqs,
    terms: terms || undefined,
    cancellationPolicy,
    paymentPolicy,
    images: packageImages,
    thumbnails: packageImages,
    price: lowestModality || amount || total || tripCost,
    childPrice: childPrice || undefined,
    infantPrice: infantPrice || undefined,
    currency: mapCurrency(displayCurrency, preferredCurrency),
    priceBreakdown,
    duration: info.Duration?.trim() || undefined,
    maxPersons,
    stars,
    reviewCount,
    validFrom: info.ValidFrom,
    validTo: info.ValidTo,
    videoLink,
    mapLink,
    modalities,
    apiPayload: info
  };
}

function isPackageDetailRow(row: Record<string, unknown>): boolean {
  return (
    row.TourPackage != null ||
    row.TourID != null ||
    row.TourId != null ||
    row.AdultPrice != null
  );
}

/** TourDetails SOAP payload: `{"Table4":[{...}]}` */
export function parseTourGetDetailsPayload(raw: string): {
  info: TourDetailRaw | null;
  modalities: TourModalityRaw[];
  apiMessage?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { info: null, modalities: [] };

  if (
    !trimmed.startsWith('[') &&
    !trimmed.startsWith('{') &&
    !trimmed.includes('|||')
  ) {
    return { info: null, modalities: [], apiMessage: trimmed };
  }

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as {
        Table?: TourDetailRaw[];
        Table4?: TourDetailRaw[];
      } & TourDetailRaw;
      const table =
        (Array.isArray(parsed.Table4) && parsed.Table4) ||
        (Array.isArray(parsed.Table) && parsed.Table) ||
        null;
      if (
        table?.length &&
        isPackageDetailRow(table[0] as Record<string, unknown>)
      ) {
        return { info: table[0], modalities: [] };
      }
      if (isPackageDetailRow(parsed as Record<string, unknown>)) {
        return { info: parsed as TourDetailRaw, modalities: [] };
      }
    } catch {
      // fall through
    }
  }

  return { info: null, modalities: [] };
}

/** Parse TourPackageDetails JSON (`Table`…`Table10`). */
export function parseTourPackageDetailsPayload(
  raw: string
): TourPackageDetailsDataset | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    return JSON.parse(trimmed) as TourPackageDetailsDataset;
  } catch {
    return null;
  }
}
