import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { KtaLogoMark } from '../onboarding/KtaLogoMark';

interface AuthShellProps {
  title: string;
  subtitle: string;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const easing = [0.23, 1, 0.32, 1] as const;

export function SignupV2AuthShell({
  title,
  subtitle,
  onBack,
  children,
  footer
}: AuthShellProps) {
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-teal-200/50 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-24 top-16 h-56 w-56 rounded-full bg-coral-100/70 blur-3xl"
        aria-hidden="true"
      />

      <header
        className="relative flex shrink-0 items-center justify-between px-5 pb-2 sm:px-6"
        style={{ paddingTop: 'calc(0.5rem + var(--sat))' }}>
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.12 }}
          onClick={onBack}
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors duration-150 ease-swift hover:bg-sand-50">
          <ArrowLeft className="h-[18px] w-[18px]" aria-hidden="true" />
        </motion.button>
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white bg-white/90 shadow-sm">
          <KtaLogoMark size={26} />
        </div>
      </header>

      <div className="no-scrollbar relative min-h-0 min-w-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easing }}
          className="pt-4">
          <h1 className="whitespace-pre-line text-[30px] font-extrabold leading-[1.12] tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-ink-muted">{subtitle}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easing, delay: 0.08 }}
          className="min-w-0">
          {children}
        </motion.div>
      </div>

      {footer ?
        <div className="relative shrink-0 px-5 pb-cta-safe pt-3 sm:px-6">
          {footer}
        </div> :
        null}
    </div>
  );
}
