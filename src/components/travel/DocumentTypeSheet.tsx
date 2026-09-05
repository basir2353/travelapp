import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { KTA } from './ethioTravelData';

const DOCUMENT_TYPES = ['Passport', 'National ID'] as const;

export function DocumentTypeSheet({
  open,
  value,
  onSelect,
  onClose
}: {
  open: boolean;
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(value || 'Passport');
  useEffect(() => {
    if (!open) return;
    setSelected(value || 'Passport');
  }, [open, value]);
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
              <h2 className="text-[17px] font-bold text-text-primary">
                Document type
              </h2>
              <button
              type="button"
              onClick={onClose}
              aria-label="Close document type picker"
              className="w-9 h-9 rounded-full glass-btn-ghost flex items-center justify-center">
              
                <X className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 space-y-2">
              {DOCUMENT_TYPES.map((option) => {
              const active = selected === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelected(option)}
                  className="w-full flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left touch-manipulation active:bg-slate-50 transition-colors"
                  style={{
                    borderColor: active ? KTA.green : KTA.border,
                    backgroundColor: active ? '#F0FDFA' : '#fff'
                  }}>
                  
                    <span className="text-[14px] font-semibold text-slate-900">
                      {option}
                    </span>
                    <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors"
                    style={{
                      borderColor: active ? KTA.green : '#cbd5e1',
                      backgroundColor: active ? KTA.green : 'transparent'
                    }}>
                    
                      {active &&
                    <Check
                      className="w-3.5 h-3.5 text-white"
                      strokeWidth={3} />

                    }
                    </div>
                  </button>);

            })}
            </div>
            <div className="shrink-0 border-t border-teal-100/70 bg-white/90 px-5 pt-3 pb-safe">
              <button
              type="button"
              onClick={() => onSelect(selected)}
              className="ui-btn-primary mb-2 w-full h-12 rounded-2xl flex items-center justify-center touch-manipulation">
              
                Apply · {selected}
              </button>
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>,
    document.body
  );
}
