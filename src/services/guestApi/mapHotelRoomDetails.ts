import type { HotelRoomType } from './mapHotelDetails';

export type HotelRoomPricing = {
  Room?: string;
  Guest?: string;
  Night?: string;
  CurrencyCode?: string;
  RoomFare?: string;
  HotelTax?: string;
  TotalFare?: string;
  GSTType?: string;
  TotalGST?: string;
  ServiceTax?: string;
  GrandTotal?: string;
};

export type HotelRoomDetailsResult = {
  room: HotelRoomType | null;
  pricing: HotelRoomPricing | null;
  apiMessage?: string;
};

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

function isRoomDetailRow(row: Record<string, unknown>): boolean {
  // Hotel3 RoomInfo — not FareSummary (which uses Room/Guest/Night counts).
  return (
    row.RoomCode != null ||
    row.RoomName != null ||
    row.BookingCode != null ||
    row.ShowPrice != null
  );
}

function isRoomPricingRow(row: Record<string, unknown>): boolean {
  return (
    row.GrandTotal != null ||
    row.TotalFare != null ||
    row.RoomFare != null && row.HotelTax != null ||
    row.CurrencyCode != null && row.Guest != null && row.Night != null
  );
}

export function buildJsonSelectRoom(room: HotelRoomType): string {
  return JSON.stringify([room]);
}

export function parseHotelRoomDetailsResponse(
  strings: string[]
): HotelRoomDetailsResult {
  const result: HotelRoomDetailsResult = {
    room: null,
    pricing: null,
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
    if (isRoomPricingRow(first)) {
      result.pricing = first as unknown as HotelRoomPricing;
      continue;
    }
    if (isRoomDetailRow(first)) {
      result.room = first;
    }
  }

  return result;
}
