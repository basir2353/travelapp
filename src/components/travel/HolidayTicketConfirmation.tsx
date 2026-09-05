import { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  MessageSquare,
  Printer,
  Send,
  Share2,
  X
} from 'lucide-react';
import { KTA, cur } from './ethioTravelData';
import { HOLIDAY_CHECKOUT_PAD } from './HolidayCheckoutShell';

const TICKET_ACTIONS = [
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'pdf', label: 'PDF', icon: Download },
  { id: 'email', label: 'Email', icon: Send },
  { id: 'share', label: 'Share', icon: Share2 },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'invoice', label: 'Invoice', icon: FileText },
  { id: 'print', label: 'Print', icon: Printer }
] as const;

export function HolidayTicketConfirmation({
  tourName,
  subtitle,
  total,
  currency,
  paymentLabel,
  bookingReference,
  travellerName,
  destination,
  travelFrom,
  travelTo,
  packageName,
  adults,
  email,
  statusLabel = 'Confirmed',
  confirmationDetails,
  onAction
}: {
  tourName: string;
  subtitle: string;
  total: number;
  currency: string;
  paymentLabel: string;
  bookingReference: string;
  travellerName: string;
  destination: string;
  travelFrom: string;
  travelTo: string;
  packageName: string;
  adults: number;
  email?: string;
  statusLabel?: string;
  /** Extra rows shown on the main confirmation card (e.g. seats, boarding). */
  confirmationDetails?: Array<[string, string]>;
  onAction: (
  action: typeof TICKET_ACTIONS[number]['id'] | 'support'
  ) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const uiCurrency = currency || 'ETB';
  const detailRows: Array<[string, string]> = [
    ['Reference', bookingReference],
    ['Status', statusLabel],
    ['Traveller', travellerName],
    ['Destination', destination],
    ['Travel from', travelFrom],
    ['Travel to', travelTo],
    ['Package', packageName],
    ['Adults', String(adults)],
    ['Email', email || '—'],
    ...(confirmationDetails || [])
  ];

  return (
    <div className={`${HOLIDAY_CHECKOUT_PAD} pt-2 pb-28`}>
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 mb-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
            Booking {statusLabel}
          </span>
        </div>
        <h2 className="text-[18px] font-bold text-slate-900 leading-tight truncate">
          {tourName}
        </h2>
        <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>
      </div>

      <div className="rounded-[16px] bg-white border border-slate-100 shadow-ios-sm p-3.5 mb-3">
        <div className="mb-3 pb-3 border-b border-slate-100">
          <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
            Booking reference
          </p>
          <p className="text-[18px] font-bold text-slate-900 mt-0.5 tracking-wide">
            {bookingReference || 'PENDING'}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
              Total paid
            </p>
            <p className="text-[16px] font-bold text-slate-900 mt-0.5">
              {cur(total, uiCurrency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
              Payment
            </p>
            <p className="text-[16px] font-bold text-slate-900 mt-0.5 uppercase">
              {paymentLabel}
            </p>
          </div>
        </div>
      </div>

      {(confirmationDetails?.length || 0) > 0 &&
      <div className="rounded-[16px] bg-white border border-slate-100 shadow-ios-sm p-3.5 mb-4">
          <p className="text-[13px] font-bold text-slate-900 mb-2.5">
            Confirmation details
          </p>
          <div className="space-y-2 text-[12px]">
            {confirmationDetails!.map(([label, value]) =>
              <div key={label} className="flex justify-between gap-3">
                <span className="text-slate-500 shrink-0">{label}</span>
                <span className="font-semibold text-slate-900 text-right">
                  {value}
                </span>
              </div>
            )}
          </div>
        </div>
      }

      <p className="text-[13px] font-bold text-slate-900 mb-2.5">Ticket Options</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {TICKET_ACTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onAction(opt.id)}
              className="flex flex-col items-center justify-center gap-1 bg-white rounded-[12px] border border-slate-100 p-2.5 shadow-ios-sm active:scale-[0.98] transition-transform min-h-[68px]">
              <Icon className="w-[18px] h-[18px] text-emerald-700" strokeWidth={2} />
              <span className="text-[10px] font-semibold text-slate-500">{opt.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onAction('pdf')}
          className="w-full h-10 rounded-[12px] text-white font-bold text-[13px] flex items-center justify-center gap-2"
          style={{ backgroundColor: '#14532d' }}>
          <Download className="w-4 h-4" />
          View Ticket (PDF)
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="h-9 rounded-[10px] font-bold text-[12px] flex items-center justify-center gap-1.5 border bg-white text-slate-800"
            style={{ borderColor: KTA.border }}>
            <Eye className="w-3.5 h-3.5" />
            View Details
          </button>
          <button
            type="button"
            onClick={() => onAction('support')}
            className="h-9 rounded-[10px] font-bold text-[12px] flex items-center justify-center gap-1.5 border bg-white text-slate-800"
            style={{ borderColor: KTA.border }}>
            <MessageSquare className="w-3.5 h-3.5" />
            Support
          </button>
        </div>
      </div>

      {showDetails &&
      <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[20px] overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-[16px] font-bold text-slate-900">Booking details</p>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-[13px] max-h-[60vh] overflow-y-auto">
              {detailRows.map(([label, value]) =>
                <div key={label} className="flex justify-between gap-3">
                  <span className="text-slate-500 shrink-0">{label}</span>
                  <span className="font-semibold text-slate-900 text-right">{value}</span>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowDetails(false);
                  onAction('preview');
                }}
                className="w-full h-10 rounded-xl text-white font-bold text-[13px]"
                style={{ backgroundColor: KTA.green }}>
                Preview voucher
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  );
}
