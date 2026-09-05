export type PaxType = 'Adult' | 'Child' | 'Infant';

export type PassengerCounts = {
  adultCount: number;
  childrenCount: number;
  infantCount: number;
};

export const MAX_FLIGHT_PASSENGERS = 9;

/** Passenger age bands: Infant under 2, Child 2–11, Adult 12+. */
export const PAX_AGE_HINTS: Record<PaxType, string> = {
  Adult: 'Aged 12+',
  Child: 'Aged 2–11',
  Infant: 'Aged 0–2'
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDobDate(dob: string): Date | null {
  const raw = dob.trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const y = Number(match[1]);
    const m = Number(match[2]) - 1;
    const day = Number(match[3]);
    const d = new Date(y, m, day);
    if (
      Number.isNaN(d.getTime()) ||
      d.getFullYear() !== y ||
      d.getMonth() !== m ||
      d.getDate() !== day
    ) {
      return null;
    }
    return startOfDay(d);
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return startOfDay(d);
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return startOfDay(d);
}

function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Whole years completed on `asOf` for the given date of birth. */
export function ageFromDob(dob: string, asOf: Date = new Date()): number | null {
  const birth = parseDobDate(dob);
  if (!birth) return null;
  const today = startOfDay(asOf);
  if (birth > today) return null;

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Classify age into passenger type.
 * Infant: 0 to under 2 · Child: 2 to under 12 · Adult: 12+
 */
export function paxTypeFromAge(age: number): PaxType {
  if (age < 2) return 'Infant';
  if (age < 12) return 'Child';
  return 'Adult';
}

export function isDobValidForPaxType(
  dob: string,
  paxType: PaxType,
  asOf: Date = new Date()
): boolean {
  const age = ageFromDob(dob, asOf);
  if (age == null || age < 0) return false;
  return paxTypeFromAge(age) === paxType;
}

export function dobValidationMessage(
  dob: string,
  paxType: PaxType,
  asOf: Date = new Date()
): string | null {
  if (!dob.trim()) return 'Date of birth is required';
  const age = ageFromDob(dob, asOf);
  if (age == null) return 'Enter a valid date of birth';
  if (paxTypeFromAge(age) === paxType) return null;

  if (paxType === 'Infant') {
    return 'Infants must be under 2 years old (aged 0–2)';
  }
  if (paxType === 'Child') {
    return 'Children must be aged 2–11';
  }
  return 'Adults must be aged 12 or older';
}

/** Min / max calendar bounds so the DOB picker only allows the correct age band. */
export function dobBoundsForPaxType(
  paxType: PaxType,
  asOf: Date = new Date()
): { min: string; max: string } {
  const today = startOfDay(asOf);
  if (paxType === 'Infant') {
    // Under 2: born after (today − 2 years)
    const min = addYears(today, -2);
    min.setDate(min.getDate() + 1);
    return { min: toInputDate(min), max: toInputDate(today) };
  }
  if (paxType === 'Child') {
    // 2 to under 12
    const max = addYears(today, -2);
    const min = addYears(today, -12);
    min.setDate(min.getDate() + 1);
    return { min: toInputDate(min), max: toInputDate(max) };
  }
  // Adult 12+
  const max = addYears(today, -12);
  const min = addYears(today, -120);
  return { min: toInputDate(min), max: toInputDate(max) };
}

/** Clamp adults/children/infants to GuestAPI limits (max 9 travellers, infants ≤ adults). */
export function normalizePassengerCounts(counts: PassengerCounts): PassengerCounts {
  const adults = Math.min(MAX_FLIGHT_PASSENGERS, Math.max(1, counts.adultCount));
  let children = Math.max(0, counts.childrenCount);
  let infants = Math.max(0, Math.min(counts.infantCount, adults));

  while (adults + children + infants > MAX_FLIGHT_PASSENGERS) {
    if (children > 0) children--;
    else if (infants > 0) infants--;
    else break;
  }

  return { adultCount: adults, childrenCount: children, infantCount: infants };
}

export function totalPassengerCount(counts: PassengerCounts): number {
  const normalized = normalizePassengerCounts(counts);
  return (
    normalized.adultCount +
    normalized.childrenCount +
    normalized.infantCount
  );
}

export function buildPaxTypeList(counts: PassengerCounts): PaxType[] {
  const { adultCount, childrenCount, infantCount } = normalizePassengerCounts(counts);
  const adults = adultCount;
  const children = childrenCount;
  const infants = infantCount;
  const list: PaxType[] = [];
  for (let i = 0; i < adults; i++) list.push('Adult');
  for (let i = 0; i < children; i++) list.push('Child');
  for (let i = 0; i < infants; i++) list.push('Infant');
  return list;
}

export function formatPassengerSummary(counts: PassengerCounts): string {
  const parts: string[] = [];
  const { adultCount: adults, childrenCount: children, infantCount: infants } =
    normalizePassengerCounts(counts);
  if (adults > 0) parts.push(`${adults} Adult${adults === 1 ? '' : 's'}`);
  if (children > 0) parts.push(`${children} Child${children === 1 ? '' : 'ren'}`);
  if (infants > 0) parts.push(`${infants} Infant${infants === 1 ? '' : 's'}`);
  return parts.join(', ');
}

export function paxTypeLabel(paxType: PaxType, indexWithinType: number): string {
  const ord =
    indexWithinType === 0 ? '1st' :
    indexWithinType === 1 ? '2nd' :
    indexWithinType === 2 ? '3rd' :
    `${indexWithinType + 1}th`;
  return `${ord} ${paxType}`;
}
