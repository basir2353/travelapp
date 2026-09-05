/**
 * Isolate StartIndex: currency vs airline vs row shape.
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
  const out = { _raw: text };
  for (const name of [
    'FlightList',
    'Error',
    'FlightDetails',
    'FareSummary',
    'Result',
    'CurrencyList'
  ]) {
    const m = text.match(
      new RegExp(`<(?:\\w+:)?${name}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${name}>`, 'i')
    );
    if (m?.[1]?.trim()) out[name] = decode(m[1].trim());
  }
  // ArrayOfString style
  const strings = [...text.matchAll(/<string[^>]*>([\s\S]*?)<\/string>/gi)].map(
    (m) => decode(m[1]).trim()
  );
  if (strings.length) out.strings = strings;
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

function collectRows(main, all) {
  const needs =
    Number(main.StopCount) > 0 ||
    String(main.FlightNumber || '')
      .split(/[|/]/)
      .filter(Boolean).length > 1;
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
  return rows.map((r, idx) => ({
    ...r,
    AdultCount: idx === 0 ? 1 : 0,
    ChildCount: 0,
    InfantCount: 0
  }));
}

async function search(currencyCode, currencyValue) {
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
  const rows = JSON.parse(list.FlightList);
  return rows;
}

async function bookFlow(label, { currencyCode, currencyValue, pick, mutateRows, mutateDefaults, mutatePax, mutateContact }) {
  console.log(`\n=== ${label} ===`);
  try {
    const all = await search(currencyCode, currencyValue);
    const mains = all.filter((r) => r.RowType === 'MainRow');
    const main = pick(mains) || mains[0];
    console.log(
      'flight',
      main.CarrierCode,
      main.FlightNumber,
      'stops',
      main.StopCount,
      'curr',
      main.CurrencyCode,
      main.TotalPrice
    );
    let payloadRows = collectRows(main, all);
    if (mutateRows) payloadRows = mutateRows(payloadRows, main, all);
    const jsonstring = JSON.stringify(payloadRows);
    console.log('rows', payloadRows.length);

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
      ['CurrencyCode', currencyCode],
      ['CurrencyValue', currencyValue],
      ['FlightMarkup', '0']
    ]);
    if (!details.FareSummary) {
      console.log('details FAIL', details.Error || details.strings?.[0]?.slice(0, 120));
      return;
    }
    const fare = JSON.parse(details.FareSummary);
    const grand = fare.GrandTotal || fare[0]?.GrandTotal;
    console.log('GrandTotal', grand, fare.CurrencyCode || '');

    let defaults = {
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
      PaymentID: `MKASH-${Date.now()}`,
      BookingStatusChk: 'BS'
    };
    if (mutateDefaults) defaults = mutateDefaults(defaults, fare, main);

    let contact = {
      HouseNo: '1',
      Address: 'Addis',
      City: 'Addis Ababa',
      ZipCode: '1000',
      Country: 'Ethiopia - ET',
      Email: 't@test.com',
      MobileNo: '911223344',
      PhoneCode: '251'
    };
    if (mutateContact) contact = mutateContact(contact);

    let pax = {
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
    };
    if (mutatePax) pax = mutatePax(pax);

    const save = await call('SaveBooking', [
      ['SelectedRowJson', jsonstring],
      ['ContactdetailJson', JSON.stringify([contact])],
      ['DefaultvalueJson', JSON.stringify([defaults])],
      ['ReqPassangerJson', JSON.stringify([pax])]
    ]);
    const err =
      save.Error && !/^no error$/i.test(save.Error) ? save.Error : null;
    console.log('SAVE', err || save.Result || save.strings?.join('|')?.slice(0, 200));
  } catch (e) {
    console.log('THROW', e.message.slice(0, 200));
  }
}

// 1) Working baseline: ET nonstop ETB
await bookFlow('1 ET nonstop ETB', {
  currencyCode: 'ETB',
  currencyValue: '1',
  pick: (m) => m.find((x) => Number(x.StopCount) === 0 && x.CarrierCode === 'ET') || m.find((x) => Number(x.StopCount) === 0)
});

// 2) QR connecting ETB
await bookFlow('2 QR connecting ETB', {
  currencyCode: 'ETB',
  currencyValue: '1',
  pick: (m) =>
    m.find((x) => x.CarrierCode === 'QR' && Number(x.StopCount) > 0) ||
    m.find((x) => Number(x.StopCount) > 0)
});

// 3) ET nonstop BRL
await bookFlow('3 ET nonstop BRL', {
  currencyCode: 'BRL',
  currencyValue: '0.05',
  pick: (m) => m.find((x) => Number(x.StopCount) === 0)
});

// 4) QR connecting BRL (user case)
await bookFlow('4 QR connecting BRL', {
  currencyCode: 'BRL',
  currencyValue: '0.05',
  pick: (m) =>
    m.find((x) => x.CarrierCode === 'QR' && Number(x.StopCount) > 0) ||
    m.find((x) => Number(x.StopCount) > 0)
});

// 5) QR connecting BRL but defaults forced to ETB with converted? 
await bookFlow('5 QR BRL search but Save defaults ETB', {
  currencyCode: 'BRL',
  currencyValue: '0.05',
  pick: (m) =>
    m.find((x) => x.CarrierCode === 'QR' && Number(x.StopCount) > 0) ||
    m.find((x) => Number(x.StopCount) > 0),
  mutateDefaults: (d, fare) => ({
    ...d,
    CurrencyCode: 'ETB',
    FrontCurrencyCode: 'ETB',
    MainCurrencyCode: 'ETB',
    DefaultCurrencyvalue: '1',
    FrontCurrencyValue: '1',
    MainCurrencyvalue: '1',
    DebitAmount: Number(fare.GrandTotal || d.DebitAmount).toFixed(2)
  })
});

// 6) dates as dd-MM-yyyy
await bookFlow('6 QR ETB dd-MM-yyyy dates', {
  currencyCode: 'ETB',
  currencyValue: '1',
  pick: (m) =>
    m.find((x) => x.CarrierCode === 'QR' && Number(x.StopCount) > 0) ||
    m.find((x) => Number(x.StopCount) > 0),
  mutatePax: (p) => ({
    ...p,
    DateOfBirth: '15-01-1990',
    ExpiryDate: '31-12-2030',
    IssueDate: '01-01-2020'
  })
});

// 7) Check GetCurrency for BRL rate
console.log('\n=== GetCurrency ===');
try {
  const cur = await call('GetCurrency', []);
  const blob = cur.CurrencyList || cur.strings?.find((s) => s.startsWith('[')) || '';
  if (blob.startsWith('[')) {
    const list = JSON.parse(blob);
    const brl = list.find((c) => /BRL|Brazil/i.test(JSON.stringify(c)));
    const etb = list.find((c) => /ETB|Ethiop/i.test(JSON.stringify(c)));
    console.log('sample keys', Object.keys(list[0] || {}));
    console.log('BRL', brl);
    console.log('ETB', etb);
  } else {
    console.log('currency raw', (blob || cur._raw || '').slice(0, 400));
  }
} catch (e) {
  console.log('GetCurrency fail', e.message);
}
