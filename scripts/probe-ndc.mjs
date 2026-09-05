/**
 * Probe NDC vs GDS SaveBooking + ContentSource overrides.
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
  for (const name of ['FlightList', 'Error', 'FareSummary', 'Result', 'FlightDetails']) {
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

/** Minimal normalize like mapFlightBooking — ensure shared columns. */
function normalize(rows) {
  const keys = new Set();
  for (const r of rows) Object.keys(r).forEach((k) => keys.add(k));
  for (const k of ['IsLCC', 'ProductOfferingID', 'BrandList', 'BrandRef', 'BrandTier']) {
    keys.add(k);
  }
  return rows.map((r) => {
    const out = { ...r };
    for (const k of keys) {
      if (!(k in out)) out[k] = null;
    }
    if (out.IsLCC === undefined) out.IsLCC = null;
    if (out.ProductOfferingID === undefined) out.ProductOfferingID = null;
    return out;
  });
}

const depart = new Date();
depart.setDate(depart.getDate() + 14);
const departDate = ddMmYyyy(depart);

const list = await call('GetOnewayList', [
  ['AdultCount', '1'],
  ['ChildrenCount', '0'],
  ['InfantCount', '0'],
  ['DepartDate', departDate],
  ['CabinClass', '2'],
  ['Origin', 'ADD'],
  ['Destination', 'DXB'],
  ['CurrencyCode', 'ETB'],
  ['CurrencyValue', '1'],
  ['FlightMarkup', '0']
]);
const all = JSON.parse(list.FlightList);
const mains = all.filter((r) => r.RowType === 'MainRow');

const bySource = {};
for (const m of mains) {
  const src = String(m.ConnectionIndex || '?');
  bySource[src] = (bySource[src] || 0) + 1;
}
console.log('MainRows by ConnectionIndex:', bySource);

function collect(main) {
  const needs = Number(main.StopCount) > 0;
  let rows = [main];
  if (needs) {
    const subs = all.filter(
      (i) => i.RowType === 'SubRow' && i.MainRowNumber === main.MainRowNumber
    );
    rows = [
      main,
      ...subs.map((s) => ({
        ...s,
        ItemId: main.ItemId,
        MainRowNumber: main.MainRowNumber
      }))
    ];
  }
  return normalize(
    rows.map((r, idx) => ({
      ...r,
      AdultCount: idx === 0 ? 1 : 0,
      ChildCount: 0,
      InfantCount: 0
    }))
  );
}

async function tryBook(label, main, contentSource, rowMutator) {
  let rows = collect(main);
  if (rowMutator) rows = rowMutator(rows);
  const jsonstring = JSON.stringify(rows);
  const src = contentSource ?? String(main.ConnectionIndex || 'GDS');
  try {
    const details = await call('GetBookingdetails', [
      ['UserTypeId', '2'],
      ['UserId', '1'],
      ['traceId', String(main.ItemId || '').replace(/_PC$/i, '')],
      ['TripType', 'Oneway'],
      ['ContentSource', src],
      ['AdultCount', '1'],
      ['ChildrenCount', '0'],
      ['InfantCount', '0'],
      ['jsonstring', jsonstring],
      ['CurrencyCode', 'ETB'],
      ['CurrencyValue', '1'],
      ['FlightMarkup', '0']
    ]);
    if (!details.FareSummary) {
      console.log(`✗ ${label} details:`, details.Error || 'no fare');
      return;
    }
    const fare = JSON.parse(details.FareSummary);
    const grand = fare.GrandTotal;
    const save = await call('SaveBooking', [
      ['SelectedRowJson', jsonstring],
      [
        'ContactdetailJson',
        JSON.stringify([
          {
            HouseNo: '1',
            Address: 'Addis',
            City: 'Addis Ababa',
            ZipCode: '1000',
            Country: 'Ethiopia - ET',
            Email: 't@test.com',
            MobileNo: '911223344',
            PhoneCode: '251'
          }
        ])
      ],
      [
        'DefaultvalueJson',
        JSON.stringify([
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
            DebitAmount: Number(grand).toFixed(2),
            PaymentID: `MKASH-${Date.now()}`,
            BookingStatusChk: 'BS'
          }
        ])
      ],
      [
        'ReqPassangerJson',
        JSON.stringify([
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
            Nationality: 'ET'
          }
        ])
      ]
    ]);
    const err =
      save.Error && !/^no error$/i.test(save.Error) ? save.Error : null;
    console.log(`✓ ${label} =>`, err || save.Result);
  } catch (e) {
    console.log(`✗ ${label} THROW:`, e.message.replace(/\s+/g, ' ').slice(0, 160));
  }
}

const qr = mains.find((m) => m.CarrierCode === 'QR' && Number(m.StopCount) > 0);
const ms = mains.find((m) => m.CarrierCode === 'MS' && Number(m.StopCount) > 0);
const ndcAny = mains.find((m) => String(m.ConnectionIndex) === 'NDC');
const gdsConn = mains.find(
  (m) => String(m.ConnectionIndex) === 'GDS' && Number(m.StopCount) > 0
);
const ndcNonstop = mains.find(
  (m) => String(m.ConnectionIndex) === 'NDC' && Number(m.StopCount) === 0
);

console.log('\nTargets:', {
  qr: qr && `${qr.CarrierCode} ${qr.FlightNumber} ${qr.ConnectionIndex} stops=${qr.StopCount}`,
  ms: ms && `${ms.CarrierCode} ${ms.FlightNumber} ${ms.ConnectionIndex}`,
  ndcAny: ndcAny && `${ndcAny.CarrierCode} ${ndcAny.FlightNumber} stops=${ndcAny.StopCount}`,
  gdsConn: gdsConn && `${gdsConn.CarrierCode} ${gdsConn.FlightNumber}`,
  ndcNonstop: ndcNonstop && `${ndcNonstop.CarrierCode} ${ndcNonstop.FlightNumber}`
});

await tryBook('MS GDS connecting (native CS)', ms);
await tryBook('QR NDC connecting (native CS=NDC)', qr);
await tryBook('QR but ContentSource=GDS', qr, 'GDS');
await tryBook('QR ContentSource=NDC explicit', qr, 'NDC');
await tryBook('Any NDC (native)', ndcAny);
if (ndcNonstop) await tryBook('NDC nonstop', ndcNonstop);
await tryBook('GDS connecting', gdsConn);

// Try forcing ConnectionIndex on rows to GDS for QR
await tryBook('QR rows ConnectionIndex forced GDS + CS GDS', qr, 'GDS', (rows) =>
  rows.map((r) => ({ ...r, ConnectionIndex: 'GDS' }))
);

// BookingAPI field?
console.log('\nBookingAPI samples:', {
  qr: qr?.BookingAPI,
  ms: ms?.BookingAPI,
  ndc: ndcAny?.BookingAPI
});

// Try with FlightDetails from GetBookingdetails as SelectedRowJson for QR
{
  const rows = collect(qr);
  const jsonstring = JSON.stringify(rows);
  const details = await call('GetBookingdetails', [
    ['UserTypeId', '2'],
    ['UserId', '1'],
    ['traceId', String(qr.ItemId || '').replace(/_PC$/i, '')],
    ['TripType', 'Oneway'],
    ['ContentSource', 'NDC'],
    ['AdultCount', '1'],
    ['ChildrenCount', '0'],
    ['InfantCount', '0'],
    ['jsonstring', jsonstring],
    ['CurrencyCode', 'ETB'],
    ['CurrencyValue', '1'],
    ['FlightMarkup', '0']
  ]);
  console.log('\nQR FlightDetails type', typeof details.FlightDetails, details.FlightDetails?.slice?.(0, 200));
  if (details.FlightDetails?.trim().startsWith('[')) {
    const fd = JSON.parse(details.FlightDetails);
    console.log('FlightDetails rows', fd.length, 'keys0', Object.keys(fd[0] || {}).slice(0, 30));
    // save with FlightDetails
    const fare = JSON.parse(details.FareSummary);
    try {
      const save = await call('SaveBooking', [
        ['SelectedRowJson', details.FlightDetails],
        [
          'ContactdetailJson',
          JSON.stringify([
            {
              HouseNo: '1',
              Address: 'Addis',
              City: 'Addis Ababa',
              ZipCode: '1000',
              Country: 'Ethiopia - ET',
              Email: 't@test.com',
              MobileNo: '911223344',
              PhoneCode: '251'
            }
          ])
        ],
        [
          'DefaultvalueJson',
          JSON.stringify([
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
              DebitAmount: Number(fare.GrandTotal).toFixed(2),
              PaymentID: `MKASH-${Date.now()}`,
              BookingStatusChk: 'BS'
            }
          ])
        ],
        [
          'ReqPassangerJson',
          JSON.stringify([
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
              Nationality: 'ET'
            }
          ])
        ]
      ]);
      console.log(
        'QR Save with FlightDetails =>',
        save.Error && !/^no error$/i.test(save.Error) ? save.Error : save.Result
      );
    } catch (e) {
      console.log('QR FlightDetails save THROW', e.message.slice(0, 160));
    }
  }
}
