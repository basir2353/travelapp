import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Phone, Search, X } from 'lucide-react';
import {
  DIAL_CODE_OPTIONS,
  findDialOption,
  type DialCodeOption
} from '../data/dialCodes';
import { CountryFlag } from './CountryFlag';

type Props = {
  dialCode: string;
  nationalNumber: string;
  onDialChange: (option: DialCodeOption) => void;
  onNationalChange: (value: string) => void;
  valid?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  /** Compact glass style for flight checkout forms. */
  variant?: 'default' | 'funnel' | 'auth';
  hasError?: boolean;
  id?: string;
};

/**
 * Phone field with country flag + dial code via bottom-sheet picker.
 */
export function CountryDialPhoneField({
  dialCode,
  nationalNumber,
  onDialChange,
  onNationalChange,
  valid = false,
  autoFocus = false,
  placeholder = '9XXXXXXXX',
  variant = 'default',
  hasError = false,
  id
}: Props) {
  const selected = findDialOption(dialCode);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const filtered = DIAL_CODE_OPTIONS.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      o.name.toLowerCase().includes(q) ||
      o.dial.includes(q.replace(/\D/g, '')) ||
      o.iso.toLowerCase().includes(q)
    );
  });

  const selectCountry = (option: DialCodeOption) => {
    onDialChange(option);
    setOpen(false);
    setQuery('');
  };

  const funnel = variant === 'funnel';
  const auth = variant === 'auth';

  const countryBtn = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={
        funnel ?
          'flex items-center gap-1 h-10 min-w-[5.5rem] px-2.5 border-r border-teal-200/50 bg-white/70 hover:bg-white active:scale-[0.98] shrink-0' :
          auth ?
            'kta-phone-dial flex items-center gap-1.5 h-[52px] px-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 hover:bg-white active:scale-[0.98] shrink-0' :
            'flex items-center gap-1.5 h-10 px-2 rounded-xl hover:bg-black/5 active:scale-[0.98] shrink-0'
      }
      aria-label="Select country code"
      aria-haspopup="dialog"
      aria-expanded={open}>
      <CountryFlag iso={selected.iso} size={funnel ? 16 : auth ? 18 : 20} />
      <span className={`${funnel ? 'text-[13px]' : auth ? 'text-[14px]' : 'text-[14px]'} font-semibold text-gray-800 tabular-nums`}>
        +{selected.dial}
      </span>
      <ChevronDown className={`${funnel ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-gray-400`} />
    </button>
  );

  const numberInput = (
    <div className={`relative flex-1 min-w-0 ${funnel || auth ? 'flex items-center' : ''}`}>
      {funnel &&
      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      }
      <input
        id={id}
        type="tel"
        name="tel-national"
        autoComplete="tel-national"
        inputMode="numeric"
        autoFocus={autoFocus}
        value={nationalNumber}
        onChange={(e) => {
          let next = e.target.value.replace(/\D/g, '').slice(0, 15);
          if (next.startsWith('0')) next = next.slice(1);
          onNationalChange(next.slice(0, selected.localLength));
        }}
        placeholder={placeholder}
        aria-label="Mobile number without country code"
        className={
          funnel ?
            'w-full h-10 pl-9 pr-3 bg-transparent text-[13px] text-foreground placeholder:text-gray-400 focus:outline-none' :
            auth ?
              'kta-phone-input w-full h-[52px] px-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-[15px] font-medium text-gray-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1a3d42]/35 focus:bg-white' :
              'flex-1 min-w-0 bg-transparent text-[16px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none pr-3'
        }
      />
    </div>
  );

  return (
    <div>
      {auth ?
        <div className="kta-phone-row flex items-center gap-2.5">
          {countryBtn}
          {numberInput}
        </div> :
      <div
        className={
          funnel ?
            `flex items-stretch min-h-10 rounded-ios-md border overflow-hidden transition-all duration-ios ${
              hasError ?
                '!border-red-500 !ring-2 !ring-red-100 !bg-red-50/50' :
                'border-teal-200/60 bg-white/55'
            }` :
            `flex items-center h-14 rounded-ios-lg border-2 px-2 transition-all duration-ios ${
              valid ?
                'border-primary glass-field-active' :
                'glass-field'
            } focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10`
        }>
        {!funnel && <Phone className="w-5 h-5 text-gray-400 ml-2 mr-1 shrink-0" />}
        {countryBtn}
        {numberInput}
      </div>}

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-[200] flex flex-col justify-end bg-black/45"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}>
                <button
                  type="button"
                  className="flex-1 min-h-[48px] shrink-0"
                  aria-label="Close country picker"
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Select country code"
                  className="relative w-full max-h-[min(78dvh,640px)] flex flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 320 }}>
                  <div className="px-5 pt-3 pb-2 shrink-0">
                    <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[18px] font-bold text-gray-900">
                        Country code
                      </h3>
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-95"
                        aria-label="Close">
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 h-12 px-3 rounded-2xl bg-gray-50 border border-gray-100">
                      <Search className="w-4 h-4 text-gray-400 shrink-0" />
                      <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search country or code"
                        className="flex-1 text-[15px] bg-transparent focus:outline-none text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-2 pb-sheet-safe">
                    {filtered.map((option) => {
                      const active =
                        option.dial === selected.dial &&
                        option.iso === selected.iso;
                      return (
                        <button
                          key={`${option.iso}-${option.dial}`}
                          type="button"
                          onClick={() => selectCountry(option)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left active:bg-gray-50 ${
                            active ? 'bg-[#0D7B3E12]' : ''
                          }`}>
                          <CountryFlag iso={option.iso} size={24} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[15px] font-semibold text-gray-900 truncate">
                              {option.name}
                            </span>
                            <span className="block text-[12px] text-gray-500 mt-0.5">
                              {option.iso}
                            </span>
                          </span>
                          <span className="text-[15px] font-bold text-gray-800 tabular-nums">
                            +{option.dial}
                          </span>
                          {active && (
                            <Check
                              className="w-5 h-5 text-[#0D7B3E] shrink-0"
                              strokeWidth={2.5}
                            />
                          )}
                        </button>
                      );
                    })}
                    {filtered.length === 0 && (
                      <p className="px-4 py-10 text-center text-[14px] text-gray-500">
                        No countries match
                      </p>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
