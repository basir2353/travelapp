import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Check, MapPin, Search } from 'lucide-react';
import { useBusCitySearch } from '../hooks/useBusCitySearch';

type Props = {
  icon?: React.ReactNode;
  label?: string;
  placeholder: string;
  value: string;
  onChange: (name: string, cityId?: string) => void;
  disabled?: boolean;
};

export function ApiCitySelect({
  icon,
  label,
  placeholder,
  value,
  onChange,
  disabled = false
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { results, error } = useBusCitySearch(query, open);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <div>
        {label &&
        <label className="block text-[13px] font-semibold text-text-primary mb-2 ml-0.5">
            {label}
          </label>
        }
        <button
          type="button"
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled}
          className={`relative w-full h-[52px] rounded-ios-md text-left transition-all duration-ios flex items-center ${disabled ? 'glass-muted opacity-60 cursor-not-allowed' : 'glass-input hover:bg-white/65'} ${icon ? 'pl-12' : 'pl-4'} pr-12`}>
          
          {icon &&
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          }
          {value ?
          <span className="text-[15px] text-gray-900 truncate pr-2">{value}</span> :

          <span className="text-[15px] text-gray-400">{placeholder}</span>
          }
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </button>
      </div>

      <AnimatePresence>
        {open &&
        <>
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 glass-overlay z-50" />
          
            <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 inset-x-0 glass-sheet rounded-t-ios-xl z-50 max-h-[70vh] flex flex-col pb-safe">
            
              <div className="pt-3 pb-2 flex justify-center">
                <div className="w-9 h-1 rounded-full bg-gray-300/80" />
              </div>
              <div className="px-5 pb-3 flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-text-primary">
                  {label || 'Select city'}
                </h3>
                <button
                type="button"
                onClick={close}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="px-5 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                  autoFocus
                  placeholder="Search cities…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="ui-input h-11 pl-10 text-[14px]" />
                
                </div>
              </div>

              <div className="overflow-y-auto flex-1 px-2 pb-sheet-safe">
                {error &&
              <div className="text-center text-[13px] text-red-500 py-8 px-4">
                    {error}
                  </div>
              }
                {!error && results.length === 0 &&
              <div className="text-center text-[13px] text-gray-400 py-8">
                    {query.trim() ? 'No cities found' : 'Loading cities…'}
                  </div>
              }
                {!error &&
              results.map((city) => {
                const isSelected = city.name === value;
                return (
                  <button
                    key={city.cityId}
                    type="button"
                    onClick={() => {
                      onChange(city.name, city.cityId);
                      close();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-ios-md transition-all duration-ios ${isSelected ? 'bg-primary-light' : 'hover:bg-surface-muted'}`}>
                    
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span
                      className={`flex-1 text-left text-[15px] ${isSelected ? 'font-semibold text-[#0D9488]' : 'text-gray-900'}`}>
                      
                          {city.name}
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
      </AnimatePresence>
    </>);

}
