/**
 * Verify Car1_List → Car2_SelecCar → Car_Booking flow.
 * Run: npm run dev, then node scripts/verify-car-booking.mjs
 */

import {
  buildJsonSelectCar,
  estimateCarPricingFromRental
} from '../src/services/guestApi/mapCarSelection.ts';
import {
  buildBookingJsonFromCarPricing,
  buildCarBookingPayload
} from '../src/services/guestApi/mapCarBooking.ts';
import { mapCarItemToRental } from '../src/services/guestApi/mapCarToRental.ts';

const API = 'http://localhost:5174/api/guest';
const NS = 'http://tempuri.org/';

function escapeXml(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function callApi(op, params = []) {
  const body = params
    .map(({ name, value }) => `<${name}>${escapeXml(value)}</${name}>`)
    .join('');
  const envelope = `<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><${op} xmlns="${NS}">${body}</${op}></soap:Body></soap:Envelope>`;
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `"${NS}${op}"`
    },
    body: envelope
  });
  const text = await res.text();
  const strings = [...text.matchAll(/<string[^>]*>([\s\S]*?)<\/string>/g)].map(
    (m) => m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  );
  const fault = text.match(/<faultstring[^>]*>([^<]+)/i)?.[1];
  if (fault) throw new Error(`${op} SOAP fault: ${fault}`);
  return strings;
}

function extractCarItems(strings) {
  let items = [];
  for (const entry of strings) {
    if (!entry?.startsWith('[')) continue;
    try {
      const list = JSON.parse(entry);
      if (Array.isArray(list) && list[0]?.VendorCode) {
        const count = Object.keys(list[0]).length;
        const existing = items[0] ? Object.keys(items[0]).length : 0;
        if (items.length === 0 || count > existing) items = list;
      }
    } catch {
      // skip
    }
  }
  return items;
}

const pickupDate = '15/06/2026';
const returnDate = '15/06/2026';

console.log('Car1_List…');
const listStrings = await callApi('Car1_List', [
  { name: 'pickupLocation', value: 'Dubai' },
  { name: 'returnLocation', value: 'Dubai' },
  { name: 'pickupDate', value: pickupDate },
  { name: 'pickupTime', value: '06:00' },
  { name: 'returnDate', value: returnDate },
  { name: 'returnTime', value: '18:00' },
  { name: 'CurrencyCode', value: 'AED' },
  { name: 'DefaultCurrencyValue', value: '1' }
]);

const items = extractCarItems(listStrings);
if (items.length === 0) {
  console.log('No live cars found.');
  process.exit(0);
}

const rental = mapCarItemToRental(items[0], 0);
const jsonSelectCar = buildJsonSelectCar(rental, {
  pickupDate,
  pickupTime: '06:00',
  returnDate,
  returnTime: '18:00',
  pickupLocation: 'Dubai',
  returnLocation: 'Dubai'
});

let bookingJson = '[]';
try {
  console.log('Car2_SelecCar…');
  const selectStrings = await callApi('Car2_SelecCar', [
    { name: 'UserTypeId', value: '2' },
    { name: 'UserId', value: '1000' },
    { name: 'DefaultCurrency', value: 'ETB' },
    { name: 'DefaultCurrencyValue', value: '1' },
    { name: 'CarMarkup', value: '1' },
    { name: 'JsonSelectCar', value: jsonSelectCar }
  ]);
  console.log('Car2:', selectStrings.join(' | ').slice(0, 300));
  const pricingEntry = selectStrings.find((s) => s.includes('GrandTotal'));
  if (pricingEntry) {
    bookingJson = buildBookingJsonFromCarPricing(JSON.parse(pricingEntry)[0]);
  }
} catch (err) {
  console.warn('Car2 failed:', err.message);
  const estimate = estimateCarPricingFromRental(rental);
  bookingJson = buildBookingJsonFromCarPricing(estimate);
  console.log('Using estimated booking json:', bookingJson);
}

const payload = buildCarBookingPayload({
  jsonSelectCar,
  bookingJson,
  travellers: [
    {
      title: 'Mr',
      firstName: 'Abdiwahab',
      lastName: 'User',
      email: 'abrahamjohn45@gmail.com',
      mobile: '912345678',
      dob: '1990-01-01',
      passport: 'EP000000001',
      passportExpiry: '2030-12-31',
      nationality: 'Ethiopian'
    }
  ]
});

console.log('Car_Booking…');
try {
  const bookingStrings = await callApi('Car_Booking', [
    { name: 'UserTypeId', value: payload.userTypeId },
    { name: 'UserId', value: payload.userId },
    { name: 'DefaultCurrency', value: payload.defaultCurrency },
    { name: 'DefaultCurrencyValue', value: payload.defaultCurrencyValue },
    { name: 'CarMarkup', value: payload.carMarkup },
    { name: 'JsonSelectCar', value: payload.jsonSelectCar },
    { name: 'BookingJson', value: payload.bookingJson },
    { name: 'ContactDetailJson', value: payload.contactDetailJson },
    { name: 'ReqPassangerJson', value: payload.reqPassangerJson },
    { name: 'RegDriverJson', value: payload.regDriverJson }
  ]);
  console.log('Car_Booking result:', bookingStrings.join('\n'));
} catch (err) {
  console.error('Car_Booking failed:', err.message);
}
