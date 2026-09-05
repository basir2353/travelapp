/**
 * Verify SaveBooking JSON builders match API field requirements.
 * Run: node scripts/verify-save-booking-payload.mjs
 */

import {
  buildSaveBookingPayload,
  buildReqPassengerJson,
  formatNationality
} from '../src/services/guestApi/mapSaveBooking.ts';
import { buildPaxTypeList } from '../src/services/guestApi/buildFlightTravellers.ts';

const travellers = buildPaxTypeList({
  adultCount: 2,
  childrenCount: 1,
  infantCount: 1
}).map((paxType, index) => ({
  paxType,
  title: paxType === 'Adult' ? 'Mr' : 'Mstr',
  firstName: `First${index + 1}`,
  middleName: 'Middle.',
  lastName: `Last${index + 1}.`,
  gender: 'Male',
  dob: '1990-01-01',
  nationality: 'kdjnf,skm - ET',
  documentType: 'Passport',
  passport: `DOC${index + 1}`,
  passportIssueDate: '2024-01-01',
  passportExpiry: '2030-12-31'
}));

const payload = buildSaveBookingPayload({
  selectedRowJson: '[{"ItemId":"test"}]',
  travellers,
  debitAmount: 54737,
  paymentId: 'PAYID-TEST',
  contact: {
    houseNo: 'Nagercoil',
    address: 'Nagercoil',
    city: 'Nagercoil',
    zipCode: '629002',
    country: 'India - IN',
    email: 'seenu@gmail.com',
    mobile: '9600179409',
    phoneCode: '91'
  }
});

const passengers = JSON.parse(payload.reqPassangerJson);
const contact = JSON.parse(payload.contactdetailJson)[0];

if (passengers.length !== 4) {
  throw new Error(`Expected 4 passengers, got ${passengers.length}`);
}

for (const p of passengers) {
  if (p.Nationality !== 'ET') {
    throw new Error(`Expected Nationality ET, got ${p.Nationality}`);
  }
  if (p.LastName.endsWith('.')) {
    throw new Error(`Trailing dot not stripped from LastName: ${p.LastName}`);
  }
}

if (formatNationality(',jbhkdfj, - ET') !== 'ET') {
  throw new Error('formatNationality should extract ET from malformed input');
}

if (formatNationality('ET') !== 'ET') {
  throw new Error('formatNationality should pass through ET');
}

console.log('SaveBooking payload OK');
console.log(`Passengers: ${passengers.length}, Nationality: ${passengers[0].Nationality}`);
console.log(`Contact email: ${contact.Email}`);
