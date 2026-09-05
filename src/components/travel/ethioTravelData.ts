import { Plane, Bus, TrainFront, Building2, Car, Palmtree, MapPin } from 'lucide-react';

// ===== THEME v3 — Horizon (scoped to Travel module only) =====
export const KTA = {
  blue: '#0D9488',
  navy: '#1C1917',
  green: '#0D9488',
  red: '#E11D48',
  orange: '#F97316',
  bg: '#FAF7F2',
  border: '#E7E5E4',
  textPrimary: '#1C1917',
  textSecondary: '#78716C',
  inputBg: '#F5F5F4'
};

export type Mode = 'flights' | 'bus' | 'train' | 'hotels' | 'minibus' | 'holiday';

export const MODE_META: Record<Mode, {label: string;icon: typeof Plane;}> = {
  flights: { label: 'Flights', icon: Plane },
  bus: { label: 'Bus', icon: Bus },
  train: { label: 'Train', icon: TrainFront },
  hotels: { label: 'Hotels', icon: Building2 },
  minibus: { label: 'Car Rentals', icon: Car },
  holiday: { label: 'Tours', icon: Palmtree }
};

export interface CityResult {
  name: string;
  detail: string;
  kind: 'city' | 'airport' | 'train' | 'bus';
  code?: string;
}

export const CITY_RESULTS: CityResult[] = [
{ name: 'Addis Ababa', detail: 'Ethiopia', kind: 'city', code: 'ADD' },
{
  name: 'Bole International Airport',
  detail: 'Addis Ababa · Terminal 1 & 2',
  kind: 'airport',
  code: 'ADD'
},
{ name: 'Meskel Square Bus Terminal', detail: 'Addis Ababa', kind: 'bus' },
{ name: 'Autobus Terra', detail: 'Addis Ababa', kind: 'bus' },
{ name: 'Lebu Railway Station', detail: 'Addis Ababa', kind: 'train' },
{ name: 'Bahir Dar', detail: 'Amhara', kind: 'city', code: 'BJR' },
{ name: 'Gondar', detail: 'Amhara', kind: 'city', code: 'GDQ' },
{ name: 'Hawassa', detail: 'Sidama', kind: 'city', code: 'AWA' },
{ name: 'Dire Dawa', detail: 'Dire Dawa', kind: 'city', code: 'DIR' },
{ name: 'Lalibela', detail: 'Amhara', kind: 'city', code: 'LLI' },
{ name: 'Mekelle', detail: 'Tigray', kind: 'city', code: 'MQX' },
{ name: 'Djibouti', detail: 'Djibouti', kind: 'city', code: 'JIB' },
{
  name: 'Dubai',
  detail: 'United Arab Emirates',
  kind: 'airport',
  code: 'DXB'
},
{
  name: 'Abu Dhabi',
  detail: 'United Arab Emirates',
  kind: 'airport',
  code: 'AUH'
},
{
  name: 'London Heathrow',
  detail: 'United Kingdom',
  kind: 'airport',
  code: 'LHR'
},
{ name: 'Nairobi', detail: 'Kenya', kind: 'airport', code: 'NBO' }];


// ===== RESULT TRIPS =====
/** Airport / stop along a flight itinerary (for timeline UI). */
export type FlightRoutePoint = {
  /** IATA airport code */
  code: string;
  /** Primary time (depart for origin, arrive for destination/stop) */
  time: string;
  /** Optional second time at a connection (next-leg depart) */
  timeTo?: string;
  /**
   * origin / destination — journey ends.
   * stop — true layover / en-route stop (StopCount).
   * leg — multi-city next-flight airport (not a layover stop).
   */
  kind: 'origin' | 'stop' | 'destination' | 'leg';
  /** Short note under the point (layover, flight no) */
  note?: string;
};

export interface Trip {
  id: string;
  operator: string;
  operatorInitial: string;
  operatorColor: string;
  operatorLogo?: string;
  departTime: string;
  arriveTime: string;
  duration: string;
  transfers: number;
  price: number;
  currency: string;
  co2: string;
  tags: string[];
  fromCity: string;
  toCity: string;
  flightNo?: string;
  baggage?: string;
  cabinBaggage?: string;
  refundable?: string;
  departCityCode?: string;
  arriveCityCode?: string;
  fareClass?: string;
  /** Dynamic timeline points (origin → stops → destination). */
  routePoints?: FlightRoutePoint[];
  // Bus-specific fields
  busType?: string;
  seatsAvailable?: number;
  originalPrice?: number;
  discountCode?: string;
  rating?: number;
  reviews?: number;
  apiPayload?: Record<string, unknown>;
}

export const TRIPS: Record<Exclude<Mode, 'hotels' | 'minibus'>, Trip[]> = {
  flights: [
  {
    id: 'fl1',
    operator: 'Ethiopian Airlines',
    operatorInitial: 'E',
    operatorColor: KTA.blue,
    operatorLogo: 'https://images.kiwi.com/airlines/64/ET.png',

    departTime: '06:45',
    arriveTime: '07:35',
    duration: '0h50m',
    transfers: 0,
    price: 100,
    currency: 'ETB',
    co2: '21 kg CO₂',
    tags: ['Cheapest', '2nd Fastest'],
    fromCity: 'Bole Intl (ADD)',
    toCity: 'Bahir Dar (BJR)',
    flightNo: 'ET 100'
  },
  {
    id: 'fl2',
    operator: 'Ethiopian Airlines',
    operatorInitial: 'E',
    operatorColor: KTA.blue,
    operatorLogo: 'https://images.kiwi.com/airlines/64/ET.png',

    departTime: '13:20',
    arriveTime: '14:10',
    duration: '0h50m',
    transfers: 0,
    price: 130,
    currency: 'ETB',
    co2: '21 kg CO₂',
    tags: ['Fastest'],
    fromCity: 'Bole Intl (ADD)',
    toCity: 'Bahir Dar (BJR)',
    flightNo: 'ET 124'
  },
  {
    id: 'fl3',
    operator: 'Ethiopian Airlines',
    operatorInitial: 'E',
    operatorColor: KTA.blue,
    operatorLogo: 'https://images.kiwi.com/airlines/64/ET.png',

    departTime: '17:45',
    arriveTime: '18:35',
    duration: '0h50m',
    transfers: 0,
    price: 115,
    currency: 'ETB',
    co2: '21 kg CO₂',
    tags: ['Recommended'],
    fromCity: 'Bole Intl (ADD)',
    toCity: 'Bahir Dar (BJR)',
    flightNo: 'ET 158'
  }],

  bus: [
  {
    id: 'bs1',
    operator: 'Selam Bus',
    operatorInitial: 'S',
    operatorColor: KTA.navy,
    operatorLogo:
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&q=80',
    departTime: '05:30',
    arriveTime: '07:55',
    duration: '2h25m',
    transfers: 0,
    price: 100,
    currency: 'ETB',
    co2: '8 kg CO₂',
    tags: ['Cheapest'],
    fromCity: 'Meskel Sq. Terminal',
    toCity: 'Bahir Dar Terminal'
  },
  {
    id: 'bs2',
    operator: 'SKY Bus',
    operatorInitial: 'K',
    operatorColor: KTA.navy,
    operatorLogo:
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=100&q=80',
    departTime: '06:00',
    arriveTime: '08:40',
    duration: '2h40m',
    transfers: 0,
    price: 120,
    currency: 'ETB',
    co2: '8 kg CO₂',
    tags: ['Recommended'],
    fromCity: 'Meskel Sq. Terminal',
    toCity: 'Bahir Dar Terminal'
  },
  {
    id: 'bs3',
    operator: 'Golden Bus',
    operatorInitial: 'G',
    operatorColor: KTA.navy,
    operatorLogo:
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&q=80',
    departTime: '07:30',
    arriveTime: '10:20',
    duration: '2h50m',
    transfers: 1,
    price: 90,
    currency: 'ETB',
    co2: '9 kg CO₂',
    tags: ['Cheapest', '1 Transfer'],
    fromCity: 'Autobus Terra',
    toCity: 'Bahir Dar Terminal'
  }],

  train: [
  {
    id: 'tr1',
    operator: 'Ethio-Djibouti Railways',
    operatorInitial: 'R',
    operatorColor: KTA.textSecondary,
    operatorLogo:
    'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=100&q=80',
    departTime: '08:00',
    arriveTime: '09:42',
    duration: '1h42m',
    transfers: 0,
    price: 300,
    currency: 'ETB',
    co2: '4 kg CO₂',
    tags: ['Greenest', 'Recommended'],
    fromCity: 'Lebu Railway Station',
    toCity: 'Dire Dawa Station'
  },
  {
    id: 'tr2',
    operator: 'Ethio-Djibouti Railways',
    operatorInitial: 'R',
    operatorColor: KTA.textSecondary,
    operatorLogo:
    'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=100&q=80',
    departTime: '15:30',
    arriveTime: '17:18',
    duration: '1h48m',
    transfers: 0,
    price: 280,
    currency: 'ETB',
    co2: '4 kg CO₂',
    tags: ['Cheapest'],
    fromCity: 'Lebu Railway Station',
    toCity: 'Dire Dawa Station'
  }]

};

export interface Hotel {
  id: string;
  name: string;
  location: string;
  stars: number;
  reviews: number;
  roomType: string;
  pricePerNight: number;
  currency: string;
  amenities: string[];
  color: string;
  image?: string;
  tags: string[];
  gallery?: string[];
  address?: string;
  rating?: number;
  description?: string;
  facilities?: string[];
  nearby?: {name: string;distance: string;}[];
  reviewHighlights?: {
    name: string;
    rating: number;
    quote: string;
    date: string;
  }[];
  priceBeforeDiscount?: number;
  ratingLabel?: string;
  categoryRatings?: {label: string;score: number;}[];
  checkIn?: string;
  checkOut?: string;
  distanceFromCenter?: string;
  roomOptions?: {
    id?: string;
    name: string;
    image: string;
    perks: string[];
    pricePerNight: number;
    refundable?: boolean;
    showPrice?: number;
    totalTaxes?: number;
    inclusion?: string;
    cancellationAmount?: string;
    paymentInfo?: string;
    apiPayload?: Record<string, unknown>;
  }[];
  houseRules?: string[];
  /** Live API fields */
  apiPayload?: Record<string, unknown>;
  traceId?: string;
  totalStayPrice?: number;
  totalNights?: number;
}

export const POPULAR_CITIES = [
{ name: 'Addis Ababa', icon: '🏛️' },
{ name: 'Bahir Dar', icon: '🌊' },
{ name: 'Hawassa', icon: '🌴' },
{ name: 'Dire Dawa', icon: '🚂' },
{ name: 'Gondar', icon: '🏰' },
{ name: 'Mekelle', icon: '⛰️' },
{ name: 'Adama', icon: '🛣️' },
{ name: 'Jimma', icon: '☕' },
{ name: 'Lalibela', icon: '⛪' },
{ name: 'Harar', icon: '🕌' },
{ name: 'Arba Minch', icon: '🐊' },
{ name: 'Dessie', icon: '🏔️' }];


export const BOARDING_POINTS = [
{
  id: '1',
  name: 'Meskel Square Bus Terminal',
  distance: '0.8 Km',
  time: '06:30',
  date: '18 Jun'
},
{
  id: '2',
  name: 'Megenagna Roundabout',
  distance: '2.4 Km',
  time: '06:40',
  date: '18 Jun'
},
{
  id: '3',
  name: 'Autobus Terra (Merkato)',
  distance: '3.1 Km',
  time: '06:50',
  date: '18 Jun'
},
{
  id: '4',
  name: 'Bole Medhanialem',
  distance: '4.6 Km',
  time: '07:00',
  date: '18 Jun'
},
{
  id: '5',
  name: 'Lebu Roundabout',
  distance: '6.2 Km',
  time: '07:10',
  date: '18 Jun'
},
{
  id: '6',
  name: 'CMC Square',
  distance: '7.5 Km',
  time: '07:20',
  date: '18 Jun'
},
{
  id: '7',
  name: 'Ayat Square',
  distance: '9.1 Km',
  time: '07:30',
  date: '18 Jun'
},
{
  id: '8',
  name: 'Kality Bus Station',
  distance: '11.4 Km',
  time: '07:45',
  date: '18 Jun'
}];


export const DROPPING_POINTS = [
{
  id: '1',
  name: 'Bahir Dar Main Bus Station',
  distance: '0.5 Km',
  time: '14:30',
  date: '18 Jun'
},
{
  id: '2',
  name: 'Fasilo Square',
  distance: '2.1 Km',
  time: '14:45',
  date: '18 Jun'
},
{
  id: '3',
  name: 'Gish Abay',
  distance: '4.3 Km',
  time: '15:10',
  date: '18 Jun'
},
{
  id: '4',
  name: 'Tana Hotel Junction',
  distance: '5.8 Km',
  time: '15:20',
  date: '18 Jun'
}];


export const BUS_OPERATORS = [
{
  id: 'op1',
  name: 'Selam Bus',
  initial: 'S',
  color: '#0D9488',
  rating: 4.5,
  reviews: '12.4K',
  buses: 45,
  seats: 1250,
  startsAt: 450,
  offer: 'Save upto ETB 150 on Selam Bus bookings. Code: SELAM150'
},
{
  id: 'op2',
  name: 'Sky Bus',
  initial: 'S',
  color: '#5EEAD4',
  rating: 4.3,
  reviews: '8.2K',
  buses: 28,
  seats: 840,
  startsAt: 420,
  offer: '10% off for Child Passengers'
},
{
  id: 'op3',
  name: 'Ethio Bus',
  initial: 'E',
  color: '#F59E0B',
  rating: 4.1,
  reviews: '5.6K',
  buses: 15,
  seats: 420,
  startsAt: 380,
  offer: 'Upto ETB 50 off. Code: RETURN50'
}];


export const HOTELS_DATA: Hotel[] = [
{
  id: 'h1',
  name: 'Sheraton Addis',
  location: 'Addis Ababa',
  stars: 5,
  reviews: 1240,
  roomType: 'Classic Room',
  pricePerNight: 8500,
  priceBeforeDiscount: 9800,
  currency: 'ETB',
  amenities: ['Free Wi-Fi', 'Pool', 'Spa'],
  color: KTA.navy,
  image:
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  tags: ['Top rated', 'Luxury'],
  gallery: [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
  'https://images.unsplash.com/photo-1542314831-c6a4d14d837e?w=600&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80'],

  address: 'Taitu Street, Addis Ababa, Ethiopia',
  distanceFromCenter: '1.2 km from city center',
  rating: 4.8,
  ratingLabel: 'Exceptional',
  description:
  'Experience unparalleled luxury at Sheraton Addis, a Luxury Collection Hotel. Set in the heart of the Ethiopian capital, our hotel offers stunning views, exquisite dining, and world-class amenities. The hotel features a magnificent swimming pool, a state-of-the-art fitness center, and a rejuvenating spa.',
  facilities: [
  'Free Wi-Fi',
  'Swimming Pool',
  'Spa & Wellness Center',
  'Fitness Center',
  'Restaurant',
  'Bar',
  'Room Service',
  'Airport Shuttle',
  'Free Parking',
  'Business Center'],

  categoryRatings: [
  { label: 'Cleanliness', score: 4.9 },
  { label: 'Location', score: 4.8 },
  { label: 'Service', score: 4.9 },
  { label: 'Value', score: 4.5 }],

  checkIn: '2:00 PM',
  checkOut: '12:00 PM',
  houseRules: [
  'No smoking in rooms',
  'Pets are not allowed',
  'Parties/events are not allowed',
  'Quiet hours from 10:00 PM to 6:00 AM'],

  roomOptions: [
  {
    name: 'Classic King Room',
    image:
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80',
    perks: ['King bed', 'City view', 'Free Wi-Fi', 'Breakfast included'],
    pricePerNight: 8500,
    refundable: true
  },
  {
    name: 'Executive Suite',
    image:
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
    perks: [
    'Extra large double bed',
    'Pool view',
    'Lounge access',
    'Free Wi-Fi'],

    pricePerNight: 12500,
    refundable: true
  }],

  nearby: [
  { name: 'National Museum of Ethiopia', distance: '1.2 km' },
  { name: 'Holy Trinity Cathedral', distance: '1.5 km' },
  { name: 'Bole International Airport', distance: '7.5 km' }],

  reviewHighlights: [
  {
    name: 'Abebe K.',
    rating: 5,
    quote: 'Absolutely stunning property with impeccable service.',
    date: 'Oct 2023'
  },
  {
    name: 'Sarah M.',
    rating: 5,
    quote: 'The best hotel in Addis. The pool area is an oasis.',
    date: 'Sep 2023'
  }]

},
{
  id: 'h2',
  name: 'Hyatt Regency',
  location: 'Addis Ababa',
  stars: 5,
  reviews: 980,
  roomType: 'Standard King',
  pricePerNight: 7200,
  priceBeforeDiscount: 8000,
  currency: 'ETB',
  amenities: ['Free Wi-Fi', 'Gym', 'Bar'],
  color: KTA.blue,
  image:
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80',
  tags: ['Popular'],
  gallery: [
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80',
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80',
  'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80'],

  address: 'Meskel Square, Addis Ababa, Ethiopia',
  distanceFromCenter: '0.5 km from city center',
  rating: 4.7,
  ratingLabel: 'Superb',
  description:
  'Located in the vibrant center of Addis Ababa, Hyatt Regency offers modern comfort with a touch of Ethiopian hospitality. Perfect for both business and leisure travelers, featuring a heated outdoor pool, multiple dining venues, and extensive meeting facilities.',
  facilities: [
  'Free Wi-Fi',
  'Fitness Center',
  'Bar/Lounge',
  'Restaurant',
  'Meeting Rooms',
  'Outdoor Pool',
  'Spa Services',
  'Concierge'],

  categoryRatings: [
  { label: 'Cleanliness', score: 4.8 },
  { label: 'Location', score: 4.9 },
  { label: 'Service', score: 4.6 },
  { label: 'Value', score: 4.4 }],

  checkIn: '3:00 PM',
  checkOut: '12:00 PM',
  houseRules: [
  'No smoking',
  'Pets are not allowed',
  'Minimum check-in age is 18'],

  roomOptions: [
  {
    name: 'Standard King Room',
    image:
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&q=80',
    perks: ['King bed', 'Courtyard view', 'Free Wi-Fi'],
    pricePerNight: 7200,
    refundable: false
  },
  {
    name: 'Regency Club Room',
    image:
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80',
    perks: ['King bed', 'City view', 'Club access', 'Free breakfast'],
    pricePerNight: 9500,
    refundable: true
  }],

  nearby: [
  { name: 'Meskel Square', distance: '0.1 km' },
  { name: 'Red Terror Martyrs Memorial Museum', distance: '0.3 km' },
  { name: 'Bole International Airport', distance: '5.0 km' }],

  reviewHighlights: [
  {
    name: 'John D.',
    rating: 5,
    quote: 'Great location right on Meskel Square. Very modern.',
    date: 'Nov 2023'
  },
  {
    name: 'Helen T.',
    rating: 4,
    quote: 'Excellent breakfast buffet and friendly staff.',
    date: 'Aug 2023'
  }]

},
{
  id: 'h3',
  name: 'Kuriftu Resort',
  location: 'Bishoftu',
  stars: 4,
  reviews: 850,
  roomType: 'Lake View Suite',
  pricePerNight: 5400,
  priceBeforeDiscount: 6500,
  currency: 'ETB',
  amenities: ['Breakfast included', 'Spa', 'Pool'],
  color: KTA.textSecondary,
  image:
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
  tags: ['Resort', 'Free cancellation'],
  gallery: [
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80',
  'https://images.unsplash.com/photo-1542314831-c6a4d14d837e?w=600&q=80'],

  address: 'Lake Kuriftu, Bishoftu, Ethiopia',
  distanceFromCenter: '2.5 km from town center',
  rating: 4.5,
  ratingLabel: 'Wonderful',
  description:
  'Escape to Kuriftu Resort & Spa, nestled on the shores of Lake Kuriftu. Enjoy breathtaking views, rejuvenating spa treatments, and a serene atmosphere just a short drive from Addis Ababa. The resort features authentic Ethiopian architecture and design.',
  facilities: [
  'Free Breakfast',
  'Spa & Wellness Center',
  'Swimming Pool',
  'Lake Access',
  'Restaurant',
  'Free Wi-Fi',
  'Kayaking',
  'Cinema'],

  categoryRatings: [
  { label: 'Cleanliness', score: 4.6 },
  { label: 'Location', score: 4.9 },
  { label: 'Service', score: 4.5 },
  { label: 'Value', score: 4.3 }],

  checkIn: '2:00 PM',
  checkOut: '11:00 AM',
  houseRules: [
  'No smoking indoors',
  'Pets allowed on request',
  'Quiet hours from 11:00 PM'],

  roomOptions: [
  {
    name: 'Lake View Suite',
    image:
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',
    perks: ['King bed', 'Lake view', 'Balcony', 'Breakfast included'],
    pricePerNight: 5400,
    refundable: true
  },
  {
    name: 'Garden View Room',
    image:
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80',
    perks: ['Queen bed', 'Garden view', 'Breakfast included'],
    pricePerNight: 4200,
    refundable: true
  }],

  nearby: [
  { name: 'Lake Kuriftu', distance: '0.0 km' },
  { name: 'Bishoftu Town Center', distance: '2.5 km' },
  { name: 'Crater Lakes', distance: '3.0 km' }],

  reviewHighlights: [
  {
    name: 'Dawit M.',
    rating: 5,
    quote: 'The perfect weekend getaway. The spa is amazing!',
    date: 'Dec 2023'
  },
  {
    name: 'Emma W.',
    rating: 4,
    quote: 'Beautiful views of the lake from our room.',
    date: 'Oct 2023'
  }]

},
{
  id: 'h4',
  name: 'Skylight Hotel',
  location: 'Bole, Addis Ababa',
  stars: 5,
  reviews: 1100,
  roomType: 'Standard Room',
  pricePerNight: 6800,
  priceBeforeDiscount: 7500,
  currency: 'ETB',
  amenities: ['Free Wi-Fi', 'Airport shuttle', 'Pool'],
  color: KTA.blue,
  image:
  'https://images.unsplash.com/photo-1542314831-c6a4d14d837e?w=600&q=80',
  tags: ['Near airport'],
  gallery: [
  'https://images.unsplash.com/photo-1542314831-c6a4d14d837e?w=600&q=80',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80'],

  address: 'Airport Road, Bole, Addis Ababa, Ethiopia',
  distanceFromCenter: '6.0 km from city center',
  rating: 4.6,
  ratingLabel: 'Excellent',
  description:
  'Ethiopian Skylight Hotel is a striking contemporary property located just minutes from Bole International Airport. It offers luxurious accommodations, diverse dining options, and extensive conference facilities, making it ideal for transit and business travelers.',
  facilities: [
  'Free Wi-Fi',
  'Airport Shuttle',
  'Swimming Pool',
  'Fitness Center',
  'Multiple Restaurants',
  'Business Center',
  'Currency Exchange',
  'Gift Shop'],

  categoryRatings: [
  { label: 'Cleanliness', score: 4.8 },
  { label: 'Location', score: 4.9 },
  { label: 'Service', score: 4.5 },
  { label: 'Value', score: 4.4 }],

  checkIn: '2:00 PM',
  checkOut: '12:00 PM',
  houseRules: [
  'No smoking',
  'Pets are not allowed',
  'Valid ID required upon check-in'],

  roomOptions: [
  {
    name: 'Standard Room',
    image:
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80',
    perks: ['King bed', 'City view', 'Free Wi-Fi'],
    pricePerNight: 6800,
    refundable: false
  },
  {
    name: 'Premium Suite',
    image:
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80',
    perks: ['King bed', 'Living area', 'Airport view', 'Lounge access'],
    pricePerNight: 10500,
    refundable: true
  }],

  nearby: [
  { name: 'Bole International Airport', distance: '0.5 km' },
  { name: 'Edna Mall', distance: '2.0 km' },
  { name: 'Medhane Alem Cathedral', distance: '2.5 km' }],

  reviewHighlights: [
  {
    name: 'Michael B.',
    rating: 5,
    quote: 'Incredibly convenient for layovers. Beautiful rooms.',
    date: 'Jan 2024'
  },
  {
    name: 'Tigist A.',
    rating: 4,
    quote: 'Great food options and very close to the airport.',
    date: 'Nov 2023'
  }]

}];


export interface CarRental {
  id: string;
  name: string;
  type: string;
  seats: number;
  transmission: 'Auto' | 'Manual';
  pricePerDay: number;
  currency: string;
  supplier: string;
  color: string;
  image?: string;
  tags: string[];
  apiPayload?: Record<string, unknown>;
}

export const CARS_DATA: CarRental[] = [
{
  id: 'c1',
  name: 'Toyota Corolla',
  type: 'Economy',
  seats: 5,
  transmission: 'Auto',
  pricePerDay: 1500,
  currency: 'ETB',
  supplier: 'Avis Ethiopia',
  color: KTA.blue,
  image:
  'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600&q=80',
  tags: ['Unlimited km', 'Free cancellation']
},
{
  id: 'c2',
  name: 'Hyundai Tucson',
  type: 'SUV',
  seats: 5,
  transmission: 'Auto',
  pricePerDay: 2800,
  currency: 'ETB',
  supplier: 'Hertz',
  color: KTA.navy,
  image:
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&q=80',
  tags: ['Unlimited km']
},
{
  id: 'c3',
  name: 'Toyota Hiace',
  type: 'Van',
  seats: 12,
  transmission: 'Manual',
  pricePerDay: 3500,
  currency: 'ETB',
  supplier: 'Local Rentals',
  color: KTA.textSecondary,
  image:
  'https://images.unsplash.com/photo-1520627977056-c307aeb9a625?w=600&q=80',
  tags: ['Group travel']
},
{
  id: 'c4',
  name: 'Suzuki Swift',
  type: 'Compact',
  seats: 4,
  transmission: 'Manual',
  pricePerDay: 1200,
  currency: 'ETB',
  supplier: 'Avis Ethiopia',
  color: KTA.blue,
  image:
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&q=80',
  tags: ['Great value']
}];


// ===== HOME CONTENT =====
export interface Banner {
  tag: string;
  title: string;
  sub: string;
  cta: string;
  bg: string;
  ctaColor: string;
  icon: typeof Plane;
}

export const BANNERS: Banner[] = [
{
  tag: 'Limited time',
  title: 'Fly Addis–Dubai from $299',
  sub: 'Round trip · Book before 30 Jun',
  cta: 'Book now',
  bg: KTA.blue,
  ctaColor: '#ffffff',
  icon: Plane
},
{
  tag: 'Hotel deal',
  title: 'Sheraton Addis 30% off rooms',
  sub: 'Check in Jul 1–15',
  cta: 'View deal',
  bg: KTA.navy,
  ctaColor: '#ffffff',
  icon: Building2
},
{
  tag: 'Bus offer',
  title: 'Selam Bus ETB 50 off any trip',
  sub: 'Code: SELAM50',
  cta: 'Grab offer',
  bg: KTA.blue,
  ctaColor: '#ffffff',
  icon: Bus
},
{
  tag: 'Train',
  title: 'ADD–Djibouti Weekend special',
  sub: 'ETB 800 return',
  cta: 'Book train',
  bg: KTA.blue,
  ctaColor: '#ffffff',
  icon: TrainFront
}];


export interface Deal {
  route: string;
  operator: string;
  price: string;
  was: string;
  discount: string;
  color: string;
  icon: typeof Plane;
}

export const FLIGHT_DEALS: Deal[] = [
{
  route: 'ADD → LHR',
  operator: 'Ethiopian Airlines',
  price: '$489',
  was: '$620',
  discount: '-21%',
  color: KTA.blue,
  icon: Plane
},
{
  route: 'ADD → DXB',
  operator: 'Emirates',
  price: '$299',
  was: '$410',
  discount: '-27%',
  color: KTA.navy,
  icon: Plane
},
{
  route: 'ADD → IST',
  operator: 'Turkish Airlines',
  price: '$341',
  was: '$490',
  discount: '-30%',
  color: KTA.textSecondary,
  icon: Plane
},
{
  route: 'ADD → NBO',
  operator: 'Kenya Airways',
  price: '$178',
  was: '$240',
  discount: '-26%',
  color: KTA.blue,
  icon: Plane
}];


export const HOTEL_DEALS: Deal[] = [
{
  route: 'Sheraton Addis',
  operator: 'Addis Ababa',
  price: 'ETB 2,400',
  was: 'ETB 3,400',
  discount: '-29%',
  color: KTA.blue,
  icon: Building2
},
{
  route: 'Hyatt Regency',
  operator: 'Addis Ababa',
  price: 'ETB 1,700',
  was: 'ETB 2,200',
  discount: '-23%',
  color: KTA.navy,
  icon: Building2
},
{
  route: 'Kuriftu Resort',
  operator: 'Bishoftu',
  price: 'ETB 1,200',
  was: 'ETB 1,600',
  discount: '-25%',
  color: KTA.textSecondary,
  icon: Building2
}];


export const BUS_DEALS: Deal[] = [
{
  route: 'ADD → Bahir Dar',
  operator: 'Selam Bus',
  price: 'ETB 330',
  was: 'ETB 380',
  discount: '-13%',
  color: KTA.blue,
  icon: Bus
},
{
  route: 'ADD → Hawassa',
  operator: 'SKY Bus',
  price: 'ETB 180',
  was: 'ETB 220',
  discount: '-18%',
  color: KTA.navy,
  icon: Bus
},
{
  route: 'ADD → Dire Dawa',
  operator: 'Golden Bus',
  price: 'ETB 420',
  was: 'ETB 520',
  discount: '-19%',
  color: KTA.textSecondary,
  icon: Bus
}];


export interface Destination {
  city: string;
  mode: string;
  origin: string;
  price: string;
  color: string;
  icon: typeof Plane;
}

export const DESTINATIONS: Destination[] = [
{
  city: 'Bahir Dar',
  mode: 'Bus',
  origin: 'from ADD',
  price: 'ETB 380',
  color: KTA.blue,
  icon: Bus
},
{
  city: 'Gondar',
  mode: 'Flight',
  origin: 'from ADD',
  price: 'ETB 1,850',
  color: KTA.navy,
  icon: Plane
},
{
  city: 'Djibouti',
  mode: 'Train',
  origin: 'from ADD',
  price: 'ETB 950',
  color: KTA.textSecondary,
  icon: TrainFront
},
{
  city: 'Hawassa',
  mode: 'Bus',
  origin: 'from ADD',
  price: 'ETB 220',
  color: KTA.blue,
  icon: Bus
},
{
  city: 'Lalibela',
  mode: 'Flight',
  origin: 'from ADD',
  price: 'ETB 2,100',
  color: KTA.navy,
  icon: Plane
}];


// ===== HOME PROMO CARDS =====
export interface PromoCard {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  bg: string;
  image?: string;
  icon?: typeof Plane;
}

export const PROMO_CARDS: PromoCard[] = [
{
  id: 'summer',
  title: 'Summer Escape ✈️',
  subtitle: 'Up to 25% OFF',
  cta: 'Book Now',
  bg: KTA.blue,
  image:
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80'
},
{
  id: 'watch',
  title: 'Watch & Earn ▶',
  subtitle: 'Watch short videos\n& earn up to ETB 50',
  cta: 'Watch Now',
  bg: '#FEF3C7'
}];


// ===== QUICK ACTIONS =====
export interface QuickAction {
  id: string;
  label: string;
  icon: typeof Plane;
  badge?: string;
  badgeColor?: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
{
  id: 'hotels',
  label: 'Hotels',
  icon: Building2
},
{
  id: 'bus',
  label: 'Bus',
  icon: Bus
},
{
  id: 'tours',
  label: 'Tours',
  icon: MapPin
}];


// ===== INFO BANNERS =====
export interface InfoBanner {
  id: string;
  title: string;
  subtitle: string;
  bg: string;
  icon: typeof Plane;
}

export const INFO_BANNERS: InfoBanner[] = [
{
  id: 'cashback',
  title: 'Get ETB 200 cashback',
  subtitle: 'When you pay with mKash Wallet',
  bg: '#D1FAE5',
  icon: Plane
},
{
  id: 'refer',
  title: 'Refer & Earn',
  subtitle: 'Invite friends & earn rewards',
  bg: '#FEF3C7',
  icon: Plane
}];


// ===== HOME: IMAGE-TOPPED CARDS =====
export interface HomeHotel {
  id: string;
  name: string;
  location: string;
  rating: number;
  price: string;
  was?: string;
  badge?: string;
  image: string;
}

export const HOME_HOTEL_DEALS: HomeHotel[] = [
{
  id: 'hh1',
  name: 'Sheraton Addis',
  location: 'Addis Ababa',
  rating: 4.9,
  price: 'ETB 2,400',
  was: 'ETB 3,400',
  badge: '-29%',
  image:
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'
},
{
  id: 'hh2',
  name: 'Kuriftu Resort',
  location: 'Bishoftu',
  rating: 4.7,
  price: 'ETB 1,200',
  was: 'ETB 1,600',
  badge: '-25%',
  image:
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80'
},
{
  id: 'hh3',
  name: 'Hyatt Regency',
  location: 'Addis Ababa',
  rating: 4.8,
  price: 'ETB 1,700',
  was: 'ETB 2,200',
  badge: '-23%',
  image:
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80'
}];


export interface TourPlace {
  id: string;
  name: string;
  location: string;
  duration: string;
  price: string;
  image: string;
}

export const TOUR_PLACES: TourPlace[] = [
{
  id: 't1',
  name: 'Lalibela Rock Churches',
  location: 'Amhara',
  duration: 'Full day',
  price: 'ETB 1,800',
  image:
  'https://images.unsplash.com/photo-1580746738099-78d6833b3e86?w=600&q=80'
},
{
  id: 't2',
  name: 'Simien Mountains Trek',
  location: 'Gondar',
  duration: '2 days',
  price: 'ETB 3,200',
  image:
  'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&q=80'
},
{
  id: 't3',
  name: 'Lake Tana Boat Tour',
  location: 'Bahir Dar',
  duration: 'Half day',
  price: 'ETB 950',
  image:
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80'
},
{
  id: 't4',
  name: 'Danakil Depression',
  location: 'Afar',
  duration: '3 days',
  price: 'ETB 6,500',
  image:
  'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=600&q=80'
}];


export interface HomeDestination {
  id: string;
  city: string;
  country: string;
  price: string;
  image: string;
}

export const HOME_DESTINATIONS: HomeDestination[] = [
{
  id: 'd1',
  city: 'Dubai',
  country: 'UAE',
  price: 'From $299',
  image:
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80'
},
{
  id: 'd2',
  city: 'Nairobi',
  country: 'Kenya',
  price: 'From $178',
  image:
  'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=600&q=80'
},
{
  id: 'd3',
  city: 'Istanbul',
  country: 'Türkiye',
  price: 'From $341',
  image:
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80'
},
{
  id: 'd4',
  city: 'London',
  country: 'UK',
  price: 'From $489',
  image:
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80'
}];


export const CLASS_OPTIONS = [
{ id: 'economy', name: 'Economy', perk: 'Free Wi-Fi', extra: 0 },
{ id: 'business', name: 'Business Class', perk: 'Free Wi-Fi', extra: 100 },
{ id: 'first', name: 'First Class', perk: 'Free Wi-Fi', extra: 200 }];


export const cur = (n: number, c: string = 'ETB') => {
  const code = String(c || 'ETB')
    .trim()
    .toUpperCase() || 'ETB';
  const amount = Number(n) || 0;
  const formatted = amount.toLocaleString('en-US', {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  });
  if (code === 'USD') return `$${formatted}`;
  return `${code} ${formatted}`;
};