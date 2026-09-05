/**
 * Verify Hotel1_List + Hotel2_HotelDetails flow.
 * Run: npm run dev, then node scripts/verify-hotel-details.mjs
 */

const API = 'http://localhost:5174/api/guest';
const NS = 'http://tempuri.org/';

function escapeXml(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function callApi(op, params) {
  const body = Object.entries(params)
    .map(([name, value]) => `<${name}>${escapeXml(value)}</${name}>`)
    .join('');
  const env = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body><${op} xmlns="${NS}">${body}</${op}></soap:Body>
</soap:Envelope>`;
  const res = await fetch(`${API}/${op}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `"${NS}${op}"`
    },
    body: env
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  const fault = text.match(/<faultstring[^>]*>([^<]+)/i)?.[1];
  if (fault) throw new Error(`SOAP fault: ${fault}`);
  return [...text.matchAll(/<string[^>]*>([^<]*)<\/string>/gi)].map((m) => m[1]);
}

async function main() {
  const roomGuest =
    '[{"Roomno":"1","Adult":"1","Child":"0","Child1Age":"0","Child2Age":"0"}]';
  const checkIn = '23-07-2026';
  const checkOut = '24-07-2026';

  console.log('Hotel1_List Dubai…');
  const listStrings = await callApi('Hotel1_List', {
    CheckInDate: checkIn,
    CheckOutDate: checkOut,
    CityName: 'dubai',
    CountryCode: 'AE',
    RoomCount: '1',
    CurrencyCode: 'ETB',
    HotelMarkup: '0',
    DefaultCurrencyValue: '1',
    RoomGuestJson: roomGuest
  });
  const hotels = JSON.parse(listStrings.find((s) => s.startsWith('[')));
  const pick = hotels[0];
  console.log(`Picked: ${pick.Hotelname}`);

  console.log('\nHotel2_HotelDetails…');
  const detailStrings = await callApi('Hotel2_HotelDetails', {
    CheckInDate: checkIn,
    CheckOutDate: checkOut,
    HotelMarkup: '0',
    DefaultCurrencyValue: '1',
    RoomGuestJson: roomGuest,
    SelectHoteljson: JSON.stringify([pick])
  });

  const parsed = detailStrings.map((s) => {
    if (!s?.startsWith('[') && !s?.startsWith('{')) return s;
    try {
      return JSON.parse(s);
    } catch {
      return s;
    }
  });

  const info = parsed.find((p) => Array.isArray(p) && p[0]?.HotelName);
  const images = parsed.find((p) => Array.isArray(p) && p[0]?.Path);
  const facilities = parsed.find((p) => Array.isArray(p) && p[0]?.FacilityName);
  const message = parsed.find((p) => typeof p === 'string');

  console.log(`Details OK — ${info?.[0]?.HotelName ?? 'n/a'}`);
  console.log(`Images: ${images?.length ?? 0}, Facilities: ${facilities?.length ?? 0}`);
  if (message) console.log(`API message: ${message}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
