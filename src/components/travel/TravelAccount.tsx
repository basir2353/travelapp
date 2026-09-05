import React, { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Award,
  Bell,
  Building2,
  Bus,
  CheckCircle2,
  ChevronRight,
  Coins,
  CreditCard,
  Download,
  FileText,
  Globe2,
  Headphones,
  Loader2,
  LogOut,
  Plane,
  Settings,
  ShieldCheck,
  Star,
  Tag,
  Ticket,
  Users,
  X
} from 'lucide-react';
import {
  TRAVEL_NOTIFICATIONS,
  type NotificationIcon,
  type TravelNotification
} from './travelBookingsData';
import { useBookingList } from '../../hooks/useBookingList';
import {
  cleanBookingDescription,
  formatBookedOnLabel,
  formatFlightSegments,
  type BookingCardItem
} from '../../services/guestApi';
import { useAuth } from '../AuthContext';
import { useTravellerWallet } from '../../hooks/useTravellerWallet';
import { WalletTransactionsSheet } from './WalletTransactionsSheet';

const ACCOUNT_GREEN = '#0D7B3E';
const ACCOUNT_BORDER = '#E5E7EB';
const ACCOUNT_TEXT = '#1A1D26';
const ACCOUNT_MUTED = '#6B7280';
const ICON_TILE = '#0D7B3E14';
const BADGE_BG = '#F59E0B1f';
const BADGE_TEXT = '#B45309';
const STATUS_COMPLETED_BG = '#0D7B3E1a';
const STATUS_REFUNDED_BG = '#FEF3C7';
const STATUS_REFUNDED_TEXT = '#B45309';
/** Home uses pt-1 under TopBar; keep Android account spacing, tighten iOS only. */
const isIOS = Capacitor.getPlatform() === 'ios';

type TravelAccountProps = {
  bookingsRefreshToken?: number;
  currencyEnabled: boolean;
  currencyCode: string;
  currencyRate?: number;
  sourceCurrencyCode: string;
  currencyPreferenceMode?: 'source' | 'auto' | 'manual';
  currencyAutoHint?: string | null;
  onCurrencyEnabledChange: (enabled: boolean) => void;
  onOpenSupport: () => void;
  onOpenTrips: () => void;
};

type RowDef = {
  icon: LucideIcon;
  label: string;
  sub: string;
  badge?: string;
  onClick?: () => void;
  switchChecked?: boolean;
  onSwitchChange?: (checked: boolean) => void;
};

export function TravelAccount({
  bookingsRefreshToken = 0,
  currencyEnabled,
  currencyCode,
  currencyRate = 1,
  sourceCurrencyCode,
  currencyPreferenceMode = 'source',
  currencyAutoHint = null,
  onCurrencyEnabledChange,
  onOpenSupport,
  onOpenTrips
}: TravelAccountProps) {
  const { user, traveller, logout } = useAuth();
  const {
    label: creditLabel,
    compactLabel: creditCompactLabel,
    userId: walletUserId,
    userTypeId: walletUserTypeId,
    refreshDashboard
  } = useTravellerWallet({
    currencyCode,
    currencyRate: currencyCode === sourceCurrencyCode || currencyCode === 'ETB' ? 1 : currencyRate,
    pollMs: 30_000
  });
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);
  const openWalletSheet = useCallback(() => {
    void refreshDashboard();
    setWalletSheetOpen(true);
  }, [refreshDashboard]);
  const [ticketsOpen, setTicketsOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [notifications, setNotifications] = useState(TRAVEL_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => n.unread).length;
  const { bookings, loading: bookingsLoading } = useBookingList({
    enabled: true,
    refreshToken: bookingsRefreshToken,
    active: ticketsOpen,
    userId: user?.userId ?? traveller.session?.userId ?? null,
    userTypeId: user?.userTypeId ?? traveller.session?.userTypeId ?? null
  });

  const displayName =
    traveller.profile?.fullName ||
    user?.name ||
    traveller.session?.username ||
    'Traveller';
  const displayPhone =
    traveller.session?.mobile ||
    traveller.profile?.mobile ||
    user?.phone ||
    '';
  const displayEmail =
    traveller.session?.email ||
    traveller.profile?.email ||
    user?.email ||
    '';
  const displayUsername =
    traveller.session?.username ||
    traveller.profile?.username ||
    user?.username ||
    '';
  const memberId =
    user?.walletNumber ||
    (user?.userId || traveller.session?.userId ?
      `TC-${user?.userId || traveller.session?.userId}` :
      '') ||
    (traveller.profile?.travellerId ?
      `TC-${traveller.profile.travellerId}` :
      '');
  const avatarInitial = (displayName.trim().charAt(0) || 'T').toUpperCase();
  const tripCount =
    traveller.dashboard?.totalBookings ??
    (bookingsLoading ? null : bookings.length);
  const tripsLabel = tripCount == null ? '…' : String(tripCount);
  const memberBadge =
    traveller.profile?.status &&
    /^(allowed|approved)$/i.test(traveller.profile.status) ?
      'Verified' :
      traveller.session?.userId || user?.userId ?
        'Member' :
        'Traveller';
  const tripGoal = 5;
  const tripsDone = tripCount ?? 0;
  const tripProgressPct = Math.min(
    100,
    Math.round((tripsDone / tripGoal) * 100)
  );

  const accountRows: RowDef[] = useMemo(
    () => [
      {
        icon: Ticket,
        label: 'My Tickets',
        sub: bookingsLoading ?
          'Loading bookings…' :
          tripCount === 0 || (tripCount == null && bookings.length === 0) ?
            'No bookings yet · book a trip' :
            `${tripCount ?? bookings.length} booking${
              (tripCount ?? bookings.length) === 1 ? '' : 's'
            }`,
        onClick: () => setTicketsOpen(true)
      },
      {
        icon: Users,
        label: 'Saved Travellers',
        sub: 'Added when you book for others'
      },
      {
        icon: FileText,
        label: 'Travel Documents',
        sub: 'Passport · Visa · ID'
      },
      {
        icon: CreditCard,
        label: 'Payment Methods',
        sub: 'mKash Wallet · transactions',
        onClick: () => openWalletSheet()
      }
    ],
    [bookings.length, bookingsLoading, tripCount, openWalletSheet]
  );

  const prefRows: RowDef[] = useMemo(
    () => [
      {
        icon: Bell,
        label: 'Notifications',
        sub: 'Fare alerts, gate changes',
        badge: unreadCount > 0 ? `${unreadCount} new` : undefined,
        onClick: () => setNotifsOpen(true)
      },
      {
        icon: Coins,
        label: 'Currency conversion',
        sub: currencyEnabled ?
          currencyPreferenceMode === 'auto' ?
            currencyAutoHint || `Local currency · ${currencyCode}` :
            `Custom currency · ${currencyCode}` :
          `Source currency · ${sourceCurrencyCode}`,
        switchChecked: currencyEnabled,
        onSwitchChange: onCurrencyEnabledChange
      },
      {
        icon: Globe2,
        label: 'Language & Region',
        sub: `English · ${currencyCode}`
      },
      {
        icon: Settings,
        label: 'Travel Preferences',
        sub: 'Seat, meal, class defaults'
      },
      {
        icon: ShieldCheck,
        label: 'Privacy & Security',
        sub: 'PIN, biometrics, sessions'
      }
    ],
    [
      currencyAutoHint,
      currencyCode,
      currencyEnabled,
      currencyPreferenceMode,
      onCurrencyEnabledChange,
      sourceCurrencyCode,
      unreadCount
    ]
  );

  return (
    <>
      <div
        className={`flex-1 overflow-y-auto no-scrollbar px-6 pb-scroll-safe bg-transparent ${
          isIOS ? 'pt-1' : 'pt-4'
        }`}>
        <div
          className="rounded-3xl p-6 mb-5 text-white relative overflow-hidden shadow-sm"
          style={{ backgroundColor: ACCOUNT_GREEN }}>
          <Plane className="absolute -right-4 -top-10 w-32 h-32 text-white/10 rotate-12" strokeWidth={1.5} />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 border border-white/20 flex items-center justify-center text-[22px] font-bold shadow-inner">
              {avatarInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-[18px] font-bold leading-tight truncate">{displayName}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full shrink-0">
                  <Award className="w-3 h-3" />
                  {memberBadge}
                </span>
              </div>
              <p className="text-[13px] text-white/90 mt-1 truncate">
                {displayPhone || displayEmail || displayUsername || '—'}
              </p>
              {(displayEmail || displayUsername || memberId) && (
                <p className="text-[11px] text-white/75 mt-0.5 truncate">
                  {[displayEmail && displayPhone ? displayEmail : null, displayUsername, memberId]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setNotifsOpen(true)}
              className="relative w-9 h-9 rounded-full flex items-center justify-center active:scale-95">
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 &&
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-white text-[10px] font-bold flex items-center justify-center"
                style={{ color: ACCOUNT_GREEN }}>
                {unreadCount}
              </span>}
            </button>
          </div>

          <div className="relative mt-6">
            <div className="flex items-center justify-between text-[12px] text-white/95 mb-2">
              <span>
                {tripsDone === 0 ?
                  'Book your first trip to get started' :
                  tripsDone >= tripGoal ?
                    'Travel milestone reached' :
                    `${Math.max(tripGoal - tripsDone, 0)} trip${
                      tripGoal - tripsDone === 1 ? '' : 's'
                    } to your next milestone`}
              </span>
              <span className="font-semibold">
                {tripsDone} / {tripGoal}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${tripProgressPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3.5 mb-6">
          {[
            {
              icon: Plane,
              value: tripsLabel,
              label: 'Trips'
            },
            {
              icon: Coins,
              value: creditCompactLabel,
              label: 'Credit'
            },
            {
              icon: Star,
              value: memberId ? memberId.replace(/^TC-/, '') : '—',
              label: 'Member ID'
            }
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-2xl bg-white/90 border min-h-[96px] py-4 px-3 flex flex-col items-center justify-center shadow-sm"
                style={{ borderColor: ACCOUNT_BORDER }}>
                <Icon className="w-5 h-5 mb-1.5" style={{ color: ACCOUNT_GREEN }} strokeWidth={2} />
                <p className="text-[18px] font-bold leading-none" style={{ color: ACCOUNT_TEXT }}>
                  {stat.value}
                </p>
                <p className="text-[12px] mt-1.5" style={{ color: ACCOUNT_MUTED }}>{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={openWalletSheet}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openWalletSheet();
            }
          }}
          className="rounded-2xl bg-white/90 border p-5 mb-3 flex items-center gap-4 shadow-sm cursor-pointer active:scale-[0.99]"
          style={{ borderColor: ACCOUNT_BORDER }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: ICON_TILE }}>
            <Coins className="w-5 h-5" style={{ color: ACCOUNT_GREEN }} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px]" style={{ color: ACCOUNT_MUTED }}>Travel credit</p>
            <p className="text-[18px] font-bold leading-tight" style={{ color: ACCOUNT_TEXT }}>{creditLabel}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openWalletSheet();
            }}
            className="h-10 px-4 rounded-xl text-[13px] font-semibold active:scale-95"
            style={{ backgroundColor: ICON_TILE, color: ACCOUNT_GREEN }}>
            History
          </button>
        </div>

        <p className="text-[12px] mb-8 px-1" style={{ color: ACCOUNT_MUTED }}>
          Tap to open TransactionReport for this account.
        </p>

        <SectionLabel>Account</SectionLabel>
        <ListCard rows={accountRows} />

        <SectionLabel className="mt-7">Settings</SectionLabel>
        <ListCard rows={prefRows} />

        <button
          type="button"
          onClick={onOpenSupport}
          className="w-full rounded-2xl bg-white/90 border mt-7 p-5 flex items-center gap-4 text-left shadow-sm active:scale-[0.99]"
          style={{ borderColor: ACCOUNT_BORDER }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: ICON_TILE }}>
            <Headphones className="w-5 h-5" style={{ color: ACCOUNT_GREEN }} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold leading-tight" style={{ color: ACCOUNT_TEXT }}>Help & Support</p>
            <p className="text-[13px] mt-0.5" style={{ color: ACCOUNT_MUTED }}>Live chat, FAQs, contact us</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => setSignOutOpen(true)}
          className="w-full rounded-2xl bg-white/90 border mt-6 h-14 flex items-center justify-center gap-2.5 text-[15px] font-bold shadow-sm active:scale-[0.99]"
          style={{ borderColor: ACCOUNT_BORDER, color: '#DC3545' }}>
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>

        <p className="text-center text-[11px] text-gray-400 mt-8 pb-4">
          KTA Travel · v2.4.1
        </p>
      </div>

      <TicketHistorySheet
        open={ticketsOpen}
        bookings={bookings}
        loading={bookingsLoading}
        onClose={() => setTicketsOpen(false)}
        onOpenTrips={() => {
          setTicketsOpen(false);
          onOpenTrips();
        }}
      />
      <NotificationsSheet
        open={notifsOpen}
        notifications={notifications}
        unreadCount={unreadCount}
        onClose={() => setNotifsOpen(false)}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
        }
      />
      <SignOutSheet
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => {
          setSignOutOpen(false);
          logout();
        }}
      />
      <WalletTransactionsSheet
        open={walletSheetOpen}
        onClose={() => setWalletSheetOpen(false)}
        userId={walletUserId ?? user?.userId ?? traveller.session?.userId}
        userTypeId={
          walletUserTypeId ?? user?.userTypeId ?? traveller.session?.userTypeId ?? 5
        }
        currencyCode={currencyCode}
        currencyRate={
          currencyCode === sourceCurrencyCode || currencyCode === 'ETB' ?
            1 :
            currencyRate
        }
      />
    </>
  );
}

function SectionLabel({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`px-1 mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 ${className}`}>
      {children}
    </p>
  );
}

function ListCard({ rows }: { rows: RowDef[] }) {
  return (
    <div
      className="rounded-2xl overflow-hidden bg-white/90 border shadow-sm"
      style={{ borderColor: ACCOUNT_BORDER }}>
      {rows.map((row, index) => {
        const Icon = row.icon;
        return (
          <button
            key={row.label}
            type="button"
            onClick={row.onClick}
            className="w-full min-h-[68px] px-5 py-3.5 flex items-center gap-3.5 text-left active:bg-gray-50/80"
            style={{
              borderBottom:
                index === rows.length - 1 ? 'none' : `1px solid ${ACCOUNT_BORDER}`
            }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: ICON_TILE }}>
              <Icon className="w-5 h-5" style={{ color: ACCOUNT_GREEN }} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold leading-tight truncate" style={{ color: ACCOUNT_TEXT }}>
                {row.label}
              </p>
              <p className="text-[13px] mt-0.5 truncate" style={{ color: ACCOUNT_MUTED }}>
                {row.sub}
              </p>
            </div>
            {row.badge &&
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
              style={{ backgroundColor: BADGE_BG, color: BADGE_TEXT }}>
              {row.badge}
            </span>}
            {row.onSwitchChange ?
            <span
              role="switch"
              tabIndex={0}
              aria-checked={Boolean(row.switchChecked)}
              aria-label={`${row.label} ${row.switchChecked ? 'on' : 'off'}`}
              onClick={(event) => {
                event.stopPropagation();
                row.onSwitchChange?.(!row.switchChecked);
              }}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                event.stopPropagation();
                row.onSwitchChange?.(!row.switchChecked);
              }}
              className="w-12 h-7 rounded-full p-0.5 shrink-0 transition-colors flex items-center"
              style={{
                backgroundColor: row.switchChecked ? ACCOUNT_GREEN : '#D1D5DB'
              }}>
              <span
                className="w-6 h-6 rounded-full bg-white shadow-sm transition-transform"
                style={{
                  transform: row.switchChecked ?
                    'translateX(20px)' :
                    'translateX(0)'
                }}
              />
            </span> :
            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

function ticketIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes('hotel')) return Building2;
  if (t.includes('bus') || t.includes('car')) return Bus;
  return Plane;
}

function describeBooking(item: BookingCardItem): string {
  const raw = item.BookCardDiscription ?? '';
  if (item.BookingType === 'Flight') return formatFlightSegments(raw);
  return cleanBookingDescription(raw);
}

function TicketHistorySheet({
  open,
  bookings,
  loading,
  onClose,
  onOpenTrips
}: {
  open: boolean;
  bookings: BookingCardItem[];
  loading: boolean;
  onClose: () => void;
  onOpenTrips: () => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} height="tall">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[20px] font-bold" style={{ color: ACCOUNT_TEXT }}>My Tickets</h3>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {loading &&
      <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: ACCOUNT_GREEN }} />
          <p className="text-[13px]" style={{ color: ACCOUNT_MUTED }}>Loading bookings…</p>
        </div>
      }

      {!loading && bookings.length === 0 &&
      <div className="flex flex-col items-center justify-center py-10 text-center px-2">
        <p className="text-[14px] mb-4" style={{ color: ACCOUNT_MUTED }}>
          No bookings yet. Complete a trip and it will appear here.
        </p>
        <button
          type="button"
          onClick={onOpenTrips}
          className="h-11 px-6 rounded-xl text-[14px] font-bold text-white active:scale-95"
          style={{ backgroundColor: ACCOUNT_GREEN }}>
          Book a trip
        </button>
      </div>
      }

      {!loading && bookings.length > 0 &&
      <div className="space-y-3 pb-2">
          {bookings.map((item) => {
          const Icon = ticketIcon(item.BookingType);
          const isRefunded = item.BookingStatus.toLowerCase().includes('refund');
          const amount = item.BookingAmount || item.InvoiceAmount || '—';
          return (
            <div
              key={item.BookFlightId}
              className="rounded-2xl border bg-white p-4 shadow-sm"
              style={{ borderColor: ACCOUNT_BORDER }}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: ICON_TILE }}>
                    <Icon className="w-5 h-5" style={{ color: ACCOUNT_GREEN }} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[15px] font-bold leading-tight truncate" style={{ color: ACCOUNT_TEXT }}>
                        {item.BookingType === 'Flight' ? 'Flight' : describeBooking(item) || item.BookingType}
                      </p>
                      {item.BookingStatus &&
                    <span
                      className="text-[11px] font-semibold rounded-full px-2.5 py-1 shrink-0"
                      style={{
                        backgroundColor: isRefunded ? STATUS_REFUNDED_BG : STATUS_COMPLETED_BG,
                        color: isRefunded ? STATUS_REFUNDED_TEXT : ACCOUNT_GREEN
                      }}>
                          {item.BookingStatus}
                        </span>
                    }
                    </div>
                    <p className="text-[13px] mt-1 truncate" style={{ color: ACCOUNT_MUTED }}>
                      {item.BookingType === 'Flight' ?
                    describeBooking(item) :
                    `${item.BookingType} booking`}
                    </p>
                    <p className="text-[12px] mt-1" style={{ color: '#9CA3AF' }}>
                      {formatBookedOnLabel(item.BookedOn)} · Ref {item.BookingId}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex items-center justify-between gap-3" style={{ borderColor: ACCOUNT_BORDER }}>
                  <p className="text-[16px] font-bold" style={{ color: ACCOUNT_TEXT }}>{amount}</p>
                  <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] font-semibold"
                  style={{ backgroundColor: ICON_TILE, color: ACCOUNT_GREEN }}>
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>);

        })}
        </div>
      }

      <button
        type="button"
        onClick={onOpenTrips}
        className="mt-4 w-full h-12 rounded-2xl text-white text-[15px] font-bold"
        style={{ backgroundColor: ACCOUNT_GREEN }}>
        Open My Trips
      </button>
    </BottomSheet>
  );
}

function NotificationIconBadge({ type }: { type: NotificationIcon }) {
  const iconClass = 'w-5 h-5';
  const color = ACCOUNT_GREEN;
  switch (type) {
    case 'alert':
      return <AlertTriangle className={iconClass} style={{ color }} strokeWidth={2} />;
    case 'tag':
      return <Tag className={iconClass} style={{ color }} strokeWidth={2} />;
    case 'check':
      return <CheckCircle2 className={iconClass} style={{ color }} strokeWidth={2} />;
    default:
      return <Bell className={iconClass} style={{ color }} strokeWidth={2} />;
  }
}

function NotificationsSheet({
  open,
  notifications,
  unreadCount,
  onClose,
  onMarkAllRead
}: {
  open: boolean;
  notifications: TravelNotification[];
  unreadCount: number;
  onClose: () => void;
  onMarkAllRead: () => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} height="tall">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-[20px] font-bold" style={{ color: ACCOUNT_TEXT }}>Notifications</h3>
        {unreadCount > 0 &&
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-md"
          style={{ backgroundColor: ICON_TILE, color: ACCOUNT_GREEN }}>
          {unreadCount} new
        </span>}
        <div className="flex-1" />
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="border-b pb-3 mb-4" style={{ borderColor: ACCOUNT_BORDER }}>
        <button
          type="button"
          onClick={onMarkAllRead}
          className="text-[14px] font-semibold"
          style={{ color: ACCOUNT_GREEN }}>
          Mark all as read
        </button>
      </div>

      <div className="space-y-3 pb-2">
        {notifications.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border bg-white p-4 shadow-sm"
            style={{ borderColor: ACCOUNT_BORDER }}>
            <div className="flex gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: item.unread ? ICON_TILE : '#F3F4F6' }}>
                <NotificationIconBadge type={item.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold leading-tight" style={{ color: ACCOUNT_TEXT }}>
                    {item.title}
                  </p>
                  {item.unread &&
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ACCOUNT_GREEN }} />}
                </div>
                <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: ACCOUNT_MUTED }}>
                  {item.message}
                </p>
                <p className="text-[12px] mt-2" style={{ color: '#9CA3AF' }}>{item.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}

function SignOutSheet({
  open,
  onClose,
  onConfirm
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} height="short">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[20px] font-bold" style={{ color: ACCOUNT_TEXT }}>Sign Out</h3>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <p className="text-[15px] leading-relaxed mb-5" style={{ color: ACCOUNT_MUTED }}>
        Are you sure you want to sign out of KTA Travel on this device?
      </p>
      <div className="grid grid-cols-2 gap-3 pb-2">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-2xl bg-gray-100 text-[15px] font-bold"
          style={{ color: ACCOUNT_TEXT }}>
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-12 rounded-2xl text-white text-[15px] font-bold"
          style={{ backgroundColor: '#DC3545' }}>
          Sign Out
        </button>
      </div>
    </BottomSheet>
  );
}

function BottomSheet({
  open,
  children,
  onClose,
  height = 'default'
}: {
  open: boolean;
  children: React.ReactNode;
  onClose: () => void;
  height?: 'short' | 'default' | 'tall';
}) {
  return createPortal(
    <AnimatePresence>
      {open &&
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}>
        <button
          type="button"
          className={height === 'short' ? 'flex-1' : 'flex-1 min-h-[48px] shrink-0'}
          aria-label="Close"
          onClick={onClose} />
        <motion.div
          className={`relative w-full ${height === 'short' ? '' : 'max-h-[min(88dvh,720px)] flex flex-col'} overflow-hidden rounded-t-[24px] bg-white shadow-2xl`}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
          <div className={`${height === 'short' ? '' : 'flex-1 min-h-0 overflow-y-auto no-scrollbar'} px-5 pt-4 pb-4`}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
            {children}
          </div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>,
    document.body
  );
}
