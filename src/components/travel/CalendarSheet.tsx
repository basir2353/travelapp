import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export function toCalendarInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseCalendarValue(v?: string): Date | null {
  if (!v) return null;
  const [y, m, d] = v.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function formatCalendarDateLabel(
  value: string,
  placeholder = 'Select date'
): string {
  const d = parseCalendarValue(value);
  if (!d) return placeholder;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function CalendarSheet({
  open,
  title,
  value,
  min,
  max,
  onSelect,
  onClose
}: {
  open: boolean;
  title: string;
  value: string;
  min?: string;
  max?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Date | null>(null);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [yearPageStart, setYearPageStart] = useState(new Date().getFullYear());
  useEffect(() => {
    if (!open) return;
    const parsed = parseCalendarValue(value);
    const maxD = parseCalendarValue(max);
    const minD = parseCalendarValue(min);
    // Empty DOB / check-out: open near a sensible year, not year 1700 / raw today.
    let fallback = new Date();
    if (maxD) {
      fallback = new Date(maxD);
      // Birth dates: jump ~25 years back from max; travel dates keep max month.
      if (maxD.getFullYear() <= new Date().getFullYear()) {
        fallback.setFullYear(fallback.getFullYear() - 25);
      }
      if (minD && fallback.getTime() < minD.getTime()) fallback = new Date(minD);
    } else if (minD) {
      fallback = new Date(minD);
    }
    const base = parsed ?? fallback;
    setSelected(parsed);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setYearPageStart(base.getFullYear());
    setShowYearPicker(false);
  }, [open, value, min, max]);
  const minDate = parseCalendarValue(min);
  const maxDate = parseCalendarValue(max);
  const minTime = minDate ? minDate.getTime() : null;
  const maxTime = maxDate ? maxDate.getTime() : null;
  const todayValue = toCalendarInputValue(new Date());
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(viewYear, viewMonth, i + 1)
    )
  ];

  const monthTitle = firstOfMonth.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric'
  });
  const prevDisabled =
    minDate !== null &&
    new Date(viewYear, viewMonth, 1).getTime() <=
      new Date(minDate.getFullYear(), minDate.getMonth(), 1).getTime();
  const nextDisabled =
    maxDate !== null &&
    new Date(viewYear, viewMonth + 1, 0).getTime() >=
      new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0).getTime();
  const goMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };
  const minYear = minDate ?
    minDate.getFullYear() :
    new Date().getFullYear() - 100;
  const maxYear = maxDate ?
    maxDate.getFullYear() :
    new Date().getFullYear() + 11;
  const yearOptions = Array.from({ length: 12 }, (_, i) => yearPageStart + i);
  const yearPagePrevDisabled = yearPageStart <= 1900;
  const yearPageNextDisabled = yearPageStart + 11 >= maxYear;
  const openYearPicker = () => {
    setYearPageStart(viewYear);
    setShowYearPicker(true);
  };
  const goYearPage = (delta: number) => {
    setYearPageStart((prev) => {
      const next = prev + delta * 12;
      return Math.max(1900, Math.min(maxYear - 11, next));
    });
  };
  const pickYear = (year: number) => {
    if (year < minYear || year > maxYear) return;
    setViewYear(year);
    if (
      minDate &&
      year === minDate.getFullYear() &&
      viewMonth < minDate.getMonth()
    ) {
      setViewMonth(minDate.getMonth());
    }
    if (
      maxDate &&
      year === maxDate.getFullYear() &&
      viewMonth > maxDate.getMonth()
    ) {
      setViewMonth(maxDate.getMonth());
    }
    setShowYearPicker(false);
  };
  const applyLabel = selected ?
    selected.
      toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }).
      replace(',', '') :
    'Select a date';
  // Portal out of Travel's overflow-hidden so Apply isn't clipped behind the tab bar
  return createPortal(
    <AnimatePresence>
      {open &&
      <>
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-black/25" />
        
          <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-0 left-0 right-0 z-[81] flex max-h-[min(92dvh,920px)] flex-col overflow-hidden rounded-t-ios-xl glass-sheet">
          
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-9 h-1 rounded-full bg-gray-300/80" />
            </div>
            <div className="flex items-center justify-between px-5 py-2 shrink-0">
              <h2 className="text-[17px] font-bold text-text-primary">{title}</h2>
              <button
              type="button"
              onClick={onClose}
              aria-label="Close calendar"
              className="w-9 h-9 rounded-full glass-btn-ghost flex items-center justify-center">
              
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2">
              <div className="rounded-2xl border border-teal-200/60 bg-teal-50/40 backdrop-blur-md px-3 py-3 shadow-inner min-w-0 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <button
                  type="button"
                  onClick={() =>
                  showYearPicker ? goYearPage(-1) : goMonth(-1)
                  }
                  disabled={
                  showYearPicker ? yearPagePrevDisabled : prevDisabled
                  }
                  aria-label={showYearPicker ? 'Previous years' : 'Previous month'}
                  className="ui-stepper-btn bg-white/80 backdrop-blur border border-teal-200 text-teal-700 shadow-sm disabled:opacity-30">
                  
                    <ChevronLeft className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  </button>
                  <button
                  type="button"
                  onClick={() =>
                  showYearPicker ?
                  setShowYearPicker(false) :
                  openYearPicker()
                  }
                  aria-label={showYearPicker ? 'Back to calendar' : 'Select year'}
                  className="px-3 py-1 rounded-full text-[15px] font-bold text-gray-800 hover:bg-white/70 transition-colors touch-manipulation">
                  
                    {showYearPicker ? viewYear : monthTitle}
                  </button>
                  <button
                  type="button"
                  onClick={() =>
                  showYearPicker ? goYearPage(1) : goMonth(1)
                  }
                  disabled={showYearPicker ? yearPageNextDisabled : nextDisabled}
                  aria-label={showYearPicker ? 'Next years' : 'Next month'}
                  className="ui-stepper-btn bg-white/80 backdrop-blur border border-teal-200 text-teal-700 shadow-sm disabled:opacity-30">
                  
                    <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  </button>
                </div>
                {showYearPicker ?
              <div className="grid grid-cols-3 gap-2 py-1">
                  {yearOptions.map((year) => {
                  const disabled = year < minYear || year > maxYear;
                  const isActive = year === viewYear;
                  return (
                    <button
                      key={year}
                      type="button"
                      disabled={disabled}
                      onClick={() => pickYear(year)}
                      aria-label={`Select year ${year}`}
                      className={`h-10 rounded-full flex items-center justify-center text-[14px] font-semibold touch-manipulation transition-colors ${
                      isActive ?
                      'bg-teal-600 text-white shadow-lg shadow-teal-600/35' :
                      disabled ?
                      'text-gray-300' :
                      'text-gray-800 hover:bg-white/70'}`
                      }>
                      
                        {year}
                      </button>);

                })}
                </div> :

              <>
                <div className="grid grid-cols-7 mb-1">
                  {WEEKDAY_LABELS.map((d) =>
                <p
                  key={d}
                  className="text-center text-[11px] font-semibold text-gray-500 py-1">
                  
                      {d}
                    </p>
                )}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {cells.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} />;
                  const dateValue = toCalendarInputValue(date);
                  const disabled =
                  (minTime !== null && date.getTime() < minTime) ||
                  (maxTime !== null && date.getTime() > maxTime);
                  const isSelected =
                  selected !== null &&
                  toCalendarInputValue(selected) === dateValue;
                  const isToday = dateValue === todayValue;
                  return (
                    <button
                      key={dateValue}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelected(date)}
                      aria-label={`Select ${dateValue}`}
                      className={`h-10 w-10 mx-auto rounded-full flex items-center justify-center text-[14px] font-semibold touch-manipulation transition-colors ${
                      isSelected ?
                      'bg-teal-600 text-white shadow-lg shadow-teal-600/35' :
                      disabled ?
                      'text-gray-300' :
                      isToday ?
                      'text-teal-700 border border-teal-300 bg-white/70' :
                      'text-gray-800 hover:bg-white/70'}`
                      }>
                      
                        {date.getDate()}
                      </button>);

                })}
                </div>
                </>
              }
              </div>
            </div>
            <div className="shrink-0 border-t border-teal-100/70 bg-white/90 px-5 pt-3 pb-safe">
              <button
              type="button"
              disabled={!selected}
              onClick={() => {
                if (selected) onSelect(toCalendarInputValue(selected));
              }}
              className="ui-btn-primary mb-2 w-full h-12 rounded-2xl flex items-center justify-center touch-manipulation disabled:opacity-50">
              
                Apply · {applyLabel}
              </button>
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>,
    document.body);

}
