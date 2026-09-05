import {
  BadgeCheck,
  Calendar,
  ChevronRight,
  HeartHandshake,
  Play,
  ShieldCheck
} from 'lucide-react';
import { KTA, cur } from './ethioTravelData';
import type { TourActivity } from '../../services/guestApi';
import { HolidayCheckoutShell, HOLIDAY_CHECKOUT_PAD } from './HolidayCheckoutShell';
import { HOLIDAY_BOOKING_FEE } from './holidayCheckoutUtils';
import { TourListCardImage } from './TourImages';

export function HolidayReviewPay({
  tour,
  tourName,
  location,
  ticketName,
  travellerName,
  departureLabel,
  meetingPoint,
  ticketPrice,
  currency,
  storyImage,
  onChoosePayment
}: {
  tour: TourActivity;
  tourName: string;
  location: string;
  ticketName: string;
  travellerName: string;
  departureLabel: string;
  meetingPoint: string;
  ticketPrice: number;
  currency: string;
  storyImage?: string | null;
  onChoosePayment: () => void;
}) {
  const uiCurrency =
    String(currency || 'ETB')
      .trim()
      .toUpperCase() || 'ETB';
  const total = ticketPrice + HOLIDAY_BOOKING_FEE;
  const gallery = tour.images?.length ? tour.images : tour.image ? [tour.image] : [];

  return (
    <HolidayCheckoutShell
      tourName={tourName}
      stepLabel="Review & pay"
      progressFilled={3}>
      <div className={`${HOLIDAY_CHECKOUT_PAD} space-y-3.5 pb-4`}>
        <div>
          <h3 className="text-[22px] font-bold text-slate-900 leading-tight">
            Review and pay
          </h3>
          <p className="text-[13px] text-slate-500 mt-1.5">
            Your tickets are confirmed immediately after payment.
          </p>
        </div>

        <div className="rounded-[16px] bg-white border border-slate-100 overflow-hidden shadow-ios-sm">
          <div className="p-3.5 flex gap-3">
            <div className="w-14 h-14 rounded-[12px] overflow-hidden bg-slate-100 shrink-0">
              {gallery.length > 0 ?
              <TourListCardImage
                images={gallery}
                alt={tourName}
                code={tour.code || tour.id}
                destination={location} /> :
              null}
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-slate-900 leading-tight">
                {tourName}
              </p>
              <p className="text-[13px] text-slate-500 mt-1">{location}</p>
              <p className="text-[13px] text-slate-500 mt-1">
                {travellerName} · {ticketName}
              </p>
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="rounded-[14px] bg-emerald-50 px-3 py-2.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
              <p className="text-[13px] font-semibold text-slate-800">
                {departureLabel} · 07:00 · {meetingPoint}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-[16px] bg-white border border-slate-100 p-3 flex items-center gap-3 shadow-ios-sm text-left">
          <div className="w-14 h-14 rounded-[12px] overflow-hidden bg-slate-200 shrink-0 relative">
            {storyImage ?
            <img src={storyImage} alt="" className="w-full h-full object-cover" /> :
            null}
            <span className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Play className="w-5 h-5 text-white" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-slate-900">
              Your local story is saved
            </p>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Revisit the guide preview before you confirm.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </button>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: BadgeCheck, label: 'Instant ticket' },
            { icon: ShieldCheck, label: 'Secure payment' },
            { icon: HeartHandshake, label: 'Local host' }
          ].map((item) =>
            <div
              key={item.label}
              className="rounded-[14px] bg-white border border-slate-100 p-2.5 text-center shadow-ios-sm">
              <item.icon className="w-5 h-5 text-emerald-700 mx-auto mb-2" />
              <p className="text-[11px] font-semibold text-slate-700 leading-snug">
                {item.label}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[16px] bg-white border border-slate-100 p-3.5 shadow-ios-sm">
          <p className="text-[16px] font-bold text-slate-900 mb-3">Price details</p>
          <div className="space-y-2 text-[14px]">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">{ticketName}</span>
              <span className="font-semibold text-slate-900">
                {cur(ticketPrice, uiCurrency)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Booking service fee</span>
              <span className="font-semibold text-slate-900">
                {cur(HOLIDAY_BOOKING_FEE, uiCurrency)}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[15px] font-bold text-slate-900">Total amount</span>
            <span
              className="text-[22px] font-bold"
              style={{ color: KTA.green }}>
              {cur(total, uiCurrency)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onChoosePayment}
          className="w-full rounded-[16px] bg-white border border-slate-100 p-3.5 flex items-center justify-between shadow-ios-sm">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </span>
            <div className="text-left">
              <p className="text-[12px] text-slate-500">Pay with</p>
              <p className="text-[15px] font-bold text-slate-900">
                Choose a payment source
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </div>
    </HolidayCheckoutShell>
  );
}
