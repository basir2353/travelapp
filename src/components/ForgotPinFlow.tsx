import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  ArrowLeft,
  MessageSquare,
  CheckCircle2 } from
'lucide-react';
import { useAuth } from './AuthContext';
import { NumPad } from './NumPad';
type Step = 'verify' | 'otp' | 'new' | 'confirm' | 'success';
// Demo OTP shown to the user so the prototype is testable.
const DEMO_OTP = '1234';
interface Props {
  open: boolean;
  onClose: () => void;
}
export function ForgotPinFlow({ open, onClose }: Props) {
  const { user, resetPin } = useAuth();
  const [step, setStep] = useState<Step>('verify');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [mismatch, setMismatch] = useState(false);
  const [sending, setSending] = useState(false);
  const phone = user?.phone || '+251 91 234 5678';
  const maskedPhone = phone.replace(/\d(?=\d{2})/g, (m, i) =>
  i < phone.replace(/\D/g, '').length - 2 ? '•' : m
  );
  // Reset internal state whenever the sheet is opened.
  useEffect(() => {
    if (open) {
      setStep('verify');
      setOtp('');
      setOtpError(false);
      setNewPin('');
      setConfirmPin('');
      setMismatch(false);
      setSending(false);
    }
  }, [open]);
  const handleSendOtp = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setStep('otp');
    }, 1200);
  };
  const handleOtpKey = (num: string) => {
    if (otp.length >= 4) return;
    const next = otp + num;
    setOtp(next);
    setOtpError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === DEMO_OTP) {
          setStep('new');
          setOtp('');
        } else {
          setOtpError(true);
          setTimeout(() => {
            setOtp('');
            setOtpError(false);
          }, 600);
        }
      }, 250);
    }
  };
  const handleNewKey = (num: string) => {
    if (newPin.length >= 4) return;
    const next = newPin + num;
    setNewPin(next);
    if (next.length === 4) {
      setTimeout(() => setStep('confirm'), 250);
    }
  };
  const handleConfirmKey = (num: string) => {
    if (confirmPin.length >= 4) return;
    const next = confirmPin + num;
    setConfirmPin(next);
    setMismatch(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === newPin) {
          setStep('success');
          setTimeout(() => {
            resetPin(newPin);
            onClose();
          }, 1600);
        } else {
          setMismatch(true);
          setTimeout(() => {
            setConfirmPin('');
            setNewPin('');
            setMismatch(false);
            setStep('new');
          }, 700);
        }
      }, 250);
    }
  };
  const goBack = () => {
    if (step === 'otp') setStep('verify');else
    if (step === 'new') {
      setNewPin('');
      setStep('otp');
    } else if (step === 'confirm') {
      setConfirmPin('');
      setStep('new');
    }
  };
  const PinDots = ({ value, error }: {value: string;error?: boolean;}) =>
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
    className="flex gap-3.5 justify-center mb-2">
    
      {[0, 1, 2, 3].map((i) => {
      const filled = i < value.length;
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
          className={`w-3.5 h-3.5 rounded-full transition-colors duration-200 ${error ? 'bg-red-500' : filled ? 'bg-gradient-to-br from-[#0D9488] to-[#14B8A6] shadow-[0_2px_8px_rgba(31,170,80,0.4)]' : 'bg-gray-200'}`} />);


    })}
    </motion.div>;

  return (
    <AnimatePresence>
      {open &&
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
        className="absolute inset-0 z-[60] glass-screen ui-app-bg flex flex-col">
        
          {/* Header */}
          <div className="relative pt-14 pb-5 px-6 bg-gradient-to-br from-teal-50 via-teal-50/70 to-blue-50">
            <div className="flex items-center justify-between">
              {step !== 'verify' && step !== 'success' ?
            <button
              onClick={goBack}
              className="p-1.5 rounded-full glass-pill text-text-secondary active:opacity-80"
              aria-label="Back">
              
                  <ArrowLeft className="w-4 h-4" />
                </button> :

            <div className="w-7" />
            }
              <span className="text-[13px] font-semibold text-gray-700">
                Reset PIN
              </span>
              <button
              onClick={onClose}
              className="p-1.5 rounded-full glass-pill text-text-secondary active:opacity-80"
              aria-label="Close">
              
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center px-6 pt-6 overflow-y-auto no-scrollbar">
            <AnimatePresence mode="wait">
              {/* Step 1: Verify identity / send OTP */}
              {step === 'verify' &&
            <motion.div
              key="verify"
              initial={{
                opacity: 0,
                x: 20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              exit={{
                opacity: 0,
                x: -20
              }}
              className="w-full max-w-[320px] flex flex-col items-center text-center">
              
                  <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-5">
                    <ShieldCheck className="w-8 h-8 text-[#0D9488]" />
                  </div>
                  <h2 className="text-[20px] font-bold text-gray-900 mb-2">
                    Forgot your PIN?
                  </h2>
                  <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
                    We'll send a verification code to your registered phone
                    number to confirm it's you.
                  </p>
                  <div className="w-full glass-card p-4 mb-6 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full glass-pill flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-[#0D9488]" />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                        Send code to
                      </p>
                      <p className="text-[14px] font-bold text-gray-900">
                        {maskedPhone}
                      </p>
                    </div>
                  </div>
                  <button
                onClick={handleSendOtp}
                disabled={sending}
                className="ui-btn-primary h-12 text-[15px] flex items-center justify-center gap-2 disabled:opacity-70">
                
                    {sending ?
                <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </> :

                'Send Code'
                }
                  </button>
                </motion.div>
            }

              {/* Step 2: Enter OTP */}
              {step === 'otp' &&
            <motion.div
              key="otp"
              initial={{
                opacity: 0,
                x: 20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              exit={{
                opacity: 0,
                x: -20
              }}
              className="w-full flex flex-col items-center text-center">
              
                  <h2 className="text-[20px] font-bold text-gray-900 mb-2">
                    Enter the code
                  </h2>
                  <p className="text-[13px] text-gray-500 mb-2">
                    Sent to {maskedPhone}
                  </p>
                  <p className="text-[11px] text-amber-600 bg-amber-50 px-3 py-1 rounded-full mb-6">
                    Demo code: {DEMO_OTP}
                  </p>
                  <PinDots value={otp} error={otpError} />
                  <div className="h-5 text-[12px] mb-5">
                    {otpError &&
                <span className="text-red-500 font-semibold">
                        Incorrect code
                      </span>
                }
                  </div>
                  <NumPad
                variant="soft"
                onKey={handleOtpKey}
                onDelete={() => {
                  setOtp(otp.slice(0, -1));
                  setOtpError(false);
                }} />
              
                </motion.div>
            }

              {/* Step 3: New PIN */}
              {step === 'new' &&
            <motion.div
              key="new"
              initial={{
                opacity: 0,
                x: 20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              exit={{
                opacity: 0,
                x: -20
              }}
              className="w-full flex flex-col items-center text-center">
              
                  <h2 className="text-[20px] font-bold text-gray-900 mb-2">
                    Create a new PIN
                  </h2>
                  <p className="text-[13px] text-gray-500 mb-6">
                    Choose a 4-digit PIN you'll remember
                  </p>
                  <PinDots value={newPin} />
                  <div className="h-5 mb-5" />
                  <NumPad
                variant="soft"
                onKey={handleNewKey}
                onDelete={() => setNewPin(newPin.slice(0, -1))} />
              
                </motion.div>
            }

              {/* Step 4: Confirm PIN */}
              {step === 'confirm' &&
            <motion.div
              key="confirm"
              initial={{
                opacity: 0,
                x: 20
              }}
              animate={{
                opacity: 1,
                x: 0
              }}
              exit={{
                opacity: 0,
                x: -20
              }}
              className="w-full flex flex-col items-center text-center">
              
                  <h2 className="text-[20px] font-bold text-gray-900 mb-2">
                    Confirm your PIN
                  </h2>
                  <p className="text-[13px] text-gray-500 mb-6">
                    Re-enter your new PIN to confirm
                  </p>
                  <PinDots value={confirmPin} error={mismatch} />
                  <div className="h-5 text-[12px] mb-5">
                    {mismatch &&
                <span className="text-red-500 font-semibold">
                        PINs don't match, try again
                      </span>
                }
                  </div>
                  <NumPad
                variant="soft"
                onKey={handleConfirmKey}
                onDelete={() => {
                  setConfirmPin(confirmPin.slice(0, -1));
                  setMismatch(false);
                }} />
              
                </motion.div>
            }

              {/* Step 5: Success */}
              {step === 'success' &&
            <motion.div
              key="success"
              initial={{
                opacity: 0,
                scale: 0.9
              }}
              animate={{
                opacity: 1,
                scale: 1
              }}
              className="flex-1 flex flex-col items-center justify-center text-center pb-20">
              
                  <motion.div
                initial={{
                  scale: 0
                }}
                animate={{
                  scale: 1
                }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15
                }}
                className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-5">
                
                    <CheckCircle2 className="w-10 h-10 text-[#0D9488]" />
                  </motion.div>
                  <h2 className="text-[20px] font-bold text-gray-900 mb-2">
                    PIN reset successfully
                  </h2>
                  <p className="text-[13px] text-gray-500">Signing you in...</p>
                </motion.div>
            }
            </AnimatePresence>
          </div>
        </motion.div>
      }
    </AnimatePresence>);

}