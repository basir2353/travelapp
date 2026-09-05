import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Plane,
  MapPin,
  Hotel,
  Search,
  Bus,
  TrainFront,
  Star,
  Ticket,
  Download
} from 'lucide-react';
import {
  KTA,
  CITY_RESULTS,
  cur,
  type Mode,
  type Trip,
  type Hotel as HotelListing,
  type CarRental,
  type CityResult
} from './ethioTravelData';
import { CAR_RENTAL_CITY_RESULTS, TOUR_DESTINATION_RESULTS } from '../../services/guestApi';
import { useBusCitySearch } from '../../hooks/useBusCitySearch';
import { useFlightAirportAutocomplete } from '../../hooks/useFlightAirportAutocomplete';
import { useHotelCitiesAutocomplete } from '../../hooks/useHotelCitiesAutocomplete';
import { AirlineLogo } from './AirlineLogo';
import { downloadObjectUrl, downloadPdfFile } from '../../utils/bookingReceiptPdf';
import { TravelErrorState } from './TravelErrorState';

function Sheet({
  open,
  onClose,
  children,
  height = '85vh'
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string;
}) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open &&
      <>
        <motion.div
          key="sheet-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onClose}
          className="fixed inset-0 glass-overlay z-[55]" />
        <motion.div
          key="sheet-panel"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-0 left-0 right-0 glass-sheet rounded-t-ios-xl z-[56] flex flex-col pb-safe mx-auto w-full max-w-none"
          style={{ maxHeight: height }}>
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-9 h-1 rounded-full bg-gray-300/80" />
          </div>
          {children}
        </motion.div>
      </>
      }
    </AnimatePresence>,
    document.body
  );
}

function SheetHeader({
  title,
  onClose
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 shrink-0">
      <h2 className="text-[17px] font-bold text-text-primary">
        {title}
      </h2>
      <button
        onClick={onClose}
        className="w-9 h-9 rounded-full glass-btn-ghost flex items-center justify-center">
        <X className="w-4 h-4 text-text-secondary" />
      </button>
    </div>
  );
}

export function JourneySheet({
  open,
  trip,
  onClose,
  onSelect,
  destinationLabel,
  selectDisabled = false,
  mode,
  onBookHotel,
  price,
  currency
}: {
  open: boolean;
  trip: Trip | null;
  onClose: () => void;
  onSelect: () => void;
  /** Real destination name (e.g. Dubai / United Arab Emirates) — never "Your destination". */
  destinationLabel?: string;
  selectDisabled?: boolean;
  mode?: Mode;
  /** Opens hotel booking drawer for this flight destination. */
  onBookHotel?: (destination: string) => void;
  price?: number;
  currency?: string;
}) {
  const isBus = mode === 'bus' || mode === 'train';
  const arrivePlace =
    trip?.arriveCityCode ||
    trip?.toCity?.replace(/\s*\([^)]*\)\s*/g, '').trim() ||
    trip?.toCity ||
    '';
  const destName = (() => {
    const fromProp = destinationLabel?.trim();
    if (fromProp) {
      const bare = fromProp.replace(/\s*\([^)]*\)\s*/g, '').trim();
      if (bare) return bare;
      return fromProp;
    }
    const city = trip?.toCity?.replace(/\s*\([^)]*\)\s*/g, '').trim() || '';
    if (city && !/^[A-Z]{3}$/i.test(city)) return city;
    return trip?.toCity || arrivePlace || 'Destination';
  })();
  const departPlace = isBus
    ? `${(trip?.fromCity || 'Departure').replace(/\s*\([^)]*\)\s*/g, '').trim()} Terminal`
    : trip?.departCityCode || trip?.fromCity || '';
  const arrivePlaceLabel = isBus
    ? `${destName} Terminal`
    : arrivePlace;

  const viaStops = (trip?.routePoints ?? []).filter(
    (p) =>
      (p.kind === 'stop' || p.kind === 'leg') &&
      /^[A-Z]{3}$/i.test(String(p.code || ''))
  );
  const viaCodes = [...new Set(viaStops.map((p) => p.code.toUpperCase()))];
  const stopSummary =
    !trip ? '' :
    viaCodes.length > 0 ?
      `Via ${viaCodes.join(' · ')}` :
      trip.transfers === 0 ?
        'Direct' :
        trip.transfers === 1 ?
          '1 stop' :
          `${trip.transfers} stops`;

  type JourneyStep = {
    time: string;
    place: string;
    sub: string;
    icon: 'plane' | 'bus' | 'pin' | 'stop';
  };

  const steps: JourneyStep[] = trip ?
    [
      {
        time: trip.departTime,
        place: departPlace,
        sub: trip.operator + (trip.busType ? ` · ${trip.busType}` : ''),
        icon: isBus ? ('bus' as const) : ('plane' as const)
      },
      ...viaStops.map((stop) => ({
        time:
          stop.timeTo && stop.timeTo !== stop.time ?
            `${stop.time} → ${stop.timeTo}` :
            stop.time || '—',
        place: stop.code.toUpperCase(),
        sub:
          stop.note ||
          (stop.kind === 'leg' ? 'Next flight' : 'Stop'),
        icon: 'stop' as const
      })),
      {
        time: trip.arriveTime,
        place: arrivePlaceLabel,
        sub: isBus ? 'Your destination' : destName,
        icon: 'pin' as const
      }
    ] :
    [];

  return (
    <Sheet open={open} onClose={onClose}>
      {trip &&
      <>
        <SheetHeader title="Journey details" onClose={onClose} />
        <p
          className="px-[18px] text-[12px] mb-3"
          style={{
            color:
              viaCodes.length > 0 || (trip.transfers ?? 0) > 0 ?
                KTA.orange :
                KTA.textSecondary
          }}>
          {stopSummary}
          {isBus && trip.duration && trip.duration !== '—' ?
          ` · ${trip.duration}` :
          ''}
        </p>
        <div className="flex-1 overflow-y-auto px-[18px] pb-4">
          <div className="relative pl-8">
            <div
              className="absolute left-[11px] top-2 bottom-2 w-0.5"
              style={{
                backgroundColor: KTA.border
              }} />
            {steps.map((step, i) =>
            <div key={`${step.icon}-${step.place}-${i}`} className="relative mb-5">
              <div
                className="absolute -left-8 top-0 w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor:
                    step.icon === 'pin' ? '#fee2e2' :
                    step.icon === 'stop' ? '#FFF7ED' :
                    '#d1fae5',
                  border: `2px solid ${
                    step.icon === 'pin' ? KTA.red :
                    step.icon === 'stop' ? KTA.orange :
                    KTA.green
                  }`
                }}>
                {step.icon === 'pin' ?
                <MapPin
                  className="w-3 h-3"
                  style={{
                    color: KTA.red
                  }} /> :
                step.icon === 'stop' ?
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: KTA.orange }} /> :
                step.icon === 'bus' ?
                <Bus
                  className="w-3 h-3"
                  style={{
                    color: KTA.green
                  }} /> :

                <Plane
                  className="w-3 h-3"
                  style={{
                    color: KTA.green
                  }} />

                }
              </div>
              <p
                className="text-[14px] font-bold"
                style={{
                  color: step.icon === 'stop' ? KTA.orange : KTA.textPrimary
                }}>
                {step.time}
              </p>
              <p
                className="text-[13px] font-semibold break-words pr-1"
                style={{
                  color: step.icon === 'stop' ? KTA.orange : KTA.textPrimary
                }}>
                {step.place}
              </p>
              <p
                className="text-[11px] break-words pr-1"
                style={{
                  color: step.icon === 'stop' ? KTA.orange : KTA.textSecondary
                }}>
                {step.sub}
              </p>
            </div>
            )}
          </div>

          {!isBus &&
          <div
            className="rounded-[12px] p-3 flex items-center gap-3"
            style={{
              backgroundColor: '#E8F5EE'
            }}>
            <Hotel
              className="w-5 h-5"
              style={{
                color: KTA.blue
              }} />
            <div className="flex-1">
              <p
                className="text-[12px] font-semibold"
                style={{
                  color: KTA.textPrimary
                }}>
                Staying in {destName}?
              </p>
              <p
                className="text-[11px]"
                style={{
                  color: KTA.textSecondary
                }}>
                Room from ETB100 per night
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!onBookHotel) return;
                onBookHotel(destName);
              }}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-[8px] border"
              style={{
                borderColor: KTA.blue,
                color: KTA.blue
              }}>
              Book now
            </button>
          </div>
          }
        </div>

        <div
          className="px-[18px] py-3 border-t shrink-0"
          style={{
            borderColor: KTA.border
          }}>
          <p
            className="text-[11px] mb-2"
            style={{
              color: KTA.textSecondary
            }}>
            Outbound price for 1 adult
          </p>
          <button
            type="button"
            onClick={() => {
              if (selectDisabled) return;
              onSelect();
            }}
            disabled={selectDisabled}
            aria-disabled={selectDisabled}
            className={`w-full h-12 rounded-[14px] font-bold text-[14px] sm:text-[15px] px-3 whitespace-nowrap overflow-hidden text-ellipsis ${
              selectDisabled ?
              'bg-slate-200 text-slate-400 cursor-not-allowed' :
              'text-white'
            }`}
            style={
              selectDisabled ?
              undefined :
              { backgroundColor: KTA.green }
            }>
            Select this trip · {cur(price ?? trip.price, currency || trip.currency)}
          </button>
        </div>
      </>
      }
    </Sheet>
  );
}

/** Upsell hotel search while reviewing a flight journey. */
export function FlightHotelUpsellSheet({
  open,
  destination,
  onClose,
  onSearchHotels
}: {
  open: boolean;
  destination: string;
  onClose: () => void;
  onSearchHotels: (params: {
    destination: string;
    guests: number;
    rooms: number;
  }) => void;
}) {
  const city = destination.replace(/\s*\([^)]*\)\s*$/, '').trim() || destination;
  const [guests, setGuests] = useState(1);
  const [rooms, setRooms] = useState(1);

  useEffect(() => {
    if (!open) return;
    setGuests(1);
    setRooms(1);
  }, [open, city]);

  return (
    <Sheet open={open} onClose={onClose} height="70vh">
      <SheetHeader title={`Hotels in ${city}`} onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-[18px] pb-4 space-y-4">
        <div
          className="rounded-[12px] p-3 flex items-center gap-3"
          style={{ backgroundColor: '#E8F5EE' }}>
          <Hotel className="w-5 h-5" style={{ color: KTA.blue }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: KTA.textPrimary }}>
              Staying in {city}?
            </p>
            <p className="text-[11px]" style={{ color: KTA.textSecondary }}>
              Search hotels near your arrival and book without leaving travel.
            </p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold mb-1" style={{ color: KTA.textSecondary }}>
            Destination
          </p>
          <div
            className="h-12 rounded-[12px] px-3 flex items-center text-[14px] font-semibold"
            style={{ backgroundColor: KTA.inputBg, color: KTA.textPrimary }}>
            {city}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-bold mb-1" style={{ color: KTA.textSecondary }}>
              Guests
            </p>
            <div
              className="h-12 rounded-[12px] px-2 flex items-center justify-between"
              style={{ backgroundColor: KTA.inputBg }}>
              <button
                type="button"
                aria-label="Fewer guests"
                onClick={() => setGuests((n) => Math.max(1, n - 1))}
                className="w-8 h-8 rounded-full font-bold text-[16px]"
                style={{ color: KTA.blue }}>
                −
              </button>
              <span className="text-[14px] font-bold" style={{ color: KTA.textPrimary }}>
                {guests}
              </span>
              <button
                type="button"
                aria-label="More guests"
                onClick={() => setGuests((n) => Math.min(6, n + 1))}
                className="w-8 h-8 rounded-full font-bold text-[16px]"
                style={{ color: KTA.blue }}>
                +
              </button>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold mb-1" style={{ color: KTA.textSecondary }}>
              Rooms
            </p>
            <div
              className="h-12 rounded-[12px] px-2 flex items-center justify-between"
              style={{ backgroundColor: KTA.inputBg }}>
              <button
                type="button"
                aria-label="Fewer rooms"
                onClick={() => setRooms((n) => Math.max(1, n - 1))}
                className="w-8 h-8 rounded-full font-bold text-[16px]"
                style={{ color: KTA.blue }}>
                −
              </button>
              <span className="text-[14px] font-bold" style={{ color: KTA.textPrimary }}>
                {rooms}
              </span>
              <button
                type="button"
                aria-label="More rooms"
                onClick={() => setRooms((n) => Math.min(Math.min(4, guests), n + 1))}
                className="w-8 h-8 rounded-full font-bold text-[16px]"
                style={{ color: KTA.blue }}>
                +
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="px-[18px] py-3 border-t shrink-0 pb-sheet-safe"
        style={{ borderColor: KTA.border }}>
        <button
          type="button"
          onClick={() =>
          onSearchHotels({
            destination: city,
            guests,
            rooms: Math.min(rooms, guests)
          })
          }
          className="w-full h-12 rounded-[14px] text-white font-bold text-[15px] flex items-center justify-center gap-2"
          style={{ backgroundColor: KTA.green }}>
          <Search className="w-4 h-4" />
          Search hotels in {city}
        </button>
      </div>
    </Sheet>
  );
}

export type FlightStopFilter = 'any' | 'direct' | 'max1' | 'max2';

export type FlightFareTypeFilter = 'any' | 'refundable' | 'nonrefundable';

export type FlightTimeBucket = 'early' | 'morning' | 'noon' | 'evening';

export type FlightListFilters = {
  stops: FlightStopFilter;
  /** Inclusive max price. null = no price cap. */
  maxPrice: number | null;
  /** Inclusive max duration in minutes. null = no duration cap. */
  maxDurationMins: number | null;
  fareType: FlightFareTypeFilter;
  /** Empty = all airlines. */
  airlines: string[];
  /** Empty = any departure bucket. */
  departTimes: FlightTimeBucket[];
  /** Empty = any arrival bucket. */
  arriveTimes: FlightTimeBucket[];
};

export const DEFAULT_FLIGHT_FILTERS: FlightListFilters = {
  stops: 'any',
  maxPrice: null,
  maxDurationMins: null,
  fareType: 'any',
  airlines: [],
  departTimes: [],
  arriveTimes: []
};

export function parseDurationMinutes(duration: string | undefined): number {
  if (!duration) return 0;
  const h = /(\d+)\s*h/i.exec(duration);
  const m = /(\d+)\s*m/i.exec(duration);
  // Bare minutes like "90" or "1:30" fall back to 0 if no h/m markers
  if (!h && !m) {
    const colon = /^(\d+):(\d+)$/.exec(duration.trim());
    if (colon) return Number(colon[1]) * 60 + Number(colon[2]);
    const only = /^(\d+)$/.exec(duration.trim());
    if (only) return Number(only[1]);
    return 0;
  }
  return (h ? Number(h[1]) : 0) * 60 + (m ? Number(m[1]) : 0);
}

export function formatDurationMinutes(mins: number): string {
  const safe = Math.max(0, Math.round(mins));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h > 0 && m > 0) return `${h}h${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function matchesStopFilter(trip: Trip, stops: FlightStopFilter): boolean {
  const transfers = Math.max(0, Number(trip.transfers) || 0);
  if (stops === 'direct') return transfers === 0;
  if (stops === 'max1') return transfers <= 1;
  if (stops === 'max2') return transfers <= 2;
  return true;
}

function parseClockMinutes(time: string | undefined): number | null {
  if (!time) return null;
  const match = /(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function timeBucket(mins: number | null): FlightTimeBucket | null {
  if (mins == null) return null;
  if (mins < 6 * 60) return 'early';
  if (mins < 12 * 60) return 'morning';
  if (mins < 18 * 60) return 'noon';
  return 'evening';
}

function matchesFareType(
  trip: Trip,
  fareType: FlightFareTypeFilter
): boolean {
  if (fareType === 'any') return true;
  const raw = String(trip.refundable || '').toLowerCase();
  const isNon =
    raw.includes('non') ||
    raw === 'false' ||
    raw === '0' ||
    raw === 'n';
  const isYes =
    raw.includes('refund') && !isNon ||
    raw === 'true' ||
    raw === 'yes' ||
    raw === 'y' ||
    raw === '1';
  if (fareType === 'refundable') return isYes;
  if (fareType === 'nonrefundable') return isNon || (!isYes && !!raw);
  return true;
}

export function applyFlightListFilters(
  trips: Trip[],
  filters: FlightListFilters
): Trip[] {
  return trips.filter((t) => {
    if (!matchesStopFilter(t, filters.stops)) return false;
    const price = Number(t.price);
    if (
      filters.maxPrice != null &&
      Number.isFinite(price) &&
      price > filters.maxPrice
    ) {
      return false;
    }
    if (filters.maxDurationMins != null) {
      const mins = parseDurationMinutes(t.duration);
      if (mins > 0 && mins > filters.maxDurationMins) return false;
    }
    if (!matchesFareType(t, filters.fareType)) return false;
    if (filters.airlines.length > 0) {
      const op = String(t.operator || '').trim();
      if (!filters.airlines.some((a) => a === op)) return false;
    }
    if (filters.departTimes.length > 0) {
      const bucket = timeBucket(parseClockMinutes(t.departTime));
      if (!bucket || !filters.departTimes.includes(bucket)) return false;
    }
    if (filters.arriveTimes.length > 0) {
      const bucket = timeBucket(parseClockMinutes(t.arriveTime));
      if (!bucket || !filters.arriveTimes.includes(bucket)) return false;
    }
    return true;
  });
}

type FilterBounds = {
  minPrice: number;
  maxPrice: number;
  minDuration: number;
  maxDuration: number;
  currency: Trip['currency'];
};

function computeFilterBounds(trips: Trip[]): FilterBounds | null {
  if (!trips.length) return null;
  const prices = trips.map((t) => t.price).filter((p) => Number.isFinite(p));
  const durations = trips.map((t) => parseDurationMinutes(t.duration));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const minDuration = durations.length ? Math.min(...durations) : 0;
  const maxDuration = durations.length ? Math.max(...durations) : 0;
  return {
    minPrice,
    maxPrice: Math.max(minPrice, maxPrice),
    minDuration,
    maxDuration: Math.max(minDuration, maxDuration),
    currency: trips[0]?.currency ?? 'ETB'
  };
}

function stopOptionHint(
  trips: Trip[],
  stops: FlightStopFilter,
  currency: Trip['currency']
): string {
  const matched = trips.filter((t) => matchesStopFilter(t, stops));
  if (!matched.length) return 'None';
  const bestPrice = Math.min(...matched.map((t) => t.price));
  const bestDuration = Math.min(
    ...matched.map((t) => parseDurationMinutes(t.duration))
  );
  return `${cur(bestPrice, currency)} · ${formatDurationMinutes(bestDuration)}`;
}

export function FiltersSheet({
  open,
  onClose,
  trips,
  value,
  onApply
}: {
  open: boolean;
  onClose: () => void;
  trips: Trip[];
  value: FlightListFilters;
  onApply: (next: FlightListFilters) => void;
}) {
  const bounds = useMemo(() => computeFilterBounds(trips), [trips]);
  const airlineOptions = useMemo(() => {
    const set = new Set<string>();
    for (const t of trips) {
      const op = String(t.operator || '').trim();
      if (op) set.add(op);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [trips]);

  const [stops, setStops] = useState<FlightStopFilter>(value.stops);
  const [maxPrice, setMaxPrice] = useState(0);
  const [maxDuration, setMaxDuration] = useState(0);
  const [fareType, setFareType] = useState<FlightFareTypeFilter>(value.fareType);
  const [airlines, setAirlines] = useState<string[]>(value.airlines);
  const [departTimes, setDepartTimes] = useState<FlightTimeBucket[]>(
    value.departTimes
  );
  const [arriveTimes, setArriveTimes] = useState<FlightTimeBucket[]>(
    value.arriveTimes
  );

  useEffect(() => {
    if (!open || !bounds) return;
    setStops(value.stops);
    setFareType(value.fareType ?? 'any');
    setAirlines(value.airlines ?? []);
    setDepartTimes(value.departTimes ?? []);
    setArriveTimes(value.arriveTimes ?? []);
    setMaxPrice(
      value.maxPrice == null ?
        bounds.maxPrice :
        Math.min(Math.max(value.maxPrice, bounds.minPrice), bounds.maxPrice)
    );
    setMaxDuration(
      value.maxDurationMins == null ?
        bounds.maxDuration :
        Math.min(
          Math.max(value.maxDurationMins, bounds.minDuration),
          bounds.maxDuration
        )
    );
  }, [open, value, bounds]);

  const stopOptions: { id: FlightStopFilter; label: string }[] = [
    { id: 'any', label: 'Any' },
    { id: 'direct', label: 'Non stop' },
    { id: 'max1', label: '1 stop' },
    { id: 'max2', label: '2 stop' }
  ];

  const timeOptions: { id: FlightTimeBucket; label: string }[] = [
    { id: 'early', label: 'Early (Before 6AM)' },
    { id: 'morning', label: 'Morning (6AM - 12PM)' },
    { id: 'noon', label: 'Noon (12PM - 6PM)' },
    { id: 'evening', label: 'Evening (After 6PM)' }
  ];

  const fareOptions: { id: FlightFareTypeFilter; label: string }[] = [
    { id: 'any', label: 'Any' },
    { id: 'refundable', label: 'Refundable' },
    { id: 'nonrefundable', label: 'Non-refundable' }
  ];

  const currency = bounds?.currency ?? 'ETB';
  const priceFloor = bounds?.minPrice ?? 0;
  const priceCeil = bounds?.maxPrice ?? 0;
  const durationFloor = bounds?.minDuration ?? 0;
  const durationCeil = bounds?.maxDuration ?? 0;
  const priceSpan = Math.max(1, priceCeil - priceFloor);
  const durationSpan = Math.max(1, durationCeil - durationFloor);

  const toggleInList = <T,>(list: T[], item: T): T[] =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  const handleReset = () => {
    onApply(DEFAULT_FLIGHT_FILTERS);
    onClose();
  };

  const handleApply = () => {
    if (!bounds) {
      onApply({
        ...DEFAULT_FLIGHT_FILTERS,
        stops,
        fareType,
        airlines,
        departTimes,
        arriveTimes
      });
      onClose();
      return;
    }
    onApply({
      stops,
      maxPrice: maxPrice >= bounds.maxPrice ? null : maxPrice,
      maxDurationMins:
        maxDuration >= bounds.maxDuration ? null : maxDuration,
      fareType,
      airlines,
      departTimes,
      arriveTimes
    });
    onClose();
  };

  const CheckboxRow = ({
    checked,
    label,
    onToggle
  }: {
    checked: boolean;
    label: string;
    onToggle: () => void;
  }) =>
  <button
    type="button"
    onClick={onToggle}
    className="w-full flex items-center gap-2.5 py-2.5 text-left">
    <div
      className="w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0"
      style={{
        borderColor: checked ? KTA.blue : '#cbd5e1',
        backgroundColor: checked ? KTA.blue : '#fff'
      }}>
      {checked ?
      <span className="text-white text-[11px] font-bold leading-none">✓</span> :
      null}
    </div>
    <span className="text-[13px]" style={{ color: KTA.textPrimary }}>
      {label}
    </span>
  </button>;

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Filters" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-[18px] pb-4">
        <p
          className="text-[13px] font-bold mb-2"
          style={{ color: KTA.textPrimary }}>
          Flight Stops
        </p>
        {stopOptions.map((opt) =>
        <button
          key={opt.id}
          type="button"
          onClick={() => setStops(opt.id)}
          className="w-full flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: stops === opt.id ? KTA.blue : '#cbd5e1'
              }}>
              {stops === opt.id &&
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: KTA.blue }} />
              }
            </div>
            <span
              className="text-[13px]"
              style={{ color: KTA.textPrimary }}>
              {opt.label}
            </span>
          </div>
          <span
            className="text-[12px]"
            style={{ color: KTA.textSecondary }}>
            {stopOptionHint(trips, opt.id, currency)}
          </span>
        </button>
        )}

        <div className="border-t my-3" style={{ borderColor: KTA.border }} />
        <p
          className="text-[13px] font-bold mb-2"
          style={{ color: KTA.textPrimary }}>
          Fare Type
        </p>
        {fareOptions.map((opt) =>
        <CheckboxRow
          key={opt.id}
          checked={fareType === opt.id}
          label={opt.label}
          onToggle={() => setFareType(opt.id)} />
        )}

        {airlineOptions.length > 0 &&
        <>
          <div className="border-t my-3" style={{ borderColor: KTA.border }} />
          <p
            className="text-[13px] font-bold mb-2"
            style={{ color: KTA.textPrimary }}>
            Airlines
          </p>
          {airlineOptions.map((airline) =>
          <CheckboxRow
            key={airline}
            checked={airlines.includes(airline)}
            label={airline}
            onToggle={() => setAirlines((prev) => toggleInList(prev, airline))} />
          )}
        </>
        }

        <div className="border-t my-3" style={{ borderColor: KTA.border }} />
        <p
          className="text-[13px] font-bold mb-2"
          style={{ color: KTA.textPrimary }}>
          Departure Time
        </p>
        {timeOptions.map((opt) =>
        <CheckboxRow
          key={`dep-${opt.id}`}
          checked={departTimes.includes(opt.id)}
          label={opt.label}
          onToggle={() =>
          setDepartTimes((prev) => toggleInList(prev, opt.id))
          } />
        )}

        <div className="border-t my-3" style={{ borderColor: KTA.border }} />
        <p
          className="text-[13px] font-bold mb-2"
          style={{ color: KTA.textPrimary }}>
          Arrival Time
        </p>
        {timeOptions.map((opt) =>
        <CheckboxRow
          key={`arr-${opt.id}`}
          checked={arriveTimes.includes(opt.id)}
          label={opt.label}
          onToggle={() =>
          setArriveTimes((prev) => toggleInList(prev, opt.id))
          } />
        )}

        <div className="border-t my-3" style={{ borderColor: KTA.border }} />
        <p
          className="text-[13px] font-bold mb-2"
          style={{ color: KTA.textPrimary }}>
          Price
        </p>
        <p
          className="text-center text-[13px] font-semibold mb-2"
          style={{ color: KTA.textPrimary }}>
          {cur(priceFloor, currency)} – {cur(maxPrice || priceCeil, currency)}
        </p>
        <input
          type="range"
          min={priceFloor}
          max={priceCeil}
          step={priceSpan > 500 ? 50 : priceSpan > 100 ? 10 : 1}
          value={Math.min(Math.max(maxPrice, priceFloor), priceCeil)}
          disabled={!bounds || priceCeil <= priceFloor}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full mb-3"
          style={{ accentColor: KTA.blue }}
        />
        <p
          className="text-[13px] font-bold mb-2"
          style={{ color: KTA.textPrimary }}>
          Duration
        </p>
        <p
          className="text-center text-[13px] font-semibold mb-2"
          style={{ color: KTA.textPrimary }}>
          {formatDurationMinutes(durationFloor)} –{' '}
          {formatDurationMinutes(maxDuration || durationCeil)}
        </p>
        <input
          type="range"
          min={durationFloor}
          max={durationCeil}
          step={durationSpan > 180 ? 15 : durationSpan > 60 ? 5 : 1}
          value={Math.min(Math.max(maxDuration, durationFloor), durationCeil)}
          disabled={!bounds || durationCeil <= durationFloor}
          onChange={(e) => setMaxDuration(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: KTA.blue }}
        />
      </div>
      <div
        className="px-[18px] py-3 border-t shrink-0 flex gap-3 pb-sheet-safe"
        style={{ borderColor: KTA.border }}>
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 h-12 rounded-[14px] font-bold text-[14px]"
          style={{
            backgroundColor: KTA.inputBg,
            color: KTA.textSecondary
          }}>
          Reset
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 h-12 rounded-[14px] text-white font-bold text-[14px]"
          style={{ backgroundColor: KTA.blue }}>
          Apply
        </button>
      </div>
    </Sheet>
  );
}

export type BusSortOption = 'recommended' | 'price' | 'departure' | 'duration';

export type BusListFiltersState = {
  sort: BusSortOption;
  maxPrice: number | null;
  ac: boolean;
  sleeper: boolean;
};

export function BusFiltersSheet({
  open,
  onClose,
  trips,
  value,
  onApply
}: {
  open: boolean;
  onClose: () => void;
  trips: Trip[];
  value: BusListFiltersState;
  onApply: (next: BusListFiltersState) => void;
}) {
  const prices = trips.map((t) => t.price).filter((p) => p > 0);
  const maxBound = prices.length ? Math.max(...prices) : 10000;
  const minBound = prices.length ? Math.min(...prices) : 0;
  const [sort, setSort] = useState<BusSortOption>(value.sort);
  const [maxPrice, setMaxPrice] = useState(value.maxPrice ?? maxBound);
  const [ac, setAc] = useState(value.ac);
  const [sleeper, setSleeper] = useState(value.sleeper);

  useEffect(() => {
    if (!open) return;
    setSort(value.sort);
    setMaxPrice(value.maxPrice ?? maxBound);
    setAc(value.ac);
    setSleeper(value.sleeper);
  }, [open, value, maxBound]);

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Sort & Filters" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-[18px] pb-4 space-y-5">
        <div>
          <p className="text-[13px] font-bold mb-2" style={{ color: KTA.textPrimary }}>
            Sort by
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['recommended', 'Recommended'],
                ['price', 'Cheapest'],
                ['departure', 'Departure'],
                ['duration', 'Duration']
              ] as const
            ).map(([id, label]) =>
              <button
                key={id}
                type="button"
                onClick={() => setSort(id)}
                className={`h-10 rounded-xl text-[13px] font-semibold border ${
                sort === id ?
                'bg-teal-600 text-white border-teal-600' :
                'bg-white text-slate-700 border-slate-200'}`
                }>
                {label}
              </button>
            )}
          </div>
        </div>

        <div>
          <p className="text-[13px] font-bold mb-2" style={{ color: KTA.textPrimary }}>
            Bus type
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAc((v) => !v)}
              className={`flex-1 h-10 rounded-xl text-[13px] font-semibold border ${
              ac ?
              'bg-teal-600 text-white border-teal-600' :
              'bg-white text-slate-700 border-slate-200'}`
              }>
              AC
            </button>
            <button
              type="button"
              onClick={() => setSleeper((v) => !v)}
              className={`flex-1 h-10 rounded-xl text-[13px] font-semibold border ${
              sleeper ?
              'bg-teal-600 text-white border-teal-600' :
              'bg-white text-slate-700 border-slate-200'}`
              }>
              Sleeper
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-bold" style={{ color: KTA.textPrimary }}>
              Max fare
            </p>
            <p className="text-[13px] font-semibold text-slate-700">
              ETB {Math.round(maxPrice).toLocaleString()}
            </p>
          </div>
          <input
            type="range"
            min={minBound}
            max={maxBound}
            step={50}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-teal-600" />
        </div>
      </div>
      <div className="px-[18px] py-3 border-t border-slate-100 flex gap-2">
        <button
          type="button"
          onClick={() => {
            onApply({
              sort: 'recommended',
              maxPrice: null,
              ac: false,
              sleeper: false
            });
            onClose();
          }}
          className="flex-1 h-12 rounded-[14px] font-bold text-[14px] border border-slate-200 bg-white text-slate-700">
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            onApply({
              sort,
              maxPrice: maxPrice >= maxBound ? null : maxPrice,
              ac,
              sleeper
            });
            onClose();
          }}
          className="flex-1 h-12 rounded-[14px] text-white font-bold text-[14px]"
          style={{ backgroundColor: KTA.blue }}>
          Apply
        </button>
      </div>
    </Sheet>
  );
}

export type HotelStarFilter = 'any' | '3' | '4' | '5';

export type HotelListFilters = {
  minStars: HotelStarFilter;
  /** Inclusive max price per night. null = no cap. */
  maxPrice: number | null;
};

export const DEFAULT_HOTEL_FILTERS: HotelListFilters = {
  minStars: 'any',
  maxPrice: null
};

function hotelMinStarsValue(minStars: HotelStarFilter): number {
  if (minStars === 'any') return 0;
  return Number(minStars);
}

export function applyHotelListFilters(
  hotels: HotelListing[],
  filters: HotelListFilters
): HotelListing[] {
  const minStars = hotelMinStarsValue(filters.minStars);
  return hotels.filter((h) => {
    const stars = Math.max(0, Number(h.stars) || 0);
    if (stars < minStars) return false;
    const price = Number(h.pricePerNight);
    if (
      filters.maxPrice != null &&
      Number.isFinite(price) &&
      price > filters.maxPrice
    ) {
      return false;
    }
    return true;
  });
}

function computeHotelBounds(hotels: HotelListing[]): {
  minPrice: number;
  maxPrice: number;
  currency: HotelListing['currency'];
} | null {
  if (!hotels.length) return null;
  const prices = hotels.
  map((h) => h.pricePerNight).
  filter((p) => Number.isFinite(p) && p >= 0);
  if (!prices.length) return null;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  return {
    minPrice,
    maxPrice: Math.max(minPrice, maxPrice),
    currency: hotels[0]?.currency ?? 'ETB'
  };
}

function hotelStarHint(
  hotels: HotelListing[],
  minStars: HotelStarFilter,
  currency: HotelListing['currency']
): string {
  const matched = applyHotelListFilters(hotels, {
    minStars,
    maxPrice: null
  });
  if (!matched.length) return 'None';
  const best = Math.min(...matched.map((h) => h.pricePerNight));
  return `from ${cur(best, currency)}`;
}

export function HotelFiltersSheet({
  open,
  onClose,
  hotels,
  value,
  onApply
}: {
  open: boolean;
  onClose: () => void;
  hotels: HotelListing[];
  value: HotelListFilters;
  onApply: (next: HotelListFilters) => void;
}) {
  const bounds = useMemo(() => computeHotelBounds(hotels), [hotels]);
  const [minStars, setMinStars] = useState<HotelStarFilter>(value.minStars);
  const [maxPrice, setMaxPrice] = useState(0);

  useEffect(() => {
    if (!open || !bounds) return;
    setMinStars(value.minStars);
    setMaxPrice(
      value.maxPrice == null ?
        bounds.maxPrice :
        Math.min(Math.max(value.maxPrice, bounds.minPrice), bounds.maxPrice)
    );
  }, [open, value, bounds]);

  const starOptions: { id: HotelStarFilter; label: string }[] = [
    { id: 'any', label: 'Any stars' },
    { id: '3', label: '3★ & up' },
    { id: '4', label: '4★ & up' },
    { id: '5', label: '5★ only' }
  ];

  const currency = bounds?.currency ?? 'ETB';
  const priceFloor = bounds?.minPrice ?? 0;
  const priceCeil = bounds?.maxPrice ?? 0;
  const priceSpan = Math.max(1, priceCeil - priceFloor);

  const handleReset = () => {
    onApply(DEFAULT_HOTEL_FILTERS);
    onClose();
  };

  const handleApply = () => {
    if (!bounds) {
      onApply({ ...DEFAULT_HOTEL_FILTERS, minStars });
      onClose();
      return;
    }
    onApply({
      minStars,
      maxPrice: maxPrice >= bounds.maxPrice ? null : maxPrice
    });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Filters" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-[18px] pb-4">
        <p
          className="text-[13px] font-bold mb-2"
          style={{ color: KTA.textPrimary }}>
          Star rating
        </p>
        {starOptions.map((opt) =>
        <button
          key={opt.id}
          type="button"
          onClick={() => setMinStars(opt.id)}
          className="w-full flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: minStars === opt.id ? KTA.blue : '#cbd5e1'
              }}>
              {minStars === opt.id &&
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: KTA.blue }} />
              }
            </div>
            <span className="text-[13px]" style={{ color: KTA.textPrimary }}>
              {opt.label}
            </span>
          </div>
          <span className="text-[12px]" style={{ color: KTA.textSecondary }}>
            {hotelStarHint(hotels, opt.id, currency)}
          </span>
        </button>
        )}
        <div className="border-t my-3" style={{ borderColor: KTA.border }} />
        <p
          className="text-[13px] font-bold mb-2"
          style={{ color: KTA.textPrimary }}>
          Price per night
        </p>
        <p
          className="text-center text-[13px] font-semibold mb-2"
          style={{ color: KTA.textPrimary }}>
          {cur(priceFloor, currency)} – {cur(maxPrice || priceCeil, currency)}
        </p>
        <input
          type="range"
          min={priceFloor}
          max={priceCeil}
          step={priceSpan > 500 ? 50 : priceSpan > 100 ? 10 : 1}
          value={Math.min(Math.max(maxPrice, priceFloor), priceCeil)}
          disabled={!bounds || priceCeil <= priceFloor}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: KTA.blue }}
        />
      </div>
      <div
        className="px-[18px] py-3 border-t shrink-0 flex gap-3 pb-sheet-safe"
        style={{ borderColor: KTA.border }}>
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 h-12 rounded-[14px] font-bold text-[14px]"
          style={{
            backgroundColor: KTA.inputBg,
            color: KTA.textSecondary
          }}>
          Reset
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 h-12 rounded-[14px] text-white font-bold text-[14px]"
          style={{ backgroundColor: KTA.blue }}>
          Apply
        </button>
      </div>
    </Sheet>
  );
}

export type CarTransmissionFilter = 'any' | 'Auto' | 'Manual';
export type CarSeatsFilter = 'any' | '4' | '5' | '7';

export type CarListFilters = {
  transmission: CarTransmissionFilter;
  minSeats: CarSeatsFilter;
  /** Inclusive max daily price. null = no cap. */
  maxPrice: number | null;
};

export const DEFAULT_CAR_FILTERS: CarListFilters = {
  transmission: 'any',
  minSeats: 'any',
  maxPrice: null
};

export function applyCarListFilters(
  cars: CarRental[],
  filters: CarListFilters
): CarRental[] {
  const minSeats =
    filters.minSeats === 'any' ? 0 : Number(filters.minSeats);
  return cars.filter((c) => {
    if (
      filters.transmission !== 'any' &&
      c.transmission !== filters.transmission
    ) {
      return false;
    }
    if (c.seats < minSeats) return false;
    if (filters.maxPrice != null && c.pricePerDay > filters.maxPrice) {
      return false;
    }
    return true;
  });
}

function computeCarBounds(cars: CarRental[]): {
  minPrice: number;
  maxPrice: number;
  currency: CarRental['currency'];
} | null {
  if (!cars.length) return null;
  const prices = cars.
  map((c) => c.pricePerDay).
  filter((p) => Number.isFinite(p) && p >= 0);
  if (!prices.length) return null;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  return {
    minPrice,
    maxPrice: Math.max(minPrice, maxPrice),
    currency: cars[0]?.currency ?? 'ETB'
  };
}

function carOptionHint(
  cars: CarRental[],
  patch: Partial<CarListFilters>,
  currency: CarRental['currency']
): string {
  const matched = applyCarListFilters(cars, {
    ...DEFAULT_CAR_FILTERS,
    ...patch
  });
  if (!matched.length) return 'None';
  const best = Math.min(...matched.map((c) => c.pricePerDay));
  return `from ${cur(best, currency)}`;
}

export function CarFiltersSheet({
  open,
  onClose,
  cars,
  value,
  onApply
}: {
  open: boolean;
  onClose: () => void;
  cars: CarRental[];
  value: CarListFilters;
  onApply: (next: CarListFilters) => void;
}) {
  const bounds = useMemo(() => computeCarBounds(cars), [cars]);
  const [transmission, setTransmission] = useState<CarTransmissionFilter>(
    value.transmission
  );
  const [minSeats, setMinSeats] = useState<CarSeatsFilter>(value.minSeats);
  const [maxPrice, setMaxPrice] = useState(0);

  useEffect(() => {
    if (!open || !bounds) return;
    setTransmission(value.transmission);
    setMinSeats(value.minSeats);
    setMaxPrice(
      value.maxPrice == null ?
        bounds.maxPrice :
        Math.min(Math.max(value.maxPrice, bounds.minPrice), bounds.maxPrice)
    );
  }, [open, value, bounds]);

  const transmissionOptions: { id: CarTransmissionFilter; label: string }[] = [
    { id: 'any', label: 'Any' },
    { id: 'Auto', label: 'Automatic' },
    { id: 'Manual', label: 'Manual' }
  ];

  const seatOptions: { id: CarSeatsFilter; label: string }[] = [
    { id: 'any', label: 'Any' },
    { id: '4', label: '4+ seats' },
    { id: '5', label: '5+ seats' },
    { id: '7', label: '7+ seats' }
  ];

  const currency = bounds?.currency ?? 'ETB';
  const priceFloor = bounds?.minPrice ?? 0;
  const priceCeil = bounds?.maxPrice ?? 0;
  const priceSpan = Math.max(1, priceCeil - priceFloor);

  const handleReset = () => {
    onApply(DEFAULT_CAR_FILTERS);
    onClose();
  };

  const handleApply = () => {
    if (!bounds) {
      onApply({
        ...DEFAULT_CAR_FILTERS,
        transmission,
        minSeats
      });
      onClose();
      return;
    }
    onApply({
      transmission,
      minSeats,
      maxPrice: maxPrice >= bounds.maxPrice ? null : maxPrice
    });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Filters" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-[18px] pb-4">
        <p
          className="text-[13px] font-bold mb-2"
          style={{ color: KTA.textPrimary }}>
          Transmission
        </p>
        {transmissionOptions.map((opt) =>
        <button
          key={opt.id}
          type="button"
          onClick={() => setTransmission(opt.id)}
          className="w-full flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: transmission === opt.id ? KTA.blue : '#cbd5e1'
              }}>
              {transmission === opt.id &&
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: KTA.blue }} />
              }
            </div>
            <span className="text-[13px]" style={{ color: KTA.textPrimary }}>
              {opt.label}
            </span>
          </div>
          <span className="text-[12px]" style={{ color: KTA.textSecondary }}>
            {carOptionHint(cars, { transmission: opt.id }, currency)}
          </span>
        </button>
        )}
        <div className="border-t my-3" style={{ borderColor: KTA.border }} />
        <p
          className="text-[13px] font-bold mb-2"
          style={{ color: KTA.textPrimary }}>
          Seats
        </p>
        {seatOptions.map((opt) =>
        <button
          key={opt.id}
          type="button"
          onClick={() => setMinSeats(opt.id)}
          className="w-full flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: minSeats === opt.id ? KTA.blue : '#cbd5e1'
              }}>
              {minSeats === opt.id &&
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: KTA.blue }} />
              }
            </div>
            <span className="text-[13px]" style={{ color: KTA.textPrimary }}>
              {opt.label}
            </span>
          </div>
          <span className="text-[12px]" style={{ color: KTA.textSecondary }}>
            {carOptionHint(cars, { minSeats: opt.id }, currency)}
          </span>
        </button>
        )}
        <div className="border-t my-3" style={{ borderColor: KTA.border }} />
        <p
          className="text-[13px] font-bold mb-2"
          style={{ color: KTA.textPrimary }}>
          Price per day
        </p>
        <p
          className="text-center text-[13px] font-semibold mb-2"
          style={{ color: KTA.textPrimary }}>
          {cur(priceFloor, currency)} – {cur(maxPrice || priceCeil, currency)}
        </p>
        <input
          type="range"
          min={priceFloor}
          max={priceCeil}
          step={priceSpan > 500 ? 50 : priceSpan > 100 ? 10 : 1}
          value={Math.min(Math.max(maxPrice, priceFloor), priceCeil)}
          disabled={!bounds || priceCeil <= priceFloor}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: KTA.blue }}
        />
      </div>
      <div
        className="px-[18px] py-3 border-t shrink-0 flex gap-3 pb-sheet-safe"
        style={{ borderColor: KTA.border }}>
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 h-12 rounded-[14px] font-bold text-[14px]"
          style={{
            backgroundColor: KTA.inputBg,
            color: KTA.textSecondary
          }}>
          Reset
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 h-12 rounded-[14px] text-white font-bold text-[14px]"
          style={{ backgroundColor: KTA.blue }}>
          Apply
        </button>
      </div>
    </Sheet>
  );
}

export function DiscountSheet({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} height="70vh">
      <SheetHeader title="Discount Savings" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-[18px] pb-4">
        <div
          className="rounded-[14px] p-4 mb-4"
          style={{
            background: `linear-gradient(135deg, ${KTA.blue}, ${KTA.red})`
          }}>
          <p className="text-[14px] font-semibold text-white">
            On average, travellers save ETB 80+ with the Travel Saving Pass.
          </p>
        </div>
        <div
          className="rounded-[14px] p-5 text-center mb-4"
          style={{
            backgroundColor: '#E8F5EE'
          }}>
          <p
            className="text-[40px] font-bold"
            style={{
              color: KTA.blue
            }}>
            10%
          </p>
          <p
            className="text-[14px] mb-2"
            style={{
              color: KTA.textSecondary
            }}>
            Off all your bookings.
          </p>
          <p
            className="text-[16px] font-bold"
            style={{
              color: KTA.red
            }}>
            For only ETB20
          </p>
        </div>
        <p
          className="text-[12px] mb-4"
          style={{
            color: KTA.textSecondary
          }}>
          10% off all your train, bus, and ferry tickets (excludes flights). Book
          within 90 days, travel anytime.
        </p>
        <button
          className="w-full h-12 rounded-[14px] text-white font-bold text-[14px] mb-2"
          style={{
            backgroundColor: KTA.blue
          }}>
          Add the Saving Pass
        </button>
        <button
          onClick={onClose}
          className="w-full h-12 rounded-[14px] font-bold text-[14px]"
          style={{
            backgroundColor: KTA.inputBg,
            color: KTA.textSecondary
          }}>
          View terms & conditions
        </button>
      </div>
    </Sheet>
  );
}

export { WalletTransactionsSheet } from './WalletTransactionsSheet';

export function TicketDetailsSheet({
  open,
  onClose,
  outbound,
  returnTrip,
  bookingRef,
  className = 'Economy',
  seatLabel = '—',
  onViewPdf
}: {
  open: boolean;
  onClose: () => void;
  outbound: Trip | null;
  returnTrip?: Trip | null;
  bookingRef: string;
  className?: string;
  seatLabel?: string;
  onViewPdf?: () => void;
}) {
  const stopLabel = (transfers: number | undefined) => {
    if (transfers == null || transfers === 0) return 'Non-stop';
    if (transfers === 1) return '1 Stop';
    return `${transfers} Stops`;
  };

  const cityLabel = (trip: Trip, side: 'from' | 'to') => {
    const city = side === 'from' ? trip.fromCity : trip.toCity;
    const code = side === 'from' ? trip.departCityCode : trip.arriveCityCode;
    const bare = (city || '').replace(/\s*\([^)]*\)\s*/g, '').trim();
    const resolved =
      (code || '').trim().toUpperCase() ||
      city?.match(/\(([A-Za-z]{3})\)/)?.[1]?.toUpperCase() ||
      '';
    if (resolved && bare && bare.toUpperCase() === resolved) return resolved;
    if (resolved && bare) return `${bare} (${resolved})`;
    if (resolved) return resolved;
    if (bare && /^[A-Za-z]{3}$/.test(bare)) return bare.toUpperCase();
    return city || '—';
  };

  const flightLabel = (trip: Trip) => {
    if (trip.flightNo) return trip.flightNo;
    return trip.operator;
  };

  const LegCard = ({
    trip,
    kind
  }: {
    trip: Trip;
    kind: 'departure' | 'return';
  }) =>
  <div
    className="rounded-[16px] border bg-white p-4 mb-3"
    style={{
      borderColor: KTA.border
    }}>
    
      <div className="flex items-center gap-2.5 mb-3.5">
        <span
        className="text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full text-white"
        style={{
          backgroundColor: KTA.green
        }}>
        
          {kind === 'departure' ? 'DEPARTURE' : 'RETURN'}
        </span>
        <span
        className="text-[14px] font-bold"
        style={{
          color: KTA.textPrimary
        }}>
        
          {flightLabel(trip)}
        </span>
      </div>

      <div className="flex items-start justify-between gap-2 mb-3.5">
        <div className="min-w-0 flex-1">
          <p
          className="text-[22px] font-bold leading-none"
          style={{
            color: KTA.textPrimary
          }}>
          
            {trip.departTime}
          </p>
          <p
          className="text-[12px] mt-1.5 leading-snug"
          style={{
            color: KTA.textSecondary
          }}>
          
            {cityLabel(trip, 'from')}
          </p>
        </div>

        <div className="flex-1 px-2 pt-1 flex flex-col items-center min-w-[100px]">
          <p
          className="text-[12px] font-bold mb-1.5"
          style={{
            color: KTA.textPrimary
          }}>
          
            {trip.duration}
          </p>
          <div className="w-full border-t border-dashed border-gray-300 relative h-0">
            <Plane
            className="w-3.5 h-3.5 absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-gray-400" />
          
          </div>
          <p
          className="text-[11px] mt-1.5"
          style={{
            color: KTA.textSecondary
          }}>
          
            {stopLabel(trip.transfers)}
          </p>
        </div>

        <div className="min-w-0 flex-1 text-right">
          <p
          className="text-[22px] font-bold leading-none"
          style={{
            color: KTA.textPrimary
          }}>
          
            {trip.arriveTime}
          </p>
          <p
          className="text-[12px] mt-1.5 leading-snug"
          style={{
            color: KTA.textSecondary
          }}>
          
            {cityLabel(trip, 'to')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 pt-0.5">
        <AirlineLogo
        src={trip.operatorLogo}
        name={trip.operator}
        initial={trip.operatorInitial}
        color={trip.operatorColor || KTA.green}
        className="w-7 h-7" />
      
        <span
        className="text-[13px] font-medium"
        style={{
          color: KTA.textPrimary
        }}>
        
          {trip.operator}
        </span>
      </div>
    </div>;


  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title="Ticket details" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-[18px] pb-5">
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-[13px]"
            style={{
              color: KTA.textSecondary
            }}>
            
            Booking reference
          </span>
          <span
            className="text-[14px] font-bold"
            style={{
              color: KTA.textPrimary
            }}>
            
            #{bookingRef.replace(/^#/, '') || 'PENDING'}
          </span>
        </div>

        {outbound && <LegCard trip={outbound} kind="departure" />}
        {returnTrip && <LegCard trip={returnTrip} kind="return" />}

        {!outbound &&
        <p
          className="text-[13px] mb-4"
          style={{
            color: KTA.textSecondary
          }}>
          
            Ticket details will appear once your booking is ready.
          </p>
        }

        <div
          className="rounded-[16px] border bg-white p-4"
          style={{
            borderColor: KTA.border
          }}>
          
          <div className="flex items-start gap-2.5 mb-1">
            <Star
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{
                color: KTA.orange
              }} />
            
            <div>
              <p
                className="text-[14px] font-bold"
                style={{
                  color: KTA.textPrimary
                }}>
                
                Class: {className && className !== 'Cabin' ? className : 'Economy'}
              </p>
              <p
                className="text-[13px] mt-0.5"
                style={{
                  color: KTA.textSecondary
                }}>
                
                Seat: {seatLabel || '—'}
              </p>
            </div>
          </div>
          <div
            className="border-t my-3"
            style={{
              borderColor: KTA.border
            }} />
          
          <div className="flex items-start gap-2.5">
            <Ticket
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{
                color: KTA.green
              }} />
            
            <p
              className="text-[12px] leading-relaxed"
              style={{
                color: KTA.textSecondary
              }}>
              
              Cancellation policies apply as per the operator&apos;s terms.
              Refunds may be subject to an admin fee. Ticket is
              non-transferable.
            </p>
          </div>
        </div>

        {onViewPdf &&
        <button
          type="button"
          onClick={onViewPdf}
          className="mt-4 w-full h-12 rounded-[14px] text-white font-bold text-[15px] active:scale-[0.99] transition-transform"
          style={{
            backgroundColor: KTA.green
          }}>
          
            View ticket PDF
          </button>
        }
      </div>
    </Sheet>);

}

function SimpleBarcode({ value }: { value: string }) {
  const bars = useMemo(() => {
    const seed = value.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return Array.from({ length: 48 }, (_, i) => {
      const n = (seed * (i + 3) * 17) % 10;
      return n > 4 ? 2.5 : 1.2;
    });
  }, [value]);

  return (
    <div className="flex items-end justify-center gap-[1.5px] h-14 px-2" aria-hidden>
      {bars.map((w, i) =>
      <div
        key={i}
        className="bg-gray-900 rounded-[0.5px]"
        style={{
          width: w,
          height: `${70 + (i % 5) * 6}%`
        }} />

      )}
    </div>);

}

export function BoardingPassSheet({
  open,
  onClose,
  outbound,
  bookingRef,
  passengerName,
  className = 'Economy',
  seatLabel = '—',
  gateLabel = '—',
  onDetails,
  onDownload
}: {
  open: boolean;
  onClose: () => void;
  outbound: Trip | null;
  bookingRef: string;
  passengerName?: string;
  className?: string;
  seatLabel?: string;
  gateLabel?: string;
  onDetails?: () => void;
  onDownload?: () => void;
}) {
  const ref = bookingRef.replace(/^#/, '') || 'PENDING';
  const spacedRef = ref.split('').join(' ');
  const cityLine = (trip: Trip, side: 'from' | 'to') => {
    const city = side === 'from' ? trip.fromCity : trip.toCity;
    const code = side === 'from' ? trip.departCityCode : trip.arriveCityCode;
    if (code) {
      const bare = city.replace(/\s*\([^)]*\)\s*/g, '').trim() || city;
      if (!bare.includes(code)) return `${bare} (${code})`;
    }
    return city;
  };

  return (
    <AnimatePresence>
      {open &&
      <>
          <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/45 z-[55]" />

          <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 z-[56] flex flex-col overflow-hidden rounded-t-ios-xl bg-white shadow-2xl pb-safe">

              <div
            className="px-4 py-3.5 flex items-center justify-between shrink-0"
            style={{
              backgroundColor: KTA.green
            }}>

                <div className="flex items-center gap-2 text-white">
                  <Plane className="w-5 h-5" />
                  <span className="text-[16px] font-bold">Boarding Pass</span>
                </div>
                <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">

                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="px-5 pt-5 pb-5 overflow-y-auto">
                {outbound ?
            <>
                    <div className="flex items-end justify-between gap-2 mb-5">
                      <div className="min-w-0 flex-1">
                        <p
                    className="text-[16px] font-bold leading-tight"
                    style={{
                      color: KTA.textPrimary
                    }}>

                          {cityLine(outbound, 'from')}
                        </p>
                        <p
                    className="text-[22px] font-black mt-1"
                    style={{
                      color: KTA.textPrimary
                    }}>

                          {outbound.departTime}
                        </p>
                      </div>
                      <div className="flex flex-col items-center px-2 pb-1 shrink-0">
                        <Plane
                    className="w-4 h-4 mb-1"
                    style={{
                      color: KTA.green
                    }} />

                        <div className="w-16 border-t border-dashed border-gray-300" />
                        <p
                    className="text-[11px] mt-1 font-medium"
                    style={{
                      color: KTA.textSecondary
                    }}>

                          {outbound.duration}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1 text-right">
                        <p
                    className="text-[16px] font-bold leading-tight"
                    style={{
                      color: KTA.textPrimary
                    }}>

                          {cityLine(outbound, 'to')}
                        </p>
                        <p
                    className="text-[22px] font-black mt-1"
                    style={{
                      color: KTA.textPrimary
                    }}>

                          {outbound.arriveTime}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-y-4 gap-x-3 mb-5">
                      {[
                ['PASSENGER', passengerName || '—'],
                ['SEAT', seatLabel || '—'],
                ['CLASS', className && className !== 'Cabin' ? className : 'Economy'],
                ['BOOKING', `#${ref}`],
                ['OPERATOR', outbound.operator],
                ['GATE', gateLabel || '—']].
                map(([label, value]) =>
                <div key={label} className="min-w-0">
                            <p
                    className="text-[10px] font-semibold tracking-wider uppercase mb-1"
                    style={{
                      color: KTA.textSecondary
                    }}>

                              {label}
                            </p>
                            <p
                    className="text-[13px] font-bold truncate"
                    style={{
                      color: KTA.textPrimary
                    }}>

                              {value}
                            </p>
                          </div>
                )}
                    </div>

                    <div className="flex flex-col items-center mb-4">
                      <SimpleBarcode value={ref} />
                      <p
                  className="text-[11px] font-mono tracking-[0.2em] mt-2"
                  style={{
                    color: KTA.textSecondary
                  }}>

                        {spacedRef}
                      </p>
                    </div>
                  </> :

            <p
              className="text-[13px] py-8 text-center"
              style={{
                color: KTA.textSecondary
              }}>

                    Boarding pass will appear once your flight is ready.
                  </p>
            }

                <div className="grid grid-cols-2 gap-3">
                  <button
                type="button"
                onClick={onDetails}
                className="h-11 rounded-[12px] border bg-white font-bold text-[13px] flex items-center justify-center gap-2 active:scale-[0.99]"
                style={{
                  borderColor: KTA.border,
                  color: KTA.textPrimary
                }}>

                    <Ticket className="w-4 h-4" />
                    Details
                  </button>
                  <button
                type="button"
                onClick={onDownload}
                className="h-11 rounded-[12px] text-white font-bold text-[13px] flex items-center justify-center gap-2 active:scale-[0.99]"
                style={{
                  backgroundColor: KTA.green
                }}>

                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
          </motion.div>
        </>
      }
    </AnimatePresence>);

}

export function TicketPdfSheet({
  open,
  onClose,
  pdfUrl,
  pdfBlob,
  preview,
  fileName = 'mkash-eticket.pdf'
}: {
  open: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  pdfBlob?: Blob | null;
  preview?: {
    title: string;
    subtitle?: string;
    bookingRef: string;
    pnr?: string;
    rows: { label: string; value: string }[];
    totalAmount?: string;
    paymentStatus?: string;
    passengers?: string[];
  } | null;
  fileName?: string;
}) {
  const handleDownload = async () => {
    if (pdfBlob) {
      await downloadPdfFile(pdfBlob, fileName, pdfUrl);
      return;
    }
    if (!pdfUrl) return;
    downloadObjectUrl(pdfUrl, fileName);
  };

  const ready = Boolean(preview || pdfUrl || pdfBlob);

  return (
    <Sheet open={open} onClose={onClose} height="92vh">
      <SheetHeader title="Ticket PDF" onClose={onClose} />
      <div className="flex-1 min-h-0 flex flex-col px-[14px] pb-4 gap-3">
        {preview ?
        <div
          className="flex-1 overflow-y-auto rounded-[12px] border bg-white p-4"
          style={{ borderColor: KTA.border }}>
          <div
            className="rounded-[12px] px-4 py-3 mb-4 text-white"
            style={{ backgroundColor: KTA.green }}>
            <p className="text-[11px] font-semibold opacity-90">Mkash Travel</p>
            <p className="text-[18px] font-bold mt-0.5">{preview.title}</p>
            {preview.subtitle ?
            <p className="text-[12px] mt-1 opacity-90">{preview.subtitle}</p> :
            null}
          </div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[11px]" style={{ color: KTA.textSecondary }}>
                Booking reference
              </p>
              <p
                className="text-[16px] font-bold"
                style={{ color: KTA.textPrimary }}>
                #{preview.bookingRef}
              </p>
            </div>
            {preview.pnr ?
            <div className="text-right">
              <p className="text-[11px]" style={{ color: KTA.textSecondary }}>
                PNR
              </p>
              <p
                className="text-[14px] font-semibold"
                style={{ color: KTA.textPrimary }}>
                {preview.pnr}
              </p>
            </div> :
            null}
          </div>
          <div className="space-y-2.5">
            {preview.rows.map((row) =>
            <div
              key={`${row.label}-${row.value}`}
              className="flex items-start justify-between gap-3 py-2 border-b"
              style={{ borderColor: KTA.border }}>
              <span className="text-[12px]" style={{ color: KTA.textSecondary }}>
                {row.label}
              </span>
              <span
                className="text-[13px] font-semibold text-right max-w-[60%]"
                style={{ color: KTA.textPrimary }}>
                {row.value}
              </span>
            </div>
            )}
          </div>
          {preview.passengers && preview.passengers.length > 0 ?
          <div className="mt-3">
            <p className="text-[11px] mb-1" style={{ color: KTA.textSecondary }}>
              Passenger(s)
            </p>
            <p className="text-[13px] font-medium" style={{ color: KTA.textPrimary }}>
              {preview.passengers.join(', ')}
            </p>
          </div> :
          null}
          {(preview.totalAmount || preview.paymentStatus) ?
          <div
            className="mt-4 rounded-[10px] px-3 py-3 flex items-center justify-between"
            style={{ backgroundColor: KTA.inputBg }}>
            <div>
              <p className="text-[11px]" style={{ color: KTA.textSecondary }}>
                Total
              </p>
              <p className="text-[15px] font-bold" style={{ color: KTA.textPrimary }}>
                {preview.totalAmount || '—'}
              </p>
            </div>
            {preview.paymentStatus ?
            <span
              className="text-[12px] font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: KTA.green }}>
              {preview.paymentStatus}
            </span> :
            null}
          </div> :
          null}
          <p className="text-[10px] mt-4 text-center" style={{ color: KTA.textSecondary }}>
            Present this e-ticket at check-in. Download PDF for a printable copy.
          </p>
        </div> :
        pdfUrl ?
        <iframe
          title="E-Ticket PDF"
          src={pdfUrl}
          className="flex-1 w-full min-h-[60vh] rounded-[12px] border bg-white"
          style={{ borderColor: KTA.border }} /> :
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[13px]" style={{ color: KTA.textSecondary }}>
            Preparing ticket PDF…
          </p>
        </div>}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-[12px] font-bold text-[13px] border bg-white"
            style={{
              borderColor: KTA.border,
              color: KTA.textPrimary
            }}>
            Close
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={() => {
              void handleDownload();
            }}
            className="h-11 rounded-[12px] font-bold text-[13px] text-white disabled:opacity-50"
            style={{
              backgroundColor: KTA.green
            }}>
            Download PDF
          </button>
        </div>
      </div>
    </Sheet>);

}

function cityKindIcon(kind: CityResult['kind']) {
  if (kind === 'airport') return Plane;
  if (kind === 'train') return TrainFront;
  if (kind === 'bus') return Bus;
  return MapPin;
}

export function CitySheet({
  open,
  title,
  mode,
  field,
  onClose,
  onSelect
}: {
  open: boolean;
  title: string;
  mode: Mode;
  field?: 'from' | 'to';
  onClose: () => void;
  onSelect: (
    name: string,
    meta?: {
      code?: string;
      cityId?: string;
      countryCode?: string;
      regionId?: string;
      cityName?: string;
      searchName?: string;
    }
  ) => void;
}) {
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isBus = mode === 'bus';
  const isCar = mode === 'minibus';
  const isFlights = mode === 'flights';
  const isHotels = mode === 'hotels';
  const isTours = mode === 'holiday';
  const busSearch = useBusCitySearch(query, open && isBus, field);
  const airportSearch = useFlightAirportAutocomplete(query, open && isFlights);
  const hotelCitySearch = useHotelCitiesAutocomplete(query, open && isHotels);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    // Focus after the sheet finishes sliding up — avoids keyboard flash.
    const t = window.setTimeout(() => {
      searchInputRef.current?.focus({ preventScroll: true });
    }, 320);
    return () => window.clearTimeout(t);
  }, [open]);

  const staticResults = (
    isCar ?
    CAR_RENTAL_CITY_RESULTS :
    isTours ?
    TOUR_DESTINATION_RESULTS :
    CITY_RESULTS
  ).filter(
    (item) =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.detail.toLowerCase().includes(query.toLowerCase()) ||
    ('code' in item &&
    String((item as { code?: string }).code || '').
    toLowerCase().
    includes(query.toLowerCase()))
  );

  const searchPlaceholder = isBus ?
  field === 'to' ?
  'Search dropping locations…' :
  'Search boarding locations…' :
  isCar ?
  'Search Dubai, Abu Dhabi…' :
  isFlights ?
  'Type city or code (e.g. Add, NBO)…' :
  isHotels ?
  'Search city (e.g. Addis, Dubai)…' :
  isTours ?
  'Search Dubai, Abu Dhabi…' :
  'Search city, airport, station…';

  return (
    <Sheet open={open} onClose={onClose} height="92vh">
      <div className="flex items-center justify-between px-[18px] py-2 shrink-0">
        <h2
          className="text-[18px] font-bold"
          style={{
            color: KTA.textPrimary
          }}>
          {title}
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: KTA.inputBg
          }}>
          <X
            className="w-4 h-4"
            style={{
              color: KTA.textSecondary
            }} />
        </button>
      </div>

      <div className="px-[18px] pb-2 shrink-0">
        <div
          className="flex items-center gap-2 rounded-[10px] px-3 h-11"
          style={{
            backgroundColor: KTA.inputBg
          }}>
          <Search
            className="w-4 h-4"
            style={{
              color: KTA.textSecondary
            }} />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent text-[14px] focus:outline-none"
            style={{
              color: KTA.textPrimary
            }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-[18px] pb-4">
        {isFlights ?
        <>
          {airportSearch.error &&
          <TravelErrorState
            className="my-3"
            variant="inline"
            title="Search failed"
            message={airportSearch.error} />
          }
          {airportSearch.isPopular &&
          airportSearch.results.length > 0 &&
          !airportSearch.loading &&
          <p
            className="pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wide"
            style={{
              color: KTA.textSecondary
            }}>
            Popular airports — type to search GuestAPI
          </p>
          }
          {!airportSearch.isPopular &&
          airportSearch.results.length > 0 &&
          !airportSearch.loading &&
          <p
            className="pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wide"
            style={{
              color: KTA.textSecondary
            }}>
            FlightAirportAutocomplete results
          </p>
          }
          {airportSearch.loading &&
          <p
            className="py-2 text-center text-[12px]"
            style={{
              color: KTA.textSecondary
            }}>
            Searching airports…
          </p>
          }
          {!airportSearch.loading &&
          !airportSearch.error &&
          airportSearch.results.length === 0 &&
          !airportSearch.isPopular &&
          <p
            className="py-4 text-center text-[13px]"
            style={{
              color: KTA.textSecondary
            }}>
            No airports found for this search
          </p>
          }
          {airportSearch.results.map((airport) =>
          <button
            key={`${airport.code}-${airport.countryCode}-${airport.city}-${airport.name}`}
            onClick={() => {
              onSelect(airport.label, {
                code: airport.code,
                countryCode: airport.countryCode
              });
              setQuery('');
            }}
            className="w-full flex items-center gap-3 py-3 border-b text-left"
            style={{
              borderColor: KTA.border
            }}>
            <Plane
              className="w-4 h-4 shrink-0"
              style={{
                color: KTA.textSecondary
              }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  className="text-[14px] font-semibold truncate"
                  style={{
                    color: KTA.textPrimary
                  }}>
                  {airport.city || airport.name}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {airport.countryCode ?
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: KTA.textSecondary,
                      backgroundColor: KTA.inputBg
                    }}>
                    {airport.countryCode}
                  </span> :
                  null}
                  <span
                    className="text-[12px] font-bold"
                    style={{
                      color: KTA.blue
                    }}>
                    {airport.code}
                  </span>
                </div>
              </div>
              <p
                className="text-[11px] truncate"
                style={{
                  color: KTA.textSecondary
                }}>
                {airport.code === 'LOS' ?
                  'Lagos, Nigeria — use this for LOS routes' :
                  airport.code === 'LAX' ?
                    'Los Angeles, USA (LAX) — not Lagos' :
                    airport.detail}
              </p>
            </div>
          </button>
          )}
        </> :
        isHotels ?
        <>
          {hotelCitySearch.error &&
          <TravelErrorState
            className="my-3"
            variant="inline"
            title="Search failed"
            message={hotelCitySearch.error} />
          }
          {hotelCitySearch.isPopular &&
          hotelCitySearch.results.length > 0 &&
          !hotelCitySearch.loading &&
          <p
            className="pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wide"
            style={{
              color: KTA.textSecondary
            }}>
            Popular cities — type to search
          </p>
          }
          {!hotelCitySearch.isPopular &&
          hotelCitySearch.results.length > 0 &&
          !hotelCitySearch.loading &&
          <p
            className="pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wide"
            style={{
              color: KTA.textSecondary
            }}>
            Cities
          </p>
          }
          {hotelCitySearch.loading &&
          <p
            className="py-2 text-center text-[12px]"
            style={{
              color: KTA.textSecondary
            }}>
            Searching cities…
          </p>
          }
          {!hotelCitySearch.loading &&
          !hotelCitySearch.error &&
          !hotelCitySearch.isPopular &&
          hotelCitySearch.results.length === 0 &&
          <p
            className="py-4 text-center text-[13px]"
            style={{
              color: KTA.textSecondary
            }}>
            No cities found for this search
          </p>
          }
          {hotelCitySearch.results.map((city) =>
          <button
            key={city.regionId || city.label}
            onClick={() => {
              onSelect(city.label, {
                cityName: city.cityName,
                countryCode: city.countryCode,
                regionId: city.regionId
              });
              setQuery('');
            }}
            className="w-full flex items-center gap-3 py-3 border-b text-left"
            style={{
              borderColor: KTA.border
            }}>
            <MapPin
              className="w-4 h-4 shrink-0"
              style={{
                color: KTA.textSecondary
              }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  className="text-[14px] font-semibold truncate"
                  style={{
                    color: KTA.textPrimary
                  }}>
                  {city.cityName}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {city.countryCode ?
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: KTA.textSecondary,
                      backgroundColor: KTA.inputBg
                    }}>
                    {city.countryCode}
                  </span> :
                  null}
                </div>
              </div>
              <p
                className="text-[11px] truncate"
                style={{
                  color: KTA.textSecondary
                }}>
                {city.label}
              </p>
            </div>
          </button>
          )}
        </> :
        isBus ?
        <>
          {busSearch.error &&
          <TravelErrorState
            className="my-3"
            variant="inline"
            title="Search failed"
            message={busSearch.error} />
          }
          {!busSearch.error &&
          busSearch.results.length === 0 &&
          <p
            className="py-4 text-center text-[13px]"
            style={{
              color: KTA.textSecondary
            }}>
            {query.trim() ?
            'No locations found' :
            field === 'to' ?
            'Loading dropping locations…' :
            'Loading boarding locations…'}
          </p>
          }
          {busSearch.results.map((city) =>
          <button
            key={`${city.cityId}-${city.name}`}
            type="button"
            onClick={() => {
              onSelect(city.name, {
                cityId: city.cityId,
                searchName: city.searchName
              });
              setQuery('');
            }}
            className="w-full flex items-center gap-3 py-3 border-b text-left"
            style={{
              borderColor: KTA.border
            }}>
            <Bus
              className="w-4 h-4"
              style={{
                color: KTA.textSecondary
              }} />
            <div>
              <p
                className="text-[14px] font-semibold"
                style={{
                  color: KTA.textPrimary
                }}>
                {city.name}
              </p>
              <p
                className="text-[11px]"
                style={{
                  color: KTA.textSecondary
                }}>
                {city.detail ||
                (field === 'to' ? 'Dropping location' : 'Boarding location')}
              </p>
            </div>
          </button>
          )}
        </> :

        staticResults.map((item, idx) => {
          const Icon = cityKindIcon(item.kind);
          return (
            <button
              key={`${item.name}-${idx}`}
              onClick={() => {
                onSelect(
                  item.code ? `${item.name} (${item.code})` : item.name,
                  { code: item.code }
                );
                setQuery('');
              }}
              className="w-full flex items-center gap-3 py-3 border-b text-left"
              style={{
                borderColor: KTA.border
              }}>
              <Icon
                className="w-4 h-4"
                style={{
                  color: KTA.textSecondary
                }} />
              <div>
                <p
                  className="text-[14px] font-semibold"
                  style={{
                    color: KTA.textPrimary
                  }}>
                  {item.name}
                </p>
                <p
                  className="text-[11px]"
                  style={{
                    color: KTA.textSecondary
                  }}>
                  {item.detail}
                </p>
              </div>
            </button>
          );
        })
        }
      </div>
    </Sheet>
  );
}
