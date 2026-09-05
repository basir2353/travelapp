import type { TourModality } from '../../services/guestApi';

export const HOLIDAY_BOOKING_FEE = 80;

export function buildHolidayTicketOptions(
  modalities: TourModality[],
  basePrice: number
): TourModality[] {
  if (modalities.length >= 2) return modalities;

  if (modalities.length === 1) {
    const standard = modalities[0];
    return [
      standard,
      {
        id: `${standard.id}-premium`,
        code: 'premium',
        name: 'Premium ticket',
        rate: Math.round(standard.rate * 1.35),
        rateKey: 'premium',
        duration: standard.duration,
        cancelBy: standard.cancelBy,
        cancelAmount: standard.cancelAmount
      }
    ];
  }

  const premiumRate = Math.round(basePrice * 1.35);
  return [
    {
      id: 'standard',
      code: 'standard',
      name: 'Standard ticket',
      rate: basePrice,
      rateKey: 'standard',
      duration: '1 day'
    },
    {
      id: 'premium',
      code: 'premium',
      name: 'Premium ticket',
      rate: premiumRate > basePrice ? premiumRate : basePrice + 1120,
      rateKey: 'premium',
      duration: '1 day'
    }
  ];
}

export function ticketOptionDescription(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('premium')) {
    return 'Priority booking with a smaller-group experience';
  }
  return 'Guided experience with all listed inclusions';
}
