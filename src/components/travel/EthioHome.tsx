import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  ArrowLeftRight,
  Calendar,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  X,
  Plane,
  Wallet,
  MapPin,
  Building2,
  Bus,
  Star,
  Clock } from
'lucide-react';
import {
  KTA,
  Mode,
  QUICK_ACTIONS } from
'./ethioTravelData';
import { CalendarSheet } from './CalendarSheet';
import { WalletTransactionsSheet } from './WalletTransactionsSheet';
import { useProductAccess } from '../../hooks/useProductAccess';
import { useHomeDeals } from '../../hooks/useHomeDeals';
import {
  FALLBACK_PRODUCT_CATEGORIES,
  getFlightBookClasses,
  type GuestCurrency,
  type TourActivityDeal,
  type TopDestinationDeal
} from '../../services/guestApi';
import {
  formatPassengerSummary,
  normalizePassengerCounts,
  MAX_FLIGHT_PASSENGERS,
  PAX_AGE_HINTS,
  type PassengerCounts
} from '../../services/guestApi/buildFlightTravellers';
import { extractAirportCode } from '../../services/guestApi/formatTravelDate';
import { POPULAR_FLIGHT_ROUTES } from '../../services/guestApi/flightAirportAutocomplete';
import { useAuth } from '../AuthContext';
import { useTravellerWallet } from '../../hooks/useTravellerWallet';

export type TripType = 'oneway' | 'round' | 'multi';
export interface FlightLeg {
  from: string;
  to: string;
  date: string;
}
/**
 * UI "All" cabin. GuestAPI rejects Id=`1` for some airlines — resolveCabinClassParam
 * maps `all` / empty / `0` / `1` → Economy (`2`) so search still returns full lists.
 */
export const CABIN_CLASS_ALL_VALUE = 'all';
export const CABIN_CLASS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: '2', label: 'Economy' },
  { value: '3', label: 'Premium Economy' },
  { value: '4', label: 'Business' },
  { value: '5', label: 'Premium Business' },
  { value: '6', label: 'First' }
] as const;
interface Props {
  mode: Mode;
  from: string;
  to: string;
  tripType: TripType;
  legs: FlightLeg[];
  onSetTripType: (t: TripType) => void;
  onAddLeg: () => void;
  onRemoveLeg: (i: number) => void;
  onSetMode: (m: Mode) => void;
  onPickCity: (which: 'from' | 'to', leg?: number) => void;
  onSwap: () => void;
  onSearch: () => void;
  onExplore: () => void;
  /** Home “Top Destinations → View all” → Explore tab */
  onViewAllDestinations?: () => void;
  onApplyFlightDeal?: (origin: string, destination: string) => void;
  onApplyHotelDeal?: (location: string) => void;
  onApplyTourDeal?: (destination: string) => void;
  carPickupDateLabel?: string;
  carReturnDateLabel?: string;
  carPickupInputValue?: string;
  carReturnInputValue?: string;
  carPickupMinDate?: string;
  carReturnMinDate?: string;
  onCarPickupDateChange?: (value: string) => void;
  onCarReturnDateChange?: (value: string) => void;
  hotelCheckInDateLabel?: string;
  hotelCheckOutDateLabel?: string;
  hotelCheckInInputValue?: string;
  hotelCheckOutInputValue?: string;
  hotelCheckInMinDate?: string;
  hotelCheckOutMinDate?: string;
  onHotelCheckInDateChange?: (value: string) => void;
  onHotelCheckOutDateChange?: (value: string) => void;
  hotelGuests?: number;
  hotelChildren?: number;
  hotelInfants?: number;
  hotelRooms?: number;
  onHotelGuestsChange?: (value: number) => void;
  onHotelChildrenChange?: (value: number) => void;
  onHotelInfantsChange?: (value: number) => void;
  onHotelRoomsChange?: (value: number) => void;
  legDateInputValues?: string[];
  legDateMinValues?: string[];
  onLegDateChange?: (legIndex: number, value: string) => void;
  flightDepartDateLabel?: string;
  flightReturnDateLabel?: string;
  flightDepartInputValue?: string;
  flightReturnInputValue?: string;
  flightDepartMinDate?: string;
  flightReturnMinDate?: string;
  onFlightDepartDateChange?: (value: string) => void;
  onFlightReturnDateChange?: (value: string) => void;
  flightPassengers?: PassengerCounts;
  onFlightPassengersChange?: (counts: PassengerCounts) => void;
  flightCabinClass?: string;
  onFlightCabinClassChange?: (value: string) => void;
  currencyEnabled: boolean;
  currencyCode: string;
  currencyRate: number;
  currencies: GuestCurrency[];
  currencyLoading?: boolean;
  currencyRateLoading?: boolean;
  currencyError?: string | null;
  onSelectCurrency: (code: string) => void;
}
const TRIP_TYPES: {
  id: TripType;
  label: string;
}[] = [
{
  id: 'oneway',
  label: 'One-way'
},
{
  id: 'round',
  label: 'Round-trip'
},
{
  id: 'multi',
  label: 'Multi-city'
}];

const QUICK_ACTION_ICONS: Record<string, typeof Plane> = {
  hotels: Building2,
  bus: Bus,
  tours: MapPin
};
export function EthioHome({
  mode,
  from,
  to,
  tripType,
  legs,
  onSetTripType,
  onAddLeg,
  onRemoveLeg,
  onSetMode,
  onPickCity,
  onSwap,
  onSearch,
  onExplore,
  onViewAllDestinations,
  onApplyFlightDeal,
  onApplyHotelDeal,
  onApplyTourDeal,
  carPickupDateLabel = 'Today',
  carReturnDateLabel = 'In 2 days',
  carPickupInputValue = '',
  carReturnInputValue = '',
  carPickupMinDate = '',
  carReturnMinDate = '',
  onCarPickupDateChange,
  onCarReturnDateChange,
  hotelCheckInDateLabel = 'Check-in',
  hotelCheckOutDateLabel = 'Check-out',
  hotelCheckInInputValue = '',
  hotelCheckOutInputValue = '',
  hotelCheckInMinDate = '',
  hotelCheckOutMinDate = '',
  onHotelCheckInDateChange,
  onHotelCheckOutDateChange,
  hotelGuests = 1,
  hotelChildren = 0,
  hotelInfants = 0,
  hotelRooms = 1,
  onHotelGuestsChange,
  onHotelChildrenChange,
  onHotelInfantsChange,
  onHotelRoomsChange,
  legDateInputValues = [],
  legDateMinValues = [],
  onLegDateChange,
  flightDepartDateLabel = 'Depart',
  flightReturnDateLabel = 'Return',
  flightDepartInputValue = '',
  flightReturnInputValue = '',
  flightDepartMinDate = '',
  flightReturnMinDate = '',
  onFlightDepartDateChange,
  onFlightReturnDateChange,
  flightPassengers = { adultCount: 1, childrenCount: 0, infantCount: 0 },
  onFlightPassengersChange,
  flightCabinClass = CABIN_CLASS_ALL_VALUE,
  onFlightCabinClassChange,
  currencyEnabled,
  currencyCode,
  currencyRate,
  currencies,
  currencyLoading = false,
  currencyRateLoading = false,
  currencyError,
  onSelectCurrency
}: Props) {
  const { user, traveller } = useAuth();
  const {
    label: walletCreditLabel,
    userId: walletUserId,
    userTypeId: walletUserTypeId,
    refreshDashboard: refreshWallet
  } =
    useTravellerWallet({
      currencyCode,
      currencyRate: currencyCode === 'ETB' ? 1 : currencyRate,
      pollMs: 30_000
    });
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName =
    traveller.profile?.firstName ||
    traveller.profile?.fullName?.split(/\s+/)[0] ||
    user?.name?.split(/\s+/)[0] ||
    traveller.session?.username ||
    user?.username ||
    'Traveller';
  const walletCreditRaw =
    traveller.dashboard?.availableCredit ||
    traveller.session?.currencySymbol ||
    'ETB 0.00';
  void walletCreditRaw;

  const {
    tours: tourDeals,
    destinations: topDestinations,
    loadingTours,
    loadingDestinations,
    tourError,
    destinationError
  } = useHomeDeals(true);

  const passengerSummary = formatPassengerSummary(flightPassengers);
  const [cabinClassOptions, setCabinClassOptions] = useState<
    { value: string; label: string }[]
  >(() => CABIN_CLASS_OPTIONS.map((option) => ({ ...option })));
  useEffect(() => {
    let cancelled = false;
    getFlightBookClasses().
    then((options) => {
      if (!cancelled && options.length > 0) setCabinClassOptions(options);
    }).
    catch(() => {
      // Keep the documented Economy…First fallback.
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const cabinOptionsWithAll = (() => {
    // Drop broken GuestAPI Id=1; keep our UI "All" (`all`) which maps to Economy at search.
    const cleaned = cabinClassOptions.filter(
      (option) =>
        option.value !== '1' &&
        !(option.value !== 'all' && /^all$/i.test(option.label.trim()))
    );
    const base =
      cleaned.length > 0 ?
        cleaned :
        CABIN_CLASS_OPTIONS.map((option) => ({ ...option }));
    const withoutAll = base.filter(
      (option) => option.value !== 'all' && !/^all$/i.test(option.label.trim())
    );
    return [{ value: CABIN_CLASS_ALL_VALUE, label: 'All' }, ...withoutAll];
  })();
  const cabinLabel =
    cabinOptionsWithAll.find((option) => option.value === flightCabinClass)?.
    label || 'All';
  const updatePassengers = (patch: Partial<PassengerCounts>) => {
    onFlightPassengersChange?.(
      normalizePassengerCounts({
        ...flightPassengers,
        ...patch
      })
    );
  };
  const PassengerStepper = ({
    label,
    hint,
    value,
    min,
    max,
    onChange
  }: {
    label: string;
    hint?: string;
    value: number;
    min: number;
    max: number;
    onChange: (next: number) => void;
  }) =>
  <div className="flex items-center justify-between gap-2 py-3 sm:py-3.5 border-b border-teal-600/10 last:border-0 min-w-0">
      <div className="min-w-0 pr-2">
        <p className="text-[14px] sm:text-[15px] font-semibold text-gray-800 truncate">
          {label}
        </p>
        {hint &&
        <p className="text-[12px] text-gray-500 mt-0.5">{hint}</p>
        }
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="ui-stepper-btn bg-white/80 backdrop-blur border border-teal-200 text-teal-700 shadow-sm disabled:opacity-30"
        aria-label={`Decrease ${label}`}>
        
          <Minus className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </button>
        <span className="w-7 sm:w-8 text-center text-[15px] sm:text-[16px] font-bold text-teal-700 tabular-nums">{value}</span>
        <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="ui-stepper-btn bg-teal-600 text-white shadow-lg shadow-teal-600/35 disabled:opacity-30"
        aria-label={`Increase ${label}`}>
        
          <Plus className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </button>
      </div>
    </div>;
  const isFlights = mode === 'flights';
  const supportsTripType =
  mode === 'flights' || mode === 'bus' || mode === 'train';
  // Multi-city is flights-only; coerce it to round-trip for bus/train.
  const effectiveType: TripType = isFlights ?
  tripType :
  tripType === 'multi' ?
  'round' :
  tripType;
  const searchCardRef = useRef<HTMLDivElement>(null);
  const toursRef = useRef<HTMLDivElement>(null);
  const destinationsRef = useRef<HTMLDivElement>(null);
  const { categories: productCategories, loading: productsLoading } =
  useProductAccess();
  const categories =
  productCategories.length > 0 ?
  productCategories :
  FALLBACK_PRODUCT_CATEGORIES;
  const [passengerSheetOpen, setPassengerSheetOpen] = useState(false);
  const [guestRoomSheetOpen, setGuestRoomSheetOpen] = useState(false);
  const [currencySheetOpen, setCurrencySheetOpen] = useState(false);
  const [dateSheet, setDateSheet] = useState<
  {
    kind:
    'flightDepart' |
    'flightReturn' |
    'carPickup' |
    'carReturn' |
    'hotelCheckIn' |
    'hotelCheckOut';
  } |
  { kind: 'leg'; index: number } |
  null>(
    null);
  const dateSheetConfig = (() => {
    if (!dateSheet) return null;
    switch (dateSheet.kind) {
      case 'flightDepart':
        return {
          title: 'Departure date',
          value: flightDepartInputValue,
          min: flightDepartMinDate,
          onChange: onFlightDepartDateChange
        };
      case 'flightReturn':
        return {
          title: 'Return date',
          value: flightReturnInputValue,
          min: flightReturnMinDate || flightDepartInputValue,
          onChange: onFlightReturnDateChange
        };
      case 'carPickup':
        return {
          title: 'Pickup date',
          value: carPickupInputValue,
          min: carPickupMinDate,
          onChange: onCarPickupDateChange
        };
      case 'carReturn':
        return {
          title: 'Return date',
          value: carReturnInputValue,
          min: carReturnMinDate || carPickupInputValue,
          onChange: onCarReturnDateChange
        };
      case 'hotelCheckIn':
        return {
          title: 'Check-in date',
          value: hotelCheckInInputValue,
          min: hotelCheckInMinDate,
          onChange: onHotelCheckInDateChange
        };
      case 'hotelCheckOut':
        return {
          title: 'Check-out date',
          value: hotelCheckOutInputValue,
          min: hotelCheckOutMinDate,
          onChange: onHotelCheckOutDateChange
        };
      case 'leg':
        return {
          title: `Flight ${dateSheet.index + 1} date`,
          value: legDateInputValues[dateSheet.index] ?? '',
          min: legDateMinValues[dateSheet.index] ?? '',
          onChange: (v: string) => onLegDateChange?.(dateSheet.index, v)
        };
    }
  })();
  const openPassengerSheet = () => {
    if (isFlights || mode === 'bus' || mode === 'train') {
      setPassengerSheetOpen(true);
    }
  };
  const closePassengerSheet = () => setPassengerSheetOpen(false);
  const handlePassengerApply = () => {
    closePassengerSheet();
  };
  const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };
  const applyPopularRoute = (route: (typeof POPULAR_FLIGHT_ROUTES)[number]) => {
    if (onApplyFlightDeal) {
      onApplyFlightDeal(route.fromLabel, route.toLabel);
    } else {
      onSetMode('flights');
    }
    setTimeout(() => scrollToRef(searchCardRef), 80);
  };
  const applyTourDeal = (deal: TourActivityDeal | TopDestinationDeal) => {
    const destination = deal.destination;
    if (onApplyTourDeal) {
      onApplyTourDeal(destination);
    } else {
      onSetMode('holiday');
    }
    setTimeout(() => scrollToRef(searchCardRef), 80);
  };
  const handleQuickAction = (id: string) => {
    switch (id) {
      case 'hotels':
        onSetMode('hotels');
        setTimeout(() => scrollToRef(searchCardRef), 100);
        break;
      case 'bus':
        onSetMode('bus');
        setTimeout(() => scrollToRef(searchCardRef), 100);
        break;
      case 'tours':
        onSetMode('holiday');
        setTimeout(() => scrollToRef(searchCardRef), 100);
        break;
    }
  };
  const Section = ({
    title,
    action,
    onAction,
    children
  }: {title: string;action?: string;onAction?: () => void;children: React.ReactNode;}) =>
  <div className="ui-section">
      <div className="ui-section-header">
        <h3 className="ui-section-title" style={{ color: KTA.textPrimary }}>
          {title}
        </h3>
        {action &&
      <button
        onClick={onAction}
        className="ui-section-action"
        style={{ color: KTA.blue }}>
            {action}
          </button>
      }
      </div>
      {children}
    </div>;

  return (
    <>
    <div className="flex-1 overflow-y-auto no-scrollbar relative bg-transparent pb-3 min-w-0">
      <div className="relative z-10">
      
      {/* Hero welcome card */}
      <div className="px-5 sm:px-5 pt-1 pb-4">
        <motion.div
          initial={{
            opacity: 0,
            y: 12
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.4,
            ease: 'easeOut'
          }}
          className="rounded-[18px] sm:rounded-ios-xl p-4 sm:p-5 relative overflow-hidden shadow-ios-lg"
          style={{
            background: `linear-gradient(135deg, #0D9488 0%, #0F766E 40%, #F97316 100%)`
          }}>
          
          <Plane className="absolute -right-6 -top-2 w-28 h-28 sm:w-36 sm:h-36 text-white/10 -rotate-12 pointer-events-none" />
          <button
            type="button"
            onClick={() => {
              if (!currencyEnabled) setCurrencySheetOpen(true);
            }}
            disabled={currencyEnabled}
            aria-haspopup="listbox"
            aria-expanded={currencySheetOpen}
            aria-label={
              currencyEnabled && currencyCode !== 'ETB' ?
                `Display currency ${currencyCode}` :
                `Source currency ${currencyCode === 'ETB' ? 'ETB' : currencyCode}`
            }
            className={`absolute top-10 right-3 z-20 h-9 min-w-[88px] px-2.5 rounded-lg border border-white/35 bg-white/15 backdrop-blur-sm flex items-center justify-between gap-2 text-white shadow-sm ${
              currencyEnabled ? 'cursor-default opacity-95' : 'active:scale-[0.98]'
            }`}>
            <div className="min-w-0 flex flex-col items-start leading-none gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-white/70">
                {currencyEnabled && currencyCode !== 'ETB' ? 'CUR' : 'SRC'}
              </span>
              <span className="text-[13px] font-bold truncate">
                {currencyRateLoading ? '…' : currencyCode || 'ETB'}
              </span>
            </div>
            {!currencyEnabled &&
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-white/85" />}
          </button>
          <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0 flex-1 pr-[6.5rem] sm:pr-28">
              <p className="text-[17px] sm:text-[18px] text-white/90 mb-0.5">{greeting},</p>
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-[22px] sm:text-[26px] font-bold text-white leading-tight truncate">
                  {displayName} 👋
                </p>
              </div>
              {currencyEnabled &&
              currencyCode !== 'ETB' &&
              Number(currencyRate) > 0 &&
              Number(currencyRate) !== 1 &&
              <p className="text-[10px] text-white/70 mt-1">
                1 ETB = {currencyRate.toLocaleString(undefined, {
                  maximumFractionDigits: 6
                })} {currencyCode}
              </p>}
              <p className="text-[13px] sm:text-[14px] text-white/85 mt-1.5 leading-snug">
                Ready for your next trip? Search below to get started.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void refreshWallet();
                setWalletSheetOpen(true);
              }}
              className="w-full sm:w-auto sm:max-w-[220px] shrink-0 flex items-center gap-2.5 bg-white/15 backdrop-blur-md border border-white/25 rounded-xl px-3 py-3 sm:py-2.5 hover:bg-white/25 active:scale-[0.98] transition-all duration-200 touch-manipulation min-h-[48px]"
              aria-label="View mKash Wallet balance">
              
              <Wallet className="w-5 h-5 text-white shrink-0" />
              <div className="text-left leading-tight min-w-0 flex-1">
                <p className="text-[11px] text-white/80">mKash Wallet</p>
                <p className="text-[14px] font-bold text-white truncate">
                  {walletCreditLabel}
                </p>
                <p className="text-[11px] text-white/70 mt-0.5 hidden sm:block">Tap to view</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/80 shrink-0" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Search card */}
      <div className="px-5 sm:px-5 pb-4" ref={searchCardRef}>
        <div className="rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 border border-white/85 bg-white/70 backdrop-blur-2xl shadow-horizon-lg ring-1 ring-teal-500/10 min-w-0">
          
          <div className="ui-card-intro mb-4">
            <h2 className="ui-card-intro-title" style={{ color: KTA.textPrimary }}>Plan your trip</h2>
            <p className="ui-card-intro-desc">Choose a service, pick your dates, then tap search.</p>
          </div>

          {/* Category selector — one scrollable row (includes Holiday & Bus) */}
          <div className="ui-chip-row" role="tablist" aria-label="Travel services">
            {categories.map((category) => {
              const Icon = category.icon;
              const active = mode === category.mode;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSetMode(category.mode)}
                  className={`ui-chip ${active ? 'ui-chip-active' : 'ui-chip-inactive'}`}>
                  
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 pointer-events-none" aria-hidden />
                  <span className="pointer-events-none whitespace-nowrap">{category.label}</span>
                </button>);

            })}
            {productsLoading && categories.length === 0 &&
            <div className="flex gap-2 shrink-0">
              {[1, 2, 3, 4].map((i) =>
              <div key={i} className="skeleton h-9 w-20 rounded-full shrink-0" />
              )}
            </div>
            }
          </div>

          {/* Trip type (flights, buses, trains) — multi-city flights only */}
          {supportsTripType &&
          <div className="ui-segmented mb-4">
            
              {TRIP_TYPES.filter((t) => isFlights || t.id !== 'multi').map(
              (t) => {
                const active = effectiveType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSetTripType(t.id)}
                    className={`ui-segmented-item ${active ? 'ui-segmented-item-active' : ''}`}>
                    
                      {t.label}
                    </button>);

              }
            )}
            </div>
          }

          {/* Popular routes — front display chips → fill From/To & scroll to search */}
          {isFlights &&
          <div className="mb-3 -mx-1">
            <p className="px-1 text-[11px] font-semibold text-slate-500 mb-1.5">
              Popular routes
            </p>
            <div className="ui-h-scroll gap-2 px-1 pb-0.5" role="list" aria-label="Popular flight routes">
              {POPULAR_FLIGHT_ROUTES.map((route) => {
                const selected =
                  extractAirportCode(from) === route.fromCode &&
                  extractAirportCode(to) === route.toCode;
                return (
                  <button
                    key={route.chip}
                    type="button"
                    role="listitem"
                    onClick={() => applyPopularRoute(route)}
                    className={`shrink-0 h-8 px-3 rounded-full text-[12px] font-semibold border transition-colors touch-manipulation active:scale-[0.98] ${
                      selected ?
                        'bg-teal-600 text-white border-teal-600' :
                        'bg-white/90 text-slate-700 border-slate-200'
                    }`}>
                    {route.chip}
                  </button>
                );
              })}
            </div>
          </div>
          }

          {mode === 'hotels' ?
          <>
              {/* Destination */}
              <div className="mb-2">
                <button
                onClick={() => onPickCity('to')}
                aria-label="Select destination city or hotel"
                className="ui-field-box p-2.5 sm:p-3 w-full text-left">
                
                  <p className="ui-field-label mb-0.5">Destination</p>
                  <p
                  className={`ui-field-value ${to === 'Where to?' ? 'ui-field-value-empty' : ''}`}>
                  
                    {to === 'Where to?' ? 'City or hotel name' : to}
                  </p>
                </button>
              </div>
              {/* Dates */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 min-w-0">
                <button
                type="button"
                aria-label={`Select check-in date, currently ${hotelCheckInDateLabel}`}
                onClick={() => setDateSheet({ kind: 'hotelCheckIn' })}
                className="ui-field-box p-2.5 min-w-0 text-left">
                
                  <div className="flex items-center gap-1 mb-0.5 min-w-0">
                    <Calendar className="ui-field-icon text-gray-500" />
                    <p className="ui-field-label">Check-in</p>
                  </div>
                  <p className="ui-field-value">{hotelCheckInDateLabel}</p>
                </button>
                <button
                type="button"
                aria-label={`Select check-out date, currently ${hotelCheckOutDateLabel}`}
                onClick={() => setDateSheet({ kind: 'hotelCheckOut' })}
                className="ui-field-box p-2.5 min-w-0 text-left">
                
                  <div className="flex items-center gap-1 mb-0.5 min-w-0">
                    <Calendar className="ui-field-icon text-gray-500" />
                    <p className="ui-field-label">Check-out</p>
                  </div>
                  <p
                    className={`ui-field-value ${
                      hotelCheckOutDateLabel === 'Select date' ||
                      hotelCheckOutDateLabel === 'Check-out' ?
                        'ui-field-value-empty' :
                        ''
                    }`}>
                    {hotelCheckOutDateLabel}
                  </p>
                </button>
              </div>
              {/* Guests & Rooms */}
              <button
                type="button"
                onClick={() => setGuestRoomSheetOpen(true)}
                className="ui-field-box p-2.5 mb-3 min-w-0 w-full text-left">
              
                <div className="flex items-center gap-1 mb-0.5 min-w-0">
                  <Users className="ui-field-icon text-gray-500" />
                  <p className="ui-field-label">Guests & Rooms</p>
                </div>
                <p className="ui-field-value">{hotelGuests} Guest{hotelGuests !== 1 ? 's' : ''} · {hotelRooms} Room{hotelRooms !== 1 ? 's' : ''}</p>
              </button>
            </> :
          mode === 'holiday' ?
          <>
              <div className="mb-2">
                <button
                onClick={() => onPickCity('to')}
                aria-label="Select tour destination"
                className="ui-field-box p-2.5 sm:p-3 w-full text-left">
                  <p className="ui-field-label mb-0.5">Destination</p>
                  <p
                  className={`ui-field-value ${to === 'Where to?' ? 'ui-field-value-empty' : ''}`}>
                    {to === 'Where to?' ? 'Dubai, Abu Dhabi…' : to}
                  </p>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 min-w-0">
                <button
                type="button"
                aria-label={`Select from date, currently ${hotelCheckInDateLabel}`}
                onClick={() => setDateSheet({ kind: 'hotelCheckIn' })}
                className="ui-field-box p-2.5 min-w-0 text-left">
                  <div className="flex items-center gap-1 mb-0.5 min-w-0">
                    <Calendar className="ui-field-icon text-gray-500" />
                    <p className="ui-field-label">From</p>
                  </div>
                  <p className="ui-field-value">{hotelCheckInDateLabel}</p>
                </button>
                <button
                type="button"
                aria-label={`Select to date, currently ${hotelCheckOutDateLabel}`}
                onClick={() => setDateSheet({ kind: 'hotelCheckOut' })}
                className="ui-field-box p-2.5 min-w-0 text-left">
                  <div className="flex items-center gap-1 mb-0.5 min-w-0">
                    <Calendar className="ui-field-icon text-gray-500" />
                    <p className="ui-field-label">To</p>
                  </div>
                  <p
                    className={`ui-field-value ${
                      hotelCheckOutDateLabel === 'Select date' ||
                      hotelCheckOutDateLabel === 'Check-out' ?
                        'ui-field-value-empty' :
                        ''
                    }`}>
                    {hotelCheckOutDateLabel}
                  </p>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setGuestRoomSheetOpen(true)}
                className="ui-field-box p-2.5 mb-3 min-w-0 w-full text-left">
                <div className="flex items-center gap-1 mb-0.5 min-w-0">
                  <Users className="ui-field-icon text-gray-500" />
                  <p className="ui-field-label">Travellers</p>
                </div>
                <p className="ui-field-value">
                  {hotelGuests} Adult{hotelGuests !== 1 ? 's' : ''}
                  {typeof hotelChildren === 'number' && hotelChildren > 0 ?
                  ` · ${hotelChildren} Child${hotelChildren !== 1 ? 'ren' : ''}` :
                  ''}
                  {typeof hotelInfants === 'number' && hotelInfants > 0 ?
                  ` · ${hotelInfants} Infant${hotelInfants !== 1 ? 's' : ''}` :
                  ''}
                </p>
              </button>
            </> :
          mode === 'minibus' ?
          <>
              {/* Pickup Location */}
              <div className="mb-2">
                <button
                onClick={() => onPickCity('from')}
                aria-label={`Select pickup location, currently ${from}`}
                className="ui-field-box p-2.5 sm:p-3 w-full text-left">
                
                  <p className="ui-field-label mb-0.5">Pickup Location</p>
                  <p className="ui-field-value">{from}</p>
                </button>
              </div>
              {/* Dates */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 min-w-0">
                <button
                type="button"
                aria-label={`Select pickup date, currently ${carPickupDateLabel}`}
                onClick={() => setDateSheet({ kind: 'carPickup' })}
                className="ui-field-box p-2.5 min-w-0 text-left">
                
                  <div className="flex items-center gap-1 mb-0.5 min-w-0">
                    <Calendar className="ui-field-icon text-gray-500" />
                    <p className="ui-field-label">Pickup Date</p>
                  </div>
                  <p className="ui-field-value">{carPickupDateLabel}</p>
                </button>
                <button
                type="button"
                aria-label={`Select return date, currently ${carReturnDateLabel}`}
                onClick={() => setDateSheet({ kind: 'carReturn' })}
                className="ui-field-box p-2.5 min-w-0 text-left">
                
                  <div className="flex items-center gap-1 mb-0.5 min-w-0">
                    <Calendar className="ui-field-icon text-gray-500" />
                    <p className="ui-field-label">Return Date</p>
                  </div>
                  <p className="ui-field-value">{carReturnDateLabel}</p>
                </button>
              </div>
              {/* Passengers */}
              <div className="ui-field-box p-2.5 mb-3 min-w-0">
              
                <div className="flex items-center gap-1 mb-0.5 min-w-0">
                  <Users className="ui-field-icon text-gray-500" />
                  <p className="ui-field-label">Driver & Passengers</p>
                </div>
                <p className="ui-field-value">1 Driver</p>
              </div>
            </> :
          effectiveType === 'multi' ?
          <>
              {/* Multi-city legs — same field chrome as one-way / round-trip */}
              <div className="space-y-3 mb-2">
                {legs.map((leg, i) =>
              <div key={i} className="min-w-0">
                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                      <span
                    className="text-[11px] font-bold uppercase tracking-wide"
                    style={{
                      color: KTA.textSecondary
                    }}>
                    
                        Flight {i + 1}
                      </span>
                      {legs.length > 2 &&
                  <button
                    type="button"
                    onClick={() => onRemoveLeg(i)}
                    aria-label={`Remove flight ${i + 1}`}
                    className="w-7 h-7 rounded-full flex items-center justify-center active:bg-slate-100"
                    style={{
                      color: KTA.textSecondary
                    }}>
                    
                          <X className="w-3.5 h-3.5" />
                        </button>
                  }
                    </div>
                    <div className="relative grid grid-cols-2 gap-2 sm:gap-3 mb-2 min-w-0">
                      <button
                    type="button"
                    onClick={() => onPickCity('from', i)}
                    aria-label={`Select departure airport for flight ${i + 1}, currently ${leg.from}`}
                    className="ui-field-box p-2.5 sm:p-3 pr-7 sm:pr-8 text-left">
                    
                        <p className="ui-field-label mb-0.5">From</p>
                        <p className="ui-field-value">{leg.from}</p>
                      </button>
                      <button
                    type="button"
                    onClick={() => onPickCity('to', i)}
                    aria-label={`Select destination airport for flight ${i + 1}, currently ${leg.to}`}
                    className="ui-field-box p-2.5 sm:p-3 pl-7 sm:pl-8 text-left">
                    
                        <p className="ui-field-label mb-0.5">To</p>
                        <p
                      className={`ui-field-value ${leg.to === 'Where to?' ? 'ui-field-value-empty' : ''}`}>
                      
                          {leg.to}
                        </p>
                      </button>
                      <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-md ring-4 ring-white/90 pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, ${KTA.blue}, #115E59)`
                    }}
                    aria-hidden>
                    
                        <Plane className="w-3.5 h-3.5 text-white rotate-90" strokeWidth={2.25} />
                      </div>
                    </div>
                    <button
                  type="button"
                  onClick={() => setDateSheet({ kind: 'leg', index: i })}
                  aria-label={`Select date for flight ${i + 1}, currently ${leg.date}`}
                  className="ui-field-box p-2.5 min-w-0 w-full text-left">
                  
                      <div className="flex items-center gap-1 mb-0.5 min-w-0">
                        <Calendar className="ui-field-icon text-gray-500" />
                        <p className="ui-field-label">Depart</p>
                      </div>
                      <p className="ui-field-value">{leg.date}</p>
                    </button>
                  </div>
              )}
              </div>
              {legs.length < 4 &&
            <button
              type="button"
              onClick={onAddLeg}
              className="w-full flex items-center justify-center gap-1.5 h-11 rounded-2xl border border-dashed mb-3 text-[13px] font-semibold touch-manipulation active:scale-[0.99] transition-transform"
              style={{
                borderColor: KTA.blue,
                color: KTA.blue,
                backgroundColor: 'rgba(13, 148, 136, 0.06)'
              }}>
              
                  <Plus className="w-4 h-4" />
                  Add another flight
                </button>
            }
              <button
              type="button"
              onClick={openPassengerSheet}
              aria-label={`Select passengers, currently ${passengerSummary}`}
              className="ui-field-box p-2.5 mb-3 min-w-0 w-full text-left">
              
                <div className="flex items-center gap-1 mb-0.5 min-w-0">
                  <Users className="ui-field-icon text-gray-500" />
                  <p className="ui-field-label">Passengers</p>
                </div>
                <p className="ui-field-value">{passengerSummary} · {cabinLabel}</p>
              </button>
            </> :

              <>
              {/* From / To */}
              <div className="relative grid grid-cols-2 gap-2 sm:gap-3 mb-3 min-w-0">
                <button
                onClick={() => onPickCity('from')}
                aria-label={`Select departure ${mode === 'bus' ? 'city' : 'airport'}, currently ${from}`}
                className="ui-field-box p-2.5 sm:p-3 pr-7 sm:pr-8">
                
                  <p className="ui-field-label mb-0.5">From</p>
                  <p
                  className={`ui-field-value ${from === 'Where from?' ? 'ui-field-value-empty' : ''}`}>
                    {from === 'Where from?' ? 'Select city' : from}
                  </p>
                </button>
                <button
                onClick={() => onPickCity('to')}
                aria-label={`Select destination ${mode === 'bus' ? 'city' : 'airport'}, currently ${to}`}
                className="ui-field-box p-2.5 sm:p-3 pl-7 sm:pl-8">
                
                  <p className="ui-field-label mb-0.5">To</p>
                  <p
                  className={`ui-field-value ${to === 'Where to?' ? 'ui-field-value-empty' : ''}`}>
                  
                    {to === 'Where to?' ? (mode === 'bus' ? 'Select city' : to) : to}
                  </p>
                </button>
                <button
                onClick={onSwap}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center shadow-lg shadow-teal-600/30 ring-4 ring-white/90 touch-manipulation active:scale-95 transition-transform"
                style={{
                  background: `linear-gradient(135deg, ${KTA.blue}, #115E59)`
                }}
                aria-label="Swap">
                
                  <ArrowLeftRight className="w-4 h-4 text-white shrink-0" strokeWidth={2.25} />
                </button>
              </div>

              {/* Date / passengers — responsive: round = 2-col dates, then pax row */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 min-w-0">
                <button
                type="button"
                aria-label={`Select departure date, currently ${flightDepartDateLabel}`}
                onClick={() => setDateSheet({ kind: 'flightDepart' })}
                className="ui-field-box p-2.5 min-w-0">
                
                  <div className="flex items-center gap-1 mb-0.5 min-w-0">
                    <Calendar className="ui-field-icon text-gray-500" />
                    <p className="ui-field-label">Depart</p>
                  </div>
                  <p className="ui-field-value">{flightDepartDateLabel}</p>
                </button>
                {effectiveType === 'round' ?
              <button
                type="button"
                aria-label={`Select return date, currently ${flightReturnDateLabel}`}
                onClick={() => setDateSheet({ kind: 'flightReturn' })}
                className="ui-field-box p-2.5 min-w-0">
                
                    <div className="flex items-center gap-1 mb-0.5 min-w-0">
                      <Calendar className="ui-field-icon text-gray-500" />
                      <p className="ui-field-label">Return</p>
                    </div>
                    <p className="ui-field-value">{flightReturnDateLabel}</p>
                  </button> :

              <button
                type="button"
                onClick={openPassengerSheet}
                aria-label={`Select passengers, currently ${passengerSummary}`}
                className="ui-field-box p-2.5 min-w-0 text-left">
                
                  <div className="flex items-center gap-1 mb-0.5 min-w-0">
                    <Users className="ui-field-icon text-gray-500" />
                    <p className="ui-field-label">Passengers</p>
                  </div>
                  <p className="ui-field-value">
                    {passengerSummary}{mode === 'flights' ? ` · ${cabinLabel}` : ''}
                  </p>
                </button>
              }
              </div>
              {effectiveType === 'round' &&
            <button
              type="button"
              onClick={openPassengerSheet}
              aria-label={`Select passengers, currently ${passengerSummary}`}
              className="ui-field-box p-2.5 mb-3 min-w-0 w-full text-left">
              
                <div className="flex items-center gap-1 mb-0.5 min-w-0">
                  <Users className="ui-field-icon text-gray-500" />
                  <p className="ui-field-label">Passengers</p>
                </div>
              <p className="ui-field-value">
                {passengerSummary}{mode === 'flights' ? ` · ${cabinLabel}` : ''}
              </p>
              </button>
            }
            </>
          }

          <button
            onClick={onSearch}
            className="ui-btn-primary w-full h-12 rounded-2xl flex items-center justify-center gap-2 touch-manipulation">
            
            <Search className="w-4 h-4 shrink-0" />
            {mode === 'hotels' ?
            'Search hotels' :
            mode === 'holiday' ?
            'Search tours' :
            mode === 'minibus' ?
            'Search cars' :
            isFlights ?
            'Search Flights' :
            'Search'}
          </button>
        </div>
      </div>

      {/* Quick actions grid */}
      <div className="px-5 sm:px-5 pb-4 grid grid-cols-3 gap-2 sm:gap-3">
        {QUICK_ACTIONS.map((a) => {
          const Icon = QUICK_ACTION_ICONS[a.id] || Plane;
          return (
            <button
              key={a.id}
              onClick={() => {
                if (a.id === 'hotels') onSetMode('hotels');
                else if (a.id === 'tours') onSetMode('holiday');
                else if (a.id === 'bus') onSetMode('bus');
                handleQuickAction(a.id);
              }}
              className="glass-card p-3 sm:p-3.5 relative hover:shadow-ios-md transition-all duration-ios active:scale-[0.98] flex flex-col items-center text-center min-w-0 min-h-[96px] sm:min-h-[104px] touch-manipulation">
              
              {a.badge &&
              <span
                className="absolute top-1.5 right-1.5 z-10 text-[11px] sm:text-[11px] font-bold text-white px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap"
                style={{
                  backgroundColor: a.badgeColor
                }}>
                
                  {a.badge}
                </span>
              }
              <div className="relative z-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full glass-icon-wrap mb-1.5 sm:mb-2 shrink-0">
                
                <Icon
                  className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                
              </div>
              <p
                className="text-[11px] sm:text-[12px] font-semibold leading-snug w-full line-clamp-2 px-0.5"
                style={{
                  color: KTA.textPrimary
                }}>
                
                {a.label}
              </p>
            </button>);

        })}
      </div>

      {/* Tours & Activities — ToursandActivities API */}
      <Section
        title="Tours"
        action="View all"
        onAction={() => {
          onSetMode('holiday');
          setTimeout(() => scrollToRef(searchCardRef), 80);
        }}>
        <div ref={toursRef} className="flex gap-3 overflow-x-auto no-scrollbar px-[18px] pb-1">
          {loadingTours && tourDeals.length === 0 &&
          Array.from({ length: 3 }).map((_, i) =>
          <div
            key={`tour-skel-${i}`}
            className="w-[170px] shrink-0 h-[200px] rounded-ios-lg bg-slate-200/70 animate-pulse" />
          )}
          {!loadingTours && tourError && tourDeals.length === 0 &&
          <p className="px-1 py-4 text-[12px] text-slate-500">
            Couldn&apos;t load tours right now.
          </p>
          }
          {!loadingTours && !tourError && tourDeals.length === 0 &&
          <p className="px-1 py-4 text-[12px] text-slate-500">
            No tours right now.
          </p>
          }
          {tourDeals.map((t) =>
          <button
            key={t.id}
            type="button"
            onClick={() => applyTourDeal(t)}
            className="w-[170px] shrink-0 rounded-ios-lg shadow-ios-sm overflow-hidden text-left relative h-[200px] hover:shadow-ios-md transition-all duration-ios active:scale-[0.98] bg-slate-800">
            {t.image ?
            <img
              src={t.image}
              alt={t.name}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = '0';
              }} /> :
            null}
            <div
              className="absolute inset-0"
              style={{
                background:
                'linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.08))'
              }} />
            <div className="relative z-10 h-full flex flex-col justify-end p-3">
              <p className="text-[14px] font-bold text-white leading-tight line-clamp-2">
                {t.name}
              </p>
              <div className="flex items-center gap-1 mt-1 min-w-0">
                <MapPin className="w-3 h-3 text-white/80 shrink-0" />
                <span className="text-[11px] text-white/85 truncate">
                  {t.destination}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-0.5 min-w-0">
                <Clock className="w-3 h-3 text-white/80 shrink-0" />
                <span className="text-[11px] text-white/85 truncate">
                  {t.duration}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 gap-2">
                <span className="text-[13px] font-bold text-white tabular-nums truncate">
                  {t.price}
                </span>
                <span
                  className="text-[11px] font-bold px-2 py-1 rounded-full bg-white shrink-0"
                  style={{ color: KTA.blue }}>
                  Book
                </span>
              </div>
            </div>
          </button>
          )}
        </div>
      </Section>

      {/* Top Destinations — TopDestinations API */}
      <div ref={destinationsRef}>
      <Section
        title="Top Destinations"
        action="View all"
        onAction={() => {
          if (onViewAllDestinations) {
            onViewAllDestinations();
            return;
          }
          setTimeout(() => scrollToRef(destinationsRef), 40);
        }}>
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-[18px] pb-1">
          {loadingDestinations && topDestinations.length === 0 &&
          Array.from({ length: 3 }).map((_, i) =>
          <div
            key={`dest-skel-${i}`}
            className="w-[140px] shrink-0 h-[160px] rounded-ios-lg bg-slate-200/70 animate-pulse" />
          )}
          {!loadingDestinations && destinationError && topDestinations.length === 0 &&
          <p className="px-1 py-4 text-[12px] text-slate-500">
            Couldn&apos;t load destinations right now.
          </p>
          }
          {!loadingDestinations && !destinationError && topDestinations.length === 0 &&
          <p className="px-1 py-4 text-[12px] text-slate-500">
            No destinations right now.
          </p>
          }
          {topDestinations.map((d) =>
          <button
            key={d.id}
            type="button"
            onClick={() => applyTourDeal(d)}
            className="w-[140px] shrink-0 rounded-ios-lg shadow-ios-sm overflow-hidden text-left relative h-[160px] hover:shadow-ios-md transition-all duration-ios active:scale-[0.98] bg-slate-800">
            {d.image ?
            <img
              src={d.image}
              alt={d.destination}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = '0';
              }} /> :
            null}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))'
              }} />
            <div className="relative z-10 h-full flex flex-col justify-end p-3">
              <p className="text-[15px] font-bold text-white leading-tight line-clamp-2">
                {d.destination}
              </p>
              <p className="text-[12px] font-bold text-white mt-1 tabular-nums">
                {d.price}
              </p>
            </div>
          </button>
          )}
        </div>
      </Section>
      </div>

      <div className="h-6" />
      </div>
    </div>
    {createPortal(
      <AnimatePresence>
      {passengerSheetOpen &&
      <>
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePassengerSheet}
          className="fixed inset-0 z-[80] bg-black/25" />
        
          <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-0 left-0 right-0 z-[81] flex max-h-[min(92dvh,920px)] flex-col overflow-hidden rounded-t-ios-xl glass-sheet">
          
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-gray-300/80" />
            </div>
            <div className="flex items-center justify-between px-5 py-2 shrink-0">
              <h2 className="text-[17px] font-bold text-text-primary">
                {mode === 'bus' || mode === 'train' ? 'Bus passengers' : 'Passengers'}
              </h2>
              <button
              type="button"
              onClick={closePassengerSheet}
              aria-label="Close passengers"
              className="w-9 h-9 rounded-full glass-btn-ghost flex items-center justify-center">
              
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">
              <div className="rounded-2xl border border-teal-200/60 bg-teal-50/40 backdrop-blur-md px-2.5 sm:px-3 py-1 shadow-inner min-w-0 overflow-hidden">
                <PassengerStepper
                label="Adults"
                hint={PAX_AGE_HINTS.Adult}
                value={flightPassengers.adultCount}
                min={1}
                max={MAX_FLIGHT_PASSENGERS}
                onChange={(adultCount) => updatePassengers({ adultCount })} />
              
                <PassengerStepper
                label="Children"
                hint={PAX_AGE_HINTS.Child}
                value={flightPassengers.childrenCount}
                min={0}
                max={MAX_FLIGHT_PASSENGERS - 1}
                onChange={(childrenCount) => updatePassengers({ childrenCount })} />
              
                <PassengerStepper
                label="Infants"
                hint={PAX_AGE_HINTS.Infant}
                value={flightPassengers.infantCount}
                min={0}
                max={Math.min(4, flightPassengers.adultCount)}
                onChange={(infantCount) => updatePassengers({ infantCount })} />

                {mode === 'flights' &&
                <div className="py-3">
                  <p className="text-[14px] font-semibold text-gray-800 mb-2">
                    Cabin class
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {cabinOptionsWithAll.map((option) =>
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        // Tap selected cabin again → back to All.
                        if (
                          flightCabinClass === option.value &&
                          option.value !== CABIN_CLASS_ALL_VALUE
                        ) {
                          onFlightCabinClassChange?.(CABIN_CLASS_ALL_VALUE);
                          return;
                        }
                        // Never persist broken GuestAPI "All" (1).
                        if (option.value === '1') {
                          onFlightCabinClassChange?.(CABIN_CLASS_ALL_VALUE);
                          return;
                        }
                        onFlightCabinClassChange?.(option.value);
                      }}
                      className={`min-h-10 rounded-xl border px-2 text-[12px] font-semibold ${
                        flightCabinClass === option.value ?
                          'border-teal-600 bg-teal-600 text-white' :
                          'border-teal-200 bg-white text-gray-700'
                      }`}>
                      {option.label}
                    </button>
                    )}
                  </div>
                </div>
                }
              </div>
            </div>
            <div className="shrink-0 border-t border-teal-100/70 bg-white/90 px-5 pt-2.5 pb-2">
              <button
              type="button"
              onClick={handlePassengerApply}
              className="ui-btn-primary w-full h-12 rounded-2xl flex items-center justify-center touch-manipulation">
              
                Apply · {passengerSummary}{mode === 'flights' ? ` · ${cabinLabel}` : ''}
              </button>
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>,
      document.body
    )}
    {createPortal(
      <AnimatePresence>
      {guestRoomSheetOpen &&
      <>
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setGuestRoomSheetOpen(false)}
          className="fixed inset-0 z-[80] bg-black/25" />
        
          <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-0 left-0 right-0 z-[81] flex max-h-[min(92dvh,920px)] flex-col overflow-hidden rounded-t-ios-xl glass-sheet">
          
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-gray-300/80" />
            </div>
            <div className="flex items-center justify-between px-5 py-2 shrink-0">
              <h2 className="text-[17px] font-bold text-text-primary">
                {mode === 'holiday' ? 'Travellers' : 'Guests & Rooms'}
              </h2>
              <button
              type="button"
              onClick={() => setGuestRoomSheetOpen(false)}
              aria-label="Close guests and rooms"
              className="w-9 h-9 rounded-full glass-btn-ghost flex items-center justify-center">
              
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">
              <div className="rounded-2xl border border-teal-200/60 bg-teal-50/40 backdrop-blur-md px-2.5 sm:px-3 py-1 shadow-inner min-w-0 overflow-hidden">
                {mode === 'holiday' ?
                <>
                  <PassengerStepper
                  label="Adults"
                  hint="Aged 12+"
                  value={hotelGuests}
                  min={1}
                  max={10}
                  onChange={(v) => onHotelGuestsChange?.(v)} />
                  <PassengerStepper
                  label="Children"
                  hint="Aged 2–11"
                  value={hotelChildren}
                  min={0}
                  max={8}
                  onChange={(v) => onHotelChildrenChange?.(v)} />
                  <PassengerStepper
                  label="Infants"
                  hint="Aged 0–2"
                  value={hotelInfants}
                  min={0}
                  max={Math.min(4, hotelGuests)}
                  onChange={(v) => onHotelInfantsChange?.(v)} />
                </> :
                <>
                <PassengerStepper
                label="Guests"
                hint="Number of guests"
                value={hotelGuests}
                min={1}
                max={10}
                onChange={(v) => onHotelGuestsChange?.(v)} />
              
                <PassengerStepper
                label="Rooms"
                hint="Number of rooms"
                value={hotelRooms}
                min={1}
                max={5}
                onChange={(v) => onHotelRoomsChange?.(v)} />
                </>
                }
              </div>
            </div>
            <div className="shrink-0 border-t border-teal-100/70 bg-white/90 px-5 pt-2.5 pb-2">
              <button
              type="button"
              onClick={() => setGuestRoomSheetOpen(false)}
              className="ui-btn-primary w-full h-12 rounded-2xl flex items-center justify-center touch-manipulation">
              
                {mode === 'holiday' ?
                `Apply · ${hotelGuests} Adult${hotelGuests !== 1 ? 's' : ''}${hotelChildren > 0 ? ` · ${hotelChildren} Child${hotelChildren !== 1 ? 'ren' : ''}` : ''}${hotelInfants > 0 ? ` · ${hotelInfants} Infant${hotelInfants !== 1 ? 's' : ''}` : ''}` :
                `Apply · ${hotelGuests} Guest${hotelGuests !== 1 ? 's' : ''} · ${hotelRooms} Room${hotelRooms !== 1 ? 's' : ''}`}
              </button>
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>,
      document.body
    )}
    {createPortal(
      <AnimatePresence>
        {currencySheetOpen &&
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCurrencySheetOpen(false)}
            className="fixed inset-0 z-[80] bg-black/25" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-[81] flex max-h-[75dvh] flex-col overflow-hidden rounded-t-ios-xl glass-sheet">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-gray-300/80" />
            </div>
            <div className="flex items-center justify-between px-5 py-2">
              <div>
                <h2 className="text-[17px] font-bold text-text-primary">
                  Select currency
                </h2>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Prices will use the live GuestAPI exchange rate
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrencySheetOpen(false)}
                className="w-9 h-9 rounded-full glass-btn-ghost flex items-center justify-center">
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-safe">
              {currencyLoading && currencies.length === 0 &&
              <p className="py-8 text-center text-[13px] text-text-secondary">
                Loading currencies…
              </p>}
              {currencyError &&
              <p className="py-3 text-center text-[12px] text-amber-700">
                {currencyError}
              </p>}
              {currencies.map((currency) =>
              <button
                key={currency.code}
                type="button"
                onClick={() => {
                  onSelectCurrency(currency.code);
                  setCurrencySheetOpen(false);
                }}
                className="w-full min-h-[56px] flex items-center gap-3 border-b text-left"
                style={{ borderColor: KTA.border }}>
                <span
                  className="w-11 text-[13px] font-bold"
                  style={{ color: KTA.blue }}>
                  {currency.code}
                </span>
                <span className="flex-1 text-[14px] font-medium text-text-primary">
                  {currency.name}
                </span>
                {currency.code === currencyCode &&
                <span
                  className="w-5 h-5 rounded-full text-white text-[12px] flex items-center justify-center"
                  style={{ backgroundColor: KTA.green }}>
                  ✓
                </span>}
              </button>)}
            </div>
          </motion.div>
        </>}
      </AnimatePresence>,
      document.body
    )}
    <CalendarSheet
      open={dateSheet !== null}
      title={dateSheetConfig?.title ?? 'Select date'}
      value={dateSheetConfig?.value ?? ''}
      min={dateSheetConfig?.min}
      onClose={() => setDateSheet(null)}
      onSelect={(v) => {
        dateSheetConfig?.onChange?.(v);
        setDateSheet(null);
      }} />
    <WalletTransactionsSheet
      open={walletSheetOpen}
      onClose={() => setWalletSheetOpen(false)}
      userId={walletUserId ?? user?.userId ?? traveller.session?.userId}
      userTypeId={walletUserTypeId ?? user?.userTypeId ?? traveller.session?.userTypeId ?? 5}
      currencyCode={currencyCode}
      currencyRate={currencyCode === 'ETB' ? 1 : currencyRate} />
    </>);
}
