import { Plane, Bus, Building2, Car, Palmtree } from 'lucide-react';
import { Mode, MODE_META } from '../../components/travel/ethioTravelData';
import { callGuestApi } from './soapClient';

export type GuestProduct = {
  Id: number;
  Name: string;
  orderby: number;
};

export type ProductCategory = {
  id: number;
  mode: Mode;
  label: string;
  orderby: number;
  icon: typeof Plane;
};

const PRODUCT_MODE_MAP: Record<string, Mode> = {
  flight: 'flights',
  hotel: 'hotels',
  car: 'minibus',
  bus: 'bus',
  holiday: 'holiday'
};

const PRODUCT_ICONS: Partial<Record<Mode, typeof Plane>> = {
  flights: Plane,
  hotels: Building2,
  minibus: Car,
  bus: Bus,
  holiday: Palmtree
};

const PRODUCT_LABELS: Partial<Record<Mode, string>> = {
  minibus: 'Car Rentals'
};

export const FALLBACK_PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 8, mode: 'flights', label: 'Flights', orderby: 1, icon: Plane },
  { id: 4, mode: 'hotels', label: 'Hotels', orderby: 2, icon: Building2 },
  { id: 2, mode: 'minibus', label: 'Car Rentals', orderby: 3, icon: Car },
  { id: 21, mode: 'holiday', label: 'Tours', orderby: 4, icon: Palmtree },
  { id: 22, mode: 'bus', label: 'Bus', orderby: 5, icon: Bus }
];

function mapProduct(product: GuestProduct): ProductCategory | null {
  if (!product?.Name || product.Id === 0) return null;

  const key = product.Name.trim().toLowerCase();
  const mode = PRODUCT_MODE_MAP[key];
  if (!mode) return null;

  return {
    id: product.Id,
    mode,
    label: PRODUCT_LABELS[mode] ?? product.Name.trim(),
    orderby: product.orderby ?? 0,
    icon: PRODUCT_ICONS[mode] ?? MODE_META[mode]?.icon ?? Plane
  };
}

/**
 * GetProductAccess — list travel products enabled for this guest account.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx/GetProductAccess
 */
export async function getProductAccess(): Promise<ProductCategory[]> {
  const strings = await callGuestApi('GetProductAccess', []);
  const raw = strings.find((entry) => entry.startsWith('[')) ?? strings[0];
  if (!raw) return FALLBACK_PRODUCT_CATEGORIES;

  const list = JSON.parse(raw) as GuestProduct[];
  return list.
  map(mapProduct).
  filter((item): item is ProductCategory => item != null).
  sort((a, b) => a.orderby - b.orderby);
}
