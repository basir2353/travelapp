import React from 'react';
import { motion } from 'framer-motion';
import {
  Bed,
  Car,
  Compass,
  Plane,
  TrainFront,
  Umbrella
} from 'lucide-react';

const ORBIT_ICONS = [
  { Icon: Compass, label: 'Tours' },
  { Icon: Umbrella, label: 'Holidays' },
  { Icon: Car, label: 'Cars' },
  { Icon: Bed, label: 'Hotels' },
  { Icon: Plane, label: 'Flights' },
  { Icon: TrainFront, label: 'Trains' }
];

type Props = {
  children: React.ReactNode;
  /** Tailwind gradient stops, e.g. "from-teal-50/80 to-cyan-50/40" */
  bgGradient?: string;
};

/**
 * Shared onboarding hero — dashed rings + orbiting service icons (same motion on every slide).
 */
export function OnboardingOrbitFrame({
  children,
  bgGradient
}: Props) {
  return (
    <div
      className={`onboard-orbit-frame relative w-full aspect-[1.08] max-h-[44vh] rounded-[28px] overflow-hidden shadow-[0_8px_32px_rgba(15,23,42,0.06)] ${bgGradient ?? ''}`}>
      {/* Soft glow behind center */}
      <div className="onboard-orbit-glow pointer-events-none" aria-hidden />

      {/* Orbit assembly — rings, icons, logo share one center point */}
      <div className="onboard-orbit-assembly">
        <div className="onboard-orbit-hub pointer-events-none" aria-hidden>
          <div className="onboard-orbit-ring onboard-orbit-ring-outer" />
          <div className="onboard-orbit-ring onboard-orbit-ring-inner" />
        </div>

        <motion.div
          className="onboard-orbit-spinner pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'linear'
          }}
          aria-hidden>
          {ORBIT_ICONS.map(({ Icon, label }, index) => {
            const angle = (360 / ORBIT_ICONS.length) * index;
            return (
              <div
                key={label}
                className="onboard-orbit-node absolute left-1/2 top-1/2 -ml-[17px] -mt-[17px]"
                style={{
                  transform: `rotate(${angle}deg) translateY(calc(-1 * var(--orbit-radius)))`
                }}>
                <motion.div
                  className="onboard-orbit-icon-pill flex items-center justify-center"
                  animate={{ rotate: [-angle, -angle - 360] }}
                  transition={{
                    duration: 22,
                    repeat: Infinity,
                    ease: 'linear'
                  }}>
                  <Icon className="w-[15px] h-[15px] text-slate-500" strokeWidth={2} />
                </motion.div>
              </div>
            );
          })}
        </motion.div>

        <div className="onboard-orbit-content z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
