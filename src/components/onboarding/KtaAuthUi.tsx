import React from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, MessageCircle, ShieldCheck } from 'lucide-react';
import { KtaLogoMark } from './KtaLogoMark';

export function KtaAuthBackdrop() {
  return (
    <div className="kta-auth-backdrop pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 via-white to-teal-50/55" />
      <div className="kta-auth-blob kta-auth-blob-a" />
      <div className="kta-auth-blob kta-auth-blob-b" />
    </div>
  );
}

export function KtaAuthHeader({
  onBack,
  showLogo = true
}: {
  onBack?: () => void;
  showLogo?: boolean;
}) {
  return (
    <div className="kta-auth-header shrink-0 px-6 pb-3 flex items-center justify-between">
      {onBack ?
        <button type="button" onClick={onBack} className="kta-auth-icon-btn" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button> :
        <div className="w-10" />}
      {showLogo ?
        <div className="kta-auth-logo-mark w-10 h-10 rounded-xl bg-white/90 border border-white shadow-sm flex items-center justify-center overflow-hidden">
          <KtaLogoMark size={26} />
        </div> :
        <div className="w-10" />}
    </div>
  );
}

export function KtaSegmentTabs<T extends string>({
  tabs,
  active,
  onChange
}: {
  tabs: { id: T; label: string; icon: React.ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="kta-segmented grid grid-cols-3 gap-1 p-1">
      {tabs.map(({ id, label, icon }) =>
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`kta-segment-tab h-11 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
            active === id ?
              'kta-segment-tab-active bg-[#1a3d42] text-white shadow-sm' :
              'text-slate-500 hover:text-slate-700'
          }`}>
          {icon}
          <span className="truncate">{label}</span>
        </button>
      )}
    </div>
  );
}

export function KtaInfoBox({
  icon,
  children
}: {
  icon?: 'message' | 'shield';
  children: React.ReactNode;
}) {
  const Icon = icon === 'shield' ? ShieldCheck : MessageCircle;
  return (
    <div className="kta-info-box flex items-start gap-2.5 p-3.5 rounded-2xl">
      <Icon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" strokeWidth={2} />
      <p className="text-[13px] text-slate-600 leading-relaxed">{children}</p>
    </div>
  );
}

export function KtaGradientButton({
  children,
  onClick,
  disabled,
  loading,
  className = ''
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`kta-gradient-btn w-full h-[54px] rounded-2xl font-semibold text-[16px] text-white flex items-center justify-center gap-1.5 transition-opacity ${disabled || loading ? 'opacity-45 cursor-not-allowed' : ''} ${className}`}>
      {loading ? 'Please wait…' : children}
    </motion.button>
  );
}

export function KtaBiometricButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="kta-biometric-btn w-[54px] h-[54px] shrink-0 rounded-2xl flex items-center justify-center"
      aria-label="Sign in with biometrics">
      <Fingerprint className="w-6 h-6 text-[#1a3d42]" strokeWidth={1.75} />
    </button>
  );
}

function AppleLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 814 1000"
      fill="currentColor"
      aria-hidden>
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-163.7-39.5c-76.5 0-103.7 40.8-165.9 40.8s-106.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}

export function KtaSocialLogin() {
  return (
    <div className="kta-social-login space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200/90" />
        <span className="text-[13px] text-slate-400 font-medium">or continue with</span>
        <div className="flex-1 h-px bg-slate-200/90" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="kta-social-btn h-[52px] rounded-2xl flex items-center justify-center gap-2.5 text-[14px] font-semibold text-slate-700">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>
        <button type="button" className="kta-social-btn h-[52px] rounded-2xl flex items-center justify-center gap-2.5 text-[14px] font-semibold text-slate-700">
          <AppleLogo className="text-[#0B1320] shrink-0" />
          Apple
        </button>
      </div>
    </div>
  );
}

export function KtaStepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-5">
      {Array.from({ length: total }).map((_, i) =>
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i <= step ? 'kta-step-active' : 'bg-slate-200'
          }`}
        />
      )}
    </div>
  );
}
