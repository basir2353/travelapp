import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  Check,
  FileCheck,
  Plane,
  Ban,
  AlertCircle,
  Info
} from 'lucide-react';
import { KTA } from './ethioTravelData';

type DocChoice = 'validId' | 'internationalTicket' | 'noDocuments';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  searching?: boolean;
}

const DOC_OPTIONS: {
  id: DocChoice;
  title: string;
  subtitle?: string;
  bullets?: string[];
  icon: typeof FileCheck;
}[] = [
{
  id: 'validId',
  title: 'I have valid ID or residence proof',
  bullets: [
  'Passport',
  'Visa',
  'National ID card',
  'Resident permit',
  'Government-issued ID'],

  icon: FileCheck
},
{
  id: 'internationalTicket',
  title: "I'm travelling on an international ticket",
  subtitle: 'Onward or connecting flight booked',
  icon: Plane
},
{
  id: 'noDocuments',
  title: "I don't hold any of these documents yet",
  icon: Ban
}];

export function TravelDocsSheet({
  open,
  onClose,
  onConfirm,
  searching = false
}: Props) {
  const [selected, setSelected] = useState<DocChoice | null>(null);
  useEffect(() => {
    if (open) setSelected(null);
  }, [open]);
  return createPortal(
    <AnimatePresence>
      {open &&
      <>
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/40" />
        
          <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-0 left-0 right-0 glass-sheet rounded-t-ios-xl z-[100] flex flex-col max-h-[92vh] pb-safe">
          
            <div className="flex justify-center pt-2 pb-0.5 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-300/80" />
            </div>

            <div className="px-5 pt-1.5 pb-3 overflow-y-auto">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full glass-icon-wrap shrink-0">
                    <ShieldCheck
                    className="w-5 h-5"
                    style={{
                      color: KTA.green
                    }} />
                  
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[17px] font-bold text-slate-900 leading-tight">
                      Which documents do you have?
                    </h3>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      Tell us what you can present at the airport
                    </p>
                  </div>
                </div>
                <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full glass-btn-ghost flex items-center justify-center shrink-0"
                aria-label="Close">
                
                  <X className="w-4 h-4 text-text-secondary" />
                </button>
              </div>

              <div className="space-y-2.5">
                {DOC_OPTIONS.map((option) => {
                const active = selected === option.id;
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelected(option.id)}
                    className={`w-full flex items-start gap-3 glass-doc-row p-3 text-left transition-all duration-ios active:scale-[0.99] ${active ? 'glass-doc-row-active' : ''}`}>
                    
                      <div className="w-9 h-9 rounded-ios-md glass-icon-wrap shrink-0 mt-0.5">
                        <Icon
                        className="w-[18px] h-[18px]"
                        style={{
                          color: KTA.green
                        }} />
                      
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-900 leading-snug">
                          {option.title}
                        </p>
                        {option.subtitle &&
                      <p className="text-[11px] text-slate-500 mt-0.5">
                            {option.subtitle}
                          </p>
                      }
                        {option.bullets &&
                      <ul className="mt-2 space-y-1">
                            {option.bullets.map((item) =>
                        <li
                          key={item}
                          className="flex items-center gap-2 text-[11px] text-slate-500">
                          
                                <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: KTA.green
                            }} />
                          
                                {item}
                              </li>
                        )}
                          </ul>
                      }
                      </div>
                      <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors mt-0.5"
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

              <div className="mt-4 flex items-start gap-2 glass-alert-warning p-3">
                <AlertCircle
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{
                  color: KTA.orange
                }} />
              
                <p
                className="text-[11px] leading-snug"
                style={{
                  color: '#92400e'
                }}>
                
                  Make sure your documents are ready — missing documents may
                  prevent boarding.
                </p>
              </div>

              <div className="mt-3 flex items-start gap-2 glass-alert-info p-3">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
                <p className="text-[11px] text-slate-600 leading-snug">
                  <span className="font-bold">Note:</span> Travelling with an
                  infant under two may require a birth certificate or proof of
                  age at the airport.
                </p>
              </div>
            </div>

            <div className="px-5 pt-2.5 pb-3 border-t border-slate-100 shrink-0 space-y-2">
              {searching &&
            <p className="text-center text-[12px] text-slate-500 pb-1">
                  Searching live flights…
                </p>
            }
              <button
              type="button"
              onClick={() => {
                if (!selected) return;
                onConfirm();
              }}
              disabled={!selected}
              className="ui-btn-primary h-12 text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 w-full"
              style={{
                backgroundColor: KTA.green
              }}>
              
                <Check className="w-5 h-5" strokeWidth={3} />
                Continue to search
              </button>
              <button
              type="button"
              onClick={onClose}
              className="w-full text-[13px] font-semibold text-text-secondary active:opacity-70 transition-opacity duration-ios py-1">
              
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>,
    document.body
  );

}
