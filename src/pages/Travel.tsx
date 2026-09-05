import { warmBusCityCache } from '../hooks/useBusCitySearch';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { showTravelError } from '../components/travel/TravelErrorState';
import { TopBar } from '../components/TopBar';
import {
  PaymentMethodPickerSheet,
  PaymentSelection
} from
'../components/PaymentMethodPickerSheet';
import { TransactionPINSheet } from '../components/TransactionPINSheet';
import { KTA, Mode } from '../components/travel/ethioTravelData';
import {
  EthioHome,
  CABIN_CLASS_OPTIONS,
  CABIN_CLASS_ALL_VALUE,
  TripType,
  FlightLeg } from
'../components/travel/EthioHome';
import { EthioFunnel } from '../components/travel/EthioFunnel';
import {
  formatPassengerSummary
} from '../services/guestApi/buildFlightTravellers';
import {
  formatBusTravelDate,
  formatBusTravelDateLabel,
  stripCityLabel,
  formatFlightApiDate,
  defaultFlightDepartDate,
  defaultFlightReturnDate,
  ensureFlightSearchDate,
  ensureFlightReturnDate,
  formatFlightDateLabel,
  minimumFlightInputDate,
  normalizeCarLocation,
  isCarLocationSupported,
  toInputDateValue,
  parseInputDateValue,
  defaultCarPickupDate,
  defaultCarReturnDate,
  defaultHotelCheckInDate,
  formatHotelApiDate,
  resolveHotelSearchLocation,
  normalizeHotelCityLabel,
  resolveFlightSearchCode,
  parseCountryDisplayName,
  isFlightSearchLocation,
  formatFlightAirportLabel,
  bookingDebit,
  recallWalletUserId,
  getPaymentTypes,
  getFlightBookClasses,
  type ApiPaymentType,
  type PassengerCounts
} from '../services/guestApi';
import { useAuth } from '../components/AuthContext';
import { useBusList } from '../hooks/useBusList';
import { useCarList } from '../hooks/useCarList';
import { useFlightList } from '../hooks/useFlightList';
import { useHotelList } from '../hooks/useHotelList';
import { useTourList } from '../hooks/useTourList';
import { useTravelCurrency } from '../hooks/useTravelCurrency';
import { useTravellerWallet } from '../hooks/useTravellerWallet';
import {
  formatWalletCreditLabel,
  isWalletBalanceSufficient
} from '../utils/walletCredit';
import { CitySheet } from '../components/travel/EthioSheets';
import {
  extractTourDestinationName
} from '../services/guestApi';
import { TravelDocsSheet } from '../components/travel/TravelDocsSheet';
import {
  TravelBottomNav,
  TravelTab } from
'../components/travel/TravelBottomNav';
import { TravelAccount } from '../components/travel/TravelAccount';
import { MyBookings } from '../components/travel/MyBookings';
import { useHomeDeals } from '../hooks/useHomeDeals';
import {
  Search,
  ChevronRight,
  ChevronDown,
  MessageCircle,
  Phone,
  Mail,
  LifeBuoy,
  Pencil } from
'lucide-react';
import { LiveChatSheet } from '../components/travel/LiveChatSheet';
import { SupportTicketsSheet } from '../components/travel/SupportTicketsSheet';

type CityTarget = {
  field: 'from' | 'to';
  leg?: number;
};

type BusCityIds = {
  from?: string;
  to?: string;
};

type BusSearchLabels = {
  from?: string;
  to?: string;
};

const DEFAULT_FLIGHT_FROM = 'Where from?';

/** Prefer "City (IATA)" so GetOneway/Roundway/Multiway always get a clean code. */
function toFlightAirportField(value: string): string {
  const raw = String(value || '').trim();
  if (!raw || raw === 'Where to?' || raw === 'Where from?') return raw;
  if (/\([A-Z]{3}\)\s*$/i.test(raw)) return raw;
  if (/^[A-Z]{3}$/i.test(raw)) {
    const code = raw.toUpperCase();
    return formatFlightAirportLabel({ code, city: code, name: code });
  }
  return raw;
}
const DEFAULT_FLIGHT_TO = 'Where to?';

export function Travel() {
  const { user, traveller } = useAuth();
  const travelCurrency = useTravelCurrency();
  const [activeTab, setActiveTab] = useState<TravelTab>('home');
  const {
    destinations: exploreDestinations,
    loadingDestinations: exploreDestinationsLoading,
    destinationError: exploreDestinationsError
  } = useHomeDeals(activeTab === 'explore');
  const [inFunnel, setInFunnel] = useState(false);
  const [docCheckOpen, setDocCheckOpen] = useState(false);
  const {
    amountEtb: walletAmountEtb,
    label: walletCreditLabel,
    refreshDashboard: refreshWallet
  } = useTravellerWallet({
    currencyCode: travelCurrency.code,
    currencyRate:
      travelCurrency.code === 'ETB' ? 1 : travelCurrency.rate,
    // Pause wallet polling during search/funnel so flight SOAP isn't starved.
    pollMs: inFunnel || docCheckOpen ? 0 : 30_000
  });
  const funnelHardwareBackRef = useRef<(() => void) | null>(null);
  const [tripsSegment, setTripsSegment] = useState<'scheduled' | 'past'>('scheduled');
  const [mode, setMode] = useState<Mode>('flights');
  const [from, setFrom] = useState(DEFAULT_FLIGHT_FROM);
  const [to, setTo] = useState(DEFAULT_FLIGHT_TO);
  const flightHotelReturnRef = useRef<{ from: string; to: string } | null>(null);
  const [flightHotelReturnToken, setFlightHotelReturnToken] = useState(0);
  const [hotelCityMeta, setHotelCityMeta] = useState<{
    cityName: string;
    countryCode: string;
    regionId?: string;
  } | null>(null);
  const [tripType, setTripType] = useState<TripType>('oneway');
  const [flightPassengers, setFlightPassengers] = useState<PassengerCounts>({
    adultCount: 1,
    childrenCount: 0,
    infantCount: 0
  });
  const [flightCabinClass, setFlightCabinClass] = useState(CABIN_CLASS_ALL_VALUE);
  const [flightLegDates, setFlightLegDates] = useState<Date[]>(() => {
    const first = defaultFlightDepartDate();
    const second = defaultFlightReturnDate(first);
    return [first, second];
  });
  const [legs, setLegs] = useState<FlightLeg[]>(() => {
    const first = defaultFlightDepartDate();
    const second = defaultFlightReturnDate(first);
    return [
      {
        from: DEFAULT_FLIGHT_FROM,
        to: DEFAULT_FLIGHT_TO,
        date: formatBusTravelDateLabel(first)
      },
      {
        from: DEFAULT_FLIGHT_TO,
        to: 'Where to?',
        date: formatBusTravelDateLabel(second)
      }
    ];
  });
  const [cityPicker, setCityPicker] = useState<CityTarget | null>(null);
  const [busCityIds, setBusCityIds] = useState<BusCityIds>({});
  const [busSearchLabels, setBusSearchLabels] = useState<BusSearchLabels>({});
  const [carPickupDateObj, setCarPickupDateObj] = useState(defaultCarPickupDate);
  const [carReturnDateObj, setCarReturnDateObj] = useState(() =>
    defaultCarReturnDate(defaultCarPickupDate())
  );
  const carPickupDate = formatBusTravelDate(carPickupDateObj);
  const carReturnDate = formatBusTravelDate(carReturnDateObj);
  const carPickupMinDate = toInputDateValue(new Date());
  const [carSearchToken, setCarSearchToken] = useState(0);
  const [hotelSearchToken, setHotelSearchToken] = useState(0);
  const [tourSearchToken, setTourSearchToken] = useState(0);
  const [hotelGuests, setHotelGuests] = useState(1);
  const [hotelChildren, setHotelChildren] = useState(0);
  const [hotelInfants, setHotelInfants] = useState(0);
  const [hotelRooms, setHotelRooms] = useState(1);
  const [hotelCheckInDateObj, setHotelCheckInDateObj] = useState(defaultHotelCheckInDate);
  const [hotelCheckOutDateObj, setHotelCheckOutDateObj] = useState<Date | null>(
    null
  );
  const hotelCheckInDate = formatHotelApiDate(hotelCheckInDateObj);
  const hotelCheckOutDate = hotelCheckOutDateObj ?
    formatHotelApiDate(hotelCheckOutDateObj) :
    '';
  const hotelDestinationLabel = normalizeHotelCityLabel(
    to === 'Where to?' ? 'Dubai' : to
  );
  const resolvedHotelLocation = resolveHotelSearchLocation(hotelDestinationLabel);
  const hotelLocation = hotelCityMeta ?
  {
    cityName: hotelCityMeta.cityName,
    countryCode: hotelCityMeta.countryCode
  } :
  resolvedHotelLocation;
  const rawCarPickupLocation = normalizeCarLocation(from);
  const carPickupLocation = isCarLocationSupported(rawCarPickupLocation) ?
  rawCarPickupLocation :
  'Dubai';
  const carReturnLocation =
  to !== 'Where to?' ?
  normalizeCarLocation(to) :
  carPickupLocation;
  const carCurrency = {
    code: travelCurrency.code,
    defaultValue: travelCurrency.rate
  };
  const carList = useCarList({
    pickupLocation: carPickupLocation,
    returnLocation: carReturnLocation,
    pickupDate: carPickupDate,
    pickupTime: '06:00',
    returnDate: carReturnDate,
    returnTime: '18:00',
    currencyCode: carCurrency.code,
    defaultCurrencyValue: carCurrency.defaultValue,
    enabled: mode === 'minibus' && carSearchToken > 0 && !!carPickupLocation,
    searchToken: carSearchToken
  });
  const [busSearchToken, setBusSearchToken] = useState(0);
  const [flightSearchToken, setFlightSearchToken] = useState(0);
  const [flightDepartDateObj, setFlightDepartDateObj] = useState(defaultFlightDepartDate);
  const [flightReturnDateObj, setFlightReturnDateObj] = useState(() =>
    defaultFlightReturnDate(defaultFlightDepartDate())
  );
  const effectiveFlightDepart = ensureFlightSearchDate(flightDepartDateObj);
  const effectiveFlightReturn = ensureFlightReturnDate(
    effectiveFlightDepart,
    flightReturnDateObj
  );
  const flightDepartDate = formatFlightApiDate(effectiveFlightDepart);
  const flightReturnDate = formatFlightApiDate(effectiveFlightReturn);
  const flightDepartMinDate = toInputDateValue(minimumFlightInputDate());
  const flightOrigin = resolveFlightSearchCode(from);
  const flightDestination = resolveFlightSearchCode(to);
  const multiLegs =
  tripType === 'multi' ?
  legs.map((leg, index) => ({
    origin: resolveFlightSearchCode(leg.from),
    destination: resolveFlightSearchCode(leg.to),
    departDate: formatFlightApiDate(
      ensureFlightSearchDate(flightLegDates[index] ?? defaultFlightDepartDate())
    )
  })) :
  undefined;
  const multiLegsReady =
  tripType !== 'multi' ||
  !!multiLegs &&
  multiLegs.length >= 2 &&
  multiLegs.every(
    (leg) =>
      leg.origin.length >= 2 &&
      leg.destination.length >= 2 &&
      !!leg.departDate
  );
  const busOrigin = busCityIds.from || '';
  const busDestination = busCityIds.to || '';
  const busTravelDate = formatFlightApiDate(effectiveFlightDepart);
  const busList = useBusList({
    origin: busOrigin,
    destination: busDestination,
    travelDate: busTravelDate,
    fromLabel: busSearchLabels.from || stripCityLabel(from),
    toLabel: busSearchLabels.to || stripCityLabel(to),
    currencyCode: travelCurrency.code,
    currencyRate: travelCurrency.rate,
    // Proceed after rate settles; if rate API fails, still fetch (bus falls back to ETB fare).
    currencyReady:
      travelCurrency.ready ||
      (!travelCurrency.loadingRate && Boolean(travelCurrency.error)),
    enabled:
    mode === 'bus' &&
    busSearchToken > 0 &&
    busOrigin.length > 0 &&
    busDestination.length > 0 &&
    busDestination !== 'Where to?',
    searchToken: busSearchToken
  });
  const flightList = useFlightList({
    origin: flightOrigin,
    destination: flightDestination,
    departDate: flightDepartDate,
    returnDate: flightReturnDate,
    multiLegs,
    tripType,
    fromLabel: parseCountryDisplayName(from),
    toLabel: parseCountryDisplayName(to === 'Where to?' ? '' : to),
    enabled:
    mode === 'flights' &&
    flightSearchToken > 0 &&
    (tripType === 'multi' ?
    multiLegsReady :
    flightOrigin.length >= 2 &&
    flightDestination.length >= 2 &&
    to !== 'Where to?' &&
    (tripType !== 'round' || !!flightReturnDate)),
    searchToken: flightSearchToken,
    adultCount: flightPassengers.adultCount,
    childrenCount: flightPassengers.childrenCount,
    infantCount: flightPassengers.infantCount,
    cabinClass: flightCabinClass,
    currencyCode: travelCurrency.code,
    currencyValue: travelCurrency.rate
  });
  const hotelList = useHotelList({
    checkInDate: hotelCheckInDate,
    checkOutDate: hotelCheckOutDate,
    cityName: hotelLocation.cityName,
    countryCode: hotelLocation.countryCode,
    cityLabel: hotelDestinationLabel,
    roomCount: hotelRooms,
    adultCount: hotelGuests,
    currencyCode: travelCurrency.code,
    currencyValue: travelCurrency.rate,
    enabled:
    mode === 'hotels' &&
    hotelSearchToken > 0 &&
    hotelDestinationLabel.length > 0 &&
    !!hotelCheckOutDate,
    searchToken: hotelSearchToken
  });
  const tourDestinationName = extractTourDestinationName(
    to === 'Where to?' ? '' : to
  );
  const tourList = useTourList({
    destinationName: tourDestinationName,
    fromDate: hotelCheckInDate,
    toDate: hotelCheckOutDate,
    adultCount: Math.max(1, hotelGuests),
    childCount: Math.max(0, hotelChildren),
    currencyCode: travelCurrency.code,
    enabled:
    mode === 'holiday' &&
    tourSearchToken > 0 &&
    tourDestinationName.length > 0,
    searchToken: tourSearchToken
  });
  const walletBalanceDisplay = walletCreditLabel;
  const [paySel, setPaySel] = useState<PaymentSelection>({
    method: 'wallet',
    label: 'mKash Wallet',
    sublabel: `Balance ${walletCreditLabel}`
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTotal, setPickerTotal] = useState(0);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinTotal, setPinTotal] = useState(0);
  const [pinBookingRef, setPinBookingRef] = useState<string | undefined>(
    undefined
  );
  const [onPinDone, setOnPinDone] = useState<(() => void) | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [supportTicketsOpen, setSupportTicketsOpen] = useState(false);
  const [paymentTypes, setPaymentTypes] = useState<ApiPaymentType[]>([]);
  const [flightBookClasses, setFlightBookClasses] = useState<
    { value: string; label: string }[]
  >(() => CABIN_CLASS_OPTIONS.map((option) => ({ ...option })));
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [bookingsRefreshToken, setBookingsRefreshToken] = useState(0);
  const bumpBookingsRefresh = useCallback(() => {
    setBookingsRefreshToken((token) => token + 1);
  }, []);
  const apiUserTypeId =
    user?.userTypeId ?? traveller.session?.userTypeId ?? 5;
  const rememberedSupportUserId = recallWalletUserId({
    email: user?.email || traveller.session?.email,
    username: user?.username || traveller.session?.username,
    phone: user?.phone || traveller.session?.mobile
  });
  const apiUserId =
    (user?.userId && user.userId > 0 ? user.userId : null) ||
    (traveller.session?.userId && traveller.session.userId > 0 ?
      traveller.session.userId :
      null) ||
    rememberedSupportUserId ||
    0;

  useEffect(() => {
    let cancelled = false;
    getPaymentTypes({
      userTypeId: apiUserTypeId,
      userId: apiUserId
    }).
    then((result) => {
      if (!cancelled) setPaymentTypes(result.paymentTypes);
    }).
    catch(() => {
      if (!cancelled) setPaymentTypes([]);
    });
    return () => {
      cancelled = true;
    };
  }, [apiUserId, apiUserTypeId]);

  useEffect(() => {
    let cancelled = false;
    getFlightBookClasses().
    then((options) => {
      if (!cancelled && options.length > 0) setFlightBookClasses(options);
    }).
    catch(() => {
      // Keep hardcoded Economy…First labels.
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPaySel((prev) =>
      prev.method === 'wallet' ?
        {
          ...prev,
          sublabel: `Balance ${walletBalanceDisplay}`
        } :
        prev
    );
  }, [walletBalanceDisplay]);

  useEffect(() => {
    if (pickerOpen) {
      void refreshWallet();
    }
  }, [pickerOpen, refreshWallet]);

  const ensureWalletForPay = useCallback(
    async (total: number): Promise<boolean> => {
      const latest = await refreshWallet();
      const availableEtb = latest?.amount ?? walletAmountEtb;
      if (
        isWalletBalanceSufficient(
          availableEtb,
          total,
          travelCurrency.code,
          travelCurrency.rate
        )
      ) {
        return true;
      }
      const availableLabel = formatWalletCreditLabel(
        latest?.raw || `ETB ${availableEtb.toFixed(2)}`,
        {
          currencyCode: travelCurrency.code,
          rate: travelCurrency.code === 'ETB' ? 1 : travelCurrency.rate
        }
      );
      const needLabel = `${travelCurrency.code} ${Number(total).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
      showTravelError(
        `Available ${availableLabel}. Required ${needLabel}. Add money to your wallet or choose another payment method.`,
        {
          id: 'wallet-insufficient',
          title: 'Insufficient balance'
        }
      );
      return false;
    },
    [
      refreshWallet,
      walletAmountEtb,
      travelCurrency.code,
      travelCurrency.rate
    ]
  );

  // Prefetch bus cities so From/To sheets open with the full list immediately
  useEffect(() => {
    void warmBusCityCache().catch(() => undefined);
  }, []);

  // Android hardware Back: one step in funnel / close sheets / leave tab — never block OS Home/Recents
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: { remove: () => Promise<void> } | undefined;
    App.addListener('backButton', () => {
      if (pinOpen) {
        setPinOpen(false);
        return;
      }
      if (pickerOpen) {
        setPickerOpen(false);
        return;
      }
      if (chatOpen) {
        setChatOpen(false);
        return;
      }
      if (docCheckOpen) {
        setDocCheckOpen(false);
        return;
      }
      if (cityPicker) {
        setCityPicker(null);
        return;
      }
      if (inFunnel) {
        funnelHardwareBackRef.current?.();
        return;
      }
      if (activeTab !== 'home') {
        setActiveTab('home');
        return;
      }
      App.minimizeApp().catch(() => App.exitApp());
    }).then((h) => {
      handle = h;
    });
    return () => {
      handle?.remove();
    };
  }, [
    pinOpen,
    pickerOpen,
    chatOpen,
    docCheckOpen,
    cityPicker,
    inFunnel,
    activeTab
  ]);

  const effectiveTripType: TripType =
  mode === 'flights' ? tripType : tripType === 'multi' ? 'round' : tripType;
  const legCount = effectiveTripType === 'multi' ? legs.length : 1;
  const proceedToFunnel = () => {
    setDocCheckOpen(false);
    setInFunnel(true);
  };
  const handleCarPickupDateChange = (value: string) => {
    const date = parseInputDateValue(value);
    setCarPickupDateObj(date);
    if (carReturnDateObj.getTime() <= date.getTime()) {
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      setCarReturnDateObj(next);
    }
  };
  const handleCarReturnDateChange = (value: string) => {
    const date = parseInputDateValue(value);
    if (date.getTime() <= carPickupDateObj.getTime()) {
      showTravelError('Return date must be after pickup date');
      return;
    }
    setCarReturnDateObj(date);
  };
  const handleHotelCheckInDateChange = (value: string) => {
    const date = parseInputDateValue(value);
    setHotelCheckInDateObj(date);
    if (
      hotelCheckOutDateObj &&
      hotelCheckOutDateObj.getTime() <= date.getTime()
    ) {
      // Keep check-out cleared so the user re-selects a valid night.
      setHotelCheckOutDateObj(null);
    }
  };
  const handleHotelCheckOutDateChange = (value: string) => {
    const date = parseInputDateValue(value);
    if (date.getTime() <= hotelCheckInDateObj.getTime()) {
      showTravelError('Check-out must be after check-in');
      return;
    }
    setHotelCheckOutDateObj(date);
  };
  const syncFlightSearchDates = () => {
    const depart = ensureFlightSearchDate(flightDepartDateObj);
    const ret = ensureFlightReturnDate(depart, flightReturnDateObj);
    setFlightDepartDateObj(depart);
    setFlightReturnDateObj(ret);
    if (tripType === 'multi') {
      setFlightLegDates((prev) => prev.map((date) => ensureFlightSearchDate(date)));
    }
  };
  const startSearch = () => {
    if (!travelCurrency.ready) {
      toast.message('Loading currency rate… try again in a moment.');
      return;
    }
    if (mode === 'flights') {
      if (tripType === 'multi') {
        for (let i = 0; i < legs.length; i++) {
          const leg = legs[i];
          if (!isFlightSearchLocation(leg.from)) {
            showTravelError(`Select a departure airport for flight ${i + 1}`);
            return;
          }
          if (!isFlightSearchLocation(leg.to) || leg.to === 'Where to?') {
            showTravelError(`Select a destination airport for flight ${i + 1}`);
            return;
          }
        }
        syncFlightSearchDates();
        setFlightSearchToken((n) => n + 1);
        // Enter funnel immediately so home deal/bus traffic stops competing
        // with GetOnewayList; docs sheet stays on top until confirmed.
        setInFunnel(true);
        setDocCheckOpen(true);
        return;
      }
      if (to === 'Where to?') {
        showTravelError('Select a destination airport');
        return;
      }
      if (!isFlightSearchLocation(from)) {
        showTravelError('Select a departure airport');
        return;
      }
      if (!isFlightSearchLocation(to)) {
        showTravelError('Select a destination airport');
        return;
      }
      syncFlightSearchDates();
      setFlightSearchToken((n) => n + 1);
      setInFunnel(true);
      setDocCheckOpen(true);
      return;
    }
    if (mode === 'bus') {
      if (
        from === 'Where from?' ||
        to === 'Where to?' ||
        !busCityIds.from ||
        !busCityIds.to
      ) {
        showTravelError('Select both departure and destination cities');
        return;
      }
      setBusSearchToken((n) => n + 1);
      setInFunnel(true);
      return;
    }
    if (mode === 'holiday') {
      if (to === 'Where to?') {
        showTravelError('Select a tour destination');
        return;
      }
      if (!tourDestinationName) {
        showTravelError('Pick a tour destination such as Dubai or Singapore');
        return;
      }
      if (!hotelCheckOutDateObj) {
        showTravelError('Select an end date');
        return;
      }
      setTourSearchToken((n) => n + 1);
      setInFunnel(true);
      return;
    }
    if (mode === 'minibus') {
      if (!from.trim()) {
        showTravelError('Select a pickup location');
        return;
      }
      if (!isCarLocationSupported(rawCarPickupLocation)) {
        setFrom('Dubai (DXB)');
        toast.message('Car rentals use Dubai — location updated.');
      }
      setCarSearchToken((n) => n + 1);
      setInFunnel(true);
      return;
    }
    if (mode === 'hotels') {
      if (to === 'Where to?') {
        showTravelError('Select a destination city');
        return;
      }
      if (!hotelCheckOutDateObj) {
        showTravelError('Select a check-out date');
        return;
      }
      setHotelSearchToken((n) => n + 1);
      setInFunnel(true);
      return;
    }
    proceedToFunnel();
  };
  const addLeg = () => {
    if (legs.length >= 4) return;
    const last = legs[legs.length - 1];
    const lastDate = flightLegDates[flightLegDates.length - 1] ?? defaultFlightDepartDate();
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 3);
    setFlightLegDates((prev) => [...prev, nextDate]);
    setLegs([
      ...legs,
      {
        from: last.to,
        to: 'Where to?',
        date: formatBusTravelDateLabel(nextDate)
      }
    ]);
  };
  const removeLeg = (i: number) => {
    if (legs.length <= 2) return;
    setLegs(legs.filter((_, idx) => idx !== i));
    setFlightLegDates((prev) => prev.filter((_, idx) => idx !== i));
  };
  const handleFlightDepartDateChange = (value: string) => {
    const date = ensureFlightSearchDate(parseInputDateValue(value));
    setFlightDepartDateObj(date);
    if (flightReturnDateObj.getTime() <= date.getTime()) {
      setFlightReturnDateObj(defaultFlightReturnDate(date));
    }
  };
  const handleFlightReturnDateChange = (value: string) => {
    const depart = ensureFlightSearchDate(flightDepartDateObj);
    const date = parseInputDateValue(value);
    if (date.getTime() <= depart.getTime()) {
      showTravelError('Return date must be after departure');
      return;
    }
    setFlightReturnDateObj(date);
  };
  const handleLegDateChange = (legIndex: number, value: string) => {
    const date = ensureFlightSearchDate(parseInputDateValue(value));
    setFlightLegDates((prev) =>
      prev.map((existing, idx) => idx === legIndex ? date : existing)
    );
    setLegs((prev) =>
      prev.map((leg, idx) =>
        idx === legIndex ?
        { ...leg, date: formatBusTravelDateLabel(date) } :
        leg
      )
    );
  };
  const handleSelectCity = (
    name: string,
    meta?: {
      code?: string;
      cityId?: string;
      countryCode?: string;
      regionId?: string;
      cityName?: string;
      searchName?: string;
    }
  ) => {
    if (!cityPicker) return;
    const flightLabel =
      mode === 'flights' ?
        meta?.code && /^[A-Z]{3}$/i.test(meta.code) ?
          name.match(/\([A-Z]{3}\)\s*$/i) ?
            name :
            formatFlightAirportLabel({
              code: meta.code.toUpperCase(),
              city: name,
              name
            }) :
          toFlightAirportField(name) :
        name;
    if (cityPicker.leg !== undefined) {
      setLegs((prev) =>
      prev.map((l, idx) =>
      idx === cityPicker.leg ?
      {
        ...l,
        [cityPicker.field]: flightLabel
      } :
      l
      )
      );
    } else if (cityPicker.field === 'from') {
      setFrom(mode === 'flights' ? flightLabel : name);
      if (meta?.cityId) {
        setBusCityIds((prev) => ({ ...prev, from: meta.cityId }));
      }
      setBusSearchLabels((prev) => ({
        ...prev,
        from: meta?.searchName || name
      }));
    } else {
      setTo(mode === 'flights' ? flightLabel : name);
      if (meta?.cityId) {
        setBusCityIds((prev) => ({ ...prev, to: meta.cityId }));
      }
      setBusSearchLabels((prev) => ({
        ...prev,
        to: meta?.searchName || name
      }));
      if (mode === 'hotels') {
        if (meta?.cityName && meta?.countryCode) {
          setHotelCityMeta({
            cityName: meta.cityName,
            countryCode: meta.countryCode,
            regionId: meta.regionId
          });
        } else {
          setHotelCityMeta(null);
        }
      }
      if (mode === 'holiday' && meta?.code) {
        // keep label as-is; DestinationName resolved via extractTourDestinationName
      }
    }
    setCityPicker(null);
  };
  return (
    <div className="relative flex flex-col h-full min-h-0 bg-transparent">
      {!inFunnel &&
      <div className="relative flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className="ui-travel-ambient" aria-hidden>
          <div className="absolute -top-28 -left-16 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute top-1/4 -right-20 w-64 h-64 rounded-full bg-sky-400/18 blur-3xl" />
          <div className="absolute bottom-20 left-1/3 w-72 h-72 rounded-full bg-orange-300/12 blur-3xl" />
        </div>

        <TopBar
          title={activeTab === 'account' ? 'Travel' : 'KTA Travel'}
          showBack={activeTab === 'account'}
          onBack={() => setActiveTab('home')}
          fallbackPath="/"
          rightElement={
            activeTab === 'account' ?
            <button
              type="button"
              onClick={() => toast.message('Edit profile', { description: 'Profile editing will be connected next.' })}
              aria-label="Edit profile"
              className="ui-touch w-11 h-11 flex items-center justify-center rounded-full glass-btn-ghost text-text-primary">
              <Pencil className="w-5 h-5" strokeWidth={2.1} />
            </button> :
            undefined
          }
          className="ui-topbar-book relative z-10 shrink-0 !border-0 !shadow-none"
        />

      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden z-10">
        {!inFunnel && activeTab === 'home' &&
        <EthioHome
          mode={mode}
          currencyEnabled={travelCurrency.enabled}
          currencyCode={travelCurrency.code}
          currencyRate={travelCurrency.rate}
          currencies={travelCurrency.currencies}
          currencyLoading={travelCurrency.loadingCurrencies}
          currencyRateLoading={travelCurrency.loadingRate}
          currencyError={travelCurrency.error}
          onSelectCurrency={travelCurrency.selectCurrency}
          from={from}
          to={to}
          tripType={tripType}
          legs={legs}
          legDateInputValues={flightLegDates.map(toInputDateValue)}
          legDateMinValues={flightLegDates.map((date, index) =>
            index === 0 ?
            flightDepartMinDate :
            toInputDateValue(
              new Date(
                (flightLegDates[index - 1] ?? defaultFlightDepartDate()).getTime() +
                86_400_000
              )
            )
          )}
          onLegDateChange={handleLegDateChange}
          flightDepartDateLabel={formatFlightDateLabel(effectiveFlightDepart)}
          flightReturnDateLabel={formatFlightDateLabel(effectiveFlightReturn)}
          flightDepartInputValue={toInputDateValue(effectiveFlightDepart)}
          flightReturnInputValue={toInputDateValue(effectiveFlightReturn)}
          flightDepartMinDate={flightDepartMinDate}
          flightReturnMinDate={toInputDateValue(
            new Date(effectiveFlightDepart.getTime() + 86_400_000)
          )}
          onFlightDepartDateChange={handleFlightDepartDateChange}
          onFlightReturnDateChange={handleFlightReturnDateChange}
          onSetTripType={setTripType}
          onAddLeg={addLeg}
          onRemoveLeg={removeLeg}
          onSetMode={(m) => {
            setMode(m);
            if (m === 'minibus' && !isCarLocationSupported(normalizeCarLocation(from))) {
              setFrom('Dubai (DXB)');
              toast.message('Car rentals use Dubai — location updated.');
            }
            if (m === 'hotels') {
              if (to === 'Where to?' || /\([A-Z]{3}\)\s*$/i.test(to)) {
                setTo('Where to?');
                setHotelCityMeta(null);
              }
            }
            if (m === 'holiday') {
              if (to === 'Where to?' || !extractTourDestinationName(to)) {
                setTo('Dubai (DXB)');
              }
            }
            if (m === 'bus') {
              // Clear airport-style defaults; user picks boarding/dropping locations
              if (/\([A-Z]{3}\)\s*$/i.test(from) || !busCityIds.from) {
                setFrom('Where from?');
                setBusCityIds((prev) => ({ ...prev, from: undefined }));
                setBusSearchLabels((prev) => ({ ...prev, from: undefined }));
              }
              if (
                to === 'Where to?' ||
                /\([A-Z]{3}\)\s*$/i.test(to) ||
                !busCityIds.to
              ) {
                setTo('Where to?');
                setBusCityIds((prev) => ({ ...prev, to: undefined }));
                setBusSearchLabels((prev) => ({ ...prev, to: undefined }));
              }
            }
          }}
          onPickCity={(field, leg) =>
          setCityPicker({
            field,
            leg
          })
          }
          onSwap={() => {
            setFrom(to);
            setTo(from);
            setBusCityIds((prev) => ({
              from: prev.to,
              to: prev.from
            }));
            setBusSearchLabels((prev) => ({
              from: prev.to,
              to: prev.from
            }));
          }}
          onSearch={startSearch}
          onExplore={startSearch}
          onViewAllDestinations={() => setActiveTab('explore')}
          onApplyFlightDeal={(origin, destination) => {
            setMode('flights');
            // Keep oneway / round / multi — same airport labels for all route types.
            const fromLabel = origin ?
              toFlightAirportField(origin) :
              DEFAULT_FLIGHT_FROM;
            const toLabel = destination ?
              toFlightAirportField(destination) :
              'Where to?';
            if (tripType === 'multi') {
              setLegs((prev) =>
                prev.map((leg, idx) =>
                  idx === 0 ?
                    {
                      ...leg,
                      from: fromLabel || leg.from,
                      to:
                        toLabel && toLabel !== 'Where to?' ?
                          toLabel :
                          leg.to
                    } :
                    leg
                )
              );
            } else {
              if (fromLabel) setFrom(fromLabel);
              if (toLabel && toLabel !== 'Where to?') setTo(toLabel);
            }
          }}
          onApplyHotelDeal={(location) => {
            setMode('hotels');
            setTo(location);
            setHotelCityMeta(null);
          }}
          onApplyTourDeal={(destination) => {
            setMode('holiday');
            const cleaned = destination.replace(/\s*\(\d+N\)\s*$/i, '').trim();
            setTo(cleaned || destination);
          }}
          carPickupDateLabel={formatBusTravelDateLabel(carPickupDateObj)}
          carReturnDateLabel={formatBusTravelDateLabel(carReturnDateObj)}
          carPickupInputValue={toInputDateValue(carPickupDateObj)}
          carReturnInputValue={toInputDateValue(carReturnDateObj)}
          carPickupMinDate={carPickupMinDate}
          carReturnMinDate={toInputDateValue(
            new Date(carPickupDateObj.getTime() + 86_400_000)
          )}
          onCarPickupDateChange={handleCarPickupDateChange}
          onCarReturnDateChange={handleCarReturnDateChange}
          hotelCheckInDateLabel={formatBusTravelDateLabel(hotelCheckInDateObj)}
          hotelCheckOutDateLabel={
            hotelCheckOutDateObj ?
              formatBusTravelDateLabel(hotelCheckOutDateObj) :
              'Select date'
          }
          hotelCheckInInputValue={toInputDateValue(hotelCheckInDateObj)}
          hotelCheckOutInputValue={
            hotelCheckOutDateObj ? toInputDateValue(hotelCheckOutDateObj) : ''
          }
          hotelCheckInMinDate={toInputDateValue(new Date())}
          hotelCheckOutMinDate={toInputDateValue(
            new Date(hotelCheckInDateObj.getTime() + 86_400_000)
          )}
          onHotelCheckInDateChange={handleHotelCheckInDateChange}
          onHotelCheckOutDateChange={handleHotelCheckOutDateChange}
          hotelGuests={hotelGuests}
          hotelChildren={hotelChildren}
          hotelInfants={hotelInfants}
          hotelRooms={hotelRooms}
          onHotelGuestsChange={(v) => {
            setHotelGuests(v);
            setHotelInfants((inf) => Math.min(inf, v));
          }}
          onHotelChildrenChange={setHotelChildren}
          onHotelInfantsChange={setHotelInfants}
          onHotelRoomsChange={setHotelRooms}
          flightPassengers={flightPassengers}
          onFlightPassengersChange={setFlightPassengers}
          flightCabinClass={flightCabinClass}
          onFlightCabinClassChange={setFlightCabinClass} />

        }

        {!inFunnel && activeTab === 'explore' &&
        <div className="ui-page">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" />
              <input
              type="search"
              placeholder="Where do you want to go?"
              aria-label="Search destinations"
              className="ui-input pl-11 h-12"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                const q = (e.target as HTMLInputElement).value.trim();
                if (!q) return;
                setMode('holiday');
                setTo(q);
                setActiveTab('home');
              }} />
            </div>
            <div className="ui-section-header !px-0 mb-4">
              <h3 className="ui-section-title">Top Destinations</h3>
            </div>
            <p className="ui-hint mb-4">Tap a city to start searching — we will fill it in for you.</p>
            <div className="grid grid-cols-2 gap-3">
              {exploreDestinationsLoading && exploreDestinations.length === 0 &&
              Array.from({ length: 4 }).map((_, i) =>
              <div
                key={`explore-skel-${i}`}
                className="h-[160px] rounded-ios-lg bg-slate-200/70 animate-pulse" />
              )}
              {!exploreDestinationsLoading && exploreDestinationsError && exploreDestinations.length === 0 &&
              <p className="col-span-2 text-[13px] text-text-secondary py-6 text-center">
                Couldn&apos;t load destinations right now.
              </p>
              }
              {!exploreDestinationsLoading && !exploreDestinationsError && exploreDestinations.length === 0 &&
              <p className="col-span-2 text-[13px] text-text-secondary py-6 text-center">
                No destinations right now.
              </p>
              }
              {exploreDestinations.map((d) =>
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setMode('holiday');
                setTo(d.destination);
                setActiveTab('home');
              }}
              className="rounded-ios-lg overflow-hidden text-left relative h-[160px] shadow-ios-sm hover:shadow-ios-md transition-all duration-ios active:scale-[0.98] bg-slate-800">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="relative z-10 h-full flex flex-col justify-end p-3">
                    <p className="text-[15px] font-bold text-white leading-tight line-clamp-2">
                      {d.destination}
                    </p>
                    <p className="text-[12px] font-bold text-white/90 mt-1 tabular-nums">
                      {d.price}
                    </p>
                  </div>
                </button>
            )}
            </div>
          </div>
        }

        {!inFunnel && activeTab === 'trips' &&
        <div className="flex-1 flex flex-col min-h-0">
            <div className="p-5 pb-3">
              <div className="ui-segmented">
                <button
                onClick={() => setTripsSegment('scheduled')}
                className={`ui-segmented-item min-h-[44px] ${tripsSegment === 'scheduled' ? 'ui-segmented-item-active' : ''}`}>
                  Scheduled
                </button>
                <button
                onClick={() => setTripsSegment('past')}
                className={`ui-segmented-item min-h-[44px] ${tripsSegment === 'past' ? 'ui-segmented-item-active' : ''}`}>
                  Past
                </button>
              </div>
            </div>
            <MyBookings
              refreshToken={bookingsRefreshToken}
              active={activeTab === 'trips'}
              segment={tripsSegment}
              onBookTrip={() => setActiveTab('home')}
            />
          </div>
        }

        {!inFunnel && activeTab === 'help' &&
        <div className="ui-page">
            <div className="ui-section-header !px-0 mb-5">
              <div>
                <h3 className="text-[20px] font-bold text-text-primary">How can we help?</h3>
                <p className="ui-hint mt-1">We are here 24/7 for bookings, changes, and refunds.</p>
              </div>
            </div>
            <div className="ui-list mb-6">
              <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="ui-list-row border-b border-ios-separator min-h-[64px] active:bg-white/50">
                <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[15px] font-semibold text-text-primary">Live Chat</p>
                  <p className="text-[13px] text-text-secondary">Chat with our support team</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-tertiary" />
              </button>
              <button
              type="button"
              onClick={() => setSupportTicketsOpen(true)}
              className="ui-list-row border-b border-ios-separator min-h-[64px] active:bg-white/50">
                <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center">
                  <LifeBuoy className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[15px] font-semibold text-text-primary">Support Tickets</p>
                  <p className="text-[13px] text-text-secondary">Create and track requests</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-tertiary" />
              </button>
              <button
              type="button"
              onClick={() => toast.info('Support line: +251 11 000 0000')}
              className="ui-list-row border-b border-ios-separator min-h-[64px] active:bg-white/50">
                <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[15px] font-semibold text-text-primary">Call Support</p>
                  <p className="text-[13px] text-text-secondary">Available 24/7</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-tertiary" />
              </button>
              <button
              type="button"
              onClick={() => toast.info('Email: support@mkash.et')}
              className="ui-list-row min-h-[64px] active:bg-white/50">
                <div className="w-11 h-11 rounded-full bg-violet-50 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[15px] font-semibold text-text-primary">Email Us</p>
                  <p className="text-[13px] text-text-secondary">We'll reply within 24h</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>
            <h4 className="ui-section-title mb-3">FAQs</h4>
            <div className="ui-list">
            
              {[
            {
              q: 'How to cancel a booking?',
              a: "Open My Trips, select your booking, and tap Cancel booking. Fees depend on your fare rules."
            },
            {
              q: 'Baggage allowance policy',
              a: 'Allowance varies by airline and ticket class. Check your booking details in My Trips for included bags.'
            },
            {
              q: 'Refund processing time',
              a: 'Approved refunds are usually processed within 5–10 business days to your original payment method.'
            },
            {
              q: 'How to change my flight date?',
              a: 'Go to My Trips → select the flight → Change flight. Date-change fees may apply.'
            }].
            map((faq, i) =>
            <div key={i} className="border-b border-ios-separator last:border-0">
                <button
              type="button"
              onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              className="ui-list-row min-h-[56px] active:bg-white/50 w-full">
                  <span className="text-[15px] font-medium text-text-primary text-left flex-1">
                    {faq.q}
                  </span>
                  <ChevronDown
                className={`w-5 h-5 text-text-tertiary shrink-0 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`}
              />
                </button>
                {expandedFaq === i &&
              <p className="px-5 pb-4 text-[13px] leading-relaxed text-text-secondary">
                    {faq.a}
                  </p>
              }
              </div>
            )}
            </div>
          </div>
        }

        {!inFunnel && activeTab === 'account' &&
        <TravelAccount
          bookingsRefreshToken={bookingsRefreshToken}
          currencyEnabled={travelCurrency.enabled}
          currencyCode={travelCurrency.code}
          currencyRate={travelCurrency.rate}
          sourceCurrencyCode={travelCurrency.sourceCode}
          currencyPreferenceMode={travelCurrency.preferenceMode}
          currencyAutoHint={travelCurrency.autoHint}
          onCurrencyEnabledChange={travelCurrency.setEnabled}
          onOpenSupport={() => setActiveTab('help')}
          onOpenTrips={() => {
            setTripsSegment('past');
            setActiveTab('trips');
          }}
        />
        }

      </div>
      </div>
      }

        {inFunnel &&
        <div className="absolute inset-0 z-20 flex flex-col min-h-0 w-full max-w-none overflow-hidden bg-transparent">
        <EthioFunnel
          mode={mode}
          from={from}
          to={to}
          tripType={effectiveTripType}
          legCount={legCount}
          busOriginId={busCityIds.from}
          busDestinationId={busCityIds.to}
          travelDate={formatBusTravelDate(effectiveFlightDepart)}
          returnTravelDate={
            effectiveTripType === 'round' ?
              formatBusTravelDate(effectiveFlightReturn) :
              undefined
          }
          busList={busList}
          flightList={flightList}
          hotelList={hotelList}
          tourList={tourList}
          hotelCheckInDate={hotelCheckInDate}
          hotelCheckOutDate={hotelCheckOutDate}
          hotelCheckInDateLabel={formatBusTravelDateLabel(hotelCheckInDateObj)}
          hotelCheckOutDateLabel={
            hotelCheckOutDateObj ?
              formatBusTravelDateLabel(hotelCheckOutDateObj) :
              'Select date'
          }
          hotelRoomCount={hotelRooms}
          hotelAdultCount={hotelGuests}
          hotelChildCount={hotelChildren}
          hotelInfantCount={hotelInfants}
          carList={carList}
          carPickupDate={carPickupDate}
          carReturnDate={carReturnDate}
          carPickupTime="06:00"
          carReturnTime="18:00"
          carCurrencyCode={carCurrency.code}
          carCurrencyValue={carCurrency.defaultValue}
          currencyCode={travelCurrency.code}
          currencyValue={travelCurrency.rate}
          flightAdultCount={flightPassengers.adultCount}
          flightChildrenCount={flightPassengers.childrenCount}
          flightInfantCount={flightPassengers.infantCount}
          flightDepartDateLabel={formatFlightDateLabel(effectiveFlightDepart)}
          flightReturnDateLabel={
            tripType === 'round' ?
            formatFlightDateLabel(effectiveFlightReturn) :
            undefined
          }
          flightPassengerSummary={formatPassengerSummary(flightPassengers)}
          flightCabinClassName={
            flightCabinClass === CABIN_CLASS_ALL_VALUE || !flightCabinClass ?
            'All' :
            flightBookClasses.find(
              (option) => option.value === flightCabinClass
            )?.label || 'All'
          }
          onFlightDepartDateChange={(date) => {
            const next = ensureFlightSearchDate(date);
            setFlightDepartDateObj(next);
            if (tripType === 'round') {
              setFlightReturnDateObj((prev) =>
              prev <= next ?
              new Date(next.getTime() + 86_400_000 * 7) :
              prev
              );
            }
            setFlightSearchToken((n) => n + 1);
          }}
          paymentLabel={paySel.label}
          paymentMethod={paySel.method}
          apiPaymentTypes={paymentTypes}
          apiPaymentTypeId={paySel.apiPaymentTypeId}
          hardwareBackRef={funnelHardwareBackRef}
          flightHotelReturnToken={flightHotelReturnToken}
          onBookHotelAtDestination={({ destination, guests, rooms }) => {
            const city = normalizeHotelCityLabel(destination);
            flightHotelReturnRef.current = { from, to };
            setMode('hotels');
            setTo(city);
            setHotelCityMeta(null);
            setHotelGuests(Math.max(1, guests));
            setHotelRooms(Math.max(1, Math.min(rooms, guests)));
            setHotelChildren(0);
            setHotelInfants(0);
            // Align hotel stay with flight depart when possible.
            const checkIn = ensureFlightSearchDate(flightDepartDateObj);
            const checkOut = new Date(checkIn);
            checkOut.setDate(checkOut.getDate() + 1);
            setHotelCheckInDateObj(checkIn);
            setHotelCheckOutDateObj(checkOut);
            setHotelSearchToken((n) => n + 1);
            setInFunnel(true);
            toast.message(`Searching hotels in ${city}`);
          }}
          onExit={() => {
            if (mode === 'hotels' && flightHotelReturnRef.current) {
              const flight = flightHotelReturnRef.current;
              flightHotelReturnRef.current = null;
              setFrom(flight.from);
              setTo(flight.to);
              setMode('flights');
              setFlightHotelReturnToken((token) => token + 1);
              toast.message('Returned to your flight booking');
              return;
            }
            setInFunnel(false);
            setDocCheckOpen(false);
          }}
          onReplaceFlightRoute={(origin, destination) => {
            setFrom(origin);
            setTo(destination);
            setMode('flights');
            setTripType((prev) => (prev === 'multi' ? 'oneway' : prev));
            setFlightSearchToken((n) => n + 1);
            toast.message(`Searching ${origin} → ${destination}`);
          }}
          onBookingComplete={bumpBookingsRefresh}
          onChangePayment={(t) => {
            setPickerTotal(t);
            setPickerOpen(true);
          }}
          onPay={(t, done, bookingRef) => {
            void (async () => {
              // All pays: require live wallet credit before PIN / debit.
              const ok = await ensureWalletForPay(t);
              if (!ok) return;
              setPinTotal(t);
              setPinBookingRef(bookingRef);
              setOnPinDone(() => () => {
                bumpBookingsRefresh();
                done();
              });
              setPinOpen(true);
            })();
          }} />
        </div>
        }

      {!inFunnel &&
      <TravelBottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
      }

      <TravelDocsSheet
        open={docCheckOpen}
        onClose={() => setDocCheckOpen(false)}
        onConfirm={() => {
          proceedToFunnel();
        }}
        searching={flightList.loading} />
      

      <CitySheet
        open={cityPicker !== null}
        title={
          mode === 'flights' ?
          cityPicker?.leg !== undefined ?
          `${cityPicker.field === 'from' ? 'From' : 'To'} airport — Flight ${cityPicker.leg + 1}` :
          cityPicker?.field === 'from' ?
          'From airport' :
          'To airport' :
          mode === 'hotels' ?
          'Destination' :
          mode === 'holiday' ?
          'Tour destination' :
          cityPicker?.field === 'from' ?
          'Departure' :
          'Destination'
        }
        mode={mode}
        field={cityPicker?.field}
        onClose={() => setCityPicker(null)}
        onSelect={handleSelectCity} />
      

      <PaymentMethodPickerSheet
        open={pickerOpen}
        total={pickerTotal}
        currencyCode={travelCurrency.code}
        currencyRate={travelCurrency.rate}
        walletBalanceEtb={walletAmountEtb}
        apiPaymentTypes={paymentTypes}
        current={paySel}
        onClose={() => setPickerOpen(false)}
        onSelect={setPaySel} />
      

      <TransactionPINSheet
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onSuccess={() => {
          setPinOpen(false);
          onPinDone?.();

          // Debit the wallet for this booking (GuestAPI BookingDebit).
          // Best-effort: the booking is already confirmed above, so a debit
          // failure here should not block the user — just log it.
          // UserId MUST be TravellerLogin id (same as TransactionReport) —
          // never Validation's shared "1000".
          const remembered = recallWalletUserId({
            email: user?.email || traveller.session?.email,
            username: user?.username || traveller.session?.username,
            phone: user?.phone || traveller.session?.mobile
          });
          const userId =
            (user?.userId && user.userId > 0 ? user.userId : null) ||
            (traveller.session?.userId && traveller.session.userId > 0 ?
              traveller.session.userId :
              null) ||
            remembered ||
            undefined;
          const userTypeId = user?.userTypeId ?? traveller.session?.userTypeId ?? 5;
          // BookFlightId is typed int server-side — pull digits out of
          // reference strings like "#BKG12345678" / "PNR ABC123".
          const numericBookingRef = Number(
            String(pinBookingRef || '').replace(/\D/g, '')
          );
          if (userId && userId > 0 && pinTotal > 0) {
            void bookingDebit({
              userId,
              userTypeId,
              bookFlightId: Number.isFinite(numericBookingRef) && numericBookingRef > 0 ?
                numericBookingRef :
                0,
              debitAmount: pinTotal.toFixed(2)
            }).then((result) => {
              if (!result.success) {
                console.warn('BookingDebit failed:', result.message);
                const msg = String(result.message || '').toLowerCase();
                if (msg.includes('insufficient') || msg.includes('balance')) {
                  showTravelError(result.message || 'Insufficient wallet balance', {
                    id: 'wallet-debit-failed',
                    title: 'Insufficient balance'
                  });
                } else {
                  showTravelError(result.message || 'Wallet debit failed', {
                    id: 'wallet-debit-failed',
                    title: 'Payment issue'
                  });
                }
              }
              void refreshWallet();
            });
          } else {
            void refreshWallet();
          }
        }}
        amount={pinTotal}
        currencyCode={travelCurrency.code}
        recipient="Travel Booking"
        title="Confirm Payment" />

      <LiveChatSheet
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onOpenTrips={() => {
          setTripsSegment('scheduled');
          setActiveTab('trips');
        }}
      />

      <SupportTicketsSheet
        open={supportTicketsOpen}
        userTypeId={apiUserTypeId}
        userId={apiUserId}
        onClose={() => setSupportTicketsOpen(false)}
      />
      
    </div>);

}
