import {
  BedDouble,
  Car,
  Compass,
  PlaneTakeoff,
  TrainFront,
  Umbrella
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SignupV2Service = {
  id: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
  tile: string;
};

export const signupV2Services: SignupV2Service[] = [
  {
    id: 'flights',
    label: 'Flights',
    blurb: '600+ airlines',
    icon: PlaneTakeoff,
    tile: 'from-sky-400 to-blue-600'
  },
  {
    id: 'hotels',
    label: 'Hotels',
    blurb: 'Free cancellation',
    icon: BedDouble,
    tile: 'from-amber-400 to-orange-500'
  },
  {
    id: 'tours',
    label: 'Tours',
    blurb: 'Guided days out',
    icon: Compass,
    tile: 'from-violet-400 to-indigo-600'
  },
  {
    id: 'holidays',
    label: 'Holidays',
    blurb: 'Flight + stay',
    icon: Umbrella,
    tile: 'from-rose-400 to-pink-600'
  },
  {
    id: 'cars',
    label: 'Car hire',
    blurb: '40k locations',
    icon: Car,
    tile: 'from-teal-400 to-emerald-600'
  },
  {
    id: 'trains',
    label: 'Trains',
    blurb: 'Passes & seats',
    icon: TrainFront,
    tile: 'from-lime-400 to-green-600'
  }
];
