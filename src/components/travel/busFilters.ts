import type { Trip } from './ethioTravelData';

export type BusSortOption = 'recommended' | 'price' | 'departure' | 'duration';

export type BusResultsTab = 'boarding' | 'dropping' | 'operators';

export type BusListFilters = {
  ac: boolean;
  sleeper: boolean;
  offers: boolean;
  newBuses: boolean;
  sort: BusSortOption;
  maxPrice: number | null;
  operatorChip: string | null;
  boardingChip: string | null;
  droppingChip: string | null;
  tab: BusResultsTab;
};

export const DEFAULT_BUS_FILTERS: BusListFilters = {
  ac: false,
  sleeper: false,
  offers: false,
  newBuses: false,
  sort: 'recommended',
  maxPrice: null,
  operatorChip: null,
  boardingChip: null,
  droppingChip: null,
  tab: 'operators'
};

export const BUS_BOARDING_CHIPS = [
  'Meskel Sq',
  'Autobus Terra',
  'Kality',
  'Megenagna'
] as const;

export const BUS_DROPPING_CHIPS = [
  'Main Station',
  'City Center',
  'Hotel Junction',
  'Roundabout'
] as const;

function isAcBus(trip: Trip): boolean {
  const text = `${trip.busType || ''} ${trip.tags.join(' ')}`.toLowerCase();
  return /a\/?c|air.?cond|climate/.test(text);
}

function isSleeperBus(trip: Trip): boolean {
  const text = `${trip.busType || ''} ${trip.tags.join(' ')}`.toLowerCase();
  return /sleeper|berth|sleep/.test(text);
}

function isOfferBus(trip: Trip): boolean {
  if (trip.price > 0 && trip.price <= 1000) return true;
  const text = trip.tags.join(' ').toLowerCase();
  return /offer|discount|deal|promo/.test(text);
}

function isNewBus(trip: Trip): boolean {
  const text = `${trip.operator} ${trip.busType || ''} ${trip.tags.join(' ')}`.toLowerCase();
  return /electric|virtual|new|mesob/.test(text);
}

function durationMins(trip: Trip): number {
  const raw = trip.duration || '';
  const hours = raw.match(/(\d+)\s*hrs?/i);
  const mins = raw.match(/(\d+)\s*min/i);
  return (hours ? Number(hours[1]) * 60 : 0) + (mins ? Number(mins[1]) : 0);
}

function departSortKey(trip: Trip): string {
  return (trip.departTime || '').replace(/\./g, ':').toUpperCase();
}

export function applyBusListFilters(
  trips: Trip[],
  filters: BusListFilters
): Trip[] {
  let list = trips.filter((trip) => {
    if (filters.ac && !isAcBus(trip)) return false;
    if (filters.sleeper && !isSleeperBus(trip)) return false;
    if (filters.offers && !isOfferBus(trip)) return false;
    if (filters.newBuses && !isNewBus(trip)) return false;
    if (filters.maxPrice != null && trip.price > filters.maxPrice) return false;
    if (filters.operatorChip) {
      const q = filters.operatorChip.toLowerCase();
      if (!trip.operator.toLowerCase().includes(q) &&
        !(trip.busType || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Boarding/dropping chips remember preference; soft-boost matching operators when set
  const chip =
    filters.tab === 'boarding' ?
    filters.boardingChip :
    filters.tab === 'dropping' ?
    filters.droppingChip :
    null;
  if (chip) {
    const q = chip.toLowerCase().slice(0, 4);
    list = [...list].sort((a, b) => {
      const aHit = a.operator.toLowerCase().includes(q) || a.tags.join(' ').toLowerCase().includes(q) ? 0 : 1;
      const bHit = b.operator.toLowerCase().includes(q) || b.tags.join(' ').toLowerCase().includes(q) ? 0 : 1;
      return aHit - bHit;
    });
  }

  switch (filters.sort) {
    case 'price':
      list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
      break;
    case 'departure':
      list = [...list].sort((a, b) =>
        departSortKey(a).localeCompare(departSortKey(b))
      );
      break;
    case 'duration':
      list = [...list].sort((a, b) => durationMins(a) - durationMins(b));
      break;
    default:
      break;
  }

  return list;
}

export function uniqueBusOperators(trips: Trip[]): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const trip of trips) {
    const name = trip.operator.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    list.push(name);
  }
  return list;
}
