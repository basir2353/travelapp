import { Check, ShieldCheck } from 'lucide-react';
import { KTA, cur } from './ethioTravelData';
import type { TourModality } from '../../services/guestApi';
import { HolidayCheckoutShell, HOLIDAY_CHECKOUT_PAD } from './HolidayCheckoutShell';
import {
  buildHolidayTicketOptions,
  ticketOptionDescription
} from './holidayCheckoutUtils';

export function HolidayChooseTickets({
  tourName,
  departureLabel,
  spotsLabel,
  basePrice,
  currency,
  modalities,
  selected,
  onSelect
}: {
  tourName: string;
  departureLabel: string;
  spotsLabel: string;
  basePrice: number;
  currency: string;
  modalities: TourModality[];
  selected: TourModality | null;
  onSelect: (option: TourModality) => void;
  onContinue?: () => void;
}) {
  const options = buildHolidayTicketOptions(modalities, basePrice);
  const active = selected ?? options[0] ?? null;
  const uiCurrency =
    String(currency || 'ETB')
      .trim()
      .toUpperCase() || 'ETB';

  return (
    <HolidayCheckoutShell
      tourName={tourName}
      stepLabel="Tickets"
      progressFilled={2}>
      <div className={`${HOLIDAY_CHECKOUT_PAD} space-y-3.5 pb-4`}>
        <div>
          <h3 className="text-[22px] font-bold text-slate-900 leading-tight">
            Choose your tickets
          </h3>
          <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
            Choose one ticket for {departureLabel.toLowerCase()} · {spotsLabel}.
          </p>
        </div>

        <div className="space-y-3">
          {options.map((option) => {
            const isActive = active?.id === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option)}
                className={`w-full text-left rounded-[16px] border-2 p-3.5 transition-colors bg-white ${
                  isActive ? 'border-emerald-600' : 'border-slate-200'
                }`}>
                <div className="flex items-start gap-3">
                  <span
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      isActive ?
                        'border-emerald-600 bg-emerald-600' :
                        'border-slate-300 bg-white'
                    }`}>
                    {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[16px] font-bold text-slate-900">
                        {option.name}
                      </p>
                      <p
                        className="text-[16px] font-bold shrink-0"
                        style={{ color: KTA.green }}>
                        {cur(option.rate, uiCurrency)}
                      </p>
                    </div>
                    <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                      {ticketOptionDescription(option.name)}
                    </p>
                    {isActive &&
                    <span className="inline-flex mt-3 px-2.5 py-1 rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700">
                        Selected ticket
                      </span>
                    }
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-[16px] bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <p className="text-[13px] text-slate-700 leading-relaxed">
            Free cancellation up to 72 hours before departure.
          </p>
        </div>
      </div>
    </HolidayCheckoutShell>
  );
}
