/**
 * Dump QR vs MS connecting rows; try SaveBooking variants.
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

function dumpFlight(label, main) {
  const subs = all.filter(
    (i) => i.RowType === 'SubRow' && i.MainRowNumber === main.MainRowNumber
  );
  console.log(`\n---- ${label} ----`);
  console.log('Main keys sample:', Object.keys(main).sort().join(', '));
  const interesting = [
    'FlightNumber',
    'CarrierCode',
    'OperatingCarrier',
    'DepartureAirportCode',
    'ArrivalAirportCode',
    'DepartAirportName',
    'ArriveAirportName',
    'DepartureDate',
    'ArrivalDate',
    'DepartureTime',
    'ArrivalTime',
    'ConnectionIndex',
    'ItemId',
    'MainRowNumber',
    'StopCount',
    'StopOver',
    'Via',
    'ClassCode',
    'BookingClass',
    'BookingClassName',
    'CabinClassName',
    'FareBasis',
    'FareType',
    'ProductOfferingID',
    'IsLCC',
    'ValidatingCarrier',
    'AirlinePNR',
    'Duration',
    'FlyingTime',
    'Layover'
  ];
  const show = (row, tag) => {
    const o = {};
    for (const k of interesting) {
      if (row[k] !== undefined && row[k] !== null && row[k] !== '') o[k] = row[k];
    }
    // also any key containing Date/Time/Airport/Flight/Carrier
    for (const [k, v] of Object.entries(row)) {
      if (
        /date|time|airport|flight|carrier|stop|via|class|fare|product|lcc|offer/i.test(
          k
        ) &&
        v != null &&
        v !== ''
      ) {
        o[k] = v;
      }
    }
    console.log(tag, JSON.stringify(o, null, 2));
  };
  show(main, 'MAIN');
  subs.forEach((s, i) => show(s, `SUB${i}`));
  return [main, ...subs.map((s) => ({ ...s, ItemId: main.ItemId, MainRowNumber: main.MainRowNumber }))];
}

const qr = mains.find((m) => m.CarrierCode === 'QR' && Number(m.StopCount) > 0);
const ms = mains.find((m) => m.CarrierCode === 'MS' && Number(m.StopCount) > 0);
const etConn = mains.find((m) => m.CarrierCode === 'ET' && Number(m.StopCount) > 0);

const qrRows = dumpFlight('QR', qr);
const msRows = ms ? dumpFlight('MS', ms) : null;
const etRows = etConn ? dumpFlight('ET connecting', etConn) : null;

async function trySave(label, main, rows, mutator) {
  let payload = rows.map((r, idx) => ({
    ...r,
    AdultCount: idx === 0 ? 1 : 0,
    ChildCount: 0,
    InfantCount: 0
  }));
  if (mutator) payload = mutator(payload);
  const jsonstring = JSON.stringify(payload);
  try {
    const details = await call('GetBookingdetails', [
      ['UserTypeId', '2'],
      ['UserId', '1'],
      ['traceId', String(main.ItemId || '').replace(/_PC$/i, '')],
      ['TripType', 'Oneway'],
      ['ContentSource', String(main.ConnectionIndex || 'GDS')],
      ['AdultCount', '1'],
      ['ChildrenCount', '0'],
      ['InfantCount', '0'],
      ['jsonstring', jsonstring],
      ['CurrencyCode', 'ETB'],
      ['CurrencyValue', '1'],
      ['FlightMarkup', '0']
    ]);
    if (!details.FareSummary) {
      console.log(label, 'details fail', details.Error);
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
    console.log(
      label,
      '=>',
      save.Error && !/^no error$/i.test(save.Error) ? save.Error : save.Result
    );
  } catch (e) {
    console.log(label, 'THROW', e.message.slice(0, 180));
  }
}

console.log('\n======== SAVE VARIANTS ========');
await trySave('MS baseline', ms, msRows);
await trySave('ET connecting', etConn, etRows);
await trySave('QR raw', qr, qrRows);

// Try normalizing FlightNumber: replace | with /
await trySave('QR FlightNumber slash', qr, qrRows, (rows) =>
  rows.map((r) => ({
    ...r,
    FlightNumber: String(r.FlightNumber || '').replace(/\s*\|\s*/g, ' / ')
  }))
);

// Strip carrier from FlightNumber on main
await trySave('QR FlightNumber digits only', qr, qrRows, (rows) =>
  rows.map((r, i) => {
    if (i !== 0) return r;
    return {
      ...r,
      FlightNumber: String(r.FlightNumber || '')
        .replace(/[A-Z]{2}\s*/gi, '')
        .replace(/\s*\|\s*/g, '|')
        .trim()
    };
  })
);

// Use GetBookingdetails FlightDetails as SelectedRowJson
async function trySaveFromDetails(label, main, rows) {
  const payload = rows.map((r, idx) => ({
    ...r,
    AdultCount: idx === 0 ? 1 : 0,
    ChildCount: 0,
    InfantCount: 0
  }));
  const jsonstring = JSON.stringify(payload);
  try {
    const details = await call('GetBookingdetails', [
      ['UserTypeId', '2'],
      ['UserId', '1'],
      ['traceId', String(main.ItemId || '').replace(/_PC$/i, '')],
      ['TripType', 'Oneway'],
      ['ContentSource', String(main.ConnectionIndex || 'GDS')],
      ['AdultCount', '1'],
      ['ChildrenCount', '0'],
      ['InfantCount', '0'],
      ['jsonstring', jsonstring],
      ['CurrencyCode', 'ETB'],
      ['CurrencyValue', '1'],
      ['FlightMarkup', '0']
    ]);
    console.log(label, 'details keys', Object.keys(details));
    if (details.FlightDetails) {
      console.log('FlightDetails snippet', details.FlightDetails.slice(0, 300));
      const fare = JSON.parse(details.FareSummary);
      // try saving with FlightDetails as SelectedRowJson
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
          label,
          'SAVE with FlightDetails =>',
          save.Error && !/^no error$/i.test(save.Error)
            ? save.Error
            : save.Result
        );
      } catch (e) {
        console.log(label, 'FlightDetails save THROW', e.message.slice(0, 180));
      }
    }
  } catch (e) {
    console.log(label, e.message.slice(0, 180));
  }
}

await trySaveFromDetails('QR details-as-selected', qr, qrRows);

// Compare null/empty fields between QR main and MS main
if (ms && qr) {
  const allKeys = new Set([...Object.keys(qr), ...Object.keys(ms)]);
  const diffs = [];
  for (const k of [...allKeys].sort()) {
    const qv = qr[k];
    const mv = ms[k];
    const qEmpty = qv == null || qv === '';
    const mEmpty = mv == null || mv === '';
    if (qEmpty !== mEmpty) {
      diffs.push({ k, QR: qv, MS: mv });
    }
  }
  console.log('\nEmpty-field diffs QR vs MS Main:', JSON.stringify(diffs, null, 2));
}
