import React from 'react';
/**
 * Mkash Logo — Wave M
 *
 * Brand concept:
 *  - A flowing wave "M" symbolizing fluid money movement, growth, and rhythm
 *  - Green → Teal → Blue gradient = Ethiopia (green) meeting fintech trust (blue)
 *  - Glossy highlight on the upper curve adds modern, app-store quality dimension
 *
 * Available exports:
 *  - <LogoMark />       — just the icon (use in tab bar, favicon, small contexts)
 *  - <LogoWordmark />   — icon + "mkash" wordmark (use in headers, splash)
 *  - <LogoFlat />       — single-color silhouette for tiny sizes (≤ 24px)
 */
interface LogoProps {
  size?: number;
  className?: string;
  /** Optional id suffix to avoid SVG defs collisions when multiple logos render */
  idSuffix?: string;
}
export function LogoMark({
  size = 40,
  className = '',
  idSuffix = ''
}: LogoProps) {
  const gradId = `mkash-grad${idSuffix}`;
  const glossId = `mkash-gloss${idSuffix}`;
  return (
    <svg
      width={size}
      height={size * (120 / 200)}
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Mkash logo">
      
      <defs>
        {/* Main brand gradient: green → teal → blue */}
        <linearGradient
          id={gradId}
          x1="20"
          y1="60"
          x2="180"
          y2="60"
          gradientUnits="userSpaceOnUse">
          
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="35%" stopColor="#0D9488" />
          <stop offset="55%" stopColor="#14B8A6" />
          <stop offset="80%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>

        {/* Soft top-edge gloss highlight */}
        <linearGradient
          id={glossId}
          x1="100"
          y1="10"
          x2="100"
          y2="65"
          gradientUnits="userSpaceOnUse">
          
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* The flowing M — drawn as a thick stroke with rounded caps */}
      <path
        d="M 20 100
           C 20 40, 45 15, 65 15
           C 85 15, 100 50, 100 75
           C 100 50, 115 15, 135 15
           C 155 15, 180 40, 180 100"




        stroke={`url(#${gradId})`}
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none" />
      

      {/* Subtle highlight on the top of the M for glossy depth */}
      <path
        d="M 28 70
           C 30 40, 50 25, 65 25
           C 80 25, 92 50, 100 65
           C 108 50, 120 25, 135 25
           C 150 25, 170 40, 172 70"




        stroke={`url(#${glossId})`}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none" />
      
    </svg>);

}
/**
 * Flat single-color silhouette for very small contexts where the gradient
 * would muddy (tab bars, table rows, etc).
 */
export function LogoFlat({
  size = 24,
  className = '',
  color = '#0D9488'


}: LogoProps & {color?: string;}) {
  return (
    <svg
      width={size}
      height={size * (120 / 200)}
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Mkash">
      
      <path
        d="M 20 100
           C 20 40, 45 15, 65 15
           C 85 15, 100 50, 100 75
           C 100 50, 115 15, 135 15
           C 155 15, 180 40, 180 100"




        stroke={color}
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none" />
      
    </svg>);

}
interface WordmarkProps {
  size?: number;
  className?: string;
  /** Show the tagline below the wordmark. Can be a string or any ReactNode. */
  tagline?: React.ReactNode;
  /** Color of the "mkash" text */
  textColor?: string;
  /** Tagline color (only applied when tagline is a plain string) */
  taglineColor?: string;
  /** Hide the mark and only show the text wordmark */
  markOnly?: boolean;
  textOnly?: boolean;
}
export function LogoWordmark({
  size = 36,
  className = '',
  tagline,
  textColor = '#1A1D26',
  taglineColor = '#6B7280',
  textOnly = false
}: WordmarkProps) {
  const isStringTagline = typeof tagline === 'string';
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!textOnly && <LogoMark size={size} />}
      <div className="flex flex-col leading-none">
        <span
          className="font-bold tracking-tight"
          style={{
            fontSize: size * 0.58,
            color: textColor,
            letterSpacing: '-0.025em',
            lineHeight: 1
          }}>
          
          mkash
        </span>
        {tagline &&
        <span
          className="text-[11px] mt-1"
          style={
          isStringTagline ?
          {
            color: taglineColor
          } :
          undefined
          }>
          
            {tagline}
          </span>
        }
      </div>
    </div>);

}
/**
 * Brand tagline component: "Everything. Together."
 * — "Everything." in Mkash green
 * — "Together." in Mkash blue
 * Matches the brand gradient identity. Use inside <LogoWordmark tagline={<BrandTagline />} />.
 */
export function BrandTagline({ className = '' }: {className?: string;}) {
  return (
    <span className={`font-semibold ${className}`}>
      <span
        style={{
          color: '#0D9488'
        }}>
        
        Everything.
      </span>{' '}
      <span
        style={{
          color: '#F97316'
        }}>
        
        Together.
      </span>
    </span>);

}