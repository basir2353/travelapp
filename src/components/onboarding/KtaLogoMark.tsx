import React from 'react';
import ktaLogo from '../../assets/kta-logo.png';

interface KtaLogoMarkProps {
  size?: number;
  className?: string;
}

/** KTA Travel brand mark — suitcase + plane logo. */
export function KtaLogoMark({ size = 40, className = '' }: KtaLogoMarkProps) {
  const height = Math.round(size * 0.92);
  return (
    <img
      src={ktaLogo}
      alt=""
      width={size}
      height={height}
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}
