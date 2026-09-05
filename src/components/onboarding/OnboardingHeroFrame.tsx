import React from 'react';

type Props = {
  children: React.ReactNode;
  bgGradient?: string;
};

/** Static hero container for onboarding slides 2–5 (no orbit — matches KTA reference). */
export function OnboardingHeroFrame({
  children,
  bgGradient = 'from-slate-50 to-teal-50/30'
}: Props) {
  return (
    <div
      className={`onboard-hero-frame relative w-full aspect-[1.08] max-h-[44vh] rounded-[24px] bg-gradient-to-br ${bgGradient} overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]`}>
      <div className="absolute inset-0 flex items-center justify-center px-6 py-8">
        {children}
      </div>
    </div>
  );
}
