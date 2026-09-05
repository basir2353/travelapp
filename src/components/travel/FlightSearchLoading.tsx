import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane,
  Bus,
  TrainFront,
  Building2,
  Car,
  Palmtree,
  type LucideIcon
} from 'lucide-react';
import { KTA, type Mode } from './ethioTravelData';

const LOAD_PHASES: Record<Mode, string[]> = {
  flights: [
    'Searching 40+ providers…',
    'Comparing fares & times',
    'Checking seat availability…'
  ],
  bus: [
    'Searching bus operators…',
    'Comparing routes & times',
    'Finding the best buses…'
  ],
  train: [
    'Searching rail routes…',
    'Comparing classes & times',
    'Finding the best trains…'
  ],
  hotels: [
    'Searching properties…',
    'Comparing rates & amenities',
    'Finding the best stays…'
  ],
  minibus: [
    'Searching vehicles…',
    'Comparing rates & suppliers',
    'Finding the best cars…'
  ],
  holiday: [
    'Finding tours & activities…',
    'Checking Dubai attractions…',
    'Loading the best experiences…'
  ]
};

const MODE_ICONS: Record<Mode, LucideIcon> = {
  flights: Plane,
  bus: Bus,
  train: TrainFront,
  hotels: Building2,
  minibus: Car,
  holiday: Palmtree
};

const MODE_SUBTITLES: Record<Mode, string> = {
  flights: 'Finding the best flights for you',
  bus: 'Finding the best buses for you',
  train: 'Finding the best trains for you',
  hotels: 'Finding the best hotels for you',
  minibus: 'Finding the best cars for you',
  holiday: 'Finding the best tours for you'
};

interface SearchLoadingProps {
  from: string;
  to: string;
  mode?: Mode;
  subtitle?: string;
}

function ShimmerBlock({
  className = '',
  style
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`shimmer-block rounded ${className}`} style={style} />;
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.12 }}
      className="bg-white rounded-[16px] border p-4"
      style={{ borderColor: KTA.border }}>
      <div className="flex items-center gap-3 mb-4">
        <ShimmerBlock className="w-9 h-9 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <ShimmerBlock className="h-2.5 w-[72%] rounded" />
          <ShimmerBlock className="h-2 w-[45%] rounded" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <ShimmerBlock className="h-7 flex-1 rounded-md" />
        <ShimmerBlock className="h-7 flex-1 rounded-md" />
        <ShimmerBlock className="h-7 flex-1 rounded-md" />
      </div>
    </motion.div>
  );
}

function formatRouteLabel(from: string, to: string, mode: Mode) {
  const destination = to === 'Where to?' ? 'Dubai (DXB)' : to.trim() || 'Dubai (DXB)';
  const origin = from.trim() || 'Addis Ababa (ADD)';
  if (mode === 'hotels') {
    return `Hotels in ${to === 'Where to?' ? 'Dubai' : to.trim() || 'Dubai'}`;
  }
  if (mode === 'holiday') {
    return `Holidays in ${to === 'Where to?' ? 'Dubai' : to.trim() || 'Dubai'}`;
  }
  if (mode === 'minibus') {
    return `Cars in ${from.trim() || 'Dubai (DXB)'}`;
  }
  return `${origin} → ${destination}`;
}

export function SearchLoading({
  from,
  to,
  mode = 'flights',
  subtitle
}: SearchLoadingProps) {
  const phases = LOAD_PHASES[mode];
  const [loadPhase, setLoadPhase] = useState(0);
  const routeLabel = formatRouteLabel(from, to, mode);
  const LoaderIcon = MODE_ICONS[mode];
  const iconRotate = mode === 'flights' ? 'rotate-90' : '';

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLoadPhase((phase) => (phase + 1) % phases.length);
    }, 850);
    return () => window.clearInterval(timer);
  }, [phases.length]);

  return (
    <div className="px-[18px] pt-2 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-[20px] border shadow-sm px-6 pt-8 pb-6 mb-4"
        style={{ borderColor: KTA.border }}>
        <div className="relative h-[72px] flex items-center justify-center mb-5">
          <motion.div
            className="absolute w-[72px] h-[72px] rounded-full"
            style={{ border: `2px solid ${KTA.green}`, opacity: 0.15 }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0.28, 0.12] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[88px] h-[88px] rounded-full"
            style={{ border: `1px solid ${KTA.green}`, opacity: 0.08 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.18, 0.06] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          />
          <motion.div
            className="relative w-14 h-14 rounded-full flex items-center justify-center z-10 shadow-md"
            style={{ backgroundColor: KTA.green }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
            <LoaderIcon className={`w-7 h-7 text-white ${iconRotate}`} strokeWidth={2} />
          </motion.div>
        </div>

        <div className="relative flex items-center mb-5 px-1">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0 z-10"
            style={{ backgroundColor: KTA.green }}
          />
          <div className="flex-1 mx-1 relative h-px">
            <div
              className="absolute inset-0 border-t-2 border-dashed"
              style={{ borderColor: KTA.border }}
            />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full z-20 shadow-sm"
              style={{ backgroundColor: KTA.green }}
              animate={{ left: ['4%', '50%', '96%', '4%'] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
                times: [0, 0.45, 0.9, 1]
              }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full z-10"
              style={{ backgroundColor: KTA.green, opacity: 0.35 }}
            />
          </div>
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0 z-10"
            style={{ backgroundColor: KTA.green }}
          />
        </div>

        <p
          className="text-[14px] font-bold text-center leading-snug mb-3"
          style={{ color: KTA.textPrimary }}>
          {routeLabel}
        </p>

        <div className="h-6 flex items-center justify-center mb-3 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={loadPhase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="text-[13px] font-semibold text-center"
              style={{ color: KTA.textSecondary }}>
              {phases[loadPhase]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: KTA.border }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: KTA.green }}
            initial={{ width: '0%' }}
            animate={{ width: ['0%', '78%', '62%', '88%', '75%'] }}
            transition={{
              duration: 2.6,
              times: [0, 0.35, 0.55, 0.8, 1],
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 0.2
            }}
          />
        </div>

        <p
          className="text-[12px] text-center mt-3"
          style={{ color: KTA.textSecondary }}>
          {subtitle ?? MODE_SUBTITLES[mode]}
        </p>
      </motion.div>

      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <SkeletonCard key={index} index={index} />
        ))}
      </div>
    </div>
  );
}

/** @deprecated Use SearchLoading */
export const FlightSearchLoading = SearchLoading;
