/**
 * Verify Hotel1_List via dev proxy.
 * Run: npm run dev, then node scripts/verify-hotel-list.mjs
 */

const API = 'http://localhost:5174/api/guest';
const NS = 'http://tempuri.org/';

function escapeXml(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function hotel1List(params) {
  const body = Object.entries(params)
    .map(([name, value]) => `<${name}>${escapeXml(value)}</${name}>`)
    .join('');
  const env = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body><Hotel1_List xmlns="${NS}">${body}</Hotel1_List></soap:Body>
</soap:Envelope>`;
  const res = await fetch(`${API}/Hotel1_List`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `"${NS}Hotel1_List"`
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
  const strings = await hotel1List({
    CheckInDate: '23-07-2026',
    CheckOutDate: '24-07-2026',
    CityName: 'dubai',
    CountryCode: 'AE',
    RoomCount: '1',
    CurrencyCode: 'ETB',
    HotelMarkup: '0',
    DefaultCurrencyValue: '1',
    RoomGuestJson:
      '[{"Roomno":"1","Adult":"1","Child":"0","Child1Age":"0","Child2Age":"0"}]'
  });

  const json = strings.find((s) => s.startsWith('['));
  if (!json) {
    console.log('No hotel JSON. Response:', strings.join(' | ').slice(0, 300));
    process.exit(1);
  }

  const hotels = JSON.parse(json);
  console.log(`Hotel1_List OK — ${hotels.length} hotels`);
  const first = hotels[0];
  console.log(
    `First: ${first.Hotelname} · ${first.Starcategory}★ · ETB ${first.TotalPrice} · ${first.RefundString}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
