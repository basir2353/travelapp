import { Capacitor, CapacitorHttp } from '@capacitor/core';

/**
 * Live tour photos on travel.afonestop.com send
 * `Cross-Origin-Resource-Policy: same-origin`, which blocks plain <img>
 * loads inside the Capacitor WebView. Fetch with CapacitorHttp (native)
 * or the Vite same-origin proxy (dev), then expose a data/blob URL.
 */

const cache = new Map<string, Promise<string | null>>();

function isImageContentType(ct: string | undefined | null): boolean {
  return Boolean(ct && /^image\//i.test(ct.split(';')[0].trim()));
}

function looksLikeImageBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 3) return false;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return true;
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return true;
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    return true;
  }
  return false;
}

function stripDataUrlPrefix(value: string): { mime?: string; b64: string } {
  const match = value.match(/^data:([^;,]+);base64,(.+)$/s);
  if (match) return { mime: match[1], b64: match[2] };
  return { b64: value };
}

function base64HeadBytes(b64: string, max = 64): Uint8Array {
  try {
    const sample = b64.replace(/\s/g, '').slice(0, Math.ceil((max * 4) / 3) + 4);
    const binary = atob(sample);
    const n = Math.min(binary.length, max);
    const bytes = new Uint8Array(n);
    for (let i = 0; i < n; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return new Uint8Array();
  }
}

function headerContentType(
  headers: Record<string, string> | undefined
): string {
  if (!headers) return '';
  return (
    headers['Content-Type'] ||
    headers['content-type'] ||
    headers['Content-type'] ||
    ''
  );
}

async function fetchViaNative(url: string): Promise<string | null> {
  const response = await CapacitorHttp.request({
    url,
    method: 'GET',
    responseType: 'blob',
    // Missing CDN files 302 → /NotFound.aspx HTML; do not follow that.
    disableRedirects: true,
    connectTimeout: 15_000,
    readTimeout: 20_000,
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'
    }
  });

  if (response.status < 200 || response.status >= 300) return null;

  const ct = headerContentType(response.headers);
  const data = response.data;

  if (typeof data === 'string' && data.trim()) {
    const { mime, b64 } = stripDataUrlPrefix(data.trim());
    const head = base64HeadBytes(b64);
    if (!isImageContentType(ct || mime) && !looksLikeImageBytes(head)) {
      return null;
    }
    const mimeOut =
      (mime && isImageContentType(mime) ? mime : null) ||
      (isImageContentType(ct) ? ct.split(';')[0].trim() : 'image/jpeg');
    return `data:${mimeOut};base64,${b64}`;
  }

  // Some Capacitor builds return a Blob/ArrayBuffer on web-plugin path.
  if (data instanceof ArrayBuffer) {
    const bytes = new Uint8Array(data);
    if (!looksLikeImageBytes(bytes)) return null;
    const mime = isImageContentType(ct) ? ct.split(';')[0].trim() : 'image/jpeg';
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return `data:${mime};base64,${btoa(binary)}`;
  }

  return null;
}

async function fetchViaWeb(url: string): Promise<string | null> {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    headers: { Accept: 'image/*,*/*;q=0.8' }
  });

  // Opaque/redirected missing CDN files
  if (response.type === 'opaqueredirect') return null;
  if (response.status >= 300 && response.status < 400) return null;
  if (!response.ok) return null;

  const ct = response.headers.get('content-type') || '';
  const blob = await response.blob();
  if (blob.size < 32) return null;

  const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  if (
    !isImageContentType(ct) &&
    !looksLikeImageBytes(head) &&
    !blob.type.startsWith('image/')
  ) {
    return null;
  }

  return URL.createObjectURL(blob);
}

function isNativeRuntime(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return (
      typeof window !== 'undefined' &&
      /capacitor|android|ionic/i.test(window.navigator.userAgent || '')
    );
  }
}

/** Resolve a displayable src for one API/CDN tour image URL. */
export function loadTourImageSrc(url: string): Promise<string | null> {
  if (!url?.trim()) return Promise.resolve(null);

  const existing = cache.get(url);
  if (existing) return existing;

  const promise = (async () => {
    try {
      if (isNativeRuntime()) {
        return await fetchViaNative(url);
      }
      return await fetchViaWeb(url);
    } catch {
      return null;
    }
  })();

  cache.set(url, promise);
  return promise;
}

export function invalidateTourImageSrc(url: string): void {
  cache.delete(url);
}

/** First candidate URL that returns a real image. */
export async function firstWorkingTourImage(
  urls: string[]
): Promise<string | null> {
  for (const url of urls) {
    const src = await loadTourImageSrc(url);
    if (src) return src;
  }
  return null;
}
