import React, { useEffect, useState } from 'react';
import { ChevronRight, LoaderCircle, Plane } from 'lucide-react';
import { SignupV2ServiceGrid } from '../SignupV2ServiceGrid';
import { SignupV2AirportSheet } from '../SignupV2AirportSheet';
import {
  FALLBACK_CURRENCIES,
  getAllCurrency,
  type GuestCurrency
} from '../../../services/guestApi/currency';
import { currencyFlagEmoji, sortGuestCurrencies } from '../../../utils/currencyDisplay';
import type { RegisterV2StepProps } from '../../../types/registerV2';

export function SignupV2PreferencesStep({ form, errors, update }: RegisterV2StepProps) {
  const [currencies, setCurrencies] = useState<GuestCurrency[]>(FALLBACK_CURRENCIES);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [airportSheetOpen, setAirportSheetOpen] = useState(false);

  useEffect(() => {
    if (form.interests.includes('visa')) {
      update({
        interests: form.interests.filter((id) => id !== 'visa')
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingCurrencies(true);
    getAllCurrency()
      .then((items) => {
        if (cancelled) return;
        const sorted = sortGuestCurrencies(items.length > 0 ? items : FALLBACK_CURRENCIES);
        setCurrencies(sorted);
        if (!sorted.some((item) => item.code === form.currency) && sorted[0]) {
          update({ currency: sorted[0].code });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setCurrencies(sortGuestCurrencies(FALLBACK_CURRENCIES));
      })
      .finally(() => {
        if (!cancelled) setLoadingCurrencies(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleInterest = (id: string) => {
    update({
      interests: form.interests.includes(id) ?
        form.interests.filter((item) => item !== id) :
        [...form.interests, id]
    });
  };

  return (
    <>
      <div className="min-w-0 space-y-5">
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">What do you book most?</p>
          <SignupV2ServiceGrid selected={form.interests} onToggle={toggleInterest} />
          {errors.interests ?
            <p className="mt-2 text-[13px] font-medium text-coral-600" role="alert">
              {errors.interests}
            </p> :
            null}
        </div>

        <div className="min-w-0" role="group" aria-labelledby="signup-v2-currency-label">
          <p id="signup-v2-currency-label" className="mb-2 text-[13px] font-semibold text-ink">
            Pay and display in
          </p>
          <div className="-mx-5 min-w-0 px-5 sm:-mx-6 sm:px-6">
            <div className="signup-v2-currency-scroll">
              <div className="signup-v2-currency-track">
                {loadingCurrencies && currencies.length === 0 ?
                  <div className="flex shrink-0 items-center gap-2 px-1 py-2 text-[13px] text-ink-muted">
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading currencies…
                  </div> :
                  currencies.map((item) => {
                    const isActive = item.code === form.currency;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => update({ currency: item.code })}
                        aria-pressed={isActive}
                        title={item.name}
                        className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-[13px] font-bold transition-colors duration-150 ease-swift active:scale-[0.97] ${
                          isActive ?
                            'border-sea-600 bg-sea-600 text-white' :
                            'border-line bg-white text-ink-muted'
                        }`}>
                        <span aria-hidden="true">{currencyFlagEmoji(item.code)}</span>
                        {item.code}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
          <p className="mt-2 text-[13px] text-ink-soft">
            {loadingCurrencies ?
              'Fetching supported currencies…' :
              form.currency === 'ETB' ?
                'Every price is shown in ETB. Switch anytime in settings.' :
                `Prices show in ${form.currency} with the ETB total alongside.`}
          </p>
        </div>

        <div>
          <label htmlFor="register-airport" className="mb-2 block text-[13px] font-semibold text-ink">
            Home airport or station
          </label>
          <button
            id="register-airport"
            type="button"
            onClick={() => setAirportSheetOpen(true)}
            className="flex h-14 w-full items-center rounded-2xl border border-line bg-sand-50 px-4 text-left transition-colors duration-150 ease-swift hover:border-sea-500 hover:bg-white focus:border-sea-500 focus:bg-white focus:outline-none">
            <Plane className="mr-3 h-[18px] w-[18px] shrink-0 text-ink-soft" aria-hidden="true" />
            <span
              className={`min-w-0 flex-1 truncate text-[15px] font-medium ${
                form.homeAirport ? 'text-ink' : 'text-ink-soft'
              }`}>
              {form.homeAirport || 'e.g. Addis Ababa Bole (ADD)'}
            </span>
            <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
          </button>
          <p className="mt-2 text-[13px] text-ink-soft">
            Used to price fares and rail routes from your doorstep.
          </p>
        </div>
      </div>

      <SignupV2AirportSheet
        open={airportSheetOpen}
        onClose={() => setAirportSheetOpen(false)}
        onSelect={(airport) => {
          update({ homeAirport: airport.label });
        }}
      />
    </>
  );
}
