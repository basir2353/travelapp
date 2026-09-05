import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { KtaLogoMark } from '../onboarding/KtaLogoMark';

const easing = [0.23, 1, 0.32, 1] as const;
const DURATION_MS = 2800;

interface SignupV2AccountReadyScreenProps {
  displayName: string;
  onComplete: () => void;
  onSkip?: () => void;
  /** When true, progress bar finishes and auto-advances. */
  ready?: boolean;
}

export function SignupV2AccountReadyScreen({
  displayName,
  onComplete,
  onSkip,
  ready = false
}: SignupV2AccountReadyScreenProps) {
  const [progress, setProgress] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - t, 2.4);
      setProgress(eased * 100);

      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setFinished(true);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (finished && ready) {
      const timer = setTimeout(onComplete, 400);
      return () => clearTimeout(timer);
    }
  }, [finished, ready, onComplete]);

  const handleSkip = () => {
    if (ready) {
      (onSkip ?? onComplete)();
    }
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-b from-[#1a3a47] via-[#1e2d35] to-[#1a2429]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(232,117,110,0.08),transparent_60%)]"
        aria-hidden="true"
      />

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: easing }}
          className="flex flex-col items-center">
          <div className="relative mb-8 flex h-[148px] w-[148px] items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full border border-white/10"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            />
            <motion.div
              className="absolute inset-2 rounded-full border border-white/[0.06]"
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              aria-hidden="true"
            />
            <div className="relative flex h-[88px] w-[88px] items-center justify-center rounded-[22px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
              <KtaLogoMark size={56} />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easing, delay: 0.15 }}
            className="flex items-baseline gap-0.5">
            <span className="text-[26px] font-bold tracking-tight text-white">KTA</span>
            <span className="text-[24px] font-semibold text-[#E8756E]">Travel</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easing, delay: 0.28 }}
            className="mt-3 text-center text-[14px] leading-relaxed text-white/70">
            Welcome aboard, {displayName}. Your account is ready.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ duration: 0.35, ease: easing, delay: 0.4 }}
            className="mt-8 w-full max-w-[220px]">
            <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-[#E8756E]"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="relative shrink-0 pb-cta-safe pt-4">
        <button
          type="button"
          onClick={handleSkip}
          disabled={!ready}
          className="w-full py-3 text-center text-[14px] font-medium text-white/50 transition-colors duration-150 enabled:hover:text-white/80 disabled:cursor-default">
          Skip
        </button>
      </div>
    </div>
  );
}
