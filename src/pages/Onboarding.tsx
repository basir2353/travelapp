import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Phone,
  Lock,
  User,
  Mail,
  Calendar,
  MapPin,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  Globe,
  Fingerprint } from
'lucide-react';
import { useAuth } from '../components/AuthContext';
import { NumPad } from '../components/NumPad';
import { ForgotPinFlow } from '../components/ForgotPinFlow';
import demoProfile from '../assets/demo-profile.png';
import {
  AuthShell,
  PremiumInput,
  GradientButton,
  AuthBackdrop,
  AuthBottomSheet,
  AuthChoiceScreen } from
'../components/AuthShared';
import { CountryDialPhoneField } from '../components/CountryDialPhoneField';
import {
  buildInternationalMobile,
  findDialOption
} from '../data/dialCodes';
import {
  loginWithUsernamePassword,
  loginWithPhoneEmailPassword,
  travellerUserValidation,
  travellerDashboard,
  loadSignupCreds,
  clearSignupCreds,
  loginWithRetry,
  rememberWalletUserId,
  type TravellerAuthResult,
  type TravellerProfile
} from '../services/guestApi';
import { formatTravelApiError } from '../components/travel/TravelErrorState';
import {
  issueEmailOtp,
  issueSignupEmailOtp,
  verifyOtpCode,
  maskOtpDestination,
  markOtpIssued
} from '../services/otpService';
import { formatWalletCreditLabel, formatWalletCreditAmount } from '../utils/walletCredit';
import {
  useTravelCurrency,
  applyCurrencyFromSignupCountry,
  SOURCE_CURRENCY
} from '../hooks/useTravelCurrency';
import {
  KtaWelcomeIllustration,
  KtaFlightsIllustration,
  KtaHotelsIllustration,
  KtaItineraryIllustration,
  KtaVisaIllustration
} from '../components/onboarding/KtaOnboardingIllustrations';
import { KtaTravelWordmark } from '../components/onboarding/KtaTravelWordmark';
import {
  KtaAuthBackdrop,
  KtaAuthHeader,
  KtaBiometricButton,
  KtaGradientButton,
  KtaInfoBox,
  KtaSegmentTabs,
  KtaSocialLogin
} from '../components/onboarding/KtaAuthUi';
import { KtaLogoMark } from '../components/onboarding/KtaLogoMark';
import { RegisterV2Screen } from './RegisterV2Screen';

// --- Welcome Carousel (KTA Travel) ---
const slides = [
  {
    id: 1,
    eyebrow: 'Welcome to KTA Travel',
    eyebrowColor: '#E85D4C',
    title: 'Every Journey,\nOne App',
    description:
      'Flights, hotels, tours, holidays, cars, visas and trains — always priced in ETB, payable in USD, EUR, GBP, AED and more.',
    Illustration: KtaWelcomeIllustration,
    bgGradient: 'from-slate-50 via-white to-teal-50/40'
  },
  {
    id: 2,
    eyebrow: 'Flights & Fares',
    eyebrowColor: '#0B1320',
    title: 'Fly Anywhere,\nFor Less',
    description:
      'Compare 600+ airlines in one search and get told the moment your fare drops.',
    Illustration: KtaFlightsIllustration,
    bgGradient: 'from-teal-50/90 to-cyan-50/30'
  },
  {
    id: 3,
    eyebrow: 'Hotels & Holidays',
    eyebrowColor: '#E85D4C',
    title: 'Stays and Packages,\nSorted',
    description:
      'Rooms with free cancellation, or a whole holiday bundled with your flight for less.',
    Illustration: KtaHotelsIllustration,
    bgGradient: 'from-amber-50/80 to-rose-50/30'
  },
  {
    id: 4,
    eyebrow: 'Trains, Cars & Tours',
    eyebrowColor: '#0D9488',
    title: 'Every Leg in One\nItinerary',
    description:
      'Rail seats, car hire and guided days sit together — shift one and we move the rest.',
    Illustration: KtaItineraryIllustration,
    bgGradient: 'from-sky-50/90 to-teal-50/30'
  },
  {
    id: 5,
    eyebrow: 'Visas & Support',
    eyebrowColor: '#0B1320',
    title: 'Visas Approved,\nStress Free',
    description:
      'We prep the paperwork, track the decision and answer you in under two minutes.',
    Illustration: KtaVisaIllustration,
    bgGradient: 'from-teal-50/80 to-cyan-50/30'
  }
];

function WelcomeCarousel({
  onNext,
  onLogin



}: {onNext: () => void;onLogin: () => void;}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLast = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];
  const Illustration = slide.Illustration;
  return (
    <div className="onboard-screen flex flex-col h-full min-h-0 bg-white relative overflow-hidden">
      <div className="onboard-header flex items-center justify-between px-6 pt-safe pb-3 shrink-0">
        <KtaTravelWordmark size={28} />
        {!isLast ?
        <button
          type="button"
          onClick={() => setCurrentSlide(slides.length - 1)}
          className="onboard-skip-btn text-[13px] font-semibold text-slate-400 hover:text-slate-600 transition-colors px-2 py-1">
          Skip
        </button> :
        <div className="w-[44px]" />}
      </div>

      <div className="onboard-content flex-1 min-h-0 flex flex-col px-6 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={`illu-${currentSlide}`}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="onboard-hero-slot shrink-0 mb-6">
            <Illustration />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${currentSlide}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="onboard-copy flex-1 min-h-0">
            <div
              className="onboard-eyebrow text-[11px] font-bold tracking-[0.12em] uppercase mb-2"
              style={{ color: slide.eyebrowColor }}>
              {slide.eyebrow}
            </div>
            <h1 className="onboard-title text-[28px] sm:text-[30px] font-bold text-[#0B1320] leading-[1.12] tracking-tight mb-3 whitespace-pre-line">
              {slide.title}
            </h1>
            <p className="onboard-body text-[15px] text-slate-500 leading-[1.55] max-w-[340px]">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="onboard-footer shrink-0 px-6 pb-cta-safe pt-1">
        <div className="onboard-dots flex items-center gap-2 mb-6">
          {slides.map((_, i) =>
          <button
            key={i}
            type="button"
            onClick={() => setCurrentSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === currentSlide ? 'step' : undefined}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-7 bg-[#0B1320]' : 'w-1.5 bg-slate-200'}`} />
          )}
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => isLast ? onNext() : setCurrentSlide((s) => s + 1)}
          className={`onboard-cta w-full h-[54px] rounded-2xl font-semibold text-[16px] flex items-center justify-center gap-1.5 text-white transition-all ${isLast ? 'onboard-cta-gradient' : 'bg-[#0B1320] shadow-[0_6px_20px_rgba(11,19,32,0.22)]'}`}>
          <span>{isLast ? 'Get started' : 'Continue'}</span>
          <ChevronRight className="w-5 h-5" strokeWidth={2.25} />
        </motion.button>

        <button
          type="button"
          onClick={onLogin}
          className="onboard-secondary-link w-full mt-4 py-2 text-[14px] font-semibold text-slate-500 hover:text-slate-700 transition-colors">
          I already have an account
        </button>
      </div>
    </div>);
}
// --- Login Screen (PIN unlock style) ---
function LoginScreen({
  onBack,
  onRegister



}: {onBack: () => void;onRegister: () => void;}) {
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  // Pull any previously-saved profile so we can greet a returning user
  const savedProfile = (() => {
    try {
      const raw = localStorage.getItem('mkash-profile');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const firstName = savedProfile?.firstName || 'Demo';
  const phone = savedProfile?.phone || '912345678';
  const hour = new Date().getHours();
  const greeting =
  hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const handleKey = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      if (newPin.length === 4) {
        setTimeout(() => {
          if (!login(phone, newPin)) {
            setError(true);
            setTimeout(() => {
              setPin('');
              setError(false);
            }, 600);
          }
        }, 300);
      }
    }
  };
  const handleDelete = () => {
    setError(false);
    setPin(pin.slice(0, -1));
  };
  const handleBiometric = () => {
    setBiometricLoading(true);
    setTimeout(() => {
      setBiometricLoading(false);
      login(phone, '0000');
    }, 1200);
  };
  return (
    <div className="relative min-h-[100dvh] h-full overflow-y-auto no-scrollbar ui-app-bg">
      {/* Top gradient hero */}
      <div className="relative pt-12 pb-6 px-6 bg-gradient-to-br from-teal-50 via-teal-50/70 to-blue-50 overflow-hidden">
        <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-gradient-to-br from-teal-200/50 to-transparent blur-2xl" />
        <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-gradient-to-br from-blue-200/40 to-transparent blur-2xl" />

        <div className="relative flex items-center justify-between mb-6">
          <KtaLogoMark size={26} />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-pill">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-gray-700">
                Secure
              </span>
            </div>
            <button
              onClick={onBack}
              className="p-1.5 rounded-full glass-pill text-text-secondary active:opacity-80">
              
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative flex flex-col items-center gap-3 mb-2">
          <motion.div
            initial={{
              scale: 0.7,
              opacity: 0
            }}
            animate={{
              scale: 1,
              opacity: 1
            }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20
            }}
            className="relative">
            
            <div className="w-24 h-24 rounded-full border-[4px] border-[#0D9488] overflow-hidden bg-white shadow-lg">
              <img
                src={demoProfile}
                alt={firstName}
                className="w-full h-full object-cover object-[center_15%]" />
              
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-4 h-4 text-[#0D9488]" strokeWidth={2.5} />
            </div>
          </motion.div>

          <div className="text-center">
            <div className="text-[11px] font-semibold text-[#0D9488] tracking-wider uppercase mb-1">
              {greeting}
            </div>
            <h1 className="text-[22px] font-bold text-gray-900 leading-tight">
              Welcome back, {firstName}
            </h1>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col items-center px-6 pt-6 pb-cta-safe">
        <p className="text-[13px] text-gray-500 mb-4">
          Enter your PIN to unlock
        </p>

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
          className="flex gap-3.5 mb-2">
          
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
                className={`w-3.5 h-3.5 rounded-full transition-colors duration-200 ${error ? 'bg-red-500' : filled ? 'bg-gradient-to-br from-[#0D9488] to-[#14B8A6] shadow-[0_2px_8px_rgba(31,170,80,0.4)]' : 'bg-gray-200'}`} />);


          })}
        </motion.div>

        <div className="h-5 text-[12px] mb-5">
          {error &&
          <span className="text-red-500 font-semibold">Incorrect PIN</span>
          }
        </div>

        <NumPad
          variant="soft"
          onKey={handleKey}
          onDelete={handleDelete}
          biometric={true}
          onBiometric={handleBiometric} />
        

        <button
          onClick={() => setForgotOpen(true)}
          className="text-[#0D9488] font-semibold text-[13px] mt-5 mb-2 px-4 py-1.5 rounded-full hover:bg-teal-50 transition-colors">
          
          Forgot PIN?
        </button>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-3">
          <Lock className="w-3 h-3" />
          End-to-end encrypted
        </div>

        <button
          onClick={onRegister}
          className="text-[13px] font-semibold text-gray-500 hover:text-gray-900 transition-colors">
          
          Create new account
        </button>
      </div>

      {biometricLoading &&
      <motion.div
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        className="fixed inset-0 z-[60] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
        
          <motion.div
          animate={{
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity
          }}
          className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-4">
          
            <Fingerprint className="w-10 h-10 text-[#0D9488]" />
          </motion.div>
          <div className="text-[14px] font-semibold text-gray-900">
            Authenticating...
          </div>
        </motion.div>
      }

      <ForgotPinFlow open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>);

}
// --- OTP Verify Screen (signup / recover) — email OTP via TravellerPhoneEmail ---
function OTPVerifyScreen({
  onNext,
  onBack,
  email,
  alreadySent = false,
  signupName = '',
  useSignupApi = false
}: {
  onNext: () => void;
  onBack: () => void;
  email: string;
  /** True when Create Account already called TravellerPhoneEmailSignup */
  alreadySent?: boolean;
  signupName?: string;
  useSignupApi?: boolean;
}) {
  const emailTo = email.trim().toLowerCase();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(!alreadySent);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    alreadySent ?
      `Code sent to ${maskOtpDestination(emailTo || email, 'email')}. Check your inbox and spam folder.` :
      null
  );
  const [resendTimer, setResendTimer] = useState(59);

  const sendCode = async () => {
    setError(null);
    setSending(true);
    try {
      if (!emailTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo)) {
        throw new Error('Enter a valid email address first');
      }
      const sent = useSignupApi ?
        await issueSignupEmailOtp(emailTo, signupName || 'Traveller') :
        await issueEmailOtp(emailTo);
      if (!sent.ok) {
        throw new Error(sent.message || 'Could not send verification code');
      }
      setInfo(sent.message);
      setOtp(['', '', '', '', '', '']);
      setResendTimer(59);
    } catch (err) {
      setError(formatTravelApiError(err, 'Could not send code'));
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (alreadySent) {
      markOtpIssued({ destination: emailTo, channel: 'email' });
      setSending(false);
      return;
    }
    void sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val;
    setOtp(newOtp);
    setError(null);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6 || !emailTo) return;
    setLoading(true);
    setError(null);
    try {
      const verified = await verifyOtpCode(emailTo, code, 'email');
      if (!verified.ok) {
        throw new Error(verified.message);
      }
      onNext();
    } catch (err) {
      setError(formatTravelApiError(err, 'Invalid code'));
    } finally {
      setLoading(false);
    }
  };

  const maskedEmail = maskOtpDestination(emailTo || email, 'email');

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden ui-app-bg">
      <KtaAuthBackdrop />
      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <KtaAuthHeader onBack={onBack} />
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6">
          <div className="mx-auto mb-5 mt-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white bg-white/95 shadow-sm">
            <KtaLogoMark size={36} />
          </div>
          <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0D9488] text-center mb-1.5">
            Email verification
          </div>
          <h1 className="text-[22px] font-bold text-gray-900 text-center leading-tight tracking-tight mb-2">
            Enter the 6-digit code
          </h1>
          <p className="text-[13px] text-gray-500 text-center mb-4 leading-snug">
            {sending ?
              'Sending email verification code…' :
              <>
                We sent an email code to{' '}
                <span className="font-semibold text-gray-900">{maskedEmail}</span>
                .
              </>}
          </p>
          {info && !sending && (
            <p className="text-[12px] text-[#0D7B3E] text-center mb-4 leading-relaxed">
              {info}
            </p>
          )}
          <div className="flex gap-2 justify-center mb-8">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                autoFocus={i === 0}
                maxLength={1}
                value={digit}
                onClick={(e) => (e.target as HTMLInputElement).focus()}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-ios-lg border-2 transition-all duration-ios ${digit ? 'border-primary glass-field-active text-text-primary' : 'glass-field text-text-primary'} focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none`}
              />
            ))}
          </div>
          <p className="text-[13px] text-gray-500 text-center mb-6">
            {resendTimer > 0 ?
              <>
                Resend code in{' '}
                <span className="font-semibold text-gray-900">
                  0:{resendTimer.toString().padStart(2, '0')}
                </span>
              </> :
              <button
                type="button"
                disabled={sending}
                onClick={() => {
                  void sendCode();
                }}
                className="text-[#0D9488] font-semibold">
                Resend code
              </button>}
          </p>
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-700 leading-relaxed">{error}</p>
            </div>
          )}
        </div>
        <div className="shrink-0 px-6 pt-3 pb-cta-safe border-t border-black/[0.04] bg-white/75 backdrop-blur-md">
          <GradientButton
            onClick={() => {
              void handleVerify();
            }}
            disabled={otp.join('').length < 6 || loading || sending}
            loading={loading}>
            Verify & Continue
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
// --- Fayda eKYC Screen ---
function FaydaEKYCScreen({ onNext, onBack, setKycStatus }: any) {
  const [step, setStep] = useState(0);
  const [faydaId, setFaydaId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const handleScan = () => {
    setIsScanning(true);
    setScanComplete(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      if (step === 2)
      setTimeout(() => {
        setStep(3);
        setScanComplete(false);
      }, 800);
    }, 2500);
  };
  const submitKYC = (
  status: 'pending' | 'approved' | 'rejected' | 'under-review') =>
  {
    setKycStatus(status);
    onNext();
  };
  const formatFayda = (v: string) =>
  v.
  replace(/\s/g, '').
  replace(/(.{4})/g, '$1 ').
  trim().
  slice(0, 19);
  return (
    <AuthShell
      onBack={step > 0 ? () => setStep(step - 1) : onBack}
      step={step}
      totalSteps={5}
      title="Identity Verification">
      
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: -20
          }}
          className="px-6 pt-4 pb-6 flex flex-col min-h-full">
          
          {step === 0 &&
          <>
              <motion.div
              initial={{
                scale: 0
              }}
              animate={{
                scale: 1
              }}
              transition={{
                type: 'spring',
                delay: 0.1
              }}
              className="mx-auto mb-6 mt-4">
              
                <div className="relative w-24 h-28 bg-gradient-to-br from-[#0D9488] via-[#0D9488] to-[#14B8A6] rounded-[30%_30%_50%_50%/25%_25%_75%_75%] shadow-xl flex items-center justify-center">
                  <ShieldCheck
                  className="w-12 h-12 text-white"
                  strokeWidth={2.2} />
                
                </div>
              </motion.div>
              <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0D9488] text-center mb-2">
                Fayda eKYC
              </div>
              <h1 className="text-[26px] font-bold text-gray-900 text-center leading-tight tracking-tight mb-3">
                Verify your identity
                <br />
                in 2 minutes
              </h1>
              <p className="text-[14px] text-gray-500 text-center mb-10 leading-relaxed">
                We'll verify your details with the Fayda national ID system.
                Your data is encrypted.
              </p>
              <div className="mt-auto">
                <GradientButton onClick={() => setStep(1)}>
                  Start Verification{' '}
                  <ChevronRight className="w-5 h-5 relative" />
                </GradientButton>
              </div>
            </>
          }
          {step === 1 &&
          <>
              <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0D9488] mb-2">
                Step 1
              </div>
              <h1 className="text-[26px] font-bold text-gray-900 leading-tight tracking-tight mb-3">
                Enter your
                <br />
                Fayda ID number
              </h1>
              <p className="text-[14px] text-gray-500 mb-8 leading-relaxed">
                Look for the 16-digit number on the front of your Fayda card.
              </p>
              <div className="relative mb-8 mx-auto w-full max-w-[280px] aspect-[1.6] rounded-2xl bg-gradient-to-br from-[#0D9488] via-[#0D9488] to-[#14B8A6] shadow-xl p-4 overflow-hidden">
                <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="flex justify-between items-start relative">
                  <div>
                    <div className="text-white/80 text-[11px] font-semibold tracking-wider">
                      FEDERAL DEMOCRATIC
                    </div>
                    <div className="text-white text-[11px] font-bold">
                      REPUBLIC OF ETHIOPIA
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white/20" />
                </div>
                <div className="mt-6 text-white/70 text-[11px]">FAN</div>
                <div className="text-white text-[16px] font-bold tracking-widest">
                  {faydaId.length > 0 ?
                formatFayda(faydaId) :
                'XXXX XXXX XXXX XXXX'}
                </div>
              </div>
              <PremiumInput
              icon={<CreditCard className="w-5 h-5" />}
              label="Fayda ID Number"
              placeholder="XXXX XXXX XXXX XXXX"
              value={formatFayda(faydaId)}
              onChange={(e) => setFaydaId(e.target.value.replace(/\s/g, ''))}
              maxLength={19} />
            
              <div className="mt-auto pt-6">
                <GradientButton
                onClick={() => setStep(2)}
                disabled={faydaId.length < 12}>
                
                  Continue <ChevronRight className="w-5 h-5 relative" />
                </GradientButton>
              </div>
            </>
          }
          {step === 2 &&
          <>
              <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0D9488] mb-2">
                Step 2
              </div>
              <h1 className="text-[26px] font-bold text-gray-900 leading-tight tracking-tight mb-3">
                Scan your
                <br />
                Fayda card
              </h1>
              <p className="text-[14px] text-gray-500 mb-8 leading-relaxed">
                Position your card flat within the frame and hold steady.
              </p>
              <div className="relative w-full aspect-[1.5] rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden mb-6 flex items-center justify-center shadow-2xl">
                {!scanComplete &&
              [
              'top-4 left-4 border-t-4 border-l-4',
              'top-4 right-4 border-t-4 border-r-4',
              'bottom-4 left-4 border-b-4 border-l-4',
              'bottom-4 right-4 border-b-4 border-r-4'].
              map((pos, i) =>
              <div
                key={i}
                className={`absolute ${pos} w-8 h-8 border-cyan-400 rounded-md`} />

              )}
                {isScanning &&
              <motion.div
                animate={{
                  top: ['10%', '90%', '10%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
                className="absolute left-4 right-4 h-1 bg-cyan-400 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.9)] z-10" />

              }
                {scanComplete ?
              <motion.div
                initial={{
                  scale: 0
                }}
                animate={{
                  scale: 1
                }}
                className="w-20 h-20 rounded-full bg-teal-500 flex items-center justify-center">
                
                    <CheckCircle2
                  className="w-12 h-12 text-white"
                  strokeWidth={2.5} />
                
                  </motion.div> :

              <div className="w-[80%] aspect-[1.6] rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center">
                    <CreditCard className="w-10 h-10 text-white/40" />
                  </div>
              }
              </div>
              <div className="text-center text-[13px] text-gray-500 mb-auto">
                {isScanning ?
              '📸 Scanning...' :
              scanComplete ?
              '✓ Card captured successfully' :
              'Tap below to capture'}
              </div>
              <div className="pt-6">
                <GradientButton
                onClick={handleScan}
                disabled={scanComplete}
                loading={isScanning}>
                
                  {scanComplete ? 'Captured' : 'Capture Card'}
                </GradientButton>
              </div>
            </>
          }
          {step === 3 &&
          <>
              <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0D9488] mb-2">
                Step 3
              </div>
              <h1 className="text-[26px] font-bold text-gray-900 leading-tight tracking-tight mb-3">
                Selfie &<br />
                liveness check
              </h1>
              <p className="text-[14px] text-gray-500 mb-8 leading-relaxed">
                Center your face and follow the on-screen prompts.
              </p>
              <div className="relative mx-auto mb-6">
                {isScanning &&
              [0, 1].map((i) =>
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 1,
                  ease: 'easeOut'
                }}
                className="absolute inset-0 rounded-full bg-cyan-400" />

              )}
                <div className="relative w-56 h-56 rounded-full bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden border-[6px] border-white shadow-2xl flex items-center justify-center">
                  {!scanComplete &&
                <svg
                  viewBox="0 0 200 220"
                  className="absolute w-[80%] h-[90%]">
                  
                      <ellipse
                    cx="100"
                    cy="110"
                    rx="70"
                    ry="90"
                    fill="none"
                    stroke="rgba(16, 185, 129, 0.8)"
                    strokeWidth="3"
                    strokeDasharray="8 6" />
                  
                    </svg>
                }
                  {scanComplete ?
                <motion.div
                  initial={{
                    scale: 0
                  }}
                  animate={{
                    scale: 1
                  }}
                  className="w-20 h-20 rounded-full bg-teal-500 flex items-center justify-center">
                  
                      <CheckCircle2
                    className="w-12 h-12 text-white"
                    strokeWidth={2.5} />
                  
                    </motion.div> :

                <User className="w-20 h-20 text-white/30" />
                }
                  {isScanning &&
                <svg
                  className="absolute inset-0 -rotate-90"
                  viewBox="0 0 100 100">
                  
                      <motion.circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="301"
                    initial={{
                      strokeDashoffset: 301
                    }}
                    animate={{
                      strokeDashoffset: 0
                    }}
                    transition={{
                      duration: 2.5,
                      ease: 'linear'
                    }} />
                  
                    </svg>
                }
                </div>
              </div>
              {isScanning &&
            <motion.div
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
              className="text-center text-[14px] font-semibold text-[#0D9488] mb-6">
              
                  Hold still... detecting face
                </motion.div>
            }
              {!isScanning && !scanComplete &&
            <div className="text-center text-[13px] text-gray-500 mb-auto">
                  Make sure your face is well-lit and unobstructed
                </div>
            }
              {scanComplete ?
            <div className="space-y-3 mt-auto pt-6">
                  <GradientButton onClick={() => submitKYC('pending')}>
                    Submit for Verification
                  </GradientButton>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                  onClick={() => submitKYC('under-review')}
                  className="h-11 rounded-ios-md glass-chip text-[12px] font-semibold text-text-secondary">
                  
                      Simulate Review
                    </button>
                    <button
                  onClick={() => submitKYC('rejected')}
                  className="h-11 rounded-ios-md glass-chip text-[12px] font-semibold text-text-secondary">
                  
                      Simulate Reject
                    </button>
                  </div>
                </div> :

            <div className="mt-auto pt-6">
                  <GradientButton onClick={handleScan} loading={isScanning}>
                    {isScanning ? 'Verifying...' : 'Start Liveness Check'}
                  </GradientButton>
                </div>
            }
            </>
          }
        </motion.div>
      </AnimatePresence>
    </AuthShell>);

}
// --- KYC Status Screen ---
function KYCStatusScreen({ onNext, kycStatus, setKycStatus }: any) {
  useEffect(() => {
    if (kycStatus === 'pending') {
      const t = setTimeout(() => setKycStatus('approved'), 2500);
      return () => clearTimeout(t);
    }
    if (kycStatus === 'approved') {
      onNext();
    }
  }, [kycStatus, onNext]);
  if (kycStatus === 'pending' || kycStatus === 'approved') {
    return (
      <div className="glass-screen ui-app-bg items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          {[0, 1, 2].map((i) =>
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.6, 1],
              opacity: [0.6, 0, 0.6]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'easeOut'
            }}
            className="absolute inset-0 rounded-full bg-cyan-400" />

          )}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#0D9488] via-[#0D9488] to-[#14B8A6] flex items-center justify-center shadow-2xl">
            <motion.div
              animate={{
                rotate: 360
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear'
              }}
              className="w-10 h-10 border-[3px] border-white/30 border-t-white rounded-full" />
            
          </div>
        </div>
        <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0D9488] mb-2">
          Processing
        </div>
        <h1 className="text-[24px] font-bold text-gray-900 leading-tight tracking-tight mb-3">
          Verifying with Fayda
        </h1>
        <p className="text-[14px] text-gray-500 leading-relaxed max-w-[280px] mb-8">
          We're matching your details and biometric data with the Fayda national
          database.
        </p>
        <div className="w-full max-w-[280px] space-y-2">
          {[
          'Matching face biometrics',
          'Verifying name & date of birth',
          'Checking for duplicate accounts',
          'Cross-referencing Fayda DB'].
          map((step, i) =>
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              x: -10
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            transition={{
              delay: i * 0.4
            }}
            className="flex items-center gap-2 text-[12px] text-gray-600">
            
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              {step}
            </motion.div>
          )}
        </div>
      </div>);

  }
  if (kycStatus === 'rejected') {
    return (
      <div className="glass-screen ui-app-bg p-6">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{
              scale: 0
            }}
            animate={{
              scale: 1
            }}
            transition={{
              type: 'spring'
            }}
            className="w-24 h-24 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mb-6">
            
            <XCircle className="w-12 h-12 text-red-500" strokeWidth={2.2} />
          </motion.div>
          <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-red-500 mb-2">
            Verification Failed
          </div>
          <h1 className="text-[24px] font-bold text-gray-900 leading-tight tracking-tight mb-3">
            Couldn't verify
            <br />
            your identity
          </h1>
          <p className="text-[14px] text-gray-500 leading-relaxed max-w-[280px] mb-6">
            Face match score below threshold. Please try again with better
            lighting.
          </p>
          <div className="w-full p-4 rounded-2xl bg-red-50 border border-red-100 mb-6">
            <div className="text-[12px] font-semibold text-red-700 mb-1">
              Reason
            </div>
            <div className="text-[13px] text-red-600">
              Face match below threshold. Ensure good lighting and remove
              glasses or face covers.
            </div>
          </div>
        </div>
        <GradientButton onClick={() => setKycStatus('none')}>
          Try Again
        </GradientButton>
      </div>);

  }
  if (kycStatus === 'under-review') {
    return (
      <div className="glass-screen ui-app-bg p-6">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{
              scale: 0
            }}
            animate={{
              scale: 1
            }}
            transition={{
              type: 'spring'
            }}
            className="w-24 h-24 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center mb-6">
            
            <AlertCircle
              className="w-12 h-12 text-amber-500"
              strokeWidth={2.2} />
            
          </motion.div>
          <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-amber-600 mb-2">
            Manual Review
          </div>
          <h1 className="text-[24px] font-bold text-gray-900 leading-tight tracking-tight mb-3">
            Your application
            <br />
            is under review
          </h1>
          <p className="text-[14px] text-gray-500 leading-relaxed max-w-[280px] mb-6">
            We'll notify you within 24 hours. You can continue with limited
            access in the meantime.
          </p>
        </div>
        <GradientButton onClick={onNext}>Continue to App</GradientButton>
      </div>);

  }
  return null;
}
// --- Wallet Activated Screen ---
function WalletActivatedScreen({
  onNext,
  name,
  userId,
  countryCode
}: {
  onNext: () => void;
  name: string;
  userId?: number;
  countryCode?: string;
}) {
  const travelCurrency = useTravelCurrency();
  const [creditLabel, setCreditLabel] = useState('…');
  const [bookingsLabel, setBookingsLabel] = useState('—');
  const [rawCredit, setRawCredit] = useState<string | null>(null);

  // Always lock wallet label to signup country (Ethiopia→ETB, Australia→AUD).
  // Must run even for ETB so a previous AUD preference does not stick.
  useEffect(() => {
    travelCurrency.applyFromSignupCountry(countryCode || 'ET');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode]);

  // Re-label when exchange rate becomes ready.
  useEffect(() => {
    if (!rawCredit) return;
    if (!travelCurrency.ready && travelCurrency.code !== SOURCE_CURRENCY) return;
    setCreditLabel(
      formatWalletCreditLabel(rawCredit, {
        currencyCode: travelCurrency.code,
        rate:
          travelCurrency.code === SOURCE_CURRENCY ? 1 : travelCurrency.rate
      })
    );
  }, [
    rawCredit,
    travelCurrency.code,
    travelCurrency.rate,
    travelCurrency.ready
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadBalance() {
      const fallback = () => {
        if (cancelled) return;
        setRawCredit('ETB 0.00');
        setCreditLabel(
          formatWalletCreditAmount(0, travelCurrency.code || SOURCE_CURRENCY)
        );
        setBookingsLabel('0');
      };

      let id = userId && userId > 0 ? userId : 0;
      let credit: string | null = null;
      let bookings: number | null = null;

      // Resolve dynamic UserID via TravellerLogin when signup id is missing.
      if (!id) {
        const creds = loadSignupCreds();
        if (creds?.username && creds.password) {
          const login = await loginWithRetry(
            loginWithUsernamePassword,
            creds.username,
            creds.password,
            3
          );
          if (login.success && login.session?.userId) {
            id = login.session.userId;
            rememberWalletUserId({
              userId: id,
              email: login.session.email as string | undefined,
              username: login.session.username as string | undefined,
              phone: login.session.mobile as string | undefined
            });
            const dashData = login.dashboard as
              | { availableCredit?: string; totalBookings?: number }
              | undefined;
            if (dashData?.availableCredit) {
              credit = dashData.availableCredit;
              bookings = dashData.totalBookings ?? 0;
            }
          }
        }
      }

      if (!id) {
        fallback();
        return;
      }

      if (!credit) {
        const dash = await travellerDashboard(5, id);
        if (cancelled) return;
        if (dash.success && dash.dashboard) {
          credit = dash.dashboard.availableCredit;
          bookings = dash.dashboard.totalBookings ?? 0;
          rememberWalletUserId({ userId: id });
        }
      }

      if (cancelled) return;
      if (!credit) {
        fallback();
        return;
      }

      setRawCredit(credit);
      setBookingsLabel(String(bookings ?? 0));
      setCreditLabel(
        formatWalletCreditLabel(credit, {
          currencyCode: travelCurrency.code,
          rate:
            travelCurrency.code === SOURCE_CURRENCY ? 1 : travelCurrency.rate
        })
      );
    }

    void loadBalance();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0D9488] via-[#0D9488] to-[#14B8A6] relative overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) =>
      <motion.div
        key={i}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 800, opacity: [0, 1, 1, 0] }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: i * 0.2,
          ease: 'linear'
        }}
        className="absolute w-2 h-2 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          background: ['#FFD700', '#FF6B9D', '#FFFFFF', '#FCD34D'][i % 4]
        }} />
      )}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center text-white relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
          className="relative mb-8">
          {[0, 1].map((i) =>
          <motion.div
            key={i}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 1,
              ease: 'easeOut'
            }}
            className="absolute inset-0 rounded-full bg-white" />
          )}
          <div className="relative w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <CheckCircle2
              className="w-14 h-14 text-[#0D9488]"
              strokeWidth={2.5} />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/80 mb-2">
          Congratulations
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-[32px] font-bold leading-tight tracking-tight mb-3">
          Welcome, {name}!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-white/80 text-[15px] max-w-[280px] mb-8 leading-relaxed">
          Your wallet is active and ready to use.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-[300px] bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 mb-2 text-left">
          <div className="text-[11px] text-white/70 uppercase tracking-wider font-semibold mb-1">
            Available credit
          </div>
          <div className="text-[22px] font-bold tracking-tight tabular-nums">
            {creditLabel}
          </div>
          <div className="mt-3 flex items-center justify-between text-[12px] text-white/75">
            <span>Total bookings</span>
            <span className="font-semibold text-white">{bookingsLabel}</span>
          </div>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="px-6 pb-cta-safe relative z-10">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          className="w-full h-14 rounded-2xl bg-white text-[#0D9488] font-semibold text-[16px] shadow-2xl flex items-center justify-center gap-2">
          Set Up Your PIN <ChevronRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}
// --- Create PIN Screen ---
function CreatePINScreen({ onNext, onBack }: any) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState(false);
  const handleKeyPress = (num: string) => {
    setError(false);
    if (step === 1) {
      if (pin.length < 4) setPin(pin + num);
    } else {
      if (confirmPin.length < 4) setConfirmPin(confirmPin + num);
    }
  };
  const handleDelete = () => {
    setError(false);
    if (step === 1) setPin(pin.slice(0, -1));else
    setConfirmPin(confirmPin.slice(0, -1));
  };
  useEffect(() => {
    if (step === 1 && pin.length === 4) setTimeout(() => setStep(2), 300);
    if (step === 2 && confirmPin.length === 4) {
      if (pin === confirmPin) setTimeout(() => onNext(pin), 500);else
      {
        setTimeout(() => {
          setError(true);
          setTimeout(() => {
            setConfirmPin('');
            setStep(1);
            setPin('');
            setError(false);
          }, 800);
        }, 300);
      }
    }
  }, [pin, confirmPin, step]);
  const currentPin = step === 1 ? pin : confirmPin;
  return (
    <div className="glass-screen ui-app-bg">
      <div className="px-6 pt-3 pb-2 flex items-center justify-between">
        {step === 2 ?
        <button
          onClick={() => {
            setStep(1);
            setPin('');
            setConfirmPin('');
          }}
          className="w-10 h-10 rounded-full glass-btn-ghost flex items-center justify-center">
          
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button> :

        <div className="w-10 h-10" />
        }
        <div className="flex gap-1.5">
          <div
            className={`h-1 w-12 rounded-full ${step >= 1 ? 'bg-[#0D9488]' : 'bg-gray-200'}`} />
          
          <div
            className={`h-1 w-12 rounded-full ${step >= 2 ? 'bg-[#0D9488]' : 'bg-gray-200'}`} />
          
        </div>
        <div className="w-10 h-10" />
      </div>
      <div className="flex-1 flex flex-col items-center px-6 pt-4 pb-cta-safe">
        <motion.div
          key={step}
          initial={{
            scale: 0.8,
            opacity: 0
          }}
          animate={{
            scale: 1,
            opacity: 1
          }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D9488] via-[#0D9488] to-[#14B8A6] shadow-lg flex items-center justify-center mb-6">
          
          <Lock className="w-7 h-7 text-white" />
        </motion.div>
        <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0D9488] mb-2">
          {step === 1 ? 'Create PIN' : 'Confirm PIN'}
        </div>
        <h1 className="text-[24px] font-bold text-gray-900 text-center leading-tight tracking-tight mb-2">
          {step === 1 ? 'Set a 4-digit PIN' : 'Re-enter your PIN'}
        </h1>
        <p className="text-[14px] text-gray-500 text-center mb-10 max-w-[260px]">
          {step === 1 ?
          "You'll use this PIN to access your wallet" :
          'Confirm the PIN you just created'}
        </p>
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
          className="flex gap-4 mb-12">
          
          {[0, 1, 2, 3].map((i) =>
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${error ? 'bg-red-500' : i < currentPin.length ? 'bg-[#0D9488] scale-110' : 'bg-gray-200'}`} />

          )}
        </motion.div>
        <NumPad onKey={handleKeyPress} onDelete={handleDelete} />
      </div>
    </div>);

}
// --- Enter existing PIN (login / recovery) ---
function EnterPINScreen({
  onBack,
  onSubmit,
  error,
  onClearError





}: {onBack: () => void;onSubmit: (pin: string) => void;error: boolean;onClearError: () => void;}) {
  const [pin, setPin] = useState('');
  useEffect(() => {
    if (error) setPin('');
  }, [error]);
  const handleKeyPress = (num: string) => {
    onClearError();
    if (pin.length < 4) {
      const next = pin + num;
      setPin(next);
      if (next.length === 4) setTimeout(() => onSubmit(next), 200);
    }
  };
  const handleDelete = () => {
    onClearError();
    setPin(pin.slice(0, -1));
  };
  return (
    <div className="glass-screen ui-app-bg">
      <div className="px-6 pt-3 pb-2">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full glass-btn-ghost flex items-center justify-center"
          aria-label="Back">
          
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center px-6 pt-4 pb-cta-safe">
        <motion.div
          initial={{
            scale: 0.8,
            opacity: 0
          }}
          animate={{
            scale: 1,
            opacity: 1
          }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D9488] via-[#0D9488] to-[#14B8A6] shadow-lg flex items-center justify-center mb-6">
          
          <Lock className="w-7 h-7 text-white" />
        </motion.div>
        <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0D9488] mb-2">
          Enter PIN
        </div>
        <h1 className="text-[24px] font-bold text-gray-900 text-center leading-tight tracking-tight mb-2">
          Enter your PIN
        </h1>
        <p className="text-[14px] text-gray-500 text-center mb-10 max-w-[260px]">
          Enter the 4-digit PIN you set during registration
        </p>
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
          className="flex gap-4 mb-3">
          
          {[0, 1, 2, 3].map((i) =>
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${error ? 'bg-red-500' : i < pin.length ? 'bg-[#0D9488] scale-110' : 'bg-gray-200'}`} />

          )}
        </motion.div>
        <div className="h-5 text-[12px] mb-7">
          {error &&
          <span className="text-red-500 font-semibold">Incorrect PIN</span>
          }
        </div>
        <NumPad onKey={handleKeyPress} onDelete={handleDelete} />
      </div>
    </div>);

}
// --- Traveller login (client flow) ---
// Phone/Email: TravellerUserValidation → TravellerLogin → Dashboard
// Username: Username + Password → TravellerLogin → Dashboard
// Login never asks for an OTP; the password from signup is the only secret.

function TravellerLoginScreen({
  onBack,
  onRegister,
  initialIdentifier = ''
}: {
  onBack: () => void;
  onRegister: () => void;
  initialIdentifier?: string;
}) {
  const { loginTraveller } = useAuth();
  const initial = initialIdentifier.trim();
  const initialIsEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(initial);
  const initialDigits = initial.replace(/\D/g, '');
  const initialIsPhone =
    !initialIsEmail &&
    (initial.startsWith('+') || initialDigits.length >= 9) &&
    /^[+\d\s\-()]*$/.test(initial);

  const [loginMode, setLoginMode] = useState<'phone' | 'email' | 'username'>(
    initialIsEmail ? 'email' : initialIsPhone || !initial ? 'phone' : 'username'
  );
  const [phoneLocal, setPhoneLocal] = useState(() => {
    if (!initialIsPhone) return '';
    const d = initialDigits;
    if (d.startsWith('251') && d.length > 3) return d.slice(3);
    return d;
  });
  const [phoneDialCode, setPhoneDialCode] = useState('251');
  const [email, setEmail] = useState(initialIsEmail ? initial : '');
  const [username, setUsername] = useState(
    !initialIsEmail && !initialIsPhone ? initial : ''
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [usePasswordOnPhone, setUsePasswordOnPhone] = useState(false);

  const phoneDial = findDialOption(phoneDialCode);
  const phoneFull = buildInternationalMobile(phoneDial.dial, phoneLocal);
  const phoneValid =
    phoneLocal.replace(/\D/g, '').length === phoneDial.localLength;

  const canContinuePhone =
    phoneValid && password.trim().length >= 4 && !loading;
  const canContinueEmail =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    password.trim().length >= 4 &&
    !loading;
  const canContinueUsername =
    username.trim().length >= 3 &&
    password.trim().length >= 4 &&
    !loading &&
    !/^[+\d\s\-()]+$/.test(username.trim());

  const enterSession = (result: TravellerAuthResult) => {
    if (!result.session || !(result.session.userId > 0)) return;
    const session = result.session;
    const profile = result.profile;
    const displayName =
      profile?.fullName || session.name || session.username || 'Traveller';
    loginTraveller(
      {
        name: displayName,
        phone: session.mobile || profile?.mobile || phoneFull || session.username,
        walletNumber: `TC-${session.userId}`,
        email: session.email || profile?.email,
        username: session.username || profile?.username,
        travellerId: session.userId,
        userId: session.userId,
        userTypeId: session.userTypeId || 5,
        userType: session.userType || 'TRA'
      },
      {
        profile: profile || null,
        session,
        dashboard: result.dashboard || null
      }
    );
  };

  const handleContinue = async () => {
    setError(null);
    setLoading(true);
    try {
      if (loginMode === 'phone') {
        if (!phoneValid || !phoneFull) {
          setError('Enter a valid 9-digit Ethiopian mobile (e.g. 987654321)');
          return;
        }
        if (password.trim().length < 4) {
          setError('Enter your travel app password to open your dashboard');
          return;
        }
        const result = await loginWithPhoneEmailPassword({
          phoneEmail: phoneFull,
          channel: 'phone',
          password
        });
        if (!result.success || !result.session?.userId) {
          throw new Error(result.message || 'Login failed');
        }
        enterSession(result);
        return;
      }

      if (loginMode === 'email') {
        const emailValue = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
          setError('Enter a valid email address');
          return;
        }
        if (password.trim().length < 4) {
          setError('Enter your travel app password to open your dashboard');
          return;
        }
        const result = await loginWithPhoneEmailPassword({
          phoneEmail: emailValue,
          channel: 'email',
          password
        });
        if (!result.success || !result.session?.userId) {
          throw new Error(result.message || 'Login failed');
        }
        enterSession(result);
        return;
      }

      // Username + password → TravellerLogin → Dashboard
      if (!canContinueUsername) return;
      const result = await loginWithUsernamePassword({
        username: username.trim(),
        password
      });
      if (!result.success || !result.session) {
        throw new Error(result.message || 'Login failed');
      }
      enterSession(result);
    } catch (err) {
      setError(formatTravelApiError(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen flex flex-col h-full min-h-0 relative overflow-hidden login-screen">
      <KtaAuthBackdrop />

      <div className="relative z-10 shrink-0">
        <KtaAuthHeader onBack={onBack} />
      </div>

      <div className="login-screen-scroll relative z-10 flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain no-scrollbar px-6">
        <div className="login-screen-body w-full max-w-md mx-auto min-w-0 pb-8">
          {error &&
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 min-w-0">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[12px] text-red-700 leading-relaxed break-words min-w-0">
              {error}
            </p>
          </div>
          }

          <h1 className="kta-login-title text-[28px] font-bold text-[#0B1320] leading-[1.12] tracking-tight mb-2.5 whitespace-pre-line">
            Welcome back,{'\n'}traveller
          </h1>
          <p className="kta-login-subtitle text-[14px] text-slate-500 leading-relaxed mb-6">
            {loginMode === 'phone' &&
              'Sign in with your phone number — a one-time code, or your password.'}
            {loginMode === 'email' &&
              'Sign in with the email address on your KTA Travel account.'}
            {loginMode === 'username' &&
              'Sign in with the username you picked when you joined.'}
          </p>

          <KtaSegmentTabs
            active={loginMode}
            onChange={(id) => {
              setLoginMode(id);
              setError(null);
            }}
            tabs={[
              { id: 'phone', label: 'Phone', icon: <Phone className="w-4 h-4 shrink-0" /> },
              { id: 'email', label: 'Email', icon: <Mail className="w-4 h-4 shrink-0" /> },
              { id: 'username', label: '@ Username', icon: <User className="w-4 h-4 shrink-0" /> }
            ]}
          />

          <div className="login-fields flex flex-col gap-4 mt-6 min-w-0">
            {loginMode === 'phone' && (
              <div className="space-y-3 min-w-0">
                <label className="text-[13px] font-semibold text-[#0B1320]">Mobile number</label>
                <CountryDialPhoneField
                  variant="auth"
                  dialCode={phoneDialCode}
                  nationalNumber={phoneLocal}
                  valid={phoneValid}
                  autoFocus
                  placeholder={
                    phoneDial.dial === '251' ? '987654321' : 'Phone number'
                  }
                  onDialChange={(option) => {
                    setPhoneDialCode(option.dial);
                    setPhoneLocal((prev) => prev.slice(0, option.localLength));
                    setError(null);
                  }}
                  onNationalChange={(next) => {
                    setPhoneLocal(next);
                    setError(null);
                  }}
                />
                {!usePasswordOnPhone &&
                <KtaInfoBox icon="message">
                  We&apos;ll text you a 6-digit code — no password needed.
                </KtaInfoBox>
                }
              </div>
            )}

            {loginMode === 'email' && (
              <PremiumInput
                icon={<Mail className="w-5 h-5" />}
                label="Email address"
                placeholder="you@example.com"
                type="email"
                autoCapitalize="none"
                autoCorrect="off"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleContinue();
                }}
              />
            )}

            {loginMode === 'username' && (
              <PremiumInput
                icon={<User className="w-5 h-5" />}
                label="Username"
                placeholder="@ amara.osei"
                autoCapitalize="none"
                autoCorrect="off"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.replace(/\s+/g, ''));
                  setError(null);
                }}
              />
            )}

            {(loginMode !== 'phone' || usePasswordOnPhone) &&
            <div className="relative min-w-0">
              <PremiumInput
                icon={<Lock className="w-5 h-5" />}
                label="Password"
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                className="pr-11"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleContinue();
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 bottom-3 z-10 text-gray-400 p-1.5 rounded-lg active:bg-black/5"
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ?
                  <EyeOff className="w-4 h-4" /> :
                  <Eye className="w-4 h-4" />}
              </button>
            </div>
            }

            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2.5 text-[13px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="kta-auth-checkbox w-[18px] h-[18px] rounded accent-[#2563eb]"
                />
                Keep me signed in
              </label>
              {loginMode === 'phone' &&
              <button
                type="button"
                onClick={() => setUsePasswordOnPhone((v) => !v)}
                className="text-[13px] font-semibold text-[#1a4a4f]">
                {usePasswordOnPhone ? 'Use code instead' : 'Use password'}
              </button>
              }
              {loginMode !== 'phone' &&
              <button type="button" className="text-[13px] font-semibold text-[#1a4a4f]">
                Forgot password?
              </button>
              }
            </div>
          </div>

          <div className="login-actions pt-6 flex gap-3 min-w-0">
            <KtaGradientButton
              className="flex-1 min-w-0"
              disabled={
                loginMode === 'phone' ?
                  usePasswordOnPhone ? !canContinuePhone : !phoneValid :
                  loginMode === 'email' ?
                    !canContinueEmail :
                    !canContinueUsername
              }
              loading={loading}
              onClick={() => {
                if (loginMode === 'phone' && !usePasswordOnPhone) {
                  setUsePasswordOnPhone(true);
                  setError('Enter your password, then tap Sign in.');
                  return;
                }
                void handleContinue();
              }}>
              {loading ?
                'Please wait…' :
                loginMode === 'phone' && !usePasswordOnPhone ?
                  'Send code' :
                  'Sign in'}
            </KtaGradientButton>
            <KtaBiometricButton
              onClick={() => {
                setError('Biometric sign-in is not available in this build.');
              }}
            />
          </div>

          <div className="mt-7">
            <KtaSocialLogin />
          </div>

          <button
            type="button"
            onClick={onRegister}
            className="w-full mt-7 py-2.5 text-[14px] text-slate-500 text-center">
            New to KTA Travel?{' '}
            <span className="font-bold text-[#1a4a4f]">Create an account</span>
          </button>
        </div>
      </div>
    </div>
  );
}


// --- Recover / Sign in on a new device: enter registered phone ---
function RecoverPhoneScreen({
  onNext,
  onBack,
  initialPhone = ''
}: {
  onNext: (phone: string) => void;
  onBack: () => void;
  initialPhone?: string;
}) {
  const [dialCode, setDialCode] = useState('251');
  const [phone, setPhone] = useState(() => {
    const d = initialPhone.replace(/\D/g, '');
    if (d.startsWith('251') && d.length > 3) return d.slice(3);
    return d;
  });
  const dial = findDialOption(dialCode);
  const digits = phone.replace(/\D/g, '');
  const valid = digits.length === dial.localLength;
  return (
    <div className="glass-screen ui-app-bg">
      <div className="shrink-0 px-6 pt-3 pb-2">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full glass-btn-ghost flex items-center justify-center"
          aria-label="Back">
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6">
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
            type: 'spring',
            duration: 0.7
          }}
          className="relative mx-auto mb-4 mt-1 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D9488] via-[#0D9488] to-[#14B8A6] shadow-lg flex items-center justify-center">
          <Phone className="w-6 h-6 text-white" />
        </motion.div>
        <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#0D9488] text-center mb-1.5">
          Welcome back
        </div>
        <h1 className="text-[22px] font-bold text-gray-900 text-center leading-tight tracking-tight mb-2">
          Log in to your account
        </h1>
        <p className="text-[13px] text-gray-500 text-center mb-5 leading-snug max-w-[300px] mx-auto">
          Enter the phone number you registered with. We&apos;ll send a
          verification code.
        </p>

        <div className="space-y-2 pb-4">
          <label className="ui-form-label ml-0.5">Phone number</label>
          <CountryDialPhoneField
            dialCode={dialCode}
            nationalNumber={phone}
            valid={valid}
            autoFocus
            onDialChange={(option) => {
              setDialCode(option.dial);
              setPhone((prev) => prev.slice(0, option.localLength));
            }}
            onNationalChange={setPhone}
          />
        </div>
      </div>
      <div className="shrink-0 px-6 pt-3 pb-cta-safe border-t border-black/[0.04] bg-white/75 backdrop-blur-md">
        <GradientButton
          disabled={!valid}
          onClick={() => onNext(buildInternationalMobile(dialCode, phone))}>
          Send verification code
        </GradientButton>
      </div>
    </div>
  );
}
// --- Main Flow ---
export function Onboarding() {
  const { login, loginTraveller } = useAuth();
  const [pinError, setPinError] = useState(false);
  const [phase, setPhase] = useState<
    'welcome' |
    'auth-choice' |
    'login' |
    'recover-otp' |
    'recover-pin' |
    'register' |
    'kyc' |
    'kyc-status' |
    'wallet-activated' |
    'create-pin'>(
    'welcome');
  const [formData, setFormData] = useState({
    title: 'Mr',
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    dialCode: '251',
    dialIso: 'ET',
    email: '',
    username: '',
    password: '',
    dob: '',
    gender: '',
    country: 'Ethiopia',
    countryId: 61,
    countryCode: 'ET',
    region: '',
    city: '',
    streetAddress: '',
    postCode: '',
    travellerId: undefined as number | undefined
  });
  const [kycStatus, setKycStatus] = useState<
    'none' | 'pending' | 'approved' | 'rejected' | 'under-review'>(
    'none');
  return (
    <AnimatePresence mode="wait">
      {phase === 'welcome' &&
      <motion.div
        key="welcome"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        className="h-full">
        
          <WelcomeCarousel
          onNext={() => setPhase('register')}
          onLogin={() => setPhase('login')} />
        
        </motion.div>
      }
      {phase === 'auth-choice' &&
      <motion.div
        key="auth-choice"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        className="h-full">
        
          <AuthChoiceScreen
          onBack={() => setPhase('welcome')}
          onRegister={() => setPhase('register')}
          onLogin={() => setPhase('login')} />
        
        </motion.div>
      }
      {phase === 'login' &&
      <motion.div
        key="login"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        className="h-full">
        
          <TravellerLoginScreen
          initialIdentifier={
            formData.email ||
            formData.username ||
            (formData.phone ?
              buildInternationalMobile(
                formData.dialCode || '251',
                formData.phone
              ) :
              '')
          }
          onBack={() => setPhase('welcome')}
          onRegister={() => setPhase('register')} />
        
        </motion.div>
      }
      {phase === 'recover-otp' &&
      <motion.div
        key="recover-otp"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        className="h-full">
        
          <OTPVerifyScreen
          onNext={() => setPhase('recover-pin')}
          onBack={() => setPhase('login')}
          email={formData.email} />
        
        </motion.div>
      }
      {phase === 'recover-pin' &&
      <motion.div
        key="recover-pin"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        className="h-full">
        
          <EnterPINScreen
          onBack={() => setPhase('recover-otp')}
          error={pinError}
          onClearError={() => setPinError(false)}
          onSubmit={(pin: string) => {
            // Logging in: the user enters the PIN they set at registration.
            // login() validates against the saved PIN when one exists; on a
            // fresh install with no local account it authenticates and seeds
            // the user (prototype behaviour).
            const ok = login(formData.phone, pin);
            if (!ok) {
              setPinError(true);
              return;
            }
            // Ensure a profile name is restored if one was saved locally.
            try {
              const raw = localStorage.getItem('mkash-profile');
              if (!raw) {
                localStorage.setItem(
                  'mkash-profile',
                  JSON.stringify({
                    ...formData,
                    phone: formData.phone
                  })
                );
              }
            } catch {}
          }} />
        
        </motion.div>
      }
      {phase === 'register' &&
      <motion.div
        key="register"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        className="h-full">
        
          <RegisterV2Screen
          onBack={() => setPhase('welcome')}
          onGoLogin={(email) => {
            if (email) {
              setFormData((f: typeof formData) => ({
                ...f,
                email
              }));
            }
            setPhase('login');
          }}
          onComplete={() => setPhase('kyc')}
          formData={formData}
          setFormData={setFormData} />
        
        </motion.div>
      }
      {phase === 'kyc' &&
      <motion.div
        key="kyc"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        className="h-full">
        
          <FaydaEKYCScreen
          onNext={() => setPhase('kyc-status')}
          onBack={() => setPhase('welcome')}
          setKycStatus={setKycStatus} />
        
        </motion.div>
      }
      {phase === 'kyc-status' &&
      <motion.div
        key="kyc-status"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        className="h-full">
        
          <KYCStatusScreen
          onNext={() => setPhase('wallet-activated')}
          kycStatus={kycStatus}
          setKycStatus={setKycStatus} />
        
        </motion.div>
      }
      {phase === 'wallet-activated' &&
      <motion.div
        key="wallet-activated"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        className="h-full">
        
          <WalletActivatedScreen
          onNext={() => setPhase('create-pin')}
          name={formData.firstName || 'there'}
          userId={formData.travellerId}
          countryCode={formData.countryCode || formData.dialIso} />
        
        </motion.div>
      }
      {phase === 'create-pin' &&
      <motion.div
        key="create-pin"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        className="h-full">
        
          <CreatePINScreen
          onNext={async (pin: string) => {
            const fullName =
            `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim();
            const phoneFull = buildInternationalMobile(
              formData.dialCode || '251',
              formData.phone || ''
            );
            const profilePayload = {
              ...formData,
              phone: phoneFull,
              password: undefined
            };
            try {
              localStorage.setItem(
                'mkash-profile',
                JSON.stringify(profilePayload)
              );
            } catch {
              // ignore
            }

            const zeroDashboard = {
              totalBookings: 0,
              availableCredit: 'ETB 0.00',
              status: 1,
              raw: {}
            };

            // Lock display currency to signup country (Ethiopia→ETB, Australia→AUD).
            applyCurrencyFromSignupCountry(
              formData.countryCode || formData.dialIso || 'ET'
            );

            // Wallet UserId MUST come from TravellerLogin (dynamic per account).
            // Never use TravellerUserValidation.userId — GuestAPI often returns 1000
            // for every lookup and would share another traveller's balance.
            try {
              const creds = loadSignupCreds();
              const username =
                (formData.username || '').trim() || creds?.username || '';
              const password = formData.password || creds?.password || '';
              if (username && password) {
                const result = await loginWithRetry(
                  loginWithUsernamePassword,
                  username,
                  password,
                  3
                );
                if (result.success && result.session?.userId) {
                  const session = result.session as {
                    userId: number;
                    userTypeId: number;
                    userType: string;
                    username: string;
                    name: string;
                    email?: string;
                    mobile?: string;
                  };
                  const profile = (result as TravellerAuthResult).profile;
                  // Always refresh TravellerDashboard so home/account show live credit.
                  let dashboard =
                    ((result as TravellerAuthResult).dashboard as
                      | typeof zeroDashboard
                      | undefined) || undefined;
                  try {
                    const dash = await travellerDashboard(
                      session.userTypeId || 5,
                      session.userId
                    );
                    if (dash.success && dash.dashboard) {
                      dashboard = dash.dashboard;
                    }
                  } catch {
                    // keep login dashboard / zero
                  }
                  clearSignupCreds();
                  rememberWalletUserId({
                    userId: session.userId,
                    email: session.email || formData.email,
                    username: session.username || username,
                    phone: session.mobile || phoneFull
                  });
                  loginTraveller(
                    {
                      name:
                        profile?.fullName ||
                        fullName ||
                        session.name ||
                        session.username ||
                        'Traveller',
                      phone:
                        session.mobile ||
                        profile?.mobile ||
                        phoneFull ||
                        session.username,
                      walletNumber: `TC-${session.userId}`,
                      email: session.email || profile?.email || formData.email,
                      username: session.username || profile?.username || username,
                      travellerId: session.userId,
                      userId: session.userId,
                      userTypeId: session.userTypeId || 5,
                      userType: session.userType || 'TRA'
                    },
                    {
                      profile: profile || null,
                      session: session as never,
                      dashboard: (dashboard || zeroDashboard) as never
                    },
                    pin
                  );
                  return;
                }
              }
            } catch {
              // Fall through to zero-wallet local session
            }

            const fallbackId =
              formData.travellerId && formData.travellerId > 0 ?
                formData.travellerId :
                undefined;
            if (fallbackId) {
              rememberWalletUserId({
                userId: fallbackId,
                email: formData.email,
                username: formData.username,
                phone: phoneFull
              });
            }

            loginTraveller(
              {
                name: fullName,
                phone: phoneFull || formData.phone,
                walletNumber: formData.username ?
                  `TC-${formData.username}` :
                  'TC-new',
                email: formData.email,
                username: formData.username,
                travellerId: fallbackId,
                userId: fallbackId,
                userTypeId: 5,
                userType: 'TRA'
              },
              {
                profile: null,
                session: fallbackId ?
                  {
                    userType: 'TRA',
                    userTypeId: 5,
                    userId: fallbackId,
                    username: formData.username || '',
                    name: fullName || 'Traveller',
                    email: formData.email,
                    mobile: phoneFull,
                    loginStatus: 'Allowed',
                    isActive: true,
                    raw: {}
                  } as never :
                  null,
                dashboard: zeroDashboard
              },
              pin
            );
          }}
          onBack={() => setPhase('wallet-activated')} />
        
        </motion.div>
      }
    </AnimatePresence>);

}
