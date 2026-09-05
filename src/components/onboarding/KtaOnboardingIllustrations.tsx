import React from 'react';
import { motion } from 'framer-motion';
import {
  Bed,
  Car,
  CheckCircle2,
  Compass,
  Heart,
  MessageCircle,
  Plane,
  ShieldCheck,
  Star,
  TrainFront,
  TrendingDown,
  Umbrella
} from 'lucide-react';
import { OnboardingOrbitFrame } from './OnboardingOrbitFrame';
import { OnboardingHeroFrame } from './OnboardingHeroFrame';
import { KtaLogoMark } from './KtaLogoMark';

/** Slide 1 — Every Journey, One App (orbit animation) */
export function KtaWelcomeIllustration() {
  return (
    <OnboardingOrbitFrame>
      <>
        <div className="onboard-center-logo">
          <KtaLogoMark size={62} />
        </div>
        <div className="onboard-currency-pill">
          <span>Pay in</span>
          <span className="text-[#0B1320] font-bold">ETB</span>
          <span className="text-slate-400 font-medium">+</span>
        </div>
      </>
    </OnboardingOrbitFrame>
  );
}

/** Slide 2 — Flights & Fares */
export function KtaFlightsIllustration() {
  return (
    <OnboardingHeroFrame bgGradient="from-teal-50/95 via-emerald-50/70 to-cyan-50/40">
      <div className="relative w-full max-w-[230px]">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-3 -left-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white shadow-lg border border-slate-100 text-[9px] font-semibold">
          <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
            <TrendingDown className="w-3 h-3 text-white" />
          </span>
          <div>
            <div className="text-slate-500 leading-none text-[8px]">Price drop</div>
            <div className="text-[#0B1320] font-bold">-ETB 3,840</div>
          </div>
        </motion.div>

        <div className="rounded-2xl overflow-hidden shadow-xl border border-white/80">
          <div className="bg-[#1a4a4f] px-3 py-1.5 flex items-center justify-between">
            <span className="text-[8px] font-bold tracking-wider text-white/90">BOARDING PASS</span>
            <Plane className="w-3 h-3 text-white/80" />
          </div>
          <div className="bg-white p-3">
            <div className="flex items-center justify-between text-[13px] font-bold text-[#0B1320] mb-2">
              <span>LON <span className="font-normal text-[10px] text-slate-500">08:15</span></span>
              <Plane className="w-3.5 h-3.5 text-[#1a4a4f]" />
              <span>ROM <span className="font-normal text-[10px] text-slate-500">11:40</span></span>
            </div>
            <div className="border-t border-dashed border-slate-200 pt-2 flex items-end justify-between">
              <div className="text-[9px] text-slate-500">
                <div>Seat <span className="font-bold text-[#0B1320]">14A</span></div>
                <div>Gate <span className="font-bold text-[#0B1320]">B12</span></div>
              </div>
              <div className="flex gap-0.5 h-7 items-end">
                {[3, 5, 4, 6, 3, 5, 4, 5].map((h, i) =>
                  <div key={i} className="w-0.5 bg-slate-800 rounded-sm" style={{ height: `${h * 2.5}px` }} />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-lg bg-white shadow-md border border-slate-100 text-[9px] font-semibold text-slate-600">
          Fare from <span className="text-[#0B1320] font-bold">ETB 18,720</span>
          <span className="text-slate-400"> ≈ USD 312</span>
        </div>
      </div>
    </OnboardingHeroFrame>
  );
}

/** Slide 3 — Hotels & Holidays */
export function KtaHotelsIllustration() {
  return (
    <OnboardingHeroFrame bgGradient="from-amber-50/90 via-orange-50/50 to-rose-50/40">
      <div className="relative w-full max-w-[220px]">
        <div className="absolute -left-6 top-4 w-[130px] rounded-xl bg-white shadow-md border border-white p-2.5 rotate-[-10deg] opacity-80 z-0">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
              <Umbrella className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <span className="text-[9px] font-bold text-[#0B1320]">Holiday</span>
          </div>
          <div className="text-[8px] text-slate-500">7 nights</div>
          <div className="text-[10px] font-bold text-[#0B1320] mt-0.5">ETB 6,240</div>
        </div>

        <div className="relative z-10 rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
          <div className="relative h-[76px] bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100">
            <button type="button" className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 flex items-center justify-center shadow-sm">
              <Heart className="w-3.5 h-3.5 text-rose-500" fill="currentColor" />
            </button>
          </div>
          <div className="p-2.5">
            <div className="flex items-center gap-1 text-[9px] text-amber-600 font-semibold mb-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              4.9 (1,204)
            </div>
            <div className="text-[12px] font-bold text-[#0B1320]">Casa Lumen</div>
            <div className="text-[9px] text-slate-500">Lisbon · Free cancellation</div>
            <div className="flex items-center justify-between mt-1.5">
              <div className="text-[10px]">
                <span className="font-bold text-[#0B1320]">ETB 8,520</span>
                <span className="text-slate-400"> ≈ USD 142 / night</span>
              </div>
              <span className="text-[9px] font-bold px-2.5 py-1 rounded-lg bg-[#0B1320] text-white">Book</span>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-1 -right-3 z-20 px-2.5 py-1 rounded-lg bg-white shadow-md border border-slate-100 text-[8px] font-semibold">
          <span className="text-slate-500">Flight + stay</span>{' '}
          <span className="text-emerald-600 font-bold">Save 22%</span>
        </div>
      </div>
    </OnboardingHeroFrame>
  );
}

/** Slide 4 — Trains, Cars & Tours */
export function KtaItineraryIllustration() {
  const legs = [
    { Icon: TrainFront, title: 'Rome → Florence', sub: '09:20 · Platform 4' },
    { Icon: Car, title: 'Car pickup', sub: 'Firenze SMN · 11:05' },
    { Icon: Compass, title: 'Tuscany vineyard tour', sub: 'Tomorrow · 10:00' }
  ];
  return (
    <OnboardingHeroFrame bgGradient="from-sky-50/95 via-cyan-50/50 to-teal-50/40">
      <div className="relative w-full max-w-[230px]">
        <div className="absolute -top-3 -left-2 z-20 px-2.5 py-1 rounded-lg bg-[#0B1320] text-white text-[8px] font-semibold shadow-lg">
          Platform changed 4 → 7
        </div>
        <div className="rounded-2xl bg-white shadow-xl border border-slate-100 p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-bold text-[#0B1320]">Italy, 6 days</span>
            <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">On track</span>
          </div>
          <div className="space-y-2.5">
            {legs.map(({ Icon, title, sub }) =>
              <div key={title} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-slate-600" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-[#0B1320]">{title}</div>
                  <div className="text-[8px] text-slate-500">{sub}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-lg bg-white shadow-md border border-slate-100 text-[8px] font-semibold text-slate-600">
          All legs synced · <span className="text-[#0B1320]">One Itinerary</span>
        </div>
      </div>
    </OnboardingHeroFrame>
  );
}

/** Slide 5 — Visas & Support */
export function KtaVisaIllustration() {
  return (
    <OnboardingHeroFrame bgGradient="from-teal-50/90 via-emerald-50/60 to-cyan-50/40">
      <div className="relative w-full max-w-[210px]">
        <div className="absolute -top-2 -left-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white shadow-md border border-slate-100 text-[8px] font-semibold text-slate-600">
          <ShieldCheck className="w-3 h-3 text-teal-600" />
          Documents Checked
        </div>
        <div className="rounded-xl bg-white shadow-xl border border-slate-200 p-3 relative">
          <div className="text-[8px] font-bold tracking-wider text-slate-400 mb-1.5">VISA · SCHENGEN</div>
          <div className="flex gap-2.5 items-center">
            <div className="w-11 h-13 rounded-md bg-gradient-to-br from-slate-200 to-slate-300" />
            <div>
              <div className="text-[11px] font-bold text-[#0B1320]">A. Osei</div>
              <div className="text-[9px] text-slate-500">GBR · 12 Mar</div>
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.04, 1], rotate: [-12, -10, -12] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-4 -right-4 w-[58px] h-[58px] rounded-full border-[3px] border-emerald-500 bg-emerald-50 flex flex-col items-center justify-center shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
            <span className="text-[6px] font-black text-emerald-700 tracking-wide mt-0.5">APPROVED</span>
          </motion.div>
        </div>
        <div className="absolute -bottom-4 -left-2 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white shadow-md border border-slate-100 text-[8px] font-semibold text-slate-600">
          <MessageCircle className="w-3 h-3 text-teal-600" />
          Support replies in under 2 min
        </div>
      </div>
    </OnboardingHeroFrame>
  );
}
