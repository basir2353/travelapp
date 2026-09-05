import React, { useState } from 'react';

type Props = {
  iso: string;
  size?: number;
  className?: string;
  title?: string;
};

/**
 * Country flag as an image — flag emoji renders as two tofu/? glyphs in
 * some iOS WKWebView / simulator fonts, so we never rely on emoji here.
 */
export function CountryFlag({ iso, size = 20, className = '', title }: Props) {
  const code = String(iso || '')
    .trim()
    .toLowerCase()
    .slice(0, 2);
  const [failed, setFailed] = useState(false);

  if (!code || failed) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-[3px] bg-slate-100 text-[9px] font-bold uppercase tracking-wide text-slate-600 ${className}`}
        style={{ width: size, height: Math.round(size * 0.75), minWidth: size }}
        aria-hidden={!title}
        title={title}>
        {code || '—'}
      </span>
    );
  }

  const height = Math.round(size * 0.75);

  return (
    <img
      src={`https://flagcdn.com/w80/${code}.png`}
      srcSet={`https://flagcdn.com/w40/${code}.png 1x, https://flagcdn.com/w80/${code}.png 2x`}
      width={size}
      height={height}
      alt=""
      title={title}
      aria-hidden={!title}
      draggable={false}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`inline-block shrink-0 rounded-[3px] object-cover ${className}`}
      style={{ width: size, height }}
    />
  );
}
