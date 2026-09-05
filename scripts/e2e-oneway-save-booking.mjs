/**
 * End-to-end: GetOnewayList → GetBookingdetails → SaveBooking
 *
 * Usage (dev proxy):
 *   npm run dev   # then
 *   node scripts/e2e-oneway-save-booking.mjs
 *
 * Or direct:
 *   API=https://apitravel.afonestop.com/GuestAPI.asmx node scripts/e2e-oneway-save-booking.mjs
 */

const API =
  process.env.API ||
  process.env.GUEST_API ||
  'http://127.0.0.1:5174/api/guest';
const NS = 'http://tempuri.org/';

function escapeXml(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function soapEnvelope(op, params) {
  const body = params
    .map(({ name, value }) => `<${name}>${escapeXml(value)}</${name}>`)
    .join('');
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body><${op} xmlns="${NS}">${body}</${op}></soap:Body>
</soap:Envelope>`;
}

function decodeXml(s) {
  return String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

async function callApi(op, params = []) {
  const url = API.includes('GuestAPI.asmx')
    ? API
    : `${API.replace(/\/$/, '')}/${op}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `"${NS}${op}"`
    },
    body: soapEnvelope(op, params)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${op} HTTP ${res.status}: ${text.slice(0, 400)}`);
  const fault = text.match(/<faultstring[^>]*>([^<]+)/i)?.[1];
  if (fault) throw new Error(`${op} SOAP fault: ${decodeXml(fault)}`);

  const fields = [];
  for (const name of [
    'FlightList',
    'AirlineList',
    'Error',
    'FlightDetails',
    'FareSummary',
    'PenaltyRules',
    'Result'
  ]) {
    const m = text.match(
      new RegExp(`<(?:\\w+:)?${name}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${name}>`, 'i')
    );
    if (m?.[1]?.trim()) fields.push(decodeXml(m[1].trim()));
  }
  if (fields.length) return fields;

  const strings = [...text.matchAll(/<string[^>]*>([\s\S]*?)<\/string>/gi)].map((m) =>
    decodeXml(m[1]).trim()
  );
  if (strings.length) return strings.filter(Boolean);

  return [text.slice(0, 500)];
}

function parseFlightItems(stringsOrXml) {
  // Prefer FlightList named field from GetOnewayListResult
  if (typeof stringsOrXml === 'string' && stringsOrXml.includes('FlightList')) {
    const m = stringsOrXml.match(/<FlightList[^>]*>([\s\S]*?)<\/FlightList>/i);
    if (m?.[1]?.trim().startsWith('[')) {
      try {
        const list = JSON.parse(decodeXml(m[1].trim()));
        if (Array.isArray(list)) return list;
      } catch { /* fall through */ }
    }
  }

  const strings = Array.isArray(stringsOrXml) ? stringsOrXml : [stringsOrXml];
  for (const entry of strings) {
    const t = String(entry || '').trim();
    if (!t.startsWith('[')) continue;
    try {
      const list = JSON.parse(t);
      if (Array.isArray(list) && list.length) return list;
    } catch {
      /* skip */
    }
  }
  return [];
}

function isSub(row) {
  return (
    row.RowType === 'SubRow' ||
    row.RowTypeFirst === 'SubRow' ||
    row.RowTypeForward === 'SubRow' ||
    row.RowTypeReturn === 'SubRow'
  );
}

function isMain(row) {
  return (
    row.RowType === 'MainRow' ||
    row.RowTypeFirst === 'MainRow' ||
    row.RowTypeForward === 'MainRow'
  );
}

function needsSubs(main) {
  const stops = Math.max(0, Number(main.StopCount) || 0);
  if (stops > 0) return true;
  const parts = String(main.FlightNumber || '')
    .split(/\s*[|/]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 1;
}

function collectOnewayRows(main, all) {
  // ItemId is shared across cabin fares — never collect by ItemId alone.
  if (!needsSubs(main) || main.MainRowNumber == null) return [main];
  const subs = all.filter(
    (i) => isSub(i) && i.MainRowNumber === main.MainRowNumber
  );
  if (!subs.length) return [main];
  return [
    main,
    ...subs.map((s) => ({
      ...s,
      ItemId: main.ItemId,
      MainRowNumber: main.MainRowNumber
    }))
  ];
}

function withPax(rows, adults = 1, children = 0, infants = 0) {
  return rows.map((row, idx) => {
    if (idx === 0 || isMain(row)) {
      return {
        ...row,
        AdultCount: adults,
        ChildCount: children,
        InfantCount: infants
      };
    }
    return {
      ...row,
      AdultCount: 0,
      ChildCount: 0,
      InfantCount: 0
    };
  });
}

function parseExpected(msg) {
  const m = String(msg || '').match(/expected\s+(\d+)\s+rows?/i);
  return m ? Number(m[1]) : null;
}

function findPricing(strings) {
  for (const s of strings) {
    const t = String(s || '').trim();
    if (!t.startsWith('{') && !t.startsWith('[')) continue;
    try {
      const parsed = JSON.parse(t);
      const obj = Array.isArray(parsed) ? parsed[0] : parsed;
      if (obj && (obj.GrandTotal != null || obj.TotalFare != null)) return obj;
    } catch {
      /* skip */
    }
  }
  return null;
}

function findError(strings) {
  for (const s of strings) {
    const t = String(s || '').trim();
    if (!t) continue;
    if (t.startsWith('[') || t.startsWith('{') || t.startsWith('<')) continue;
    if (/^no error$/i.test(t)) continue;
    return t;
  }
  return null;
}

function ddMmYyyy(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

async function main() {
  const depart = new Date();
  depart.setDate(depart.getDate() + 14);
  const departDate = ddMmYyyy(depart);

  console.log(`API: ${API}`);
  console.log(`1) GetOnewayList ADD → DXB on ${departDate}`);

  const listStrings = await callApi('GetOnewayList', [
    { name: 'AdultCount', value: '1' },
    { name: 'ChildrenCount', value: '0' },
    { name: 'InfantCount', value: '0' },
    { name: 'DepartDate', value: departDate },
    { name: 'CabinClass', value: '2' },
    { name: 'Origin', value: 'ADD' },
    { name: 'Destination', value: 'DXB' },
    { name: 'CurrencyCode', value: 'ETB' },
    { name: 'CurrencyValue', value: '1' },
    { name: 'FlightMarkup', value: '0' }
  ]);

  const items = parseFlightItems(listStrings);
  console.log(`   flights raw rows: ${items.length}`);
  if (!items.length) {
    console.error('FAIL — no flights. Sample response:', listStrings.join(' | ').slice(0, 300));
    process.exit(1);
  }

  const mains = items.filter((i) => i.RowType === 'MainRow');
  console.log(`   MainRows: ${mains.length}`);

  // PREFER_CONNECTING=1 tests multi-segment (Expected 3 rows); default prefers nonstop.
  const preferConnecting = process.env.PREFER_CONNECTING === '1';
  const main =
    (preferConnecting
      ? mains.find((m) => needsSubs(m))
      : mains.find((m) => Number(m.StopCount) === 0)) ||
    mains[0] ||
    items[0];

  console.log(
    `   selected: ${main.CarrierCode} ${main.FlightNumber} StopCount=${main.StopCount} ItemId=${String(main.ItemId || '').slice(0, 24)}… MainRowNumber=${main.MainRowNumber}`
  );

  let rows = withPax(collectOnewayRows(main, items));
  console.log(`2) jsonstring rows: ${rows.length} (needsSubs=${needsSubs(main)})`);

  const traceId = String(main.ItemId || '').replace(/_PC$/i, '');
  const contentSource = String(main.ConnectionIndex || 'GDS');

  async function tryDetails(label, attemptRows) {
    const jsonstring = JSON.stringify(attemptRows);
    console.log(`3) GetBookingdetails [${label}] rows=${attemptRows.length}`);
    const strings = await callApi('GetBookingdetails', [
      { name: 'UserTypeId', value: '2' },
      { name: 'UserId', value: '1' },
      { name: 'traceId', value: traceId },
      { name: 'TripType', value: 'Oneway' },
      { name: 'ContentSource', value: contentSource },
      { name: 'AdultCount', value: '1' },
      { name: 'ChildrenCount', value: '0' },
      { name: 'InfantCount', value: '0' },
      { name: 'jsonstring', value: jsonstring },
      { name: 'CurrencyCode', value: 'ETB' },
      { name: 'CurrencyValue', value: '1' },
      { name: 'FlightMarkup', value: '0' }
    ]);
    const pricing = findPricing(strings);
    const err = findError(strings);
    if (pricing) {
      console.log(
        `   OK GrandTotal=${pricing.GrandTotal} ${pricing.CurrencyCode || pricing.Currency || ''}`
      );
      return { ok: true, pricing, jsonstring, err: null };
    }
    console.log(`   FAIL: ${err || strings.map((s) => String(s).slice(0, 80)).join(' | ')}`);
    return { ok: false, pricing: null, jsonstring, err };
  }

  let details = await tryDetails('primary', rows);
  if (!details.ok) {
    const expected = parseExpected(details.err);
    if (expected === 1) {
      details = await tryDetails('main-only', withPax([main]));
    } else if (expected && expected > 1) {
      const n = main.MainRowNumber;
      const allSubs = items.filter(
        (i) =>
          isSub(i) &&
          (i.MainRowNumber === n ||
            (main.ItemId && i.ItemId === main.ItemId))
      );
      const sized = withPax([
        main,
        ...allSubs.slice(0, Math.max(0, expected - 1)).map((s) => ({
          ...s,
          ItemId: main.ItemId,
          MainRowNumber: main.MainRowNumber
        }))
      ]);
      details = await tryDetails(`expected-${expected}`, sized);
    }
    if (!details.ok) {
      // last resort: main only then all same MainRowNumber
      if (rows.length !== 1) details = await tryDetails('fallback-main', withPax([main]));
      if (!details.ok) {
        const sameNum = items.filter((i) => i.MainRowNumber === main.MainRowNumber);
        const onlyMainPlusSubs = withPax([
          main,
          ...sameNum.filter(isSub).map((s) => ({
            ...s,
            ItemId: main.ItemId,
            MainRowNumber: main.MainRowNumber
          }))
        ]);
        details = await tryDetails('same-MainRowNumber', onlyMainPlusSubs);
      }
    }
  }

  if (!details.ok) {
    console.error('FAIL — GetBookingdetails never accepted jsonstring');
    process.exit(1);
  }

  rows = JSON.parse(details.jsonstring);
  const grandTotal = Number(details.pricing.GrandTotal) || Number(main.TotalPrice) || 0;
  const paymentId = `MKASH-E2E-${Date.now()}`;

  const contactdetailJson = JSON.stringify([
    {
      HouseNo: 'Bole',
      Address: 'Addis Ababa',
      City: 'Addis Ababa',
      ZipCode: '1000',
      Country: 'Ethiopia - ET',
      Email: 'e2e.test@mkash.travel',
      MobileNo: '911223344',
      PhoneCode: '251'
    }
  ]);

  const defaultvalueJson = JSON.stringify([
    {
      UserId: '1',
      UserTypeId: '2',
      CurrencyCode: 'ETB',
      DefaultCurrencyvalue: '1',
      FlightMarkup: '0',
      INRCurrencyValue: '1',
      FrontCurrencyCode: 'ETB',
      FrontCurrencyValue: '1',
      MainCurrencyCode: 'ETB',
      MainCurrencyvalue: '1',
      GSTPercent: '0',
      GSTAmt: '0',
      ServiceChargePercent: '0',
      ServiceCharge: '0',
      OfferDiscount: '0',
      MarkupAmt: '0',
      DebitAmount: Number(grandTotal).toFixed(2),
      PaymentID: paymentId,
      BookingStatusChk: 'BS'
    }
  ]);

  const reqPassangerJson = JSON.stringify([
    {
      PassID: '1',
      PaxType: 'Adult',
      Title: 'Mr',
      FirstName: 'Test',
      MiddleName: '',
      LastName: 'Traveller',
      Gender: 'Male',
      DateOfBirth: '1990-01-15',
      DoumentType: 'Passport',
      DoumentNo: 'EP1234567',
      ExpiryDate: '2030-12-31',
      IssueDate: '2020-01-01',
      Nationality: 'ET'
    }
  ]);

  console.log('4) SaveBooking…');
  console.log(`   DebitAmount=${Number(grandTotal).toFixed(2)} PaymentID=${paymentId}`);
  console.log(`   SelectedRowJson rows=${rows.length}`);

  const saveStrings = await callApi('SaveBooking', [
    { name: 'SelectedRowJson', value: details.jsonstring },
    { name: 'ContactdetailJson', value: contactdetailJson },
    { name: 'DefaultvalueJson', value: defaultvalueJson },
    { name: 'ReqPassangerJson', value: reqPassangerJson }
  ]);

  const saveText = saveStrings.join('\n');
  console.log('   SaveBooking raw:', saveText.slice(0, 400));

  const pnr = saveText.match(/PNR\s*:\s*([A-Z0-9]+)/i)?.[1];
  const looksError =
    /invalid|error|fail|expected\s+\d+\s+rows/i.test(saveText) &&
    !/PNR\s*:/i.test(saveText);

  if (pnr) {
    console.log(`\nSUCCESS — PNR ${pnr}`);
    console.log(
      JSON.stringify(
        {
          departDate,
          carrier: main.CarrierCode,
          flight: main.FlightNumber,
          stopCount: main.StopCount,
          rowCount: rows.length,
          grandTotal,
          pnr
        },
        null,
        2
      )
    );
    process.exit(0);
  }

  if (looksError) {
    console.error('\nFAIL — SaveBooking error');
    process.exit(1);
  }

  // Some environments return opaque success without PNR prefix
  if (saveText && saveText.length < 80 && !/invalid|error/i.test(saveText)) {
    console.log('\nSUCCESS — SaveBooking accepted (no PNR pattern):', saveText);
    process.exit(0);
  }

  console.error('\nFAIL — could not confirm SaveBooking success');
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
