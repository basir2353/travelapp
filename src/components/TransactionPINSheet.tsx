import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Fingerprint } from 'lucide-react';
import { useAuth } from './AuthContext';
import { NumPad } from './NumPad';
interface TransactionPINSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
  amount?: number;
  currencyCode?: string;
  recipient?: string;
  ctaLabel?: string;
}
export function TransactionPINSheet({
  open,
  onClose,
  onSuccess,
  title = 'Authorize transaction',
  subtitle = 'Enter your 4-digit PIN to confirm',
  amount,
  currencyCode = 'ETB',
  recipient
}: TransactionPINSheetProps) {
  const code =
    String(currencyCode || 'ETB')
      .trim()
      .toUpperCase() || 'ETB';
  const { pin: savedPin, biometricUnlock } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [biometricLoading, setBiometricLoading] = useState(false);
  // Reset state when sheet opens
  useEffect(() => {
    if (open) {
      setPin('');
      setError(false);
      setAttempts(0);
      setBiometricLoading(false);
    }
  }, [open]);
  const handleKey = (num: string) => {
    if (pin.length >= 4 || biometricLoading) return;
    const next = pin + num;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => {
        // If no saved PIN (legacy/demo accounts) accept any 4-digit PIN
        if (!savedPin || savedPin === next) {
          onSuccess();
          // small reset for next open
          setTimeout(() => setPin(''), 200);
        } else {
          setError(true);
          setAttempts((a) => a + 1);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 600);
        }
      }, 200);
    }
  };
  const handleDelete = () => {
    if (biometricLoading) return;
    setPin((p) => p.slice(0, -1));
    setError(false);
  };
  const handleBiometric = () => {
    setBiometricLoading(true);
    setTimeout(() => {
      setBiometricLoading(false);
      onSuccess();
    }, 900);
  };
  return createPortal(
    <AnimatePresence>
      {open &&
      <>
          {/* Backdrop */}
          <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          onClick={onClose}
          className="fixed inset-0 glass-overlay z-[120]" />
        
          <motion.div
          initial={{
            y: '100%'
          }}
          animate={{
            y: 0
          }}
          exit={{
            y: '100%'
          }}
          transition={{
            type: 'spring',
            damping: 32,
            stiffness: 320
          }}
          className="fixed bottom-0 left-0 right-0 glass-sheet rounded-t-ios-xl z-[120] max-w-[480px] mx-auto px-6 pt-4 pb-cta-safe max-h-[92vh] overflow-y-auto">
          
            <div className="w-9 h-1 rounded-full bg-gray-300/80 mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-[17px] font-bold text-text-primary">{title}</h2>
              </div>
              <button
              onClick={onClose}
              className="ui-touch w-11 h-11 rounded-full glass-btn-ghost flex items-center justify-center"
              aria-label="Close">
              
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <p className="ui-subtitle ml-11 mb-4">{subtitle}</p>

            {/* Transaction summary */}
            {(amount !== undefined || recipient) &&
          <div className="glass-muted rounded-ios-lg p-4 mb-5">
                {amount !== undefined &&
            <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className="text-[11px] text-gray-500 font-medium">
                      {code}
                    </span>
                    <span className="text-[22px] font-bold text-gray-900 leading-none">
                      {amount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
                    </span>
                  </div>
            }
                {recipient &&
            <p className="text-[12px] text-gray-600">
                    To{' '}
                    <span className="font-semibold text-gray-900">
                      {recipient}
                    </span>
                  </p>
            }
              </div>
          }

            {/* PIN dots */}
            <div className="flex flex-col items-center mb-3">
              <motion.div
              animate={
              error ?
              {
                x: [-8, 8, -8, 8, 0]
              } :
              {
                x: 0
              }
              }
              transition={{
                duration: 0.4
              }}
              className="flex gap-3.5 mb-1.5">
              
                {[0, 1, 2, 3].map((i) => {
                const filled = i < pin.length;
                return (
                  <motion.div
                    key={i}
                    animate={
                    filled ?
                    {
                      scale: [0.7, 1.15, 1]
                    } :
                    {
                      scale: 1
                    }
                    }
                    transition={{
                      duration: 0.25
                    }}
                    className={`ui-pin-dot ${error ? 'bg-red-500' : filled ? 'ui-pin-dot-filled' : 'ui-pin-dot-empty'}`} />);


              })}
              </motion.div>
              <div className="h-5 text-[12px]">
                {error &&
              <span className="text-red-500 font-semibold">
                    Incorrect PIN
                    {attempts > 1 ? ` · ${attempts} attempts` : ''}
                  </span>
              }
              </div>
            </div>

            {/* NumPad */}
            <div className="flex justify-center">
              <NumPad
              variant="soft"
              onKey={handleKey}
              onDelete={handleDelete}
              biometric
              onBiometric={handleBiometric} />
            
            </div>

            {/* Biometric loading overlay */}
            <AnimatePresence>
              {biometricLoading &&
            <motion.div
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              exit={{
                opacity: 0
              }}
              className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-t-ios-xl">
              
                  <motion.div
                animate={{
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity
                }}
                className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-3">
                
                    <Fingerprint className="w-10 h-10 text-[#0D9488]" />
                  </motion.div>
                  <p className="text-[14px] font-semibold text-gray-900">
                    Authenticating...
                  </p>
                </motion.div>
            }
            </AnimatePresence>
          </motion.div>
        </>
      }
    </AnimatePresence>,
    document.body
  );

}