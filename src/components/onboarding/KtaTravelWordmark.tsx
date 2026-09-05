import React from 'react';
import { KtaLogoMark } from './KtaLogoMark';

/** KTA Travel wordmark — matches onboarding reference screens. */
export function KtaTravelWordmark({ size = 28 }: { size?: number }) {
  const markSize = Math.round(size * 1.05);
  return (
    <div className="flex items-center gap-2.5">
      <KtaLogoMark size={markSize} />
      <div className="flex items-baseline gap-0.5 leading-none">
        <span
          className="font-bold tracking-tight text-[#0B1320]"
          style={{ fontSize: size * 0.54 }}>
          KTA
        </span>
        <span
          className="font-semibold text-[#E85D4C]"
          style={{ fontSize: size * 0.5 }}>
          Travel
        </span>
      </div>
    </div>
  );
}
