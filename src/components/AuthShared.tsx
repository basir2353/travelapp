import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  CheckCircle2,
  User,
  ChevronDown,
  Check,
  X,
  ArrowLeft } from
'lucide-react';
import { KtaLogoMark } from './onboarding/KtaLogoMark';
// --- Illustrations ---
export function WalletIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-teal-200/60 via-teal-200/40 to-blue-200/30 blur-3xl" />
      <motion.div
        animate={{
          y: [0, -12, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-4 left-6 w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-xl flex items-center justify-center text-white font-bold text-lg">
        
        ฿
      </motion.div>
      <motion.div
        animate={{
          y: [0, 10, 0]
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5
        }}
        className="absolute top-12 right-4 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-300 to-teal-500 shadow-xl flex items-center justify-center text-white font-bold">
        
        $
      </motion.div>
      <motion.div
        initial={{
          scale: 0.9,
          opacity: 0
        }}
        animate={{
          scale: 1,
          opacity: 1
        }}
        transition={{
          duration: 0.6,
          type: 'spring'
        }}
        className="relative w-[230px] h-[145px]">
        
        <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl opacity-80" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0D9488] via-[#0D9488] to-[#14B8A6] shadow-2xl p-5 text-white overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -right-4 -top-8 w-24 h-24 rounded-full bg-white/10" />
          <div className="flex justify-between items-start relative">
            <span className="text-[11px] font-medium opacity-90">
              Mkash Wallet
            </span>
            <div className="w-7 h-5 rounded bg-white/30" />
          </div>
          <div className="mt-6 text-[11px] opacity-80">Balance</div>
          <div className="text-xl font-bold">ETB 12,450</div>
          <div className="mt-2 text-[11px] tracking-widest opacity-80">
            •••• 4521
          </div>
        </div>
      </motion.div>
      <motion.div
        animate={{
          x: [0, 8, 0]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute bottom-6 right-2 bg-white shadow-xl rounded-2xl px-3 py-2 flex items-center gap-2">
        
        <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
          <Send className="w-3 h-3 text-white" />
        </div>
        <div>
          <div className="text-[11px] text-gray-500 leading-tight">Sent</div>
          <div className="text-[11px] font-bold text-gray-900 leading-tight">
            +ETB 500
          </div>
        </div>
      </motion.div>
      <motion.div
        animate={{
          y: [0, -6, 0]
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.8
        }}
        className="absolute top-20 left-2 bg-white shadow-xl rounded-2xl px-3 py-2 flex items-center gap-2">
        
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
        <span className="text-[11px] font-semibold text-gray-900">
          Instant Transfer
        </span>
      </motion.div>
    </div>);

}
export function BillsIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-teal-200/50 via-pink-200/40 to-orange-200/30 blur-3xl" />
      <motion.div
        initial={{
          rotate: -8,
          opacity: 0,
          x: -20
        }}
        animate={{
          rotate: -6,
          opacity: 1,
          x: 0
        }}
        transition={{
          duration: 0.6,
          type: 'spring'
        }}
        className="absolute left-2 top-6 w-32 h-40 bg-white rounded-2xl shadow-2xl p-3 flex flex-col">
        
        <div className="flex-1 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl p-2 grid grid-cols-6 gap-0.5">
          {Array.from({
            length: 36
          }).map((_, i) =>
          <div
            key={i}
            className="rounded-sm"
            style={{
              background: Math.random() > 0.5 ? '#fff' : 'transparent'
            }} />

          )}
        </div>
        <div className="text-center mt-2 text-[11px] font-semibold text-gray-900">
          Scan to Pay
        </div>
      </motion.div>
      <motion.div
        initial={{
          rotate: 8,
          opacity: 0,
          x: 20
        }}
        animate={{
          rotate: 6,
          opacity: 1,
          x: 0
        }}
        transition={{
          duration: 0.6,
          type: 'spring',
          delay: 0.1
        }}
        className="absolute right-2 top-2 w-32 h-44 bg-white rounded-2xl shadow-2xl p-3">
        
        <div className="flex items-center justify-between mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
            ⚡
          </div>
          <div className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
            PAID
          </div>
        </div>
        <div className="text-[11px] text-gray-500">Electric Bill</div>
        <div className="text-sm font-bold text-gray-900">ETB 240</div>
        <div className="mt-2 space-y-1">
          {[1, 2, 3].map((i) =>
          <div
            key={i}
            className="h-1 rounded-full bg-gray-100"
            style={{
              width: `${100 - i * 15}%`
            }} />

          )}
        </div>
        <div className="mt-3 h-px border-t border-dashed border-gray-200" />
        <div className="mt-2 flex justify-between">
          <span className="text-[11px] text-gray-500">Due</span>
          <span className="text-[11px] font-semibold text-gray-900">Today</span>
        </div>
      </motion.div>
      <motion.div
        initial={{
          y: 20,
          opacity: 0
        }}
        animate={{
          y: 0,
          opacity: 1
        }}
        transition={{
          delay: 0.3,
          duration: 0.5
        }}
        className="relative bg-white rounded-3xl shadow-2xl p-4 grid grid-cols-2 gap-3">
        
        {[
        {
          bg: 'from-cyan-400 to-teal-600',
          label: '📱',
          name: 'Airtime'
        },
        {
          bg: 'from-blue-400 to-blue-600',
          label: '💧',
          name: 'Water'
        },
        {
          bg: 'from-amber-400 to-orange-500',
          label: '⚡',
          name: 'Power'
        },
        {
          bg: 'from-purple-400 to-teal-600',
          label: '📺',
          name: 'DSTV'
        }].
        map((s, i) =>
        <motion.div
          key={s.name}
          animate={{
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2
          }}
          className="flex flex-col items-center">
          
            <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.bg} flex items-center justify-center text-base shadow-lg`}>
            
              {s.label}
            </div>
            <span className="text-[11px] text-gray-600 mt-1 font-medium">
              {s.name}
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>);

}
export function SuperAppIllustration() {
  const services = [
  {
    emoji: '✈️',
    bg: 'from-blue-400 to-blue-600',
    x: '10%',
    y: '5%',
    delay: 0
  },
  {
    emoji: '🛍️',
    bg: 'from-pink-400 to-orange-500',
    x: '70%',
    y: '10%',
    delay: 0.1
  },
  {
    emoji: '🏨',
    bg: 'from-amber-400 to-orange-500',
    x: '78%',
    y: '55%',
    delay: 0.2
  },
  {
    emoji: '🚗',
    bg: 'from-cyan-400 to-teal-500',
    x: '5%',
    y: '60%',
    delay: 0.3
  },
  {
    emoji: '🍔',
    bg: 'from-red-400 to-red-600',
    x: '15%',
    y: '35%',
    delay: 0.4
  },
  {
    emoji: '🎬',
    bg: 'from-purple-400 to-teal-600',
    x: '72%',
    y: '32%',
    delay: 0.5
  }];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-sky-200/50 via-teal-200/40 to-pink-200/30 blur-3xl" />
      {services.map((s, i) =>
      <motion.div
        key={i}
        initial={{
          scale: 0,
          opacity: 0
        }}
        animate={{
          scale: 1,
          opacity: 1,
          y: [0, -8, 0]
        }}
        transition={{
          scale: {
            delay: s.delay,
            type: 'spring',
            stiffness: 300
          },
          opacity: {
            delay: s.delay
          },
          y: {
            duration: 3,
            repeat: Infinity,
            delay: s.delay,
            ease: 'easeInOut'
          }
        }}
        className="absolute"
        style={{
          left: s.x,
          top: s.y
        }}>
        
          <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.bg} shadow-xl flex items-center justify-center text-xl`}>
          
            {s.emoji}
          </div>
        </motion.div>
      )}
      <motion.div
        initial={{
          scale: 0.8,
          opacity: 0
        }}
        animate={{
          scale: 1,
          opacity: 1
        }}
        transition={{
          duration: 0.6,
          type: 'spring'
        }}
        className="relative w-32 h-52 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl p-2 border-4 border-gray-900">
        
        <div className="w-full h-full bg-gradient-to-br from-[#0D9488] via-[#0D9488] to-[#14B8A6] rounded-2xl p-3 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div className="w-4 h-1 rounded-full bg-white/40" />
            <div className="w-1 h-1 rounded-full bg-white/40" />
          </div>
          <div className="text-white text-[11px] font-medium opacity-80">
            Super App
          </div>
          <div className="text-white text-xs font-bold">All Services</div>
          <div className="flex-1 mt-3 grid grid-cols-3 gap-1.5">
            {Array.from({
              length: 9
            }).map((_, i) =>
            <motion.div
              key={i}
              animate={{
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.15
              }}
              className="aspect-square bg-white/20 rounded-lg backdrop-blur-sm" />

            )}
          </div>
        </div>
      </motion.div>
    </div>);

}
export function KYCIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-teal-200/50 via-teal-200/40 to-cyan-200/30 blur-3xl" />
      {[0, 1, 2].map((i) =>
      <motion.div
        key={i}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.6, 0, 0.6]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          delay: i * 0.6,
          ease: 'easeOut'
        }}
        className="absolute w-32 h-32 rounded-full border-2 border-cyan-400" />

      )}
      <motion.div
        initial={{
          scale: 0,
          rotate: -180
        }}
        animate={{
          scale: 1,
          rotate: 0
        }}
        transition={{
          duration: 0.7,
          type: 'spring'
        }}
        className="relative w-28 h-32 bg-gradient-to-br from-[#0D9488] via-[#0D9488] to-[#14B8A6] rounded-[40%_40%_50%_50%/30%_30%_70%_70%] shadow-2xl flex items-center justify-center">
        
        <div className="absolute inset-2 rounded-[40%_40%_50%_50%/30%_30%_70%_70%] bg-white/10" />
        <CheckCircle2
          className="w-12 h-12 text-white relative"
          strokeWidth={2.5} />
        
      </motion.div>
      <motion.div
        initial={{
          x: -50,
          opacity: 0,
          rotate: -12
        }}
        animate={{
          x: 0,
          opacity: 1,
          rotate: -10
        }}
        transition={{
          delay: 0.3,
          duration: 0.5
        }}
        className="absolute left-2 bottom-8 w-32 h-20 bg-white rounded-xl shadow-2xl p-2 flex gap-2">
        
        <div className="w-12 h-full rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <User className="w-6 h-6 text-gray-500" />
        </div>
        <div className="flex-1 flex flex-col justify-center gap-1">
          <div className="text-[7px] font-bold text-gray-900">FAYDA ID</div>
          <div className="h-1 rounded-full bg-gray-200 w-full" />
          <div className="h-1 rounded-full bg-gray-200 w-3/4" />
          <div className="h-1 rounded-full bg-cyan-400 w-2/3" />
        </div>
      </motion.div>
      <motion.div
        initial={{
          x: 50,
          opacity: 0,
          rotate: 12
        }}
        animate={{
          x: 0,
          opacity: 1,
          rotate: 8
        }}
        transition={{
          delay: 0.4,
          duration: 0.5
        }}
        className="absolute right-2 top-8 w-20 h-24 bg-white rounded-xl shadow-2xl p-2">
        
        <div className="w-full h-full rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 relative overflow-hidden flex items-center justify-center">
          <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-cyan-400" />
          <User className="w-8 h-8 text-white/50" />
          <motion.div
            animate={{
              y: [-30, 30, -30]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          
        </div>
      </motion.div>
    </div>);

}
// --- Auth v2 layout (onboarding / login / signup) ---

/** Soft travel + fintech gradient backdrop used behind auth screens. */
export function AuthBackdrop({ variant = 'teal' }: { variant?: 'teal' | 'sunset' | 'sky' }) {
  const gradients = {
    teal: 'from-[#0D9488]/20 via-teal-50 to-sky-100',
    sunset: 'from-orange-100/80 via-teal-50 to-pink-50',
    sky: 'from-sky-100 via-teal-50 to-emerald-50'
  };
  return (
    <div className="auth-backdrop pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradients[variant]}`} />
      <div className="auth-backdrop-blob auth-backdrop-blob-a" />
      <div className="auth-backdrop-blob auth-backdrop-blob-b" />
      <div className="auth-backdrop-blob auth-backdrop-blob-c" />
    </div>
  );
}

/** White rounded sheet anchored to the bottom — matches modern onboarding refs. */
export function AuthBottomSheet({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`auth-bottom-sheet relative z-10 shrink-0 rounded-t-[28px] sm:rounded-t-[32px] bg-white/95 backdrop-blur-xl border-t border-white/80 shadow-[0_-12px_40px_rgba(15,23,42,0.08)] px-5 sm:px-6 pt-5 sm:pt-6 pb-cta-safe ${className}`}>
      <div className="auth-bottom-sheet-handle mx-auto mb-4" />
      {children}
    </div>
  );
}

/** Landing after onboarding slides — Create account vs Log in. */
export function AuthChoiceScreen({
  onRegister,
  onLogin,
  onBack
}: {
  onRegister: () => void;
  onLogin: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="auth-screen flex flex-col h-full min-h-0 relative overflow-hidden">
      <AuthBackdrop variant="sunset" />
      <div className="relative z-10 flex items-center justify-between px-5 pt-safe pb-2 shrink-0">
        {onBack ?
          <button
            type="button"
            onClick={onBack}
            className="auth-icon-btn"
            aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button> :
          <div className="w-10" />}
        <KtaLogoMark size={30} />
        <div className="w-10" />
      </div>

      <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center px-6 pb-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="auth-choice-hero w-full max-w-[320px] aspect-square max-h-[42vh] rounded-[32px] bg-gradient-to-br from-[#0D9488]/15 via-white/60 to-sky-100/80 border border-white/70 shadow-[0_20px_60px_rgba(13,148,136,0.12)] flex items-center justify-center overflow-hidden">
          <SuperAppIllustration />
        </motion.div>
      </div>

      <AuthBottomSheet>
        <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#0D9488] mb-2 text-center">
          KTA Travel
        </div>
        <h1 className="text-[26px] sm:text-[28px] font-bold text-gray-900 text-center leading-tight tracking-tight mb-2">
          Book flights, hotels & more
        </h1>
        <p className="text-[14px] text-gray-500 text-center leading-relaxed mb-6 max-w-[300px] mx-auto">
          One wallet for travel, bills, and everyday payments across Africa and beyond.
        </p>
        <GradientButton onClick={onRegister}>Create account</GradientButton>
        <button
          type="button"
          onClick={onLogin}
          className="auth-outline-btn w-full mt-3">
          I already have an account
        </button>
      </AuthBottomSheet>
    </div>
  );
}

// --- Shared UI ---
export function AuthShell({
  children,
  footer,
  onBack,
  step,
  totalSteps,
  title
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  onBack?: () => void;
  step?: number;
  totalSteps?: number;
  title?: string;
}) {
  return (
    <div className="auth-screen flex flex-col h-full bg-transparent min-w-0 relative overflow-hidden">
      <AuthBackdrop variant="teal" />
      <div className="relative z-10 shrink-0 flex items-center justify-between px-4 sm:px-6 pt-safe pb-2 gap-2 min-w-0">
        {onBack ? (
          <button
            onClick={onBack}
            className="auth-icon-btn"
            aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-primary" strokeWidth={2.25} />
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}
        {title ? (
          <h1 className="text-[15px] font-semibold text-text-primary truncate text-center flex-1 px-2">
            {title}
          </h1>
        ) : (
          <KtaLogoMark size={26} />
        )}
        <div className="w-10 h-10" />
      </div>
      {step !== undefined && totalSteps !== undefined && (
        <div className="relative z-10 shrink-0 px-6 flex gap-1.5 mb-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`auth-step-bar ${i <= step ? 'auth-step-bar-active' : ''}`}
            />
          ))}
        </div>
      )}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto flex flex-col no-scrollbar">
        <div className="auth-form-card mx-4 sm:mx-5 mb-4 rounded-[24px] bg-white/90 backdrop-blur-md border border-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.06)] overflow-hidden">
          {children}
        </div>
      </div>
      {footer ? (
        <div className="relative z-10 shrink-0 px-5 sm:px-6 pt-3 pb-cta-safe bg-white/80 backdrop-blur-md border-t border-black/[0.04]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
export function PremiumInput({
  icon,
  label,
  className = '',
  ...props
}: {icon?: React.ReactNode;label?: string;} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="min-w-0 overflow-visible">
      {label &&
      <label className="ui-form-label ml-0.5 overflow-visible leading-normal">
          {label}
        </label>
      }
      <div className="relative min-w-0">
        {icon &&
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10 flex items-center justify-center">
            {icon}
          </div>
        }
        <input
          {...props}
          className={`ui-input ${icon ? 'pl-11' : ''} ${className}`.trim()} />
      </div>
    </div>);

}
export function PremiumSelect({
  icon,
  label,
  placeholder,
  value,
  options,
  onChange,
  searchable = false,
  disabled = false













}: {icon?: React.ReactNode;label?: string;placeholder: string;value: string;options: {value: string;label: string;emoji?: string;}[];onChange: (v: string) => void;searchable?: boolean;disabled?: boolean;}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filtered =
  searchable && query ?
  options.filter((o) =>
  o.label.toLowerCase().includes(query.toLowerCase())
  ) :
  options;
  const selected = options.find((o) => o.value === value);
  return (
    <>
      <div>
        {label &&
        <label className="ui-form-label ml-0.5">
            {label}
          </label>
        }
        <button
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled}
          className={`relative w-full h-[52px] rounded-ios-md text-left transition-all duration-ios flex items-center ${disabled ? 'glass-muted opacity-60 cursor-not-allowed' : 'glass-input hover:bg-white/65'} ${icon ? 'pl-12' : 'pl-4'} pr-12`}>
          
          {icon &&
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          }
          {selected ?
          <span className="text-[15px] text-gray-900 flex items-center gap-2">
              {selected.emoji && <span>{selected.emoji}</span>}
              {selected.label}
            </span> :

          <span className="text-[15px] text-gray-400">{placeholder}</span>
          }
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </button>
      </div>
      <AnimatePresence>
        {open &&
        <>
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
            onClick={() => {
              setOpen(false);
              setQuery('');
            }}
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
                  {label || 'Select'}
                </h3>
                <button
                onClick={() => {
                  setOpen(false);
                  setQuery('');
                }}
                className="w-9 h-9 rounded-full glass-btn-ghost flex items-center justify-center">
                
                  <X className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
              {searchable &&
            <div className="px-5 pb-3">
                  <input
                autoFocus
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ui-input h-11 text-[14px]" />
              
                </div>
            }
              <div className="overflow-y-auto flex-1 px-2 pb-sheet-safe">
                {filtered.length === 0 ?
              <div className="text-center text-[13px] text-gray-400 py-8">
                    No results
                  </div> :

              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-ios-md transition-all duration-ios ${isSelected ? 'bg-primary-light' : 'hover:bg-surface-muted'}`}>
                    
                        {opt.emoji &&
                    <span className="text-xl">{opt.emoji}</span>
                    }
                        <span
                      className={`flex-1 text-left text-[15px] ${isSelected ? 'font-semibold text-[#0D9488]' : 'text-gray-900'}`}>
                      
                          {opt.label}
                        </span>
                        {isSelected &&
                    <Check
                      className="w-5 h-5 text-[#0D9488]"
                      strokeWidth={2.5} />

                    }
                      </button>);

              })
              }
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>
    </>);

}
export function GradientButton({
  children,
  onClick,
  disabled,
  loading,
  className = ''






}: {children: React.ReactNode;onClick?: () => void;disabled?: boolean;loading?: boolean;className?: string;}) {
  return (
    <motion.button
      whileTap={
      disabled ?
      undefined :
      {
        scale: 0.97
      }
      }
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative w-full h-14 rounded-2xl font-semibold text-[16px] flex items-center justify-center gap-2 overflow-hidden transition-all duration-ios ${disabled || loading ? 'bg-ios-fill text-text-tertiary' : 'kta-gradient-btn text-white shadow-[0_6px_20px_rgba(26,61,66,0.25)] active:scale-[0.98]'} ${className}`}>
      
      {!disabled && !loading &&
      <motion.div
        animate={{
          x: ['-100%', '200%']
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'linear'
        }}
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      }
      {loading ?
      <motion.div
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
        className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full" /> :


      <span className="relative inline-flex items-center justify-center gap-2">{children}</span>
      }
    </motion.button>);

}
export const LOCATIONS: Record<
  string,
  {
    flag: string;
    regions: Record<string, string[]>;
  }> =
{
  Ethiopia: {
    flag: '🇪🇹',
    regions: {
      'Addis Ababa': ['Addis Ababa'],
      Oromia: ['Adama', 'Jimma', 'Bishoftu', 'Shashamane', 'Nekemte', 'Asella'],
      Amhara: ['Bahir Dar', 'Gondar', 'Dessie', 'Debre Birhan', 'Debre Markos'],
      Tigray: ['Mekele', 'Adigrat', 'Axum', 'Shire'],
      Sidama: ['Hawassa', 'Yirgalem'],
      SNNPR: ['Arba Minch', 'Sodo', 'Hosaena'],
      Afar: ['Semera', 'Asaita', 'Dubti'],
      Somali: ['Jigjiga', 'Degehabur'],
      'Benishangul-Gumuz': ['Assosa'],
      Gambela: ['Gambela'],
      Harari: ['Harar'],
      'Dire Dawa': ['Dire Dawa']
    }
  },
  Kenya: {
    flag: '🇰🇪',
    regions: {
      Nairobi: ['Nairobi'],
      Mombasa: ['Mombasa'],
      Kisumu: ['Kisumu'],
      Nakuru: ['Nakuru']
    }
  },
  Djibouti: {
    flag: '🇩🇯',
    regions: {
      Djibouti: ['Djibouti City'],
      Tadjourah: ['Tadjourah'],
      'Ali Sabieh': ['Ali Sabieh']
    }
  },
  Sudan: {
    flag: '🇸🇩',
    regions: {
      Khartoum: ['Khartoum', 'Omdurman'],
      'Red Sea': ['Port Sudan']
    }
  },
  Eritrea: {
    flag: '🇪🇷',
    regions: {
      Maekel: ['Asmara'],
      Anseba: ['Keren'],
      'Northern Red Sea': ['Massawa']
    }
  },
  Somalia: {
    flag: '🇸🇴',
    regions: {
      Banaadir: ['Mogadishu'],
      Woqooyi: ['Hargeisa']
    }
  }
};