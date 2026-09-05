import React, { useEffect, useState } from 'react';
import { LoaderCircle, Plane, Search, X } from 'lucide-react';
import { SignupV2BottomSheet } from './SignupV2BottomSheet';
import { useFlightAirportAutocomplete } from '../../hooks/useFlightAirportAutocomplete';
import type { FlightAirportOption } from '../../services/guestApi';

export function SignupV2AirportSheet({
  open,
  onClose,
  onSelect
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (airport: FlightAirportOption) => void;
}) {
  const [query, setQuery] = useState('');
  const airportSearch = useFlightAirportAutocomplete(query, open);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  return (
    <SignupV2BottomSheet open={open} onClose={onClose}>
      <div className="flex shrink-0 items-center justify-between px-5 pb-2">
        <h2 className="text-[18px] font-bold text-ink">Home airport or station</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-sand-50 text-ink">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="shrink-0 px-5 pb-3">
        <div className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-sand-50 px-3">
          <Search className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type city or code (e.g. Add, NBO)…"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-ink-soft focus:outline-none"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        {airportSearch.isPopular &&
          airportSearch.results.length > 0 &&
          !airportSearch.loading &&
          <p className="pb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
            Popular airports
          </p>}

        {!airportSearch.isPopular &&
          airportSearch.results.length > 0 &&
          !airportSearch.loading &&
          <p className="pb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
            Search results
          </p>}

        {airportSearch.loading ?
          <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-ink-muted">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Searching airports…
          </div> :
          null}

        {airportSearch.error ?
          <p className="py-4 text-center text-[13px] text-coral-600">{airportSearch.error}</p> :
          null}

        {!airportSearch.loading &&
          !airportSearch.error &&
          airportSearch.results.length === 0 &&
          !airportSearch.isPopular &&
          <p className="py-8 text-center text-[13px] text-ink-muted">
            No airports found for this search
          </p>}

        {airportSearch.results.map((airport) =>
          <button
            key={`${airport.code}-${airport.countryCode}-${airport.name}`}
            type="button"
            onClick={() => {
              onSelect(airport);
              onClose();
            }}
            className="flex w-full items-center gap-3 border-b border-line py-3 text-left">
            <Plane className="h-4 w-4 shrink-0 text-sea-600" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[14px] font-semibold text-ink">
                  {airport.city || airport.name}
                </p>
                <span className="shrink-0 text-[12px] font-bold text-sea-600">
                  {airport.code}
                </span>
              </div>
              <p className="truncate text-[12px] text-ink-muted">{airport.detail}</p>
            </div>
          </button>
        )}
      </div>
    </SignupV2BottomSheet>
  );
}
