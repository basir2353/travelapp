/**
 * Verify Car1_List → Car2_SelecCar flow.
 * Run with dev server: npm run dev, then node scripts/verify-car-selection.mjs
 */

import {
  buildJsonSelectCar,
  formatCarApiDateTime
} from '../src/services/guestApi/mapCarSelection.ts';
import { mapCarItemToRental } from '../src/services/guestApi/mapCarToRental.ts';

const API = 'http://localhost:5174/api/guest';
const NS = 'http://tempuri.org/';

function escapeXml(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function soapEnvelope(op, params) {
  const body = params
    .map(({ name, value }) => `<${name}>${escapeXml(value)}</${name}>`)
    .join('');
  return `<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><${op} xmlns="${NS}">${body}</${op}></soap:Body></soap:Envelope>`;
}

async function callApi(op, params = []) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `"${NS}${op}"`
    },
    body: soapEnvelope(op, params)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${op} HTTP ${res.status}`);
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
const pickupTime = '06:00';
const returnTime = '18:00';

console.log('Car1_List…');
const strings = await callApi('Car1_List', [
  { name: 'pickupLocation', value: 'Dubai' },
  { name: 'returnLocation', value: 'Dubai' },
  { name: 'pickupDate', value: pickupDate },
  { name: 'pickupTime', value: pickupTime },
  { name: 'returnDate', value: returnDate },
  { name: 'returnTime', value: returnTime },
  { name: 'CurrencyCode', value: 'AED' },
  { name: 'DefaultCurrencyValue', value: '1' }
]);

const items = extractCarItems(strings);
if (items.length === 0) {
  console.log('No live cars — try dates like 15/06/2026');
  process.exit(0);
}

const rental = mapCarItemToRental(items[0], 0);
const jsonSelectCar = buildJsonSelectCar(rental, {
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  pickupLocation: 'Dubai',
  returnLocation: 'Dubai'
});

console.log('JsonSelectCar datetime sample:', formatCarApiDateTime(pickupDate, pickupTime));
console.log('Car2_SelecCar…');

try {
  const selectStrings = await callApi('Car2_SelecCar', [
    { name: 'UserTypeId', value: '2' },
    { name: 'UserId', value: '1000' },
    { name: 'DefaultCurrency', value: 'ETB' },
    { name: 'DefaultCurrencyValue', value: '1' },
    { name: 'CarMarkup', value: '1' },
    { name: 'JsonSelectCar', value: jsonSelectCar }
  ]);
  console.log('Car2 response:', selectStrings.join(' | ').slice(0, 300));
} catch (err) {
  console.error('Car2 failed:', err.message);
}
