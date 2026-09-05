import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Building2,
  Bus,
  Calendar,
  Car,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  Loader2,
  MapPin,
  Moon,
  Phone,
  Plane,
  Users,
  X
} from 'lucide-react';
import { useBookingList } from '../../hooks/useBookingList';
import { useAuth } from '../AuthContext';
import {
  bookingCardViewGet,
  cleanBookingDescription,
  formatFlightSegments,
  formatBookedOnLabel,
  rememberBookingSegment,
  classifyBookingSegment,
  resolveBookingTicketNo,
  displayTicketNo,
  type BookingCardItem,
  type BookingDetailResult,
  type BookingDetailSegment,
  type BookingSegment
} from '../../services/guestApi';
import { downloadBookingReceipt } from '../../utils/bookingReceiptPdf';
import { TravelErrorState } from './TravelErrorState';

const GREEN = '#0D7B3E';
const BORDER = '#E5E7EB';
const TEXT = '#1A1D26';
const MUTED = '#6B7280';
const FAINT = '#9CA3AF';
const ICON_TILE = '#0D7B3E14';

type DetailState = {
  detail: BookingDetailResult | null;
  loading: boolean;
  error: string | null;
};

function bookingIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes('hotel')) return Building2;
  if (t.includes('bus')) return Bus;
  if (t.includes('car') || t.includes('rent')) return Car;
  return Plane;
}

function statusStyle(status: string): { bg: string; color: string } {
  const s = status.toLowerCase();
  if (s.includes('cancel') || s.includes('refund')) {
    return { bg: '#FEF3C7', color: '#B45309' };
  }
  if (s.includes('ticket') || s.includes('confirm')) {
    return { bg: '#0D7B3E1a', color: GREEN };
  }
  if (!s.trim()) return { bg: '#F3F4F6', color: MUTED };
  return { bg: '#EFF6FF', color: '#1D4ED8' };
}

function describeBooking(item: BookingCardItem): string {
  const raw = item.BookCardDiscription ?? '';
  if (item.BookingType === 'Flight') return formatFlightSegments(raw);
  return cleanBookingDescription(raw);
}

function listTicketNo(item: BookingCardItem): string {
  return resolveBookingTicketNo({
    bookingTicketNo: item.TicketNo,
    bookingNumber: item.BookingNumber,
    bookingId: item.BookingId
  });
}

function formatMoney(
  currency: string,
  amount: number | string | null | undefined
): string {
  if (amount == null || amount === '') return '';
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (Number.isFinite(n)) {
    return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const raw = String(amount).trim();
  if (!raw) return '';
  if (/[A-Za-z]/.test(raw)) return raw;
  return `${currency} ${raw}`;
}

function segmentRouteLabel(segments: BookingDetailSegment[]): string {
  if (segments.length === 0) return '';
  const codes: string[] = [];
  for (const seg of segments) {
    if (seg.depAirport && codes[codes.length - 1] !== seg.depAirport) {
      codes.push(seg.depAirport);
    }
    if (seg.arrAirport && codes[codes.length - 1] !== seg.arrAirport) {
      codes.push(seg.arrAirport);
    }
  }
  return codes.join(' → ');
}

export function MyBookings({
  refreshToken = 0,
  active = true,
  segment = 'past',
  onBookTrip
}: {
  refreshToken?: number;
  active?: boolean;
  segment?: BookingSegment;
  onBookTrip?: () => void;
}) {
  const { user, traveller } = useAuth();
  const travellerUserId = user?.userId ?? traveller.session?.userId ?? null;
  const travellerUserTypeId =
    user?.userTypeId ?? traveller.session?.userTypeId ?? null;
  const { bookings, loading, error, reload } = useBookingList({
    enabled: true,
    refreshToken,
    active,
    segment,
    userId: travellerUserId,
    userTypeId: travellerUserTypeId
  });
  const [selected, setSelected] = useState<BookingCardItem | null>(null);
  const isScheduled = segment === 'scheduled';

  return (
    <>
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-1 pb-scroll-safe">
        {loading &&
        <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: GREEN }} />
            <p className="text-[13px]" style={{ color: MUTED }}>Loading your bookings…</p>
          </div>
        }

        {!loading && error &&
        <TravelErrorState
            className="mt-2"
            variant="panel"
            title="Couldn't load bookings"
            message={error}
            onRetry={() => void reload()} />
        }

        {!loading && !error && bookings.length === 0 &&
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-white/70 flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7" style={{ color: FAINT }} />
            </div>
            <p className="text-[16px] font-bold" style={{ color: TEXT }}>
              {isScheduled ? 'No upcoming trips yet' : 'No past bookings yet'}
            </p>
            <p className="text-[13px] mt-1 max-w-[260px]" style={{ color: MUTED }}>
              {isScheduled ?
              'When you book a flight, hotel, or car rental, it will show up here so you can track everything in one place.' :
              'Completed trips will appear here for easy reference and receipts.'}
            </p>
            {isScheduled && onBookTrip &&
            <button
              type="button"
              onClick={onBookTrip}
              className="mt-5 h-12 px-8 rounded-2xl text-white text-[15px] font-bold"
              style={{ backgroundColor: GREEN }}>
                Book a trip
              </button>
            }
          </div>
        }

        {!loading && !error && bookings.length > 0 &&
        <div className="space-y-3 mt-1">
            {bookings.map((item) => {
            const Icon = bookingIcon(item.BookingType);
            const st = statusStyle(item.BookingStatus);
            const amount = item.BookingAmount || item.InvoiceAmount || '';
            return (
              <button
                key={item.BookFlightId}
                type="button"
                onClick={() => setSelected(item)}
                className="w-full rounded-2xl border bg-white/90 p-4 shadow-sm text-left active:scale-[0.99] transition-transform"
                style={{ borderColor: BORDER }}>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: ICON_TILE }}>
                      <Icon className="w-5 h-5" style={{ color: GREEN }} strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[15px] font-bold leading-tight truncate" style={{ color: TEXT }}>
                          {item.BookingType === 'Flight' ? 'Flight' : describeBooking(item) || item.BookingType}
                        </p>
                        {item.BookingStatus &&
                      <span
                        className="text-[11px] font-semibold rounded-full px-2.5 py-1 shrink-0 whitespace-nowrap"
                        style={{ backgroundColor: st.bg, color: st.color }}>
                            {item.BookingStatus}
                          </span>
                      }
                      </div>
                      <p className="text-[13px] mt-1 truncate" style={{ color: MUTED }}>
                        {item.BookingType === 'Flight' ?
                      describeBooking(item) :
                      `${item.BookingType} booking`}
                      </p>
                      <p className="text-[12px] mt-1" style={{ color: FAINT }}>
                        {isScheduled && item.travelStart ?
                      `${item.travelStart}${item.travelEnd && item.travelEnd !== item.travelStart ? ` – ${item.travelEnd}` : ''} · ` :
                      ''}
                        {formatBookedOnLabel(item.BookedOn)} · Ref {item.BookingId}
                      </p>
                    </div>
                  </div>
                  <div
                  className="mt-3.5 pt-3 border-t flex items-center justify-between gap-3"
                  style={{ borderColor: BORDER }}>
                    <p className="text-[16px] font-bold tabular-nums whitespace-nowrap" style={{ color: TEXT }}>
                      {amount || '—'}
                    </p>
                    <span
                    className="inline-flex items-center gap-1 text-[13px] font-semibold"
                    style={{ color: GREEN }}>
                      View details
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </button>);

          })}
          </div>
        }
      </div>

      <BookingDetailSheet
        booking={selected}
        onClose={() => setSelected(null)} />

    </>);

}

function DetailRow({
  label,
  value,
  placeholder


}: {label: string;value?: string | null;placeholder?: string;}) {
  const display = (value ?? '').trim() || placeholder || '';
  if (!display) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-[13px] shrink-0" style={{ color: MUTED }}>{label}</span>
      <span className="text-[13px] font-semibold text-right break-words min-w-0" style={{ color: TEXT }}>
        {display}
      </span>
    </div>);

}

function SectionCard({
  icon: Icon,
  title,
  children



}: {icon: typeof Plane;title: string;children: React.ReactNode;}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: BORDER }}>
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ICON_TILE }}>
          <Icon className="w-4 h-4" style={{ color: GREEN }} strokeWidth={2} />
        </div>
        <p className="text-[14px] font-bold" style={{ color: TEXT }}>{title}</p>
      </div>
      {children}
    </div>);

}

function BookingDetailSheet({
  booking,
  onClose


}: {booking: BookingCardItem | null;onClose: () => void;}) {
  const [state, setState] = useState<DetailState>({
    detail: null,
    loading: false,
    error: null
  });

  useEffect(() => {
    if (!booking) {
      setState({ detail: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ detail: null, loading: true, error: null });
    bookingCardViewGet(booking.BookFlightId)
      .then((detail) => {
        if (cancelled) return;
        const segment = classifyBookingSegment(
          booking,
          detail.travelStart,
          detail.travelEnd
        );
        rememberBookingSegment(
          booking.BookFlightId,
          segment,
          detail.travelStart,
          detail.travelEnd
        );
        setState({ detail, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          detail: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load booking details'
        });
      });
    return () => {
      cancelled = true;
    };
  }, [booking]);

  const detail = state.detail;
  const summary = detail?.summary;
  const bookingType = summary?.bookingType || booking?.BookingType || '';
  const Icon = booking ? bookingIcon(bookingType) : Plane;
  // Prefer BookingStatus (e.g. TicketIssued) — ConfirmStatus is a separate field ("Confirmed").
  const statusLabel =
    summary?.bookingStatus ||
    booking?.BookingStatus ||
    summary?.confirmStatus ||
    '';
  const st = statusStyle(statusLabel);
  const ticketDisplay = displayTicketNo(
    summary?.ticketNo ?? (booking ? listTicketNo(booking) : '')
  );
  const routeLabel =
    detail?.segments?.length ?
    segmentRouteLabel(detail.segments) :
    booking ?
    describeBooking(booking) :
    '';

  return createPortal(
    <AnimatePresence>
      {booking &&
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}>
          <button type="button" className="flex-1 min-h-[48px] shrink-0" aria-label="Close" onClick={onClose} />
          <motion.div
          className="relative w-full max-h-[min(88dvh,720px)] flex flex-col rounded-t-[24px] bg-[#F7F8FA] shadow-2xl overflow-hidden"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}>

            <div className="shrink-0 bg-white px-5 pt-4 pb-4 border-b" style={{ borderColor: BORDER }}>
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: ICON_TILE }}>
                  <Icon className="w-5 h-5" style={{ color: GREEN }} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] font-bold leading-tight truncate" style={{ color: TEXT }}>
                    {bookingType} booking
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: FAINT }}>
                    Ref {summary?.bookingId || booking.BookingId}
                  </p>
                </div>
                {statusLabel &&
              <span
                className="text-[11px] font-semibold rounded-full px-2.5 py-1 shrink-0"
                style={{ backgroundColor: st.bg, color: st.color }}>
                    {statusLabel}
                  </span>
              }
                <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-3">
              {state.loading &&
            <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin" style={{ color: GREEN }} />
                  <p className="text-[13px]" style={{ color: MUTED }}>Loading details…</p>
                </div>
            }

              {!state.loading && state.error &&
            <TravelErrorState
                  variant="panel"
                  title="Couldn't load booking details"
                  message={state.error} />
            }

              {!state.loading && !state.error &&
            <>
                  <SectionCard icon={FileText} title="Overview">
                    <DetailRow label="Due date" value={summary?.dueDate} />
                    <DetailRow label="Payment" value={summary?.paidStatus || summary?.payStatus} />
                    <DetailRow label="Trip type" value={summary?.tripType} />
                    <DetailRow
                  label={bookingType.toLowerCase().includes('hotel') ? 'Stay dates' : 'Travel dates'}
                  value={
                  detail?.travelStart ?
                  detail.travelEnd && detail.travelEnd !== detail.travelStart ?
                  `${detail.travelStart} – ${detail.travelEnd}` :
                  detail.travelStart :
                  undefined
                  } />
                  
                    <DetailRow
                  label="Amount"
                  value={
                  summary?.totalAmount ||
                  (
                  detail?.fare ?
                  formatMoney(detail.fare.currency, detail.fare.grandTotal) :
                  undefined) ||
                  booking.BookingAmount ||
                  booking.InvoiceAmount ||
                  undefined
                  } />
                  
                  </SectionCard>

                  {(routeLabel || (detail?.segments?.length ?? 0) > 0) &&
              <SectionCard
                icon={bookingIcon(bookingType)}
                title={bookingType.toLowerCase().includes('flight') ? 'Route' : 'Details'}>
                      {routeLabel &&
                <p className="text-[15px] font-bold mb-2" style={{ color: TEXT }}>
                          {routeLabel}
                        </p>
                }
                      {detail?.segments?.map((seg, i) =>
                <div
                  key={`${seg.flightNumber}-${i}`}
                  className="rounded-xl p-3 mb-2 last:mb-0"
                  style={{ backgroundColor: '#F3F4F6' }}>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-[13px] font-bold" style={{ color: TEXT }}>
                              {[seg.airline, seg.flightNumber].filter(Boolean).join(' ')}
                              {seg.flightLeg ? ` · ${seg.flightLeg}` : ''}
                            </p>
                            {seg.className &&
                    <span className="text-[11px] font-semibold" style={{ color: MUTED }}>
                                {seg.className}
                              </span>
                    }
                          </div>
                          <p className="text-[13px] font-semibold" style={{ color: TEXT }}>
                            {seg.depAirport || '—'} → {seg.arrAirport || '—'}
                          </p>
                          <p className="text-[12px] mt-1" style={{ color: MUTED }}>
                            {[
                    [seg.depDate, seg.depTime].filter(Boolean).join(' '),
                    [seg.arrDate, seg.arrTime].filter(Boolean).join(' ')].
                    filter(Boolean).join(' → ')}
                            {seg.duration ? ` · ${seg.duration}` : ''}
                            {seg.stops > 0 ? ` · ${seg.stops} stop${seg.stops === 1 ? '' : 's'}` : ''}
                          </p>
                          {seg.equipment &&
                  <p className="text-[11px] mt-1" style={{ color: FAINT }}>
                            Aircraft {seg.equipment}
                          </p>
                  }
                        </div>
                )}
                    </SectionCard>
              }

                  <SectionCard icon={FileText} title="Ticket">
                    <DetailRow
                  label="Booking number"
                  value={summary?.bookingNumber || booking.BookingNumber} />
                    
                    <DetailRow label="Ticket no." value={ticketDisplay} />
                    <DetailRow
                  label="PNR"
                  value={summary?.pnr || undefined} />
                    
                    <DetailRow
                  label="Booked on"
                  value={summary?.bookedOn || formatBookedOnLabel(booking.BookedOn)} />
                    
                    <DetailRow label="Status" value={summary?.bookingStatus || booking.BookingStatus} />
                    <DetailRow label="Confirm status" value={summary?.confirmStatus} />
                    {detail?.policy?.isRefundable &&
                <DetailRow label="Refundable" value={detail.policy.isRefundable} />
                }
                  </SectionCard>

                  {detail?.hotel &&
              <SectionCard icon={Building2} title={detail.hotel.hotelName || 'Hotel'}>
                      {detail.hotel.address &&
                <p className="text-[12px] flex items-center gap-1.5 mb-2" style={{ color: MUTED }}>
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {detail.hotel.address}
                        </p>
                }
                      <div className="grid grid-cols-2 gap-2.5 mb-2">
                        <div className="rounded-xl p-3" style={{ backgroundColor: '#F3F4F6' }}>
                          <p className="text-[11px]" style={{ color: MUTED }}>Check-in</p>
                          <p className="text-[13px] font-bold mt-0.5" style={{ color: TEXT }}>
                            {detail.hotel.checkIn || '—'}
                          </p>
                        </div>
                        <div className="rounded-xl p-3" style={{ backgroundColor: '#F3F4F6' }}>
                          <p className="text-[11px]" style={{ color: MUTED }}>Check-out</p>
                          <p className="text-[13px] font-bold mt-0.5" style={{ color: TEXT }}>
                            {detail.hotel.checkOut || '—'}
                          </p>
                        </div>
                      </div>
                      <DetailRow label="Room" value={detail.hotel.roomType} />
                      <DetailRow label="Status" value={detail.hotel.status} />
                      <div className="flex flex-wrap items-center gap-4 mt-1">
                        {detail.hotel.nights > 0 &&
                  <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: MUTED }}>
                            <Moon className="w-3.5 h-3.5" />
                            {detail.hotel.nights} night{detail.hotel.nights === 1 ? '' : 's'}
                          </span>
                  }
                        {detail.hotel.guests &&
                  <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: MUTED }}>
                            <Users className="w-3.5 h-3.5" />
                            {detail.hotel.guests}
                          </span>
                  }
                        {detail.hotel.phone &&
                  <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: MUTED }}>
                            <Phone className="w-3.5 h-3.5" />
                            {detail.hotel.phone}
                          </span>
                  }
                      </div>
                    </SectionCard>
              }

                  {detail && detail.passengers.length > 0 &&
              <SectionCard icon={Users} title={`Traveller${detail.passengers.length === 1 ? '' : 's'}`}>
                      <div className="space-y-2.5">
                        {detail.passengers.map((p, i) =>
                <div
                  key={`${p.name}-${i}`}
                  className="rounded-xl p-3"
                  style={{ backgroundColor: '#F3F4F6' }}>
                            <div className="flex items-center gap-3">
                              <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                      style={{ backgroundColor: GREEN }}>
                                {(p.name || '?').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[14px] font-bold truncate" style={{ color: TEXT }}>
                                  {p.name || `Traveller ${i + 1}`}
                                </p>
                                <p className="text-[12px] truncate" style={{ color: MUTED }}>
                                  {[p.type, p.phone, p.email].filter(Boolean).join(' · ')}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 pl-12 space-y-0.5">
                              {p.identityNo && <DetailRow label="ID" value={p.identityNo} />}
                              {p.dob && <DetailRow label="DOB" value={p.dob} />}
                            </div>
                          </div>
                )}
                      </div>
                    </SectionCard>
              }

                  {detail?.fare &&
              <SectionCard icon={CreditCard} title="Fare breakdown">
                      <DetailRow
                  label="Base fare"
                  value={formatMoney(detail.fare.currency, detail.fare.baseFare)} />
                      
                      {detail.fare.taxAmount > 0 &&
                <DetailRow
                  label="Tax"
                  value={formatMoney(detail.fare.currency, detail.fare.taxAmount)} />

                }
                      {(detail.fare.gstAmount ?? 0) > 0 &&
                <DetailRow
                  label="GST"
                  value={formatMoney(detail.fare.currency, detail.fare.gstAmount)} />

                }
                      {detail.fare.serviceTaxAmount > 0 &&
                <DetailRow
                  label="Service tax"
                  value={formatMoney(detail.fare.currency, detail.fare.serviceTaxAmount)} />

                }
                      {Number(detail.fare.discountAmount) > 0 &&
                <DetailRow
                  label="Discount"
                  value={formatMoney(detail.fare.currency, detail.fare.discountAmount)} />

                }
                      <div
                  className="flex items-center justify-between pt-3 mt-1 border-t"
                  style={{ borderColor: BORDER }}>
                        <span className="text-[14px] font-bold" style={{ color: TEXT }}>Grand total</span>
                        <span className="text-[17px] font-extrabold" style={{ color: GREEN }}>
                          {formatMoney(detail.fare.currency, detail.fare.grandTotal)}
                        </span>
                      </div>
                    </SectionCard>
              }

                  {detail && detail.payments.length > 0 &&
              <SectionCard icon={CheckCircle2} title="Payment">
                      {detail.payments.map((p, i) =>
                <div key={i} className="rounded-xl p-3 mb-2 last:mb-0" style={{ backgroundColor: '#F3F4F6' }}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold" style={{ color: TEXT }}>{p.mode || 'Payment'}</p>
                              <p className="text-[12px]" style={{ color: FAINT }}>
                                {[p.receiptNo, p.status].filter(Boolean).join(' · ')}
                              </p>
                              {p.transactionDate &&
                      <p className="text-[11px] mt-0.5" style={{ color: FAINT }}>
                                {p.transactionDate.replace('T', ' ').slice(0, 19)}
                              </p>
                      }
                            </div>
                            <p className="text-[14px] font-bold shrink-0" style={{ color: TEXT }}>
                              {formatMoney(p.currency, p.amount)}
                            </p>
                          </div>
                        </div>
                )}
                      {detail.balance &&
                <>
                          {(detail.balance.paidAmount ?? 0) > 0 &&
                  <DetailRow
                    label="Paid"
                    value={formatMoney(detail.balance.currency, detail.balance.paidAmount)} />

                  }
                          {detail.balance.balanceAmount > 0 &&
                  <div
                    className="flex items-center justify-between pt-3 mt-1 border-t"
                    style={{ borderColor: BORDER }}>
                              <span className="text-[13px]" style={{ color: MUTED }}>Balance due</span>
                              <span className="text-[14px] font-bold" style={{ color: '#B45309' }}>
                                {formatMoney(detail.balance.currency, detail.balance.balanceAmount)}
                              </span>
                            </div>
                  }
                        </>
                }
                    </SectionCard>
              }

                  {detail?.corporate &&
              <SectionCard icon={Building2} title="Issued by">
                      <DetailRow label="Agency" value={detail.corporate.name} />
                      <DetailRow label="Phone" value={detail.corporate.phone} />
                      <DetailRow label="Email" value={detail.corporate.email} />
                      <DetailRow label="Address" value={detail.corporate.address} />
                    </SectionCard>
              }

                  {detail?.policy && (detail.policy.cancellationPolicy || detail.policy.cancellationConditions) &&
              <SectionCard icon={AlertCircle} title="Cancellation policy">
                      {detail.policy.deadline &&
                <DetailRow label="Deadline" value={detail.policy.deadline} />
                }
                      <p className="text-[12px] leading-relaxed mt-1" style={{ color: MUTED }}>
                          {detail.policy.cancellationPolicy || detail.policy.cancellationConditions}
                        </p>
                    </SectionCard>
              }
            </>
            }
            </div>

            {!state.loading && !state.error && detail &&
            <div className="shrink-0 bg-white border-t px-5 pt-3 pb-4" style={{ borderColor: BORDER }}>
              <button
                type="button"
                onClick={() => downloadBookingReceipt(detail, booking.BookingId)}
                className="w-full h-12 rounded-2xl text-white text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
                style={{ backgroundColor: GREEN }}>
                <Download className="w-5 h-5" />
                Download receipt
              </button>
              <p className="text-center text-[11px] mt-2" style={{ color: FAINT }}>
                Saves a PDF receipt to your Downloads folder
              </p>
            </div>
            }
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>,
    document.body
  );

}
