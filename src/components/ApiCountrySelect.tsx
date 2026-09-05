import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Check, Globe, Search } from 'lucide-react';
import { useCountries } from '../hooks/useCountries';
import { extractCountryCodeFromLabel } from '../services/guestApi';

type Props = {
  icon?: React.ReactNode;
  label?: string;
  placeholder: string;
  value: string;
  countryId?: number;
  onChange: (name: string, countryId?: number, countryCode?: string) => void;
  disabled?: boolean;
  hasError?: boolean;
};

export function ApiCountrySelect({
  icon,
  label,
  placeholder,
  value,
  countryId,
  onChange,
  disabled = false,
  hasError = false
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const { countries, loading, error, fromFallback } = useCountries(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const selected = countries.find(
    (c) =>
    c.name === value ||
    c.id === countryId ||
    c.code === value ||
    c.label === value ||
    `${c.name}-${c.code}` === value ||
    `${c.name} - ${c.code}` === value ||
    extractCountryCodeFromLabel(c.label) === value
  );
  const displayValue = selected?.label ?? value;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
      c.name.toLowerCase().includes(q) ||
      c.label.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  }, [countries, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const sheet =
  mounted ?
  createPortal(
    <AnimatePresence>
      {open &&
      <>
          <motion.button
          type="button"
          aria-label="Close country picker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 glass-overlay z-[80]" />
        
          <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={label || 'Select country'}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-0 left-0 right-0 z-[81] mx-auto flex w-full max-w-md max-h-[min(85vh,720px)] flex-col rounded-t-ios-xl glass-sheet pb-safe">
          
            <div className="shrink-0 pt-3 pb-2 flex justify-center">
              <div className="w-9 h-1 rounded-full bg-gray-300/80" />
            </div>
            <div className="shrink-0 px-5 pb-3 flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-text-primary">
                {label || 'Select country'}
              </h3>
              <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="shrink-0 px-5 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                autoFocus
                placeholder="Search countries…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ui-input h-11 pl-10 text-[14px]" />
              
              </div>
            </div>

            {fromFallback && !loading &&
          <div className="shrink-0 px-5 pb-2">
                <p className="text-[12px] text-amber-800">
                  Could not reach live country list — showing common countries.
                </p>
              </div>
          }

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
              {loading &&
            <div className="text-center text-[13px] text-gray-400 py-8">
                  Loading countries…
                </div>
            }
              {error &&
            <div className="text-center text-[13px] text-red-500 py-8 px-4">
                  {error}
                </div>
            }
              {!loading && !error && filtered.length === 0 &&
            <div className="text-center text-[13px] text-gray-400 py-8">
                  No countries found
                </div>
            }
              {!loading &&
            !error &&
            filtered.map((country) => {
              const isSelected =
              country.name === value ||
              country.id === countryId ||
              country.code === value ||
              country.label === value ||
              `${country.name}-${country.code}` === value ||
              `${country.name} - ${country.code}` === value;
              return (
                <button
                    key={`${country.id}-${country.code}`}
                    type="button"
                    onClick={() => {
                      onChange(
                        country.name,
                        country.id,
                        country.code || extractCountryCodeFromLabel(country.label)
                      );
                      close();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-ios-md transition-all duration-ios ${isSelected ? 'bg-primary-light' : 'hover:bg-surface-muted active:bg-surface-muted'}`}>
                  
                      <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                      <span
                    className={`flex-1 text-left text-[15px] ${isSelected ? 'font-semibold text-[#0D9488]' : 'text-gray-900'}`}>
                    
                        {country.label}
                      </span>
                      {isSelected &&
                  <Check
                    className="w-5 h-5 text-[#0D9488]"
                    strokeWidth={2.5} />

                  }
                    </button>);

            })}
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>,
    document.body
  ) :
  null;

  return (
    <>
      <div>
        {label &&
        <label className="ui-form-label">
            {label}
          </label>
        }
        <button
          type="button"
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled}
          className={`relative w-full h-[52px] rounded-ios-md text-left transition-all duration-ios flex items-center ${disabled ? 'glass-muted opacity-60 cursor-not-allowed' : hasError ? 'glass-funnel-input !border-red-500 !ring-2 !ring-red-100 !bg-red-50/50' : 'glass-input hover:bg-white/65'} ${icon ? 'pl-12' : 'pl-4'} pr-12`}>
          
          {icon &&
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          }
          {displayValue ?
          <span className="text-[15px] text-gray-900 truncate pr-2">
              {displayValue}
            </span> :

          <span className="text-[15px] text-gray-400">{placeholder}</span>
          }
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </button>
      </div>
      {sheet}
    </>);

}
