/**
 * Compare working e2e payload vs NDC; try FlightDetails ItemId merge.
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

const contact = JSON.stringify([
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
    Nationality: 'ET'
  }
]);

function defaults(grand) {
  return JSON.stringify([
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
  ]);
}

/** App-like light normalize */
function lightNormalize(rows) {
  return rows.map((item) => ({
    ...item,
    IsLCC: item.IsLCC ?? null,
    ProductOfferingID: item.ProductOfferingID ?? null
  }));
}

function collect(main, all) {
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
  return rows.map((r, idx) => ({
    ...r,
    AdultCount: idx === 0 ? 1 : 0,
    ChildCount: 0,
    InfantCount: 0
  }));
}

async function saveWith(label, selectedRowJson, grand) {
  try {
    const save = await call('SaveBooking', [
      ['SelectedRowJson', selectedRowJson],
      ['ContactdetailJson', contact],
      ['DefaultvalueJson', defaults(grand)],
      ['ReqPassangerJson', pax]
    ]);
    const err =
      save.Error && !/^no error$/i.test(save.Error) ? save.Error : null;
    console.log(`✓ ${label} =>`, err || save.Result);
    return true;
  } catch (e) {
    console.log(`✗ ${label} =>`, e.message.replace(/\s+/g, ' ').slice(0, 180));
    return false;
  }
}

const depart = new Date();
depart.setDate(depart.getDate() + 14);
const list = await call('GetOnewayList', [
  ['AdultCount', '1'],
  ['ChildrenCount', '0'],
  ['InfantCount', '0'],
  ['DepartDate', ddMmYyyy(depart)],
  ['CabinClass', '2'],
  ['Origin', 'ADD'],
  ['Destination', 'DXB'],
  ['CurrencyCode', 'ETB'],
  ['CurrencyValue', '1'],
  ['FlightMarkup', '0']
]);
const all = JSON.parse(list.FlightList);
const mains = all.filter((r) => r.RowType === 'MainRow');
const ms = mains.find((m) => m.CarrierCode === 'MS' && Number(m.StopCount) > 0);
const qr = mains.find((m) => m.CarrierCode === 'QR' && Number(m.StopCount) > 0);
const et = mains.find((m) => Number(m.StopCount) === 0);

async function flow(label, main, buildSelected) {
  console.log(`\n=== ${label} ${main.CarrierCode} ${main.FlightNumber} CS=${main.ConnectionIndex} ===`);
  const baseRows = collect(main, all);
  const jsonstring = JSON.stringify(baseRows);
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
    console.log('details fail', details.Error);
    return;
  }
  const fare = JSON.parse(details.FareSummary);
  const grand = fare.GrandTotal;
  console.log('GrandTotal', grand);
  if (details.FlightDetails) {
    try {
      const fd = JSON.parse(details.FlightDetails);
      console.log(
        'FlightDetails',
        fd.length,
        'ItemIds',
        fd.map((r) => r.ItemId),
        'FNs',
        fd.map((r) => r.FlightNumber),
        'CS',
        fd.map((r) => r.ConnectionIndex)
      );
    } catch {
      /* ignore */
    }
  }

  const variants = buildSelected(baseRows, details, main);
  for (const [name, payload] of variants) {
    await saveWith(name, typeof payload === 'string' ? payload : JSON.stringify(payload), grand);
  }
}

await flow('ET nonstop raw', et, (rows) => [['raw search rows', rows]]);

await flow('MS connecting', ms, (rows, details) => {
  const fd = details.FlightDetails ? JSON.parse(details.FlightDetails) : [];
  return [
    ['raw search', rows],
    ['lightNormalize', lightNormalize(rows)],
    ['FlightDetails as-is', details.FlightDetails],
    [
      'search + FD ItemId on all',
      rows.map((r, i) => ({
        ...r,
        ItemId: fd[0]?.ItemId || fd[i]?.ItemId || r.ItemId
      }))
    ],
    [
      'search ItemId stripped _PC from FD',
      rows.map((r) => ({
        ...r,
        ItemId: String(fd[0]?.ItemId || r.ItemId).replace(/_PC$/i, '')
      }))
    ]
  ];
});

await flow('QR NDC connecting', qr, (rows, details) => {
  const fd = details.FlightDetails ? JSON.parse(details.FlightDetails) : [];
  // Match FD segments by flight number onto search rows
  const byFn = new Map(fd.map((r) => [String(r.FlightNumber), r]));
  return [
    ['raw search', rows],
    ['lightNormalize', lightNormalize(rows)],
    ['FlightDetails as-is', details.FlightDetails],
    [
      'search + FD ItemId',
      rows.map((r) => ({ ...r, ItemId: fd[0]?.ItemId || r.ItemId }))
    ],
    [
      'merge FD fields onto search by FN',
      rows.map((r) => {
        const match =
          byFn.get(String(r.FlightNumber)) ||
          (r.RowType === 'MainRow' ? fd.find((x) => x.StopCount != null) : null);
        if (!match) return r;
        return {
          ...r,
          ItemId: match.ItemId || r.ItemId,
          ResultIndexID: match.ResultIndexID ?? r.ResultIndexID,
          LegIndex: match.LegIndex ?? r.LegIndex,
          FareDetails: match.FareDetails ?? r.FareDetails,
          IsLCC: match.IsLCC ?? r.IsLCC ?? null,
          ProductOfferingID: r.ProductOfferingID ?? null
        };
      })
    ],
    [
      'FD rows + pax counts + required booking cols from search main',
      fd.map((r, idx) => ({
        ...rows[0],
        ...r,
        RowType: idx === 0 ? 'MainRow' : 'SubRow',
        MainRowNumber: rows[0].MainRowNumber,
        AdultCount: idx === 0 ? 1 : 0,
        ChildCount: 0,
        InfantCount: 0,
        ProductOfferingID: rows[0].ProductOfferingID,
        ProductID: rows[0].ProductID,
        CatalogIdentifier: rows[0].CatalogIdentifier,
        BrandList: rows[0].BrandList,
        BrandRef: rows[0].BrandRef,
        BrandTier: rows[0].BrandTier
      }))
    ],
    [
      'FD only + light fields',
      fd.map((r, idx) => ({
        ...r,
        RowType: idx === 0 ? 'MainRow' : 'SubRow',
        MainRowNumber: rows[0].MainRowNumber,
        AdultCount: idx === 0 ? 1 : 0,
        ChildCount: 0,
        InfantCount: 0,
        ProductOfferingID: rows[0].ProductOfferingID ?? null,
        IsLCC: r.IsLCC ?? null,
        ProductID: rows[0].ProductID,
        CatalogIdentifier: rows[0].CatalogIdentifier,
        FareType: rows[0].FareType,
        OfferedFare: rows[0].OfferedFare,
        TotalPrice: rows[0].TotalPrice,
        AdultBaseFare: rows[0].AdultBaseFare,
        AdultTaxFare: rows[0].AdultTaxFare,
        AdultTotalFare: rows[0].AdultTotalFare
      }))
    ]
  ];
});
