import type { ReactNode } from 'react';
import { Ticket } from 'lucide-react';
import { KTA } from './ethioTravelData';

export const HOLIDAY_CHECKOUT_PAD = 'px-4 sm:px-5 max-w-lg mx-auto w-full min-w-0';

export function HolidayCheckoutShell({
  tourName,
  stepLabel,
  progressFilled,
  children
}: {
  tourName: string;
  stepLabel: string;
  progressFilled: number;
  children: ReactNode;
}) {
  return (
    <div className="bg-[#f4f6f8]">
      <div className={`${HOLIDAY_CHECKOUT_PAD} pt-3 pb-3`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className="text-[10px] font-bold tracking-[0.14em] uppercase"
              style={{ color: KTA.green }}>
              MKASH TRAVEL
            </p>
            <h2 className="text-[18px] font-bold leading-tight text-slate-900 truncate">
              {tourName}
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">{stepLabel}</p>
          </div>
          <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Ticket className="w-4 h-4 text-emerald-700" />
          </span>
        </div>

        <div className="flex gap-1.5 mt-3">
          {[0, 1, 2, 3].map((index) =>
            <span
              key={index}
              className="h-1 flex-1 rounded-full"
              style={{
                backgroundColor: index < progressFilled ? KTA.green : '#d9e2ec'
              }} />
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
