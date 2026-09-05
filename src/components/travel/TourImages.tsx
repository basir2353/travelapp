import { useEffect, useState } from 'react';
import { tourCardColor } from '../../services/guestApi/mapTourToListing';
import {
  firstWorkingTourImage,
  loadTourImageSrc
} from '../../services/guestApi/tourImageLoader';

/** Gallery of real TourGetList / TourPackageDetails CDN photos. */
export function TourImageGallery({
  images,
  alt,
  heightClass = 'h-[220px]',
  fallbackCode = 'tour'
}: {
  images: string[];
  alt: string;
  heightClass?: string;
  fallbackCode?: string;
  destination?: string;
}) {
  const [resolved, setResolved] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setIndex(0);
    setResolved([]);

    (async () => {
      const out: string[] = [];
      for (const url of images) {
        const src = await loadTourImageSrc(url);
        if (cancelled) return;
        if (src) out.push(src);
      }
      if (cancelled) return;
      setResolved(out);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [images.join('|')]);

  const active = resolved[Math.min(index, Math.max(resolved.length - 1, 0))];

  return (
    <div className={`relative ${heightClass} bg-slate-100`}>
      {!ready ?
      <div className="w-full h-full animate-pulse bg-slate-200" /> :
      active ?
      <img
        key={active}
        src={active}
        alt={alt}
        className="w-full h-full object-cover" /> :

      <div
        className="w-full h-full"
        style={{ backgroundColor: tourCardColor(fallbackCode) }} />
      }
      {resolved.length > 1 &&
      <div className="absolute bottom-2 left-0 right-0 flex gap-1.5 overflow-x-auto no-scrollbar px-3">
          {resolved.slice(0, 20).map((src, i) =>
          <button
            key={`${i}-${src.slice(0, 24)}`}
            type="button"
            className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 ${
            src === active ? 'border-white' : 'border-white/50'}`
            }
            onClick={() => setIndex(i)}>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          )}
        </div>
      }
    </div>
  );
}

/** List card — loads live API images (CapacitorHttp / proxy), not stock photos. */
export function TourListCardImage({
  images,
  alt,
  code
}: {
  images: string[];
  alt: string;
  code: string;
  destination?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setTried(false);

    firstWorkingTourImage(images).then((next) => {
      if (cancelled) return;
      setSrc(next);
      setTried(true);
    });

    return () => {
      cancelled = true;
    };
  }, [images.join('|')]);

  if (!tried) {
    return <div className="w-full h-full animate-pulse bg-slate-200" />;
  }

  if (!src) {
    return (
      <div
        className="w-full h-full"
        style={{ backgroundColor: tourCardColor(code) }} />);

  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover" />);

}
