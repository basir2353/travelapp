import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Pencil,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  Plane,
  Bus,
  TrainFront,
  MapPin,
  ArrowLeftRight,
  Share2,
  Info,
  Star,
  Ticket,
  X,
  Download,
  Luggage,
  ShieldCheck,
  Tag,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Plus,
  Trash2,
  Wallet,
  CreditCard,
  Landmark,
  Smartphone,
  Globe,
  ChevronRight,
  CheckCircle2,
  Eye,
  Send,
  Calendar,
  FileText,
  Printer,
  MessageSquare,
  Clock,
  Timer,
  Coffee,
  PlayCircle,
  Car,
  Building2,
  Map,
  Award,
  Gift,
  Lock,
  MessageCircle,
  Video,
  Sparkles,
  Percent,
  Banknote,
  LifeBuoy,
  Shield,
  Utensils,
  Armchair,
  Video as VideoIcon,
  BadgeCheck,
  Bookmark,
  CloudSun,
  QrCode,
  Barcode,
  Hotel as HotelIcon,
  Play,
  Flame,
  ExternalLink,
  HeadphonesIcon,
  ArrowRight,
  Image as ImageIcon,
  Wifi,
  Waves,
  Dumbbell,
  UtensilsCrossed,
  Heart,
  Users,
  Edit2,
  Snowflake,
  BedDouble,
  SlidersHorizontal,
  Hash,
  Home } from
'lucide-react';
import {
  KTA,
  Mode,
  TRIPS,
  CLASS_OPTIONS,
  BUS_OPERATORS,
  Trip,
  Hotel,
  CarRental,
  cur } from
'./ethioTravelData';
import {
  FiltersSheet,
  HotelFiltersSheet,
  CarFiltersSheet,
  BusFiltersSheet,
  DiscountSheet,
  TicketDetailsSheet,
  TicketPdfSheet,
  BoardingPassSheet,
  JourneySheet,
  FlightHotelUpsellSheet,
  applyFlightListFilters,
  applyHotelListFilters,
  applyCarListFilters,
  DEFAULT_FLIGHT_FILTERS,
  DEFAULT_HOTEL_FILTERS,
  DEFAULT_CAR_FILTERS,
  type FlightListFilters,
  type HotelListFilters,
  type CarListFilters,
  type BusListFiltersState } from
'./EthioSheets';
import {
  applyBusListFilters,
  DEFAULT_BUS_FILTERS,
  BUS_BOARDING_CHIPS,
  BUS_DROPPING_CHIPS,
  uniqueBusOperators,
  type BusListFilters
} from './busFilters';
import { buildTicketPdf, buildTicketPdfPreview, revokeTicketPdfUrl, type TicketPdfPreview } from '../../utils/ticketPdf';
import { downloadObjectUrl, downloadPdfFile } from '../../utils/bookingReceiptPdf';
import {
  CalendarSheet,
  formatCalendarDateLabel,
  toCalendarInputValue
} from './CalendarSheet';
import { DocumentTypeSheet } from './DocumentTypeSheet';
import { GenderSheet } from './GenderSheet';
import { CountryDialPhoneField } from '../CountryDialPhoneField';
import { findDialOption } from '../../data/dialCodes';
import { AirlineLogo } from './AirlineLogo';
import { ApiCountrySelect } from '../ApiCountrySelect';
import { SearchLoading } from './FlightSearchLoading';
import { HolidayToursResults } from './HolidayToursResults';
import { HolidayTourDetails } from './HolidayTourDetails';
import { HolidayChooseTickets } from './HolidayChooseTickets';
import { HolidayTravellerDetails, isHolidayTravellerComplete } from './HolidayTravellerDetails';
import { HolidayReviewPay } from './HolidayReviewPay';
import { HolidayPaymentMethod } from './HolidayPaymentMethod';
import {
  TravelErrorState,
  formatTravelApiError,
  showTravelError
} from './TravelErrorState';
import { HolidayTicketConfirmation } from './HolidayTicketConfirmation';
import { HOLIDAY_BOOKING_FEE } from './holidayCheckoutUtils';
import { useTravellerWallet } from '../../hooks/useTravellerWallet';
import {
  formatWalletCreditLabel,
  isWalletBalanceSufficient,
  walletAmountInDisplayCurrency
} from '../../utils/walletCredit';
import {
  busListFareTotal,
  busFareLikelyUnconvertedEtb,
  toBusDisplayAmount,
  resolveBusTicketFare,
  coalesceBusFare
} from '../../utils/busDisplayFare';
import type { PaymentMethodId } from '../PaymentMethodPickerSheet';
import {
  formatBusTravelDateLabel,
  parseBusTravelDate,
  formatFlightApiDate,
  toIsoTravelDate,
  minPassportExpiryIso,
  isPassportExpiryValidForTravel,
  buildJsonSelectBus,
  buildJsonSelectBusForBooking,
  buildJsonSelectSeat,
  bus3SelectBus,
  busBooking,
  getBusBoarding,
  getBusDropping,
  resolveBusNumericId,
  paymentTypeKind,
  paymentTypeSubtitle,
  isInternationalPaymentType,
  parsePaymentPercent,
  paymentConvenienceFee,
  paymentTotalWithFee,
  type ApiPaymentType,
  findBusApiSeat,
  cabinSeatToApiKey,
  chunkBusSeatRows,
  isOccupiedBusSeat,
  buildBusBookingJson,
  buildBusContactDetailJson,
  buildBusReqPassengerJson,
  buildJsonSelectCar,
  collectBookingRows,
  resolveBookingRows,
  resolveBookingTripType,
  serializeBookingRows,
  buildBookingRowAttempts,
  parseExpectedBookingRowCount,
  collectBookingRowsForExpectedCount,
  isBookingPayloadReady,
  isSubBookingRow,
  alignSegmentRowsToMain,
  isNdcContentSource,
  hasBrokenNdcFareRules,
  sanitizeBookingRowsForSave,
  padBookingRowsToCount,
  resolveBookableNdcMain,
  collectBookingRowsForApi,
  ndcExpectedOnewayRowCount,
  buildSaveBookingPayload,
  parseMoneyAmount,
  getBookingDetails,
  saveBooking,
  rentalDayCount,
  formatCarDateShort,
  normalizeCarLocation,
  isCarDemoItem,
  CAR_SAMPLE_BOOKING_NOTICE,
  buildSelectHotelJson,
  mergeHotelWithDetails,
  buildJsonSelectRoom,
  buildBookingJsonFromPricing,
  buildBookingJsonFromCarPricing,
  hotel4Booking,
  carBooking,
  tourBooking,
  mapTourBookingGender,
  extractTourDestinationName,
  stripCityLabel,
  estimateCarPricingFromRental,
  estimateCarPricingForRental,
  CAR_SELECT_DEFAULT_MARKUP,
  buildPaxTypeList,
  paxTypeLabel,
  totalPassengerCount,
  isDobValidForPaxType,
  dobValidationMessage,
  dobBoundsForPaxType,
  PAX_AGE_HINTS,
  type PaxType } from
'../../services/guestApi';
import { useBusSeatLayout } from '../../hooks/useBusSeatLayout';
import { useCarSelection } from '../../hooks/useCarSelection';
import { useFlightBooking } from '../../hooks/useFlightBooking';
import { useHotelDetails } from '../../hooks/useHotelDetails';
import { useHotelRoomDetails } from '../../hooks/useHotelRoomDetails';
import { useTourDetails } from '../../hooks/useTourDetails';
import type { TourModality, BusSeatInfo } from '../../services/guestApi';
import { TourImageGallery } from './TourImages';
import {
  isRoundwayFlightItem,
  mapRoundwayReturnTrip,
  formatCheckedBaggage,
  formatCabinBaggage,
  airportCodeLabel
} from '../../services/guestApi/mapFlightToTrip';
import type { FlightListItem } from '../../services/guestApi/mapFlightToTrip';
import { flightFareHeaderChips, carrierLogoUrl } from '../../services/guestApi/mapFlightToTrip';
import {
  buildFlightCabinOptions,
  extractMiniFareRules,
  formatBookingRouteLabel,
  type FlightBookingDetail
} from '../../services/guestApi';

const FARE_DAY_COUNT = 9;
const FARE_DAY_VISIBLE = 3;
const FARE_DAY_CENTER = Math.floor(FARE_DAY_COUNT / 2);

function apiTypeToPayOption(
  type: ApiPaymentType,
  walletSub: string
) {
  const kind = paymentTypeKind(type);
  const isWallet = kind === 'wallet';
  return {
    id: isWallet ? 'mkash' : `api:${type.Id}`,
    name: isWallet ? 'mKash Wallet' : type.PaymentType,
    sub: isWallet ? walletSub : paymentTypeSubtitle(type),
    icon:
      kind === 'wallet' ?
      Wallet :
      kind === 'bank' ?
      Landmark :
      kind === 'upi' ?
      Smartphone :
      kind === 'card' ?
      CreditCard :
      Banknote,
    tint:
      isWallet ?
      '#CCFBF1' :
      kind === 'card' ?
      '#e0e7ff' :
      kind === 'bank' ?
      '#f1f5f9' :
      '#fef3c7',
    color:
      isWallet ?
      KTA.green :
      kind === 'card' ?
      '#0F766E' :
      kind === 'bank' ?
      '#475569' :
      '#d97706',
    badge: isWallet ? 'Recommended' : type.Type || undefined
  };
}

function parseFlightDepartBase(label: string): Date {
  if (label.trim()) {
    const withYear = `${label.replace(',', '')} ${new Date().getFullYear()}`;
    const parsed = new Date(withYear);
    if (!Number.isNaN(parsed.getTime())) {
      parsed.setHours(0, 0, 0, 0);
      return parsed;
    }
  }
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return date;
}

/** Fare strip days — center day uses live lowest fare; others show “—” until searched. */
function buildFareDays(liveLowestFare: number | null, departLabel: string) {
  const baseDate = parseFlightDepartBase(departLabel);
  return Array.from({ length: FARE_DAY_COUNT }, (_, i) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + (i - FARE_DAY_CENTER));
    const isSelectedDay = i === FARE_DAY_CENTER;
    return {
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      date,
      wd: date.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
      d: String(date.getDate()),
      fare: isSelectedDay && liveLowestFare != null && liveLowestFare > 0 ?
      Math.round(liveLowestFare) :
      null as number | null,
      isLive: isSelectedDay && liveLowestFare != null && liveLowestFare > 0
    };
  });
}

function FaresByDayCard({
  days,
  selectedIdx,
  onSelect,
  currencyCode = 'ETB'
}: {
  days: Array<{
    key: string;
    date?: Date;
    wd: string;
    d: string;
    fare: number | null;
    isLive?: boolean;
  }>;
  selectedIdx: number;
  onSelect: (index: number) => void;
  currencyCode?: string;
}) {
  const liveFares = days.map((x) => x.fare).filter((n): n is number => n != null && n > 0);
  const cheapest = liveFares.length ? Math.min(...liveFares) : null;
  const maxStart = Math.max(0, days.length - FARE_DAY_VISIBLE);
  const [windowStart, setWindowStart] = useState(
    Math.min(Math.max(0, selectedIdx - 1), maxStart)
  );
  const dragStartXRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const suppressClickRef = useRef(false);
  useEffect(() => {
    setWindowStart((prev) => {
      if (selectedIdx < prev) return Math.max(0, selectedIdx);
      if (selectedIdx > prev + FARE_DAY_VISIBLE - 1) {
        return Math.min(maxStart, selectedIdx - FARE_DAY_VISIBLE + 1);
      }
      return prev;
    });
  }, [maxStart, selectedIdx]);
  const moveWindow = (delta: number) => {
    setWindowStart((prev) => Math.max(0, Math.min(maxStart, prev + delta)));
  };
  const handleSelect = (globalIdx: number, localIdx: number) => {
    onSelect(globalIdx);
    setWindowStart((prev) => {
      if (localIdx === 0 && prev > 0) return prev - 1;
      if (localIdx === FARE_DAY_VISIBLE - 1 && globalIdx < days.length - 1) {
        return Math.min(maxStart, prev + 1);
      }
      if (globalIdx < prev) return Math.max(0, globalIdx);
      if (globalIdx > prev + FARE_DAY_VISIBLE - 1) {
        return Math.min(maxStart, globalIdx - FARE_DAY_VISIBLE + 1);
      }
      return prev;
    });
  };
  const visibleDays = days.slice(windowStart, windowStart + FARE_DAY_VISIBLE);
  return (
    <div className="mx-4 sm:mx-[18px] mt-4 mb-2 rounded-2xl border border-white/85 bg-white/70 backdrop-blur-md shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Calendar
            className="w-4 h-4"
            style={{
              color: KTA.textSecondary
            }} />
          <span
            className="text-[14px] font-bold"
            style={{
              color: KTA.textPrimary
            }}>
            Fares by day
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: KTA.green
            }} />
          <span
            className="text-[11px] font-semibold"
            style={{
              color: KTA.green
            }}>
            Lowest fare
          </span>
        </div>
      </div>
      <div
        className="grid grid-cols-3 gap-2 px-2 py-3 cursor-grab active:cursor-grabbing"
        onPointerDown={(event) => {
          dragStartXRef.current = event.clientX;
          didDragRef.current = false;
        }}
        onPointerMove={(event) => {
          if (dragStartXRef.current === null) return;
          if (Math.abs(event.clientX - dragStartXRef.current) > 40) {
            didDragRef.current = true;
          }
        }}
        onPointerUp={(event) => {
          if (dragStartXRef.current === null) return;
          const deltaX = event.clientX - dragStartXRef.current;
          dragStartXRef.current = null;
          if (!didDragRef.current) return;
          suppressClickRef.current = true;
          if (deltaX < -40) moveWindow(1);
          else if (deltaX > 40) moveWindow(-1);
          didDragRef.current = false;
        }}
        onPointerCancel={() => {
          dragStartXRef.current = null;
          didDragRef.current = false;
        }}>
        {visibleDays.map((day, i) => {
          const globalIdx = windowStart + i;
          const active = globalIdx === selectedIdx;
          const isCheapest =
          day.fare != null && cheapest != null && day.fare === cheapest;
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => {
                if (suppressClickRef.current) {
                  suppressClickRef.current = false;
                  return;
                }
                handleSelect(globalIdx, i);
              }}
              className={`relative rounded-2xl py-3 px-1 flex flex-col items-center touch-manipulation transition-colors ${
              active ?
              'bg-teal-600 shadow-lg shadow-teal-600/35' :
              ''}`
              }>
              
              {isCheapest &&
              <span
                className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: active ? '#fff' : KTA.green
                }} />
              }
              <span
                className={`text-[11px] font-semibold uppercase tracking-wide ${
                active ? 'text-white/90' : 'text-slate-400'}`
                }>
                
                {day.wd}
              </span>
              <span
                className={`text-[22px] font-bold leading-tight my-0.5 ${
                active ? 'text-white' : 'text-slate-900'}`
                }>
                
                {day.d}
              </span>
              <span
                className={`text-[10px] sm:text-[11px] font-semibold tabular-nums whitespace-nowrap ${
                active ? 'text-white/95' : isCheapest ? '' : 'text-slate-400'}`
                }
                style={
                !active && isCheapest ?
                { color: KTA.green } :
                undefined
                }>
                
                {day.fare != null ? cur(day.fare, currencyCode) : 'Tap'}
              </span>
            </button>);

        })}
      </div>
    </div>);

}

type Screen =
'results' |
'return' |
'class' |
'tickets' |
'seats' |
'points' |
'passenger' |
'payment' |
'pay-method' |
'ticket';
const modeIcon = (m: Mode) =>
m === 'flights' ?
Plane :
m === 'bus' ?
Bus :
m === 'train' ?
TrainFront :
m === 'hotels' ?
Plane :
Bus; // Fallbacks for hotels/cars if used
type TripType = 'oneway' | 'round' | 'multi';
type BusListState = {
  trips: Trip[];
  loading: boolean;
  error: string | null;
};
type FlightListState = {
  trips: Trip[];
  raw: import('../../services/guestApi/mapFlightToTrip').FlightListItem[];
  loading: boolean;
  error: string | null;
  apiMessage: string | null;
};
type CarListState = {
  cars: CarRental[];
  loading: boolean;
  error: string | null;
  apiMessage: string | null;
  fromFallback?: boolean;
};
type HotelListState = {
  hotels: Hotel[];
  loading: boolean;
  error: string | null;
  apiMessage: string | null;
};
type TourListState = {
  tours: import('../../services/guestApi').TourActivity[];
  loading: boolean;
  error: string | null;
  apiMessage: string | null;
};
interface Props {
  mode: Mode;
  from: string;
  to: string;
  tripType?: TripType;
  legCount?: number;
  busOriginId?: string;
  busDestinationId?: string;
  travelDate?: string;
  /** Round-trip return date (DD/MM/YYYY) — used for passport expiry rules. */
  returnTravelDate?: string;
  busList?: BusListState;
  flightList?: FlightListState;
  hotelList?: HotelListState;
  tourList?: TourListState;
  carList?: CarListState;
  carPickupDate?: string;
  carReturnDate?: string;
  carPickupTime?: string;
  carReturnTime?: string;
  carCurrencyCode?: string;
  carCurrencyValue?: number;
  /** Active display/API currency chosen on home (or source ETB when switch off). */
  currencyCode?: string;
  currencyValue?: number;
  hotelCheckInDate?: string;
  hotelCheckOutDate?: string;
  hotelCheckInDateLabel?: string;
  hotelCheckOutDateLabel?: string;
  hotelRoomCount?: number;
  hotelAdultCount?: number;
  hotelChildCount?: number;
  hotelInfantCount?: number;
  flightAdultCount?: number;
  flightChildrenCount?: number;
  flightInfantCount?: number;
  flightDepartDateLabel?: string;
  flightReturnDateLabel?: string;
  flightPassengerSummary?: string;
  flightCabinClassName?: string;
  onFlightDepartDateChange?: (date: Date) => void;
  onExit: () => void;
  /** Fix mistaken Los Angeles (LAX) → Lagos (LOS) and re-search. */
  onReplaceFlightRoute?: (origin: string, destination: string) => void;
  onBookingComplete?: () => void;
  onPay: (total: number, onDone: () => void, bookingRef?: string) => void;
  onChangePayment: (total: number) => void;
  paymentLabel: string;
  /** Parent payment picker method — used to gate SaveBooking on wallet balance. */
  paymentMethod?: PaymentMethodId;
  apiPaymentTypes?: ApiPaymentType[];
  apiPaymentTypeId?: number;
  /** Opens hotel search for a destination while mid-flight booking. */
  onBookHotelAtDestination?: (params: {
    destination: string;
    guests: number;
    rooms: number;
  }) => void;
  /** Changes when a hotel upsell closes so the previous flight step is restored. */
  flightHotelReturnToken?: number;
  /** Registers Android hardware Back → same as funnels header back. */
  hardwareBackRef?: React.MutableRefObject<(() => void) | null>;
}
export function EthioFunnel({
  mode,
  from,
  to,
  tripType = 'round',
  legCount = 1,
  busOriginId,
  busDestinationId,
  travelDate,
  returnTravelDate,
  busList = { trips: [], loading: false, error: null },
  flightList = { trips: [], raw: [], loading: false, error: null, apiMessage: null },
  hotelList = { hotels: [], loading: false, error: null, apiMessage: null },
  tourList = { tours: [], loading: false, error: null, apiMessage: null },
  carList = { cars: [], loading: false, error: null, apiMessage: null, fromFallback: false },
  carPickupDate,
  carReturnDate,
  carPickupTime = '06:00',
  carReturnTime = '18:00',
  carCurrencyCode = 'AED',
  carCurrencyValue = 1,
  currencyCode = 'ETB',
  currencyValue = 1,
  hotelCheckInDate = '',
  hotelCheckOutDate = '',
  hotelCheckInDateLabel = '',
  hotelCheckOutDateLabel = '',
  hotelRoomCount = 1,
  hotelAdultCount = 1,
  hotelChildCount = 0,
  hotelInfantCount = 0,
  flightAdultCount = 1,
  flightChildrenCount = 0,
  flightInfantCount = 0,
  flightDepartDateLabel = '',
  flightReturnDateLabel,
  flightPassengerSummary = '1 Traveller',
  flightCabinClassName = 'Economy',
  onFlightDepartDateChange,
  onExit,
  onReplaceFlightRoute,
  onBookingComplete,
  onPay,
  onChangePayment,
  paymentLabel,
  paymentMethod = 'wallet',
  apiPaymentTypes = [],
  apiPaymentTypeId,
  onBookHotelAtDestination,
  flightHotelReturnToken = 0,
  hardwareBackRef
}: Props) {
  const displayCurrency = currencyCode;
  const fmtMoney = (n: number) => cur(n, displayCurrency);
  const pauseWalletPoll =
    (mode === 'flights' && flightList.loading) ||
    (mode === 'bus' && busList.loading) ||
    (mode === 'hotels' && hotelList.loading);
  const {
    amountEtb: walletAmountEtb,
    label: walletCreditLabel,
    refreshDashboard: refreshWallet
  } = useTravellerWallet({
    currencyCode: displayCurrency,
    currencyRate: displayCurrency === 'ETB' ? 1 : currencyValue,
    pollMs: pauseWalletPoll ? 0 : 30_000
  });
  const walletDisplayAmount = walletAmountInDisplayCurrency(
    walletAmountEtb,
    displayCurrency,
    currencyValue
  );
  const apiPayLists = useMemo(() => {
    if (!apiPaymentTypes.length) return null;
    const walletSub = `Balance ${walletCreditLabel || fmtMoney(walletDisplayAmount)}`;
    const local = apiPaymentTypes.
    filter((type) => !isInternationalPaymentType(type)).
    map((type) => apiTypeToPayOption(type, walletSub));
    const intl = apiPaymentTypes.
    filter((type) => isInternationalPaymentType(type)).
    map((type) => apiTypeToPayOption(type, walletSub));
    return {
      local: local.length > 0 ? local : apiPaymentTypes.map((type) =>
        apiTypeToPayOption(type, walletSub)
      ),
      intl
    };
  }, [apiPaymentTypes, walletCreditLabel, walletDisplayAmount]);
  const isRound = tripType === 'round';
  const isMulti = tripType === 'multi';
  const [screen, setScreen] = useState<Screen>('results');
  const scrollMainRef = useRef<HTMLDivElement>(null);
  const contactDetailsRef = useRef<HTMLDivElement>(null);
  const travellerSectionRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState('Departure time');
  useEffect(() => {
    if (mode === 'hotels') setSort('Recommended');
    else if (mode === 'minibus') setSort('Recommended');
    else if (mode === 'flights' || mode === 'bus' || mode === 'train') {
      setSort('Departure time');
    }
  }, [mode]);
  const [outbound, setOutbound] = useState<Trip | null>(null);
  const [returnTrip, setReturnTrip] = useState<Trip | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedCar, setSelectedCar] = useState<CarRental | null>(null);
  const [selectedTour, setSelectedTour] = useState<
  import('../../services/guestApi').TourActivity | null
  >(null);
  const [selectedTourModality, setSelectedTourModality] =
  useState<TourModality | null>(null);
  const [tourDetailsFetchToken, setTourDetailsFetchToken] = useState(0);
  const [expandOutbound, setExpandOutbound] = useState(false);
  const [classId, setClassId] = useState('');
  const [flightCheckoutStep, setFlightCheckoutStep] = useState<
  'cabin' | 'travellers'
  >('cabin');
  const [selectedSeat, setSelectedSeat] = useState<string>('12A');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedBoardingPoint, setSelectedBoardingPoint] = useState<
    string | null>(
    null);
  const [selectedDroppingPoint, setSelectedDroppingPoint] = useState<
    string | null>(
    null);
  type BusPoint = {
    id: string;
    name: string;
    time: string;
    distance?: string;
    date?: string;
  };
  const [boardingPoints, setBoardingPoints] = useState<BusPoint[]>([]);
  const [droppingPoints, setDroppingPoints] = useState<BusPoint[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsStep, setPointsStep] = useState<'boarding' | 'dropping'>(
    'boarding'
  );
  const [busConfirmedPrice, setBusConfirmedPrice] = useState<number | null>(null);
  const [busSelectBusJson, setBusSelectBusJson] = useState('');
  const [busSelectSeatJson, setBusSelectSeatJson] = useState('');
  const [busBookingId, setBusBookingId] = useState<string | null>(null);
  useEffect(() => {
    if (mode !== 'bus' || !outbound || screen !== 'points') return;

    const busId = resolveBusNumericId(outbound);
    const fallbackBoarding: BusPoint[] = outbound.fromCity ?
    [{ id: 'from', name: outbound.fromCity, time: outbound.departTime || '' }] :
    [];
    const fallbackDropping: BusPoint[] = outbound.toCity ?
    [{ id: 'to', name: outbound.toCity, time: outbound.arriveTime || '' }] :
    [];

    if (!busId) {
      setBoardingPoints(fallbackBoarding);
      setDroppingPoints(fallbackDropping);
      setSelectedBoardingPoint(fallbackBoarding[0]?.id ?? null);
      setSelectedDroppingPoint(fallbackDropping[0]?.id ?? null);
      setPointsLoading(false);
      return;
    }

    let cancelled = false;
    setPointsLoading(true);
    Promise.allSettled([
      getBusBoarding(busId),
      getBusDropping(busId)
    ]).then(([boarding, dropping]) => {
      if (cancelled) return;
      const apiBoarding =
        boarding.status === 'fulfilled' ? boarding.value : [];
      const apiDropping =
        dropping.status === 'fulfilled' ? dropping.value : [];
      const nextBoarding = apiBoarding.length > 0 ? apiBoarding : fallbackBoarding;
      const nextDropping = apiDropping.length > 0 ? apiDropping : fallbackDropping;
      setBoardingPoints(nextBoarding);
      setDroppingPoints(nextDropping);
      setSelectedBoardingPoint(nextBoarding[0]?.id ?? null);
      setSelectedDroppingPoint(nextDropping[0]?.id ?? null);
      setPointsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [mode, outbound, screen]);
  interface SeniorPref {
    isSenior: boolean;
    age: string;
    idNumber: string;
  }
  const [seniorPrefs, setSeniorPrefs] = useState<Record<string, SeniorPref>>({});
  const setSeniorPref = (seatId: string, patch: Partial<SeniorPref>) =>
  setSeniorPrefs((prev) => ({
    ...prev,
    [seatId]: {
      isSenior: false,
      age: '',
      idNumber: '',
      ...prev[seatId],
      ...patch
    }
  }));
  const verifiedSeniors = selectedSeats.filter((s) => {
    const p = seniorPrefs[s];
    return p?.isSenior && Number(p.age) >= 60 && p.idNumber.trim().length >= 4;
  });
  const seniorDiscount = verifiedSeniors.length * 80;
  const [cancelAny, setCancelAny] = useState(false);
  const [showRoomSelection, setShowRoomSelection] = useState(false);
  const [readMoreAbout, setReadMoreAbout] = useState(false);
  const [mealPlans, setMealPlans] = useState<Record<string, string>>({});
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const [busSeatFetchToken, setBusSeatFetchToken] = useState(0);
  const [carSelectFetchToken, setCarSelectFetchToken] = useState(0);
  const [hotelDetailsFetchToken, setHotelDetailsFetchToken] = useState(0);
  const [hotelRoomFetchToken, setHotelRoomFetchToken] = useState(0);
  const [jsonSelectRoom, setJsonSelectRoom] = useState('');
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const hotelDetailsMergedRef = useRef('');
  const hotelRoomReservedRef = useRef('');
  const [flightBookingFetchToken, setFlightBookingFetchToken] = useState(0);
  const [flightBookingRows, setFlightBookingRows] = useState<FlightListItem[]>([]);
  const flightBookingKeyRef = useRef('');
  const flightSearchRawRef = useRef<FlightListItem[]>([]);
  /** Set synchronously in confirmFlightBooking so the wallet-pay handler can
   * read it right away — flightPnr state wouldn't have re-rendered yet. */
  const lastFlightBookingRefForDebit = useRef<string>('');
  const [flightSearchCatalog, setFlightSearchCatalog] = useState<FlightListItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [showBoardingPass, setShowBoardingPass] = useState(false);
  const [showTicketPdf, setShowTicketPdf] = useState(false);
  const [ticketPdfUrl, setTicketPdfUrl] = useState<string | null>(null);
  const [ticketPdfBlob, setTicketPdfBlob] = useState<Blob | null>(null);
  const [ticketPdfPreview, setTicketPdfPreview] = useState<TicketPdfPreview | null>(
    null
  );
  const [showJourney, setShowJourney] = useState(false);
  const [showFlightHotelUpsell, setShowFlightHotelUpsell] = useState(false);
  const [flightHotelDestination, setFlightHotelDestination] = useState('');
  const flightHotelResumeRef = useRef<{
    screen: Screen;
    showJourney: boolean;
  } | null>(null);
  useEffect(() => {
    if (mode === 'hotels' && hotelList.loading) {
      setScreen('results');
      setShowJourney(false);
      setShowFlightHotelUpsell(false);
    }
  }, [mode, hotelList.loading]);
  useEffect(() => {
    if (mode !== 'flights' || flightHotelReturnToken === 0) return;
    const resume = flightHotelResumeRef.current;
    if (!resume) return;
    setScreen(resume.screen);
    setShowJourney(resume.showJourney);
    flightHotelResumeRef.current = null;
  }, [flightHotelReturnToken, mode]);
  const [journeyTrip, setJourneyTrip] = useState<Trip | null>(null);
  const [flightDateIdx, setFlightDateIdx] = useState(FARE_DAY_CENTER);
  const [emiOn, setEmiOn] = useState(false);
  const [flightFilters, setFlightFilters] = useState<FlightListFilters>(
    DEFAULT_FLIGHT_FILTERS
  );
  const [hotelFilters, setHotelFilters] = useState<HotelListFilters>(
    DEFAULT_HOTEL_FILTERS
  );
  const [carFilters, setCarFilters] = useState<CarListFilters>(
    DEFAULT_CAR_FILTERS
  );
  const [busFilters, setBusFilters] = useState<BusListFilters>(DEFAULT_BUS_FILTERS);
  const nonStopOnly = flightFilters.stops === 'direct';
  const hasActiveListFilters =
    mode === 'flights' && (
      flightFilters.stops !== 'any' ||
      flightFilters.maxPrice != null ||
      flightFilters.maxDurationMins != null ||
      flightFilters.fareType !== 'any' ||
      (flightFilters.airlines?.length ?? 0) > 0 ||
      (flightFilters.departTimes?.length ?? 0) > 0 ||
      (flightFilters.arriveTimes?.length ?? 0) > 0
    ) ||
    mode === 'hotels' && (
      hotelFilters.minStars !== 'any' || hotelFilters.maxPrice != null
    ) ||
    mode === 'minibus' && (
      carFilters.transmission !== 'any' ||
      carFilters.minSeats !== 'any' ||
      carFilters.maxPrice != null
    );
  const [searchMinAnimDone, setSearchMinAnimDone] = useState(false);
  useEffect(() => {
    if (screen !== 'results') {
      setSearchMinAnimDone(true);
      return;
    }
    // Flights: show API results as soon as they arrive (tiny settle only).
    // Other modes keep a short branded loader so the transition does not flash.
    const minMs =
      mode === 'flights' ? 120 :
      mode === 'bus' || mode === 'train' ? 400 :
      600;
    setSearchMinAnimDone(false);
    const timer = window.setTimeout(() => setSearchMinAnimDone(true), minMs);
    return () => window.clearTimeout(timer);
  }, [mode, screen]);
  const resultsListLoading =
  mode === 'flights' ? flightList.loading :
  mode === 'bus' ? busList.loading :
  mode === 'hotels' ? hotelList.loading :
  mode === 'holiday' ? tourList.loading :
  mode === 'minibus' ? carList.loading :
  false;
  // Holiday results manage their own skeleton — never block on the shared
  // SearchLoading gate (it can stick if a TourGetList race leaves loading true).
  // Flights: never wait on the min-anim once the list has data.
  const showSearchLoading =
  screen === 'results' &&
  mode !== 'holiday' &&
  (
    mode === 'flights' ?
      flightList.loading && flightList.trips.length === 0 :
      resultsListLoading || !searchMinAnimDone
  );
  const [bookingId] = useState(
    `#BKG${Math.floor(10000000 + Math.random() * 89999999)}`
  );
  const [flightPnr, setFlightPnr] = useState<string | null>(null);
  const [hotelBookingId, setHotelBookingId] = useState<string | null>(null);
  const [carBookingId, setCarBookingId] = useState<string | null>(null);
  const [tourBookingId, setTourBookingId] = useState<string | null>(null);
  const [confirmedHotelSelectRoomJson, setConfirmedHotelSelectRoomJson] =
  useState('');
  const [confirmedHotelBookingJson, setConfirmedHotelBookingJson] = useState('');
  const [confirmedCarBookingJson, setConfirmedCarBookingJson] = useState('');
  const carSelectConfirmedRef = useRef('');
  const [saveBookingLoading, setSaveBookingLoading] = useState(false);
  const [saveBookingError, setSaveBookingError] = useState<string | null>(null);
  // New Flight Checkout States
  const [expandFarePolicy, setExpandFarePolicy] = useState(false);
  const [expandBaggage, setExpandBaggage] = useState(false);
  const [insurance, setInsurance] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(false);
  const [roomCount, setRoomCount] = useState(hotelRoomCount);
  interface TravellerInfo {
    paxType: PaxType;
    name: string;
    gender: string;
    dob: string;
    nationality: string;
    country?: string;
    documentType: string;
    passport: string;
    passportIssueDate: string;
    passportExpiry: string;
    email?: string;
    title?: string;
    mobile?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    stayInLoop?: boolean;
  }
  const emptyTraveller = (paxType: PaxType = 'Adult'): TravellerInfo => ({
    paxType,
    name: '',
    gender: '',
    dob: '',
    nationality: '',
    country: '',
    documentType: 'Passport',
    passport: '',
    passportIssueDate: '',
    passportExpiry: '',
    title:
      paxType === 'Adult' ? 'Mr' :
      paxType === 'Child' ? 'Ms' :
      'Mstr',
    stayInLoop: true
  });
  const holidayTravellerCounts = {
    adultCount: Math.max(1, hotelAdultCount || 1),
    childrenCount: Math.max(0, hotelChildCount || 0),
    infantCount: Math.max(0, hotelInfantCount || 0)
  };
  const isPassportIssueDateValid = (issueDate: string): boolean => {
    const issue = issueDate?.trim();
    if (!issue) return false;
    const today = toCalendarInputValue(new Date());
    return issue <= today;
  };
  /** Last day of the trip (return / checkout / travel date) as YYYY-MM-DD. */
  const passportTravelEndIso = (() => {
    if (mode === 'flights') {
      const returnPayload = returnTrip?.apiPayload as
        | { ArrivalDate?: string; DepartureDate?: string }
        | undefined;
      const outPayload = outbound?.apiPayload as
        | { ArrivalDate?: string; DepartureDate?: string }
        | undefined;
      const returnIso =
        toIsoTravelDate(returnPayload?.ArrivalDate) ||
        toIsoTravelDate(returnPayload?.DepartureDate) ||
        toIsoTravelDate(returnTravelDate) ||
        '';
      if ((isRound || returnTrip) && returnIso) return returnIso;
      return (
        toIsoTravelDate(outPayload?.ArrivalDate) ||
        toIsoTravelDate(outPayload?.DepartureDate) ||
        toIsoTravelDate(travelDate) ||
        ''
      );
    }
    if (mode === 'bus' || mode === 'train') {
      return toIsoTravelDate(travelDate);
    }
    if (mode === 'hotels' || mode === 'holiday') {
      return (
        toIsoTravelDate(hotelCheckOutDate) ||
        toIsoTravelDate(hotelCheckInDate) ||
        ''
      );
    }
    if (mode === 'minibus') {
      return (
        toIsoTravelDate(carReturnDate) || toIsoTravelDate(carPickupDate) || ''
      );
    }
    return toIsoTravelDate(travelDate);
  })();
  const passportMinExpiryIso =
    minPassportExpiryIso(passportTravelEndIso) ||
    toCalendarInputValue(new Date());
  const isPassportExpiryDateValid = (
    expiryDate: string,
    issueDate?: string
  ): boolean =>
    isPassportExpiryValidForTravel(
      expiryDate,
      passportTravelEndIso,
      issueDate
    );
  const passportExpiryHint = passportTravelEndIso ?
    `Passport must expire on or after ${formatCalendarDateLabel(passportMinExpiryIso, passportMinExpiryIso)} (later than your trip end date — not before).` :
    'Expiry must be today or a future date.';
  const isTravellerDetailsComplete = (tr: TravellerInfo): boolean =>
  !!(
    tr.firstName?.trim() &&
    tr.lastName?.trim() &&
    tr.title?.trim() &&
    tr.gender?.trim() &&
    tr.dob?.trim() &&
    isDobValidForPaxType(tr.dob, tr.paxType) &&
    tr.nationality?.trim() &&
    tr.documentType?.trim() &&
    tr.passport?.trim() &&
    isPassportIssueDateValid(tr.passportIssueDate) &&
    isPassportExpiryDateValid(tr.passportExpiry, tr.passportIssueDate)
  );
  type TravellerFieldKey =
  | 'title'
  | 'firstName'
  | 'lastName'
  | 'gender'
  | 'dob'
  | 'nationality'
  | 'documentType'
  | 'passport'
  | 'passportIssueDate'
  | 'passportExpiry';
  type ContactFieldKey =
  'email' |
  'phone' |
  'city' |
  'address' |
  'country' |
  'zipCode';
  const getTravellerMissingFields = (tr: TravellerInfo): TravellerFieldKey[] => {
    const missing: TravellerFieldKey[] = [];
    if (!tr.title?.trim()) missing.push('title');
    if (!tr.firstName?.trim()) missing.push('firstName');
    if (!tr.lastName?.trim()) missing.push('lastName');
    if (!tr.gender?.trim()) missing.push('gender');
    if (!tr.dob?.trim() || !isDobValidForPaxType(tr.dob, tr.paxType)) {
      missing.push('dob');
    }
    if (!tr.nationality?.trim()) missing.push('nationality');
    if (!tr.documentType?.trim()) missing.push('documentType');
    if (!tr.passport?.trim()) missing.push('passport');
    if (!isPassportIssueDateValid(tr.passportIssueDate)) {
      missing.push('passportIssueDate');
    }
    if (!isPassportExpiryDateValid(tr.passportExpiry, tr.passportIssueDate)) {
      missing.push('passportExpiry');
    }
    return missing;
  };
  const [travellerFieldErrorsByIdx, setTravellerFieldErrorsByIdx] = useState<
  Record<number, TravellerFieldKey[]>
  >({});
  const [contactFieldErrors, setContactFieldErrors] = useState<ContactFieldKey[]>(
    []
  );
  const travellerFieldHasError = (
  travellerIdx: number,
  field: TravellerFieldKey
  ): boolean => (travellerFieldErrorsByIdx[travellerIdx] ?? []).includes(field);
  const travellerInputClass = (
  travellerIdx: number,
  field: TravellerFieldKey,
  extra = ''
  ): string =>
  `glass-funnel-input${extra}${travellerFieldHasError(travellerIdx, field) ? ' !border-red-500 !ring-2 !ring-red-100 !bg-red-50/50' : ''}`;
  const contactFieldHasError = (field: ContactFieldKey): boolean =>
  contactFieldErrors.includes(field);
  const contactInputClass = (field: ContactFieldKey, extra = ''): string =>
  `glass-funnel-input${extra}${contactFieldHasError(field) ? ' !border-red-500 !ring-2 !ring-red-100 !bg-red-50/50' : ''}`;
  const [travellers, setTravellers] = useState<TravellerInfo[]>(() => {
    if (mode === 'holiday' || mode === 'hotels') {
      return buildPaxTypeList({
        adultCount: Math.max(1, hotelAdultCount || 1),
        childrenCount: Math.max(0, hotelChildCount || 0),
        infantCount: Math.max(0, hotelInfantCount || 0)
      }).map((paxType) => emptyTraveller(paxType));
    }
    return buildPaxTypeList({
      adultCount: flightAdultCount,
      childrenCount: flightChildrenCount,
      infantCount: flightInfantCount
    }).map((paxType) => emptyTraveller(paxType));
  });
  useEffect(() => {
    if (
      mode !== 'flights' &&
      mode !== 'bus' &&
      mode !== 'train' &&
      mode !== 'minibus'
    ) {
      return;
    }
    const paxTypes = buildPaxTypeList({
      adultCount:
        mode === 'minibus' ?
          Math.max(1, hotelAdultCount || 1) :
          flightAdultCount,
      childrenCount:
        mode === 'minibus' ?
          Math.max(0, hotelChildCount || 0) :
          flightChildrenCount,
      infantCount:
        mode === 'minibus' ?
          Math.max(0, hotelInfantCount || 0) :
          flightInfantCount
    });
    setTravellers((prev) =>
      paxTypes.map((paxType, index) => ({
        ...emptyTraveller(paxType),
        ...prev[index],
        paxType
      }))
    );
  }, [
    mode,
    flightAdultCount,
    flightChildrenCount,
    flightInfantCount,
    hotelAdultCount,
    hotelChildCount,
    hotelInfantCount
  ]);
  useEffect(() => {
    if (mode !== 'holiday' && mode !== 'hotels') return;
    const paxTypes = buildPaxTypeList(holidayTravellerCounts);
    setTravellers((prev) =>
      paxTypes.map((paxType, index) => ({
        ...emptyTraveller(paxType),
        ...prev[index],
        paxType
      }))
    );
  }, [
    mode,
    hotelAdultCount,
    hotelChildCount,
    hotelInfantCount
  ]);
  const holidayTravellersReady =
    travellers.length > 0 &&
    travellers.every((tr, idx) => {
      if (mode === 'hotels') {
        const baseOk = !!(
          tr.title?.trim() &&
          tr.firstName?.trim() &&
          tr.lastName?.trim() &&
          tr.passport?.trim() &&
          isPassportIssueDateValid(tr.passportIssueDate) &&
          isPassportExpiryDateValid(tr.passportExpiry, tr.passportIssueDate)
        );
        if (!baseOk) return false;
        // Lead: email + phone. Additional guests: phone only (no email).
        if (idx === 0) {
          return !!(tr.email?.trim() && tr.mobile?.trim());
        }
        return !!tr.mobile?.trim();
      }
      return isHolidayTravellerComplete(tr, {
        // Lead must have contact; others may inherit lead email/mobile at book time.
        requireContact: idx === 0,
        requirePassport: true,
        travelEndIso: passportTravelEndIso
      });
    });
  const busTravellersReady = holidayTravellersReady;
  const carTravellersReady =
    mode !== 'minibus' || holidayTravellersReady;
  const [activeTravellerIdx, setActiveTravellerIdx] = useState(0);
  const [travellerNavLoading, setTravellerNavLoading] = useState(false);
  const [topToast, setTopToast] = useState<string | null>(null);
  const topToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTopToast = (msg: string) => {
    setTopToast(msg);
    if (topToastTimer.current) clearTimeout(topToastTimer.current);
    topToastTimer.current = setTimeout(() => setTopToast(null), 2800);
  };
  type TravellerDateField = 'dob' | 'passportIssueDate' | 'passportExpiry';
  const [travellerDateSheet, setTravellerDateSheet] = useState<{
    travellerIdx: number;
    field: TravellerDateField;
  } | null>(null);
  const [documentTypeSheetIdx, setDocumentTypeSheetIdx] = useState<number | null>(
    null
  );
  const [genderSheetIdx, setGenderSheetIdx] = useState<number | null>(null);
  const travellerDateSheetConfig = (() => {
    if (!travellerDateSheet) return null;
    const tr = travellers[travellerDateSheet.travellerIdx];
    if (!tr) return null;
    const today = toCalendarInputValue(new Date());
    switch (travellerDateSheet.field) {
      case 'dob': {
        const bounds = dobBoundsForPaxType(tr.paxType);
        return {
          title: `Date of birth · ${PAX_AGE_HINTS[tr.paxType]}`,
          value: tr.dob,
          min: bounds.min,
          max: bounds.max
        };
      }
      case 'passportIssueDate':
        return {
          title: 'Issue date',
          value: tr.passportIssueDate,
          max: today,
          min: tr.dob || undefined
        };
      case 'passportExpiry': {
        // Expiry must be today or later, not before issue, and after trip end + 1 day.
        const issue = tr.passportIssueDate?.trim();
        let minExpiry = passportMinExpiryIso;
        if (issue && issue > minExpiry) minExpiry = issue;
        return {
          title: 'Expiry date',
          value: tr.passportExpiry,
          min: minExpiry
        };
      }
    }
  })();
  useEffect(() => {
    setActiveTravellerIdx(0);
  }, [travellers.length]);
  useEffect(() => {
    const el = scrollMainRef.current;
    if (!el) return;
    const reset = () => {
      el.scrollTop = 0;
      el.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };
    reset();
    requestAnimationFrame(() => {
      reset();
      requestAnimationFrame(reset);
    });
  }, [screen]);
  useEffect(() => {
    if (mode !== 'flights' || screen !== 'class') return;
    const el = scrollMainRef.current;
    if (!el) return;
    const reset = () => {
      el.scrollTop = 0;
      el.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };
    reset();
    requestAnimationFrame(reset);
  }, [flightCheckoutStep, mode, screen]);
  const getTravellerChipLabel = (
  paxType: PaxType,
  indexWithinType: number
  ): string => {
    const num = indexWithinType + 1;
    if (paxType === 'Adult') return `Adult ${num}`;
    if (paxType === 'Child') return `Child ${num}`;
    return `Infant ${num}`;
  };
  const travellerChipOptions = travellers.map((tr, idx) => {
    const indexWithinType = travellers.
    slice(0, idx).
    filter((t) => t.paxType === tr.paxType).length;
    return {
      idx,
      label: getTravellerChipLabel(tr.paxType, indexWithinType),
      paxType: tr.paxType
    };
  });
  const updateTraveller = (
  index: number,
  field: keyof TravellerInfo,
  value: string) => {
    setTravellers((prev) =>
    prev.map((t, i) =>
    i === index ?
    {
      ...t,
      [field]: value
    } :
    t
    )
    );
    setTravellerFieldErrorsByIdx((prev) => {
      const fields = prev[index];
      if (!fields?.includes(field as TravellerFieldKey)) return prev;
      const nextFields = fields.filter((f) => f !== field);
      const next = {
        ...prev
      };
      if (nextFields.length === 0) delete next[index];else
      next[index] = nextFields;
      return next;
    });
  };
  const addTraveller = () =>
  setTravellers((prev) => [...prev, emptyTraveller()]);
  const removeTraveller = (index: number) =>
  setTravellers((prev) => prev.filter((_, i) => i !== index));
  // Saved travellers (persisted locally for future bookings)
  const SAVED_TRAVELLERS_KEY = 'mkash.savedTravellers';
  const [savedTravellers, setSavedTravellers] = useState<TravellerInfo[]>(
    () => {
      try {
        const raw = localStorage.getItem(SAVED_TRAVELLERS_KEY);
        return raw ? JSON.parse(raw) as TravellerInfo[] : [];
      } catch {
        return [];
      }
    }
  );
  const persistSavedTravellers = (list: TravellerInfo[]) => {
    setSavedTravellers(list);
    try {
      localStorage.setItem(SAVED_TRAVELLERS_KEY, JSON.stringify(list));
    } catch {

      /* ignore */}
  };
  const travellerKey = (t: TravellerInfo) =>
  `${t.name.trim().toLowerCase()}|${t.passport.trim().toLowerCase()}`;
  const saveTravellerForFuture = (tr: TravellerInfo) => {
    const displayName =
    tr.name.trim() ||
    `${tr.firstName || ''} ${tr.lastName || ''}`.trim();
    if (!displayName) {
      showTopToast('Add a name before saving');
      return;
    }
    const key = travellerKey({ ...tr, name: displayName });
    const next = [
    { ...tr, name: displayName },
    ...savedTravellers.filter((t) => travellerKey(t) !== key)].
    slice(0, 8);
    persistSavedTravellers(next);
    showTopToast(`${displayName} saved for future bookings`);
  };
  const removeSavedTraveller = (key: string) =>
  persistSavedTravellers(
    savedTravellers.filter((t) => travellerKey(t) !== key)
  );
  const applySavedTraveller = (index: number, saved: TravellerInfo) => {
    setTravellers((prev) =>
    prev.map((t, i) =>
    i === index ?
    {
      ...saved
    } :
    t
    )
    );
    showToast(`${saved.name} details filled in`);
  };
  const [pickerOpenFor, setPickerOpenFor] = useState<number | null>(null);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactHouseNo, setContactHouseNo] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [contactCity, setContactCity] = useState('');
  const [contactZipCode, setContactZipCode] = useState('');
  const [contactCountry, setContactCountry] = useState('');
  const [contactPhoneCode, setContactPhoneCode] = useState('251');
  const getContactMissingFields = (): ContactFieldKey[] => {
    const missing: ContactFieldKey[] = [];
    if (!contactEmail.trim()) missing.push('email');
    if (!contactPhone.trim()) missing.push('phone');
    if (!contactCity.trim()) missing.push('city');
    if (!contactAddress.trim()) missing.push('address');
    if (!contactCountry.trim()) missing.push('country');
    if (!contactZipCode.trim()) missing.push('zipCode');
    return missing;
  };
  const scrollToTravellerSection = () => {
    requestAnimationFrame(() => {
      travellerSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  };
  const markTravellerErrors = (idx: number): boolean => {
    const tr = travellers[idx];
    if (!tr) return false;
    const missing = getTravellerMissingFields(tr);
    if (missing.length > 0) {
      setTravellerFieldErrorsByIdx((prev) => ({
        ...prev,
        [idx]: missing
      }));
      const ageMsg =
        missing.includes('dob') && tr.dob?.trim() ?
        dobValidationMessage(tr.dob, tr.paxType) :
        null;
      showTopToast(ageMsg || "Please complete this traveller's details");
      scrollToTravellerSection();
      return false;
    }
    setTravellerFieldErrorsByIdx((prev) => {
      const next = {
        ...prev
      };
      delete next[idx];
      return next;
    });
    return true;
  };
  const validateFlightBookingDetails = (): boolean => {
    const errorsByIdx: Record<number, TravellerFieldKey[]> = {};
    let firstIncomplete = -1;
    let firstAgeMsg: string | null = null;
    travellers.forEach((tr, idx) => {
      const missing = getTravellerMissingFields(tr);
      if (missing.length > 0) {
        errorsByIdx[idx] = missing;
        if (firstIncomplete < 0) {
          firstIncomplete = idx;
          if (missing.includes('dob') && tr.dob?.trim()) {
            firstAgeMsg = dobValidationMessage(tr.dob, tr.paxType);
          }
        }
      }
    });
    if (firstIncomplete >= 0) {
      setTravellerFieldErrorsByIdx(errorsByIdx);
      setActiveTravellerIdx(firstIncomplete);
      showTopToast(firstAgeMsg || "Please complete this traveller's details");
      scrollToTravellerSection();
      return false;
    }
    setTravellerFieldErrorsByIdx({});
    const contactMissing = getContactMissingFields();
    if (contactMissing.length > 0) {
      setContactFieldErrors(contactMissing);
      showTopToast('Please complete contact details');
      requestAnimationFrame(() => {
        contactDetailsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      });
      return false;
    }
    setContactFieldErrors([]);
    return true;
  };
  const goToFlightTravellersStep = () => {
    setFlightCheckoutStep('travellers');
    // Keep the next step at the top of the scroll (no scrollIntoView offset).
    window.setTimeout(() => {
      const el = scrollMainRef.current;
      if (!el) return;
      el.scrollTop = 0;
      el.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, 0);
  };
  const jumpToTraveller = (idx: number) => {
    if (idx < 0 || idx >= travellers.length) return;
    setTopToast(null);
    setActiveTravellerIdx(idx);
    scrollToTravellerSection();
  };
  const goToTraveller = async (nextIdx: number) => {
    if (nextIdx < 0 || nextIdx >= travellers.length) return;
    if (nextIdx > activeTravellerIdx) {
      if (!markTravellerErrors(activeTravellerIdx)) return;
      setTravellerNavLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 550));
      setTravellerNavLoading(false);
    }
    setTopToast(null);
    setActiveTravellerIdx(nextIdx);
    scrollToTravellerSection();
  };
  const handleTravellerNext = async () => {
    if (!markTravellerErrors(activeTravellerIdx)) return;
    setTravellerNavLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 550));
    setTopToast(null);
    if (activeTravellerIdx < travellers.length - 1) {
      setActiveTravellerIdx(activeTravellerIdx + 1);
      await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
      );
      scrollToTravellerSection();
      await new Promise((resolve) => setTimeout(resolve, 300));
      setTravellerNavLoading(false);
      return;
    }
    setTravellerNavLoading(false);
    requestAnimationFrame(() => {
      contactDetailsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  };
  const [payTab, setPayTab] = useState<'local' | 'intl'>('local');
  const [payMethod, setPayMethod] = useState('mkash');
  /** Flights/bus use parent picker; hotel/car/holiday use local pay-method screen. */
  const isWalletPayMethod = (method: string) =>
    method === 'mkash' || method === 'wallet';

  const resolvePayMethod = (override?: string) => {
    if (override && String(override).trim()) return String(override).trim();
    // Bus/train/hotel/car/holiday use the in-funnel payment radios (local payMethod).
    if (
      mode === 'hotels' ||
      mode === 'minibus' ||
      mode === 'holiday' ||
      mode === 'bus' ||
      mode === 'train'
    ) {
      return payMethod;
    }
    // Flights use the parent PaymentMethodPickerSheet selection.
    return paymentMethod || 'wallet';
  };

  const bookingStatusForPayMethod = (
    method: string
  ): 'confirmed' | 'reserved' => {
    const m = String(method || '').toLowerCase();
    if (m === 'bnpl' || m === 'cod' || m === 'paylater' || m === 'reserve') {
      return 'reserved';
    }
    return 'confirmed';
  };

  /**
   * Live TravellerDashboard check before ANY save-booking API.
   * Sufficient balance → allow SaveBooking / Bus_Booking / Hotel / Tour / Car.
   * Insufficient → toast and stop (do not proceed).
   */
  const ensureWalletCanPay = async (
    payTotal: number,
    _methodOverride?: string
  ): Promise<boolean> => {
    const latest = await refreshWallet();
    const availableEtb = latest?.amount ?? walletAmountEtb;
    if (
      isWalletBalanceSufficient(
        availableEtb,
        payTotal,
        displayCurrency,
        currencyValue
      )
    ) {
      return true;
    }
    const availableLabel = formatWalletCreditLabel(
      latest?.raw || `ETB ${availableEtb.toFixed(2)}`,
      {
        currencyCode: displayCurrency,
        rate: displayCurrency === 'ETB' ? 1 : currencyValue
      }
    );
    const msg = `Available ${availableLabel}. Required ${fmtMoney(payTotal)}. Add money to your wallet before booking.`;
    setSaveBookingError(msg);
    showTravelError(msg, {
      id: 'wallet-insufficient',
      title: 'Insufficient balance'
    });
    return false;
  };

  /**
   * After a successful book API (balance already verified):
   * - wallet → PIN + debit → confirmed
   * - Pay Later / COD → reserved
   * - other methods → confirmed
   */
  const finishBookingWithPayment = (
    amount: number,
    bookingRef: string | undefined,
    onDone: () => void,
    methodOverride?: string
  ) => {
    onBookingComplete?.();
    const method = resolvePayMethod(methodOverride);
    if (isWalletPayMethod(method)) {
      onPay(
        amount,
        () => {
          setBookingStatus('confirmed');
          onDone();
        },
        bookingRef
      );
      return;
    }
    setBookingStatus(bookingStatusForPayMethod(method));
    onDone();
  };
  const [bookingStatus, setBookingStatus] = useState<'confirmed' | 'reserved'>(
    'confirmed'
  );
  const [toast, setToast] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(9 * 60 + 45); // 9:45
  const [expandPassengers, setExpandPassengers] = useState(false);
  const [expandFare, setExpandFare] = useState(false);
  const [expandPaySummary, setExpandPaySummary] = useState(false);
  useEffect(() => {
    if (screen === 'payment' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [screen, timeLeft]);
  useEffect(() => {
    if (saveBookingError) {
      showTravelError(saveBookingError, { id: 'funnel-save-booking-error' });
    }
  }, [saveBookingError]);
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };
  const formatPayMethodLabel = (method: string) => {
    if (method === 'mkash' || method === 'wallet') return 'MKASH';
    if (method === 'bank') return 'BANK';
    if (method === 'mobile' || method === 'mobile_money') return 'MOBILE';
    if (method === 'card') return 'CARD';
    if (method === 'hotel') return 'HOTEL';
    if (method === 'bnpl' || method === 'paylater') return 'PAY LATER';
    if (method === 'cod' || method === 'reserve') return 'CASH ON DELIVERY';
    if (method === 'telebirr') return 'TELEBIRR';
    if (method === 'cbebirr') return 'CBE BIRR';
    if (method.startsWith('api:')) {
      const id = Number(method.slice(4));
      const match = apiPaymentTypes.find((type) => type.Id === id);
      return (match?.PaymentType || method).toUpperCase();
    }
    return method.toUpperCase();
  };
  const handleShareTicket = async () => {
    const ref = ticketBookingRef;
    const moneyCode =
      (mode === 'holiday' ?
        selectedTour?.currency :
        mode === 'bus' ?
          outbound?.currency :
          mode === 'minibus' ?
            selectedCar?.currency :
            mode === 'hotels' ?
              selectedHotel?.currency :
              outbound?.currency) ||
      currencyCode ||
      'ETB';
    const text =
    mode === 'holiday' && selectedTour ?
    `Mkash Travel tour booking ${ref}\n${selectedTour.name}\n${selectedTour.location || ''}\n${hotelCheckInDateLabel || hotelCheckInDate || ''} → ${hotelCheckOutDateLabel || hotelCheckOutDate || ''}\nPackage: ${selectedTourModality?.name || 'Tour'}\nTotal ${moneyCode} ${total.toLocaleString('en-US', { maximumFractionDigits: 2 })}` :
    mode === 'bus' && outbound ?
    `Mkash Travel bus booking ${ref}\n${outbound.fromCity} → ${outbound.toCity}\n${outbound.operator} · ${outbound.busType || 'Bus'}\n${outbound.departTime} → ${outbound.arriveTime}\nSeats: ${selectedSeats.join(', ') || '—'}\nBoarding: ${boardingPoints.find((b) => b.id === selectedBoardingPoint)?.name || selectedBoardingPoint || '—'}\nTotal ${moneyCode} ${total.toLocaleString('en-US', { maximumFractionDigits: 2 })}` :
    (() => {
      const route =
      outbound ?
      `${outbound.fromCity} → ${outbound.toCity}` :
      `${from} → ${to}`;
      return `Mkash Travel booking ${ref}\n${route}\n${outbound?.departTime || ''} · ${selectedClassName}\nTotal ${moneyCode} ${(flightApiGrandTotal ?? total).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    })();
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'Mkash Travel Ticket',
          text
        });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast('Ticket details copied');
        return;
      }
      showToast('Sharing is not available on this device');
    } catch {
      showToast('Share cancelled');
    }
  };
  const handleEmailTicket = () => {
    const ref = ticketBookingRef;
    const body =
    mode === 'holiday' && selectedTour ?
    encodeURIComponent(
      `Hello,\n\nHere are my Mkash Travel tour booking details:\n\nBooking: ${ref}\nTour: ${selectedTour.name}\nDestination: ${selectedTour.location || ''}\nTravel: ${hotelCheckInDateLabel || hotelCheckInDate || '—'} → ${hotelCheckOutDateLabel || hotelCheckOutDate || '—'}\nPackage: ${selectedTourModality?.name || 'Tour'}\nPassenger: ${travellers[0]?.name?.trim() || travellers[0]?.firstName || '—'}\nTotal: ETB ${total.toLocaleString('en-US', { maximumFractionDigits: 2 })}\n\nThank you.`
    ) :
    mode === 'bus' && outbound ?
    encodeURIComponent(
      `Hello,\n\nHere are my Mkash Travel bus booking details:\n\nBooking: ${ref}\nRoute: ${outbound.fromCity} → ${outbound.toCity}\nOperator: ${outbound.operator}\nBus type: ${outbound.busType || 'Bus'}\nDeparture: ${outbound.departTime}\nArrival: ${outbound.arriveTime}\nSeats: ${selectedSeats.join(', ') || '—'}\nBoarding: ${boardingPoints.find((b) => b.id === selectedBoardingPoint)?.name || selectedBoardingPoint || '—'}\nDropping: ${droppingPoints.find((d) => d.id === selectedDroppingPoint)?.name || selectedDroppingPoint || '—'}\nPassengers: ${travellers.map((t) => t.name || t.firstName).filter(Boolean).join(', ') || '—'}\nTotal: ETB ${total.toLocaleString('en-US', { maximumFractionDigits: 2 })}\n\nThank you.`
    ) :
    encodeURIComponent(
      (() => {
        const route =
        outbound ?
        `${outbound.fromCity} → ${outbound.toCity}` :
        `${from} → ${to}`;
        return `Hello,\n\nHere are my Mkash Travel booking details:\n\nBooking: ${ref}\nRoute: ${route}\nCabin: ${selectedClassName}\nPassengers: ${travellers.map((t) => t.name).filter(Boolean).join(', ') || '—'}\nTotal: ETB ${(flightApiGrandTotal ?? total).toLocaleString('en-US', { maximumFractionDigits: 2 })}\n\nThank you.`;
      })()
    );
    const toEmail = encodeURIComponent(
      contactEmail || travellers[0]?.email || ''
    );
    const subject = encodeURIComponent(
      mode === 'holiday' ?
      `Mkash Travel tour voucher ${ref}` :
      mode === 'bus' ?
      `Mkash Travel bus ticket ${ref}` :
      `Mkash Travel ticket ${ref}`
    );
    window.location.href = `mailto:${toEmail}?subject=${subject}&body=${body}`;
    showToast(
      contactEmail || travellers[0]?.email ?
      `Opening email to ${contactEmail || travellers[0]?.email}` :
      'Opening email…'
    );
  };
  const handleAddToCalendar = () => {
    if (mode === 'holiday' && selectedTour) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const stamp = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
      const parsed = hotelCheckInDate ?
      new Date(`${hotelCheckInDate}T07:00:00`) :
      new Date();
      const start = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      const title = selectedTour.name;
      const description = `Mkash Travel · ${ticketBookingRef} · ${selectedTour.location || ''} · ${selectedTourModality?.name || 'Tour'}`;
      const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Mkash Travel//EN',
      'BEGIN:VEVENT',
      `UID:${ticketBookingRef}@mkash.travel`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR'].
      join('\r\n');
      downloadObjectUrl(
        URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' })),
        `mkash-tour-${ticketBookingRef}.ics`
      );
      showToast('Calendar file downloaded');
      return;
    }
    if (!outbound) {
      showToast('No trip details to add');
      return;
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    let start = new Date();
    if (mode === 'bus' && travelDate) {
      try {
        const day = parseBusTravelDate(travelDate);
        const timeMatch = (outbound.departTime || '').match(
          /(\d{1,2})[.:](\d{2})\s*(AM|PM)?/i
        );
        if (timeMatch) {
          let hours = Number(timeMatch[1]);
          const mins = Number(timeMatch[2]);
          const ap = (timeMatch[3] || '').toUpperCase();
          if (ap === 'PM' && hours < 12) hours += 12;
          if (ap === 'AM' && hours === 12) hours = 0;
          day.setHours(hours, mins, 0, 0);
        } else {
          day.setHours(7, 0, 0, 0);
        }
        start = day;
      } catch {
        start = new Date();
      }
    }
    const end = new Date(
      start.getTime() + (mode === 'bus' ? 7 : 4) * 60 * 60 * 1000
    );
    const title = `${outbound.fromCity} → ${outbound.toCity}`;
    const description =
    mode === 'bus' ?
    `Mkash Travel · ${ticketBookingRef} · ${outbound.operator} · ${outbound.busType || 'Bus'} · Seats ${selectedSeats.join(', ') || '—'}` :
    `Mkash Travel · ${ticketBookingRef} · ${outbound.operator} ${outbound.flightNo || ''} · ${selectedClassName}`;
    const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mkash Travel//EN',
    'BEGIN:VEVENT',
    `UID:${ticketBookingRef}@mkash.travel`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR'].
    join('\r\n');
    downloadObjectUrl(
      URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' })),
      `mkash-${mode === 'bus' ? 'bus' : 'trip'}-${ticketBookingRef}.ics`
    );
    showToast('Calendar file downloaded');
  };
  const handleSupport = () => {
    window.location.href =
    'mailto:support@mkash.travel?subject=' +
    encodeURIComponent(`Help with booking ${ticketBookingRef}`);
    showToast('Opening support email…');
  };
  const trips =
  mode === 'bus' ?
  busList.trips :
  mode === 'flights' ?
  flightList.trips :
  mode === 'hotels' || mode === 'minibus' || mode === 'holiday' ?
  [] :
  mode === 'train' ?
  TRIPS.train :
  TRIPS[mode as 'flights' | 'bus'];
  const displayTrips = useMemo(() => {
    let list = trips;
    if (mode === 'flights') {
      list = applyFlightListFilters(list, flightFilters);
      const sorted = [...list];
      if (sort === 'Cheapest price' || sort === 'Cheapest') {
        sorted.sort((a, b) => a.price - b.price);
      } else if (sort === 'Departure time') {
        sorted.sort((a, b) => a.departTime.localeCompare(b.departTime));
      } else {
        sorted.sort((a, b) => {
          if (a.transfers !== b.transfers) return a.transfers - b.transfers;
          if (a.price !== b.price) return a.price - b.price;
          return a.duration.localeCompare(b.duration);
        });
      }
      return sorted;
    }
    if (mode === 'bus') {
      return applyBusListFilters(list, busFilters);
    }
    return list;
  }, [trips, mode, flightFilters, sort, busFilters]);
  const displayBusOperators = useMemo(
    () => uniqueBusOperators(trips),
    [trips]
  );
  const displayHotels = useMemo(() => {
    const filtered = applyHotelListFilters(hotelList.hotels, hotelFilters);
    const sorted = [...filtered];
    if (sort === 'Cheapest price' || sort === 'Cheapest') {
      sorted.sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (sort === 'Guest rating' || sort === 'Top rated') {
      // Star rating first, then review volume, then price
      sorted.sort(
        (a, b) =>
          (b.stars || 0) - (a.stars || 0) ||
          (b.reviews || 0) - (a.reviews || 0) ||
          a.pricePerNight - b.pricePerNight
      );
    } else {
      // Recommended — popular stays (reviews), then stars, then value
      sorted.sort(
        (a, b) =>
          (b.reviews || 0) - (a.reviews || 0) ||
          (b.stars || 0) - (a.stars || 0) ||
          a.pricePerNight - b.pricePerNight ||
          a.name.localeCompare(b.name)
      );
    }
    return sorted;
  }, [hotelList.hotels, hotelFilters, sort]);
  const displayCars = useMemo(() => {
    const filtered = applyCarListFilters(carList.cars, carFilters);
    const sorted = [...filtered];
    if (sort === 'Cheapest price' || sort === 'Cheapest') {
      sorted.sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sort === 'Seats' || sort === 'Most seats') {
      sorted.sort(
        (a, b) => b.seats - a.seats || a.pricePerDay - b.pricePerDay
      );
    } else {
      // Recommended — Automatic preferred, then value, then seats
      sorted.sort((a, b) => {
        const autoA = a.transmission === 'Auto' ? 0 : 1;
        const autoB = b.transmission === 'Auto' ? 0 : 1;
        return (
          autoA - autoB ||
          a.pricePerDay - b.pricePerDay ||
          b.seats - a.seats ||
          a.name.localeCompare(b.name)
        );
      });
    }
    return sorted;
  }, [carList.cars, carFilters, sort]);
  const liveLowestFare = useMemo(() => {
    if (mode !== 'flights' || !trips.length) return null;
    const prices = trips.map((t) => t.price).filter((p) => p > 0);
    return prices.length ? Math.min(...prices) : null;
  }, [mode, trips]);
  const jsonSelectBus = outbound ?
  buildJsonSelectBus(outbound, {
    originLabel: stripCityLabel(from),
    originCityId: busOriginId
  }) :
  '';
  const busSeatLayout = useBusSeatLayout({
    jsonSelectBus,
    currencyCode: displayCurrency,
    currencyRate: displayCurrency === 'ETB' ? 1 : currencyValue,
    enabled: mode === 'bus' && !!outbound && busSeatFetchToken > 0,
    fetchToken: busSeatFetchToken
  });
  const busApiSeats = busSeatLayout.seats;
  const busSeatRows = useMemo(
    () => chunkBusSeatRows(busApiSeats, 4),
    [busApiSeats]
  );
  useEffect(() => {
    if (mode !== 'bus' || busSeatLayout.loading || busApiSeats.length === 0) return;
    const bookedIds = new Set(
      busApiSeats.
      filter((seat) => seat.status === 'booked' || seat.isAvailable === false).
      map((seat) => seat.seatId)
    );
    if (bookedIds.size === 0) return;
    setSelectedSeats((prev) => {
      const next = prev.filter((id) => {
        const apiSeat = findBusApiSeat(busApiSeats, id);
        const key = apiSeat?.seatId || id;
        return !bookedIds.has(key) && !bookedIds.has(id);
      });
      return next.length === prev.length ? prev : next;
    });
  }, [mode, busSeatLayout.loading, busApiSeats]);
  const busForceFromEtb = busFareLikelyUnconvertedEtb(
    outbound?.apiPayload,
    displayCurrency
  );
  const busDisplayOpts = {
    displayCurrency,
    rate: currencyValue,
    forceFromEtb: busForceFromEtb
  };
  const busUnitListFare = toBusDisplayAmount(
    coalesceBusFare(
      resolveBusTicketFare(
        outbound?.apiPayload && typeof outbound.apiPayload === 'object' ?
          (outbound.apiPayload as Record<string, unknown>) :
          undefined
      ),
      outbound?.price
    ),
    {
      ...busDisplayOpts,
      referenceDisplayAmount: undefined
    }
  );
  const busTripDisplayPrice = (trip: {
    price: number;
    apiPayload?: unknown;
  }) =>
    toBusDisplayAmount(
      coalesceBusFare(
        resolveBusTicketFare(
          trip.apiPayload && typeof trip.apiPayload === 'object' ?
            (trip.apiPayload as Record<string, unknown>) :
            undefined
        ),
        trip.price
      ),
      {
        displayCurrency,
        rate: currencyValue,
        forceFromEtb: busFareLikelyUnconvertedEtb(
          trip.apiPayload,
          displayCurrency
        )
      }
    );
  const busSeatUnitDisplayFare = (seatPrice?: number | null): number =>
    toBusDisplayAmount(seatPrice, {
      ...busDisplayOpts,
      referenceDisplayAmount: busUnitListFare
    });
  const busSeatFareTotal = selectedSeats.reduce((sum, seatId) => {
    const apiSeat = findBusApiSeat(busApiSeats, seatId);
    return sum + busSeatUnitDisplayFare(apiSeat?.price);
  }, 0);
  const busListTotalForSeats = busListFareTotal(
    busUnitListFare,
    Math.max(selectedSeats.length, travellers.length, 1)
  );
  /** Confirmed/API totals may still be ETB — always normalize to UI currency. */
  const busFareDisplayTotal = toBusDisplayAmount(
    busConfirmedPrice != null && busConfirmedPrice > 0 ?
      busConfirmedPrice :
      busSeatFareTotal > 0 ?
        busSeatFareTotal :
        busUnitListFare,
    {
      ...busDisplayOpts,
      referenceDisplayAmount:
        busSeatFareTotal > 0 ? busSeatFareTotal : busListTotalForSeats || busUnitListFare
    }
  );
  const carPickupLocation = normalizeCarLocation(from);
  const carReturnLocation =
  to !== 'Where to?' ? normalizeCarLocation(to) : carPickupLocation;
  const jsonSelectCar =
    selectedCar && carPickupDate && carReturnDate ?
    buildJsonSelectCar(selectedCar, {
      pickupDate: carPickupDate,
      pickupTime: carPickupTime,
      returnDate: carReturnDate,
      returnTime: carReturnTime,
      pickupLocation: carPickupLocation,
      returnLocation: carReturnLocation
    }) :
    selectedCar ?
    buildJsonSelectCar(selectedCar) :
    '';
  const carSelectionLive =
    mode === 'minibus' && !!selectedCar && !carList.fromFallback;
  const carSelection = useCarSelection({
    jsonSelectCar,
    defaultCurrency: carCurrencyCode,
    defaultCurrencyValue: carCurrencyValue,
    carMarkup: CAR_SELECT_DEFAULT_MARKUP,
    enabled: carSelectionLive && carSelectFetchToken > 0,
    fetchToken: carSelectFetchToken
  });
  const carRentalDays =
  carPickupDate && carReturnDate ?
  rentalDayCount(carPickupDate, carReturnDate) :
  3;
  const carUsesSampleInventory =
    carList.fromFallback || (selectedCar ? isCarDemoItem(selectedCar) : false);
  const resolvedCarPricing =
  carSelection.pricing ??
  (
    selectedCar &&
    carSelectFetchToken > 0 &&
    !carSelection.loading &&
    (carSelectionLive || carUsesSampleInventory) ?
    estimateCarPricingForRental(
      selectedCar,
      carRentalDays,
      carUsesSampleInventory ? selectedCar.currency : carCurrencyCode
    ) :
    null
  );
  const carPricingIsEstimated =
  !!resolvedCarPricing && !carSelection.pricing;
  const canConfirmCarBooking =
    mode === 'minibus' &&
    !!selectedCar &&
    (
      (!carUsesSampleInventory && !!carSelection.pricing && !carPricingIsEstimated) ||
      (carUsesSampleInventory && !!resolvedCarPricing)
    );
  useEffect(() => {
    if (carSelection.loading || carSelectFetchToken === 0 || !selectedCar) return;

    if (carSelection.pricing) {
      const key = `${carSelectFetchToken}|live|${carSelection.pricing.GrandTotal ?? ''}`;
      if (carSelectConfirmedRef.current === key) return;
      carSelectConfirmedRef.current = key;
      setConfirmedCarBookingJson(
        buildBookingJsonFromCarPricing(carSelection.pricing)
      );
      return;
    }

    if (!carUsesSampleInventory) return;

    const estimate = estimateCarPricingForRental(
      selectedCar,
      carRentalDays,
      selectedCar.currency
    );
    if (!estimate) return;
    const key = `${carSelectFetchToken}|demo|${estimate.GrandTotal ?? ''}`;
    if (carSelectConfirmedRef.current === key) return;
    carSelectConfirmedRef.current = key;
    setConfirmedCarBookingJson(buildBookingJsonFromCarPricing(estimate));
  }, [
    carSelection.loading,
    carSelection.pricing,
    carSelectFetchToken,
    selectedCar,
    carUsesSampleInventory,
    carRentalDays
  ]);
  const flightMainRow = outbound?.apiPayload as
    | Record<string, unknown>
    | undefined;
  const flightConnectionSource =
    String(
      flightMainRow?.ConnectionIndexFirst ??
        flightMainRow?.ConnectionIndexForward ??
        flightMainRow?.ConnectionIndex ??
        'GDS'
    );
  const snapshotFlightBookingRows = (trip: Trip) => {
    const main = trip.apiPayload as FlightListItem | undefined;
    const catalog =
    flightSearchRawRef.current.length > 0 ?
    flightSearchRawRef.current :
    flightList.raw;
    if (!main || catalog.length === 0) {
      setFlightBookingRows([]);
      return;
    }
    flightSearchRawRef.current = catalog;
    setFlightSearchCatalog(catalog);
    const next = collectBookingRows(main, catalog);
    setFlightBookingRows((prev) => {
      const nextSubs = next.filter(isSubBookingRow).length;
      const prevSubs = prev.filter(isSubBookingRow).length;
      // Cabin fare changes must not drop connecting SubRows already captured.
      if (nextSubs > 0 && nextSubs >= prevSubs) return next;
      if (prevSubs > 0) return alignSegmentRowsToMain(main, prev);
      return next.length > 0 ? next : prev;
    });
  };
  useEffect(() => {
    if (flightList.raw.length > 0) {
      flightSearchRawRef.current = flightList.raw;
      setFlightSearchCatalog(flightList.raw);
    }
  }, [flightList.raw]);

  const flightListWasLoadingRef = useRef(false);
  const hotelListWasLoadingRef = useRef(false);
  const carListWasLoadingRef = useRef(false);
  // Fresh search finished → keep stops/stars, clear price/duration caps so
  // stale ceilings from the previous result set don't hide the new list.
  useEffect(() => {
    if (mode !== 'flights') return;
    if (flightList.loading) {
      flightListWasLoadingRef.current = true;
      return;
    }
    if (flightListWasLoadingRef.current) {
      flightListWasLoadingRef.current = false;
      setFlightFilters((prev) => ({
        ...prev,
        maxPrice: null,
        maxDurationMins: null
      }));
    }
  }, [mode, flightList.loading]);
  useEffect(() => {
    if (mode !== 'hotels') return;
    if (hotelList.loading) {
      hotelListWasLoadingRef.current = true;
      return;
    }
    if (hotelListWasLoadingRef.current) {
      hotelListWasLoadingRef.current = false;
      setHotelFilters((prev) => ({
        ...prev,
        maxPrice: null
      }));
    }
  }, [mode, hotelList.loading]);
  useEffect(() => {
    if (mode !== 'minibus') return;
    if (carList.loading) {
      carListWasLoadingRef.current = true;
      return;
    }
    if (carListWasLoadingRef.current) {
      carListWasLoadingRef.current = false;
      setCarFilters((prev) => ({
        ...prev,
        maxPrice: null
      }));
    }
  }, [mode, carList.loading]);
  const pinnedFlightCatalog =
  flightSearchCatalog.length > 0 ?
  flightSearchCatalog :
  flightList.raw;
  const flightMainPayload = outbound?.apiPayload as FlightListItem | undefined;
  const preparedFlightBooking =
    flightMainPayload ?
      collectBookingRowsForApi(
        flightMainPayload,
        pinnedFlightCatalog,
        // Only reuse snapshot rows when they already belong to the bookable MainRow.
        flightBookingRows
      ) :
      null;
  const flightBookingMain = preparedFlightBooking?.main;
  const resolvedBookingRows =
    preparedFlightBooking ?
    (() => {
      const fromResolve = resolveBookingRows(
        preparedFlightBooking.main,
        pinnedFlightCatalog,
        preparedFlightBooking.rows
      );
      const expected = ndcExpectedOnewayRowCount(preparedFlightBooking.main);
      if (expected != null && fromResolve.length < expected) {
        return padBookingRowsToCount(
          preparedFlightBooking.main,
          fromResolve,
          expected
        );
      }
      return fromResolve.length > 0 ? fromResolve : preparedFlightBooking.rows;
    })() :
    [];
  const bookingPayloadReady =
    flightBookingMain ?
    isBookingPayloadReady(
      flightBookingMain,
      resolvedBookingRows,
      pinnedFlightCatalog
    ) :
    false;
  const jsonBookingString =
    flightBookingMain && resolvedBookingRows.length > 0 ?
    serializeBookingRows(flightBookingMain, resolvedBookingRows, {
      adultCount: flightAdultCount,
      childrenCount: flightChildrenCount,
      infantCount: flightInfantCount
    }) :
    '';
  const passengerCountsKey = `${flightAdultCount}|${flightChildrenCount}|${flightInfantCount}`;
  const flightBooking = useFlightBooking({
    traceId: String(
      flightBookingMain?.ItemId ?? flightMainRow?.ItemId ?? ''
    ).replace(/_PC$/i, ''),
    tripType: resolveBookingTripType(flightBookingMain),
    contentSource: flightConnectionSource,
    jsonstring: jsonBookingString,
    enabled:
    mode === 'flights' &&
    !!outbound &&
    bookingPayloadReady &&
    flightBookingFetchToken > 0 &&
    (screen === 'class' || screen === 'passenger'),
    fetchToken: flightBookingFetchToken,
    adultCount: flightAdultCount,
    childrenCount: flightChildrenCount,
    infantCount: flightInfantCount,
    currencyCode,
    currencyValue
  });
  const flightBookingDetail: FlightBookingDetail | null =
  flightBooking.bookingDetail ??
  (flightBooking.details[0] as FlightBookingDetail | undefined) ??
  null;
  const flightCabinOptions = useMemo(() => {
    if (mode !== 'flights') return null;
    const options = buildFlightCabinOptions(
      flightBookingDetail,
      flightBooking.details,
      pinnedFlightCatalog,
      flightBookingMain || flightMainPayload
    );
    return options.length > 0 ? options : null;
  }, [
    mode,
    flightBookingDetail,
    flightBooking.details,
    pinnedFlightCatalog,
    flightBookingMain,
    flightMainPayload
  ]);
  const flightMiniFareRules = useMemo(
    () => extractMiniFareRules(flightBookingDetail),
    [flightBookingDetail]
  );
  const flightConfirmedRoute = useMemo(
    () => formatBookingRouteLabel(flightBookingDetail),
    [flightBookingDetail]
  );
  const flightStopLabel =
  outbound?.transfers === 0 ?
  'Non-stop' :
  outbound?.transfers === 1 ?
  '1 Stop' :
  `${outbound?.transfers ?? 0} Stops`;
  const flightDepartAirport =
  flightBookingDetail?.DepartCityCode ??
  outbound?.departCityCode ??
  airportCodeLabel(undefined, outbound?.fromCity) ??
  airportCodeLabel(undefined, from);
  const flightArriveAirport =
  flightBookingDetail?.ArriveCityCode ??
  outbound?.arriveCityCode ??
  airportCodeLabel(undefined, outbound?.toCity) ??
  airportCodeLabel(undefined, to);
  const flightCheckedBagLabel =
  formatCheckedBaggage(flightBookingDetail?.Baggage as string | undefined) ||
  'Included';
  const flightCabinBagLabel =
  formatCabinBaggage(flightBookingDetail?.CabinBaggage as string | undefined) ||
  'Included';
  const flightPaymentPricing = flightBooking.pricing;
  const carPaymentPricing = resolvedCarPricing;
  const carPaymentCurrency = carPaymentPricing?.ShowCurrency ?? 'ETB';
  const busSelectedSeatLabels =
  mode === 'bus' ?
  selectedSeats.map((seatId) => {
    const apiSeat = findBusApiSeat(busSeatLayout.seats, seatId);
    return apiSeat?.seatId ?? seatId;
  }) :
  [];
  useEffect(() => {
    if (mode !== 'flights') return;
    setClassId('');
    setFlightCheckoutStep('cabin');
    // Reset only when the itinerary changes — not when switching cabin/fare on the same flight.
  }, [
    mode,
    outbound?.flightNo,
    outbound?.departTime,
    outbound?.arriveTime,
    outbound?.departCityCode,
    outbound?.arriveCityCode
  ]);
  // Cabin class is picked during search (Passengers sheet), so checkout resolves
  // the fare on its own: the row behind the tapped flight, else the cabin that
  // matches the searched class, else the cheapest returned fare.
  useEffect(() => {
    if (mode !== 'flights' || !flightCabinOptions?.length) return;
    if (classId !== '' && flightCabinOptions.some((o) => o.id === classId)) return;
    const bySelectedRow = flightMainPayload ?
      flightCabinOptions.find((option) => option.sourceRow === flightMainPayload) :
      undefined;
    const bySearchedCabin = flightCabinOptions.find(
      (option) =>
        option.name.toLowerCase() === flightCabinClassName.trim().toLowerCase()
    );
    setClassId(
      (bySelectedRow ?? bySearchedCabin ?? flightCabinOptions[0]).id
    );
  }, [mode, classId, flightCabinOptions, flightMainPayload, flightCabinClassName]);
  useEffect(() => {
    const fareScreens: Screen[] = ['class', 'passenger'];
    if (!fareScreens.includes(screen)) {
      return;
    }

    if (
      mode !== 'flights' ||
      !outbound?.id ||
      !jsonBookingString ||
      !bookingPayloadReady
    ) {
      return;
    }

    const key = `${outbound.id}|${jsonBookingString}|${passengerCountsKey}|${currencyCode}|${currencyValue}`;
    if (flightBookingKeyRef.current === key) return;

    flightBookingKeyRef.current = key;
    setFlightBookingFetchToken((n) => n + 1);
  }, [
    mode,
    screen,
    outbound?.id,
    jsonBookingString,
    bookingPayloadReady,
    passengerCountsKey,
    currencyCode,
    currencyValue
  ]);
  const selectHotelJson =
  selectedHotel ? buildSelectHotelJson(selectedHotel) : '';
  const hotelDetails = useHotelDetails({
    checkInDate: hotelCheckInDate,
    checkOutDate: hotelCheckOutDate,
    selectHotelJson,
    roomCount: hotelRoomCount,
    adultCount: hotelAdultCount,
    currencyCode,
    currencyValue,
    enabled:
    mode === 'hotels' &&
    !!selectedHotel &&
    screen === 'class' &&
    hotelDetailsFetchToken > 0 &&
    !!hotelCheckInDate &&
    !!hotelCheckOutDate,
    fetchToken: hotelDetailsFetchToken
  });
  const tourDetails = useTourDetails({
    tourCode: selectedTour?.code || '',
    fromDate: hotelCheckInDate,
    toDate: hotelCheckOutDate,
    adultCount: hotelAdultCount,
    childCount: hotelChildCount,
    currencyCode,
    enabled:
    mode === 'holiday' &&
    !!selectedTour &&
    screen === 'class' &&
    tourDetailsFetchToken > 0 &&
    !!hotelCheckInDate &&
    !!hotelCheckOutDate,
    fetchToken: tourDetailsFetchToken
  });
  useEffect(() => {
    setSelectedTourModality(null);
  }, [selectedTour?.id]);
  useEffect(() => {
    const mods = tourDetails.details?.modalities;
    if (!mods?.length) return;
    setSelectedTourModality((prev) => {
      if (prev && mods.some((m) => m.id === prev.id)) return prev;
      return mods.reduce((best, m) =>
        m.rate > 0 && (best.rate <= 0 || m.rate < best.rate) ? m : best
      , mods[0]);
    });
  }, [tourDetails.details?.modalities]);
  useEffect(() => {
    hotelDetailsMergedRef.current = '';
  }, [selectedHotel?.id]);
  useEffect(() => {
    if (!selectedHotel || hotelDetails.loading) return;
    if (
      !hotelDetails.details &&
      hotelDetails.images.length === 0 &&
      hotelDetails.roomTypes.length === 0
    ) {
      return;
    }

    const key = `${selectedHotel.id}|${hotelDetails.images.length}|${hotelDetails.facilities.length}|${hotelDetails.roomTypes.length}`;
    if (hotelDetailsMergedRef.current === key) return;

    hotelDetailsMergedRef.current = key;
    setSelectedHotel((prev) => {
      if (!prev || prev.id !== selectedHotel.id) return prev;
      return mergeHotelWithDetails(prev, hotelDetails);
    });
  }, [selectedHotel?.id, hotelDetails]);
  const hotelRoomDetails = useHotelRoomDetails({
    checkInDate: hotelCheckInDate,
    checkOutDate: hotelCheckOutDate,
    jsonSelectRoom,
    selectHotelJson,
    totalDays: selectedHotel?.totalNights ?? 1,
    roomCount: hotelRoomCount,
    adultCount: hotelAdultCount,
    currencyCode,
    currencyValue,
    enabled:
    mode === 'hotels' &&
    showRoomSelection &&
    hotelRoomFetchToken > 0 &&
    !!jsonSelectRoom &&
    !!selectHotelJson,
    fetchToken: hotelRoomFetchToken
  });
  useEffect(() => {
    if (hotelRoomDetails.loading || !hotelRoomDetails.pricing) return;
    if (hotelRoomFetchToken === 0) return;

    const reserveKey = `${hotelRoomFetchToken}|${hotelRoomDetails.pricing.GrandTotal ?? ''}`;
    if (hotelRoomReservedRef.current === reserveKey) return;
    hotelRoomReservedRef.current = reserveKey;

    const grandTotal = Number(
      hotelRoomDetails.pricing.GrandTotal ??
        hotelRoomDetails.pricing.TotalFare ??
        0
    );
    setSelectedHotel((prev) => {
      if (!prev) return prev;
      const nights = Math.max(1, prev.totalNights ?? 1);
      return {
        ...prev,
        totalStayPrice: grandTotal > 0 ? grandTotal : prev.totalStayPrice,
        pricePerNight:
        grandTotal > 0 ?
        Math.round(grandTotal / nights) :
        prev.pricePerNight,
        roomType: String(
          hotelRoomDetails.room?.RoomName ?? prev.roomType
        )
      };
    });
    if (jsonSelectRoom) {
      setConfirmedHotelSelectRoomJson(jsonSelectRoom);
    }
    if (hotelRoomDetails.pricing) {
      setConfirmedHotelBookingJson(
        buildBookingJsonFromPricing(hotelRoomDetails.pricing)
      );
    }
    setShowRoomSelection(false);
    setScreen('passenger');
  }, [
    hotelRoomDetails.loading,
    hotelRoomDetails.pricing,
    hotelRoomDetails.room,
    hotelRoomFetchToken
  ]);
  const hotelPaymentPricing = hotelRoomDetails.pricing;
  const hotelPaymentCurrency =
  hotelPaymentPricing?.CurrencyCode ?? selectedHotel?.currency ?? 'ETB';
  const hotelApiGrandTotal =
  hotelPaymentPricing?.GrandTotal != null ?
  Number(hotelPaymentPricing.GrandTotal) :
  null;
  const reserveHotelRoom = (roomIndex: number) => {
    const room = selectedHotel?.roomOptions?.[roomIndex];
    const payload = room?.apiPayload;
    if (!payload) return;
    setSelectedRoomIndex(roomIndex);
    setJsonSelectRoom(buildJsonSelectRoom(payload));
    setHotelRoomFetchToken((n) => n + 1);
  };
  const mockSeatOccupied = (row: number, col: string) =>
  row === 2 && col === 'B' ||
  row === 5 && col === 'A' ||
  row === 8 && col === 'B' ||
  row === 1 && col === 'C' ||
  row === 6 && col === 'D' ||
  row === 7 && col === 'C';
  const getSeatMeta = (seatId: string, row: number, col: string) => {
    if (mode === 'bus') {
      const apiSeat = findBusApiSeat(busSeatLayout.seats, seatId);
      if (apiSeat) {
        const occupied = isOccupiedBusSeat(apiSeat);
        return {
          occupied,
          premium: !occupied && (apiSeat.status === 'premium' || apiSeat.isLadiesSeat === true),
          ladies: !occupied && apiSeat.isLadiesSeat === true,
          apiSeatId: apiSeat.seatId,
          price: apiSeat.price
        };
      }
      return {
        occupied: false,
        premium: false,
        ladies: false,
        apiSeatId: cabinSeatToApiKey(seatId),
        price: undefined as number | undefined
      };
    }
    return {
      occupied: mockSeatOccupied(row, col),
      premium: row <= 2,
      ladies: false,
      apiSeatId: seatId,
      price: undefined as number | undefined
    };
  };
  const toggleBusApiSeat = (seat: BusSeatInfo) => {
    if (isOccupiedBusSeat(seat)) return;
    const seatKey = seat.seatId;
    if (selectedSeats.includes(seatKey)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatKey));
      return;
    }
    if (selectedSeats.length < travellers.length) {
      setSelectedSeats([...selectedSeats, seatKey]);
    } else if (travellers.length === 1) {
      setSelectedSeats([seatKey]);
    } else {
      showToast(`You can only select ${travellers.length} seat(s)`);
    }
  };
  const renderBusSeatCell = (seat: BusSeatInfo | undefined, key: string) => {
    if (!seat) {
      return <div key={key} className="w-9 h-9" />;
    }
    const occupied = isOccupiedBusSeat(seat);
    const ladies = !occupied && seat.isLadiesSeat === true;
    const isSelected = selectedSeats.includes(seat.seatId);
    return (
      <button
        key={key}
        type="button"
        disabled={occupied}
        title={occupied ? 'Booked' : ladies ? `Ladies seat ${seat.seatId}` : `Seat ${seat.seatId}`}
        aria-label={
          occupied ? `Seat ${seat.seatId} booked` : `Seat ${seat.seatId}`
        }
        onClick={() => toggleBusApiSeat(seat)}
        className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[10px] font-bold transition-transform active:scale-95"
        style={{
          backgroundColor: isSelected ?
            KTA.green :
            occupied ?
            '#e2e8f0' :
            ladies ?
            '#fce7f3' :
            '#ffffff',
          color: isSelected ?
            '#fff' :
            occupied ?
            '#94a3b8' :
            ladies ?
            '#db2777' :
            '#0f172a',
          border: `1.5px solid ${
            isSelected ?
            KTA.green :
            occupied ?
            '#e2e8f0' :
            ladies ?
            '#f9a8d4' :
            '#cbd5e1'}`,
          opacity: occupied ? 0.7 : 1,
          cursor: occupied ? 'not-allowed' : 'pointer'
        }}>
        {seat.seatId}
      </button>
    );
  };
  const isIntl = false;
  const ModeIcon = modeIcon(mode);
  const ROOM_OPTIONS = [
  {
    id: 'economy',
    name: 'Standard Room',
    perk: 'Free Wi-Fi',
    extra: 0
  },
  {
    id: 'business',
    name: 'Deluxe Room',
    perk: 'City View',
    extra: 1500
  },
  {
    id: 'first',
    name: 'Executive Suite',
    perk: 'Breakfast + Spa',
    extra: 3500
  }];

  const CAR_OPTIONS = [
  {
    id: 'economy',
    name: 'Basic Insurance',
    perk: 'Standard excess',
    extra: 0
  },
  {
    id: 'business',
    name: 'Full Cover',
    perk: 'Zero excess',
    extra: 500
  },
  {
    id: 'first',
    name: 'Premium + GPS',
    perk: 'Zero excess + Nav',
    extra: 800
  }];

  const optionsList =
  mode === 'hotels' ?
  ROOM_OPTIONS :
  mode === 'minibus' ?
  CAR_OPTIONS :
  mode === 'flights' ?
  flightCabinOptions ?? [] :
  CLASS_OPTIONS;
  const selectedClass =
  optionsList.find((c) => c.id === classId) ?? optionsList[0];
  const selectedClassName =
  selectedClass?.name ?? (mode === 'flights' ? flightCabinClassName : 'Cabin');
  const selectedCabinPerkLines = (() => {
    const option = selectedClass as
    { perkLine1?: unknown; perkLine2?: unknown } |
    undefined;
    return [option?.perkLine1, option?.perkLine2].
    map((line) => (typeof line === 'string' ? line.trim() : '')).
    filter(Boolean);
  })();
  const flightTravellersReady =
  mode !== 'flights' ||
  (
    travellers.length > 0 &&
    travellers.every(isTravellerDetailsComplete) &&
  contactEmail.trim().length > 0 &&
  contactPhone.trim().length > 0 &&
  contactCity.trim().length > 0 &&
  contactAddress.trim().length > 0 &&
  contactCountry.trim().length > 0 &&
  contactZipCode.trim().length > 0
  );
  const flightClassScreenReady =
  mode !== 'flights' ||
  (
    !flightBooking.loading &&
    !!flightBooking.pricing &&
    bookingPayloadReady
  );
  const flightClassContinueReady =
  mode !== 'flights' || flightTravellersReady;
  const carApiGrandTotal = resolvedCarPricing ?
  Number(resolvedCarPricing.GrandTotal) :
  null;
  /** Price shown on the results card — checkout must match this, not a higher GetBookingdetails total. */
  const flightSearchQuotePrice = (() => {
    if (mode !== 'flights') return null;
    const listPrice =
      outbound?.price && outbound.price > 0 ? outbound.price : null;
    const cabinPrice = (selectedClass as { price?: number } | undefined)?.price;
    const cabinExtra = Number(selectedClass?.extra) || 0;
    // Real cabin upgrade (extra > 0): charge the cabin absolute fare.
    if (
      typeof cabinPrice === 'number' &&
      cabinPrice > 0 &&
      cabinExtra > 0
    ) {
      return cabinPrice;
    }
    // Same itinerary/cabin as the results card — keep the list quote.
    if (listPrice != null) return listPrice;
    if (typeof cabinPrice === 'number' && cabinPrice > 0) return cabinPrice;
    return null;
  })();
  const flightConfirmedGrandTotal = (() => {
    if (!flightBooking.pricing) return null;
    const grand = Number(flightBooking.pricing.GrandTotal) || 0;
    const totalFare = Number(flightBooking.pricing.TotalFare) || 0;
    const offered =
      Number(
        (flightBooking.pricing as { BookingOfferedFare?: string | number })
          .BookingOfferedFare
      ) || 0;
    const raw = grand || totalFare;
    // Prefer offered fare when API returns a higher published/grand total.
    const value =
      offered > 0 && raw > 0 ? Math.min(offered, raw) : raw || offered;
    return value > 0 ? value : null;
  })();
  // Never replace the search quote with a higher GetBookingdetails total — that
  // caused results (e.g. 189k) vs checkout (e.g. 195k) mismatches.
  const flightApiGrandTotal = (() => {
    if (flightSearchQuotePrice != null && flightSearchQuotePrice > 0) {
      if (
        flightConfirmedGrandTotal != null &&
        flightConfirmedGrandTotal <= flightSearchQuotePrice * 1.005
      ) {
        return flightConfirmedGrandTotal;
      }
      return flightSearchQuotePrice;
    }
    return flightConfirmedGrandTotal;
  })();
  const basePrice =
  mode === 'hotels' ?
  selectedHotel?.totalStayPrice ?? selectedHotel?.pricePerNight ?? 0 :
  mode === 'holiday' ?
  selectedTourModality?.rate ??
  tourDetails.details?.price ??
  selectedTour?.price ??
  0 :
  mode === 'minibus' ?
  carApiGrandTotal ?? selectedCar?.pricePerDay ?? 0 :
  mode === 'flights' ?
  flightApiGrandTotal ?? outbound?.price ?? 0 :
  mode === 'bus' ?
  busFareDisplayTotal :
  outbound?.price ?? 0;
  const returnPrice = returnTrip?.price ?? 0;
  const usesConfirmedFlightFare =
  mode === 'flights' && flightApiGrandTotal != null && flightApiGrandTotal > 0;
  const usesBusSeatFares =
  mode === 'bus' && (busConfirmedPrice != null && busConfirmedPrice > 0 || busSeatFareTotal > 0);
  const classExtra = usesConfirmedFlightFare || usesBusSeatFares ? 0 : (selectedClass?.extra ?? 0);
  const cancelExtra = 0;
  const insuranceExtra = 0;
  const couponDiscount = 0;
  const serviceFee =
  usesConfirmedFlightFare || usesBusSeatFares ?
  0 :
  mode === 'holiday' ?
  HOLIDAY_BOOKING_FEE :
  mode === 'bus' && (outbound?.price ?? 0) > 0 ?
  0 :
  10;
  const multiplier =
  mode === 'minibus' && carApiGrandTotal != null ?
  1 :
  mode === 'hotels' && selectedHotel?.totalStayPrice != null ?
  1 :
  mode === 'hotels' ?
  2 :
  mode === 'minibus' ?
  carRentalDays :
  1;
  const seatExtra =
  mode === 'bus' ?
  0 :
  selectedSeats.reduce((acc, seatId) => {
    const row = parseInt(seatId.replace(/\D/g, ''));
    return acc + (row <= 2 ? 150 : 0);
  }, 0);
  const total =
  mode === 'bus' ?
  basePrice + serviceFee - seniorDiscount :
  (basePrice + classExtra) * (
  mode === 'bus' || mode === 'train' ? travellers.length : 1) *
  multiplier +
  returnPrice +
  seatExtra +
  cancelExtra +
  insuranceExtra -
  couponDiscount -
  seniorDiscount +
  serviceFee;
  const fareBeforeGateway =
    mode === 'flights' && flightApiGrandTotal != null ?
    flightApiGrandTotal :
    mode === 'minibus' && carApiGrandTotal != null ?
    carApiGrandTotal :
    total;
  const selectedGatewayType = (() => {
    const method = resolvePayMethod();
    if (method.startsWith('api:')) {
      const id = Number(method.slice(4));
      return apiPaymentTypes.find((type) => type.Id === id);
    }
    if (isWalletPayMethod(method)) {
      return apiPaymentTypes.find((type) => paymentTypeKind(type) === 'wallet');
    }
    if (apiPaymentTypeId) {
      return apiPaymentTypes.find((type) => type.Id === apiPaymentTypeId);
    }
    return undefined;
  })();
  const gatewayPercent = parsePaymentPercent(selectedGatewayType?.Percentage);
  const gatewayFee = paymentConvenienceFee(fareBeforeGateway, gatewayPercent);
  const chargedTotal = paymentTotalWithFee(fareBeforeGateway, gatewayPercent);
  const bookingReference = flightPnr ?
  `PNR ${flightPnr}` :
  hotelBookingId ?
  `ID ${hotelBookingId}` :
  carBookingId ?
  `ID ${carBookingId}` :
  tourBookingId ?
  `REF ${tourBookingId}` :
  busBookingId ?
  `ID ${busBookingId}` :
  bookingId;
  const ticketBookingRef = (
  flightPnr ||
  hotelBookingId ||
  carBookingId ||
  tourBookingId ||
  busBookingId ||
  bookingId ||
  'PENDING'
  ).replace(/^#/, '');
  const openTicketPdf = (opts?: { download?: boolean }) => {
    revokeTicketPdfUrl(ticketPdfUrl);
    const input = {
      bookingRef: ticketBookingRef,
      pnr: flightPnr ?? undefined,
      className:
      mode === 'holiday' ?
      selectedTourModality?.name || 'Tour package' :
      mode === 'bus' ?
      outbound?.busType || 'Bus' :
      selectedClassName,
      seatLabel:
      selectedSeats.length > 0 ? selectedSeats.join(', ') : '—',
      passengers: travellers.
      map((t) => t.name?.trim()).
      filter((n): n is string => !!n),
      totalAmount: `ETB ${chargedTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      paymentStatus:
      bookingStatus === 'confirmed' ?
      'Paid' :
      bookingStatus === 'reserved' ?
      'Payment pending' :
      undefined,
      outbound,
      returnTrip: returnTrip ?? undefined,
      holidayTour:
      mode === 'holiday' && selectedTour ?
      {
        name: selectedTour.name,
        location:
        selectedTour.location || extractTourDestinationName(to) || to,
        packageName:
        selectedTourModality?.name || selectedTour.duration || 'Tour',
        travelFrom: hotelCheckInDateLabel || hotelCheckInDate || '—',
        travelTo: hotelCheckOutDateLabel || hotelCheckOutDate || '—',
        adults: String(hotelAdultCount)
      } :
      undefined
    };
    const built = buildTicketPdf(input);
    revokeTicketPdfUrl(built.blobUrl);
    setTicketPdfUrl(built.dataUri);
    setTicketPdfBlob(built.blob);
    setTicketPdfPreview(buildTicketPdfPreview(input));
    if (opts?.download) {
      const suffix =
      mode === 'holiday' ? 'tour-voucher' : mode === 'bus' ? 'bus-ticket' : 'ticket';
      void downloadPdfFile(
        built.blob,
        `mkash-${suffix}-${ticketBookingRef}.pdf`,
        built.dataUri
      );
      showToast('Ticket ready — use Share / Save to keep the PDF');
    }
    setShowTicketPdf(true);
  };
  const handleHolidayTicketAction = (
  action: 'preview' | 'pdf' | 'email' | 'share' | 'calendar' | 'invoice' | 'print'
  ) => {
    switch (action) {
      case 'preview':
      case 'print':
        openTicketPdf();
        break;
      case 'pdf':
      case 'invoice':
        openTicketPdf({ download: true });
        break;
      case 'email':
        handleEmailTicket();
        break;
      case 'share':
        void handleShareTicket();
        break;
      case 'calendar':
        handleAddToCalendar();
        break;
    }
  };
  useEffect(() => {
    return () => {
      revokeTicketPdfUrl(ticketPdfUrl);
    };
  }, [ticketPdfUrl]);
  const confirmHotelBooking = async (onDone: () => void) => {
    if (!selectedHotel || !selectHotelJson || selectHotelJson === '[]') {
      setSaveBookingError(
        'Hotel selection is missing. Go back and choose a hotel again.'
      );
      return;
    }
    const roomJson = confirmedHotelSelectRoomJson || jsonSelectRoom;
    const bookingJson = confirmedHotelBookingJson;
    if (!roomJson || roomJson === '[]' || !bookingJson || bookingJson === '[]') {
      setSaveBookingError(
        'Room fare is not confirmed yet. Go back and reserve a room again.'
      );
      return;
    }

    if (!(await ensureWalletCanPay(chargedTotal))) return;

    setSaveBookingLoading(true);
    setSaveBookingError(null);

    try {
      const result = await hotel4Booking({
        checkInDate: hotelCheckInDate,
        checkOutDate: hotelCheckOutDate,
        selectHotelJson,
        selectRoomJson: roomJson,
        bookingJson,
        travellers,
        roomCount: hotelRoomCount,
        adultCount: hotelAdultCount,
        currencyCode,
        currencyValue,
        defaultCurrencyValue: currencyValue
      });

      if (!result.success) {
        throw new Error(result.message || 'Hotel booking failed');
      }

      if (result.bookingId) {
        setHotelBookingId(result.bookingId);
      }

      finishBookingWithPayment(chargedTotal, result.bookingId || bookingId, onDone);
    } catch (err) {
      const msg = formatTravelApiError(err, 'Failed to save hotel booking');
      setSaveBookingError(msg);
    } finally {
      setSaveBookingLoading(false);
    }
  };
  const confirmCarBooking = async (onDone: () => void) => {
    if (!selectedCar || !jsonSelectCar || jsonSelectCar === '[]') {
      setSaveBookingError(
        'Car selection is missing. Go back and choose a car again.'
      );
      return;
    }

    if (!(await ensureWalletCanPay(chargedTotal))) return;

    setSaveBookingLoading(true);
    setSaveBookingError(null);

    try {
      if (carUsesSampleInventory) {
        const demoBookingId = `DEMO${Date.now().toString().slice(-8)}`;
        setCarBookingId(demoBookingId);
        finishBookingWithPayment(
          chargedTotal,
          demoBookingId,
          onDone
        );
        return;
      }

      if (!carSelection.pricing) {
        throw new Error(
          'Car fare is not confirmed yet. Go back and select a car again.'
        );
      }

      const bookingJson = confirmedCarBookingJson;
      if (!bookingJson || bookingJson === '[]') {
        throw new Error(
          'Car fare is not confirmed yet. Go back and select a car again.'
        );
      }

      const result = await carBooking({
        jsonSelectCar,
        bookingJson,
        travellers,
        defaultCurrency: carCurrencyCode,
        defaultCurrencyValue: carCurrencyValue,
        carMarkup: CAR_SELECT_DEFAULT_MARKUP,
        city: contactCity.trim() || 'Addis Ababa',
        country: contactCountry.trim() || 'Ethiopia - ET'
      });

      if (!result.success) {
        throw new Error(result.message || 'Car booking failed');
      }

      if (result.bookingId) {
        setCarBookingId(result.bookingId);
      }

      finishBookingWithPayment(
        chargedTotal,
        result.bookingId || bookingId,
        onDone
      );
    } catch (err) {
      const msg = formatTravelApiError(err, 'Failed to save car booking');
      setSaveBookingError(msg);
    } finally {
      setSaveBookingLoading(false);
    }
  };
  const confirmTourBooking = async (
    onDone: () => void,
    methodOverride?: string
  ) => {
    if (!selectedTour?.code) {
      const msg =
        'Tour selection is missing. Go back and choose a tour again.';
      setSaveBookingError(msg);
      return;
    }

    const lead = travellers[0];
    const firstName = (
      lead?.firstName?.trim() ||
      lead?.name?.trim().split(/\s+/)[0] ||
      ''
    ).trim();
    const email = (lead?.email || contactEmail || '').trim();
    const phone = (lead?.mobile || contactPhone || '').replace(/\D/g, '');

    if (!firstName) {
      const msg = 'Enter the lead traveller’s first name before booking.';
      setSaveBookingError(msg);
      return;
    }
    if (!email) {
      const msg = 'Enter an email address before booking.';
      setSaveBookingError(msg);
      return;
    }
    if (phone.length < 8) {
      const msg = 'Enter a valid mobile number before booking.';
      setSaveBookingError(msg);
      return;
    }
    if (!holidayTravellersReady) {
      const msg =
        `Complete details for all ${travellers.length} travellers before booking (including passport expiry on/after the day after travel ends).`;
      setSaveBookingError(msg);
      return;
    }
    if (!hotelCheckInDate || !hotelCheckOutDate) {
      const msg = 'Travel dates are missing. Go back and select dates.';
      setSaveBookingError(msg);
      return;
    }

    const method = resolvePayMethod(methodOverride);
    if (methodOverride) setPayMethod(method);

    // Book in source ETB (list TripCost); display currency goes in ChangeCurrency.
    const sourceAmount =
      selectedTour.price ||
      tourDetails.details?.priceBreakdown?.total ||
      tourDetails.details?.price ||
      selectedTourModality?.rate ||
      total;
    const destCity =
      extractTourDestinationName(to) ||
      selectedTour.location ||
      tourDetails.details?.location ||
      'Dubai';

    // Wallet only — Pay Later / COD / card skip balance and run TourBooking API (temporary).
    if (!(await ensureWalletCanPay(chargedTotal, method))) return;

    setSaveBookingLoading(true);
    setSaveBookingError(null);

    try {
      const leadLastName = (
        lead?.lastName?.trim() ||
        lead?.name?.trim().split(/\s+/).slice(1).join(' ') ||
        ''
      ).trim();
      const ticketType =
        selectedTourModality?.name ||
        'Standard ticket';
      const duration =
        selectedTour.duration ||
        tourDetails.details?.duration ||
        '3 days';
      const displayCurrency = (() => {
        const code = String(currencyCode || 'ETB')
          .trim()
          .toUpperCase();
        return /^[A-Z]{3}$/.test(code) ? code : 'ETB';
      })();
      const rate =
        Number.isFinite(currencyValue) && currencyValue > 0 ?
          currencyValue :
          1;

      const apiTour = selectedTour.apiPayload as
        | Record<string, unknown>
        | undefined;
      const packageCategoryId =
        selectedTour.categoryId ??
        apiTour?.PackageCategoryId ??
        apiTour?.CategoryId;
      const imgUrl = String(
        apiTour?.image1 ||
          apiTour?.ImgURL ||
          selectedTour.image ||
          ''
      );

      // Ensure every passenger row has contact (GuestAPI multi-pax sample).
      const bookingTravellers = travellers.map((tr, idx) => ({
        ...tr,
        email: tr.email?.trim() || email,
        mobile: (tr.mobile || phone).replace(/\D/g, ''),
        nationality: tr.nationality?.trim() || 'Ethiopian',
        country: tr.country?.trim() || 'Ethiopia',
        title: tr.title || (tr.paxType === 'Child' ? 'Ms' : 'Mr'),
        gender:
          tr.gender ||
          mapTourBookingGender(undefined, tr.title) ||
          (idx === 0 ? mapTourBookingGender(lead?.gender, lead?.title) : 'Male')
      }));

      const result = await tourBooking({
        clientFirstName: firstName,
        lastName: leadLastName,
        gender: mapTourBookingGender(
          bookingTravellers[0]?.gender,
          bookingTravellers[0]?.title
        ),
        emailId: email,
        location:
          contactCity.trim() ||
          stripCityLabel(from) ||
          'Addis Ababa',
        destCity,
        noOfAdults: holidayTravellerCounts.adultCount,
        phoneNo: phone,
        travelFromDate: hotelCheckInDate,
        travelToDate: hotelCheckOutDate,
        noOfChildren: holidayTravellerCounts.childrenCount,
        noOfInfants: holidayTravellerCounts.infantCount,
        amount: sourceAmount,
        tourId: selectedTour.code,
        tourName:
          selectedTour.name ||
          tourDetails.details?.name ||
          'Tour package',
        ticketType,
        duration,
        currency: 'ETB',
        changeCurrency: displayCurrency,
        changeCurrencyRate: rate,
        packageCategoryId,
        imgUrl,
        travellers: bookingTravellers,
        holidayDetail: apiTour
      });

      if (!result.success) {
        throw new Error(result.message || 'Tour booking failed');
      }

      if (result.referenceNumber) {
        setTourBookingId(result.referenceNumber);
      }

      finishBookingWithPayment(
        chargedTotal,
        result.referenceNumber || bookingId,
        onDone,
        method
      );
    } catch (err) {
      const msg = formatTravelApiError(err, 'Tour booking failed');
      setSaveBookingError(msg);
    } finally {
      setSaveBookingLoading(false);
    }
  };
  const confirmBusBooking = async (onDone: () => void) => {
    if (!outbound) {
      setSaveBookingError('Select a bus before booking.');
      return;
    }
    if (!selectedBoardingPoint || !selectedDroppingPoint) {
      setSaveBookingError('Select boarding and dropping points.');
      return;
    }
    if (selectedSeats.length === 0) {
      setSaveBookingError('Select at least one seat.');
      return;
    }

    const departIso = (() => {
      const apiDate = formatFlightApiDate(parseBusTravelDate(travelDate));
      const [dd, mm, yyyy] = apiDate.split('-');
      return `${yyyy}-${mm}-${dd}`;
    })();

    const seatPayload = selectedSeats.map((seatId) => {
      const apiSeat = findBusApiSeat(busApiSeats, seatId);
      return {
        seatName: apiSeat?.seatId ?? seatId,
        seatFare: apiSeat?.price ?? outbound.price ?? 0
      };
    });

    const jsonBus =
      busSelectBusJson ||
      buildJsonSelectBusForBooking(outbound, {
        originLabel: stripCityLabel(from),
        destinationLabel: stripCityLabel(to),
        travelDateIso: departIso,
        arrivalDateIso: departIso
      });
    const jsonSeat =
      busSelectSeatJson || buildJsonSelectSeat(seatPayload);
    const bookingJson = buildBusBookingJson();
    const lead = travellers[0];
    const contactEmailValue = contactEmail || lead?.email || '';
    const contactMobileValue = contactPhone || lead?.mobile || '';
    const bookingTravellers = travellers.map((tr) => ({
      ...tr,
      email: tr.email?.trim() || contactEmailValue,
      mobile: (tr.mobile || contactMobileValue).replace(/\D/g, ''),
      nationality: tr.nationality?.trim() || 'Ethiopian',
      country: tr.country?.trim() || 'Ethiopia',
      title: tr.title || (tr.paxType === 'Child' ? 'Ms' : 'Mr'),
      gender: tr.gender || mapTourBookingGender(undefined, tr.title)
    }));
    const contactDetailJson = buildBusContactDetailJson(
      bookingTravellers[0] || { name: 'Guest User' },
      {
        city: contactCity || stripCityLabel(from) || 'Addis Ababa',
        country: bookingTravellers[0]?.country,
        email: contactEmailValue,
        mobile: contactMobileValue
      }
    );
    const reqPassangerJson = buildBusReqPassengerJson(bookingTravellers, {
      seatFare: outbound.price,
      defaultEmail: contactEmailValue,
      defaultMobile: contactMobileValue
    });

    if (!busTravellersReady) {
      setSaveBookingError(
        `Complete details for all ${travellers.length} travellers before booking.`
      );
      return;
    }

    const method = resolvePayMethod();
    // Wallet only — Pay Later / COD / mobile / bank skip balance and run Bus_Booking.
    if (!(await ensureWalletCanPay(chargedTotal, method))) return;

    setSaveBookingLoading(true);
    setSaveBookingError(null);

    try {
      const result = await busBooking({
        jsonSelectBus: jsonBus,
        jsonSelectSeat: jsonSeat,
        bookingJson,
        contactDetailJson,
        reqPassangerJson,
        boardingPointId: selectedBoardingPoint,
        droppingPointId: selectedDroppingPoint
      });

      if (!result.success) {
        throw new Error(result.message || 'Bus booking failed');
      }

      let resolvedBusBookingId = result.bookingId || '';
      if (result.bookingId) {
        setBusBookingId(result.bookingId);
      } else {
        try {
          const local = JSON.parse(bookingJson) as {
            BookingNumber?: string;
            BookingCode?: string;
            BookingId?: string;
          };
          const fallback =
            local.BookingNumber || local.BookingCode || local.BookingId;
          if (fallback) {
            resolvedBusBookingId = String(fallback);
            setBusBookingId(resolvedBusBookingId);
          }
        } catch {
          // keep previous
        }
      }
      finishBookingWithPayment(
        chargedTotal,
        resolvedBusBookingId || bookingId,
        onDone,
        method
      );
    } catch (err) {
      setSaveBookingError(
        formatTravelApiError(err, 'Failed to save bus booking')
      );
    } finally {
      setSaveBookingLoading(false);
    }
  };
  const confirmBusSeatSelection = async (): Promise<boolean> => {
    if (!outbound || selectedSeats.length === 0) {
      showToast('Select your seats first');
      return false;
    }

    const bookedSelected = selectedSeats.filter((seatId) => {
      const apiSeat = findBusApiSeat(busApiSeats, seatId);
      return apiSeat?.status === 'booked' || apiSeat?.isAvailable === false;
    });
    if (bookedSelected.length > 0) {
      showToast('One or more selected seats are booked. Choose available seats.');
      return false;
    }

    const departIso = (() => {
      const apiDate = formatFlightApiDate(parseBusTravelDate(travelDate));
      const [dd, mm, yyyy] = apiDate.split('-');
      return `${yyyy}-${mm}-${dd}`;
    })();

    const seatPayload = selectedSeats.map((seatId) => {
      const apiSeat = findBusApiSeat(busApiSeats, seatId);
      return {
        seatName: apiSeat?.seatId ?? seatId,
        seatFare: apiSeat?.price ?? outbound.price ?? 0
      };
    });

    const jsonBus = buildJsonSelectBusForBooking(outbound, {
      originLabel: stripCityLabel(from),
      destinationLabel: stripCityLabel(to),
      travelDateIso: departIso,
      arrivalDateIso: departIso
    });
    const jsonSeat = buildJsonSelectSeat(seatPayload);

    setSaveBookingLoading(true);
    setSaveBookingError(null);
    try {
      const result = await bus3SelectBus(jsonBus, jsonSeat, {
        currencyCode: displayCurrency,
        currencyRate: displayCurrency === 'ETB' ? 1 : currencyValue
      });
      setBusSelectBusJson(result.busJson !== '[]' ? result.busJson : jsonBus);
      setBusSelectSeatJson(result.seatJson !== '[]' ? result.seatJson : jsonSeat);
      if (result.confirmedPrice > 0) {
        // Keep API amount as-is; busFareDisplayTotal normalizes to UI currency.
        setBusConfirmedPrice(result.confirmedPrice);
      } else {
        setBusConfirmedPrice(
          seatPayload.reduce((s, x) => s + x.seatFare, 0) || outbound.price || null
        );
      }
      return true;
    } catch (err) {
      // Still allow continue with list fare if Bus3 fails
      setBusSelectBusJson(jsonBus);
      setBusSelectSeatJson(jsonSeat);
      setBusConfirmedPrice(
        seatPayload.reduce((s, x) => s + x.seatFare, 0) || outbound.price || null
      );
      showToast(
        err instanceof Error ?
          `Continuing with listed fare (${err.message})` :
          'Continuing with listed fare'
      );
      return true;
    } finally {
      setSaveBookingLoading(false);
    }
  };
  const confirmFlightBooking = async (): Promise<boolean> => {
    if (!outbound || !flightMainPayload) {
      setSaveBookingError(
        'Flight selection is missing. Go back and choose a flight again.'
      );
      return false;
    }

    const passengerCounts = {
      adultCount: flightAdultCount,
      childrenCount: flightChildrenCount,
      infantCount: flightInfantCount
    };
    const expectedTravellers = totalPassengerCount(passengerCounts);
    if (travellers.length !== expectedTravellers) {
      setSaveBookingError(
        `Enter details for all ${expectedTravellers} travellers before reserving.`
      );
      return false;
    }
    const incomplete = travellers.find((tr) => !isTravellerDetailsComplete(tr));
    if (incomplete) {
      setSaveBookingError('Complete every traveller form before reserving.');
      return false;
    }

    const payTotal =
      parseMoneyAmount(chargedTotal, 0) ||
      parseMoneyAmount(flightApiGrandTotal, 0) ||
      parseMoneyAmount(total, 0) ||
      parseMoneyAmount(outbound?.price, 0);
    if (!(await ensureWalletCanPay(payTotal))) return false;

    setSaveBookingLoading(true);
    setSaveBookingError(null);

    const bookingCatalog =
      pinnedFlightCatalog.length > 0 ?
        pinnedFlightCatalog :
        flightSearchRawRef.current.length > 0 ?
          flightSearchRawRef.current :
          flightList.raw;

    // Keep catalog pinned for the rest of checkout (SubRows are required for connections).
    if (bookingCatalog.length > 0) {
      flightSearchRawRef.current = bookingCatalog;
      if (flightSearchCatalog.length === 0) {
        setFlightSearchCatalog(bookingCatalog);
      }
    }

    const bookingMain = resolveBookableNdcMain(
      flightMainPayload,
      bookingCatalog
    );
    const bookingContentSource = String(
      bookingMain.ConnectionIndexFirst ??
        bookingMain.ConnectionIndexForward ??
        bookingMain.ConnectionIndex ??
        flightConnectionSource ??
        'GDS'
    );

    const runBookingDetails = (jsonstring: string) =>
      getBookingDetails({
        traceId: String(
          bookingMain.ItemId ?? flightMainPayload.ItemId ?? flightMainRow?.ItemId ?? ''
        ).replace(/_PC$/i, ''),
        tripType: resolveBookingTripType(bookingMain),
        contentSource: bookingContentSource,
        jsonstring,
        adultCount: flightAdultCount,
        childrenCount: flightChildrenCount,
        infantCount: flightInfantCount,
        currencyCode,
        currencyValue,
        flightMarkup: 0
      });

    try {
      const rowAttempts = buildBookingRowAttempts(
        bookingMain,
        bookingCatalog,
        resolvedBookingRows.length > 0 ? resolvedBookingRows : flightBookingRows
      );

      let selectedRowJson = '';
      let confirmedGrandTotal = 0;
      let confirmedDetails: FlightListItem[] = [];
      let lastApiMessage = '';
      let fareConfirmed = false;

      // Always confirm SelectedRowJson with GetBookingdetails (try Main+SubRows
      // variants) so SaveBooking uses the exact payload GuestAPI accepts.
      const tryConfirm = async () => {
        for (const rows of rowAttempts) {
          const json = serializeBookingRows(
            bookingMain,
            rows,
            passengerCounts
          );
          if (!json || json === '[]') continue;

          const detailsResult = await runBookingDetails(json);
          if (detailsResult.pricing) {
            selectedRowJson = json;
            confirmedGrandTotal = parseMoneyAmount(
              detailsResult.pricing.GrandTotal,
              0
            );
            confirmedDetails = detailsResult.details || [];
            fareConfirmed = true;
            return;
          }

          const msg = String(detailsResult.apiMessage || '');
          if (msg) lastApiMessage = msg;

          const expected = parseExpectedBookingRowCount(msg);
          if (expected != null && rows.length !== expected) {
            const sized = collectBookingRowsForExpectedCount(
              bookingMain,
              bookingCatalog,
              expected
            );
            if (sized.length === expected || sized.length !== rows.length) {
              const sizedJson = serializeBookingRows(
                bookingMain,
                sized,
                passengerCounts
              );
              const retry = await runBookingDetails(sizedJson);
              if (retry.pricing) {
                selectedRowJson = sizedJson;
                confirmedGrandTotal = parseMoneyAmount(
                  retry.pricing.GrandTotal,
                  0
                );
                confirmedDetails = retry.details || [];
                fareConfirmed = true;
                return;
              }
              if (retry.apiMessage) lastApiMessage = String(retry.apiMessage);
            }
          }
        }
      };

      await tryConfirm();

      // Never SaveBooking on an unconfirmed fare after format/host faults —
      // that surfaces as "rejected by the airline host" on Pay now.
      if (!fareConfirmed || !selectedRowJson || selectedRowJson === '[]') {
        throw new Error(
          lastApiMessage ||
            'Could not confirm this fare with the airline. Go back, reselect the flight or cabin, and try again.'
        );
      }

      // Always sanitize NDC / Qatar fare-rule junk before SaveBooking.
      if (
        isNdcContentSource(bookingContentSource) ||
        hasBrokenNdcFareRules(confirmedDetails)
      ) {
        try {
          const parsed = JSON.parse(selectedRowJson) as FlightListItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            selectedRowJson = JSON.stringify(
              sanitizeBookingRowsForSave(parsed)
            );
          }
        } catch {
          // keep selectedRowJson as-is
        }
      }

      const paymentId = `MKASH-${Date.now()}`;
      const grandTotal =
        confirmedGrandTotal ||
        parseMoneyAmount(flightApiGrandTotal, 0) ||
        parseMoneyAmount(total, 0) ||
        parseMoneyAmount(outbound?.price, 0);

      const buildPayload = (rowJson: string) =>
        buildSaveBookingPayload({
          selectedRowJson: rowJson,
          travellers,
          debitAmount: grandTotal.toFixed(2),
          paymentId,
          currencyCode,
          currencyValue,
          flightMarkup: 0,
          contact: {
            email: contactEmail.trim(),
            mobile: contactPhone.replace(/\D/g, ''),
            houseNo: contactHouseNo.trim() || contactCity.trim(),
            address: contactAddress.trim(),
            city: contactCity.trim(),
            zipCode: contactZipCode.trim(),
            country: contactCountry.trim(),
            phoneCode: contactPhoneCode.trim()
          }
        });

      // SaveBooking must always run once fare JSON is accepted.
      let result;
      try {
        result = await saveBooking(buildPayload(selectedRowJson));
      } catch (saveErr) {
        const saveMsg = formatTravelApiError(saveErr, 'Failed to save booking');
        // Retry once with sanitized NDC fare-rule fields (StartIndex / format).
        if (/startindex|dictionary|correct format|expected\s+\d+\s+rows?/i.test(saveMsg)) {
          try {
            const parsed = JSON.parse(selectedRowJson) as FlightListItem[];
            let cleaned = sanitizeBookingRowsForSave(
              Array.isArray(parsed) ? parsed : []
            );
            const expectedSave =
              parseExpectedBookingRowCount(saveMsg) ||
              parseExpectedBookingRowCount(lastApiMessage);
            if (
              expectedSave != null &&
              cleaned.length > 0 &&
              cleaned.length !== expectedSave
            ) {
              cleaned = padBookingRowsToCount(
                bookingMain,
                cleaned,
                expectedSave
              );
            } else if (
              /dictionary/i.test(saveMsg) &&
              isNdcContentSource(bookingContentSource) &&
              cleaned.length > 0
            ) {
              // Qatar NDC 3-leg often needs StopCount+3 rows when Expected-N
              // was not returned on the SaveBooking fault itself.
              const stopCount = Number(bookingMain.StopCount);
              if (Number.isFinite(stopCount) && stopCount >= 2) {
                const ndcExpected = stopCount + 3;
                if (cleaned.length < ndcExpected) {
                  cleaned = padBookingRowsToCount(
                    bookingMain,
                    cleaned,
                    ndcExpected
                  );
                }
              }
            }
            if (cleaned.length > 0) {
              result = await saveBooking(
                buildPayload(JSON.stringify(cleaned))
              );
            } else {
              throw saveErr;
            }
          } catch {
            throw new Error(
              /startindex|dictionary/i.test(saveMsg) ?
                'This airline fare could not be ticketed. Go back, pick another cabin or airline (e.g. Ethiopian Airlines), and try again.' :
                saveMsg
            );
          }
        } else {
          throw saveErr;
        }
      }

      if (result.pnr) {
        setFlightPnr(result.pnr);
      }
      lastFlightBookingRefForDebit.current = result.pnr || bookingId;

      onBookingComplete?.();
      return true;
    } catch (err) {
      const message = formatTravelApiError(err, 'Failed to save booking');
      const friendly = message.toLowerCase().includes('dictionary') ?
      'Booking could not be completed for this flight. Go back, reselect the flight, and try again.' :
      /expected\s+\d+\s+rows?/i.test(message) ?
      'Flight segment rows are incomplete for this ticket. Go back, reselect the flight (including return), and try again.' :
      /startindex/i.test(message) ?
      'This airline fare could not be ticketed. Go back, pick another cabin or airline, and try again.' :
      /correct format/i.test(message) ?
      'Booking details were rejected by the airline host. Go back, reselect the flight, and try again.' :
      message;
      setSaveBookingError(friendly);
      return false;
    } finally {
      setSaveBookingLoading(false);
    }
  };
  const reserveFlightBooking = async () => {
    if (saveBookingLoading) return;
    setSaveBookingError(null);
    const saved = await confirmFlightBooking();
    if (saved) {
      setBookingStatus('reserved');
      setScreen('ticket');
    }
  };
  const goBackOneStep = () => {
    if (showJourney) {
      setShowJourney(false);
      return;
    }
    if (screen === 'class' && showRoomSelection) {
      setShowRoomSelection(false);
      return;
    }
    if (screen === 'points' && pointsStep === 'dropping') {
      setPointsStep('boarding');
      return;
    }
    if (screen === 'class' && mode === 'flights') {
      if (flightCheckoutStep === 'travellers') {
        setFlightCheckoutStep('cabin');
        return;
      }
      setClassId('');
      setFlightCheckoutStep('cabin');
      setScreen(isRound ? 'return' : 'results');
      return;
    }
    if (screen === 'tickets' && mode === 'holiday') {
      setScreen('class');
      return;
    }
    if (screen === 'results') {
      onExit();
      return;
    }
    setScreen(
      screen === 'return' ?
      'results' :
      screen === 'points' ?
      isRound ?
      'return' :
      'results' :
      screen === 'class' ?
      mode === 'bus' || mode === 'train' ?
      'points' :
      isRound ?
      'return' :
      'results' :
      screen === 'tickets' ?
      'class' :
      screen === 'seats' ?
      mode === 'bus' || mode === 'train' ?
      'points' :
      'class' :
      screen === 'passenger' ?
      mode === 'holiday' ?
      'tickets' :
      mode === 'bus' || mode === 'train' ?
      'seats' :
      'class' :
      screen === 'payment' ?
      'passenger' :
      'payment'
    );
  };

  useEffect(() => {
    if (!hardwareBackRef) return;
    hardwareBackRef.current = goBackOneStep;
    return () => {
      hardwareBackRef.current = null;
    };
  });

  const Header = ({ showShare }: {showShare?: boolean;}) =>
  <div
    className="px-5 pt-4 pb-3 flex items-center gap-3 ui-funnel-header w-full">
    
      <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        goBackOneStep();
      }}
      aria-label="Go back"
      className="ui-touch w-11 h-11 shrink-0 rounded-full glass-pill flex items-center justify-center shadow-ios-xs relative z-10">
      
        <ArrowLeft
        className="w-4 h-4 pointer-events-none"
        style={{
          color: KTA.textPrimary
        }} />
      
      </button>
      <div className="flex-1 min-w-0 text-center px-1">
        {mode === 'holiday' && screen === 'ticket' ?
      null :
      mode === 'hotels' || mode === 'minibus' || mode === 'holiday' ?
      <p
        className="text-[15px] font-bold truncate"
        style={{
          color: KTA.textPrimary
        }}>
        
            {mode === 'hotels' ?
        `${to === 'Where to?' ? 'Addis Ababa' : to} · 16 Jun → 18 Jun` :
        mode === 'holiday' && screen === 'results' ?
        'Travel' :
        mode === 'holiday' &&
        (screen === 'tickets' || screen === 'passenger' || screen === 'payment') ?
        'Travel' :
        mode === 'holiday' ?
        `${selectedTour?.name || extractTourDestinationName(to) || to}` :
        `${from} · ${carPickupDate ? formatCarDateShort(carPickupDate) : '—'} → ${carReturnDate ? formatCarDateShort(carReturnDate) : '—'}`}
          </p> :

      <div className="flex items-center justify-center gap-1.5 min-w-0">
            <span
          className="text-[14px] sm:text-[15px] font-bold truncate min-w-0 flex-1 text-right"
          style={{
            color: KTA.textPrimary
          }}>
          
              {from}
            </span>
            {mode === 'bus' ?
            <Bus
          className="w-4 h-4 shrink-0"
          style={{
            color: KTA.green
          }} /> :

            <Plane
          className="w-4 h-4 shrink-0 rotate-90"
          style={{
            color: KTA.green
          }} />
            }
            <span
          className="text-[14px] sm:text-[15px] font-bold truncate min-w-0 flex-1 text-left"
          style={{
            color: KTA.textPrimary
          }}>
          
              {to}
            </span>
          </div>
      }
        {!(mode === 'holiday' && screen === 'ticket') &&
      <p
        className="text-[11px] mt-0.5 truncate"
        style={{
          color: KTA.textSecondary
        }}>
        
          {mode === 'hotels' ?
        `${travellers.length} Guest${travellers.length > 1 ? 's' : ''} · ${roomCount} Room${roomCount > 1 ? 's' : ''}` :
        mode === 'minibus' ?
        '1 Driver' :
        mode === 'holiday' ?
        `${hotelCheckInDateLabel || hotelCheckInDate || '—'} → ${hotelCheckOutDateLabel || hotelCheckOutDate || '—'} · ${hotelAdultCount} Adult${hotelAdultCount === 1 ? '' : 's'}${hotelChildCount > 0 ? ` · ${hotelChildCount} Child${hotelChildCount === 1 ? '' : 'ren'}` : ''}${hotelInfantCount > 0 ? ` · ${hotelInfantCount} Infant${hotelInfantCount === 1 ? '' : 's'}` : ''}` :
        mode === 'bus' || mode === 'train' ?
        `${formatBusTravelDateLabel(parseBusTravelDate(travelDate))} · ${travellers.length} Adult${travellers.length === 1 ? '' : 's'}${outbound?.busType ? ` · ${outbound.busType}` : ''}` :
        tripType === 'round' && flightReturnDateLabel ?
        `${flightDepartDateLabel} → ${flightReturnDateLabel} · ${flightPassengerSummary} · ${selectedClassName}` :
        `${flightDepartDateLabel} · ${flightPassengerSummary} · ${selectedClassName}`}
        </p>
      }
      </div>
      <button className="w-9 h-9 shrink-0 rounded-full glass-pill flex items-center justify-center shadow-ios-xs">
        {showShare ?
      <Share2
        className="w-4 h-4"
        style={{
          color: KTA.textPrimary
        }} /> :


      <Pencil
        className="w-4 h-4"
        style={{
          color: KTA.textPrimary
        }} />

      }
      </button>
    </div>;

  const sortChipOptions =
    mode === 'hotels' ?
      ['Guest rating', 'Recommended', 'Cheapest price'] :
      mode === 'minibus' ?
        ['Seats', 'Recommended', 'Cheapest price'] :
        ['Departure time', 'Recommended', 'Cheapest price'];

  const hotelStarsQuickOn = hotelFilters.minStars !== 'any';
  const carAutoQuickOn = carFilters.transmission === 'Auto';

  const SortChips = () =>
  <div className="flex gap-2 overflow-x-auto no-scrollbar px-[18px] py-3">
      {mode === 'hotels' &&
    <button
      type="button"
      onClick={() =>
      setHotelFilters((f) => ({
        ...f,
        minStars: f.minStars === 'any' ? '3' : 'any'
      }))
      }
      className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold inline-flex items-center gap-1 transition-colors touch-manipulation"
      style={{
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: hotelStarsQuickOn ? KTA.green : KTA.border,
        backgroundColor: hotelStarsQuickOn ? '#ECFDF3' : '#fff',
        color: hotelStarsQuickOn ? KTA.green : KTA.textSecondary
      }}>
      
        {hotelStarsQuickOn && <Check className="w-3.5 h-3.5" />}
        3★ & up
      </button>
    }
      {mode === 'minibus' &&
    <button
      type="button"
      onClick={() =>
      setCarFilters((f) => ({
        ...f,
        transmission: f.transmission === 'Auto' ? 'any' : 'Auto'
      }))
      }
      className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold inline-flex items-center gap-1 transition-colors touch-manipulation"
      style={{
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: carAutoQuickOn ? KTA.green : KTA.border,
        backgroundColor: carAutoQuickOn ? '#ECFDF3' : '#fff',
        color: carAutoQuickOn ? KTA.green : KTA.textSecondary
      }}>
      
        {carAutoQuickOn && <Check className="w-3.5 h-3.5" />}
        Automatic
      </button>
    }
      {(mode === 'hotels' || mode === 'minibus') &&
    <div
      className="shrink-0 w-px my-1"
      style={{ backgroundColor: KTA.border }} />
    }
      {sortChipOptions.map((s) => {
      const active = sort === s;
      return (
        <button
          key={s}
          type="button"
          onClick={() => setSort(s)}
          className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors touch-manipulation"
          style={{
            backgroundColor: active ? KTA.blue : '#fff',
            color: active ? '#fff' : KTA.textSecondary,
            border: `1px solid ${active ? KTA.blue : KTA.border}`
          }}>
          
            {s === 'Cheapest price' ? 'Cheapest' : s}
          </button>);

    })}
    </div>;

  const HotelCard = ({
    hotel,
    onSelect



  }: {hotel: Hotel;onSelect: () => void;}) =>
  <button
    onClick={onSelect}
    className="w-full text-left glass-card overflow-hidden mb-3 active:scale-[0.98] transition-all duration-ios"
    style={{
      borderColor: KTA.border
    }}>
    
      <div className="h-[140px] relative">
        {hotel.image ?
      <img
        src={hotel.image}
        alt={hotel.name}
        className="w-full h-full object-cover" /> :


      <div
        className="w-full h-full"
        style={{
          backgroundColor: hotel.color
        }} />

      }
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          {hotel.tags.map((t) =>
        <span
          key={t}
          className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/90 shadow-sm"
          style={{
            color: KTA.textPrimary
          }}>
          
              {t}
            </span>
        )}
        </div>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p
            className="text-[16px] font-bold leading-tight"
            style={{
              color: KTA.textPrimary
            }}>
            
              {hotel.name}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center">
                {[...Array(hotel.stars)].map((_, i) =>
              <Star
                key={i}
                className="w-3 h-3"
                style={{
                  color: KTA.orange,
                  fill: KTA.orange
                }} />

              )}
              </div>
              <span
              className="text-[11px]"
              style={{
                color: KTA.textSecondary
              }}>
              
                ({hotel.reviews})
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 mb-3 overflow-x-auto hide-scrollbar">
          {hotel.amenities.map((a) =>
        <span
          key={a}
          className="text-[11px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap"
          style={{
            backgroundColor: `${KTA.blue}10`,
            color: KTA.blue
          }}>
          
              {a}
            </span>
        )}
        </div>
        <div
        className="flex items-end justify-between border-t pt-3 mt-1"
        style={{
          borderColor: KTA.border
        }}>
        
          <p
          className="text-[12px] font-semibold"
          style={{
            color: KTA.textSecondary
          }}>
          
            {hotel.roomType}
          </p>
          <div className="text-right">
            <p
            className="text-[18px] font-bold leading-none"
            style={{
              color: KTA.textPrimary
            }}>
            
              {cur(hotel.pricePerNight, hotel.currency || currencyCode)}
            </p>
            <p
            className="text-[11px] mt-0.5"
            style={{
              color: KTA.textSecondary
            }}>
            
              per night
            </p>
          </div>
        </div>
      </div>
    </button>;

  const CarCard = ({
    car,
    onSelect



  }: {car: CarRental;onSelect: () => void;}) =>
  <button
    onClick={onSelect}
    className="w-full text-left glass-card overflow-hidden mb-3 active:scale-[0.98] transition-all duration-ios"
    style={{
      borderColor: KTA.border
    }}>
    
      <div className="h-[120px] relative">
        {car.image ?
      <img
        src={car.image}
        alt={car.name}
        className="w-full h-full object-cover" /> :


      <div
        className="w-full h-full"
        style={{
          backgroundColor: car.color
        }} />

      }
        <span
        className="absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/90 shadow-sm"
        style={{
          color: KTA.textPrimary
        }}>
        
          {car.tags[0]}
        </span>
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p
            className="text-[16px] font-bold leading-tight"
            style={{
              color: KTA.textPrimary
            }}>
            
              {car.name}
            </p>
            <p
            className="text-[12px] mt-0.5"
            style={{
              color: KTA.textSecondary
            }}>
            
              {car.type} · {car.transmission}
            </p>
          </div>
          <div className="text-right">
            <p
            className="text-[18px] font-bold leading-none"
            style={{
              color: KTA.textPrimary
            }}>
            
              {cur(car.pricePerDay, car.currency || currencyCode)}
            </p>
            <p
            className="text-[11px] mt-1"
            style={{
              color: KTA.textSecondary
            }}>
            
              per day
            </p>
          </div>
        </div>
        <div
        className="flex items-center gap-3 mt-3 border-t pt-3"
        style={{
          borderColor: KTA.border
        }}>
        
          <span
          className="text-[12px] font-semibold px-2 py-1 rounded-md"
          style={{
            backgroundColor: '#f1f5f9',
            color: KTA.textSecondary
          }}>
          
            {car.seats} Seats
          </span>
          <span
          className="text-[12px] font-semibold px-2 py-1 rounded-md"
          style={{
            backgroundColor: '#f1f5f9',
            color: KTA.textSecondary
          }}>
          
            {car.supplier}
          </span>
        </div>
      </div>
    </button>;

  const TripCard = ({
    trip,
    onSelect



  }: {trip: Trip;onSelect: () => void;}) => {
    // Premium flight card (flights only)
    if (mode === 'flights') {
      const minPrice = trips.length ? Math.min(...trips.map((t) => t.price)) : 0;
      const isBestValue = trip.price === minPrice && trips.length > 1;
      const apiItem = trip.apiPayload as FlightListItem | undefined;
      const fareChips = apiItem ?
      flightFareHeaderChips(apiItem) :
      [];
      return (
        <motion.button
          initial={{
            opacity: 0,
            y: 12
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          whileTap={{
            scale: 0.985
          }}
          transition={{
            duration: 0.25
          }}
          onClick={onSelect}
          className="w-full text-left glass-card p-4 mb-3 relative"
          style={{
            borderColor: KTA.border
          }}>
          
          {isBestValue &&
          <span
            className="absolute -top-2 left-4 text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{
              backgroundColor: KTA.green
            }}>
            
              Best value
            </span>
          }
          {/* Airline header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AirlineLogo
                src={trip.operatorLogo}
                name={trip.operator}
                initial={trip.operatorInitial}
                color={trip.operatorColor}
              />
              <div>
                <p
                  className="text-[13px] font-bold leading-tight"
                  style={{
                    color: KTA.textPrimary
                  }}>
                  
                  {trip.operator}
                </p>
                {trip.flightNo &&
                <p
                  className="text-[11px]"
                  style={{
                    color: KTA.textSecondary
                  }}>
                  
                    {trip.flightNo}
                  </p>
                }
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-1 max-w-[55%]">
              {fareChips.map((chip) =>
              <span
                key={chip.label}
                className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor:
                  chip.tone === 'danger' ? '#FEF2F2' :
                  chip.tone === 'success' ? '#ECFDF3' :
                  '#f1f5f9',
                  color:
                  chip.tone === 'danger' ? KTA.red :
                  chip.tone === 'success' ? KTA.green :
                  KTA.textSecondary
                }}>
                
                  {chip.label}
                </span>
              )}
            </div>
          </div>

          {/* Times + simple timeline: origin — labeled orange stop dots — destination */}
          {(() => {
            const originCode = airportCodeLabel(
              trip.departCityCode,
              trip.fromCity
            );
            const destCode = airportCodeLabel(
              trip.arriveCityCode,
              trip.toCity
            );
            const stopAirports = (trip.routePoints ?? []).
            filter(
              (p) =>
                (p.kind === 'stop' || p.kind === 'leg') &&
                /^[A-Z]{3}$/i.test(p.code)
            ).
            map((p) => p.code.toUpperCase());
            // Unique real airport codes only — no fake "Stop 2" placeholders
            const viaCodes = [...new Set(stopAirports)];
            const displayStopCount =
              viaCodes.length > 0 ? viaCodes.length : Math.max(0, trip.transfers);
            const centerLabel =
              displayStopCount === 0 ?
                'Non-stop' :
                viaCodes.length > 0 ?
                  `Via ${viaCodes.join(' · ')}` :
                  displayStopCount === 1 ?
                    '1 stop' :
                    `${displayStopCount} stops`;

            return (
              <div className="mt-0.5">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[20px] font-bold leading-none"
                      style={{ color: KTA.textPrimary }}>
                      {trip.departTime}
                    </p>
                    <p
                      className="text-[12px] font-bold mt-1 tracking-wide"
                      style={{ color: KTA.textPrimary }}>
                      {originCode}
                    </p>
                  </div>

                  <div className="flex-[1.6] flex flex-col items-center pt-1 min-w-0 px-1">
                    <p
                      className="text-[10px] font-medium mb-1.5 whitespace-nowrap"
                      style={{ color: KTA.textSecondary }}>
                      {trip.duration}
                    </p>
                    <div className="w-full flex items-center">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: KTA.green }} />
                      <div className="flex-1 relative h-px mx-0.5" style={{ backgroundColor: KTA.border }}>
                        {displayStopCount > 0 &&
                          Array.from({
                            length: Math.max(1, viaCodes.length || displayStopCount)
                          }).map((_, i) => {
                            const code = viaCodes[i];
                            const count = Math.max(
                              1,
                              viaCodes.length || displayStopCount
                            );
                            const left = `${((i + 1) / (count + 1)) * 100}%`;
                            return (
                              <span
                                key={code || `stop-${i}`}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                                style={{ left }}>
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: KTA.orange }} />
                                {code ?
                                <span
                                  className="absolute top-2.5 text-[10px] font-bold leading-none whitespace-nowrap"
                                  style={{ color: KTA.orange }}>
                                  {code}
                                </span> :
                                null}
                              </span>
                            );
                          })}
                      </div>
                      <Plane
                        className="w-3 h-3 mx-0.5 shrink-0"
                        style={{ color: KTA.green }} />
                      <div
                        className="flex-1 h-px mx-0.5"
                        style={{ backgroundColor: KTA.border }} />
                    </div>
                    {/* Reserve space under the line for stop codes */}
                    {viaCodes.length > 0 ?
                    <div className="h-3.5 w-full" /> :
                    null}
                  </div>

                  <div className="flex-1 min-w-0 text-right">
                    <p
                      className="text-[20px] font-bold leading-none"
                      style={{ color: KTA.textPrimary }}>
                      {trip.arriveTime}
                    </p>
                    <p
                      className="text-[12px] font-bold mt-1 tracking-wide"
                      style={{ color: KTA.textPrimary }}>
                      {destCode}
                    </p>
                  </div>
                </div>
                <p
                  className="text-[11px] font-semibold mt-1.5 text-center"
                  style={{
                    color: displayStopCount === 0 ? KTA.green : KTA.textSecondary
                  }}>
                  {centerLabel}
                </p>
              </div>
            );
          })()}

          {/* Tags + price */}
          <div
            className="flex items-center justify-between mt-3 pt-3 border-t"
            style={{
              borderColor: KTA.border
            }}>
            
            <div className="flex flex-wrap items-center gap-1.5">
              {trip.tags.map((t) =>
              <span
                key={t}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: '#f1f5f9',
                  color: KTA.green
                }}>
                
                  {t}
                </span>
              )}
              {trip.co2 ?
              <span
                className="text-[11px] font-semibold inline-flex items-center gap-1"
                style={{
                  color: KTA.textSecondary
                }}>
                
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: KTA.green
                  }} />
                
                {trip.co2}
              </span> :
              null}
            </div>
            <div className="text-right shrink-0">
              {trip.originalPrice && trip.originalPrice > trip.price ?
              <p
                className="text-[11px] line-through"
                style={{
                  color: KTA.textSecondary
                }}>
                
                {cur(trip.originalPrice, trip.currency)}
              </p> :
              null}
              <p
                className="text-[19px] font-bold leading-none"
                style={{
                  color: KTA.textPrimary
                }}>
                
                {cur(trip.price, trip.currency)}
              </p>
            </div>
          </div>
        </motion.button>);

    }
    // Default card (bus / train) — unchanged
    return (
      <button
        onClick={onSelect}
        className="w-full text-left glass-card p-3.5 mb-3"
        style={{
          borderColor: KTA.border
        }}>
        
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: '#f1f5f9',
              color: KTA.textSecondary
            }}>
            
            {trip.tags.join(', ')}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className="text-[11px] font-semibold"
              style={{
                color: KTA.textPrimary
              }}>
              
              {trip.operator}
            </span>
            <AirlineLogo
              src={trip.operatorLogo}
              name={trip.operator}
              initial={trip.operatorInitial}
              color={trip.operatorColor}
              className="w-6 h-6"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0">
            <p
              className="text-[18px] sm:text-[22px] font-bold whitespace-nowrap"
              style={{
                color: KTA.textPrimary
              }}>
              
              {trip.departTime}
            </p>
          </div>
          <div className="flex-1 min-w-0 flex flex-col items-center">
            <ModeIcon
              className="w-4 h-4 mb-1"
              style={{
                color: KTA.blue
              }} />
            
            <div
              className="w-full border-t border-dashed"
              style={{
                borderColor: KTA.blue
              }} />
            
            <p
              className="text-[11px] mt-1"
              style={{
                color: KTA.textSecondary
              }}>
              
              Duration: {trip.duration}
            </p>
          </div>
          <div className="shrink-0">
            <p
              className="text-[18px] sm:text-[22px] font-bold whitespace-nowrap"
              style={{
                color: KTA.textPrimary
              }}>
              
              {trip.arriveTime}
            </p>
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <p
            className="text-[11px]"
            style={{
              color: KTA.textSecondary
            }}>
            
            {trip.fromCity}
          </p>
          <p
            className="text-[11px]"
            style={{
              color: KTA.textSecondary
            }}>
            
            {trip.toCity}
          </p>
        </div>
        <div
          className="flex items-center justify-between gap-3 mt-3 pt-3 border-t min-w-0"
          style={{
            borderColor: KTA.border
          }}>
          
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-[11px] font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1"
              style={{
                backgroundColor: '#f1f5f9',
                color: KTA.textSecondary
              }}>
              
              {trip.transfers === 0 ? 'Direct' : `${trip.transfers} Transfer`}{' '}
              <ChevronDown className="w-3 h-3" />
            </span>
            <span
              className="text-[11px] font-semibold inline-flex items-center gap-1"
              style={{
                color: KTA.green
              }}>
              
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: KTA.green
                }} />
              
              {trip.co2}
            </span>
          </div>
          <div className="text-right shrink-0 min-w-[6.5rem] pl-2">
            <p
              className="text-[16px] sm:text-[18px] font-bold whitespace-nowrap tabular-nums"
              style={{
                color: KTA.textPrimary
              }}>
              
              {cur(
                mode === 'bus' ? busTripDisplayPrice(trip) : trip.price,
                mode === 'bus' ? displayCurrency || trip.currency : trip.currency
              )}
            </p>
            <p
              className="text-[11px]"
              style={{
                color: KTA.textSecondary
              }}>
              
              1 · Outbound
            </p>
          </div>
        </div>
      </button>);

  };
  const RecommendedHeader = ({ label }: {label: string;}) =>
  <div className="px-[18px] mb-3">
      <div
      className="rounded-[12px] py-2.5 text-center"
      style={{
        backgroundColor: KTA.navy
      }}>
      
        <span className="text-[13px] font-bold text-white">{label}</span>
      </div>
    </div>;

  const FlightSummaryLegCard = ({
    trip,
    label,
    priceLabel
  }: {
    trip: Trip;
    label: string;
    priceLabel?: string;
  }) =>
  <div
    className="rounded-[14px] border p-4 mb-4 last:mb-0"
    style={{
      borderColor: KTA.border,
      backgroundColor: '#f8fafc'
    }}>
    
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-teal-600">
          <Check className="w-4 h-4" />
          <span className="text-[12px] font-bold uppercase tracking-wide">
            {label}
          </span>
        </div>
        <span className="text-[14px] font-bold text-slate-900">
          {priceLabel ?? cur(trip.price, trip.currency)}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-[20px] font-bold text-slate-900 leading-none">
            {trip.departTime}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 leading-tight truncate">
            {trip.fromCity}
          </p>
        </div>
        <div className="flex flex-col items-center px-1 shrink-0 min-w-[88px]">
          <p className="text-[11px] text-slate-500 whitespace-nowrap">
            {trip.duration}
          </p>
          <div className="relative w-full my-1.5">
            <div className="border-t-2 border-dashed border-slate-300" />
            <Plane className="w-3.5 h-3.5 text-slate-400 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f8fafc] px-0.5" />
          </div>
          <p className="text-[11px] text-slate-500 whitespace-nowrap">
            {trip.transfers === 0 ?
            'Direct' :
            `${trip.transfers} stop${trip.transfers === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="text-[20px] font-bold text-slate-900 leading-none">
            {trip.arriveTime}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 leading-tight truncate">
            {trip.toCity}
          </p>
        </div>
      </div>
      <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
        <AirlineLogo
          src={trip.operatorLogo}
          name={trip.operator}
          initial={trip.operatorInitial}
          color={trip.operatorColor}
          className="w-7 h-7"
        />
        <p className="text-[13px] font-semibold text-slate-900 truncate">
          {trip.operator}
          {trip.flightNo ? ` · ${trip.flightNo}` : ''}
        </p>
      </div>
    </div>;

  const SelectedStrip = ({
    trip,
    label,
    expandable




  }: {trip: Trip;label: string;expandable?: boolean;}) =>
  <div
    className="mx-[18px] mb-3 glass-card overflow-hidden"
    style={{
      borderColor: KTA.border
    }}>
    
      <button
      onClick={() => expandable && setExpandOutbound(!expandOutbound)}
      className="w-full p-3.5 text-left">
      
        <div className="flex items-center justify-between mb-1">
          <span
          className="text-[12px] font-bold inline-flex items-center gap-1.5"
          style={{
            color: KTA.green
          }}>
          
            <Check className="w-4 h-4" />
            {label}
          </span>
          <span
          className="text-[14px] font-bold"
          style={{
            color: KTA.textPrimary
          }}>
          
            {cur(trip.price, trip.currency)}
          </span>
        </div>
        <p
        className="text-[13px] font-semibold"
        style={{
          color: KTA.textPrimary
        }}>
        
          {trip.departTime} → {trip.arriveTime} · {trip.fromCity} →{' '}
          {trip.toCity}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p
          className="text-[11px]"
          style={{
            color: KTA.textSecondary
          }}>
          
            {trip.operator} · {trip.duration} ·{' '}
            {trip.transfers === 0 ? 'Direct' : `${trip.transfers} transfer`}
          </p>
          {expandable && (
        expandOutbound ?
        <ChevronUp
          className="w-4 h-4"
          style={{
            color: KTA.textSecondary
          }} /> :


        <ChevronDown
          className="w-4 h-4"
          style={{
            color: KTA.textSecondary
          }} />)

        }
        </div>
      </button>
      <AnimatePresence>
        {expandable && expandOutbound &&
      <motion.div
        initial={{
          height: 0,
          opacity: 0
        }}
        animate={{
          height: 'auto',
          opacity: 1
        }}
        exit={{
          height: 0,
          opacity: 0
        }}
        className="px-3.5 pb-3.5">
        
            <div
          className="border-t pt-3 space-y-2"
          style={{
            borderColor: KTA.border
          }}>
          
              <div className="flex gap-3">
                <ModeIcon
              className="w-4 h-4 mt-0.5"
              style={{
                color: KTA.blue
              }} />
            
                <div>
                  <p
                className="text-[12px] font-semibold"
                style={{
                  color: KTA.textPrimary
                }}>
                
                    {trip.departTime} · {trip.fromCity}
                  </p>
                  <p
                className="text-[11px]"
                style={{
                  color: KTA.textSecondary
                }}>
                
                    {trip.operator} {trip.flightNo ? `| ${trip.flightNo}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin
              className="w-4 h-4 mt-0.5"
              style={{
                color: KTA.red
              }} />
            
                <div>
                  <p
                className="text-[12px] font-semibold"
                style={{
                  color: KTA.textPrimary
                }}>
                
                    {trip.arriveTime} · {trip.toCity}
                  </p>
                  <p
                className="text-[11px]"
                style={{
                  color: KTA.textSecondary
                }}>
                
                    {to.replace(/\s*\([^)]*\)\s*/g, '').trim() ||
                    trip.toCity.replace(/\s*\([^)]*\)\s*/g, '').trim() ||
                    trip.toCity}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
      }
      </AnimatePresence>
    </div>;

  const Footer = ({
    label,
    onClick,
    dim,
    hint
  }: {label: string;onClick: () => void;dim?: boolean;hint?: string;}) => {
    const loading = /Saving|Confirming|…|\.\.\./.test(label);
    const disabled = loading || !!dim;
    return (
  <div className="ui-sticky-footer mt-3">
      <button
      type="button"
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
      disabled={disabled}
      aria-disabled={disabled}
      className={`w-full h-12 rounded-ios-md font-bold text-[15px] transition-all duration-ios touch-manipulation ${
      dim && !loading ?
      'bg-slate-200 text-slate-400 cursor-not-allowed' :
      'ui-btn-primary'} ${loading ? 'opacity-70 cursor-wait' : ''}`}>
        {label}
      </button>
      {(hint || (dim && !loading)) &&
      <p className="ui-footer-hint">
        {hint || 'Please complete the required fields above to continue.'}
      </p>
      }
    </div>);
  };

  // ===== SCREENS =====
  return (
    <div
      className="flex-1 min-h-0 h-full w-full max-w-none min-w-0 flex flex-col relative overflow-hidden">
      
      {screen !== 'pay-method' && <Header showShare={screen === 'class'} />}

      <div
        ref={scrollMainRef}
        className="ethio-funnel-scroll flex-1 min-h-0 w-full max-w-none overflow-y-auto no-scrollbar">
        {/* RESULTS */}
        {screen === 'results' &&
        <>
            {mode === 'bus' ?
          showSearchLoading ?
          <SearchLoading from={from} to={to} mode="bus" /> :

          // New Bus Results Layout
          <div>
                {/* Header */}
                <div className="px-[18px] pt-4 mb-4">
                  <div className="glass-card p-3.5 flex items-center justify-between gap-3 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[15px] font-bold text-slate-900 min-w-0">
                        <span className="truncate">{from.split(' ')[0]}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{to.split(' ')[0]}</span>
                      </div>
                      <p className="text-[12px] text-slate-500 mt-0.5 truncate">
                        {travelDate ?
                        formatBusTravelDateLabel(parseBusTravelDate(travelDate)) :
                        formatBusTravelDateLabel()}{' '}
                        |{' '}
                        {busList.loading ?
                        'Searching…' :
                        `${displayTrips.length} ${displayTrips.length === 1 ? 'Bus' : 'Buses'}`}
                      </p>
                    </div>
                    <button
                  onClick={onExit}
                  className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                  
                      <Edit2 className="w-4 h-4 text-slate-700" />
                    </button>
                  </div>
                </div>

                {/* Top Filter Bar */}
                <div className="px-[18px] mb-4">
                  <div className="bg-slate-800 text-white flex items-center h-14 rounded-[14px] overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() =>
                      setBusFilters((f) => ({ ...f, ac: !f.ac }))
                      }
                      className={`flex-1 flex flex-col items-center justify-center gap-1 border-r border-slate-700 min-h-[48px] py-2 touch-manipulation ${busFilters.ac ? 'bg-teal-600' : 'active:bg-slate-700/50'}`}>
                      <Snowflake className="w-4 h-4" />
                      <span className="text-[11px] font-medium">AC</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                      setBusFilters((f) => ({ ...f, sleeper: !f.sleeper }))
                      }
                      className={`flex-1 flex flex-col items-center justify-center gap-1 border-r border-slate-700 min-h-[48px] py-2 touch-manipulation ${busFilters.sleeper ? 'bg-teal-600' : 'active:bg-slate-700/50'}`}>
                      <BedDouble className="w-4 h-4" />
                      <span className="text-[11px] font-medium">Sleeper</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                      setBusFilters((f) => ({ ...f, offers: !f.offers }))
                      }
                      className={`flex-1 flex flex-col items-center justify-center gap-1 border-r border-slate-700 min-h-[48px] py-2 touch-manipulation ${busFilters.offers ? 'bg-teal-600' : 'active:bg-slate-700/50'}`}>
                      <Tag className="w-4 h-4" />
                      <span className="text-[11px] font-medium">Offers</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                      setBusFilters((f) => ({ ...f, newBuses: !f.newBuses }))
                      }
                      className={`flex-1 flex flex-col items-center justify-center gap-1 border-r border-slate-700 min-h-[48px] py-2 touch-manipulation ${busFilters.newBuses ? 'bg-teal-600' : 'active:bg-slate-700/50'}`}>
                      <Bus className="w-4 h-4" />
                      <span className="text-[11px] font-medium">New Buses</span>
                    </button>
                    <button
                  type="button"
                  onClick={() => setShowFilters(true)}
                  className="flex-1 flex flex-col items-center justify-center gap-1 bg-red-500 h-full">
                  
                      <SlidersHorizontal className="w-4 h-4" />
                      <span className="text-[11px] font-bold">
                        Sort & Filters
                      </span>
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 px-[18px] border-b border-slate-200 mb-3">
                  {(
                    [
                      ['boarding', 'Boarding Points'],
                      ['dropping', 'Dropping Points'],
                      ['operators', 'Operators']
                    ] as const
                  ).map(([id, label]) =>
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                      setBusFilters((f) => ({
                        ...f,
                        tab: id,
                        operatorChip: id === 'operators' ? f.operatorChip : null
                      }))
                      }
                      className={`pb-3 text-[13px] font-bold ${
                      busFilters.tab === id ?
                      'text-teal-600 border-b-2 border-teal-600' :
                      'text-slate-500'}`
                      }>
                      {label}
                    </button>
                  )}
                </div>

                {/* Popular Chips */}
                <div className="flex overflow-x-auto no-scrollbar px-[18px] gap-2 mb-4">
                  {busFilters.tab === 'operators' ?
                  <>
                      <div className="flex flex-col items-center shrink-0 mr-1">
                        <span className="text-[11px] font-bold text-red-500 mb-1">
                          Popular
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                        setBusFilters((f) => ({
                          ...f,
                          operatorChip: null
                        }))
                        }
                        className={`glass-chip px-3 py-1.5 text-[12px] font-medium shrink-0 ${!busFilters.operatorChip ? 'ring-2 ring-teal-500 text-teal-700' : 'text-text-primary'}`}>
                        All
                      </button>
                      {displayBusOperators.slice(0, 6).map((op) =>
                        <button
                          key={op}
                          type="button"
                          onClick={() =>
                          setBusFilters((f) => ({
                            ...f,
                            operatorChip:
                            f.operatorChip === op ? null : op
                          }))
                          }
                          className={`glass-chip px-3 py-1.5 text-[12px] font-medium shrink-0 max-w-[140px] truncate ${busFilters.operatorChip === op ? 'ring-2 ring-teal-500 text-teal-700' : 'text-text-primary'}`}>
                          {op.split(' ')[0]}
                        </button>
                      )}
                    </> :
                  busFilters.tab === 'boarding' ?
                  <>
                      <span className="text-[11px] font-bold text-red-500 self-center shrink-0">
                        Popular
                      </span>
                      {BUS_BOARDING_CHIPS.map((chip) =>
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setBusFilters((f) => ({
                              ...f,
                              boardingChip:
                              f.boardingChip === chip ? null : chip
                            }));
                            const match = boardingPoints.find((p) =>
                              p.name.toLowerCase().includes(chip.toLowerCase().slice(0, 5))
                            );
                            if (match) setSelectedBoardingPoint(match.id);
                            showToast(
                              busFilters.boardingChip === chip ?
                              'Boarding filter cleared' :
                              `Preferred boarding: ${chip}`
                            );
                          }}
                          className={`glass-chip px-3 py-1.5 text-[12px] font-medium shrink-0 ${busFilters.boardingChip === chip ? 'ring-2 ring-teal-500 text-teal-700' : 'text-text-primary'}`}>
                          {chip}
                        </button>
                      )}
                    </> :

                  <>
                      <span className="text-[11px] font-bold text-red-500 self-center shrink-0">
                        Popular
                      </span>
                      {BUS_DROPPING_CHIPS.map((chip) =>
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setBusFilters((f) => ({
                              ...f,
                              droppingChip:
                              f.droppingChip === chip ? null : chip
                            }));
                            const match = droppingPoints.find((p) =>
                              p.name.toLowerCase().includes(chip.toLowerCase().slice(0, 4))
                            );
                            if (match) setSelectedDroppingPoint(match.id);
                            showToast(
                              busFilters.droppingChip === chip ?
                              'Dropping filter cleared' :
                              `Preferred dropping: ${chip}`
                            );
                          }}
                          className={`glass-chip px-3 py-1.5 text-[12px] font-medium shrink-0 ${busFilters.droppingChip === chip ? 'ring-2 ring-teal-500 text-teal-700' : 'text-text-primary'}`}>
                          {chip}
                        </button>
                      )}
                    </>
                  }
                </div>

                {/* Bus list from API */}
                <div className="px-[18px] space-y-4">
                  {busList.error &&
              <TravelErrorState
                      className="mb-3"
                      variant="panel"
                      title="Couldn't load buses"
                      message={busList.error} />
              }
                  {!busList.loading &&
              !busList.error &&
              displayTrips.length === 0 &&
              <div className="glass-card p-8 text-center">
                      <p className="text-[14px] font-semibold text-slate-900 mb-1">
                        No buses found
                      </p>
                      <p className="text-[12px] text-slate-500">
                        Try clearing filters or pick another date.
                      </p>
                      <button
                        type="button"
                        onClick={() => setBusFilters(DEFAULT_BUS_FILTERS)}
                        className="mt-3 text-[13px] font-bold text-teal-700">
                        Clear filters
                      </button>
                    </div>
              }
                  {displayTrips.map((trip) =>
              <button
                key={trip.id}
                type="button"
                onClick={() => {
                  setOutbound(trip);
                  setJourneyTrip(trip);
                  setBusConfirmedPrice(null);
                  setBusSelectBusJson('');
                  setBusSelectSeatJson('');
                  setBusBookingId(null);
                  setSelectedSeats([]);
                  setShowJourney(true);
                }}
                className="w-full text-left glass-card overflow-hidden relative">
                
                      {trip.tags.includes('Recommended') &&
                <div className="absolute top-0 left-0 bg-blue-600 text-white text-[11px] font-bold px-2 py-1 rounded-br-[8px] flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Assured
                        </div>
                }
                      <div className={`p-4 min-w-0 ${trip.tags.includes('Recommended') ? 'pt-8' : ''}`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-bold text-slate-900 flex items-center gap-1 min-w-0">
                              <span className="truncate">{trip.operator}</span>
                              {trip.busType &&
                        <span className="text-[11px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 truncate max-w-[46%]">
                                  {trip.busType}
                                </span>
                        }
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1 truncate">
                              {trip.fromCity} → {trip.toCity}
                              {trip.tags.length > 0 ?
                              ` · ${trip.tags.filter((t) => t !== trip.busType).join(' · ')}` :
                              ''}
                            </p>
                          </div>
                          {trip.rating ?
                    <div className="flex items-center gap-1 bg-orange-400 text-white px-1.5 py-0.5 rounded text-[11px] font-bold shrink-0">
                              <Star className="w-3 h-3 fill-current" />{' '}
                              {trip.rating}
                            </div> :
                    null}
                        </div>

                        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start mt-4 mb-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-[15px] sm:text-[16px] font-bold text-slate-900 shrink-0 whitespace-nowrap">
                              {trip.departTime}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 min-w-0 flex-1">
                              <div className="flex-1 h-px bg-slate-200 min-w-[8px]" />
                              <span className="truncate text-center max-w-[96px]">{trip.duration}</span>
                              <div className="flex-1 h-px bg-slate-200 min-w-[8px]" />
                            </div>
                            <p className="text-[15px] sm:text-[16px] font-bold text-slate-900 shrink-0 whitespace-nowrap">
                              {trip.arriveTime}
                            </p>
                          </div>
                          <div className="text-right shrink-0 min-w-[7.5rem]">
                            {busTripDisplayPrice(trip) > 0 ?
                      <>
                              <p className="text-[10px] font-medium text-slate-500 leading-none mb-1">From</p>
                              <p className="text-[15px] font-bold text-slate-900 whitespace-nowrap tabular-nums leading-tight">
                                {cur(
                                  busTripDisplayPrice(trip),
                                  displayCurrency || trip.currency || currencyCode
                                )}
                              </p>
                      </> :

                      <p className="text-[12px] text-slate-500">Fare on request</p>
                      }
                          </div>
                        </div>

                        {trip.seatsAvailable &&
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                            <span className="text-[12px] font-bold text-teal-600 flex items-center gap-1">
                              <Armchair className="w-4 h-4" /> {trip.seatsAvailable}{' '}
                              Seats <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                  }
                      </div>
                    </button>
              )}
                </div>
              </div> :

          mode === 'holiday' ?
          <HolidayToursResults
            tours={tourList.tours}
            loading={tourList.loading && tourList.tours.length === 0}
            error={tourList.error}
            apiMessage={tourList.apiMessage}
            destination={extractTourDestinationName(to) || to}
            travellersLabel={`${hotelAdultCount} Adult${hotelAdultCount === 1 ? '' : 's'}${hotelChildCount > 0 ? ` · ${hotelChildCount} Child${hotelChildCount === 1 ? '' : 'ren'}` : ''}${hotelInfantCount > 0 ? ` · ${hotelInfantCount} Infant${hotelInfantCount === 1 ? '' : 's'}` : ''}`}
            sort={sort as 'Departure time' | 'Recommended' | 'Cheapest price'}
            onSortChange={setSort}
            onSelectTour={(t) => {
              setSelectedTour(t);
              setSelectedTourModality(null);
              setTourBookingId(null);
              setSaveBookingError(null);
              setTourDetailsFetchToken((n) => n + 1);
              setScreen('class');
            }}
            currencyCode={displayCurrency} /> :

          <>
                {showSearchLoading ?
            <SearchLoading
              from={from}
              to={to}
              mode={mode}
              subtitle={
                mode === 'flights' ?
                flightPassengerSummary || '1 Traveller' :
                undefined
              }
            /> :

            <>
                <div className="flex items-center justify-between px-4 sm:px-[18px] pt-4">
                  <h3
                className="text-[15px] sm:text-[16px] font-bold"
                style={{
                  color: KTA.textPrimary
                }}>
                
                    {mode === 'hotels' ?
                'Available ' :
                mode === 'minibus' || mode === 'holiday' ?
                'Available ' :
                'Outbound '}
                    <span
                  style={{
                    color: KTA.orange
                  }}>
                  
                      {mode === 'flights' ?
                  'Flights' :
                  mode === 'train' ?
                  'Trains' :
                      mode === 'hotels' ?
                  'Hotels' :
                  mode === 'holiday' ?
                  'Tours' :
                  'Cars'}
                    </span>
                  </h3>
                  {mode !== 'holiday' &&
                  <button
                onClick={() => setShowFilters(true)}
                className="w-8 h-8 rounded-full glass-pill flex items-center justify-center relative"
                style={{
                  borderColor: hasActiveListFilters ? KTA.blue : KTA.border,
                  backgroundColor: hasActiveListFilters ? '#EFF6FF' : undefined
                }}>
                
                    <Filter
                  className="w-4 h-4"
                  style={{
                    color: hasActiveListFilters ? KTA.blue : KTA.textPrimary
                  }} />
                    {hasActiveListFilters &&
                <span
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: KTA.orange }} />
                }
                
                  </button>
                  }
                </div>
                {mode === 'flights' ?
            <>
                <FaresByDayCard
              days={buildFareDays(liveLowestFare, flightDepartDateLabel)}
              selectedIdx={FARE_DAY_CENTER}
              currencyCode={
                displayTrips[0]?.currency || currencyCode || 'ETB'
              }
              onSelect={(idx) => {
                const days = buildFareDays(liveLowestFare, flightDepartDateLabel);
                const day = days[idx];
                if (!day?.date || !onFlightDepartDateChange) return;
                if (idx === FARE_DAY_CENTER) return;
                setFlightDateIdx(FARE_DAY_CENTER);
                onFlightDepartDateChange(day.date);
              }} />
                    {/* Consolidated control toolbar: Non-stop + sort, one scroll row */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 sm:px-[18px] pt-3 pb-2">
                      <button
                  onClick={() =>
                  setFlightFilters((f) => ({
                    ...f,
                    stops: f.stops === 'direct' ? 'any' : 'direct'
                  }))
                  }
                  className="shrink-0 px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-[12px] font-semibold inline-flex items-center gap-1 transition-colors touch-manipulation"
                  style={{
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: nonStopOnly ? KTA.green : KTA.border,
                    backgroundColor: nonStopOnly ? '#ECFDF3' : '#fff',
                    color: nonStopOnly ? KTA.green : KTA.textSecondary
                  }}>
                  
                        {nonStopOnly && <Check className="w-3.5 h-3.5" />}
                        Non-stop
                      </button>
                      <div
                  className="shrink-0 w-px my-1"
                  style={{
                    backgroundColor: KTA.border
                  }} />
                
                      {['Departure time', 'Recommended', 'Cheapest price'].map(
                  (s) => {
                    const active = sort === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSort(s)}
                        className="shrink-0 px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-[12px] font-semibold transition-colors whitespace-nowrap touch-manipulation"
                        style={{
                          backgroundColor: active ? KTA.blue : '#fff',
                          color: active ? '#fff' : KTA.textSecondary,
                          border: `1px solid ${active ? KTA.blue : KTA.border}`
                        }}>
                        
                              {s === 'Cheapest price' ? 'Cheapest' : s}
                            </button>);

                  }
                )}
                    </div>
                    {/* EMI toggle hidden — not dynamic */}
                  </> :

            <>
                    <SortChips />
                    {mode !== 'hotels' && mode !== 'minibus' &&
              <RecommendedHeader label="Recommended" />
              }
                  </>
            }
                <div className="px-[18px]">
                  {mode === 'flights' && flightList.error &&
              <TravelErrorState
                      className="mb-3"
                      variant="panel"
                      title="Couldn't load flights"
                      message={flightList.error} />
              }
                  {mode === 'flights' &&
              flightList.apiMessage &&
              flightList.trips.length === 0 &&
              <div className="glass-alert-warning p-3 mb-3 text-center">
                      <p className="text-[12px] text-amber-800">{flightList.apiMessage}</p>
                      {onReplaceFlightRoute &&
                      (/los angeles/i.test(from) ||
                        /\(LAX\)\s*$/i.test(from) ||
                        /^LAX$/i.test(from.trim())) &&
                      <button
                        type="button"
                        className="mt-2 px-3 py-1.5 rounded-full text-[12px] font-bold text-white"
                        style={{ backgroundColor: KTA.blue }}
                        onClick={() =>
                          onReplaceFlightRoute(
                            'Lagos (LOS)',
                            /\(DXB\)|Dubai/i.test(to) ? 'Dubai (DXB)' : to
                          )
                        }>
                        Search Lagos (LOS) → Dubai instead
                      </button>
                      }
                    </div>
              }
                  {mode === 'flights' &&
              !flightList.loading &&
              !flightList.error &&
              !flightList.apiMessage &&
              trips.length === 0 &&
              <div className="glass-card p-8 text-center mb-3">
                      <p className="text-[14px] font-semibold text-slate-900 mb-1">
                        No flights found
                      </p>
                      <p className="text-[12px] text-slate-500">
                        Try routes like ADD → DXB with a departure date at least a few days ahead.
                      </p>
                    </div>
              }
                  {mode === 'flights' &&
              !flightList.loading &&
              trips.length > 0 &&
              displayTrips.length === 0 &&
              <div className="glass-card p-6 text-center mb-3">
                      <p className="text-[14px] font-semibold text-slate-900 mb-1">
                        No flights match your filters
                      </p>
                      <p className="text-[12px] text-slate-500 mb-3">
                        Try broadening stops, price, or duration.
                      </p>
                      <button
                  type="button"
                  onClick={() => setFlightFilters(DEFAULT_FLIGHT_FILTERS)}
                  className="px-4 py-2 rounded-full text-[12px] font-bold text-white"
                  style={{ backgroundColor: KTA.blue }}>
                        Clear filters
                      </button>
                    </div>
              }
                  {mode === 'hotels' && hotelList.error &&
              <TravelErrorState
                      className="mb-3"
                      variant="panel"
                      title="Couldn't load hotels"
                      message={hotelList.error} />
              }
                  {mode === 'hotels' &&
              hotelList.apiMessage &&
              hotelList.hotels.length === 0 &&
              <div className="glass-alert-warning p-3 mb-3 text-center">
                      <p className="text-[12px] text-amber-800">{hotelList.apiMessage}</p>
                    </div>
              }
                  {mode === 'hotels' &&
              !hotelList.loading &&
              !hotelList.error &&
              hotelList.hotels.length === 0 &&
              <div className="glass-card p-8 text-center mb-3">
                      <p className="text-[14px] font-semibold text-slate-900 mb-1">
                        No hotels found
                      </p>
                      <p className="text-[12px] text-slate-500">
                        Try Dubai with future check-in and check-out dates.
                      </p>
                    </div>
              }
                  {mode === 'hotels' &&
              !hotelList.loading &&
              hotelList.hotels.length > 0 &&
              displayHotels.length === 0 &&
              <div className="glass-card p-6 text-center mb-3">
                      <p className="text-[14px] font-semibold text-slate-900 mb-1">
                        No hotels match your filters
                      </p>
                      <p className="text-[12px] text-slate-500 mb-3">
                        Try broadening star rating or price.
                      </p>
                      <button
                  type="button"
                  onClick={() => setHotelFilters(DEFAULT_HOTEL_FILTERS)}
                  className="px-4 py-2 rounded-full text-[12px] font-bold text-white"
                  style={{ backgroundColor: KTA.blue }}>
                        Clear filters
                      </button>
                    </div>
              }
                  {mode === 'holiday' && tourList.error &&
              <TravelErrorState
                      className="mb-3"
                      variant="panel"
                      title="Couldn't load tours"
                      message={tourList.error} />
              }
                  {mode === 'holiday' &&
              tourList.apiMessage &&
              tourList.tours.length === 0 &&
              <div className="glass-alert-warning p-3 mb-3 text-center">
                      <p className="text-[12px] text-amber-800">{tourList.apiMessage}</p>
                    </div>
              }
                  {mode === 'holiday' &&
              !tourList.loading &&
              !tourList.error &&
              tourList.tours.length === 0 &&
              <div className="glass-card p-8 text-center mb-3">
                      <p className="text-[14px] font-semibold text-slate-900 mb-1">
                        No tours found
                      </p>
                      <p className="text-[12px] text-slate-500">
                        Try Dubai (DXB) with upcoming travel dates.
                      </p>
                    </div>
              }
                  {mode === 'hotels' ?
              displayHotels.map((h) =>
              <HotelCard
                key={h.id}
                hotel={h}
                onSelect={() => {
                  setSelectedHotel(h);
                  setShowRoomSelection(false);
                  hotelDetailsMergedRef.current = '';
                  hotelRoomReservedRef.current = '';
                  setJsonSelectRoom('');
                  setConfirmedHotelSelectRoomJson('');
                  setConfirmedHotelBookingJson('');
                  setHotelBookingId(null);
                  setSaveBookingError(null);
                  setHotelDetailsFetchToken((n) => n + 1);
                  setScreen('class');
                }} />

              ) :
              mode === 'minibus' ?
              <>
                  {carList.error && !carList.fromFallback && carList.cars.length === 0 &&
              <TravelErrorState
                      className="mb-3"
                      variant="panel"
                      title="Couldn't load cars"
                      message={carList.error} />
              }
                  {carList.fromFallback &&
              <div className="glass-alert-info p-3 mb-3 text-center">
                      <p className="text-[12px] text-blue-800">
                        Live rates are temporarily unavailable — showing sample Dubai cars. Demo booking is enabled.
                      </p>
                    </div>
              }
                  {carList.apiMessage && carList.cars.length === 0 &&
              <div className="glass-alert-warning p-3 mb-3 text-center">
                      <p className="text-[12px] text-amber-800">{carList.apiMessage}</p>
                    </div>
              }
                  {!carList.loading &&
              !carList.error &&
              carList.cars.length === 0 &&
              <div className="glass-card p-8 text-center mb-3">
                      <p className="text-[14px] font-semibold text-slate-900 mb-1">
                        No cars found
                      </p>
                      <p className="text-[12px] text-slate-500">
                        Try Dubai as pickup location with dates like 01/07/2026.
                      </p>
                    </div>
              }
                  {!carList.loading &&
              carList.cars.length > 0 &&
              displayCars.length === 0 &&
              <div className="glass-card p-6 text-center mb-3">
                      <p className="text-[14px] font-semibold text-slate-900 mb-1">
                        No cars match your filters
                      </p>
                      <p className="text-[12px] text-slate-500 mb-3">
                        Try broadening transmission, seats, or price.
                      </p>
                      <button
                  type="button"
                  onClick={() => setCarFilters(DEFAULT_CAR_FILTERS)}
                  className="px-4 py-2 rounded-full text-[12px] font-bold text-white"
                  style={{ backgroundColor: KTA.blue }}>
                        Clear filters
                      </button>
                    </div>
              }
                  {displayCars.map((c) =>
              <CarCard
                key={c.id}
                car={c}
                onSelect={() => {
                  setSelectedCar(c);
                  setConfirmedCarBookingJson('');
                  setCarBookingId(null);
                  carSelectConfirmedRef.current = '';
                  setCarSelectFetchToken((n) => n + 1);
                  setScreen('class');
                }} />

              )}
                </> :
              displayTrips.map((t) =>
              <TripCard
                key={t.id}
                trip={t}
                onSelect={() => {
                  setOutbound(t);
                  setJourneyTrip(t);
                  snapshotFlightBookingRows(t);
                  setClassId('');
                  if (mode === 'flights') {
                    setShowJourney(true);
                    return;
                  }
                  setShowJourney(true);
                }} />

              )}
                </div>
              </>
            }
              </>
          }
          </>
        }

        {/* RETURN */}
        {screen === 'return' && outbound &&
        <>
            <SelectedStrip trip={outbound} label="Outbound" expandable />
            <div className="flex items-center justify-between px-[18px] pt-1">
              <h3
              className="text-[16px] font-bold"
              style={{
                color: KTA.textPrimary
              }}>
              
                Return{' '}
                <span
                style={{
                  color: KTA.orange
                }}>
                
                  {mode === 'flights' ?
                'Flights' :
                mode === 'bus' ?
                'Buses' :
                'Trains'}
                </span>
              </h3>
              <button
              onClick={() => setShowFilters(true)}
              className="w-8 h-8 rounded-full glass-pill flex items-center justify-center"
              style={{
                borderColor: KTA.border
              }}>
              
                <Filter
                className="w-4 h-4"
                style={{
                  color: KTA.textPrimary
                }} />
              
              </button>
            </div>
            <SortChips />
            <RecommendedHeader label="Recommended" />
            <div className="px-[18px]">
              {displayTrips.map((t) =>
            <TripCard
              key={t.id}
              trip={t}
              onSelect={() => {
                setReturnTrip(t);
                if (mode === 'bus' || mode === 'train') {
                  setPointsStep('boarding');
                  setScreen('points');
                } else {
                  setFlightCheckoutStep('cabin');
                  setScreen('class');
                }
              }} />

            )}
            </div>
          </>
        }

        {/* CLASS / CHECKOUT DETAILS */}
        {screen === 'class' && (outbound || selectedHotel || selectedCar || selectedTour) &&
        <div className="pt-2">
            {mode === 'flights' ?
          // New Flights Checkout Details
          <div className="px-[18px] space-y-3">
                <div className={flightCheckoutStep === 'cabin' ? 'space-y-3' : 'hidden'}>
                <>
                {/* 1. Flight Summary — original design */}
                <div className="glass-card-elevated p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#CCFBF1] flex items-center justify-center">
                      <Plane className="w-5 h-5 text-teal-600" />
                    </div>
                    <span className="text-[16px] font-bold text-slate-900">
                      Flight Summary
                    </span>
                  </div>

                  {outbound &&
              <FlightSummaryLegCard
                trip={outbound}
                label="Outbound"
                priceLabel={
                  flightApiGrandTotal != null ?
                  `${flightBooking.pricing?.CurrencyCode || outbound.currency} ${flightApiGrandTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}` :
                  cur(outbound.price, outbound.currency)
                } />
              }

                  {returnTrip &&
              <FlightSummaryLegCard
                trip={returnTrip}
                label="Return"
                priceLabel={cur(returnTrip.price, returnTrip.currency)} />
              }

                  {(flightBooking.loading || !bookingPayloadReady) &&
              <p className="text-[11px] text-slate-500 mb-3">
                    {bookingPayloadReady ?
                    'Loading fare from API…' :
                    'Preparing flight rows for fare check…'}
                  </p>
              }
                  {flightBooking.error &&
              <TravelErrorState
                  className="mb-3"
                  variant="inline"
                  title="Fare check failed"
                  message={flightBooking.error} />
              }

                  {/* Cabin comes from the search Passengers sheet — no picker here. */}
                  <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">
                      Cabin
                    </p>
                    <p className="text-[14px] font-bold text-slate-900">
                      {selectedClassName}
                    </p>
                    {selectedCabinPerkLines.map((line) =>
              <p
                key={line}
                className="text-[11px] leading-snug text-teal-700 mt-1">
                        {line}
                      </p>
              )}
                    {flightBooking.loading && !flightCabinOptions &&
              <p className="text-[11px] text-slate-500 mt-1">
                        Loading confirmed fare from API…
                      </p>
              }
                  </div>

                  {flightMiniFareRules.length > 0 &&
              <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-[13px] font-bold text-slate-900 mb-2">
                        Fare rules
                      </p>
                      <div className="space-y-2">
                        {flightMiniFareRules.map((rule) =>
                    <div
                      key={`${rule.type}-${rule.detail}`}
                      className="rounded-xl bg-slate-50 px-3 py-2">
                      
                            <p className="text-[12px] font-semibold text-slate-900">
                              {rule.type}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              {rule.detail}
                            </p>
                          </div>
                    )}
                      </div>
                    </div>
              }
                  {flightBookingDetail?.LastTicketingDate &&
              <p className="text-[11px] text-slate-500 mt-3">
                      Ticket by{' '}
                      {new Date(flightBookingDetail.LastTicketingDate).toLocaleString(
                        undefined,
                        { dateStyle: 'medium', timeStyle: 'short' }
                      )}
                    </p>
              }

                  {mode === 'flights' &&
              <div className="mt-4 space-y-3">
                      <div className="glass-card overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandBaggage(!expandBaggage)}
                          aria-expanded={expandBaggage}
                          className="w-full p-4 flex items-center justify-between active:opacity-90 transition-all duration-ios min-h-[64px]">
                          <div className="flex items-center gap-3 text-left min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#e0e7ff] flex items-center justify-center shrink-0">
                              <Luggage className="w-5 h-5 text-[#0F766E]" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[15px] font-bold text-slate-900 block">
                                Baggage Allowance
                              </span>
                              <span className="ui-hint">
                                {expandBaggage ? 'Tap to collapse' : 'Tap to see what is included'}
                              </span>
                            </div>
                          </div>
                          <motion.div animate={{ rotate: expandBaggage ? 180 : 0 }} className="shrink-0">
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          </motion.div>
                        </button>
                        <AnimatePresence>
                          {expandBaggage &&
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4 border-t border-slate-100">
                            <div className="mt-4 space-y-4">
                              <div className="flex justify-between items-center gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-slate-200 shrink-0">
                                    <Luggage className="w-4 h-4 text-slate-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[13px] font-bold block text-slate-900">Cabin Baggage</span>
                                    <span className="ui-hint">Included in fare</span>
                                  </div>
                                </div>
                                <span className="text-[13px] font-bold text-slate-900 shrink-0">
                                  {flightCabinBagLabel || '1 × 7 kg'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-slate-200 shrink-0">
                                    <Luggage className="w-4 h-4 text-slate-400" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[13px] font-bold block text-slate-900">Checked Baggage</span>
                                    <span className="ui-hint">Included in fare</span>
                                  </div>
                                </div>
                                <span className="text-[13px] font-bold text-slate-900 shrink-0">
                                  {flightCheckedBagLabel || '2 × 23 kg'}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                          }
                        </AnimatePresence>
                      </div>
                    </div>
              }
                </div>

                {/* 4. Price Summary */}
                <div
              className="glass-card overflow-hidden"
              style={{
                borderColor: KTA.border
              }}>
              
                  <div
                className="px-3.5 py-3 border-b bg-[#f8fafc]"
                style={{
                  borderColor: KTA.border
                }}>
                
                    <p
                  className="text-[14px] font-bold"
                  style={{
                    color: KTA.textPrimary
                  }}>
                  
                      Price Summary
                    </p>
                  </div>
                  <div className="p-3.5">
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-[13px]">
                        <span
                      style={{
                        color: KTA.textSecondary
                      }}>
                      
                          Base Fare
                        </span>
                        <span
                      className="font-semibold"
                      style={{
                        color: KTA.textPrimary
                      }}>
                      
                          {fmtMoney(basePrice * multiplier + returnPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span
                      style={{
                        color: KTA.textSecondary
                      }}>
                      
                          Taxes & Fees
                        </span>
                        <span
                      className="font-semibold"
                      style={{
                        color: KTA.textPrimary
                      }}>
                      
                          {fmtMoney(serviceFee)}
                        </span>
                      </div>
                      {classExtra > 0 &&
                  <div className="flex justify-between text-[13px]">
                          <span
                      style={{
                        color: KTA.textSecondary
                      }}>
                      
                            {selectedClassName}
                          </span>
                          <span
                      className="font-semibold"
                      style={{
                        color: KTA.textPrimary
                      }}>
                      
                            {fmtMoney(classExtra)}
                          </span>
                        </div>
                  }
                      {false && cancelAny &&
                  <div className="flex justify-between text-[13px]">
                          <span
                      style={{
                        color: KTA.textSecondary
                      }}>
                      
                            Cancel for any reason
                          </span>
                          <span
                      className="font-semibold"
                      style={{
                        color: KTA.textPrimary
                      }}>
                      
                            {fmtMoney(100)}
                          </span>
                        </div>
                  }
                      {false && insurance &&
                  <div className="flex justify-between text-[13px]">
                          <span
                      style={{
                        color: KTA.textSecondary
                      }}>
                      
                            Travel Insurance
                          </span>
                          <span
                      className="font-semibold"
                      style={{
                        color: KTA.textPrimary
                      }}>
                      
                            {fmtMoney(250)}
                          </span>
                        </div>
                  }
                      {false && appliedCoupon &&
                  <div className="flex justify-between text-[13px]">
                          <span
                      style={{
                        color: KTA.green
                      }}>
                      
                            Coupon Discount
                          </span>
                          <span
                      className="font-semibold"
                      style={{
                        color: KTA.green
                      }}>
                      
                            -{fmtMoney(500)}
                          </span>
                        </div>
                  }
                    </div>
                    <div
                  className="pt-4 border-t border-dashed flex justify-between items-center"
                  style={{
                    borderColor: KTA.border
                  }}>
                  
                      <span
                    className="text-[15px] font-bold"
                    style={{
                      color: KTA.textPrimary
                    }}>
                    
                        Total
                      </span>
                      <span
                    className="text-[20px] font-bold"
                    style={{
                      color: KTA.blue
                    }}>
                    
                        {fmtMoney(total)}
                      </span>
                    </div>
                  </div>
                </div>
                </>
                </div>

                <div
              className={flightCheckoutStep === 'travellers' ? 'space-y-3' : 'hidden'}
              aria-hidden={flightCheckoutStep !== 'travellers'}>
                <div className="ui-card-intro px-0.5">
                  <h2 className="ui-card-intro-title">Traveller details</h2>
                  <p className="ui-card-intro-desc">
                    Fill in traveller and contact details to continue.
                  </p>
                </div>
                {/* Compact flight summary for context */}
                {outbound &&
                <div className="glass-card-elevated p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-[#CCFBF1] flex items-center justify-center">
                      <Plane className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-slate-900">
                        {outbound.fromCity} → {outbound.toCity}
                      </p>
                      <p className="text-[12px] text-slate-500">
                        {selectedClassName} · {fmtMoney(total)}
                      </p>
                    </div>
                  </div>
                </div>
                }
                {/* Passengers + Traveller section */}
                <div ref={travellerSectionRef} className="space-y-3">
                {/* Passengers type selector */}
                <div
              className="glass-card p-3 sm:p-4 min-w-0"
              style={{
                borderColor: KTA.border
              }}>
              
                  <div className="rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm flex flex-nowrap items-center gap-1 overflow-x-auto no-scrollbar">
                    {travellerChipOptions.map((chip) => {
                  const active = activeTravellerIdx === chip.idx;
                  return (
                    <button
                      key={chip.idx}
                      type="button"
                      onClick={() => jumpToTraveller(chip.idx)}
                      className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-full text-[14px] font-semibold transition-colors touch-manipulation whitespace-nowrap ${
                      active ?
                      'bg-teal-600 text-white shadow-lg shadow-teal-600/35' :
                      'text-slate-500'}`
                      }>
                      
                          {chip.label}
                        </button>);

                })}
                  </div>
                </div>

                {/* 4. Traveller Information */}
                <div
              className="glass-card p-3 sm:p-4 min-w-0 relative"
              style={{
                borderColor: KTA.border
              }}>

                  {mode === 'flights' && travellerNavLoading &&
              <div className="absolute inset-0 z-10 rounded-[inherit] bg-white/80 flex flex-col items-center justify-center gap-2">
                      <span className="w-7 h-7 border-2 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
                      <span className="text-[13px] font-semibold text-teal-700">
                        Loading next traveller…
                      </span>
                    </div>
              }
                  <div className="flex items-center justify-between mb-4 sm:mb-5 min-w-0">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: '#CCFBF1'
                    }}>
                    
                        <User
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      style={{
                        color: '#0D9488'
                      }} />
                    
                      </div>
                      <div className="min-w-0">
                        <span
                      className="text-[13px] sm:text-[14px] font-bold block truncate"
                      style={{
                        color: KTA.textPrimary
                      }}>
                      
                          Traveller Details
                        </span>
                        <span className="ui-hint block">
                          {travellers.length}{' '}
                          {travellers.length === 1 ? 'traveller — names must match ID/passport' : 'travellers — names must match ID/passport'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {(mode === 'flights' ?
                [activeTravellerIdx] :
                travellers.map((_, index) => index)).
                map((idx) => {
                  const tr = travellers[idx];
                  if (!tr) return null;
                  return (
                <div
                  key={idx}
                  className={
                  idx > 0 ? 'pt-5 border-t border-dashed' : undefined
                  }
                  style={
                  idx > 0 ?
                  {
                    borderColor: KTA.border
                  } :
                  undefined
                  }>
                  
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3 min-w-0">
                          <span
                      className="inline-flex max-w-full text-[11px] sm:text-[12px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full"
                      style={{
                        backgroundColor: '#CCFBF1',
                        color: '#0D9488'
                      }}>
                      
                            <span className="truncate">
                              Traveller {idx + 1} · {tr.paxType}
                              {idx === 0 ? ' · Primary' : ''}
                            </span>
                          </span>
                          <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-auto">
                            {savedTravellers.length > 0 &&
                      <button
                        onClick={() =>
                        setPickerOpenFor(
                          pickerOpenFor === idx ? null : idx
                        )
                        }
                        className="flex items-center gap-1 text-[11px] sm:text-[12px] font-bold active:opacity-70 min-h-[36px] px-1 -mr-1 sm:mr-0"
                        style={{
                          color: KTA.green
                        }}>
                        
                                <User className="w-3.5 h-3.5 shrink-0" />
                                <span className="whitespace-nowrap">Use saved</span>
                                <ChevronDown
                          className={`w-3.5 h-3.5 shrink-0 transition-transform ${pickerOpenFor === idx ? 'rotate-180' : ''}`} />
                        
                              </button>
                      }
                            {idx > 0 && mode !== 'flights' &&
                      <button
                        onClick={() => removeTraveller(idx)}
                        className="flex items-center gap-1 text-[11px] sm:text-[12px] font-semibold active:opacity-70 min-h-[36px] px-1"
                        style={{
                          color: KTA.red
                        }}>
                        
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="whitespace-nowrap">Remove</span>
                              </button>
                      }
                          </div>
                        </div>

                        {/* Saved traveller picker */}
                        <AnimatePresence>
                          {pickerOpenFor === idx &&
                    savedTravellers.length > 0 &&
                    <motion.div
                      initial={{
                        height: 0,
                        opacity: 0
                      }}
                      animate={{
                        height: 'auto',
                        opacity: 1
                      }}
                      exit={{
                        height: 0,
                        opacity: 0
                      }}
                      className="overflow-hidden mb-4">
                      
                                <div
                        className="rounded-[12px] border p-2 space-y-1"
                        style={{
                          borderColor: KTA.border,
                          backgroundColor: KTA.bg
                        }}>
                        
                                  <p
                          className="text-[11px] font-semibold px-1.5 pt-1 pb-0.5"
                          style={{
                            color: KTA.textSecondary
                          }}>
                          
                                    Tap a saved traveller to fill this form
                                  </p>
                                  {savedTravellers.map((sv) =>
                        <div
                          key={travellerKey(sv)}
                          className="flex items-center justify-between rounded-[10px] bg-white px-2.5 py-2">
                          
                                      <button
                            onClick={() => {
                              applySavedTraveller(idx, sv);
                              setPickerOpenFor(null);
                            }}
                            className="flex items-center gap-2.5 flex-1 min-w-0 text-left active:opacity-70">
                            
                                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                                          <User className="w-4 h-4 text-teal-600" />
                                        </div>
                                        <div className="min-w-0">
                                          <p
                                className="text-[13px] font-bold truncate"
                                style={{
                                  color: KTA.textPrimary
                                }}>
                                
                                            {sv.name}
                                          </p>
                                          <p
                                className="text-[11px] truncate"
                                style={{
                                  color: KTA.textSecondary
                                }}>
                                
                                            {sv.gender}
                                            {sv.passport ?
                                ` · ${sv.passport}` :
                                ''}
                                          </p>
                                        </div>
                                      </button>
                                      <button
                            onClick={() =>
                            removeSavedTraveller(travellerKey(sv))
                            }
                            className="p-1.5 active:opacity-70 shrink-0"
                            aria-label={`Remove saved traveller ${sv.name}`}>
                            
                                        <Trash2
                              className="w-3.5 h-3.5"
                              style={{
                                color: KTA.textSecondary
                              }} />
                            
                                      </button>
                                    </div>
                        )}
                                </div>
                              </motion.div>
                    }
                        </AnimatePresence>

                        <div className="space-y-3 min-w-0">
                          <div>
                            <label className="ui-form-label">
                              Title<span className="req">*</span>
                            </label>
                            <div
                      className={`flex gap-1.5 sm:gap-2 ${travellerFieldHasError(idx, 'title') ? 'rounded-[10px] ring-2 ring-red-200 p-0.5' : ''}`}>
                            {(tr.paxType === 'Adult' ?
                        ['Mr', 'Mrs', 'Ms'] :
                        ['Mstr', 'Miss']).map((t) =>
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateTraveller(idx, 'title', t)}
                          className={`flex-1 min-w-0 h-9 sm:h-10 rounded-[10px] border text-[11px] sm:text-[12px] font-bold ${tr.title === t ? 'border-teal-600 text-teal-700 bg-teal-50' : travellerFieldHasError(idx, 'title') ? 'border-red-400 text-red-600 bg-red-50' : 'border-slate-200 text-slate-600 bg-white'}`}>
                          
                                {t}
                              </button>
                        )}
                          </div>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div>
                              <label className="ui-form-label" htmlFor={`tr-first-${idx}`}>
                                First name<span className="req">*</span>
                              </label>
                              <input
                                id={`tr-first-${idx}`}
                                type="text"
                                name="given-name"
                                autoComplete="given-name"
                                autoCapitalize="words"
                                value={tr.firstName || ''}
                                placeholder="As on passport"
                                aria-label="First name as on passport"
                                onChange={(e) => {
                          updateTraveller(idx, 'firstName', e.target.value);
                          updateTraveller(idx, 'name', `${e.target.value} ${tr.middleName || ''} ${tr.lastName || ''}`.trim());
                        }} className={travellerInputClass(idx, 'firstName')} />
                            </div>
                            <div>
                              <label className="ui-form-label" htmlFor={`tr-middle-${idx}`}>
                                Middle name
                              </label>
                              <input
                                id={`tr-middle-${idx}`}
                                type="text"
                                name="additional-name"
                                autoComplete="additional-name"
                                autoCapitalize="words"
                                value={tr.middleName || ''}
                                placeholder="Optional"
                                aria-label="Middle name optional"
                                onChange={(e) => {
                          updateTraveller(idx, 'middleName', e.target.value);
                          updateTraveller(idx, 'name', `${tr.firstName || ''} ${e.target.value} ${tr.lastName || ''}`.trim());
                        }} className="glass-funnel-input" />
                            </div>
                            <div>
                              <label className="ui-form-label" htmlFor={`tr-last-${idx}`}>
                                Last name<span className="req">*</span>
                              </label>
                              <input
                                id={`tr-last-${idx}`}
                                type="text"
                                name="family-name"
                                autoComplete="family-name"
                                autoCapitalize="words"
                                value={tr.lastName || ''}
                                placeholder="As on passport"
                                aria-label="Last name as on passport"
                                onChange={(e) => {
                          updateTraveller(idx, 'lastName', e.target.value);
                          updateTraveller(idx, 'name', `${tr.firstName || ''} ${tr.middleName || ''} ${e.target.value}`.trim());
                        }} className={travellerInputClass(idx, 'lastName')} />
                            </div>
                          </div>
                          <p className="ui-form-hint -mt-1">
                            Enter name exactly as shown on your passport or ID.
                          </p>
                          <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 min-w-0">
                            <div className="flex-1 min-w-0">
                              <label className="ui-form-label">
                                Gender<span className="req">*</span>
                              </label>
                              <button
                          type="button"
                          onClick={() => setGenderSheetIdx(idx)}
                          aria-label="Select gender"
                          className={`${travellerInputClass(idx, 'gender')} w-full text-left flex items-center justify-between gap-2 touch-manipulation`}>
                          
                                <span
                            className={
                            tr.gender ?
                            'text-slate-900' :
                            travellerFieldHasError(idx, 'gender') ?
                            'text-red-400' :
                            'text-slate-400'
                            }>
                            
                                  {tr.gender || 'Select gender'}
                                </span>
                                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                              </button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <label className="ui-form-label">
                                Date of birth<span className="req">*</span>
                                <span className="ml-1 font-normal text-slate-400 normal-case tracking-normal">
                                  ({PAX_AGE_HINTS[tr.paxType]})
                                </span>
                              </label>
                              <button
                          type="button"
                          onClick={() =>
                          setTravellerDateSheet({
                            travellerIdx: idx,
                            field: 'dob'
                          })
                          }
                          aria-label="Select date of birth"
                          className={`${travellerInputClass(idx, 'dob')} w-full text-left flex items-center justify-between gap-2 touch-manipulation`}>
                          
                                <span
                            className={
                            tr.dob ?
                            'text-slate-900' :
                            travellerFieldHasError(idx, 'dob') ?
                            'text-red-400' :
                            'text-slate-400'
                            }>
                            
                                  {formatCalendarDateLabel(
                              tr.dob,
                              'DD / MM / YYYY'
                            )}
                                </span>
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                              </button>
                              {travellerFieldHasError(idx, 'dob') &&
                              <p className="mt-1 text-[11px] text-red-600">
                                {dobValidationMessage(tr.dob, tr.paxType) ||
                                  `Select a date of birth for ${PAX_AGE_HINTS[tr.paxType].toLowerCase()}`}
                              </p>
                              }
                            </div>
                          </div>
                          <div>
                            <ApiCountrySelect
                              label="Nationality *"
                              placeholder="Select country of nationality"
                              value={tr.nationality}
                              onChange={(_name, _id, code) => {
                                updateTraveller(idx, 'nationality', code || '');
                                setTravellerFieldErrorsByIdx((prev) => {
                                  const next = { ...prev };
                                  const fields = (next[idx] ?? []).filter(
                                    (f) => f !== 'nationality'
                                  );
                                  if (fields.length > 0) next[idx] = fields;
                                  else delete next[idx];
                                  return next;
                                });
                              }}
                              hasError={travellerFieldHasError(idx, 'nationality')}
                            />
                          </div>
                          <div>
                            <label className="ui-form-label">
                              Travel document type<span className="req">*</span>
                            </label>
                            <button
                        type="button"
                        onClick={() => setDocumentTypeSheetIdx(idx)}
                        aria-label="Select travel document type"
                        className={`${travellerInputClass(idx, 'documentType')} w-full text-left flex items-center justify-between gap-2 touch-manipulation`}>
                        
                              <span className="text-slate-900">
                                {tr.documentType || 'Passport'}
                              </span>
                              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div>
                              <label className="ui-form-label" htmlFor={`tr-doc-${idx}`}>
                                Document number<span className="req">*</span>
                              </label>
                              <div className="relative">
                                <FileText
                                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                                  style={{ color: KTA.textSecondary }}
                                />
                                <input
                                  id={`tr-doc-${idx}`}
                                  type="text"
                                  name="passport-number"
                                  autoComplete="off"
                                  autoCapitalize="characters"
                                  value={tr.passport}
                                  placeholder="e.g. EP1234567"
                                  aria-label="Passport or ID document number"
                                  onChange={(e) => updateTraveller(idx, 'passport', e.target.value)}
                                  className={travellerInputClass(idx, 'passport', ' pl-9')} />
                              </div>
                            </div>
                            <div>
                              <label className="ui-form-label">
                                Document issue date<span className="req">*</span>
                              </label>
                              <button
                          type="button"
                          onClick={() =>
                          setTravellerDateSheet({
                            travellerIdx: idx,
                            field: 'passportIssueDate'
                          })
                          }
                          aria-label="Select document issue date"
                          className={`${travellerInputClass(idx, 'passportIssueDate')} w-full text-left flex items-center justify-between gap-2 touch-manipulation`}>
                          
                                <span
                            className={
                            tr.passportIssueDate ?
                            'text-slate-900' :
                            travellerFieldHasError(idx, 'passportIssueDate') ?
                            'text-red-400' :
                            'text-slate-400'
                            }>
                            
                                  {formatCalendarDateLabel(
                              tr.passportIssueDate,
                              'DD / MM / YYYY'
                            )}
                                </span>
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                              </button>
                              {travellerFieldHasError(idx, 'passportIssueDate') &&
                              <p className="ui-form-hint !text-red-500 mt-1">
                                Issue date must be today or earlier.
                              </p>
                              }
                            </div>
                            <div>
                              <label className="ui-form-label">
                                Document expiry date<span className="req">*</span>
                              </label>
                              <button
                          type="button"
                          onClick={() =>
                          setTravellerDateSheet({
                            travellerIdx: idx,
                            field: 'passportExpiry'
                          })
                          }
                          aria-label="Select document expiry date"
                          className={`${travellerInputClass(idx, 'passportExpiry')} w-full text-left flex items-center justify-between gap-2 touch-manipulation`}>
                          
                                <span
                            className={
                            tr.passportExpiry ?
                            'text-slate-900' :
                            travellerFieldHasError(idx, 'passportExpiry') ?
                            'text-red-400' :
                            'text-slate-400'
                            }>
                            
                                  {formatCalendarDateLabel(
                              tr.passportExpiry,
                              'DD / MM / YYYY'
                            )}
                                </span>
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                              </button>
                              {travellerFieldHasError(idx, 'passportExpiry') &&
                              <p className="ui-form-hint !text-red-500 mt-1">
                                {passportExpiryHint}
                              </p>
                              }
                            </div>
                          </div>
                          <button
                      onClick={() => saveTravellerForFuture(tr)}
                      className="w-full flex items-center justify-between rounded-[10px] border px-3 py-2.5 active:bg-gray-50 transition-colors"
                      style={{
                        borderColor: KTA.border
                      }}>
                      
                            <div className="flex items-center gap-2 text-left">
                              <ShieldCheck
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: KTA.green
                          }} />
                        
                              <div>
                                <p
                            className="text-[12px] font-bold"
                            style={{
                              color: KTA.textPrimary
                            }}>
                            
                                  Save for future bookings
                                </p>
                                <p
                            className="text-[11px]"
                            style={{
                              color: KTA.textSecondary
                            }}>
                            
                                  Reuse these details without re-typing
                                </p>
                              </div>
                            </div>
                            {savedTravellers.some(
                        (s) => travellerKey(s) === travellerKey(tr)
                      ) ?
                      <span
                        className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full shrink-0"
                        style={{
                          backgroundColor: '#CCFBF1',
                          color: KTA.green
                        }}>
                        
                                <Check className="w-3 h-3" /> Saved
                              </span> :

                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 text-white"
                        style={{
                          backgroundColor: KTA.green
                        }}>
                        
                                Save
                              </span>
                      }
                          </button>
                        </div>
                      </div>);

                })}
                  </div>

                  {mode === 'flights' && travellers.length > 1 &&
              <div
                className="mt-5 pt-4 border-t flex items-center justify-between gap-3"
                style={{
                  borderColor: KTA.border
                }}>
                
                    <button
                  type="button"
                  disabled={activeTravellerIdx === 0 || travellerNavLoading}
                  onClick={() => goToTraveller(activeTravellerIdx - 1)}
                  className="h-11 px-4 rounded-2xl border border-slate-200 bg-white text-[14px] font-semibold text-slate-600 flex items-center gap-2 disabled:opacity-40 touch-manipulation">
                  
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                    <span className="text-[14px] font-semibold text-slate-700 tabular-nums">
                      {activeTravellerIdx + 1} / {travellers.length}
                    </span>
                    <button
                  type="button"
                  disabled={travellerNavLoading}
                  onClick={() => void handleTravellerNext()}
                  className="h-11 px-5 rounded-2xl text-[14px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 min-w-[104px] touch-manipulation"
                  style={{
                    backgroundColor: KTA.green
                  }}>
                  
                      {travellerNavLoading ?
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :

                  <>
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </>
                  }
                    </button>
                  </div>
              }

                  {mode !== 'flights' &&
              <button
                onClick={addTraveller}
                className="mt-5 w-full h-11 rounded-[12px] border border-dashed flex items-center justify-center gap-2 text-[13px] font-bold active:bg-gray-50 transition-colors"
                style={{
                  borderColor: KTA.blue,
                  color: KTA.blue
                }}>
                
                    <Plus className="w-4 h-4" />
                    Add another traveller
                  </button>
              }
                </div>
                </div>

                {/* 5. Communication & Billing */}
                <div
              ref={contactDetailsRef}
              className="glass-card p-3.5"
              style={{
                borderColor: KTA.border
              }}>
              
                  <div className="flex items-center gap-3 mb-3">
                    <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: '#ffedd5'
                  }}>
                  
                      <Mail
                    className="w-4 h-4"
                    style={{
                      color: '#ea580c'
                    }} />
                  
                    </div>
                    <span
                  className="text-[14px] font-bold"
                  style={{
                    color: KTA.textPrimary
                  }}>
                  
                      Contact Details
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <label className="ui-form-label" htmlFor="contact-house">
                          House / building no.
                        </label>
                        <div className="relative">
                          <Home
                            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                            style={{ color: KTA.textSecondary }}
                          />
                          <input
                            id="contact-house"
                            type="text"
                            name="address-line2"
                            autoComplete="address-line2"
                            value={contactHouseNo}
                            placeholder="e.g. House 12, Bole"
                            aria-label="House or building number"
                            onChange={(e) => setContactHouseNo(e.target.value)}
                            className="glass-funnel-input pl-9" />
                        </div>
                      </div>
                      <div>
                        <label className="ui-form-label" htmlFor="contact-address">
                          Street address<span className="req">*</span>
                        </label>
                        <div className="relative">
                          <MapPin
                            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                            style={{ color: KTA.textSecondary }}
                          />
                          <input
                            id="contact-address"
                            type="text"
                            name="street-address"
                            autoComplete="street-address"
                            value={contactAddress}
                            placeholder="Street name and area"
                            aria-label="Street address"
                            onChange={(e) => {
                        setContactAddress(e.target.value);
                        setContactFieldErrors((prev) => prev.filter((f) => f !== 'address'));
                      }} className={contactInputClass('address', ' pl-9')} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <div>
                        <label className="ui-form-label" htmlFor="contact-city">
                          City / town<span className="req">*</span>
                        </label>
                        <div className="relative">
                          <Building2
                            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                            style={{ color: KTA.textSecondary }}
                          />
                          <input
                            id="contact-city"
                            type="text"
                            name="address-level2"
                            autoComplete="address-level2"
                            value={contactCity}
                            placeholder="e.g. Addis Ababa"
                            aria-label="City or town"
                            onChange={(e) => {
                        setContactCity(e.target.value);
                        setContactFieldErrors((prev) => prev.filter((f) => f !== 'city'));
                      }} className={contactInputClass('city', ' pl-9')} />
                        </div>
                      </div>
                      <div>
                        <label className="ui-form-label" htmlFor="contact-zip">
                          Postal / ZIP code<span className="req">*</span>
                        </label>
                        <div className="relative">
                          <Hash
                            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                            style={{ color: KTA.textSecondary }}
                          />
                          <input
                            id="contact-zip"
                            type="text"
                            name="postal-code"
                            autoComplete="postal-code"
                            inputMode="numeric"
                            value={contactZipCode}
                            placeholder="e.g. 1000"
                            aria-label="Postal or ZIP code"
                            onChange={(e) => {
                        setContactZipCode(e.target.value);
                        setContactFieldErrors((prev) => prev.filter((f) => f !== 'zipCode'));
                      }} className={contactInputClass('zipCode', ' pl-9')} />
                        </div>
                      </div>
                      <div>
                        <ApiCountrySelect
                          label="Country of residence *"
                          placeholder="Select country"
                          value={contactCountry}
                          icon={<Globe className="w-4 h-4" />}
                          onChange={(name, _id, code) => {
                            setContactCountry(
                              code ? `${name} - ${code}` : name
                            );
                            setContactFieldErrors((prev) =>
                              prev.filter((f) => f !== 'country')
                            );
                          }}
                          hasError={contactFieldHasError('country')}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                    className="ui-form-label"
                    htmlFor="contact-email">
                    
                        Email address<span className="req">*</span>
                      </label>
                      <p className="ui-form-hint mb-1.5 -mt-0.5">
                        We&apos;ll send your e-ticket to this email
                      </p>
                      <div className="relative">
                        <Mail
                      className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                      style={{
                        color: KTA.textSecondary
                      }} />
                    
                        <input
                      id="contact-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      value={contactEmail}
                      placeholder="name@gmail.com"
                      aria-label="Email address for e-ticket"
                      onChange={(e) => {
                        setContactEmail(e.target.value);
                        setContactFieldErrors((prev) => prev.filter((f) => f !== 'email'));
                      }}
                      className={contactInputClass('email', ' pl-9')} />
                    
                      </div>
                    </div>
                    <div>
                      <label
                    className="ui-form-label"
                    htmlFor="contact-phone">
                        Mobile number<span className="req">*</span>
                      </label>
                      <p className="ui-form-hint mb-1.5 -mt-0.5">
                        For booking alerts and SMS updates
                      </p>
                      <CountryDialPhoneField
                        id="contact-phone"
                        variant="funnel"
                        dialCode={contactPhoneCode}
                        nationalNumber={contactPhone}
                        hasError={contactFieldHasError('phone')}
                        placeholder="911 234 567"
                        onDialChange={(option) => {
                          setContactPhoneCode(option.dial);
                          const maxLen = findDialOption(option.dial).localLength;
                          setContactPhone((prev) =>
                            String(prev || '').replace(/\D/g, '').slice(0, maxLen)
                          );
                          setContactFieldErrors((prev) =>
                            prev.filter((f) => f !== 'phone')
                          );
                        }}
                        onNationalChange={(value) => {
                          setContactPhone(value);
                          setContactFieldErrors((prev) =>
                            prev.filter((f) => f !== 'phone')
                          );
                        }}
                      />
                    </div>
                </div>
                </div>
                </div>

              </div> :
          mode === 'holiday' && selectedTour ?
          <HolidayTourDetails
            tour={selectedTour}
            details={tourDetails.details}
            loading={tourDetails.loading}
            error={tourDetails.error}
            apiMessage={tourDetails.apiMessage}
            selectedModality={selectedTourModality}
            modalities={tourDetails.details?.modalities ?? []}
            onSelectModality={setSelectedTourModality}
            onChooseTickets={() => setScreen('tickets')}
            travelDateLabel={hotelCheckInDateLabel}
            currencyCode={displayCurrency}
          /> :
          mode === 'hotels' && selectedHotel && !showRoomSelection ?
          // New Hotel Detail Page
          <motion.div
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            className="pb-4 bg-white -mt-4">
            
                {/* 1. Hero gallery mosaic */}
                <div className="relative h-[280px] w-full flex gap-1 bg-slate-100">
                  <div className="w-2/3 h-full relative">
                    <img
                  src={selectedHotel.gallery?.[0] || selectedHotel.image}
                  alt={selectedHotel.name}
                  className="w-full h-full object-cover" />
                
                  </div>
                  <div className="w-1/3 h-full flex flex-col gap-1">
                    <img
                  src={selectedHotel.gallery?.[1] || selectedHotel.image}
                  alt={`${selectedHotel.name} interior`}
                  className="w-full h-1/2 object-cover" />
                
                    <div className="w-full h-1/2 relative">
                      <img
                    src={selectedHotel.gallery?.[2] || selectedHotel.image}
                    alt={`${selectedHotel.name} view`}
                    className="w-full h-full object-cover" />
                  
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-bold text-[14px]">
                          +
                          {Math.max(
                        0,
                        (selectedHotel.gallery?.length || 1) - 3
                      )}{' '}
                          photos
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top scrim & buttons */}
                  <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                    <button
                  onClick={() => setScreen('results')}
                  className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform">
                  
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex gap-2">
                      <button className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-[18px] pt-5 space-y-7">
                  {(hotelDetails.loading || hotelDetails.error || hotelDetails.apiMessage) &&
              <div className="glass-card p-3 space-y-1"
                style={{ borderColor: KTA.border, backgroundColor: '#f8fafc' }}>
                      {hotelDetails.loading &&
                <p className="text-[12px] text-slate-600">
                          Loading hotel details from API…
                        </p>
                }
                      {hotelDetails.error &&
                <TravelErrorState
                  title="Couldn't load hotel details"
                  message={hotelDetails.error} />
                }
                      {hotelDetails.apiMessage &&
                <p className="text-[12px] text-amber-800">{hotelDetails.apiMessage}</p>
                }
                    </div>
              }
                  {/* 2. Title block */}
                  <motion.div
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: 0.1
                }}>
                
                    <div className="flex items-start justify-between mb-2">
                      <h1 className="text-[24px] font-bold text-slate-900 leading-tight pr-4">
                        {selectedHotel.name}
                      </h1>
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-1 bg-teal-600 text-white px-2 py-1 rounded-md mb-1">
                          <span className="text-[14px] font-bold">
                            {selectedHotel.rating || selectedHotel.stars}.0
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {selectedHotel.ratingLabel || 'Excellent'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(selectedHotel.stars)].map((_, i) =>
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />

                  )}
                    </div>

                    <div className="flex items-start gap-1.5 text-slate-500 mb-4">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[13px] leading-tight mb-0.5">
                          {selectedHotel.address || selectedHotel.location}
                        </p>
                        {selectedHotel.distanceFromCenter &&
                    <p className="text-[12px] text-slate-400">
                            {selectedHotel.distanceFromCenter}
                          </p>
                    }
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedHotel.tags.map((tag) =>
                  <span
                    key={tag}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    
                          {tag}
                        </span>
                  )}
                    </div>
                  </motion.div>

                  {/* 3. Highlight chips row */}
                  <motion.div
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: 0.15
                }}
                className="flex items-center gap-3 py-1 overflow-x-auto hide-scrollbar -mx-[18px] px-[18px]">
                
                    {selectedHotel.amenities.slice(0, 6).map((amenity) =>
                <div
                  key={amenity}
                  className="flex items-center gap-2 shrink-0 bg-slate-50 border border-slate-100 rounded-full px-3 py-2">
                  
                        {amenity.toLowerCase().includes('wi-fi') ?
                  <Wifi className="w-4 h-4 text-teal-600" /> :
                  amenity.toLowerCase().includes('pool') ?
                  <Waves className="w-4 h-4 text-blue-500" /> :
                  amenity.toLowerCase().includes('gym') ||
                  amenity.toLowerCase().includes('fitness') ?
                  <Dumbbell className="w-4 h-4 text-slate-700" /> :
                  amenity.toLowerCase().includes('spa') ?
                  <Sparkles className="w-4 h-4 text-teal-500" /> :
                  amenity.toLowerCase().includes('breakfast') ||
                  amenity.toLowerCase().includes('restaurant') ?
                  <UtensilsCrossed className="w-4 h-4 text-orange-500" /> :
                  amenity.toLowerCase().includes('bar') ?
                  <Coffee className="w-4 h-4 text-amber-700" /> :
                  amenity.toLowerCase().includes('shuttle') ?
                  <Car className="w-4 h-4 text-slate-600" /> :

                  <Check className="w-4 h-4 text-teal-600" />
                  }
                        <span className="text-[12px] text-slate-700 font-medium">
                          {amenity}
                        </span>
                      </div>
                )}
                  </motion.div>

                  {/* 4. About */}
                  <motion.div
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: 0.2
                }}>
                
                    <h2 className="text-[18px] font-bold text-slate-900 mb-2">
                      About this hotel
                    </h2>
                    <p
                  className={`text-[14px] text-slate-600 leading-relaxed ${!readMoreAbout ? 'line-clamp-3' : ''}`}>
                  
                      {selectedHotel.description ||
                  `Experience a wonderful stay at ${selectedHotel.name}. Located in the heart of ${selectedHotel.location}, offering top-notch amenities and comfort.`}
                    </p>
                    <button
                  onClick={() => setReadMoreAbout(!readMoreAbout)}
                  className="text-[14px] font-bold text-teal-600 mt-1">
                  
                      {readMoreAbout ? 'Show less' : 'Read more'}
                    </button>
                  </motion.div>

                  {/* 5. Category ratings */}
                  {selectedHotel.categoryRatings &&
              <motion.div
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: 0.25
                }}
                className="bg-slate-50 rounded-[16px] p-4">
                
                      <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                        {selectedHotel.categoryRatings.map((cat) =>
                  <div key={cat.label}>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[13px] text-slate-700 font-medium">
                                {cat.label}
                              </span>
                              <span className="text-[13px] font-bold text-slate-900">
                                {cat.score}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                        className="h-full bg-teal-500 rounded-full"
                        style={{
                          width: `${cat.score / 5 * 100}%`
                        }} />
                      
                            </div>
                          </div>
                  )}
                      </div>
                    </motion.div>
              }

                  {/* 7. Facilities */}
                  <motion.div
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: 0.35
                }}>
                
                    <h2 className="text-[18px] font-bold text-slate-900 mb-3">
                      All Facilities
                    </h2>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                      {(selectedHotel.facilities || selectedHotel.amenities).
                  slice(0, showAllFacilities ? undefined : 6).
                  map((facility) =>
                  <div
                    key={facility}
                    className="flex items-center gap-2.5">
                    
                            <Check className="w-4 h-4 text-teal-600 shrink-0" />
                            <span className="text-[13px] text-slate-700">
                              {facility}
                            </span>
                          </div>
                  )}
                    </div>
                    {((selectedHotel.facilities?.length || 0) > 6 ||
                selectedHotel.amenities.length > 6) &&
                <button
                  onClick={() => setShowAllFacilities(!showAllFacilities)}
                  className="w-full mt-4 py-2.5 border border-slate-200 rounded-full text-[14px] font-bold text-slate-900 active:bg-slate-50 transition-colors">
                  
                        {showAllFacilities ?
                  'Show less' :
                  `Show all ${(selectedHotel.facilities || selectedHotel.amenities).length} facilities`}
                      </button>
                }
                  </motion.div>

                  {/* 8. Location & Nearby */}
                  <motion.div
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: 0.4
                }}>
                
                    <h2 className="text-[18px] font-bold text-slate-900 mb-3">
                      Location
                    </h2>
                    <div className="rounded-[16px] border border-slate-200 overflow-hidden mb-4 shadow-sm">
                      <div className="h-[140px] bg-[#e2e8f0] relative w-full flex items-center justify-center">
                        <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                        'radial-gradient(#94a3b8 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                      }} />
                    
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
                        <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center relative z-10 text-teal-600">
                          <MapPin className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="p-4 bg-white flex items-center justify-between gap-3 min-w-0">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-[13px] font-medium text-slate-900 leading-tight mb-1 break-words">
                            {selectedHotel.address || selectedHotel.location}
                          </p>
                          <p className="text-[12px] text-slate-500">
                            {selectedHotel.distanceFromCenter ||
                        'Great location'}
                          </p>
                        </div>
                        <button className="text-[13px] font-bold text-teal-600 shrink-0">
                          View map
                        </button>
                      </div>
                    </div>

                    {selectedHotel.nearby &&
                <div>
                        <h3 className="text-[14px] font-bold text-slate-900 mb-2">
                          What's nearby
                        </h3>
                        <div className="space-y-3">
                          {selectedHotel.nearby.map((place) =>
                    <div
                      key={place.name}
                      className="flex items-center justify-between gap-3 min-w-0">
                      
                              <div className="flex items-center gap-2 min-w-0">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-[13px] text-slate-700 truncate">
                                  {place.name}
                                </span>
                              </div>
                              <span className="text-[12px] text-slate-500 font-medium shrink-0">
                                {place.distance}
                              </span>
                            </div>
                    )}
                        </div>
                      </div>
                }
                  </motion.div>

                  {/* 9. Reviews */}
                  <motion.div
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: 0.45
                }}>
                
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-[18px] font-bold text-slate-900">
                        Guest Reviews
                      </h2>
                      <span className="text-[13px] text-slate-500 font-medium underline">
                        See all {selectedHotel.reviews}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-xl bg-teal-600 text-white flex items-center justify-center text-[24px] font-bold">
                        {selectedHotel.rating || selectedHotel.stars}.0
                      </div>
                      <div>
                        <p className="text-[16px] font-bold text-slate-900 mb-0.5">
                          {selectedHotel.ratingLabel || 'Excellent'}
                        </p>
                        <p className="text-[13px] text-slate-500">
                          Based on {selectedHotel.reviews} reviews
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-[18px] px-[18px] pb-2">
                      {(
                  selectedHotel.reviewHighlights || [
                  {
                    name: 'Guest',
                    rating: 5,
                    quote: 'Great stay, highly recommended!',
                    date: 'Recent'
                  }]).

                  map((review, idx) =>
                  <div
                    key={idx}
                    className="w-[280px] shrink-0 bg-slate-50 border border-slate-100 rounded-[16px] p-4">
                    
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-[14px] font-bold text-slate-700">
                                {review.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-[14px] font-bold text-slate-900 flex items-center gap-1">
                                  {review.name}
                                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {review.date}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded shadow-sm">
                              <span className="text-[12px] font-bold text-slate-900">
                                {review.rating}.0
                              </span>
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            </div>
                          </div>
                          <p className="text-[13px] text-slate-700 leading-relaxed">
                            "{review.quote}"
                          </p>
                        </div>
                  )}
                    </div>
                  </motion.div>

                  {/* 10. House rules */}
                  <motion.div
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: 0.5
                }}>
                
                    <h2 className="text-[18px] font-bold text-slate-900 mb-3">
                      House Rules
                    </h2>
                    <div className="bg-slate-50 rounded-[16px] p-4 border border-slate-100">
                      <div className="flex items-center gap-6 mb-4 pb-4 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                            <Clock className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Check-in
                            </p>
                            <p className="text-[13px] font-bold text-slate-900">
                              {selectedHotel.checkIn || '2:00 PM'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                            <Clock className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              Check-out
                            </p>
                            <p className="text-[13px] font-bold text-slate-900">
                              {selectedHotel.checkOut || '12:00 PM'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        {(
                    selectedHotel.houseRules || [
                    'No smoking',
                    'Pets not allowed']).

                    map((rule, idx) =>
                    <div key={idx} className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <span className="text-[13px] text-slate-700">
                              {rule}
                            </span>
                          </div>
                    )}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* 11. Sticky Bottom Bar */}
                <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 p-4 pb-safe flex items-center justify-between z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
                  <div>
                    {selectedHotel.priceBeforeDiscount &&
                <p className="text-[12px] text-slate-400 line-through mb-0.5">
                        {cur(
                    selectedHotel.priceBeforeDiscount,
                    selectedHotel.currency || currencyCode
                  )}
                      </p>
                }
                    <div className="flex items-baseline gap-1">
                      <p className="text-[20px] font-bold text-slate-900">
                        {cur(
                      selectedHotel.pricePerNight,
                      selectedHotel.currency || currencyCode
                    )}
                      </p>
                      <span className="text-[13px] font-normal text-slate-500">
                        /night
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      incl. taxes & fees
                    </p>
                  </div>
                  <button
                onClick={() => setShowRoomSelection(true)}
                className="bg-teal-600 text-white px-8 py-3.5 rounded-full font-bold text-[15px] shadow-lg shadow-teal-600/30 active:scale-95 transition-transform">
                
                    Select Room
                  </button>
                </div>
              </motion.div> :
          mode === 'hotels' && showRoomSelection ?
          // New Room Selection Page
          <div className="pb-4 bg-slate-50 -mt-2">
                {/* Header */}
                <div className="bg-white px-[18px] py-4 border-b border-slate-200 sticky top-0 z-30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button
                    onClick={() => setShowRoomSelection(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-transform">
                    
                        <ArrowLeft className="w-4 h-4 text-slate-700" />
                      </button>
                      <div>
                        <h1 className="text-[18px] font-bold text-slate-900 leading-tight">
                          Room Selection
                        </h1>
                        <p className="text-[12px] text-slate-500">
                          {hotelCheckInDateLabel || 'Check-in'} -{' '}
                          {hotelCheckOutDateLabel || 'Check-out'},{' '}
                          {hotelAdultCount} Guest{hotelAdultCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <button className="text-[14px] font-bold text-teal-600">
                      Modify
                    </button>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-[18px] px-[18px]">
                    {[
                'Breakfast Included',
                'Free cancellation',
                'Pay at hotel'].
                map((filter, idx) =>
                <button
                  key={filter}
                  className={`shrink-0 px-3 py-1.5 rounded-full border text-[12px] font-medium transition-colors ${idx === 0 ? 'border-teal-600 text-teal-700 bg-teal-50' : 'border-slate-200 text-slate-600 bg-white'}`}>
                  
                        {filter}
                      </button>
                )}
                  </div>
                </div>

                <div className="p-[18px] space-y-4">
                  {(hotelRoomDetails.loading || hotelRoomDetails.error || hotelRoomDetails.apiMessage) &&
              <div className="rounded-[14px] border border-slate-200 bg-white p-3 space-y-1">
                      {hotelRoomDetails.loading &&
                <p className="text-[12px] text-slate-600">
                          Confirming room fare from API…
                        </p>
                }
                      {hotelRoomDetails.error &&
                <TravelErrorState
                  title="Couldn't load rooms"
                  message={hotelRoomDetails.error} />
                }
                      {hotelRoomDetails.apiMessage &&
                <p className="text-[12px] text-amber-800">{hotelRoomDetails.apiMessage}</p>
                }
                    </div>
              }
                  {(selectedHotel?.roomOptions ?? []).length === 0 &&
              <div className="glass-card p-8 text-center">
                      <p className="text-[14px] font-semibold text-slate-900 mb-1">
                        No rooms available
                      </p>
                      <p className="text-[12px] text-slate-500">
                        Try another hotel or different dates.
                      </p>
                    </div>
              }
                  {(selectedHotel?.roomOptions ?? []).map((room, idx) => {
                const image = room.image || selectedHotel?.image;
                const isRefundable = room.refundable ?? false;
                const finalPrice = room.showPrice ?? room.pricePerNight;
                const taxes = room.totalTaxes;
                const isSelected = idx === selectedRoomIndex;
                return (
                  <motion.div
                    key={room.id ?? `room-${idx}`}
                    initial={{
                      opacity: 0,
                      y: 20
                    }}
                    animate={{
                      opacity: 1,
                      y: 0
                    }}
                    transition={{
                      delay: idx * 0.1
                    }}
                    className={`bg-white rounded-[20px] overflow-hidden shadow-sm border ${isSelected ? 'border-teal-600' : 'border-slate-200'}`}>
                    
                        {/* Image Carousel Area */}
                        <div className="relative h-[180px] w-full bg-slate-100">
                          <img
                        src={image}
                        alt={room.name}
                        className="w-full h-full object-cover" />
                        </div>

                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[18px] font-bold text-slate-900 pr-3">
                              {room.name}
                            </h2>
                          </div>

                          {room.perks.length > 0 &&
                    <div className="flex flex-wrap gap-2 mb-4">
                              {room.perks.map((perk) =>
                      <span
                        key={perk}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        
                                  {perk}
                                </span>
                      )}
                            </div>
                    }

                          <div className="flex items-start gap-1.5 mb-4">
                            <Shield
                          className={`w-4 h-4 shrink-0 mt-0.5 ${isRefundable ? 'text-teal-600' : 'text-red-500'}`} />
                        
                            <span
                          className={`text-[12px] font-medium leading-snug ${isRefundable ? 'text-teal-600' : 'text-red-500'}`}>
                          
                              {room.cancellationAmount ||
                          (isRefundable ?
                            'Free cancellation' :
                            'Non-refundable')}
                            </span>
                          </div>

                          {room.paymentInfo &&
                    <p className="text-[12px] text-slate-500 mb-4">
                              Payment: {room.paymentInfo}
                            </p>
                    }

                          <div className="flex items-end justify-between">
                            <div>
                              <div className="flex items-baseline gap-2 mb-0.5">
                                <span className="text-[20px] font-bold text-slate-900">
                                  {cur(
                                    finalPrice,
                                    selectedHotel?.currency || currencyCode
                                  )}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-tight">
                                {taxes ?
                          `+ ${cur(taxes, selectedHotel?.currency || currencyCode)} taxes & fees` :
                          'Total for stay incl. taxes'}
                                <br />
                                {selectedHotel?.totalNights ?? 1} night
                                {selectedHotel?.totalNights === 1 ? '' : 's'} ·{' '}
                                {hotelRoomCount} room
                              </p>
                            </div>
                            <button
                          onClick={() => reserveHotelRoom(idx)}
                          disabled={hotelRoomDetails.loading || !room.apiPayload}
                          className="bg-[#e06c6c] disabled:opacity-60 text-white px-5 py-3 rounded-[12px] font-bold text-[14px] active:scale-95 transition-transform">
                          
                              {hotelRoomDetails.loading && isSelected ?
                          'Confirming…' :
                          'Reserve 1 Room'}
                            </button>
                          </div>
                        </div>
                      </motion.div>);

              })}
                </div>
              </div> :
          mode === 'bus' || mode === 'train' ?
          // New Bus/Train Checkout Details
          <div className="px-[18px] space-y-4">
                {/* 1. Trip Summary */}
                <div className="glass-card-elevated p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#CCFBF1] flex items-center justify-center">
                      {mode === 'bus' ?
                  <Bus className="w-5 h-5 text-teal-600" /> :

                  <TrainFront className="w-5 h-5 text-teal-600" />
                  }
                    </div>
                    <span className="text-[16px] font-bold text-slate-900">
                      Trip Summary
                    </span>
                  </div>

                  {outbound &&
              <div className="glass-card p-4 mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-teal-600">
                          <Check className="w-4 h-4" />
                          <span className="text-[13px] font-bold">
                            Outbound
                          </span>
                        </div>
                        <span className="text-[14px] font-bold text-slate-900">
                          {mode === 'bus' ?
                            fmtMoney(busUnitListFare) :
                            fmtMoney(outbound.price)}
                        </span>
                      </div>
                      <p className="text-[14px] font-bold text-slate-900 mb-1 leading-tight">
                        {outbound.departTime} → {outbound.arriveTime} •{' '}
                        {outbound.fromCity} → {outbound.toCity}
                      </p>
                      <p className="text-[12px] text-slate-500">
                        {outbound.operator} • {outbound.duration} •{' '}
                        {outbound.transfers === 0 ?
                  'Direct' :
                  `${outbound.transfers} transfer`}
                      </p>
                    </div>
              }

                  {returnTrip &&
              <div className="glass-card p-4 mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-teal-600">
                          <Check className="w-4 h-4" />
                          <span className="text-[13px] font-bold">Return</span>
                        </div>
                        <span className="text-[14px] font-bold text-slate-900">
                          {fmtMoney(returnTrip.price)}
                        </span>
                      </div>
                      <p className="text-[14px] font-bold text-slate-900 mb-1 leading-tight">
                        {returnTrip.departTime} → {returnTrip.arriveTime} •{' '}
                        {returnTrip.fromCity} → {returnTrip.toCity}
                      </p>
                      <p className="text-[12px] text-slate-500">
                        {returnTrip.operator} • {returnTrip.duration} •{' '}
                        {returnTrip.transfers === 0 ?
                  'Direct' :
                  `${returnTrip.transfers} transfer`}
                      </p>
                    </div>
              }

                  <p className="text-[14px] font-bold text-slate-900 mb-3">
                    Select {mode === 'bus' ? 'Bus Type' : 'Train Class'}
                  </p>
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4">
                    {optionsList.map((c) => {
                  const active = classId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setClassId(c.id)}
                      className="w-[140px] shrink-0 text-left glass-pricing p-3 transition-all relative overflow-hidden"
                      style={{
                        borderColor: active ? KTA.green : KTA.border,
                        backgroundColor: active ? '#f0fdf4' : 'white'
                      }}>
                      
                          {active &&
                      <div className="absolute top-0 right-0 w-7 h-7 rounded-bl-[12px] flex items-center justify-center bg-teal-600">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                      }
                          <p className="text-[14px] font-bold text-slate-900 mb-1">
                            {c.name}
                          </p>
                          <div className="flex items-center gap-1 mb-3">
                            <Star className="w-3.5 h-3.5 text-teal-600" />
                            <p className="text-[12px] text-teal-600">
                              {c.perk}
                            </p>
                          </div>
                          <p className="text-[14px] font-bold text-slate-900">
                            +{fmtMoney(c.extra)}
                          </p>
                        </button>);

                })}
                  </div>
                </div>

              </div> :
          null}

            </div>
        }

        {/* PASSENGER */}
        {screen === 'passenger' && (
        mode === 'flights' ?
        <div className="px-[18px] pt-2 space-y-3.5">
              <div className="glass-card-elevated p-4">
                {/* Total Fare row */}
                <div className="bg-[#f0fdf4] rounded-[14px] p-3.5 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-slate-500">
                    Total Fare
                  </span>
                  <div className="flex items-center gap-2.5">
                    <p className="text-[20px] font-bold text-teal-700 leading-none">
                      {fmtMoney(total)}
                    </p>
                    <div className="bg-[#dcfce7] text-green-800 text-[11px] font-semibold px-2 py-1 rounded-full">
                      Includes taxes
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 flex justify-between items-center">
                  <span className="text-[13px] text-slate-500">
                    Cabin class
                  </span>
                  <span className="text-[13px] font-bold text-slate-900">
                    {selectedClass?.name ?? selectedClassName}
                  </span>
                </div>
              </div>

              {/* 6. TRAVELLERS CARD */}
              <div
            className="bg-white rounded-[16px] border shadow-sm p-3"
            style={{
              borderColor: KTA.border
            }}>
            
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[14px] font-bold text-slate-900">
                    Travellers ({travellers.length})
                  </span>
                  <button
                onClick={() => {
                  setFlightCheckoutStep('travellers');
                  setScreen('class');
                }}
                className="flex items-center gap-1 text-[12px] font-bold text-teal-600 active:opacity-70">
                
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>

                <div className="space-y-3">
                  {travellers.map((tr, idx) =>
              <div
                key={idx}
                className="flex items-center justify-between">
                
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-teal-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-slate-900 truncate">
                            {tr.name || `Traveller ${idx + 1}`}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] text-slate-500 truncate">
                              {tr.gender} •{' '}
                              {tr.passport ?
                        `Passport ${tr.passport}` :
                        'Passport pending'}
                            </p>
                            {idx === 0 &&
                      <span className="bg-teal-100 text-teal-700 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                Primary
                              </span>
                      }
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
              )}
                </div>
              </div>

              {/* 8. RECOMMENDED SCROLLER */}
              {/* 9. TRUST STRIP */}
              <div className="bg-[#fff1f2] rounded-[16px] p-3 flex items-center justify-between">
                {[
            {
              icon: BadgeCheck,
              title: 'Best Price',
              sub: 'Guaranteed',
              color: 'text-pink-500'
            },
            {
              icon: Lock,
              title: 'Secure Payment',
              sub: '100% Protected',
              color: 'text-green-500'
            },
            {
              icon: HeadphonesIcon,
              title: '24/7 Support',
              sub: "We're here",
              color: 'text-red-500'
            },
            {
              icon: Gift,
              title: 'Earn Points',
              sub: 'On every trip',
              color: 'text-teal-500'
            }].
            map((trust, i) =>
            <div
              key={i}
              className="flex flex-col items-center text-center gap-1">
              
                    <trust.icon className={`w-5 h-5 ${trust.color}`} />
                    <div>
                      <p className="text-[11px] font-bold text-slate-900 leading-none">
                        {trust.title}
                      </p>
                      <p className="text-[11px] text-slate-500">{trust.sub}</p>
                    </div>
                  </div>
            )}
              </div>
            </div> :
        mode === 'bus' || mode === 'train' || mode === 'minibus' ?
        <HolidayTravellerDetails
          tourName={
            mode === 'minibus' ?
              selectedCar?.name ||
              `${stripCityLabel(from)} car rental` :
            outbound ?
              `${outbound.fromCity || stripCityLabel(from)} → ${outbound.toCity || stripCityLabel(to)}` :
              mode === 'bus' ?
                'Bus booking' :
                'Train booking'
          }
          travellers={travellers}
          adultCount={Math.max(
            1,
            mode === 'minibus' ?
              hotelAdultCount || 1 :
              flightAdultCount ||
                travellers.filter((t) => t.paxType === 'Adult').length ||
                1
          )}
          childCount={Math.max(
            0,
            mode === 'minibus' ?
              hotelChildCount || 0 :
              flightChildrenCount ||
                travellers.filter((t) => t.paxType === 'Child').length
          )}
          infantCount={Math.max(
            0,
            mode === 'minibus' ?
              hotelInfantCount || 0 :
              flightInfantCount ||
                travellers.filter((t) => t.paxType === 'Infant').length
          )}
          travelEndIso={passportTravelEndIso}
          onChange={(index, field, value) => {
            updateTraveller(index, field as keyof TravellerInfo, value);
            if (field === 'firstName' || field === 'lastName') {
              const tr = travellers[index];
              const first =
                field === 'firstName' ? value : tr?.firstName || '';
              const last =
                field === 'lastName' ? value : tr?.lastName || '';
              updateTraveller(index, 'name', `${first} ${last}`.trim());
            }
          }} /> :
        mode === 'holiday' ?
        <HolidayTravellerDetails
          tourName={tourDetails.details?.name || selectedTour?.name || 'Tour'}
          travellers={travellers}
          adultCount={holidayTravellerCounts.adultCount}
          childCount={holidayTravellerCounts.childrenCount}
          infantCount={holidayTravellerCounts.infantCount}
          travelEndIso={passportTravelEndIso}
          onChange={(index, field, value) => {
            updateTraveller(index, field as keyof TravellerInfo, value);
            if (field === 'firstName' || field === 'lastName') {
              const tr = travellers[index];
              const first =
                field === 'firstName' ? value : tr?.firstName || '';
              const last =
                field === 'lastName' ? value : tr?.lastName || '';
              updateTraveller(index, 'name', `${first} ${last}`.trim());
            }
          }} /> :
        mode === 'hotels' ?
        // Passenger details for Hotels / Holidays
        <div className="pb-4 bg-slate-50 -mt-2">
              <div className="p-[18px] space-y-4 pt-4">
                {/* Info Banner */}
                <div className="bg-[#fff8e1] rounded-[12px] p-3 flex items-start gap-2 border border-[#fde68a]">
                  <Info className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                  <p className="text-[12px] text-[#92400e] leading-snug">
                    These guest details must match your traveling passport.
                  </p>
                </div>

                {/* Guest Cards — one per room/guest */}
                {travellers.map((tr, idx) =>
            <div
              key={idx}
              className="glass-card p-4">
              
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-[16px] font-bold text-slate-900">
                        {idx === 0 ? 'Main guest' : `Guest ${idx + 1}`}
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] font-medium text-slate-500">
                          Adult
                        </span>
                        {idx > 0 &&
                  <button
                    onClick={() => removeTraveller(idx)}
                    className="flex items-center gap-1 text-[12px] font-bold text-red-500 active:opacity-70">
                    
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                  }
                      </div>
                    </div>

                    {/* Saved travellers quick-fill */}
                    {savedTravellers.length > 0 &&
              <div className="mb-4">
                        <p className="text-[11px] font-bold text-slate-500 mb-2">
                          Use a saved traveller
                        </p>
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
                          {savedTravellers.map((saved) =>
                  <button
                    key={travellerKey(saved)}
                    onClick={() => applySavedTraveller(idx, saved)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-[12px] font-medium text-slate-700 active:scale-95 transition-transform">
                    
                              <User className="w-3.5 h-3.5 text-teal-600" />
                              {saved.name || 'Saved'}
                            </button>
                  )}
                        </div>
                      </div>
              }

                    <div className="space-y-4">
                      {idx === 0 &&
                <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">
                          Email
                        </label>
                        <input
                    type="email"
                    value={tr?.email || ''}
                    onChange={(e) =>
                    updateTraveller(idx, 'email', e.target.value)
                    }
                    placeholder="name@example.com"
                    className="w-full h-12 rounded-[10px] border border-slate-200 px-3 text-[13px] focus:border-teal-600 focus:outline-none" />
                  
                      </div>
                }

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">
                          Mobile Number
                        </label>
                        <input
                    type="tel"
                    value={tr?.mobile || ''}
                    onChange={(e) =>
                    updateTraveller(idx, 'mobile', e.target.value)
                    }
                    placeholder="e.g. 9765644343"
                    className="w-full h-12 rounded-[10px] border border-slate-200 px-3 text-[13px] focus:border-teal-600 focus:outline-none" />
                  
                      </div>

                      <div className="flex gap-2">
                        {['Mr', 'Mrs/Ms'].map((t) =>
                  <button
                    key={t}
                    onClick={() => {
                      updateTraveller(idx, 'title', t);
                      updateTraveller(
                        idx,
                        'gender',
                        mapTourBookingGender(undefined, t)
                      );
                    }}
                    className={`flex-1 h-11 rounded-[10px] border text-[13px] font-bold transition-colors ${tr?.title === t ? 'border-teal-600 text-teal-700 bg-teal-50' : 'border-slate-200 text-slate-600 bg-white'}`}>
                    
                            {t}
                          </button>
                  )}
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">
                          First Name
                        </label>
                        <input
                    type="text"
                    value={tr?.firstName || ''}
                    onChange={(e) => {
                      updateTraveller(idx, 'firstName', e.target.value);
                      updateTraveller(
                        idx,
                        'name',
                        `${e.target.value} ${tr?.lastName || ''}`.trim()
                      );
                    }}
                    placeholder="First Name"
                    className="w-full h-12 rounded-[10px] border border-slate-200 px-3 text-[13px] focus:border-teal-600 focus:outline-none" />
                  
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">
                          Last Name
                        </label>
                        <input
                    type="text"
                    value={tr?.lastName || ''}
                    onChange={(e) => {
                      updateTraveller(idx, 'lastName', e.target.value);
                      updateTraveller(
                        idx,
                        'name',
                        `${tr?.firstName || ''} ${e.target.value}`.trim()
                      );
                    }}
                    placeholder="Last Name"
                    className="w-full h-12 rounded-[10px] border border-slate-200 px-3 text-[13px] focus:border-teal-600 focus:outline-none" />
                  
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">
                          Passport / ID number<span className="text-red-500">*</span>
                        </label>
                        <input
                    type="text"
                    value={tr?.passport || ''}
                    onChange={(e) =>
                    updateTraveller(idx, 'passport', e.target.value)
                    }
                    placeholder="Document number"
                    className="w-full h-12 rounded-[10px] border border-slate-200 px-3 text-[13px] focus:border-teal-600 focus:outline-none" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 block mb-1">
                            Issue date<span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setTravellerDateSheet({
                                travellerIdx: idx,
                                field: 'passportIssueDate'
                              })
                            }
                            className="w-full h-12 rounded-[10px] border border-slate-200 px-3 text-[13px] text-left flex items-center justify-between gap-2 bg-white">
                            <span
                              className={
                                tr.passportIssueDate ?
                                  'text-slate-900' :
                                  'text-slate-400'
                              }>
                              {formatCalendarDateLabel(
                                tr.passportIssueDate,
                                'DD / MM / YYYY'
                              )}
                            </span>
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          </button>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 block mb-1">
                            Expiry date<span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setTravellerDateSheet({
                                travellerIdx: idx,
                                field: 'passportExpiry'
                              })
                            }
                            className="w-full h-12 rounded-[10px] border border-slate-200 px-3 text-[13px] text-left flex items-center justify-between gap-2 bg-white">
                            <span
                              className={
                                tr.passportExpiry ?
                                  'text-slate-900' :
                                  'text-slate-400'
                              }>
                              {formatCalendarDateLabel(
                                tr.passportExpiry,
                                'DD / MM / YYYY'
                              )}
                            </span>
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 -mt-2">
                        {passportExpiryHint}
                      </p>

                      {idx === 0 &&
                <label className="flex items-start gap-3 cursor-pointer mt-2">
                          <div
                    className={`w-5 h-5 rounded-[6px] border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${tr?.stayInLoop ? 'bg-teal-600 border-teal-600' : 'bg-white border-slate-300'}`}>
                    
                            {tr?.stayInLoop &&
                    <Check className="w-3.5 h-3.5 text-white" />
                    }
                          </div>
                          <span className="text-[12px] text-slate-600 leading-snug">
                            Stay in loop: receive trip updates, special offers
                            and other info via email and notifications.
                          </span>
                          <input
                    type="checkbox"
                    checked={tr?.stayInLoop}
                    onChange={(e) =>
                    updateTraveller(
                      idx,
                      'stayInLoop',
                      e.target.checked ? 'true' : ''
                    )
                    }
                    className="hidden" />
                  
                        </label>
                }

                      {/* Save for future bookings */}
                      <button
                  onClick={() => saveTravellerForFuture(tr)}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-teal-700 active:opacity-70">
                  
                        <Bookmark className="w-3.5 h-3.5" /> Save for future
                        bookings
                      </button>
                    </div>
                  </div>
            )}

                {/* Add another guest */}
                <button
              onClick={addTraveller}
              className="w-full h-12 rounded-[14px] border-2 border-dashed border-green-300 bg-teal-50/60 flex items-center justify-center gap-2 text-[14px] font-bold text-teal-700 active:scale-[0.99] transition-transform">
              
                  <Plus className="w-4 h-4" /> Add another guest
                </button>
              </div>
            </div> :

        <div className="px-[18px] pt-3">
              <div
            className="rounded-[12px] p-3 mb-4 flex items-start gap-2"
            style={{
              backgroundColor: '#fff8e1'
            }}>
            
                <Info
              className="w-4 h-4 mt-0.5"
              style={{
                color: KTA.orange
              }} />
            
                <p
              className="text-[12px]"
              style={{
                color: '#8a6d00'
              }}>
              
                  These passenger details must match your traveling passport.
                </p>
              </div>
              <div
            className="bg-white rounded-[14px] border p-4"
            style={{
              borderColor: KTA.border
            }}>
            
                <div className="flex items-center justify-between mb-3">
                  <p
                className="text-[15px] font-bold"
                style={{
                  color: KTA.textPrimary
                }}>
                
                    {mode === 'hotels' ?
                'Main guest' :
                mode === 'minibus' ?
                'Driver details' :
                'Main passenger'}
                  </p>
                  <span
                className="text-[12px] font-semibold"
                style={{
                  color: KTA.textSecondary
                }}>
                
                    Adult
                  </span>
                </div>
                {[
            {
              label: 'Select passenger',
              value: 'Abdiwahab'
            },
            {
              label: 'Email',
              value: 'abrahamjohn45@gmail.com'
            }].
            map((f) =>
            <div key={f.label} className="mb-3">
                    <label
                className="text-[11px] font-semibold block mb-1"
                style={{
                  color: KTA.textSecondary
                }}>
                
                      {f.label}
                    </label>
                    <div
                className="rounded-[10px] px-3 h-11 flex items-center text-[13px]"
                style={{
                  backgroundColor: KTA.inputBg,
                  color: KTA.textPrimary
                }}>
                
                      {f.value}
                    </div>
                  </div>
            )}
                <div className="flex gap-2 mb-3">
                  {['Mr', 'Mrs/Ms'].map((t, i) =>
              <button
                key={t}
                className="flex-1 h-10 rounded-[10px] border text-[13px] font-semibold"
                style={{
                  borderColor: i === 0 ? KTA.blue : KTA.border,
                  color: i === 0 ? KTA.blue : KTA.textSecondary,
                  backgroundColor: i === 0 ? '#E8F5EE' : '#fff'
                }}>
                
                      {t}
                    </button>
              )}
                </div>
                {['First Name', 'Last Name'].map((l) =>
            <div key={l} className="mb-3">
                    <label
                className="text-[11px] font-semibold block mb-1"
                style={{
                  color: KTA.textSecondary
                }}>
                
                      {l}
                    </label>
                    <input
                className="w-full rounded-[10px] px-3 h-11 text-[13px] border"
                style={{
                  backgroundColor: KTA.inputBg,
                  borderColor: KTA.border
                }}
                placeholder={l} />
              
                  </div>
            )}
                <div
              className="flex items-start gap-2 rounded-[10px] p-3"
              style={{
                backgroundColor: KTA.inputBg
              }}>
              
                  <div
                className="w-4 h-4 rounded mt-0.5 flex items-center justify-center"
                style={{
                  backgroundColor: KTA.blue
                }}>
                
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <p
                className="text-[11px]"
                style={{
                  color: KTA.textSecondary
                }}>
                
                    Stay in loop: receive trip updates, special offers and other
                    info via email and notifications.
                  </p>
                </div>
              </div>
            </div>)
        }

        {/* BUS / TRAIN — boarding & dropping points */}
        {screen === 'points' && (mode === 'bus' || mode === 'train') &&
        <div className="px-[18px] pt-3 pb-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPointsStep('boarding')}
                  className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-[12px] border transition-colors"
                  style={{
                    borderColor: pointsStep === 'boarding' ? KTA.green : KTA.border,
                    backgroundColor: pointsStep === 'boarding' ? '#f0fdf4' : '#fff'
                  }}>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                    style={{ backgroundColor: KTA.green }}>
                    1
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[11px] text-slate-500 leading-none mb-0.5">Boarding</p>
                    <p className="text-[12px] font-bold text-slate-900 truncate">
                      {selectedBoardingPoint ?
                        boardingPoints.find((p) => p.id === selectedBoardingPoint)?.name ||
                        'Select point' :
                        'Select point'}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedBoardingPoint) setPointsStep('dropping');
                  }}
                  className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-[12px] border transition-colors"
                  style={{
                    borderColor: pointsStep === 'dropping' ? KTA.green : KTA.border,
                    backgroundColor: pointsStep === 'dropping' ? '#f0fdf4' : '#fff',
                    opacity: selectedBoardingPoint ? 1 : 0.55
                  }}>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
                    style={{ backgroundColor: KTA.orange }}>
                    2
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[11px] text-slate-500 leading-none mb-0.5">Dropping</p>
                    <p className="text-[12px] font-bold text-slate-900 truncate">
                      {selectedDroppingPoint ?
                        droppingPoints.find((p) => p.id === selectedDroppingPoint)?.name ||
                        'Select point' :
                        'Select point'}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <h3
              className="text-[16px] font-bold mb-1"
              style={{ color: KTA.textPrimary }}>
              {pointsStep === 'boarding' ? 'Select boarding point' : 'Select dropping point'}
            </h3>
            <p className="text-[12px] text-slate-500 mb-4">
              {pointsStep === 'boarding' ?
                'Where would you like to board the bus?' :
                'Where would you like to get off?'}
            </p>

            <div className="space-y-3">
              {pointsLoading &&
                (pointsStep === 'boarding' ? boardingPoints : droppingPoints).length === 0 &&
              <p className="py-8 text-center text-[13px] text-slate-500">
                  {pointsStep === 'boarding' ?
                    'Loading boarding points…' :
                    'Loading dropping points…'}
                </p>
              }
              {!pointsLoading &&
                (pointsStep === 'boarding' ? boardingPoints : droppingPoints).length === 0 &&
              <p className="py-8 text-center text-[13px] text-slate-500">
                  {pointsStep === 'boarding' ?
                    'No boarding points returned for this bus.' :
                    'No dropping points returned for this bus.'}
                </p>
              }
              {(pointsStep === 'boarding' ? boardingPoints : droppingPoints).map((point) => {
                const active =
                  pointsStep === 'boarding' ?
                    selectedBoardingPoint === point.id :
                    selectedDroppingPoint === point.id;
                return (
                  <button
                    key={point.id}
                    type="button"
                    onClick={() => {
                      if (pointsStep === 'boarding') setSelectedBoardingPoint(point.id);
                      else setSelectedDroppingPoint(point.id);
                    }}
                    className="w-full text-left bg-white rounded-[14px] border p-4 flex items-center gap-3 transition-all active:scale-[0.99]"
                    style={{
                      borderColor: active ? KTA.green : KTA.border,
                      backgroundColor: active ? '#f0fdf4' : '#fff',
                      boxShadow: active ? `0 0 0 1px ${KTA.green}` : '0 1px 2px rgba(0,0,0,0.04)'
                    }}>
                    <div className="flex flex-col items-center shrink-0 w-12">
                      <p
                        className="text-[15px] font-bold"
                        style={{ color: KTA.textPrimary }}>
                        {point.time || '—'}
                      </p>
                      {'date' in point && (point as { date?: string }).date ?
                        <p className="text-[11px] text-slate-400">
                          {(point as { date?: string }).date}
                        </p> :
                        null}
                    </div>
                    <div className="w-px self-stretch" style={{ backgroundColor: KTA.border }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-slate-900 truncate">{point.name}</p>
                      {point.time ?
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {point.time}
                        </p> :
                        null}
                    </div>
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{
                        borderColor: active ? KTA.green : KTA.border,
                        backgroundColor: active ? KTA.green : '#fff'
                      }}>
                      {active ? <Check className="w-3 h-3 text-white" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        }

        {/* BUS / TRAIN — seat map */}
        {screen === 'seats' && (mode === 'bus' || mode === 'train') &&
        <div className="px-[18px] pt-3 pb-3">
            {mode === 'bus' && busSeatLayout.loading &&
            <div className="bg-white rounded-[16px] border border-slate-200 p-4 mb-4 text-center">
                <p className="text-[14px] text-slate-500">Loading seat layout from API…</p>
              </div>
            }
            {mode === 'bus' && busSeatLayout.error &&
            <TravelErrorState
              className="mb-4"
              variant="panel"
              title="Couldn't load seats"
              message={busSeatLayout.error} />
            }
            {mode === 'bus' && busSeatLayout.apiMessage &&
            <div className="glass-alert-warning p-3 mb-4 text-center">
                <p className="text-[12px] text-amber-800">{busSeatLayout.apiMessage}</p>
              </div>
            }

            <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[16px] font-bold text-slate-900">Select your seats</p>
                <p className="text-[12px] text-slate-500">
                  {selectedSeats.length} of {travellers.length} selected
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2 mb-5">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-[5px] border border-slate-300 bg-white" />
                  <span className="text-[11px] text-slate-600">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-[5px]" style={{ backgroundColor: KTA.green }} />
                  <span className="text-[11px] text-slate-600">Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-[5px] bg-slate-200" />
                  <span className="text-[11px] text-slate-600">Booked</span>
                </div>
                {mode === 'bus' ?
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-[5px] border border-[#f9a8d4] bg-[#fce7f3]" />
                    <span className="text-[11px] text-[#db2777] font-medium">Ladies</span>
                  </div> :
                  null}
              </div>

              <div className="flex justify-center">
                {mode === 'bus' ?
                  <div className="w-[260px] bg-[#f1f5f9] rounded-[28px] border border-slate-200 px-4 py-5 shadow-inner">
                    <div className="w-14 h-2 rounded-full bg-slate-300 mx-auto mb-4" />
                    <p className="text-center text-[11px] text-slate-500 mb-3">
                      {busSeatLayout.loading ?
                        'Loading seats…' :
                        busApiSeats.length > 0 ?
                          `${busApiSeats.filter((s) => !isOccupiedBusSeat(s)).length} available · ${busApiSeats.filter(isOccupiedBusSeat).length} booked` :
                          'Waiting for seat map'}
                    </p>
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {busSeatRows.map((rowSeats, row) =>
                        <div
                          key={row}
                          className="flex items-center justify-between gap-1">
                          <div className="flex gap-2">
                            {renderBusSeatCell(rowSeats[0], `${row}-0`)}
                            {renderBusSeatCell(rowSeats[1], `${row}-1`)}
                          </div>
                          <span className="w-5 text-center text-[11px] font-semibold text-slate-400">
                            {row + 1}
                          </span>
                          <div className="flex gap-2">
                            {renderBusSeatCell(rowSeats[2], `${row}-2`)}
                            {renderBusSeatCell(rowSeats[3], `${row}-3`)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div> :
                  <div className="w-[220px] bg-[#f8fafc] rounded-[32px] border border-slate-200 p-5 relative shadow-inner">
                    <div className="w-16 h-2.5 rounded-full bg-slate-300 mx-auto mb-8" />
                    <div className="space-y-4">
                      {Array.from({ length: 10 }).map((_, row) =>
                        <div key={row} className="flex justify-between items-center">
                          <div className="flex gap-2.5">
                            {(['A', 'B'] as const).map((col) => {
                              const seatId = `${row + 1}${col}`;
                              const selected = selectedSeats.includes(seatId);
                              const occupied = mockSeatOccupied(row, col);
                              return (
                                <button
                                  key={col}
                                  type="button"
                                  disabled={occupied}
                                  onClick={() => {
                                    if (selected) {
                                      setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
                                    } else if (selectedSeats.length < travellers.length) {
                                      setSelectedSeats([...selectedSeats, seatId]);
                                    } else {
                                      showToast(`You can only select ${travellers.length} seat(s)`);
                                    }
                                  }}
                                  className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[11px] font-bold transition-colors"
                                  style={{
                                    backgroundColor: selected ?
                                      KTA.green :
                                      occupied ?
                                      '#e2e8f0' :
                                      '#fff',
                                    color: selected ?
                                      '#fff' :
                                      occupied ?
                                      '#94a3b8' :
                                      KTA.textPrimary,
                                    border: `1px solid ${
                                      selected ?
                                      KTA.green :
                                      occupied ?
                                      '#e2e8f0' :
                                      KTA.border}`,
                                    opacity: occupied ? 0.5 : 1
                                  }}>
                                  {seatId}
                                </button>
                              );
                            })}
                          </div>
                          <div className="w-6 text-center text-[11px] font-semibold text-slate-400">
                            {row + 1}
                          </div>
                          <div className="flex gap-2.5">
                            {(['C', 'D'] as const).map((col) => {
                              const seatId = `${row + 1}${col}`;
                              const selected = selectedSeats.includes(seatId);
                              const occupied = mockSeatOccupied(row, col);
                              return (
                                <button
                                  key={col}
                                  type="button"
                                  disabled={occupied}
                                  onClick={() => {
                                    if (selected) {
                                      setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
                                    } else if (selectedSeats.length < travellers.length) {
                                      setSelectedSeats([...selectedSeats, seatId]);
                                    } else {
                                      showToast(`You can only select ${travellers.length} seat(s)`);
                                    }
                                  }}
                                  className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[11px] font-bold transition-colors"
                                  style={{
                                    backgroundColor: selected ?
                                      KTA.green :
                                      occupied ?
                                      '#e2e8f0' :
                                      '#fff',
                                    color: selected ?
                                      '#fff' :
                                      occupied ?
                                      '#94a3b8' :
                                      KTA.textPrimary,
                                    border: `1px solid ${
                                      selected ?
                                      KTA.green :
                                      occupied ?
                                      '#e2e8f0' :
                                      KTA.border}`,
                                    opacity: occupied ? 0.5 : 1
                                  }}>
                                  {seatId}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                }
              </div>

              <div className="mt-6 p-4 rounded-[16px] bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-bold text-green-800 mb-1">Selected Seats</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSeats.length > 0 ?
                      selectedSeats.map((seatId) =>
                        <span
                          key={seatId}
                          className="bg-white text-teal-700 text-[11px] font-bold px-2 py-0.5 rounded-[6px] border border-green-200">
                          {seatId}
                        </span>
                      ) :
                      <span className="text-[11px] text-teal-600">None selected</span>
                    }
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-teal-700 mb-0.5">
                    {mode === 'bus' ? 'Seat fare' : 'Seat Add-on'}
                  </p>
                  <p className="text-[15px] font-bold text-green-800">
                    {mode === 'bus' ?
                      fmtMoney(busSeatFareTotal || basePrice) :
                      fmtMoney(0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        }

        {screen === 'payment' &&
        mode === 'holiday' &&
        selectedTour &&
        <HolidayReviewPay
              tour={selectedTour}
              tourName={tourDetails.details?.name || selectedTour.name}
              location={tourDetails.details?.location || selectedTour.location}
              ticketName={selectedTourModality?.name || 'Standard ticket'}
              travellerName={
                travellers.length > 1 ?
                  `${travellers.length} travellers` :
                  travellers[0]?.name?.trim() ||
                  `${travellers[0]?.firstName || ''} ${travellers[0]?.lastName || ''}`.trim() ||
                  'Lead traveller'
              }
              departureLabel={hotelCheckInDateLabel || hotelCheckInDate || 'Friday, 19 Jul'}
              meetingPoint={
                tourDetails.details?.location ||
                selectedTour.location ||
                'Meeting point shared on voucher'
              }
              ticketPrice={
                selectedTourModality?.rate ??
                tourDetails.details?.price ??
                selectedTour.price
              }
              currency={displayCurrency}
              storyImage={selectedTour.image || selectedTour.images?.[0] || null}
              onChoosePayment={() => {
                setSaveBookingError(null);
                setScreen('pay-method');
              }} />
        }
        {screen === 'pay-method' &&
        mode === 'holiday' &&
        selectedTour &&
        <HolidayPaymentMethod
              total={total}
              currency={displayCurrency}
              currencyRate={currencyValue}
              walletBalanceEtb={walletAmountEtb}
              apiPaymentTypes={apiPaymentTypes}
              selected={payMethod}
              onSelect={setPayMethod}
              onClose={() => setScreen('payment')}
              loading={saveBookingLoading}
              error={saveBookingError}
              onConfirm={(method) => {
                void confirmTourBooking(() => {
                  setScreen('ticket');
                }, method);
              }} />
        }

        {/* PAYMENT */}
        {screen === 'payment' && (
        mode === 'holiday' ?
        null :
        mode === 'hotels' ?
        // New Booking Review for Hotels
        <div className="w-full max-w-none px-5 pt-2 box-border">
              {/* Red Urgency Banner */}
              <div className="flex items-center gap-2 mb-4 bg-red-50 text-red-600 py-2.5 px-3 rounded-[10px] border border-red-100">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-[12px] font-medium">
                  Hurry! Hotel price may change in {formatTime(timeLeft)}{' '}
                  minutes
                </span>
              </div>

              {/* Hotel Summary Card */}
              <div className="bg-white rounded-[16px] border border-slate-200 p-3 mb-4 flex gap-3 shadow-sm">
                <div className="w-20 h-20 rounded-[10px] overflow-hidden shrink-0">
                  <img
                src={selectedHotel?.image}
                alt={selectedHotel?.name}
                className="w-full h-full object-cover" />
              
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <h3 className="text-[15px] font-bold text-slate-900 truncate mb-1">
                    {selectedHotel?.name}
                  </h3>
                  <div className="flex items-center gap-0.5 mb-1.5">
                    {[...Array(selectedHotel?.stars || 0)].map((_, i) =>
                <Star
                  key={i}
                  className="w-3 h-3 text-amber-400 fill-amber-400" />

                )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                    {selectedHotel?.address || selectedHotel?.location}
                  </p>
                </div>
              </div>

              {/* Travel Details */}
              <div className="mb-6">
                <h2 className="text-[18px] font-bold text-slate-900 mb-3">
                  Travel Details
                </h2>
                <div className="glass-card overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between relative">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold tracking-wider uppercase">
                          CHECK-IN
                        </span>
                      </div>
                      <p className="text-[14px] font-bold text-slate-900">
                        {hotelCheckInDateLabel || selectedHotel?.checkIn || 'Check-in'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selectedHotel?.checkIn || '2:00 PM'}
                      </p>
                    </div>

                    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                      <div className="bg-teal-50 border border-teal-200 text-teal-700 text-[11px] font-bold px-3 py-1 rounded-full">
                        {selectedHotel?.totalNights ?? 1} Night{(selectedHotel?.totalNights ?? 1) > 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-slate-500 mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold tracking-wider uppercase">
                          CHECK-OUT
                        </span>
                      </div>
                      <p className="text-[14px] font-bold text-slate-900">
                        {hotelCheckOutDateLabel || selectedHotel?.checkOut || 'Check-out'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selectedHotel?.checkOut || '12:00 PM'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border-b border-slate-100 flex gap-3">
                    <div className="w-16 h-16 rounded-[8px] overflow-hidden shrink-0">
                      <img
                    src={
                    selectedHotel?.roomOptions?.find(
                      (r) => r.name === (selectedClass?.name ?? selectedClassName)
                    )?.image || selectedHotel?.image
                    }
                    alt="Room"
                    className="w-full h-full object-cover" />
                  
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-slate-900 mb-1.5">
                        {roomCount} x {hotelRoomDetails.room?.RoomName ?? selectedClassName}
                      </p>
                      <div className="flex items-center gap-3 text-slate-600 mb-2">
                        {hotelRoomDetails.room?.MaxOccupancy &&
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span className="text-[11px]">
                            Sleeps {hotelRoomDetails.room.MaxOccupancy}
                          </span>
                        </div>
                        }
                      <div className="flex items-center gap-1 text-slate-600">
                        <HotelIcon className="w-3.5 h-3.5" />
                        <span className="text-[11px]">
                          {hotelRoomDetails.room?.BoardType ?? 'Room Only'}
                        </span>
                      </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-b border-slate-100">
                    <div className="bg-slate-50 rounded-[8px] p-2.5 flex items-center gap-2 w-fit">
                      <Utensils className="w-4 h-4 text-slate-700" />
                      <span className="text-[12px] font-bold text-slate-900">
                        {hotelRoomDetails.room?.BoardType ?? 'Room Only'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-[11px] font-bold tracking-wider uppercase">
                        GUESTS & ROOMS
                      </span>
                    </div>
                    <p className="text-[14px] font-medium text-slate-900">
                      {roomCount} Room{roomCount > 1 ? 's' : ''}, {travellers.length} Guest{travellers.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fare Summary */}
              <div className="mb-6">
                <h2 className="text-[18px] font-bold text-slate-900 mb-3">
                  Fare Summary
                </h2>
                <div className="glass-card p-4">
                  <div className="space-y-2 mb-3 pb-3 border-b border-slate-100">
                    {hotelPaymentPricing ?
                    <>
                        {hotelPaymentPricing.RoomFare &&
                    <div className="flex justify-between text-[13px]">
                            <span className="text-slate-600">
                              {roomCount} Room{roomCount > 1 ? 's' : ''}, {selectedHotel?.totalNights ?? 1} Night{(selectedHotel?.totalNights ?? 1) > 1 ? 's' : ''}
                            </span>
                            <span className="font-medium text-slate-900">
                              {hotelPaymentCurrency}{' '}
                              {Number(hotelPaymentPricing.RoomFare).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            </span>
                          </div>
                    }
                        {Number(hotelPaymentPricing.HotelTax ?? 0) > 0 &&
                    <div className="flex justify-between text-[13px]">
                            <span className="text-slate-600">Hotel Tax</span>
                            <span className="font-medium text-slate-900">
                              {hotelPaymentCurrency}{' '}
                              {Number(hotelPaymentPricing.HotelTax).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            </span>
                          </div>
                    }
                        {Number(hotelPaymentPricing.TotalGST ?? 0) > 0 &&
                    <div className="flex justify-between text-[13px]">
                            <span className="text-slate-600">
                              {hotelPaymentPricing.GSTType || 'Tax'}
                            </span>
                            <span className="font-medium text-slate-900">
                              {hotelPaymentCurrency}{' '}
                              {Number(hotelPaymentPricing.TotalGST).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            </span>
                          </div>
                    }
                        {Number(hotelPaymentPricing.ServiceTax ?? 0) > 0 &&
                    <div className="flex justify-between text-[13px]">
                            <span className="text-slate-600">Service Tax</span>
                            <span className="font-medium text-slate-900">
                              {hotelPaymentCurrency}{' '}
                              {Number(hotelPaymentPricing.ServiceTax).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            </span>
                          </div>
                    }
                      </> :

                    <>
                        <div className="flex justify-between text-[13px]">
                          <span className="text-slate-600">
                            {roomCount} Room{roomCount > 1 ? 's' : ''}, {selectedHotel?.totalNights ?? 1} Night{(selectedHotel?.totalNights ?? 1) > 1 ? 's' : ''}
                          </span>
                          <span className="font-medium text-slate-900">
                            {cur(
                              basePrice * multiplier,
                              selectedHotel?.currency || currencyCode
                            )}
                          </span>
                        </div>
                        {classExtra > 0 &&
                    <div className="flex justify-between text-[13px]">
                          <span className="text-slate-600">Room Upgrade</span>
                          <span className="font-medium text-slate-900">
                            {cur(classExtra, selectedHotel?.currency || currencyCode)}
                          </span>
                        </div>
                    }
                        <div className="flex justify-between text-[13px]">
                          <span className="text-slate-600">Taxes & Fees</span>
                          <span className="font-medium text-slate-900">
                            {cur(serviceFee, selectedHotel?.currency || currencyCode)}
                          </span>
                        </div>
                      </>
                    }
                    {false && appliedCoupon &&
                <div className="flex justify-between text-[13px] text-teal-600">
                        <span>Coupon Discount</span>
                        <span className="font-medium">
                          -{cur(
                            couponDiscount,
                            selectedHotel?.currency || currencyCode
                          )}
                        </span>
                      </div>
                }
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[15px] font-bold text-slate-900">
                      Total Amount
                    </span>
                    <span className="text-[18px] font-bold text-slate-900">
                      {hotelPaymentCurrency}{' '}
                      {(hotelApiGrandTotal ?? total).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>


              <div className="mb-6">
                <h2 className="text-[18px] font-bold text-slate-900 mb-2">
                  Special Request
                </h2>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-3">
                  We will forward your request to the hotel. Please note that
                  this is subject to availability and based on the hotel
                  policies.
                </p>
                <button className="text-[13px] font-bold text-red-500">
                  Add Request
                </button>
              </div>

              {/* Legal & Safe Payment */}
              <div className="bg-slate-100 -mx-5 px-5 py-6 text-center">
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4 text-left">
                  By clicking on Pay Now/Book Now, I confirm that I have read,
                  understood, and agree with the{' '}
                  <span className="text-red-500 underline">
                    Cancellation Policy
                  </span>
                  ,{' '}
                  <span className="text-red-500 underline">Privacy Policy</span>{' '}
                  and{' '}
                  <span className="text-red-500 underline">User Agreement</span>
                  .
                  <br />
                  <br />
                  Please note that MKASH will not provide a tax invoice. You
                  will be given a commercial receipt to serve as proof of
                  transaction.
                </p>

                <div className="text-center mb-2">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                    100% Safe Payment Process
                  </span>
                </div>
                <div className="flex items-center justify-center gap-4 opacity-60">
                  <span className="text-[14px] font-black italic text-blue-800">
                    VISA
                  </span>
                  <span className="text-[14px] font-bold text-slate-700">
                    SafeKey
                  </span>
                  <span className="text-[14px] font-bold text-red-600">
                    Mastercard
                  </span>
                </div>
              </div>
            </div> :

        <div className="w-full max-w-none px-5 pt-2 box-border">
              {mode === 'flights' && saveBookingLoading &&
          <div className="bg-amber-50 rounded-[12px] border border-amber-200 p-3 mb-3">
                  <p className="text-[12px] text-amber-900">
                    Reserving your seat with the airline…
                  </p>
                </div>
          }
              {/* Countdown Timer */}
              <div className="flex items-center justify-center gap-2 mb-4 bg-red-50 text-red-600 py-2 rounded-full border border-red-100">
                <Timer className="w-4 h-4" />
                <span className="text-[13px] font-bold">
                  Complete payment in {formatTime(timeLeft)}
                </span>
              </div>

              {/* Enhanced Booking Summary */}
              <div
            className="bg-white rounded-[16px] border border-slate-200 shadow-sm overflow-hidden mb-4"
            style={{
              borderColor: KTA.border
            }}>
            
                <div
              className="p-4 border-b"
              style={{
                borderColor: KTA.border
              }}>
              
                  <h3
                className="text-[15px] font-bold mb-3"
                style={{
                  color: KTA.textPrimary
                }}>
                
                    Booking Summary
                  </h3>

                  {(mode === 'flights' || mode === 'bus' || mode === 'train') &&
              outbound ?
              <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                            {mode === 'flights' ?
                      <Plane className="w-4 h-4 text-teal-600" /> :
                      mode === 'bus' ?
                      <Bus className="w-4 h-4 text-teal-600" /> :

                      <TrainFront className="w-4 h-4 text-teal-600" />
                      }
                          </div>
                          <div>
                            <p className="text-[13px] font-bold">
                              {outbound.operator}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {mode === 'flights' ?
                        `Flight ${outbound.flightNo}` :
                        `${mode === 'bus' ? 'Bus' : 'Train'} ${outbound.flightNo || '101'}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-semibold text-gray-500">
                            {outbound.duration}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {mode === 'flights' ?
                      flightStopLabel :
                      'Direct'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-2">
                        <div>
                          <p className="text-[16px] font-bold">
                            {outbound.departTime}
                          </p>
                          <p className="text-[12px] text-gray-500">
                            {mode === 'flights' ?
                      flightDepartAirport :
                      from.slice(0, 3).toUpperCase()}
                          </p>
                        </div>
                        <div className="flex-1 px-4 flex items-center justify-center">
                          <div className="w-full h-[1px] bg-gray-300 relative">
                            {mode === 'flights' ?
                      <Plane className="w-3 h-3 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /> :
                      mode === 'bus' ?
                      <Bus className="w-3 h-3 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /> :

                      <TrainFront className="w-3 h-3 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      }
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[16px] font-bold">
                            {outbound.arriveTime}
                          </p>
                          <p className="text-[12px] text-gray-500">
                            {mode === 'flights' ?
                      flightArriveAirport :
                      to.slice(0, 3).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div> :

              <div className="mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <ModeIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold">
                          {mode === 'hotels' ?
                    selectedHotel?.name :
                    mode === 'minibus' ?
                    selectedCar?.name :
                    'Journey Details'}
                        </p>
                        <p className="text-[12px] text-gray-500">
                          {mode === 'minibus' ?
                    `${carPickupDate || 'Pickup'} → ${carReturnDate || 'Return'}` :
                    `${from} → ${to}`}
                        </p>
                        {mode === 'minibus' && selectedCar &&
                  <p className="text-[11px] text-gray-400 mt-0.5">
                          {selectedCar.category} · {carRentalDays} day{carRentalDays > 1 ? 's' : ''}
                        </p>
                  }
                        {mode === 'bus' && busSelectedSeatLabels.length > 0 &&
                  <p className="text-[11px] text-teal-600 mt-0.5 font-medium">
                          Seats: {busSelectedSeatLabels.join(', ')}
                        </p>
                  }
                      </div>
                    </div>
              }

                  {/* Expandable Passengers */}
                  <button
                onClick={() => setExpandPassengers(!expandPassengers)}
                className="w-full flex items-center justify-between py-2 border-t mt-2"
                style={{
                  borderColor: KTA.border
                }}>
                
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-[13px] font-semibold">
                        {travellers.length} Passenger
                        {travellers.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    {expandPassengers ?
                <ChevronUp className="w-4 h-4 text-gray-500" /> :

                <ChevronDown className="w-4 h-4 text-gray-500" />
                }
                  </button>
                  <AnimatePresence>
                    {expandPassengers &&
                <motion.div
                  initial={{
                    height: 0,
                    opacity: 0
                  }}
                  animate={{
                    height: 'auto',
                    opacity: 1
                  }}
                  exit={{
                    height: 0,
                    opacity: 0
                  }}
                  className="overflow-hidden">
                  
                        <div className="pt-2 pb-1 space-y-2">
                          {travellers.map((t, i) =>
                    <div
                      key={i}
                      className="flex justify-between text-[12px]">
                      
                              <span className="text-gray-600">
                                {t.name || `Passenger ${i + 1}`}
                              </span>
                              <span className="font-medium">
                                {t.nationality}
                              </span>
                            </div>
                    )}
                        </div>
                      </motion.div>
                }
                  </AnimatePresence>
                </div>

                {/* Fare Breakdown */}
                <div className="p-4 bg-gray-50">
                  <button
                onClick={() => setExpandFare(!expandFare)}
                className="w-full flex items-center justify-between mb-2">
                
                    <span className="text-[13px] font-bold">
                      Fare Breakdown
                    </span>
                    {expandFare ?
                <ChevronUp className="w-4 h-4 text-gray-500" /> :

                <ChevronDown className="w-4 h-4 text-gray-500" />
                }
                  </button>

                  <AnimatePresence>
                    {expandFare &&
                <motion.div
                  initial={{
                    height: 0,
                    opacity: 0
                  }}
                  animate={{
                    height: 'auto',
                    opacity: 1
                  }}
                  exit={{
                    height: 0,
                    opacity: 0
                  }}
                  className="overflow-hidden">
                  
                        <div className="space-y-2 mb-3">
                          {mode === 'flights' && flightPaymentPricing ?
                    <>
                            {flightPaymentPricing.AdualFare &&
                    Number(flightPaymentPricing.AdualCount ?? flightAdultCount) > 0 &&
                    <div className="flex justify-between text-[12px]">
                                <span className="text-gray-500">
                                  Adult fare ({flightPaymentPricing.AdualCount ?? flightAdultCount}×)
                                </span>
                                <span className="font-medium">
                                  {displayCurrency}{' '}
                                  {Number(flightPaymentPricing.AdualFare).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                    }
                            {flightPaymentPricing.ChildFare &&
                    Number(flightChildrenCount) > 0 &&
                    <div className="flex justify-between text-[12px]">
                                <span className="text-gray-500">
                                  Child fare ({flightChildrenCount}×)
                                </span>
                                <span className="font-medium">
                                  {displayCurrency}{' '}
                                  {Number(flightPaymentPricing.ChildFare).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                    }
                            {(flightPaymentPricing.AdualTaxFare || flightPaymentPricing.TotalGST || flightPaymentPricing.TotalConvenience) &&
                    <div className="flex justify-between text-[12px]">
                                <span className="text-gray-500">Taxes & Fees</span>
                                <span className="font-medium">
                                  {displayCurrency}{' '}
                                  {(
                            Number(flightPaymentPricing.AdualTaxFare ?? 0) +
                            Number(flightPaymentPricing.ChildTaxFare ?? 0) +
                            Number(flightPaymentPricing.TotalGST ?? 0) +
                            Number(flightPaymentPricing.TotalConvenience ?? 0)
                            ).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                    }
                            {Number(flightPaymentPricing.TotalDiscount ?? 0) > 0 &&
                    <div className="flex justify-between text-[12px] text-teal-600">
                                <span>Discount</span>
                                <span className="font-medium">
                                  -{displayCurrency}{' '}
                                  {Number(flightPaymentPricing.TotalDiscount).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                    }
                          </> :

                          mode === 'minibus' && carPaymentPricing ?
                    <>
                            {carPaymentPricing.BaseAmount &&
                    <div className="flex justify-between text-[12px]">
                                <span className="text-gray-500">
                                  Car rental ({carRentalDays} day{carRentalDays > 1 ? 's' : ''})
                                </span>
                                <span className="font-medium">
                                  {carPaymentCurrency}{' '}
                                  {Number(carPaymentPricing.BaseAmount).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                    }
                            {Number(carPaymentPricing.Tax ?? 0) > 0 &&
                    <div className="flex justify-between text-[12px]">
                                <span className="text-gray-500">Tax</span>
                                <span className="font-medium">
                                  {carPaymentCurrency}{' '}
                                  {Number(carPaymentPricing.Tax).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                    }
                            {Number(carPaymentPricing.ConvenienceFees ?? 0) > 0 &&
                    <div className="flex justify-between text-[12px]">
                                <span className="text-gray-500">Convenience Fees</span>
                                <span className="font-medium">
                                  {carPaymentCurrency}{' '}
                                  {Number(carPaymentPricing.ConvenienceFees).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                    }
                          </> :
                    mode === 'bus' && outbound ?
                    <>
                          <div className="flex justify-between text-[12px]">
                            <span className="text-gray-500">
                              Base Fare ({Math.max(selectedSeats.length, travellers.length)}×)
                            </span>
                            <span className="font-medium">
                              {fmtMoney(
                                busSeatFareTotal > 0 ?
                                  busSeatFareTotal :
                                  outbound.price *
                                    Math.max(selectedSeats.length, travellers.length)
                              )}
                            </span>
                          </div>
                          {busSelectedSeatLabels.length > 0 &&
                    <div className="flex justify-between text-[12px]">
                              <span className="text-gray-500">
                                Seats {busSelectedSeatLabels.join(', ')}
                              </span>
                              <span className="font-medium text-gray-400">—</span>
                            </div>
                    }
                          {outbound.busType &&
                    <div className="flex justify-between text-[12px]">
                              <span className="text-gray-500">Bus Type</span>
                              <span className="font-medium">{outbound.busType}</span>
                            </div>
                    }
                          {seatExtra > 0 &&
                    <div className="flex justify-between text-[12px]">
                              <span className="text-gray-500">Premium Seat Add-on</span>
                              <span className="font-medium">{fmtMoney(seatExtra)}</span>
                            </div>
                    }
                          </> :

                    <>
                          <div className="flex justify-between text-[12px]">
                            <span className="text-gray-500">
                              Base Fare ({travellers.length}x)
                            </span>
                            <span className="font-medium">
                              {fmtMoney(
                                basePrice *
                                  multiplier *
                                  (mode === 'bus' || mode === 'train' ?
                                    travellers.length :
                                    1)
                              )}
                            </span>
                          </div>
                          {classExtra > 0 &&
                    <div className="flex justify-between text-[12px]">
                              <span className="text-gray-500">
                                {selectedClassName} Upgrade
                              </span>
                              <span className="font-medium">
                                {fmtMoney(
                                  classExtra *
                                    (mode === 'bus' || mode === 'train' ?
                                      travellers.length :
                                      1)
                                )}
                              </span>
                            </div>
                    }
                          {seatExtra > 0 &&
                    <div className="flex justify-between text-[12px]">
                              <span className="text-gray-500">Seat Add-on</span>
                              <span className="font-medium">
                                ETB {seatExtra}
                              </span>
                            </div>
                    }
                          {false && cancelAny &&
                    <div className="flex justify-between text-[12px]">
                              <span className="text-gray-500">
                                Flexible Cancellation
                              </span>
                              <span className="font-medium">{fmtMoney(100)}</span>
                            </div>
                    }
                          {false && insurance &&
                    <div className="flex justify-between text-[12px]">
                              <span className="text-gray-500">
                                Travel Insurance
                              </span>
                              <span className="font-medium">{fmtMoney(250)}</span>
                            </div>
                    }
                          <div className="flex justify-between text-[12px]">
                            <span className="text-gray-500">Taxes & Fees</span>
                            <span className="font-medium">
                              {fmtMoney(serviceFee)}
                            </span>
                          </div>
                          {false && appliedCoupon &&
                    <div className="flex justify-between text-[12px] text-teal-600">
                              <span>Promo Discount</span>
                              <span className="font-medium">-{fmtMoney(500)}</span>
                            </div>
                    }
                          {seniorDiscount > 0 &&
                    <div className="flex justify-between text-[12px] text-teal-600">
                              <span>Senior Concession</span>
                              <span className="font-medium">
                                -{fmtMoney(seniorDiscount)}
                              </span>
                            </div>
                    }
                          </>
                    }
                          {gatewayFee > 0 &&
                    <div className="flex justify-between text-[12px]">
                              <span className="text-gray-500">
                                Convenience fee
                                {selectedGatewayType?.PaymentType ?
                                ` (${selectedGatewayType.PaymentType.trim()} ${gatewayPercent}%)` :
                                gatewayPercent ? ` (${gatewayPercent}%)` : ''}
                              </span>
                              <span className="font-medium">
                                {fmtMoney(gatewayFee)}
                              </span>
                            </div>
                    }
                        </div>
                      </motion.div>
                }
                  </AnimatePresence>

                  <div className="flex justify-between items-end pt-2 border-t border-gray-200">
                    <span className="text-[14px] font-bold">Total Amount</span>
                    <div className="text-right">
                      {false && appliedCoupon &&
                  <p className="text-[11px] text-gray-400 line-through">
                          {fmtMoney(total + 500)}
                        </p>
                  }
                      <span className="text-[18px] font-bold text-teal-600">
                        {fmtMoney(chargedTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>


              {/* Better Payment Experience */}
              <div className="mb-4 w-full box-border">
                <h3
              className="text-[16px] font-bold mb-3.5"
              style={{
                color: KTA.textPrimary
              }}>
              
                  Payment Method
                </h3>

                {/* Wallet Balance & Installments */}
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 min-w-0 bg-gradient-to-br from-teal-50 to-teal-100 border border-green-200 rounded-[14px] p-4 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-200 rounded-full opacity-50"></div>
                    <Wallet className="w-5 h-5 text-teal-700 mb-2" />
                    <p className="text-[11px] text-green-800">mKash Balance</p>
                    <p className="text-[15px] font-bold text-green-900 mt-0.5">
                      {walletCreditLabel || fmtMoney(walletDisplayAmount)}
                    </p>
                  </div>

                </div>

                {/* Advanced payment options */}
                <div
              className="bg-white rounded-[16px] border border-slate-200 shadow-sm overflow-hidden mb-1"
              style={{
                borderColor: KTA.border
              }}>
              
                  <div
                className="p-4 border-b"
                style={{
                  borderColor: KTA.border
                }}>
                
                    <div
                  className="flex p-1.5 rounded-ios glass-muted">
                  
                      {[
                  {
                    id: 'local',
                    label: 'Ethiopian'
                  },
                  {
                    id: 'intl',
                    label: 'International'
                  }].
                  map((t) => {
                    const active = payTab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setPayTab(t.id as 'local' | 'intl')}
                        className="flex-1 h-10 rounded-[10px] text-[13px] font-bold transition-colors"
                        style={{
                          backgroundColor: active ? '#fff' : 'transparent',
                          color: active ? KTA.blue : KTA.textSecondary,
                          boxShadow: active ?
                          '0 1px 2px rgba(0,0,0,0.06)' :
                          'none'
                        }}>
                        
                            {t.label}
                          </button>);

                  })}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {payTab === 'intl' &&
                <div
                  className="flex items-center gap-2 rounded-[10px] px-3 py-2 mb-1"
                  style={{
                    backgroundColor: '#eff6ff'
                  }}>
                  
                        <Globe
                    className="w-4 h-4 shrink-0"
                    style={{
                      color: '#2563eb'
                    }} />
                  
                        <p
                    className="text-[11px]"
                    style={{
                      color: '#1d4ed8'
                    }}>
                    
                          International cards are charged in USD at today's rate
                          (≈ ${Math.max(1, Math.round(total / 55))}).
                        </p>
                      </div>
                }

                    {(payTab === 'local' ?
                apiPayLists?.local && apiPayLists.local.length > 0 ?
                apiPayLists.local :
                [
                {
                  id: 'mkash',
                  name: 'mKash Wallet',
                  sub: `Balance ${walletCreditLabel || fmtMoney(walletDisplayAmount)}`,
                  icon: Wallet,
                  tint: '#CCFBF1',
                  color: KTA.green,
                  badge: 'Recommended'
                },
                {
                  id: 'telebirr',
                  name: 'Telebirr',
                  sub: 'Ethio Telecom mobile money',
                  icon: Smartphone,
                  tint: '#ecfccb',
                  color: '#65a30d'
                },
                {
                  id: 'cbebirr',
                  name: 'CBE Birr',
                  sub: 'Commercial Bank of Ethiopia',
                  icon: Smartphone,
                  tint: '#fef3c7',
                  color: '#d97706'
                },
                {
                  id: 'amole',
                  name: 'Amole',
                  sub: 'Dashen Bank wallet',
                  icon: Smartphone,
                  tint: '#fee2e2',
                  color: '#dc2626'
                },
                {
                  id: 'hellocash',
                  name: 'HelloCash',
                  sub: 'Wegagen · Lion · Cooperative',
                  icon: Smartphone,
                  tint: '#e0e7ff',
                  color: '#0F766E'
                },
                {
                  id: 'bank',
                  name: 'Bank transfer',
                  sub: 'CBE · Awash · Dashen · Abyssinia',
                  icon: Landmark,
                  tint: '#f1f5f9',
                  color: '#475569'
                }] :

                apiPayLists?.intl && apiPayLists.intl.length > 0 ?
                apiPayLists.intl :
                [
                {
                  id: 'visa',
                  name: 'Visa / Mastercard',
                  sub: 'Credit or debit card',
                  icon: CreditCard,
                  tint: '#e0e7ff',
                  color: '#0F766E',
                  badge: 'USD'
                },
                {
                  id: 'paypal',
                  name: 'PayPal',
                  sub: 'Pay with your PayPal balance',
                  icon: Globe,
                  tint: '#dbeafe',
                  color: '#2563eb',
                  badge: 'USD'
                },
                {
                  id: 'applepay',
                  name: 'Apple Pay',
                  sub: 'Fast & secure checkout',
                  icon: Smartphone,
                  tint: '#f1f5f9',
                  color: '#0f172a',
                  badge: 'USD'
                },
                {
                  id: 'googlepay',
                  name: 'Google Pay',
                  sub: 'Fast & secure checkout',
                  icon: Globe,
                  tint: '#fef2f2',
                  color: '#ea4335',
                  badge: 'USD'
                }]).

                map((m) => {
                  const Icon = m.icon;
                  const active = payMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPayMethod(m.id)}
                      className="w-full flex items-center gap-3 rounded-[12px] border-2 p-3.5 text-left transition-all active:scale-[0.99]"
                      style={{
                        borderColor: active ? KTA.blue : KTA.border,
                        backgroundColor: active ? '#f0fdf4' : '#fff'
                      }}>
                      
                          <div
                        className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: m.tint
                        }}>
                        
                            <Icon
                          className="w-5 h-5"
                          style={{
                            color: m.color
                          }} />
                        
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <p
                            className="text-[14px] font-bold truncate min-w-0"
                            style={{
                              color: KTA.textPrimary
                            }}>
                            
                                {m.name}
                              </p>
                              {m.badge &&
                          <span
                            className="text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                              m.id === 'mkash' ? '#CCFBF1' : '#f1f5f9',
                              color:
                              m.id === 'mkash' ? KTA.green : '#475569'
                            }}>
                            
                                  {m.badge}
                                </span>
                          }
                            </div>
                            <p
                          className="text-[11px] truncate"
                          style={{
                            color: KTA.textSecondary
                          }}>
                          
                              {m.sub}
                            </p>
                          </div>
                          <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{
                          borderColor: active ? KTA.blue : KTA.border,
                          backgroundColor: active ? KTA.blue : '#fff'
                        }}>
                        
                            {active && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>);

                })}

                    {payTab === 'intl' &&
                <button
                  onClick={() => onChangePayment(chargedTotal)}
                  className="w-full flex items-center gap-3 rounded-[12px] border border-dashed p-3 text-left active:bg-gray-50 transition-colors"
                  style={{
                    borderColor: KTA.blue
                  }}>
                  
                        <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: '#f0fdf4'
                    }}>
                    
                          <Plus
                      className="w-5 h-5"
                      style={{
                        color: KTA.blue
                      }} />
                    
                        </div>
                        <div className="flex-1">
                          <p
                      className="text-[14px] font-bold"
                      style={{
                        color: KTA.blue
                      }}>
                      
                            Add a new card
                          </p>
                          <p
                      className="text-[11px]"
                      style={{
                        color: KTA.textSecondary
                      }}>
                      
                            Visa, Mastercard or Amex
                          </p>
                        </div>
                        <ChevronRight
                    className="w-5 h-5 shrink-0"
                    style={{
                      color: KTA.textSecondary
                    }} />
                  
                      </button>
                }
                  </div>

                  {/* Pay Later / Reserve Option */}
                  <div className="px-4 pb-5 pt-1">
                    <div className="relative flex items-center py-4">
                      <div className="flex-grow border-t border-gray-200"></div>
                      <span className="flex-shrink-0 mx-4 text-[12px] text-gray-400 font-medium">
                        Or
                      </span>
                      <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <button
                  type="button"
                  disabled={saveBookingLoading}
                  onClick={() => {
                    if (saveBookingLoading) return;
                    if (mode === 'flights') {
                      void reserveFlightBooking();
                      return;
                    }
                    setBookingStatus('reserved');
                    setScreen('ticket');
                  }}
                  className="w-full flex items-start gap-3 rounded-[12px] border p-4 text-left active:scale-[0.99] transition-transform disabled:opacity-60"
                  style={{
                    borderColor: '#f59e0b',
                    backgroundColor: '#fffbeb'
                  }}>
                  
                      <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: '#fef3c7'
                    }}>
                    
                        <Clock
                      className="w-5 h-5"
                      style={{
                        color: '#d97706'
                      }} />
                    
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                      className="text-[14px] font-bold"
                      style={{
                        color: '#92400e'
                      }}>
                      
                          Reserve & Pay Later
                        </p>
                        <p
                      className="text-[11px] mt-0.5 leading-snug"
                      style={{
                        color: '#b45309'
                      }}>
                      
                          {saveBookingLoading ?
                  'Confirming fare & saving booking with airline…' :
                  'Hold your seat without paying now. Payment pending, ticket unconfirmed until paid.'}
                        </p>
                      </div>
                      <ChevronRight
                    className="w-5 h-5 shrink-0 self-center"
                    style={{
                      color: '#d97706'
                    }} />
                  
                    </button>
                  </div>
                </div>
              </div>

              {/* Trust & Confidence */}
              <div className="flex flex-col items-center justify-center gap-2 mb-1 mt-0">
                <div className="flex items-center gap-5 text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span className="text-[11px] font-semibold">
                      256-bit SSL Secure
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4" />
                    <span className="text-[11px] font-semibold">
                      Verified Payment
                    </span>
                  </div>
                </div>
                <button
              onClick={() => showToast('Connecting to live chat...')}
              className="flex items-center gap-2 text-[12px] font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
              
                  <LifeBuoy className="w-4 h-4" />
                  24/7 Customer Support
                </button>
              </div>
            </div>
        )}

        {/* HOTELS / CAR / TOUR PAYMENT METHOD */}
        {screen === 'pay-method' && (mode === 'hotels' || mode === 'minibus') &&
        <div className="pb-4 bg-slate-50 -mt-2">
            {/* Header */}
            <div className="ethio-funnel-alt-header bg-white px-[18px] py-4 border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setScreen('payment');
                }}
                aria-label="Go back"
                className="ui-touch w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-transform">
                
                  <ArrowLeft className="w-4 h-4 text-slate-700 pointer-events-none" />
                </button>
                <h1 className="text-[16px] font-bold text-slate-900">
                  Payment
                </h1>
              </div>
              <div className="bg-teal-600 text-white text-[12px] font-bold px-3 py-1.5 rounded-full">
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="p-[18px] space-y-4">
              {mode === 'minibus' && carUsesSampleInventory &&
              <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <p className="text-[12px] text-amber-900">
                    {CAR_SAMPLE_BOOKING_NOTICE}
                  </p>
                </div>
              }
              {/* Collapsible Booking Summary */}
              <div className="glass-card overflow-hidden">
                <button
                onClick={() => setExpandPaySummary(!expandPaySummary)}
                className="w-full p-4 flex items-center justify-between bg-white">
                
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] overflow-hidden shrink-0">
                      <img
                      src={
                      mode === 'minibus' ?
                      selectedCar?.image :
                      mode === 'holiday' ?
                      selectedTour?.image || selectedTour?.images?.[0] :
                      selectedHotel?.image
                      }
                      alt={
                      mode === 'minibus' ?
                      selectedCar?.name :
                      mode === 'holiday' ?
                      selectedTour?.name :
                      selectedHotel?.name
                      }
                      className="w-full h-full object-cover" />
                    
                    </div>
                    <div className="text-left">
                      <h3 className="text-[14px] font-bold text-slate-900 leading-tight">
                        {mode === 'minibus' ?
                  selectedCar?.name :
                  mode === 'holiday' ?
                  selectedTour?.name :
                  selectedHotel?.name}
                      </h3>
                      <p className="text-[12px] text-slate-500">
                        {mode === 'minibus' ?
                  `${selectedClass?.name ?? selectedClassName} · ${carRentalDays} day${carRentalDays > 1 ? 's' : ''}` :
                  mode === 'holiday' ?
                  selectedTourModality?.name ||
                  selectedTour?.duration ||
                  'Tour package' :
                  `${roomCount}x ${selectedClass?.name ?? selectedClassName}`}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform ${expandPaySummary ? 'rotate-180' : ''}`} />
                
                </button>
                {expandPaySummary &&
              <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50">
                    {mode === 'minibus' ?
              <>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-slate-500">Pickup</span>
                          <span className="font-bold text-slate-900">
                            {carPickupDate ? formatCarDateShort(carPickupDate) : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-slate-500">Return</span>
                          <span className="font-bold text-slate-900">
                            {carReturnDate ? formatCarDateShort(carReturnDate) : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[12px]">
                          <span className="text-slate-500">Driver</span>
                          <span className="font-bold text-slate-900">
                            {travellers[0]?.firstName || travellers[0]?.name || 'Guest'}
                          </span>
                        </div>
                      </> :
              mode === 'holiday' ?
              <>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-slate-500">Travel from</span>
                          <span className="font-bold text-slate-900">
                            {hotelCheckInDateLabel || hotelCheckInDate || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-slate-500">Travel to</span>
                          <span className="font-bold text-slate-900">
                            {hotelCheckOutDateLabel || hotelCheckOutDate || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[12px]">
                          <span className="text-slate-500">Travellers</span>
                          <span className="font-bold text-slate-900">
                            {hotelAdultCount} Adult
                            {hotelAdultCount === 1 ? '' : 's'}
                            {hotelChildCount > 0 ?
                    ` · ${hotelChildCount} Child${hotelChildCount === 1 ? '' : 'ren'}` :
                    ''}
                            {hotelInfantCount > 0 ?
                    ` · ${hotelInfantCount} Infant${hotelInfantCount === 1 ? '' : 's'}` :
                    ''}
                          </span>
                        </div>
                      </> :

              <>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-slate-500">Check-in</span>
                          <span className="font-bold text-slate-900">
                            {selectedHotel?.checkIn?.split(' ')[0] || '16 Jun'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-slate-500">Check-out</span>
                          <span className="font-bold text-slate-900">
                            {selectedHotel?.checkOut?.split(' ')[0] || '18 Jun'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[12px]">
                          <span className="text-slate-500">Guests</span>
                          <span className="font-bold text-slate-900">
                            {travellers.length} Guest
                            {travellers.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </>
              }
                  </div>
              }
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <span className="text-[14px] font-bold text-slate-900">
                    Amount to be paid
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-bold text-slate-900">
                      {cur(
                  chargedTotal,
                  displayCurrency
                )}
                    </span>
                    <button onClick={() => showToast('Fare breakdown')}>
                      <Info className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Banner */}
              <div className="bg-[#fff8e1] rounded-[12px] p-3 flex items-start gap-2 border border-[#fde68a]">
                <ShieldCheck className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#92400e] leading-snug">
                  Mkash secures your payment in escrow until{' '}
                  {mode === 'minibus' ?
                'pickup' :
                mode === 'holiday' ?
                'travel start' :
                'check-in'}
                  .
                </p>
              </div>

              {/* Payment Option Groups */}
              <div className="space-y-6">
                {/* 1. Wallet & Mobile Money */}
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900 mb-3 px-1">
                    Pay via Wallet or Mobile Money
                  </h3>
                  <div className="glass-card overflow-hidden">
                    {/* mKash Wallet */}
                    <label className="flex items-center justify-between p-4 border-b border-slate-100 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-teal-50 flex items-center justify-center shrink-0">
                          <Wallet className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-slate-900">
                            mKash Wallet
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Balance: {walletCreditLabel || fmtMoney(walletDisplayAmount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-green-100 text-teal-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                          Instant · No fees
                        </span>
                        <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payMethod === 'mkash' ? 'border-teal-600' : 'border-slate-300'}`}>
                        
                          {payMethod === 'mkash' &&
                        <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                        }
                        </div>
                      </div>
                      <input
                      type="radio"
                      name="payMethod"
                      value="mkash"
                      checked={payMethod === 'mkash'}
                      onChange={() => setPayMethod('mkash')}
                      className="hidden" />
                    
                    </label>

                    {/* Mobile Money */}
                    <label className="flex items-center justify-between p-4 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-blue-50 flex items-center justify-center shrink-0">
                          <Smartphone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-slate-900">
                            Mobile Money
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Telebirr, CBE Birr, M-PESA
                          </p>
                        </div>
                      </div>
                      <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payMethod === 'mobile' ? 'border-teal-600' : 'border-slate-300'}`}>
                      
                        {payMethod === 'mobile' &&
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                      }
                      </div>
                      <input
                      type="radio"
                      name="payMethod"
                      value="mobile"
                      checked={payMethod === 'mobile'}
                      onChange={() => setPayMethod('mobile')}
                      className="hidden" />
                    
                    </label>
                  </div>
                </div>

                {/* 2. Someone else is paying */}
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900 mb-3 px-1">
                    Someone else is paying?
                  </h3>
                  <div className="glass-card overflow-hidden">
                    <button
                    onClick={() => showToast('Showing QR code...')}
                    className="w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors">
                    
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-red-50 flex items-center justify-center shrink-0">
                          <QrCode className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-[14px] font-bold text-red-500">
                            Show QR to Payer
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Payer scans QR from their Mkash app
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Credit/Debit/ATM Card */}
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900 mb-3 px-1">
                    Credit/Debit/ATM Card
                  </h3>
                  <div className="glass-card overflow-hidden">
                    <button
                    onClick={() => showToast('Add new card')}
                    className="w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors">
                    
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-red-50 flex items-center justify-center shrink-0">
                          <Plus className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-[14px] font-bold text-red-500">
                            Add New Card
                          </p>
                          <p className="text-[11px] text-slate-500">
                            VISA, Mastercard, Amex & more
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 5. More Payment Methods */}
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900 mb-3 px-1">
                    More Payment Methods
                  </h3>
                  <div className="glass-card overflow-hidden">
                    {/* Net Banking */}
                    <button
                    onClick={() => showToast('Select bank')}
                    className="w-full flex items-center justify-between p-4 border-b border-slate-100 active:bg-slate-50 transition-colors">
                    
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-slate-50 flex items-center justify-center shrink-0">
                          <Landmark className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-[14px] font-bold text-slate-900">
                            Net Banking
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Select from list of banks
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>

                    {/* Pay at Hotel */}
                    <label className="flex items-center justify-between p-4 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-slate-50 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-slate-900">
                            Pay at Hotel
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Reserve now, pay on arrival
                          </p>
                        </div>
                      </div>
                      <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${payMethod === 'hotel' ? 'border-teal-600' : 'border-slate-300'}`}>
                      
                        {payMethod === 'hotel' &&
                      <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                      }
                      </div>
                      <input
                      type="radio"
                      name="payMethod"
                      value="hotel"
                      checked={payMethod === 'hotel'}
                      onChange={() => setPayMethod('hotel')}
                      className="hidden" />
                    
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        {/* TICKET / CONFIRMATION */}
        {screen === 'ticket' && mode === 'holiday' && selectedTour &&
        <div className="bg-[#f4f6f8]">
            <HolidayTicketConfirmation
            tourName={selectedTour.name}
            subtitle={`${hotelCheckInDateLabel || hotelCheckInDate || '—'} → ${hotelCheckOutDateLabel || hotelCheckOutDate || '—'} · ${hotelAdultCount} Adult${hotelAdultCount === 1 ? '' : 's'}${hotelChildCount > 0 ? ` · ${hotelChildCount} Child${hotelChildCount === 1 ? '' : 'ren'}` : ''}${hotelInfantCount > 0 ? ` · ${hotelInfantCount} Infant${hotelInfantCount === 1 ? '' : 's'}` : ''}`}
            total={total}
            currency={displayCurrency}
            paymentLabel={formatPayMethodLabel(payMethod)}
            bookingReference={bookingReference}
            travellerName={
            travellers[0]?.name?.trim() ||
            travellers[0]?.firstName ||
            'Guest'
            }
            destination={
            selectedTour.location || extractTourDestinationName(to) || to
            }
            travelFrom={hotelCheckInDateLabel || hotelCheckInDate || '—'}
            travelTo={hotelCheckOutDateLabel || hotelCheckOutDate || '—'}
            packageName={
            selectedTourModality?.name || selectedTour.duration || 'Tour'
            }
            adults={hotelAdultCount}
            email={travellers[0]?.email || contactEmail}
            onAction={(action) => {
              if (action === 'support') {
                handleSupport();
                return;
              }
              handleHolidayTicketAction(action);
            }} />
          </div>
        }
        {screen === 'ticket' && mode === 'bus' && outbound &&
        <div className="bg-[#f4f6f8]">
            <HolidayTicketConfirmation
            tourName={`${stripCityLabel(from)} → ${stripCityLabel(to)}`}
            subtitle={`${formatBusTravelDateLabel(parseBusTravelDate(travelDate))} · ${travellers.length} Adult${travellers.length === 1 ? '' : 's'}${outbound.busType ? ` · ${outbound.busType}` : ''}`}
            total={total}
            currency={outbound.currency || currencyCode || 'ETB'}
            paymentLabel={formatPayMethodLabel(payMethod)}
            bookingReference={
            busBookingId ?
            `REF ${busBookingId}` :
            bookingReference
            }
            statusLabel={
            bookingStatus === 'confirmed' ? 'Confirmed' : 'Reserved'
            }
            travellerName={
            travellers[0]?.name?.trim() ||
            travellers[0]?.firstName ||
            'Guest'
            }
            destination={stripCityLabel(to)}
            travelFrom={formatBusTravelDateLabel(parseBusTravelDate(travelDate))}
            travelTo={outbound.arriveTime || '—'}
            packageName={`${outbound.operator} · ${outbound.busType || 'Bus'}`}
            adults={travellers.length}
            email={travellers[0]?.email || contactEmail}
            confirmationDetails={[
              ['Operator', outbound.operator],
              ['Bus type', outbound.busType || '—'],
              ['Departure', outbound.departTime || '—'],
              ['Arrival', outbound.arriveTime || '—'],
              ['Seats', selectedSeats.join(', ') || '—'],
              [
                'Boarding',
                boardingPoints.find((b) => b.id === selectedBoardingPoint)?.
                name ||
                selectedBoardingPoint ||
                '—'
              ],
              [
                'Dropping',
                droppingPoints.find((d) => d.id === selectedDroppingPoint)?.
                name ||
                selectedDroppingPoint ||
                '—'
              ],
              [
                'Passengers',
                travellers.
                map((t) => t.name?.trim() || t.firstName?.trim()).
                filter(Boolean).
                join(', ') || '—'
              ]
            ]}
            onAction={(action) => {
              if (action === 'support') {
                handleSupport();
                return;
              }
              if (action === 'preview' || action === 'print') {
                openTicketPdf();
                return;
              }
              if (action === 'pdf' || action === 'invoice') {
                openTicketPdf({ download: true });
                return;
              }
              if (action === 'email') {
                handleEmailTicket();
                return;
              }
              if (action === 'share') {
                void handleShareTicket();
                return;
              }
              if (action === 'calendar') {
                handleAddToCalendar();
              }
            }} />
          </div>
        }
        {screen === 'ticket' && (outbound || selectedHotel || selectedCar || selectedTour) && mode !== 'holiday' && mode !== 'bus' &&
        <div className="px-[18px] pt-3 relative">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="relative w-28 h-28 mb-3 flex items-center justify-center">
                {/* Soft blurred halo */}
                <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.5, 0.75, 0.5]
                }}
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute w-24 h-24 rounded-full blur-xl"
                style={{
                  backgroundColor:
                  bookingStatus === 'confirmed' ? '#86efac' : '#fcd34d',
                  opacity: 0.5
                }} />
              

                {/* Radiating pulse rings (confirmed only) — gentle, contained */}
                {bookingStatus === 'confirmed' &&
              [0, 0.9].map((delay, i) =>
              <motion.span
                key={i}
                initial={{
                  scale: 0.95,
                  opacity: 0.35
                }}
                animate={{
                  scale: 1.45,
                  opacity: 0
                }}
                transition={{
                  duration: 2.2,
                  delay,
                  repeat: Infinity,
                  ease: 'easeOut'
                }}
                className="absolute w-24 h-24 rounded-full"
                style={{
                  border: `1.5px solid ${KTA.green}`
                }} />

              )}

                {/* Sparkle burst (confirmed only) */}
                {bookingStatus === 'confirmed' &&
              Array.from({
                length: 8
              }).map((_, i) => {
                const angle = i / 8 * Math.PI * 2;
                return (
                  <motion.span
                    key={i}
                    initial={{
                      x: 0,
                      y: 0,
                      scale: 0,
                      opacity: 0
                    }}
                    animate={{
                      x: Math.cos(angle) * 46,
                      y: Math.sin(angle) * 46,
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 1.1,
                      delay: 0.35 + i * 0.03,
                      ease: 'easeOut'
                    }}
                    className="absolute w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: i % 2 === 0 ? KTA.green : '#86efac'
                    }} />);


              })}

                <motion.div
                initial={{
                  scale: 0,
                  opacity: 0,
                  rotate: -30
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  rotate: 0
                }}
                transition={{
                  type: 'spring',
                  stiffness: 220,
                  damping: 16
                }}
                className="w-24 h-24 rounded-full flex items-center justify-center relative z-10"
                style={{
                  background:
                  bookingStatus === 'confirmed' ?
                  'linear-gradient(135deg, #ecfdf3 0%, #bbf7d0 100%)' :
                  'linear-gradient(135deg, #fffbeb 0%, #fde68a 100%)',
                  boxShadow:
                  bookingStatus === 'confirmed' ?
                  '0 8px 24px -6px rgba(22,163,74,0.45)' :
                  '0 8px 24px -6px rgba(245,158,11,0.45)',
                  border: `3px solid #ffffff`
                }}>
                
                  <motion.div
                  initial={{
                    scale: 0
                  }}
                  animate={{
                    scale: 1
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 14,
                    delay: 0.3
                  }}
                  className="relative z-10">
                  
                    {bookingStatus === 'confirmed' ?
                  <CheckCircle2
                    className="w-12 h-12"
                    style={{
                      color: KTA.green
                    }} /> :


                  <Clock
                    className="w-12 h-12"
                    style={{
                      color: '#d97706'
                    }} />

                  }
                  </motion.div>
                </motion.div>
              </div>
              <motion.h2
              initial={{
                y: 16,
                opacity: 0,
                scale: 0.92
              }}
              animate={{
                y: 0,
                opacity: 1,
                scale: 1
              }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 18,
                delay: 0.45
              }}
              className="text-[28px] font-extrabold mb-1 tracking-tight"
              style={{
                color: KTA.textPrimary
              }}>
              
                {bookingStatus === 'confirmed' ?
              'Booking Confirmed!' :
              'Reservation Created'}
              </motion.h2>
              <motion.p
              initial={{
                y: 20,
                opacity: 0
              }}
              animate={{
                y: 0,
                opacity: 1
              }}
              transition={{
                delay: 0.4
              }}
              className="text-[14px]"
              style={{
                color: KTA.textSecondary
              }}>
              
                Ref:{' '}
                <span
                className="font-bold tracking-wider"
                style={{
                  color: KTA.textPrimary
                }}>
                
                  {bookingReference}
                </span>
              </motion.p>
            </div>

            {/* Dynamic Progress */}
            <motion.div
            initial={{
              y: 20,
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
            transition={{
              delay: 0.5
            }}
            className="bg-white rounded-[20px] border p-5 pt-6 mb-6 shadow-sm"
            style={{
              borderColor: KTA.border
            }}>
            
              {(() => {
              const steps = [
              {
                label: 'Reserved',
                done: true
              },
              {
                label: 'Payment',
                done: bookingStatus === 'confirmed'
              },
              {
                label: 'Ticket Sent',
                done: bookingStatus === 'confirmed'
              }];

              const doneCount = steps.filter((s) => s.done).length;
              const fillPct =
              steps.length > 1 ?
              (doneCount - 1) / (steps.length - 1) * 100 :
              0;
              return (
                <div className="relative">
                    {/* Continuous track aligned to circle centers (circles are 36px tall → center at 18px) */}
                    <div className="absolute left-[16%] right-[16%] top-[18px] h-1.5 -translate-y-1/2 bg-gray-100 rounded-full" />
                    {/* Animated gradient fill */}
                    <motion.div
                    initial={{
                      width: '0%'
                    }}
                    animate={{
                      width: `${fillPct / 100 * 68}%`
                    }}
                    transition={{
                      duration: 1,
                      delay: 0.8,
                      ease: 'easeInOut'
                    }}
                    className="absolute left-[16%] top-[18px] h-1.5 -translate-y-1/2 rounded-full overflow-hidden"
                    style={{
                      background: `linear-gradient(90deg, ${KTA.green} 0%, #34d399 100%)`
                    }}>
                    
                      <motion.div
                      animate={{
                        x: ['-100%', '300%']
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 1.6
                      }}
                      className="absolute inset-y-0 w-1/3"
                      style={{
                        background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)'
                      }} />
                    
                    </motion.div>

                    <div className="relative z-10 flex justify-between">
                      {steps.map((step, i) =>
                    <div
                      key={step.label}
                      className="flex flex-col items-center gap-2 flex-1">
                      
                          <div className="relative flex items-center justify-center">
                            {step.done &&
                        <motion.span
                          initial={{
                            scale: 0.8,
                            opacity: 0.5
                          }}
                          animate={{
                            scale: 1.9,
                            opacity: 0
                          }}
                          transition={{
                            duration: 1.8,
                            delay: 0.9 + i * 0.2,
                            repeat: Infinity,
                            ease: 'easeOut'
                          }}
                          className="absolute w-9 h-9 rounded-full"
                          style={{
                            border: `2px solid ${KTA.green}`
                          }} />

                        }
                            <motion.div
                          initial={{
                            scale: 0
                          }}
                          animate={{
                            scale: 1
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 16,
                            delay: 0.6 + i * 0.2
                          }}
                          className="w-9 h-9 rounded-full flex items-center justify-center"
                          style={{
                            background: step.done ?
                            `linear-gradient(135deg, ${KTA.green} 0%, #15803d 100%)` :
                            '#fff',
                            border: step.done ?
                            '2px solid #fff' :
                            '2px solid #e2e8f0',
                            boxShadow: step.done ?
                            `0 4px 10px -2px ${KTA.green}66` :
                            '0 1px 2px rgba(0,0,0,0.04)'
                          }}>
                          
                              {step.done ?
                          <motion.div
                            initial={{
                              scale: 0
                            }}
                            animate={{
                              scale: 1
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 400,
                              damping: 14,
                              delay: 0.75 + i * 0.2
                            }}>
                            
                                  <Check
                              className="w-4 h-4 text-white"
                              strokeWidth={3} />
                            
                                </motion.div> :

                          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                          }
                            </motion.div>
                          </div>
                          <span
                        className="text-[11px] font-bold text-center"
                        style={{
                          color: step.done ?
                          KTA.textPrimary :
                          KTA.textSecondary
                        }}>
                        
                            {step.label}
                          </span>
                        </div>
                    )}
                    </div>
                  </div>);

            })()}
            </motion.div>

            {/* Notification Banner */}
            <motion.div
            initial={{
              y: 20,
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
            transition={{
              delay: 0.6
            }}
            className="rounded-[16px] p-4 mb-6 shadow-sm"
            style={{
              backgroundColor:
              bookingStatus === 'confirmed' ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${bookingStatus === 'confirmed' ? '#bbf7d0' : '#fde68a'}`
            }}>
            
              <p
              className="text-[13px] leading-relaxed"
              style={{
                color: bookingStatus === 'confirmed' ? '#166534' : '#92400e'
              }}>
              
                {bookingStatus === 'confirmed' ?
              <>
                    <strong className="block mb-1 text-[14px]">
                      Your booking has been confirmed successfully.
                    </strong>
                    {mode === 'holiday' ?
                <>
                        Your tour booking reference is{' '}
                        <strong>{bookingReference}</strong>. Details have been
                        sent to{' '}
                        {travellers[0]?.email || contactEmail || 'your email'}.
                      </> :

                <>
                        Your ticket has been sent to your registered email address (
                        {contactEmail || travellers[0]?.email || 'your email'}). You can also download or share your ticket
                        using the options below.
                      </>
                }
                  </> :

              <>
                    <strong className="block mb-1 flex items-center gap-1.5 text-[14px]">
                      <Clock className="w-4 h-4" /> Payment Pending
                    </strong>
                    Your reservation will be held for 24 hours. Please complete
                    your payment to confirm your ticket. Unpaid reservations are
                    automatically cancelled.
                  </>
              }
              </p>
            </motion.div>

            {/* Boarding Pass / Booking Details */}
            {(outbound || selectedHotel || selectedCar || selectedTour) &&
          <motion.div
            initial={{
              y: 20,
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
            transition={{
              delay: 0.7
            }}
            className="bg-white rounded-[24px] border shadow-md mb-6 overflow-hidden relative"
            style={{
              borderColor: KTA.border
            }}>
            
                {/* Boarding Pass Cutouts */}
                <div className="absolute top-[140px] -left-3 w-6 h-6 bg-[#faf7f2] rounded-full border-r border-gray-200" />
                <div className="absolute top-[140px] -right-3 w-6 h-6 bg-[#faf7f2] rounded-full border-l border-gray-200" />
                <div className="absolute top-[152px] left-4 right-4 h-[1px] border-t-2 border-dashed border-gray-200" />

                <div className="p-6 pb-6">
                  {mode === 'flights' && outbound ?
              <>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2 min-w-0">
                          <AirlineLogo
                            src={outbound.operatorLogo}
                            name={outbound.operator}
                            initial={outbound.operatorInitial}
                            color={outbound.operatorColor}
                            className="w-8 h-8" />
                          
                          <div className="min-w-0">
                            <span className="text-[14px] font-bold text-gray-800 block truncate">
                              {outbound.operator}
                            </span>
                            {outbound.flightNo &&
                          <span className="text-[11px] text-gray-500">
                                {outbound.flightNo}
                              </span>
                          }
                          </div>
                        </div>
                        <span className="text-[12px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md shrink-0">
                          {(selectedClass?.name ?? selectedClassName).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex justify-between items-end mb-2 relative">
                        <div className="w-1/3">
                          <p className="text-[32px] font-black leading-none text-gray-900">
                            {flightDepartAirport}
                          </p>
                          <p className="text-[12px] text-gray-500 mt-1 font-medium">
                            {outbound.fromCity}
                          </p>
                          <p className="text-[14px] font-bold text-gray-800 mt-2">
                            {outbound.departTime}
                          </p>
                        </div>

                        <div className="w-1/3 flex flex-col items-center justify-center pb-2">
                          <p className="text-[11px] font-bold text-gray-400 mb-2">
                            {outbound.duration}
                          </p>
                          <div className="w-full relative flex items-center justify-center px-1">
                            <div className="w-full border-t-2 border-dashed border-gray-200" />
                            <div className="absolute bg-white px-1.5">
                              <Plane className="w-5 h-5 text-teal-600 rotate-90" />
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-2">
                            {flightStopLabel}
                          </p>
                        </div>

                        <div className="w-1/3 text-right">
                          <p className="text-[32px] font-black leading-none text-gray-900">
                            {flightArriveAirport}
                          </p>
                          <p className="text-[12px] text-gray-500 mt-1 font-medium">
                            {outbound.toCity}
                          </p>
                          <p className="text-[14px] font-bold text-gray-800 mt-2">
                            {outbound.arriveTime}
                          </p>
                        </div>
                      </div>
                    </> :

              <div className="flex items-center gap-4 mb-8">
                      {mode === 'holiday' && (selectedTour?.image || selectedTour?.images?.[0]) ?
                <div className="w-14 h-14 rounded-[12px] overflow-hidden shrink-0 bg-slate-100">
                        <img
                    src={selectedTour.image || selectedTour.images?.[0]}
                    alt={selectedTour.name}
                    className="w-full h-full object-cover" />
                  
                      </div> :

                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                        <ModeIcon className="w-7 h-7 text-blue-600" />
                      </div>
                }
                      <div className="min-w-0">
                        <p className="text-[20px] font-black text-gray-900 truncate">
                          {mode === 'hotels' ?
                    selectedHotel?.name :
                    mode === 'holiday' ?
                    selectedTour?.name :
                    selectedCar?.name}
                        </p>
                        <p className="text-[13px] text-gray-500 font-medium truncate">
                          {mode === 'hotels' ?
                    selectedHotel?.location :
                    mode === 'holiday' ?
                    selectedTour?.location || to :
                    `Pickup: ${from}`}
                        </p>
                      </div>
                    </div>
              }

                  <div className="grid grid-cols-2 gap-y-5 gap-x-4 mt-4">
                    {(() => {
                const money = fmtMoney(total);
                const totalLabel =
                bookingStatus === 'confirmed' ? 'Total Paid' : 'Total Due';
                const paymentVal =
                bookingStatus === 'confirmed' ?
                payMethod.toUpperCase() :
                'PENDING';
                const seatVal = selectedSeats.length ?
                selectedSeats.join(', ') :
                mode === 'flights' ?
                selectedSeat :
                '—';
                let fields: [string, string][] = [];
                if (mode === 'hotels') {
                  fields = [
                  ['Guest', travellers[0]?.name?.trim() || 'Guest'],
                  ['Reference', bookingReference],
                  ['Check-in', '16 Jun 2026'],
                  ['Check-out', '18 Jun 2026'],
                  ['Nights', '2'],
                  ['Room type', selectedHotel?.roomType || 'Standard'],
                  [
                  'Guests / Rooms',
                  `${travellers.length} · ${roomCount}`],
                  [totalLabel, money],
                  ['Payment', paymentVal]];
                } else if (mode === 'minibus') {
                  fields = [
                  ['Driver', travellers[0]?.name?.trim() || 'Guest'],
                  ['Reference', bookingReference],
                  ['Pick-up', `${from} · 16 Jun`],
                  ['Drop-off', `${from} · 19 Jun`],
                  ['Rental days', '3'],
                  [
                  'Transmission',
                  selectedCar?.transmission || 'Automatic'],
                  ['Seats', `${selectedCar?.seats ?? 4}`],
                  [totalLabel, money],
                  ['Payment', paymentVal]];
                } else if (mode === 'holiday') {
                  fields = [
                  ['Traveller', travellers[0]?.name?.trim() || travellers[0]?.firstName || 'Guest'],
                  ['Reference', bookingReference],
                  ['Status', bookingStatus === 'confirmed' ? 'Confirmed' : 'Reserved'],
                  ['Destination', selectedTour?.location || extractTourDestinationName(to) || to],
                  ['Travel from', hotelCheckInDateLabel || hotelCheckInDate || '—'],
                  ['Travel to', hotelCheckOutDateLabel || hotelCheckOutDate || '—'],
                  ['Package', selectedTourModality?.name || selectedTour?.duration || 'Tour'],
                  ['Adults', String(hotelAdultCount)],
                  [totalLabel, money],
                  ['Payment', paymentVal]];
                } else if (mode === 'bus' || mode === 'train') {
                  fields = [
                  ['Passenger', travellers[0]?.name?.trim() || 'Guest'],
                  ['Date', '16 Jun 2026'],
                  ['Service', outbound?.operator || '—'],
                  ['Seat', seatVal],
                  ['Boarding', boardingPoints.find((b) => b.id === selectedBoardingPoint)?.name || selectedBoardingPoint || 'Main terminal'],
                  ['Dropping', droppingPoints.find((d) => d.id === selectedDroppingPoint)?.name || selectedDroppingPoint || 'Central'],
                  [totalLabel, money],
                  ['Payment', paymentVal]];
                } else {
                  fields = [
                  ['Passenger', travellers[0]?.name?.trim() || 'Abdiwahab'],
                  ['Date', '16 Jun 2026'],
                  ['Flight', outbound?.flightNo || 'ET 100'],
                  ['Seat', seatVal],
                  ['Class', selectedClass?.name ?? selectedClassName],
                  ['Gate', 'A12'],
                  [totalLabel, money],
                  ['Payment', paymentVal]];
                }
                return fields.map(([l, v]) =>
                <div key={l} className="min-w-0">
                        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">
                          {l}
                        </p>
                        <p
                    className="text-[14px] font-bold text-gray-800 truncate"
                    style={{
                      color:
                      l === 'Payment' && bookingStatus === 'reserved' ?
                      '#d97706' :
                      undefined
                    }}>
                          {v}
                        </p>
                      </div>
                );
              })()}
                  </div>
                </div>
              </motion.div>
          }

            {(bookingStatus === 'confirmed' || bookingStatus === 'reserved') && mode === 'flights' && flightPnr &&
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.75 }}
            className="bg-white rounded-[20px] border shadow-sm mb-6 p-5 flex flex-col items-center"
            style={{ borderColor: KTA.border }}>
                <Barcode className="w-48 h-12 text-gray-800 opacity-80" />
                <p className="text-[11px] font-mono text-gray-500 mt-2 tracking-widest">
                  {flightPnr}
                </p>
              </motion.div>
          }

            {/* Post-Booking Utility Cards (Confirmed Only) */}
            {bookingStatus === 'confirmed' && mode === 'flights' &&
          <motion.div
            initial={{
              y: 20,
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
            transition={{
              delay: 0.8
            }}
            className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-[16px] p-4 border shadow-sm flex flex-col justify-between"
              style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
                  <CloudSun className="w-6 h-6 mb-2" style={{ color: '#1e40af' }} />
                  <div>
                    <p className="text-[11px] font-semibold mb-0.5" style={{ color: '#1e40af' }}>
                      Weather in {outbound?.arriveCityCode || outbound?.toCity || to}
                    </p>
                    <p className="text-[15px] font-black flex items-center gap-0.5" style={{ color: '#1e3a8a' }}>
                      24°C Sunny <ChevronRight className="w-3.5 h-3.5" />
                    </p>
                  </div>
                </div>
                <button
              onClick={() => showToast('Searching hotels...')}
              className="text-left rounded-[16px] p-4 border shadow-sm flex flex-col justify-between active:scale-95 transition-transform"
              style={{ backgroundColor: '#f5f3ff', borderColor: '#ddd6fe' }}>
                  <HotelIcon className="w-6 h-6 mb-2" style={{ color: '#5b21b6' }} />
                  <div>
                    <p className="text-[11px] font-semibold mb-0.5" style={{ color: '#5b21b6' }}>
                      Need a place to stay?
                    </p>
                    <p className="text-[13px] font-bold flex items-center gap-1" style={{ color: '#4c1d95' }}>
                      Book a hotel <ChevronRight className="w-3 h-3" />
                    </p>
                  </div>
                </button>
              </motion.div>
          }

            {/* Ticket Delivery Options (Only if confirmed) */}
            {bookingStatus === 'confirmed' &&
          <motion.div
            initial={{
              y: 20,
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
            transition={{
              delay: 0.9
            }}
            className="mb-4">
            
                <p
              className="text-[14px] font-bold mb-2.5 px-1"
              style={{
                color: KTA.textPrimary
              }}>
              
                  Ticket Options
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
              {
                icon: Eye,
                label: 'Preview',
                action: () => setShowBoardingPass(true)
              },
              {
                icon: Download,
                label: 'PDF',
                action: () => openTicketPdf({ download: true })
              },
              {
                icon: Send,
                label: 'Email',
                action: handleEmailTicket
              },
              {
                icon: Share2,
                label: 'Share',
                action: () => {
                  void handleShareTicket();
                }
              },
              {
                icon: Calendar,
                label: 'Calendar',
                action: handleAddToCalendar
              },
              {
                icon: FileText,
                label: 'Invoice',
                action: () => openTicketPdf({ download: true })
              },
              {
                icon: Printer,
                label: 'Print',
                action: () => openTicketPdf()
              }].
              map((opt) =>
              <button
                key={opt.label}
                type="button"
                onClick={opt.action}
                className="flex flex-col items-center justify-center gap-2 bg-white rounded-[12px] border p-3 shadow-sm active:scale-95 transition-transform"
                style={{
                  borderColor: KTA.border
                }}>
                
                      <opt.icon
                  className="w-5 h-5"
                  style={{
                    color: KTA.green
                  }}
                  strokeWidth={2} />
                
                      <span
                  className="text-[10px] font-semibold"
                  style={{
                    color: KTA.textSecondary
                  }}>
                  
                        {opt.label}
                      </span>
                    </button>
              )}
                </div>
              </motion.div>
          }

            {/* Quick Actions */}
            <motion.div
            initial={{
              y: 20,
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
            transition={{
              delay: 1
            }}
            className="space-y-2.5">
            
              {bookingStatus === 'confirmed' ?
            <button
              type="button"
              onClick={() => openTicketPdf({ download: true })}
              className="w-full h-12 rounded-[14px] text-white font-bold text-[15px] active:scale-[0.99] transition-transform flex items-center justify-center gap-2 shadow-md"
              style={{
                backgroundColor: '#14532d'
              }}>
              
                  <Download className="w-5 h-5" />
                  View Ticket (PDF)
                </button> :

            <button
              onClick={() => {
                setBookingStatus('confirmed');
                onPay(total, () => {}, bookingId);
              }}
              className="w-full h-12 rounded-[14px] text-white font-bold text-[15px] active:scale-[0.99] transition-transform flex items-center justify-center gap-2 shadow-md"
              style={{
                backgroundColor: KTA.green
              }}>
              
                  <Wallet className="w-5 h-5" />
                  Pay now to confirm
                </button>
            }
              <div className="grid grid-cols-2 gap-3">
                <button
                type="button"
                onClick={() => setShowTicketDetails(true)}
                className="h-11 rounded-[12px] font-bold text-[13px] active:scale-[0.99] transition-transform flex items-center justify-center gap-2 border bg-white"
                style={{
                  borderColor: KTA.border,
                  color: KTA.textPrimary
                }}>
                
                  <Eye className="w-4 h-4" /> View Details
                </button>
                <button
                type="button"
                onClick={handleSupport}
                className="h-11 rounded-[12px] font-bold text-[13px] active:scale-[0.99] transition-transform flex items-center justify-center gap-2 border bg-white"
                style={{
                  borderColor: KTA.border,
                  color: KTA.textPrimary
                }}>
                
                  <MessageSquare className="w-4 h-4" /> Support
                </button>
              </div>
            </motion.div>
          </div>
        }

      {/* Footers — in-flow under content (no empty gap above CTA) */}
      {screen === 'return' && returnTrip === null && null}
      {screen === 'class' && !(mode === 'holiday' && selectedTour) &&
      <Footer
        label={
        mode === 'flights' ?
        flightCheckoutStep === 'cabin' ?
        `Continue to traveller details · ${fmtMoney(total)}` :
        `Continue to review · ${fmtMoney(total)}` :
        mode === 'bus' || mode === 'train' ?
        'Select seats' :
        'Go to passenger details'
        }
        dim={
        mode === 'flights' && flightCheckoutStep === 'travellers' ?
        !flightClassContinueReady :
        false
        }
        hint={
        mode === 'flights' && flightCheckoutStep === 'travellers' && !flightClassContinueReady ?
        !flightTravellersReady ?
        'Fill in all traveller and contact details first.' :
        undefined :
        mode === 'minibus' && carUsesSampleInventory ?
        CAR_SAMPLE_BOOKING_NOTICE :
        undefined
        }
        onClick={() =>
        {
          if (mode === 'flights' && flightCheckoutStep === 'cabin') {
            goToFlightTravellersStep();
            return;
          }
          if (mode === 'flights' && !flightClassContinueReady) return;
          if (mode === 'flights' && !validateFlightBookingDetails()) return;
          if (mode === 'bus') setBusSeatFetchToken((n) => n + 1);
          setScreen(
            mode === 'bus' || mode === 'train' ? 'seats' : 'passenger'
          );
        }} />

      }
      {screen === 'seats' &&
      <Footer
        label={
        saveBookingLoading ?
        'Confirming seats…' :
        'Go to passenger details'
        }
        dim={
        selectedSeats.length < travellers.length ||
        (mode === 'bus' && saveBookingLoading)
        }
        hint={
        selectedSeats.length < travellers.length ?
        `Select ${travellers.length} seat${travellers.length === 1 ? '' : 's'}` :
        undefined
        }
        onClick={() => {
          void (async () => {
            if (mode === 'bus') {
              const ok = await confirmBusSeatSelection();
              if (!ok) return;
            }
            setScreen('passenger');
          })();
        }} />

      }
      {screen === 'points' &&
      <Footer
        label={
        pointsStep === 'boarding' ?
        'Select dropping point' :
        'Confirm points'
        }
        dim={
        pointsStep === 'boarding' ?
        !selectedBoardingPoint :
        !selectedDroppingPoint
        }
        hint={
        pointsStep === 'boarding' && !selectedBoardingPoint ?
        'Select where you will board the bus.' :
        pointsStep === 'dropping' && !selectedDroppingPoint ?
        'Select where you will get off.' :
        undefined
        }
        onClick={() => {
          if (pointsStep === 'boarding') {
            if (selectedBoardingPoint) setPointsStep('dropping');
          } else if (selectedDroppingPoint) {
            if (mode === 'bus') setBusSeatFetchToken((n) => n + 1);
            setScreen('seats');
          }
        }} />

      }
      {screen === 'passenger' && mode !== 'holiday' &&
      <Footer
        label={
        mode === 'flights' ?
        `Proceed to payment · ${fmtMoney(total)}` :
        mode === 'bus' || mode === 'train' || mode === 'minibus' ?
        `Continue to payment · ${travellers.length} traveller${travellers.length === 1 ? '' : 's'}` :
        'Review journey details'
        }
        dim={
          (mode === 'flights' && !flightTravellersReady) ||
          ((mode === 'bus' || mode === 'train') && !busTravellersReady) ||
          (mode === 'minibus' && !carTravellersReady)
        }
        hint={
        mode === 'flights' && !flightTravellersReady ?
        'Complete traveller details on the previous step first.' :
        (mode === 'bus' || mode === 'train' || mode === 'minibus') &&
        !(mode === 'minibus' ? carTravellersReady : busTravellersReady) ?
        `Fill details for all ${travellers.length} travellers including passport (issue ≤ today; expiry on/after the day after your trip ends).` :
        undefined
        }
        onClick={() => {
          if (mode === 'flights' && !validateFlightBookingDetails()) return;
          if ((mode === 'bus' || mode === 'train') && !busTravellersReady) return;
          if (mode === 'minibus' && !carTravellersReady) return;
          setScreen('payment');
        }} />

      }
      {screen === 'tickets' && mode === 'holiday' && selectedTour &&
      <Footer
        label={`Continue · ${fmtMoney(
          (selectedTourModality?.rate ??
            tourDetails.details?.priceBreakdown?.total ??
            tourDetails.details?.price ??
            selectedTour.price) + HOLIDAY_BOOKING_FEE
        )}`}
        dim={
          !(
            selectedTourModality ||
            (tourDetails.details?.modalities?.length ?? 0) > 0 ||
            selectedTour
          )
        }
        onClick={() => {
          if (!selectedTourModality) {
            const fallback =
              tourDetails.details?.modalities?.[0] ?? null;
            if (fallback) setSelectedTourModality(fallback);
          }
          setScreen('passenger');
        }} />
      }
      {screen === 'passenger' && mode === 'holiday' &&
      <Footer
        label={`Continue to review · ${travellers.length} traveller${travellers.length === 1 ? '' : 's'}`}
        dim={!holidayTravellersReady}
        hint={
          !holidayTravellersReady ?
            `Fill details for all ${travellers.length} travellers including passport (issue ≤ today; expiry on/after the day after travel ends${travellers.length > 1 ? '; email & mobile on lead' : ', email & mobile'}).` :
            undefined
        }
        onClick={() => {
          if (!holidayTravellersReady) return;
          setScreen('payment');
        }} />
      }
      {screen === 'payment' && mode === 'holiday' && selectedTour &&
      <Footer
        label="Choose payment source"
        onClick={() => {
          void (async () => {
            setSaveBookingError(null);
            if (!(await ensureWalletCanPay(chargedTotal))) return;
            setScreen('pay-method');
          })();
        }} />
      }
      {screen === 'payment' && mode !== 'holiday' &&
      <Footer
        label={
        mode === 'bus' && saveBookingLoading ?
        'Booking bus…' :
        mode === 'bus' && (payMethod === 'bnpl' || payMethod === 'paylater') ?
        `Pay later · ${fmtMoney(chargedTotal)}` :
        mode === 'bus' && (payMethod === 'cod' || payMethod === 'reserve') ?
        `Reserve · ${fmtMoney(chargedTotal)}` :
        mode === 'flights' ?
        `Pay now · ${fmtMoney(chargedTotal)}` :
        mode === 'minibus' ?
        `Pay now · ${fmtMoney(chargedTotal)}` :
        `Pay now · ${fmtMoney(chargedTotal)}`
        }
        dim={(mode === 'flights' || mode === 'bus') && saveBookingLoading}
        hint={
        mode === 'flights' && saveBookingLoading ?
        'Creating your reservation with the airline…' :
        mode === 'bus' && saveBookingLoading ?
        'Submitting your bus booking…' :
        saveBookingError && mode === 'bus' ?
        saveBookingError :
        undefined
        }
        onClick={() => {
          void (async () => {
            if (mode === 'flights') {
              // Balance check inside confirmFlightBooking — only then SaveBooking.
              if (saveBookingLoading) return;
              const saved = await confirmFlightBooking();
              if (!saved) return;
              finishBookingWithPayment(
                chargedTotal,
                lastFlightBookingRefForDebit.current,
                () => {
                  setScreen('ticket');
                }
              );
              return;
            }
            if (mode === 'hotels' || mode === 'minibus' || mode === 'holiday') {
              if (!(await ensureWalletCanPay(chargedTotal))) return;
              setScreen('pay-method');
              return;
            }
            if (mode === 'bus') {
              void confirmBusBooking(() => {
                setScreen('ticket');
              });
              return;
            }
            if (!(await ensureWalletCanPay(chargedTotal))) return;
            finishBookingWithPayment(chargedTotal, bookingId, () => {
              setScreen('ticket');
            });
          })();
        }} />

      }
      {screen === 'pay-method' && mode !== 'holiday' &&
      <Footer
        label={
        mode === 'hotels' && saveBookingLoading ?
        'Saving booking…' :
        mode === 'minibus' && saveBookingLoading ?
        'Saving booking…' :
        mode === 'holiday' && saveBookingLoading ?
        'Submitting booking…' :
        mode === 'bus' && saveBookingLoading ?
        'Booking bus…' :
        `Confirm Payment · ${fmtMoney(chargedTotal)}`
        }
        dim={(mode === 'hotels' || mode === 'minibus' || mode === 'holiday' || mode === 'bus') && saveBookingLoading}
        hint={
        mode === 'minibus' && carUsesSampleInventory ?
        CAR_SAMPLE_BOOKING_NOTICE :
        undefined
        }
        onClick={() => {
          if (mode === 'hotels') {
            void confirmHotelBooking(() => {
              setScreen('ticket');
            });
            return;
          }
          if (mode === 'minibus') {
            void confirmCarBooking(() => {
              setScreen('ticket');
            });
            return;
          }
          if (mode === 'holiday') {
            void confirmTourBooking(() => {
              setScreen('ticket');
            });
            return;
          }
          finishBookingWithPayment(chargedTotal, bookingId, () => {
            setScreen('ticket');
          });
        }} />

      }
      {screen === 'ticket' &&
      <Footer label="Back to Travel" onClick={onExit} />
      }
      </div>

      <JourneySheet
        open={showJourney}
        trip={journeyTrip}
        destinationLabel={to}
        mode={mode}
        price={
          mode === 'bus' && journeyTrip ?
            busTripDisplayPrice(journeyTrip) :
            journeyTrip?.price
        }
        currency={mode === 'bus' ? displayCurrency : journeyTrip?.currency}
        onClose={() => setShowJourney(false)}
        onBookHotel={(destination) => {
          setShowJourney(false);
          setFlightHotelDestination(destination);
          setShowFlightHotelUpsell(true);
        }}
        onSelect={() => {
          setShowJourney(false);
          setFlightCheckoutStep('cabin');
          if (mode === 'flights') {
            const payload = journeyTrip?.apiPayload as FlightListItem | undefined;
            if (isRound && payload && isRoundwayFlightItem(payload)) {
              setReturnTrip(mapRoundwayReturnTrip(payload, from, to));
            } else if (isMulti) {
              setReturnTrip(null);
            } else {
              setReturnTrip(null);
            }
            setScreen('class');
            return;
          }
          if (mode === 'bus' || mode === 'train') {
            if (journeyTrip) setOutbound(journeyTrip);
            setBusSeatFetchToken((n) => n + 1);
            setPointsStep('boarding');
            setScreen('points');
          } else {
            setScreen('class');
          }
        }} />

      <FlightHotelUpsellSheet
        open={showFlightHotelUpsell}
        destination={flightHotelDestination || to}
        onClose={() => setShowFlightHotelUpsell(false)}
        onSearchHotels={(params) => {
          flightHotelResumeRef.current = {
            screen,
            showJourney: Boolean(journeyTrip)
          };
          setShowFlightHotelUpsell(false);
          onBookHotelAtDestination?.(params);
        }} />
      
      <FiltersSheet
        open={showFilters && mode === 'flights'}
        onClose={() => setShowFilters(false)}
        trips={trips}
        value={flightFilters}
        onApply={setFlightFilters} />
      <BusFiltersSheet
        open={showFilters && mode === 'bus'}
        onClose={() => setShowFilters(false)}
        trips={trips}
        value={{
          sort: busFilters.sort,
          maxPrice: busFilters.maxPrice,
          ac: busFilters.ac,
          sleeper: busFilters.sleeper
        }}
        onApply={(next: BusListFiltersState) =>
        setBusFilters((f) => ({
          ...f,
          sort: next.sort,
          maxPrice: next.maxPrice,
          ac: next.ac,
          sleeper: next.sleeper
        }))
        } />
      <HotelFiltersSheet
        open={showFilters && mode === 'hotels'}
        onClose={() => setShowFilters(false)}
        hotels={hotelList.hotels}
        value={hotelFilters}
        onApply={setHotelFilters} />
      <CarFiltersSheet
        open={showFilters && mode === 'minibus'}
        onClose={() => setShowFilters(false)}
        cars={carList.cars}
        value={carFilters}
        onApply={setCarFilters} />
      <DiscountSheet
        open={showDiscount}
        onClose={() => setShowDiscount(false)} />
      
      <BoardingPassSheet
        open={showBoardingPass}
        outbound={outbound}
        bookingRef={ticketBookingRef}
        passengerName={
        travellers.find((t) => t.name?.trim())?.name ||
        travellers[0]?.name ||
        '—'
        }
        className={
        selectedClassName && selectedClassName !== 'Cabin' ?
        selectedClassName :
        'Economy'
        }
        seatLabel={
        selectedSeats.length > 0 ? selectedSeats.join(', ') : '—'
        }
        gateLabel="—"
        onDetails={() => {
          setShowBoardingPass(false);
          setShowTicketDetails(true);
        }}
        onDownload={() => {
          setShowBoardingPass(false);
          openTicketPdf({ download: true });
        }}
        onClose={() => setShowBoardingPass(false)} />

      <TicketDetailsSheet
        open={showTicketDetails}
        outbound={outbound}
        returnTrip={returnTrip}
        bookingRef={ticketBookingRef}
        className={
        selectedClassName && selectedClassName !== 'Cabin' ?
        selectedClassName :
        'Economy'
        }
        seatLabel={
        selectedSeats.length > 0 ? selectedSeats.join(', ') : '—'
        }
        onViewPdf={() => {
          setShowTicketDetails(false);
          openTicketPdf({ download: true });
        }}
        onClose={() => setShowTicketDetails(false)} />

      <TicketPdfSheet
        open={showTicketPdf}
        pdfUrl={ticketPdfUrl}
        pdfBlob={ticketPdfBlob}
        preview={ticketPdfPreview}
        fileName={`mkash-ticket-${ticketBookingRef}.pdf`}
        onClose={() => {
          setShowTicketPdf(false);
          revokeTicketPdfUrl(ticketPdfUrl);
          setTicketPdfUrl(null);
          setTicketPdfBlob(null);
          setTicketPdfPreview(null);
        }} />

      <CalendarSheet
        open={travellerDateSheet !== null}
        title={travellerDateSheetConfig?.title ?? 'Select date'}
        value={travellerDateSheetConfig?.value ?? ''}
        min={travellerDateSheetConfig?.min}
        max={travellerDateSheetConfig?.max}
        onClose={() => setTravellerDateSheet(null)}
        onSelect={(v) => {
          if (!travellerDateSheet) return;
          const { travellerIdx, field } = travellerDateSheet;
          updateTraveller(travellerIdx, field, v);
          setTravellerFieldErrorsByIdx((prev) => {
            const current = prev[travellerIdx] ?? [];
            if (!current.includes(field)) return prev;
            return {
              ...prev,
              [travellerIdx]: current.filter((f) => f !== field)
            };
          });
          if (field === 'passportIssueDate') {
            const existingExpiry =
              travellers[travellerIdx]?.passportExpiry?.trim() || '';
            const today = toCalendarInputValue(new Date());
            // Clear expiry if it is before the new issue date, already in the past,
            // or earlier than one day after the trip ends.
            if (
              existingExpiry &&
              (existingExpiry < v ||
                existingExpiry < today ||
                existingExpiry < passportMinExpiryIso)
            ) {
              updateTraveller(travellerIdx, 'passportExpiry', '');
            }
          }
          setTravellerDateSheet(null);
        }} />

      <DocumentTypeSheet
        open={documentTypeSheetIdx !== null}
        value={
        documentTypeSheetIdx !== null ?
        travellers[documentTypeSheetIdx]?.documentType ?? 'Passport' :
        'Passport'
        }
        onClose={() => setDocumentTypeSheetIdx(null)}
        onSelect={(v) => {
          if (documentTypeSheetIdx === null) return;
          updateTraveller(documentTypeSheetIdx, 'documentType', v);
          setDocumentTypeSheetIdx(null);
        }} />

      <GenderSheet
        open={genderSheetIdx !== null}
        value={
        genderSheetIdx !== null ?
        travellers[genderSheetIdx]?.gender ?? '' :
        ''
        }
        onClose={() => setGenderSheetIdx(null)}
        onSelect={(v) => {
          if (genderSheetIdx === null) return;
          updateTraveller(genderSheetIdx, 'gender', v);
          setGenderSheetIdx(null);
        }} />
      

      {/* Top popup toast */}
      <AnimatePresence>
        {topToast &&
        <motion.div
          initial={{
            opacity: 0,
            y: -20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: -20
          }}
          transition={{
            duration: 0.22
          }}
          className="ethio-funnel-toast fixed top-0 left-0 right-0 z-[60] px-4 pt-3 pointer-events-none">
          
            <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg shadow-teal-600/30 mx-auto max-w-md min-w-0"
            style={{
              backgroundColor: KTA.green
            }}>
            
              <div className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[14px] font-semibold text-white truncate">
                {topToast}
              </span>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {/* Action toast */}
      <AnimatePresence>
        {toast &&
        <motion.div
          initial={{
            opacity: 0,
            y: 24
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: 24
          }}
          transition={{
            duration: 0.2
          }}
          className="absolute left-1/2 -translate-x-1/2 bottom-24 z-[60] px-4">
          
            <div
            className="flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg"
            style={{
              backgroundColor: KTA.textPrimary
            }}>
            
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span className="text-[13px] font-semibold text-white max-w-[80vw] truncate">
                {toast}
              </span>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}