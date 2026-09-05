import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  Clock,
  Compass,
  HeartHandshake,
  MapPin,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Users,
  X
} from 'lucide-react';
import { KTA, cur } from './ethioTravelData';
import type { TourActivity, TourDetails, TourModality } from '../../services/guestApi';
import {
  loadTourImageSrc,
  firstWorkingTourImage
} from '../../services/guestApi/tourImageLoader';
import { tourCardColor } from '../../services/guestApi/mapTourToListing';
import { TravelErrorState } from './TravelErrorState';

type TimelineItem = {
  id: string;
  time: string;
  title: string;
  description: string;
};

function formatCategoryLabel(raw?: string): string {
  const clean = (raw || '').replace(/_/g, ' ').trim();
  if (!clean || /^tour package$/i.test(clean)) return 'Nature';
  return clean;
}

function displayRating(tour: TourActivity, details: TourDetails | null): string | null {
  if (details?.stars && details.stars > 0) return details.stars.toFixed(1);
  if (tour.stars && tour.stars > 0) return tour.stars.toFixed(1);
  if (details?.reviewCount && details.reviewCount > 0) return '4.8';
  if (tour.reviewCount && tour.reviewCount > 0) return '4.8';
  return null;
}

function guestLabel(maxPersons?: string): string {
  const n = Number(maxPersons);
  if (n > 0 && n <= 8) return `Small group · up to ${n}`;
  if (n > 0) return `Up to ${n} guests`;
  return 'Flexible group size';
}

function buildTimeline(
  details: TourDetails | null
): TimelineItem[] {
  if (!details) return [];

  if (details.itinerary.length > 0) {
    return details.itinerary.map((day, index) => ({
      id: day.id,
      time:
        index === 0 ?
          '07:00' :
          index === details.itinerary.length - 1 && details.itinerary.length > 1 ?
          'Day 2' :
          `${String(7 + index * 2).padStart(2, '0')}:30`,
      title: day.title.replace(/^Day \d+\s*:\s*/i, '').trim() || day.title,
      description:
        day.description.split('\n').filter(Boolean)[0]?.slice(0, 120) || ''
    }));
  }

  return details.dayOverview.map((day, index) => {
    const slot =
      day.morning || day.noon || day.evening || day.fullday || day.day;
    const title =
      day.morning || day.noon || day.evening || day.fullday || `Day ${index + 1}`;
    return {
      id: day.day,
      time: day.day.replace(/day/i, '').trim() ? day.day : `Day ${index + 1}`,
      title: title.length > 48 ? `${title.slice(0, 45)}…` : title,
      description: slot.length > 100 ? `${slot.slice(0, 97)}…` : slot
    };
  });
}

function goodToKnowLines(details: TourDetails | null, location: string): string[] {
  const lines: string[] = [];
  if (location) lines.push(location);
  if (details?.maxPersons) {
    lines.push(`Group size: up to ${details.maxPersons} guests`);
  }
  if (details?.duration) lines.push(`Duration: ${details.duration}`);
  if (details?.theme) lines.push(`Theme: ${details.theme}`);
  const terms = details?.terms?.split('\n').map((l) => l.trim()).filter(Boolean) ?? [];
  for (const line of terms.slice(0, 3)) {
    if (!lines.includes(line)) lines.push(line);
  }
  if (lines.length === 0) {
    lines.push(
      'Moderate fitness · steady walking recommended',
      'Bring comfortable shoes and sun protection',
      'English support available'
    );
  }
  return lines.slice(0, 4);
}

function DetailHeroGallery({
  images,
  alt,
  fallbackCode,
  category,
  rating,
  departureLabel,
  spotsLabel
}: {
  images: string[];
  alt: string;
  fallbackCode: string;
  category: string;
  rating: string | null;
  departureLabel: string;
  spotsLabel: string;
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
    <div className="mx-[18px] mt-2 rounded-[24px] overflow-hidden bg-white shadow-ios-sm border border-slate-100">
      <div className="relative h-[250px] bg-slate-100">
        {!ready ?
        <div className="w-full h-full animate-pulse bg-slate-200" /> :
        active ?
        <img src={active} alt={alt} className="w-full h-full object-cover" /> :

        <div
          className="w-full h-full"
          style={{ backgroundColor: tourCardColor(fallbackCode) }} />
        }
        <span className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white text-emerald-800 shadow-sm">
          {category}
        </span>
        {rating &&
        <span className="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white shadow-sm inline-flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            {rating} rated
          </span>
        }
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/75 via-black/35 to-transparent">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-white/90 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold tracking-[0.14em] text-white/80 uppercase">
                Next departure
              </p>
              <p className="text-[14px] font-bold text-white mt-0.5">
                {departureLabel} · {spotsLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
      {ready && resolved.length > 1 &&
      <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar bg-white">
          {resolved.slice(0, 6).map((src, i) =>
          <button
            key={`${i}-${src.slice(0, 20)}`}
            type="button"
            onClick={() => setIndex(i)}
            className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 ${
            src === active ? 'border-emerald-600' : 'border-slate-200'}`
            }>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          )}
        </div>
      }
    </div>
  );
}

export function HolidayTourDetails({
  tour,
  details,
  loading,
  error,
  apiMessage,
  selectedModality,
  modalities,
  onSelectModality,
  onChooseTickets,
  departureLabel,
  travelDateLabel,
  currencyCode = 'ETB'
}: {
  tour: TourActivity;
  details: TourDetails | null;
  loading: boolean;
  error: string | null;
  apiMessage: string | null;
  selectedModality: TourModality | null;
  modalities: TourModality[];
  onSelectModality: (mod: TourModality) => void;
  onChooseTickets: () => void;
  departureLabel?: string;
  travelDateLabel?: string;
  currencyCode?: string;
}) {
  const displayName = details?.name || tour.name;
  const displayLocation = details?.location || tour.location;
  const displayDuration = details?.duration || tour.duration;
  const gallery =
    details?.images?.length ?
      details.images :
      tour.images?.length ?
        tour.images :
        tour.image ?
          [tour.image] :
          [];
  const description =
    details?.descriptionText?.trim() ||
    tour.inclusions[0] ||
    'A locally hosted experience, ready when you are.';
  const inclusions = details?.inclusions?.length ? details.inclusions : tour.inclusions;
  const exclusions = details?.exclusions ?? [];
  const rating = displayRating(tour, details);
  const category = formatCategoryLabel(details?.category || details?.theme || tour.category);
  const maxPersons = details?.maxPersons || tour.maxPersons;
  const spotsLabel = maxPersons ? `${maxPersons} spots left` : 'Limited spots';
  const nextDeparture =
    travelDateLabel ||
    departureLabel ||
    details?.validFrom?.split(' ').slice(0, 3).join(' ') ||
    'Available soon';
  const timeline = useMemo(() => buildTimeline(details), [details]);
  const knowLines = useMemo(
    () => goodToKnowLines(details, displayLocation),
    [details, displayLocation]
  );
  const uiCurrency =
    String(currencyCode || details?.currency || tour.currency || 'ETB')
      .trim()
      .toUpperCase() || 'ETB';
  const price =
    selectedModality?.rate ??
    details?.priceBreakdown?.total ??
    details?.price ??
    tour.price;
  const cancellationText =
    details?.cancellationPolicy[0]?.charge ||
    'Free cancellation up to 72 hours before departure.';
  const hostedBy = details?.source || displayLocation || 'Local travel hosts';
  const experienceText =
    description.length > 180 ?
      description :
      highlightsToExperience(details?.highlights ?? [], description);
  const [storyImage, setStoryImage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const candidate = gallery[0];
    if (!candidate) {
      setStoryImage(null);
      return;
    }
    firstWorkingTourImage([candidate]).then((src) => {
      if (!cancelled) setStoryImage(src);
    });
    return () => {
      cancelled = true;
    };
  }, [gallery.join('|')]);

  const chooseDisabled = loading;

  return (
    <div className="flex-1 overflow-y-auto pb-28 bg-[#f4f6f8]">
      <div className="px-[18px] pt-2 pb-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-emerald-700">
            MKASH TRAVEL
          </p>
          <h2 className="text-[22px] font-bold leading-tight text-slate-900 truncate">
            {displayName}
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">Tour details</p>
        </div>
        <span className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
          <Ticket className="w-5 h-5 text-emerald-700" />
        </span>
      </div>

      <div className="px-[18px] pb-3">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((step) =>
            <span
              key={step}
              className="h-1 flex-1 rounded-full"
              style={{
                backgroundColor: step === 0 ? KTA.green : '#d9e2ec'
              }} />
          )}
        </div>
      </div>

      <DetailHeroGallery
        images={gallery}
        alt={displayName}
        fallbackCode={tour.code || tour.id}
        category={category}
        rating={rating}
        departureLabel={nextDeparture}
        spotsLabel={spotsLabel}
      />

      <div className="px-[18px] pt-4 space-y-4">
        {(loading || error || apiMessage) &&
        <div className="rounded-[16px] border border-slate-200 bg-white p-3">
            {loading &&
            <p className="text-[12px] text-slate-600">Loading tour details…</p>}
            {error &&
            <TravelErrorState
              className="mb-3"
              title="Couldn't load tour details"
              message={error} />
            }
            {apiMessage &&
            <p className="text-[12px] text-amber-800">{apiMessage}</p>}
          </div>
        }

        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-emerald-700">
              Curated experience
            </p>
            {rating &&
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                {rating}
              </span>
            }
          </div>
          <h3 className="text-[24px] font-bold text-slate-900 leading-tight">
            {displayName}
          </h3>
          <div className="flex items-center gap-1.5 mt-2 text-[13px] text-slate-500">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{displayLocation}</span>
          </div>
          <p className="text-[14px] text-slate-600 mt-3 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="rounded-[20px] overflow-hidden relative h-[170px] bg-slate-300">
          {storyImage ?
          <img
            src={storyImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover" /> :
          null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[11px] font-bold text-emerald-800">
              <Play className="w-3.5 h-3.5" />
              Story preview
            </span>
            {details?.videoLink ?
            <a
              href={details.videoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-full bg-black/55 text-[11px] font-semibold text-white">
                Watch tour
              </a> :

            <span className="px-2.5 py-1 rounded-full bg-black/55 text-[11px] font-semibold text-white">
                {gallery.length || 3} scenes · 45 sec
              </span>
            }
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-[10px] font-bold tracking-[0.14em] text-white/80 uppercase">
              Before you go
            </p>
            <p className="text-[18px] font-bold text-white leading-tight mt-1">
              See the place through a local&apos;s eyes
            </p>
          </div>
        </div>

        <div className="rounded-[20px] bg-white border border-slate-100 p-4 shadow-ios-sm">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Clock className="w-4 h-4 text-emerald-700 mb-2" />
              <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                Duration
              </p>
              <p className="text-[14px] font-bold text-slate-900 mt-1">
                {displayDuration || '1 day'}
              </p>
            </div>
            <div>
              <Calendar className="w-4 h-4 text-emerald-700 mb-2" />
              <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                Starts
              </p>
              <p className="text-[14px] font-bold text-slate-900 mt-1">
                {travelDateLabel ? 'On date' : '07:00'}
              </p>
            </div>
            <div>
              <Users className="w-4 h-4 text-emerald-700 mb-2" />
              <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                Group
              </p>
              <p className="text-[13px] font-bold text-slate-900 mt-1 leading-snug">
                {guestLabel(maxPersons)}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 text-emerald-700" />
            </span>
            <div>
              <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                Hosted by
              </p>
              <p className="text-[14px] font-bold text-slate-900">{hostedBy}</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-[20px] p-4 text-white"
          style={{ backgroundColor: '#0f172a' }}>
          <p className="text-[10px] font-bold tracking-[0.14em] text-white/60 uppercase">
            The experience
          </p>
          <h4 className="text-[20px] font-bold mt-1 leading-tight">
            A day designed to remember
          </h4>
          <p className="text-[13px] text-white/80 mt-2 leading-relaxed">
            {experienceText}
          </p>
        </div>

        {(inclusions.length > 0 || exclusions.length > 0) &&
        <div className="rounded-[20px] bg-white border border-slate-100 p-4 shadow-ios-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[12px] font-bold text-slate-900 mb-2">Included</p>
                <ul className="space-y-2">
                  {inclusions.slice(0, 5).map((line) =>
                    <li key={line} className="flex gap-2 text-[12px] text-slate-600">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{line}</span>
                    </li>
                  )}
                </ul>
              </div>
              <div className="border-l border-slate-100 pl-4">
                <p className="text-[12px] font-bold text-slate-900 mb-2">Not included</p>
                <ul className="space-y-2">
                  {(exclusions.length ? exclusions : ['Personal expenses']).slice(0, 5).map((line) =>
                    <li key={line} className="flex gap-2 text-[12px] text-slate-600">
                      <X className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{line}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        }

        {timeline.length > 0 &&
        <div className="rounded-[20px] bg-white border border-slate-100 p-4 shadow-ios-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.14em] text-emerald-700 uppercase">
                  Your route
                </p>
                <h4 className="text-[18px] font-bold text-slate-900 mt-1">
                  How the day unfolds
                </h4>
              </div>
              <span className="text-[12px] font-semibold text-slate-500 shrink-0">
                {displayDuration}
              </span>
            </div>
            <div className="space-y-4">
              {timeline.map((item) =>
                <div key={item.id} className="flex gap-3">
                  <div className="w-14 shrink-0">
                    <span className="inline-flex min-w-[3.5rem] justify-center px-2 py-1 rounded-xl bg-emerald-50 text-[11px] font-bold text-emerald-800">
                      {item.time}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-slate-900">{item.title}</p>
                    {item.description &&
                    <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        }

        <div className="rounded-[20px] bg-white border border-slate-100 p-4 shadow-ios-sm">
          <p className="text-[10px] font-bold tracking-[0.14em] text-emerald-700 uppercase">
            Plan with ease
          </p>
          <h4 className="text-[18px] font-bold text-slate-900 mt-1">
            Meeting point &amp; good to know
          </h4>
          <div className="mt-3 rounded-[16px] bg-emerald-50 p-3 flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-emerald-700" />
            </span>
            <div>
              <p className="text-[10px] font-bold tracking-wide text-emerald-700 uppercase">
                Meet here
              </p>
              <p className="text-[14px] font-bold text-slate-900 mt-0.5">
                {displayLocation}
              </p>
            </div>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {knowLines.map((line) =>
              <div
                key={line}
                className="py-2.5 flex items-start justify-between gap-3 text-[12px]">
                <span className="text-slate-500 shrink-0">Good to know</span>
                <span className="text-slate-800 font-medium text-right">{line}</span>
              </div>
            )}
          </div>
        </div>


        <div className="rounded-[20px] overflow-hidden bg-white border border-slate-100 shadow-ios-sm">
          <div className="grid grid-cols-[1fr_120px]">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <p className="text-[10px] font-bold tracking-[0.14em] text-emerald-700 uppercase">
                  Mkash travel benefit
                </p>
              </div>
              <h4 className="text-[16px] font-bold text-slate-900 leading-snug">
                Your local guide notes, saved with your voucher
              </h4>
              <p className="text-[12px] text-slate-500 mt-2 leading-relaxed">
                Spend the day with trusted hosts and keep every detail in one place
                for a smooth handoff on arrival.
              </p>
            </div>
            <div className="bg-slate-200 min-h-[120px]">
              {storyImage &&
              <img src={storyImage} alt="" className="w-full h-full object-cover" />}
            </div>
          </div>
          <div className="px-4 py-3 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-700" />
            <p className="text-[12px] font-semibold text-emerald-800">
              Curated with local hosts
            </p>
          </div>
        </div>

        <div className="rounded-[20px] bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
          </span>
          <div>
            <p className="text-[14px] font-bold text-slate-900">
              Flexible plans, protected booking
            </p>
            <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">
              {cancellationText}
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-[18px] py-3 pb-safe">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div>
            <p className="text-[11px] text-slate-500">From · per ticket</p>
            <p className="text-[22px] font-bold text-slate-900 leading-none mt-0.5">
              {cur(price, uiCurrency)}
            </p>
          </div>
          <button
            type="button"
            disabled={chooseDisabled}
            onClick={onChooseTickets}
            className="h-12 px-5 rounded-2xl text-white font-bold text-[14px] disabled:opacity-50 shrink-0"
            style={{ backgroundColor: '#047857' }}>
            Choose tickets
          </button>
        </div>
      </div>
    </div>
  );
}

function highlightsToExperience(highlights: string[], fallback: string): string {
  if (highlights.length >= 2) {
    return `Spend ${highlights[0].toLowerCase()} and ${highlights[1].toLowerCase()} with a trained guide in a small group that keeps the experience personal.`;
  }
  if (highlights.length === 1) {
    return `Enjoy ${highlights[0].toLowerCase()} with a trained guide in a small group that keeps the experience personal.`;
  }
  return fallback;
}
