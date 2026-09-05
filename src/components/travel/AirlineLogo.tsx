import React, { useEffect, useMemo, useState } from 'react';

type Props = {
  src?: string;
  name: string;
  initial: string;
  color: string;
  className?: string;
};

const KIWI_CDN = 'https://images.kiwi.com/airlines/64';

/** Bundled carrier marks — used only if the live CDN URL fails. */
const LOCAL_FALLBACKS: Record<string, string> = {
  ET: '/airlines/ET.png',
  ETHIOPIAN: '/airlines/ET.png'
};

function carrierCodeFrom(name: string, src?: string): string | undefined {
  const fromSrc = src?.match(/\/([A-Z0-9]{2})\.(?:png|svg|jpg|jpeg|webp)(?:\?|$)/i)?.[1];
  if (fromSrc) return fromSrc.toUpperCase();
  const upper = name.toUpperCase();
  if (upper.includes('ETHIOPIAN')) return 'ET';
  if (upper.includes('EMIRATES')) return 'EK';
  if (upper.includes('QATAR')) return 'QR';
  if (upper.includes('EGYPT')) return 'MS';
  if (upper.includes('TURKISH')) return 'TK';
  const iata = upper.match(/\b([A-Z0-9]{2})\b/);
  if (iata && !['CO', 'KG', 'LB', 'TO', 'OF', 'OR', 'IN', 'ON'].includes(iata[1])) {
    return iata[1];
  }
  return undefined;
}

function localFallback(name: string, src?: string): string | undefined {
  const code = carrierCodeFrom(name, src);
  if (code && LOCAL_FALLBACKS[code]) return LOCAL_FALLBACKS[code];
  const upper = name.toUpperCase();
  for (const [key, path] of Object.entries(LOCAL_FALLBACKS)) {
    if (upper.includes(key)) return path;
  }
  return undefined;
}

function kiwiUrl(name: string, src?: string): string | undefined {
  const code = carrierCodeFrom(name, src);
  if (!code || code.length < 2) return undefined;
  return `${KIWI_CDN}/${code}.png`;
}

/**
 * Real airline artwork: prefer the CDN URL from the flight API mapping,
 * then Kiwi CDN by carrier code, then a local bundled mark, then initials.
 */
export function AirlineLogo({
  src,
  name,
  initial,
  color,
  className = 'w-8 h-8'
}: Props) {
  const [failed, setFailed] = useState<Record<string, true>>({});
  const local = localFallback(name, src);
  const kiwi = kiwiUrl(name, src);

  const candidates = useMemo(() => {
    // Skip known placeholder SVG — always prefer real artwork.
    const liveSrc =
      src && !/ethiopian_airlines_logo\.svg/i.test(src) ? src : undefined;
    return [liveSrc, kiwi, local].filter(
      (u, i, arr): u is string => !!u && arr.indexOf(u) === i
    );
  }, [kiwi, local, src]);

  const activeSrc = candidates.find((u) => !failed[u]) ?? null;

  useEffect(() => {
    setFailed({});
  }, [src, name]);

  if (!activeSrc) {
    return (
      <div
        className={`${className} rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0`}
        style={{ backgroundColor: color || '#0D7B3E' }}
        title={name}
        aria-label={name}>
        {(initial || name.charAt(0) || 'A').toUpperCase()}
      </div>
    );
  }

  return (
    <img
      key={activeSrc}
      src={activeSrc}
      alt={name}
      title={name}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() =>
      setFailed((prev) => ({
        ...prev,
        [activeSrc]: true
      }))
      }
      className={`${className} rounded-full object-contain bg-white border border-slate-100 shrink-0 p-0.5`}
    />
  );
}
