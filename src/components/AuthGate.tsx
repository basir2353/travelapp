import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Fingerprint,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { Onboarding } from '../pages/Onboarding';
import { KtaLogoMark } from './onboarding/KtaLogoMark';
import { KtaAuthBackdrop } from './onboarding/KtaAuthUi';
import { NumPad } from './NumPad';
import { ForgotPinFlow } from './ForgotPinFlow';
import demoProfile from '../assets/demo-profile.png';

const easing = [0.23, 1, 0.32, 1] as const;

function displayFirstName(raw: string): string {
  const name = raw.trim();
  if (!name) return 'traveller';
  if (name.length <= 14) return name;
  return `${name.slice(0, 12)}…`;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, user, unlock, biometricUnlock, logout } = useAuth();
  const navigate = useNavigate();
  const prevStatus = useRef(status);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [failedPinAttempts, setFailedPinAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/', { replace: true });
    } else if (
      prevStatus.current === 'unauthenticated' &&
      status === 'authenticated'
    ) {
      navigate('/', { replace: true });
    }
    prevStatus.current = status;
  }, [status, navigate]);

  if (status === 'unauthenticated') {
    return (
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <Onboarding />
      </div>
    );
  }

  if (status === 'locked') {
    const isLocked = !!lockedUntil && lockedUntil > Date.now();
    const lockTimeRemaining = isLocked
      ? Math.ceil((lockedUntil - Date.now()) / 60000)
      : 0;
    const savedProfile = (() => {
      try {
        const raw = localStorage.getItem('mkash-profile');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();
    const firstName = displayFirstName(
      user?.name?.split(' ')[0] || savedProfile?.firstName || 'traveller'
    );
    const hour = new Date().getHours();
    const greeting =
      hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    const handleKey = (num: string) => {
      if (isLocked || pin.length >= 4) return;
      const nextPin = pin + num;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        setTimeout(() => {
          if (!unlock(nextPin)) {
            setError(true);
            setTimeout(() => {
              setPin('');
              setError(false);
              const nextAttempts = failedPinAttempts + 1;
              setFailedPinAttempts(nextAttempts);
              if (nextAttempts >= 5) {
                setLockedUntil(Date.now() + 5 * 60000);
                setFailedPinAttempts(0);
              }
            }, 600);
          }
        }, 300);
      }
    };
    const handleDelete = () => {
      if (isLocked) return;
      setPin(pin.slice(0, -1));
      setError(false);
    };
    const handleBiometric = () => {
      setBiometricLoading(true);
      setTimeout(() => {
        setBiometricLoading(false);
        biometricUnlock();
      }, 1200);
    };

    return (
      <div className="auth-screen kta-pin-screen relative flex h-full min-h-[100dvh] flex-col overflow-hidden">
        <KtaAuthBackdrop />

        <header
          className="relative z-10 flex shrink-0 items-center justify-between px-4"
          style={{ paddingTop: 'calc(0.35rem + var(--sat))' }}>
          <div className="kta-auth-logo-mark flex h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] border border-white bg-white/90 shadow-sm">
            <KtaLogoMark size={22} />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/90 px-2 py-1 shadow-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-500" />
              </span>
              <span className="text-[10px] font-semibold tracking-wide text-slate-600">
                Secure
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Sign out"
              className="kta-auth-icon-btn !h-9 !w-9">
              <LogOut className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto no-scrollbar px-4 pb-cta-safe">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: easing }}
            className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center pt-3">
            <motion.div
              initial={{ scale: 0.86, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.04 }}
              className="relative mb-3.5">
              <div className="kta-pin-avatar-ring rounded-full">
                <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-white">
                  <img
                    src={demoProfile}
                    alt=""
                    className="h-full w-full object-cover object-[center_15%]"
                  />
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#1a3d42] shadow-md">
                <CheckCircle2
                  className="h-3 w-3 text-white"
                  strokeWidth={2.5}
                />
              </div>
            </motion.div>

            <p
              className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: '#1a4a4f' }}>
              {greeting}
            </p>
            <h1 className="kta-pin-title max-w-[260px] text-center text-[22px] font-extrabold leading-[1.2] tracking-tight">
              Welcome back,{' '}
              <span className="kta-pin-name">{firstName}</span>
            </h1>
            <p className="mt-1.5 max-w-[240px] text-center text-[13px] leading-snug text-slate-500">
              Enter your 4-digit PIN to unlock
            </p>

            {isLocked ? (
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-5 w-full max-w-[260px] rounded-2xl border border-red-100 bg-red-50 p-4 text-center">
                <AlertCircle className="mx-auto mb-1.5 h-6 w-6 text-red-500" />
                <p className="mb-0.5 text-[13px] font-bold text-red-700">
                  Account Locked
                </p>
                <p className="text-[11px] text-red-600">
                  Try again in {lockTimeRemaining}{' '}
                  {lockTimeRemaining === 1 ? 'minute' : 'minutes'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: easing, delay: 0.08 }}
                className="mt-5 flex w-full flex-col items-center">
                <motion.div
                  animate={error ? { x: [-7, 7, -7, 7, 0] } : { x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mb-1.5 flex gap-2">
                  {[0, 1, 2, 3].map((i) => {
                    const filled = i < pin.length;
                    return (
                      <motion.div
                        key={i}
                        animate={
                          filled ? { scale: [0.9, 1.05, 1] } : { scale: 1 }
                        }
                        transition={{ duration: 0.2 }}
                        className={`kta-pin-slot ${
                          error
                            ? 'kta-pin-slot-error'
                            : filled
                              ? 'kta-pin-slot-filled'
                              : ''
                        }`}>
                        {filled ? (
                          <span
                            className={`kta-pin-slot-dot ${error ? 'kta-pin-slot-dot-error' : ''}`}
                          />
                        ) : null}
                      </motion.div>
                    );
                  })}
                </motion.div>

                <div className="mb-4 h-4 text-[11px] font-medium">
                  {error ? (
                    <span className="text-red-500">Incorrect PIN</span>
                  ) : null}
                  {!error && failedPinAttempts > 0 ? (
                    <span className="text-amber-600">
                      {5 - failedPinAttempts} attempts remaining
                    </span>
                  ) : null}
                </div>
              </motion.div>
            )}

            <div
              className={`mt-auto flex w-full flex-col items-center pt-1 ${
                isLocked ? 'pointer-events-none opacity-30' : ''
              }`}>
              <NumPad
                variant="auth"
                onKey={handleKey}
                onDelete={handleDelete}
                biometric
                onBiometric={handleBiometric}
              />

              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="mt-3.5 min-h-[40px] px-4 py-1.5 text-[13px] font-semibold transition-colors"
                style={{ color: '#1a4a4f' }}>
                Forgot PIN?
              </button>

              <div className="mb-0.5 flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="h-3 w-3" strokeWidth={2} />
                End-to-end encrypted
              </div>
            </div>
          </motion.div>
        </div>

        {biometricLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-white/92 backdrop-blur-sm">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a3d42]/10 to-[#c96b62]/15">
              <Fingerprint className="h-8 w-8 text-[#1a3d42]" strokeWidth={1.75} />
            </motion.div>
            <div className="text-[14px] font-semibold text-[#0B1320]">
              Authenticating…
            </div>
            <p className="mt-1 text-[12px] text-slate-500">
              Confirm with Face ID or Touch ID
            </p>
          </motion.div>
        ) : null}

        <ForgotPinFlow open={forgotOpen} onClose={() => setForgotOpen(false)} />
      </div>
    );
  }

  return <>{children}</>;
}
