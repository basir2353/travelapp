/**
 * Verifies round-trip and multi-city GetBookingdetails + SaveBooking payloads.
 * Run with dev server up: npm run dev (port 5174), then node scripts/verify-flight-booking.mjs
 */

const API = 'http://localhost:5174/api/guest';
const NS = 'http://tempuri.org/';

function escapeXml(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function soapEnvelope(op, params) {
  const body = params.map(({ name, value }) => `<${name}>${escapeXml(value)}</${name}>`).join('');
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body><${op} xmlns="${NS}">${body}</${op}></soap:Body>
</soap:Envelope>`;
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
  if (!res.ok) throw new Error(`${op} HTTP ${res.status}: ${text.slice(0, 300)}`);
  const fault = text.match(/<faultstring[^>]*>([^<]+)/i)?.[1];
  if (fault) throw new Error(`${op} SOAP fault: ${fault}`);
  const matches = [...text.matchAll(/<string[^>]*>([^<]*)<\/string>/gi)];
  return matches.map((m) => m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
}

function parseFlightItems(strings) {
  for (const entry of strings) {
    if (!entry?.startsWith('[')) continue;
    try {
      const list = JSON.parse(entry);
      if (Array.isArray(list) && list.length) return list;
    } catch { /* skip */ }
  }
  return [];
}

function isRoundway(item) {
  return item.TripType === 'Roundway' || item.RowTypeForward != null;
}

function isMultiway(item) {
  if (isRoundway(item)) return false;
  return item.TripType === 'Multiway' || item.RowTypeFirst != null;
}

function collectRoundwayRows(main, all) {
  const fwd = main.MainRowNumberForward;
  const ret = main.MainRowNumberReturn;
  const itemId = main.ItemId;
  return all.filter(
    (i) =>
      (!itemId || i.ItemId === itemId) &&
      ((fwd != null && i.MainRowNumberForward === fwd) ||
        (ret != null && i.MainRowNumberReturn === ret))
  );
}

function collectMultiwayRows(main, all) {
  const n = main.MainRowNumberFirst;
  const itemId = main.ItemId;
  if (n == null) return [main];
  return all.filter(
    (i) => (!itemId || i.ItemId === itemId) && i.MainRowNumberFirst === n
  );
}

async function testBooking(label, main, rows, tripType, traceId, contentSource) {
  const jsonstring = JSON.stringify(rows);
  console.log(`\n--- ${label} ---`);
  console.log(`rows: ${rows.length}, tripType: ${tripType}, traceId: ${traceId}`);

  const strings = await callApi('GetBookingdetails', [
    { name: 'UserTypeId', value: '2' },
    { name: 'UserId', value: '1' },
    { name: 'traceId', value: String(traceId) },
    { name: 'TripType', value: tripType },
    { name: 'ContentSource', value: contentSource || 'GDS' },
    { name: 'AdultCount', value: '1' },
    { name: 'ChildrenCount', value: '0' },
    { name: 'InfantCount', value: '0' },
    { name: 'jsonstring', value: jsonstring },
    { name: 'Ses_MainCurrencyCode', value: 'ETB' },
    { name: 'Ses_FrontCurrencyCode', value: 'ETB' },
    { name: 'Ses_MainCurrencyValue', value: '1' },
    { name: 'Ses_INRCurrencyValue', value: '1' },
    { name: 'Ses_CurrencyCode', value: 'ETB' },
    { name: 'Ses_DefaultCurrencyValue', value: '1' },
    { name: 'Ses_FlightMarkup', value: '1' }
  ]);

  const pricing = strings.find((s) => s.includes('GrandTotal'));
  const err = strings.find((s) => !s.startsWith('[') && !s.startsWith('{'));
  if (pricing) {
    const p = JSON.parse(pricing);
    console.log(`GetBookingdetails OK — GrandTotal: ${p.GrandTotal} ${p.CurrencyCode}`);
    return { ok: true, jsonstring, grandTotal: p.GrandTotal };
  }
  console.log(`GetBookingdetails FAIL — ${err || strings.join(' | ').slice(0, 200)}`);
  return { ok: false };
}

async function main() {
  const depart = '20-07-2026';
  const retDate = '30-07-2026';

  console.log('Round-trip search ADD → DXB…');
  const roundStrings = await callApi('GetRoundwayList', [
    { name: 'AdultCount', value: '1' },
    { name: 'ChildrenCount', value: '0' },
    { name: 'InfantCount', value: '0' },
    { name: 'DepartDate', value: depart },
    { name: 'CabinClass', value: '2' },
    { name: 'Origin', value: 'ADD' },
    { name: 'Destination', value: 'DXB' },
    { name: 'DefaultCurrency', value: 'ETB' },
    { name: 'DefaultCurrencyValue', value: '1' },
    { name: 'FlightMarkup', value: '1' },
    { name: 'ReturnDate', value: retDate }
  ]);
  const roundItems = parseFlightItems(roundStrings);
  const roundMain = roundItems.find((i) => i.RowTypeForward === 'MainRow');
  if (roundMain) {
    const rows = collectRoundwayRows(roundMain, roundItems);
    await testBooking(
      'Round-trip connecting',
      roundMain,
      rows,
      'Roundway',
      roundMain.ItemId ?? '',
      roundMain.ConnectionIndexForward ?? 'GDS'
    );
  } else {
    console.log('No round-trip MainRow found');
  }

  console.log('\nMulti-city search ADD → DXB → CAI…');
  const multiStrings = await callApi('GetMultiwayList', [
    { name: 'AdultCount', value: '1' },
    { name: 'ChildrenCount', value: '0' },
    { name: 'InfantCount', value: '0' },
    { name: 'CabinClass', value: '2' },
    { name: 'Origin1', value: 'ADD' },
    { name: 'Destination1', value: 'DXB' },
    { name: 'DepartDate1', value: '22-07-2026' },
    { name: 'Origin2', value: 'DXB' },
    { name: 'Destination2', value: 'CAI' },
    { name: 'DepartDate2', value: '01-08-2026' },
    { name: 'Origin3', value: '' },
    { name: 'Destination3', value: '' },
    { name: 'DepartDate3', value: '' },
    { name: 'Origin4', value: '' },
    { name: 'Destination4', value: '' },
    { name: 'DepartDate4', value: '' },
    { name: 'DefaultCurrency', value: 'ETB' },
    { name: 'DefaultCurrencyValue', value: '1' },
    { name: 'FlightMarkup', value: '1' }
  ]);
  const multiItems = parseFlightItems(multiStrings);
  const multiMain = multiItems.find(
    (i) =>
      i.RowTypeFirst === 'MainRow' ||
      i.RowTypeSecond === 'MainRow' ||
      i.RowTypeThird === 'MainRow'
  );
  if (multiMain) {
    const rows = collectMultiwayRows(multiMain, multiItems);
    const result = await testBooking(
      'Multi-city connecting',
      multiMain,
      rows,
      'Multiway',
      multiMain.ItemId ?? '',
      multiMain.ConnectionIndexFirst ?? 'GDS'
    );
    if (result.ok) {
      console.log('SaveBooking smoke test (dry payload)…');
      const saveStrings = await callApi('SaveBooking', [
        { name: 'SelectedRowJson', value: result.jsonstring },
        { name: 'ContactdetailJson', value: '[]' },
        { name: 'DefaultvalueJson', value: '[]' },
        { name: 'ReqPassangerJson', value: '[]' }
      ]);
      console.log('SaveBooking response:', saveStrings.join(' | ').slice(0, 150));
    }
  } else {
    console.log('No multi-city MainRow found');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
