import type { LucideIcon } from 'lucide-react';
import { Building2, Car, Plane } from 'lucide-react';

export type TicketStatus = 'Completed' | 'Refunded';

export type PastTicket = {
  id: string;
  kind: 'flight' | 'hotel' | 'car';
  title: string;
  route: string;
  date: string;
  reference: string;
  amount: string;
  status: TicketStatus;
  icon: LucideIcon;
};

export type NotificationIcon = 'alert' | 'tag' | 'bell' | 'check';

export type TravelNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  icon: NotificationIcon;
};

export const PAST_TICKETS: PastTicket[] = [
  {
    id: 't-1',
    kind: 'flight',
    title: 'Ethiopian Airlines',
    route: 'Addis Ababa (ADD) → Dubai (DXB)',
    date: '12 May 2026',
    reference: 'ET-8KD21A',
    amount: 'Br 18,450',
    status: 'Completed',
    icon: Plane
  },
  {
    id: 't-2',
    kind: 'hotel',
    title: 'Skylight Hotel',
    route: 'Addis Ababa · 3 nights',
    date: '2 Apr 2026',
    reference: 'HT-7KL19B',
    amount: 'Br 9,600',
    status: 'Completed',
    icon: Building2
  },
  {
    id: 't-3',
    kind: 'car',
    title: 'Dubai Rent-a-Car',
    route: 'Dubai · 4 days sedan',
    date: '10 Mar 2026',
    reference: 'CR-5NM08C',
    amount: 'Br 6,200',
    status: 'Refunded',
    icon: Car
  },
  {
    id: 't-4',
    kind: 'flight',
    title: 'FlyDubai',
    route: 'Dubai (DXB) → Addis Ababa (ADD)',
    date: '22 Apr 2026',
    reference: 'ET-4PL92C',
    amount: 'Br 14,200',
    status: 'Completed',
    icon: Plane
  },
  {
    id: 't-5',
    kind: 'hotel',
    title: 'Grand Mercure Dubai',
    route: 'Dubai · 2 nights',
    date: '16 Apr 2026',
    reference: 'HT-2MN44D',
    amount: 'Br 11,800',
    status: 'Completed',
    icon: Building2
  }
];

export const TRAVEL_NOTIFICATIONS: TravelNotification[] = [
  {
    id: 'n-1',
    title: 'Gate change · ET302',
    message: 'Now Boarding Gate B7. Boarding starts at 14:20 local time.',
    time: '2h ago',
    unread: true,
    icon: 'alert'
  },
  {
    id: 'n-2',
    title: 'Fare drop alert',
    message: 'Addis Ababa → Dubai dropped to Br 2,300 for your saved dates.',
    time: '5h ago',
    unread: true,
    icon: 'tag'
  },
  {
    id: 'n-3',
    title: '2x miles this weekend',
    message: 'Book any international flight this weekend and earn double miles.',
    time: '1d ago',
    unread: true,
    icon: 'bell'
  },
  {
    id: 'n-4',
    title: 'Trip completed',
    message: 'Your Addis Ababa → Nairobi trip is marked complete. Rate your experience.',
    time: '2d ago',
    unread: false,
    icon: 'check'
  },
  {
    id: 'n-5',
    title: 'Price watch update',
    message: 'Nairobi route is trending up — book soon to lock today’s fare.',
    time: '3d ago',
    unread: false,
    icon: 'tag'
  }
];
