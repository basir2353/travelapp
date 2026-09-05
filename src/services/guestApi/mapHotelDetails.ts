import { Hotel } from '../../components/travel/ethioTravelData';
import type { HotelListItem } from './mapHotelToListing';

export type HotelDetailInfo = {
  HotelCode?: string;
  HotelName?: string;
  Address?: string;
  City?: string;
  Country?: string;
  RegionId?: string;
  Phone?: string;
  Email?: string;
  Website?: string | null;
  Category?: string;
  Latitude?: number;
  Longitude?: number;
  Imageurl?: string;
  Distance?: string;
  TotalRooms?: string;
  MinimumRate?: number | null;
  MaximumRate?: number | null;
  Description?: string;
  RefundString?: string;
  Inclusion?: string | null;
  CheckInTime?: string;
  CheckOutTime?: string;
  CheckInDate?: string;
  CheckOutDate?: string;
  TotalDay?: number;
  TotalAdult?: number;
  TotalChild?: number;
};

export type HotelDetailImage = {
  HotelCode?: string;
  Path?: string;
  Description?: string;
};

export type HotelDetailFacility = {
  HotelCode?: string;
  FacilityCode?: number;
  FacilityName?: string;
  FacilityType?: string;
};

export type HotelRoomType = Record<string, unknown>;

export type HotelDetailsResult = {
  details: HotelDetailInfo | null;
  images: HotelDetailImage[];
  facilities: HotelDetailFacility[];
  roomTypes: HotelRoomType[];
  extras: unknown[];
  apiMessage?: string;
};

function isHotelDetailRow(row: Record<string, unknown>): boolean {
  // Require HotelName (or Address+City). HotelCode alone also appears on Images/Facilities.
  return (
    row.HotelName != null ||
    row.Address != null && row.City != null
  );
}

function isHotelImageRow(row: Record<string, unknown>): boolean {
  return row.Path != null && (row.HotelCode != null || row.Description != null);
}

function isHotelFacilityRow(row: Record<string, unknown>): boolean {
  return row.FacilityName != null || row.FacilityType != null;
}

function isHotelRoomRow(row: Record<string, unknown>): boolean {
  return (
    row.RoomCode != null ||
    row.RoomType != null ||
    row.RoomName != null ||
    row.RatePlanName != null ||
    row.BookingCode != null ||
    row.RateKey != null ||
    row.TotalRate != null ||
    row.RoomRate != null ||
    row.ShowPrice != null
  );
}

function parseJsonArray(entry: string): Record<string, unknown>[] {
  try {
    const parsed = JSON.parse(entry) as
      | Record<string, unknown>
      | Record<string, unknown>[];
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

export function parseHotelDetailsResponse(strings: string[]): HotelDetailsResult {
  const result: HotelDetailsResult = {
    details: null,
    images: [],
    facilities: [],
    roomTypes: [],
    extras: [],
    apiMessage: undefined
  };

  for (const entry of strings) {
    if (!entry || entry === '[]') continue;

    if (!entry.startsWith('[') && !entry.startsWith('{')) {
      const msg = entry.trim();
      if (msg) {
        result.apiMessage = result.apiMessage ?
        `${result.apiMessage} | ${msg}` :
        msg;
      }
      continue;
    }

    const rows = parseJsonArray(entry);
    if (rows.length === 0) continue;

    const first = rows[0];
    if (isHotelDetailRow(first)) {
      result.details = first as unknown as HotelDetailInfo;
      continue;
    }
    if (isHotelImageRow(first)) {
      result.images = rows as unknown as HotelDetailImage[];
      continue;
    }
    if (isHotelFacilityRow(first)) {
      result.facilities = rows as unknown as HotelDetailFacility[];
      continue;
    }
    if (isHotelRoomRow(first)) {
      result.roomTypes = rows;
      continue;
    }

    result.extras.push(...rows);
  }

  return result;
}

export function buildSelectHotelJson(hotel: Hotel): string {
  const payload = hotel.apiPayload as HotelListItem | undefined;
  if (!payload) return JSON.stringify([]);
  return JSON.stringify([payload]);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function formatCheckTime(value?: string, fallback = ''): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

export function mergeHotelWithDetails(
  hotel: Hotel,
  details: HotelDetailsResult
): Hotel {
  const info = details.details;
  if (!info) return hotel;

  const gallery = uniqueStrings(
    details.images.map((img) => img.Path?.trim() ?? '').filter(Boolean)
  );
  const facilityNames = uniqueStrings(
    details.facilities.map((f) => f.FacilityName?.trim() ?? '')
  );
  const nights = Math.max(1, info.TotalDay ?? hotel.totalNights ?? 1);
  const listPayload = hotel.apiPayload as HotelListItem | undefined;
  const totalPrice = hotel.totalStayPrice ?? listPayload?.TotalPrice ?? 0;
  const pricePerNight =
  totalPrice > 0 ? Math.round(totalPrice / nights) : hotel.pricePerNight;

  const roomOptions =
  details.roomTypes.length > 0 ?
  details.roomTypes.map((room, index) => {
    const name = String(
      room.RoomName ?? room.RoomType ?? room.RatePlanName ?? `Room ${index + 1}`
    );
    const nightsCount = Math.max(1, nights);
    const showPrice = Number(room.ShowPrice ?? 0);
    const totalRate = Number(
      room.TotalPrice ?? room.TotalRate ?? room.RoomRate ?? 0
    );
    const stayPrice = showPrice > 0 ? showPrice : totalRate;
    const image =
      String(room.Imageurl ?? room.ImageUrl ?? '') ||
      gallery[0] ||
      hotel.image ||
      '';
    const inclusion = String(room.Inclusion ?? '').trim();
    const refundableText = String(room.Refundable ?? '');
    const perks = [
      inclusion || undefined,
      refundableText || undefined,
      String(room.PaymentInfo ?? '').trim() || undefined
    ].filter((value): value is string => !!value).slice(0, 3);
    const refundable =
    refundableText.toLowerCase() === 'yes' ||
    refundableText.toLowerCase().includes('free') ||
    !refundableText.toLowerCase().includes('prepay') &&
    !String(room.RefundString ?? hotel.tags[0] ?? '').
    toLowerCase().
    includes('non-refund');

    return {
      id: String(room.RoomCode ?? `room-${index}`),
      name,
      image,
      perks: perks.length > 0 ? perks : facilityNames.slice(0, 2),
      pricePerNight:
      stayPrice > 0 ?
      Math.round(stayPrice / nightsCount) :
      pricePerNight,
      showPrice: stayPrice > 0 ? stayPrice : undefined,
      totalTaxes: Number(room.TotalTaxes ?? 0) || undefined,
      inclusion: inclusion || undefined,
      cancellationAmount: String(room.CancellationAmount ?? '').trim() || undefined,
      paymentInfo: String(room.PaymentInfo ?? '').trim() || undefined,
      refundable,
      apiPayload: room
    };
  }) :
  hotel.roomOptions;

  return {
    ...hotel,
    name: info.HotelName?.trim() || hotel.name,
    location: info.City?.trim() || hotel.location,
    stars: Math.max(
      0,
      Math.min(5, Number.isFinite(Number(info.Category)) ? Number(info.Category) : hotel.stars)
    ),
    image: info.Imageurl?.trim() || gallery[0] || hotel.image,
    gallery: gallery.length > 0 ? gallery : hotel.gallery,
    address:
    [info.Address, info.City, info.Country].filter(Boolean).join(', ') ||
    hotel.address,
    distanceFromCenter: info.Distance?.trim() || hotel.distanceFromCenter,
    description:
    info.Description?.trim() ||
    `Stay at ${info.HotelName ?? hotel.name} in ${info.City ?? hotel.location}.`,
    facilities: facilityNames.length > 0 ? facilityNames : hotel.facilities,
    amenities:
    facilityNames.length > 0 ?
    facilityNames.slice(0, 6) :
    hotel.amenities,
    tags: info.RefundString?.trim() ?
    [info.RefundString.trim()] :
    hotel.tags,
    checkIn: formatCheckTime(info.CheckInTime, hotel.checkIn || '2:00 PM'),
    checkOut: formatCheckTime(info.CheckOutTime, hotel.checkOut || '12:00 PM'),
    totalNights: nights,
    pricePerNight,
    totalStayPrice: totalPrice > 0 ? totalPrice : hotel.totalStayPrice,
    roomOptions,
    roomType: roomOptions?.[0]?.name || hotel.roomType
  };
}
