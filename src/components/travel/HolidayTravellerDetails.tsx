import { useState } from 'react';
import { Calendar, ShieldCheck, Mail, Phone, Globe } from 'lucide-react';
import { HolidayCheckoutShell, HOLIDAY_CHECKOUT_PAD } from './HolidayCheckoutShell';
import { ApiCountrySelect } from '../ApiCountrySelect';
import {
  CalendarSheet,
  formatCalendarDateLabel,
  toCalendarInputValue
} from './CalendarSheet';
import {
  dobBoundsForPaxType,
  isPassportExpiryValidForTravel,
  minPassportExpiryIso,
  PAX_AGE_HINTS,
  toIsoTravelDate,
  type PaxType
} from '../../services/guestApi';

export type HolidayTravellerDraft = {
  paxType?: PaxType;
  title?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dob?: string;
  email?: string;
  mobile?: string;
  nationality?: string;
  country?: string;
  passport?: string;
  passportIssueDate?: string;
  passportExpiry?: string;
};

function scrollFieldIntoView(el: HTMLElement) {
  requestAnimationFrame(() => {
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  });
}

function paxLabel(
  paxType: PaxType | undefined,
  index: number,
  all: HolidayTravellerDraft[]
): string {
  const type = paxType || 'Adult';
  const within =
    all.slice(0, index + 1).filter((t) => (t.paxType || 'Adult') === type).length;
  if (type === 'Adult') {
    return within === 1 ? 'Adult 1 · Lead traveller' : `Adult ${within}`;
  }
  if (type === 'Child') return `Child ${within}`;
  return `Infant ${within}`;
}

const TITLE_OPTIONS = ['Mr', 'Mrs', 'Ms'] as const;

function genderFromTitle(title: string): string {
  if (title === 'Mrs' || title === 'Ms') return 'Female';
  return 'Male';
}

function toIsoDob(value?: string): string {
  const v = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const dmy = v.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return '';
}

type PassportDateField = 'passportIssueDate' | 'passportExpiry';

export function HolidayTravellerDetails({
  tourName,
  travellers,
  adultCount,
  childCount,
  infantCount,
  travelEndIso,
  onChange
}: {
  tourName: string;
  travellers: HolidayTravellerDraft[];
  adultCount: number;
  childCount: number;
  infantCount: number;
  /** Trip end date (YYYY-MM-DD / DD/MM/YYYY) — passport must expire after this + 1 day. */
  travelEndIso?: string;
  onChange: (
    index: number,
    field: keyof HolidayTravellerDraft,
    value: string
  ) => void;
}) {
  const [dobSheetIdx, setDobSheetIdx] = useState<number | null>(null);
  const [passportDateSheet, setPassportDateSheet] = useState<{
    travellerIdx: number;
    field: PassportDateField;
  } | null>(null);

  const summaryParts = [
    `${adultCount} Adult${adultCount === 1 ? '' : 's'}`,
    childCount > 0 ?
      `${childCount} Child${childCount === 1 ? '' : 'ren'}` :
      null,
    infantCount > 0 ?
      `${infantCount} Infant${infantCount === 1 ? '' : 's'}` :
      null
  ].filter(Boolean);

  const dobTraveller =
    dobSheetIdx != null ? travellers[dobSheetIdx] : null;
  const dobBounds = dobBoundsForPaxType(dobTraveller?.paxType || 'Adult');

  const todayIso = toCalendarInputValue(new Date());
  const minPassportExpiry =
    minPassportExpiryIso(travelEndIso) || todayIso;
  const passportExpiryHint = toIsoTravelDate(travelEndIso) ?
    `Must expire on or after ${formatCalendarDateLabel(minPassportExpiry)} (later than trip end — e.g. return 23 Sep → expiry from 24 Sep).` :
    'Must be today or a future date.';

  const passportSheetTraveller =
    passportDateSheet != null ?
      travellers[passportDateSheet.travellerIdx] :
      null;
  const passportSheetConfig = (() => {
    if (!passportDateSheet || !passportSheetTraveller) return null;
    if (passportDateSheet.field === 'passportIssueDate') {
      return {
        title: 'Passport issue date',
        value: passportSheetTraveller.passportIssueDate || '',
        max: todayIso,
        min: toIsoDob(passportSheetTraveller.dob) || undefined
      };
    }
    const issue = toIsoTravelDate(passportSheetTraveller.passportIssueDate);
    let min = minPassportExpiry;
    if (issue && issue > min) min = issue;
    return {
      title: 'Passport expiry date',
      value: passportSheetTraveller.passportExpiry || '',
      min
    };
  })();

  return (
    <HolidayCheckoutShell
      tourName={tourName}
      stepLabel="Traveller details"
      progressFilled={3}>
      <div className={`${HOLIDAY_CHECKOUT_PAD} space-y-3.5 pb-4`}>
        <div>
          <h3 className="text-[22px] font-bold text-slate-900 leading-tight">
            Traveller details
          </h3>
          <p className="text-[13px] text-slate-500 mt-1.5">
            Enter details for {summaryParts.join(' · ')}. Each person is sent in
            the booking passenger list.
          </p>
        </div>

        {travellers.map((traveller, index) => (
          <div
            key={`${traveller.paxType || 'Adult'}-${index}`}
            className="rounded-[16px] bg-white border border-slate-100 p-3.5 shadow-ios-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 text-[14px] font-bold flex items-center justify-center">
                {index + 1}
              </span>
              <div>
                <p className="text-[16px] font-bold text-slate-900">
                  {paxLabel(traveller.paxType, index, travellers)}
                </p>
                <p className="text-[11px] text-slate-500 capitalize">
                  {(traveller.paxType || 'Adult').toLowerCase()}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="ui-form-label">
                  Title<span className="req">*</span>
                </label>
                <div className="flex gap-2">
                  {TITLE_OPTIONS.map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => {
                        onChange(index, 'title', title);
                        onChange(index, 'gender', genderFromTitle(title));
                      }}
                      className={`flex-1 h-11 rounded-[12px] border text-[13px] font-bold transition-colors ${
                        traveller.title === title ||
                        (title === 'Ms' && traveller.title === 'MS') ?
                          'border-emerald-600 text-emerald-700 bg-emerald-50' :
                          'border-slate-200 text-slate-600 bg-white'
                      }`}>
                      {title}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="ui-form-label">
                  First name<span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="given-name"
                  autoComplete="given-name"
                  value={traveller.firstName || ''}
                  onChange={(e) => onChange(index, 'firstName', e.target.value)}
                  onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                  placeholder="As on passport"
                  aria-label="First name as on passport"
                  className="w-full h-12 rounded-[14px] border border-slate-200 px-3 text-[14px] focus:border-emerald-600 focus:outline-none" />
              </div>

              <div>
                <label className="ui-form-label">
                  Last name<span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="family-name"
                  autoComplete="family-name"
                  value={traveller.lastName || ''}
                  onChange={(e) => onChange(index, 'lastName', e.target.value)}
                  onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                  placeholder="As on passport"
                  aria-label="Last name as on passport"
                  className="w-full h-12 rounded-[14px] border border-slate-200 px-3 text-[14px] focus:border-emerald-600 focus:outline-none" />
              </div>

              <div>
                <label className="ui-form-label">
                  Date of birth<span className="req">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setDobSheetIdx(index)}
                  className="w-full h-12 rounded-[14px] border border-slate-200 px-3 text-[14px] text-left flex items-center justify-between gap-2 bg-white active:bg-slate-50 focus:border-emerald-600 focus:outline-none">
                  <span
                    className={
                      traveller.dob ? 'text-slate-900' : 'text-slate-400'
                    }>
                    {formatCalendarDateLabel(
                      toIsoDob(traveller.dob),
                      'DD / MM / YYYY'
                    )}
                  </span>
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
                <p className="ui-form-hint">
                  {PAX_AGE_HINTS[traveller.paxType || 'Adult']}
                </p>
              </div>

              <div>
                <label className="ui-form-label">
                  Gender<span className="req">*</span>
                </label>
                <div className="flex gap-2">
                  {(['Male', 'Female'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => onChange(index, 'gender', g)}
                      className={`flex-1 h-11 rounded-[12px] border text-[13px] font-bold transition-colors ${
                        traveller.gender === g ?
                          'border-emerald-600 text-emerald-700 bg-emerald-50' :
                          'border-slate-200 text-slate-600 bg-white'
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="ui-form-label">
                  Passport / ID number<span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="passport-number"
                  value={traveller.passport || ''}
                  onChange={(e) => onChange(index, 'passport', e.target.value)}
                  onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                  placeholder="Document number"
                  aria-label="Passport or ID document number"
                  className="w-full h-12 rounded-[14px] border border-slate-200 px-3 text-[14px] focus:border-emerald-600 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="ui-form-label">
                    Issue date<span className="req">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setPassportDateSheet({
                        travellerIdx: index,
                        field: 'passportIssueDate'
                      })
                    }
                    className="w-full h-12 rounded-[14px] border border-slate-200 px-3 text-[14px] text-left flex items-center justify-between gap-2 bg-white active:bg-slate-50 focus:border-emerald-600 focus:outline-none">
                    <span
                      className={
                        traveller.passportIssueDate ?
                          'text-slate-900' :
                          'text-slate-400'
                      }>
                      {formatCalendarDateLabel(
                        traveller.passportIssueDate || '',
                        'DD / MM / YYYY'
                      )}
                    </span>
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                </div>
                <div>
                  <label className="ui-form-label">
                    Expiry date<span className="req">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setPassportDateSheet({
                        travellerIdx: index,
                        field: 'passportExpiry'
                      })
                    }
                    className="w-full h-12 rounded-[14px] border border-slate-200 px-3 text-[14px] text-left flex items-center justify-between gap-2 bg-white active:bg-slate-50 focus:border-emerald-600 focus:outline-none">
                    <span
                      className={
                        traveller.passportExpiry ?
                          'text-slate-900' :
                          'text-slate-400'
                      }>
                      {formatCalendarDateLabel(
                        traveller.passportExpiry || '',
                        'DD / MM / YYYY'
                      )}
                    </span>
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                </div>
              </div>
              <p className="ui-form-hint !mt-0">{passportExpiryHint}</p>

              <div>
                <label className="ui-form-label">
                  {index === 0 ? 'Email address' : 'Email'}
                  <span className="req">*</span>
                </label>
                {index === 0 &&
                <p className="ui-form-hint mb-1.5 -mt-0.5">
                  Voucher and booking updates go here
                </p>
                }
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={traveller.email || ''}
                    onChange={(e) => onChange(index, 'email', e.target.value)}
                    onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                    placeholder="name@gmail.com"
                    aria-label="Email address"
                    className="w-full h-12 rounded-[14px] border border-slate-200 pl-9 pr-3 text-[14px] focus:border-emerald-600 focus:outline-none bg-white" />
                </div>
              </div>

              <div>
                <label className="ui-form-label">
                  Mobile number<span className="req">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-slate-400" />
                  <input
                    type="tel"
                    name="tel"
                    autoComplete="tel"
                    value={traveller.mobile || ''}
                    onChange={(e) => onChange(index, 'mobile', e.target.value)}
                    onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                    placeholder="+251 911 234 567"
                    aria-label="Mobile number"
                    className="w-full h-12 rounded-[14px] border border-slate-200 pl-9 pr-3 text-[14px] focus:border-emerald-600 focus:outline-none bg-white" />
                </div>
              </div>

              <ApiCountrySelect
                label="Nationality *"
                placeholder="Select country of nationality"
                value={traveller.nationality || ''}
                icon={<Globe className="w-4 h-4" />}
                onChange={(name, _id, code) => {
                  // Prefer country name for GuestAPI demonym mapping (Indian, Ethiopian…).
                  onChange(index, 'nationality', name || code || '');
                }}
              />

              <ApiCountrySelect
                label="Country of residence *"
                placeholder="Select country"
                value={traveller.country || ''}
                icon={<Globe className="w-4 h-4" />}
                onChange={(name, _id, code) => {
                  onChange(
                    index,
                    'country',
                    code ? `${name} - ${code}` : name
                  );
                }}
              />
            </div>
          </div>
        ))}

        <div className="rounded-[16px] bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <p className="text-[13px] text-slate-700 leading-relaxed">
            Your information is shared only with the experience provider to issue
            your tickets for all {travellers.length} traveller
            {travellers.length === 1 ? '' : 's'}.
          </p>
        </div>
      </div>

      <CalendarSheet
        open={dobSheetIdx !== null}
        title={
          dobTraveller ?
            `Date of birth · ${PAX_AGE_HINTS[dobTraveller.paxType || 'Adult']}` :
            'Select date of birth'
        }
        value={toIsoDob(dobTraveller?.dob)}
        min={dobBounds.min}
        max={dobBounds.max}
        onClose={() => setDobSheetIdx(null)}
        onSelect={(value) => {
          if (dobSheetIdx === null) return;
          onChange(dobSheetIdx, 'dob', value);
          setDobSheetIdx(null);
        }}
      />

      <CalendarSheet
        open={passportDateSheet !== null}
        title={passportSheetConfig?.title || 'Select date'}
        value={passportSheetConfig?.value || ''}
        min={passportSheetConfig?.min}
        max={passportSheetConfig?.max}
        onClose={() => setPassportDateSheet(null)}
        onSelect={(value) => {
          if (!passportDateSheet) return;
          const { travellerIdx, field } = passportDateSheet;
          onChange(travellerIdx, field, value);
          if (field === 'passportIssueDate') {
            const existing =
              travellers[travellerIdx]?.passportExpiry?.trim() || '';
            if (
              existing &&
              (existing < value ||
                existing < todayIso ||
                existing < minPassportExpiry)
            ) {
              onChange(travellerIdx, 'passportExpiry', '');
            }
          }
          setPassportDateSheet(null);
        }}
      />
    </HolidayCheckoutShell>
  );
}

/** True when every selected holiday passenger has the fields GuestAPI needs. */
export function isHolidayTravellerComplete(
  traveller: HolidayTravellerDraft,
  options?: {
    requireContact?: boolean;
    travelEndIso?: string;
    requirePassport?: boolean;
  }
): boolean {
  const requireContact = options?.requireContact !== false;
  const requirePassport = options?.requirePassport !== false;
  const issueOk = !!(
    traveller.passportIssueDate?.trim() &&
    toIsoTravelDate(traveller.passportIssueDate) <= toCalendarInputValue(new Date())
  );
  const expiryOk = isPassportExpiryValidForTravel(
    traveller.passportExpiry || '',
    options?.travelEndIso,
    traveller.passportIssueDate
  );
  return !!(
    traveller.title?.trim() &&
    traveller.firstName?.trim() &&
    traveller.lastName?.trim() &&
    traveller.gender?.trim() &&
    traveller.dob?.trim() &&
    traveller.nationality?.trim() &&
    traveller.country?.trim() &&
    (!requirePassport ||
      (traveller.passport?.trim() && issueOk && expiryOk)) &&
    (!requireContact ||
      (traveller.email?.trim() && traveller.mobile?.trim()))
  );
}
