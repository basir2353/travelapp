/**
 * Probe SaveBooking StartIndex error — country / currency / QR connecting.
 */
const API = process.env.API || 'http://127.0.0.1:5174/api/guest';
const NS = 'http://tempuri.org/';

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const decode = (s) =>
  String(s)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

function soap(op, params) {
  return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><${op} xmlns="${NS}">${params
    .map(([k, v]) => `<${k}>${esc(v)}</${k}>`)
    .join('')}</${op}></soap:Body></soap:Envelope>`;
}

async function call(op, params) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `"${NS}${op}"`
    },
    body: soap(op, params)
  });
  const text = await res.text();
  const fault = text.match(/<faultstring[^>]*>([^<]+)/i)?.[1];
  if (fault) throw new Error(decode(fault));
  const out = {};
  for (const name of [
    'FlightList',
    'Error',
    'FlightDetails',
    'FareSummary',
    'Result'
  ]) {
    const m = text.match(
      new RegExp(`<(?:\\w+:)?${name}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${name}>`, 'i')
    );
    if (m?.[1]?.trim()) out[name] = decode(m[1].trim());
  }
  return out;
}

function ddMmYyyy(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

const depart = new Date();
depart.setDate(depart.getDate() + 14);
const departDate = ddMmYyyy(depart);

const currencyCode = process.env.CURRENCY || 'BRL';
const currencyValue = process.env.RATE || '0.05';

console.log(`Search ADD→DXB ${departDate} ${currencyCode}@${currencyValue}`);
const list = await call('GetOnewayList', [
  ['AdultCount', '1'],
  ['ChildrenCount', '0'],
  ['InfantCount', '0'],
  ['DepartDate', departDate],
  ['CabinClass', '2'],
  ['Origin', 'ADD'],
  ['Destination', 'DXB'],
  ['CurrencyCode', currencyCode],
  ['CurrencyValue', currencyValue],
  ['FlightMarkup', '0']
]);

if (!list.FlightList) {
  console.error('No FlightList', list);
  process.exit(1);
}

const rows = JSON.parse(list.FlightList);
const mains = rows.filter((r) => r.RowType === 'MainRow');
const qr =
  mains.find(
    (m) =>
      String(m.CarrierCode || '').includes('QR') && Number(m.StopCount) > 0
  ) ||
  mains.find((m) => Number(m.StopCount) > 0) ||
  mains[0];

console.log(
  'Selected',
  qr.CarrierCode,
  qr.FlightNumber,
  'Stop',
  qr.StopCount,
  'MainRow',
  qr.MainRowNumber
);

const isSub = (i) => i.RowType === 'SubRow';
const needs =
  Number(qr.StopCount) > 0 ||
  String(qr.FlightNumber || '')
    .split(/[|/]/)
    .filter(Boolean).length > 1;
let payloadRows = [qr];
if (needs) {
  const subs = rows.filter(
    (i) => isSub(i) && i.MainRowNumber === qr.MainRowNumber
  );
  payloadRows = [
    qr,
    ...subs.map((s) => ({
      ...s,
      ItemId: qr.ItemId,
      MainRowNumber: qr.MainRowNumber
    }))
  ];
}
payloadRows = payloadRows.map((r, idx) => ({
  ...r,
  AdultCount: idx === 0 ? 1 : 0,
  ChildCount: 0,
  InfantCount: 0
}));
console.log('payload rows', payloadRows.length);

const jsonstring = JSON.stringify(payloadRows);
const details = await call('GetBookingdetails', [
  ['UserTypeId', '2'],
  ['UserId', '1'],
  ['traceId', String(qr.ItemId || '').replace(/_PC$/i, '')],
  ['TripType', 'Oneway'],
  ['ContentSource', String(qr.ConnectionIndex || 'GDS')],
  ['AdultCount', '1'],
  ['ChildrenCount', '0'],
  ['InfantCount', '0'],
  ['jsonstring', jsonstring],
  ['CurrencyCode', currencyCode],
  ['CurrencyValue', currencyValue],
  ['FlightMarkup', '0']
]);

console.log('GetBookingdetails Error:', details.Error);
if (!details.FareSummary) {
  console.error('No fare', details);
  process.exit(1);
}
const fare = JSON.parse(details.FareSummary);
const grand = fare.GrandTotal || fare[0]?.GrandTotal;
console.log('GrandTotal', grand);

async function trySave(label, country, phoneCode = '251', nationality = 'ET') {
  const contact = JSON.stringify([
    {
      HouseNo: '1',
      Address: 'Addis',
      City: 'Addis Ababa',
      ZipCode: '1000',
      Country: country,
      Email: 't@test.com',
      MobileNo: '911223344',
      PhoneCode: phoneCode
    }
  ]);
  const defaults = JSON.stringify([
    {
      UserId: '1',
      UserTypeId: '2',
      CurrencyCode: currencyCode,
      DefaultCurrencyvalue: currencyValue,
      FlightMarkup: '0',
      INRCurrencyValue: '1',
      FrontCurrencyCode: currencyCode,
      FrontCurrencyValue: currencyValue,
      MainCurrencyCode: currencyCode,
      MainCurrencyvalue: currencyValue,
      GSTPercent: '0',
      GSTAmt: '0',
      ServiceChargePercent: '0',
      ServiceCharge: '0',
      OfferDiscount: '0',
      MarkupAmt: '0',
      DebitAmount: Number(grand).toFixed(2),
      PaymentID: `MKASH-P-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      BookingStatusChk: 'BS'
    }
  ]);
  const pax = JSON.stringify([
    {
      PassID: '1',
      PaxType: 'Adult',
      Title: 'Mr',
      FirstName: 'Test',
      MiddleName: '',
      LastName: 'User',
      Gender: 'Male',
      DateOfBirth: '1990-01-15',
      DoumentType: 'Passport',
      DoumentNo: 'EP1234567',
      ExpiryDate: '2030-12-31',
      IssueDate: '2020-01-01',
      Nationality: nationality
    }
  ]);
  try {
    const save = await call('SaveBooking', [
      ['SelectedRowJson', jsonstring],
      ['ContactdetailJson', contact],
      ['DefaultvalueJson', defaults],
      ['ReqPassangerJson', pax]
    ]);
    console.log(
      `✓ ${label} =>`,
      (save.Error && !/^no error$/i.test(save.Error) ? save.Error : null) ||
        save.Result ||
        JSON.stringify(save).slice(0, 180)
    );
  } catch (e) {
    console.log(`✗ ${label} THROW:`, e.message);
  }
}

await trySave('A spaced Ethiopia - ET', 'Ethiopia - ET');
await trySave('B no-space Ethiopia-ET (UI format)', 'Ethiopia-ET');
await trySave('C paren Ethiopia (ET)', 'Ethiopia (ET)');
await trySave('D bare Ethiopia', 'Ethiopia');
await trySave('E Brazil - BR', 'Brazil - BR', '55', 'BR');
await trySave('F Brazil-BR', 'Brazil-BR', '55', 'BR');
await trySave('G empty country', '');
await trySave('H only ET', 'ET');
