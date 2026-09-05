import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Compass,
  MapPin,
  Mountain,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Ticket,
  TreePine,
  Users
} from 'lucide-react';
import { KTA, cur } from './ethioTravelData';
import type { TourActivity } from '../../services/guestApi';
import { shortTourCategoryLabel } from '../../services/guestApi/mapTourToListing';
import type { TourCategory, TourTheme } from '../../services/guestApi/tour';
import { useTourCategories } from '../../hooks/useTourCategories';
import { TravelErrorState } from './TravelErrorState';
import { useTourThemes } from '../../hooks/useTourThemes';
import { TourListCardImage } from './TourImages';

type SortKey = 'Departure time' | 'Recommended' | 'Cheapest price';

const ETHIOPIA_MARKERS =
  /ethiopia|addis|lalibela|amhara|gondar|bahir|afar|simien|hawassa|axum|dire dawa|omo|bale/i;

function isDomesticTour(tour: TourActivity, destination: string): boolean {
  const blob = `${tour.country} ${tour.location} ${destination}`;
  return ETHIOPIA_MARKERS.test(blob);
}

function tourBelongsToCategory(
  tour: TourActivity,
  category: TourCategory,
  destination: string
): boolean {
  const tourCategoryId =
    tour.categoryId ??
    Number(tour.apiPayload?.CategoryId ?? tour.apiPayload?.PackageCategoryId);
  if (Number.isFinite(tourCategoryId) && tourCategoryId > 0) {
    return tourCategoryId === category.id;
  }

  const name = category.name.toLowerCase();
  if (name.includes('domestic')) return isDomesticTour(tour, destination);
  if (name.includes('international')) {
    return !isDomesticTour(tour, destination);
  }
  return false;
}

function countToursForCategory(
  tours: TourActivity[],
  category: TourCategory,
  destination: string
): number {
  return tours.filter((t) => tourBelongsToCategory(t, category, destination)).length;
}

function shortTourThemeLabel(name: string): string {
  return (
    name.
      replace(/\btour theme\b/gi, '').
      replace(/\btour packages\b/gi, '').
      replace(/\s+/g, ' ').
      trim() || name.trim()
  );
}

function themeIcon(label: string) {
  const text = label.toLowerCase();
  if (text.includes('all')) return Compass;
  if (
    text.includes('wildlife') ||
    text.includes('hill') ||
    text.includes('summer') ||
    text.includes('winter')
  ) {
    return TreePine;
  }
  if (
    text.includes('heritage') ||
    text.includes('devotional') ||
    text.includes('pilgrimage')
  ) {
    return Ticket;
  }
  return Mountain;
}

function themeMatchesTour(tour: TourActivity, theme: TourTheme): boolean {
  const label = shortTourThemeLabel(theme.name).toLowerCase();
  if (!label || label === 'all') return true;

  const text = [
    tour.name,
    tour.location,
    tour.category,
    tour.guide,
    ...tour.inclusions
  ].join(' ').toLowerCase();

  const keywordMap: Array<{ match: RegExp; keywords: string[] }> = [
    { match: /beach/, keywords: ['beach', 'island', 'marina', 'cruise', 'sea'] },
    { match: /devotional/, keywords: ['devotional', 'spiritual', 'sacred'] },
    { match: /family/, keywords: ['family', 'kids', 'children'] },
    { match: /heritage/, keywords: ['heritage', 'museum', 'historic', 'culture'] },
    { match: /hill station/, keywords: ['hill', 'highland', 'mountain', 'trek'] },
    { match: /honeymoon/, keywords: ['honeymoon', 'couple', 'romantic'] },
    { match: /pilgrimage/, keywords: ['pilgrimage', 'church', 'temple', 'monastery'] },
    { match: /summer/, keywords: ['summer', 'sun', 'outdoor'] },
    { match: /wildlife/, keywords: ['wildlife', 'safari', 'park', 'nature'] },
    { match: /winter/, keywords: ['winter', 'snow', 'ski', 'cold'] }
  ];

  const mapping = keywordMap.find((entry) => entry.match.test(label));
  if (mapping) return mapping.keywords.some((keyword) => text.includes(keyword));

  return text.includes(label);
}

function formatCategoryLabel(raw: string): string {
  const clean = raw.replace(/_/g, ' ').trim();
  if (!clean || /^tour package$/i.test(clean)) return 'Tour package';
  return clean;
}

function tourDescription(tour: TourActivity): string {
  if (tour.inclusions[0]) {
    const line = tour.inclusions[0];
    return line.length > 120 ? `${line.slice(0, 117)}…` : line;
  }
  if (tour.guide && !/^up to \d+ guests$/i.test(tour.guide)) return tour.guide;
  return 'A locally hosted experience, ready when you are.';
}

function guestTag(tour: TourActivity): string {
  if (tour.maxPersons) {
    const n = Number(tour.maxPersons);
    if (n > 0 && n <= 8) return `Small group • up to ${n} guests`;
    return `Up to ${tour.maxPersons} guests`;
  }
  return 'Flexible group size';
}

function hasFreeCancellation(tour: TourActivity): boolean {
  const blob = `${tour.inclusionsHtml} ${tour.inclusions.join(' ')}`.toLowerCase();
  return /free cancel|cancellation/.test(blob);
}

function sortTours(tours: TourActivity[], sort: SortKey): TourActivity[] {
  const list = [...tours];
  if (sort === 'Cheapest price') {
    return list.sort((a, b) => a.price - b.price);
  }
  if (sort === 'Departure time') {
    return list.sort((a, b) => a.duration.localeCompare(b.duration));
  }
  return list;
}

function tourGallery(tour: TourActivity): string[] {
  return tour.images?.length ? tour.images : tour.image ? [tour.image] : [];
}

function FeaturedHeroCard({
  tour,
  categoryLabel,
  currencyCode,
  onSelect
}: {
  tour: TourActivity;
  categoryLabel: string;
  currencyCode: string;
  onSelect: () => void;
}) {
  const gallery = tourGallery(tour);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left rounded-[22px] overflow-hidden shadow-ios-md mb-4 active:scale-[0.99] transition-transform">
      <div className="relative h-[280px] bg-slate-200">
        <TourListCardImage
          images={gallery}
          alt={tour.name}
          code={tour.code || tour.id}
          destination={tour.location} />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.05) 100%)'
          }} />
        <span className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white text-emerald-800 shadow-sm">
          Featured {categoryLabel} pick
        </span>
        <span className="absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/55 text-white backdrop-blur-sm">
          {tour.duration} · Available
        </span>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-[10px] font-bold tracking-[0.14em] text-white/85 uppercase">
            {formatCategoryLabel(tour.category)} · {tour.duration}
          </p>
          <p className="text-[22px] font-bold text-white leading-tight mt-1">
            {tour.name}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <MapPin className="w-3.5 h-3.5 text-white/80 shrink-0" />
            <span className="text-[12px] text-white/90">{tour.location}</span>
          </div>
          <p className="text-[12px] text-white/80 mt-2 line-clamp-2">
            {tourDescription(tour)}
          </p>
          <div className="flex items-end justify-between mt-4 gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-wide text-white/70 uppercase">
                From · per person
              </p>
              <p className="text-[22px] font-bold text-white leading-none mt-0.5">
                {cur(tour.price, currencyCode || tour.currency || 'ETB')}
              </p>
            </div>
            <span className="shrink-0 px-4 py-2.5 rounded-full bg-white text-[13px] font-bold text-emerald-800">
              Explore tour
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ExploreTourCard({
  tour,
  currencyCode,
  onSelect
}: {
  tour: TourActivity;
  currencyCode: string;
  onSelect: () => void;
}) {
  const gallery = tourGallery(tour);
  const hasImage = gallery.length > 0;
  const rating =
    tour.stars && tour.stars > 0 ?
      tour.stars.toFixed(1) :
      tour.reviewCount && tour.reviewCount > 0 ?
      '4.8' :
      null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left rounded-[20px] overflow-hidden bg-white shadow-ios-sm border mb-4 active:scale-[0.99] transition-transform"
      style={{ borderColor: KTA.border }}>
      {hasImage &&
      <div className="relative h-[180px] bg-slate-100">
          <TourListCardImage
          images={gallery}
          alt={tour.name}
          code={tour.code || tour.id}
          destination={tour.location} />

          <span className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white text-emerald-800 shadow-sm">
            {formatCategoryLabel(tour.category)}
          </span>
          {rating &&
        <span className="absolute top-3 right-3 text-[11px] font-bold px-2 py-1 rounded-full bg-white shadow-sm inline-flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              {rating}
            </span>
        }
          <span className="absolute bottom-3 left-3 text-[11px] font-semibold px-2 py-1 rounded-full bg-black/55 text-white inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {tour.duration}
          </span>
        </div>
      }
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className="text-[17px] font-bold leading-tight"
              style={{ color: KTA.textPrimary }}>
              {tour.name}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[12px] text-slate-500 truncate">
                {tour.location}
              </span>
            </div>
          </div>
          <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-emerald-700" />
          </span>
        </div>
        <p className="text-[13px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
          {tourDescription(tour)}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            <Users className="w-3.5 h-3.5" />
            {guestTag(tour)}
          </span>
          {hasFreeCancellation(tour) &&
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              Free cancellation
            </span>
          }
        </div>
        <div className="flex items-end justify-between mt-4 gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
              From · per person
            </p>
            <p
              className="text-[22px] font-bold leading-none mt-0.5"
              style={{ color: KTA.green }}>
              {cur(tour.price, currencyCode || tour.currency || 'ETB')}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white shrink-0"
            style={{ backgroundColor: '#047857' }}>
            Explore
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </button>
  );
}

export function HolidayToursResults({
  tours,
  loading,
  error,
  apiMessage,
  destination,
  travellersLabel,
  sort,
  onSortChange,
  onSelectTour,
  currencyCode = 'ETB'
}: {
  tours: TourActivity[];
  loading: boolean;
  error: string | null;
  apiMessage: string | null;
  destination: string;
  travellersLabel: string;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  onSelectTour: (tour: TourActivity) => void;
  currencyCode?: string;
}) {
  const { categories } = useTourCategories(true);
  const { themes } = useTourThemes(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [showSort, setShowSort] = useState(false);

  const activeCategory =
    categories.find((c) => c.id === selectedCategoryId) ?? categories[0];
  const activeTheme =
    themes.find((theme) => theme.id === selectedThemeId) ?? themes[0] ?? null;

  const categoryTours = useMemo(() => {
    if (!activeCategory) return tours;
    return tours.filter((t) =>
      tourBelongsToCategory(t, activeCategory, destination)
    );
  }, [tours, activeCategory, destination]);

  useEffect(() => {
    if (categories.length === 0) return;

    if (
      selectedCategoryId != null &&
      categories.some((c) => c.id === selectedCategoryId)
    ) {
      const current = categories.find((c) => c.id === selectedCategoryId);
      if (
        current &&
        (tours.length === 0 ||
          countToursForCategory(tours, current, destination) > 0)
      ) {
        return;
      }
    }

    const withTours = categories.find(
      (c) => countToursForCategory(tours, c, destination) > 0
    );
    setSelectedCategoryId(withTours?.id ?? categories[0]?.id ?? null);
  }, [categories, tours, destination, selectedCategoryId]);

  useEffect(() => {
    if (themes.length === 0) return;
    if (
      selectedThemeId != null &&
      themes.some((theme) => theme.id === selectedThemeId)
    ) {
      return;
    }
    setSelectedThemeId(themes[0]?.id ?? null);
  }, [themes, selectedThemeId]);

  const filteredTours = useMemo(() => {
    const base =
      activeTheme ?
        categoryTours.filter((t) => themeMatchesTour(t, activeTheme)) :
        categoryTours;
    const sorted = sortTours(base, sort);
    // If chips filter everything out (mismatched API category IDs), still show tours.
    if (sorted.length === 0 && tours.length > 0) {
      return sortTours(tours, sort);
    }
    return sorted;
  }, [activeTheme, categoryTours, sort, tours]);

  const featured = filteredTours[0] ?? categoryTours[0] ?? tours[0];
  const listTours = featured ?
    filteredTours.filter((t) => t.id !== featured.id) :
    filteredTours;

  const scopeLabel = activeCategory ?
    shortTourCategoryLabel(activeCategory.name) :
    'Tour';

  // Only wait for the tour search when we have nothing to show yet.
  if (loading && tours.length === 0) {
    return (
      <div className="px-[18px] pt-2 pb-6 space-y-4">
        <div className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-[280px] rounded-[22px] bg-slate-100 animate-pulse" />
        <div className="h-11 rounded-full bg-slate-100 animate-pulse" />
        <div className="h-40 rounded-[20px] bg-slate-100 animate-pulse" />
        <div className="h-52 rounded-[20px] bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="px-[18px] pt-2 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className="text-[11px] font-bold tracking-[0.16em] uppercase"
              style={{ color: KTA.green }}>
              MKASH TRAVEL
            </p>
            <h2
              className="text-[26px] font-bold leading-tight mt-0.5"
              style={{ color: KTA.textPrimary }}>
              Tours &amp; Activities
            </h2>
            <p className="text-[13px] mt-1.5 leading-relaxed text-slate-500">
              Curated experiences with trusted local hosts, from a few hours to
              unforgettable weekends.
            </p>
            {destination &&
            <p className="text-[12px] mt-2 text-slate-400">
                {destination}
                {travellersLabel ? ` · ${travellersLabel}` : ''}
              </p>
            }
          </div>
          <span className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Ticket className="w-5 h-5 text-emerald-700" />
          </span>
        </div>
      </div>

      {error &&
      <div className="mx-[18px] mb-4">
          <TravelErrorState
            variant="panel"
            title="Couldn't load tours"
            message={error} />
        </div>
      }

      {apiMessage && tours.length === 0 &&
      <div className="mx-[18px] mb-4 glass-alert-warning p-3 text-center">
          <p className="text-[12px] text-amber-800">{apiMessage}</p>
        </div>
      }

      {tours.length === 0 && !error ?
      <div className="mx-[18px] rounded-[22px] border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-[16px] font-bold text-slate-900 mb-1">
            No tours found
          </p>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            Try another destination or travel dates. We will show curated picks
            here as soon as tours are available.
          </p>
        </div> :

      <>
          {featured &&
        <div className="px-[18px]">
              <FeaturedHeroCard
            tour={featured}
            categoryLabel={scopeLabel}
            currencyCode={currencyCode}
            onSelect={() => onSelectTour(featured)} />

            </div>
        }

          {categories.length > 0 &&
          <div className="px-[18px] mb-4">
            <div
            className="flex p-1 rounded-full border"
            style={{ borderColor: KTA.border, backgroundColor: '#fff' }}>
              {categories.map((category) => {
              const active = activeCategory?.id === category.id;
              const count = countToursForCategory(tours, category, destination);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className="flex-1 py-2.5 rounded-full text-[13px] font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? '#ECFDF3' : 'transparent',
                    color: active ? KTA.green : KTA.textSecondary
                  }}>
                  {shortTourCategoryLabel(category.name)} ({count})
                </button>);

            })}
            </div>
          </div>
          }

          <div className="px-[18px] mb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                className="text-[11px] font-bold tracking-[0.14em] uppercase"
                style={{ color: KTA.green }}>
                  Find your day out
                </p>
                <p
                className="text-[20px] font-bold mt-0.5"
                style={{ color: KTA.textPrimary }}>
                  {scopeLabel} experiences
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {filteredTours.length} experience
                  {filteredTours.length === 1 ? '' : 's'} curated for you
                </p>
              </div>
              <button
              type="button"
              onClick={() => setShowSort((v) => !v)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full border bg-white text-[12px] font-semibold"
              style={{ borderColor: KTA.border, color: KTA.green }}>
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {showSort &&
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-[18px] pb-3">
              {(['Recommended', 'Cheapest price', 'Departure time'] as const).map(
            (key) => {
              const active = sort === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onSortChange(key);
                    setShowSort(false);
                  }}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? KTA.green : '#fff',
                    color: active ? '#fff' : KTA.textSecondary,
                    border: `1px solid ${active ? KTA.green : KTA.border}`
                  }}>
                  {key === 'Cheapest price' ? 'Cheapest' : key}
                </button>);

            }
          )}
            </div>
        }

          <div className="flex gap-2 overflow-x-auto no-scrollbar px-[18px] pb-4">
            {themes.map((theme) => {
            const label = shortTourThemeLabel(theme.name);
            const Icon = themeIcon(label);
            const active = activeTheme?.id === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelectedThemeId(theme.id)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-colors border"
                style={{
                  backgroundColor: active ? KTA.green : '#fff',
                  color: active ? '#fff' : KTA.textSecondary,
                  borderColor: active ? KTA.green : KTA.border
                }}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>);

          })}
          </div>

          <div className="px-[18px]">
            <p className="text-[11px] font-bold tracking-[0.14em] text-slate-400 uppercase mb-3">
              More to explore
            </p>

            {filteredTours.length === 0 ?
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-white p-6 text-center mb-4">
                <p className="text-[14px] font-semibold text-slate-900 mb-1">
                  No {scopeLabel.toLowerCase()} tours in this category
                </p>
                <p className="text-[12px] text-slate-500">
                  Switch tabs or try another category filter.
                </p>
              </div> :

          listTours.map((tour) =>
          <ExploreTourCard
            key={tour.id}
            tour={tour}
            currencyCode={currencyCode}
            onSelect={() => onSelectTour(tour)} />

          )
          }
          </div>
        </>
      }
    </div>
  );
}
