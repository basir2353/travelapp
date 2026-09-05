/**
 * Deep probe: make QR/NDC SaveBooking succeed.
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
  const out = { raw: text };
  for (const name of [
    'FlightList',
    'Error',
    'FareSummary',
    'Result',
    'FlightDetails',
    'PenaltyRules'
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

function grandOf(fareSummary) {
  if (!fareSummary) return 0;
  const f = JSON.parse(fareSummary);
  return Number(f.GrandTotal ?? f[0]?.GrandTotal ?? 0);
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
const qr = mains.find((m) => m.CarrierCode === 'QR' && Number(m.StopCount) > 0);
const ms = mains.find((m) => m.CarrierCode === 'MS' && Number(m.StopCount) > 0);

function collect(main) {
  const subs = all.filter(
    (i) => i.RowType === 'SubRow' && i.MainRowNumber === main.MainRowNumber
  );
  return [
    main,
    ...subs.map((s) => ({
      ...s,
      ItemId: main.ItemId,
      MainRowNumber: main.MainRowNumber
    }))
  ].map((r, i) => ({
    ...r,
    AdultCount: i === 0 ? 1 : 0,
    ChildCount: 0,
    InfantCount: 0
  }));
}

// Diff keys/values that might matter
function summarize(row) {
  return {
    ConnectionIndex: row.ConnectionIndex,
    BookingAPI: row.BookingAPI,
    FareType: row.FareType,
    ProductID: row.ProductID,
    ProductOfferingID: row.ProductOfferingID,
    CatalogIdentifier: row.CatalogIdentifier,
    BrandList: row.BrandList,
    BrandRef: row.BrandRef,
    BrandTier: row.BrandTier,
    IsLCC: row.IsLCC,
    FareSource: row.FareSource,
    ResultIndexID: row.ResultIndexID,
    LegIndex: row.LegIndex,
    Craft: row.Craft,
    Refundable: row.Refundable,
    Currency: row.Currency,
    LastTicketingDate: row.LastTicketingDate
  };
}

console.log('QR main meta', summarize(qr));
console.log('MS main meta', summarize(ms));
console.log('QR vs MS key-only-in-one:');
const qk = new Set(Object.keys(qr));
const mk = new Set(Object.keys(ms));
console.log(
  'only QR',
  [...qk].filter((k) => !mk.has(k))
);
console.log(
  'only MS',
  [...mk].filter((k) => !qk.has(k))
);

const qrRows = collect(qr);
const msRows = collect(ms);

async function detailsFor(main, rows, cs) {
  return call('GetBookingdetails', [
    ['UserTypeId', '2'],
    ['UserId', '1'],
    ['traceId', String(main.ItemId || '').replace(/_PC$/i, '')],
    ['TripType', 'Oneway'],
    ['ContentSource', cs],
    ['AdultCount', '1'],
    ['ChildrenCount', '0'],
    ['InfantCount', '0'],
    ['jsonstring', JSON.stringify(rows)],
    ['CurrencyCode', 'ETB'],
    ['CurrencyValue', '1'],
    ['FlightMarkup', '0']
  ]);
}

const qrDet = await detailsFor(qr, qrRows, 'NDC');
const msDet = await detailsFor(ms, msRows, 'GDS');
console.log('\nQR FareSummary', qrDet.FareSummary?.slice(0, 300));
console.log('MS FareSummary', msDet.FareSummary?.slice(0, 300));
console.log('\nQR FlightDetails full length', qrDet.FlightDetails?.length);
const qrFd = JSON.parse(qrDet.FlightDetails);
const msFd = JSON.parse(msDet.FlightDetails);
console.log('QR FD[0]', JSON.stringify(qrFd[0], null, 2));
console.log('MS FD[0] keys', Object.keys(msFd[0]));
console.log('QR FD FareDetails sample', qrFd[0]?.FareDetails);

const contactVariants = [
  [
    'std',
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
  ],
  [
    'country code only',
    {
      HouseNo: 'Bole',
      Address: 'Addis Ababa',
      City: 'Addis Ababa',
      ZipCode: '1000',
      Country: 'ET',
      Email: 'e2e.test@mkash.travel',
      MobileNo: '911223344',
      PhoneCode: '251'
    }
  ]
];

const paxVariants = [
  [
    'std',
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
  ],
  [
    'gender M + ADT',
    {
      PassID: '1',
      PaxType: 'ADT',
      Title: 'MR',
      FirstName: 'Test',
      MiddleName: '',
      LastName: 'Traveller',
      Gender: 'M',
      DateOfBirth: '1990-01-15',
      DoumentType: 'Passport',
      DoumentNo: 'EP1234567',
      ExpiryDate: '2030-12-31',
      IssueDate: '2020-01-01',
      Nationality: 'ET'
    }
  ],
  [
    'ddMMyyyy dates',
    {
      PassID: '1',
      PaxType: 'Adult',
      Title: 'Mr',
      FirstName: 'Test',
      MiddleName: '',
      LastName: 'Traveller',
      Gender: 'Male',
      DateOfBirth: '15-01-1990',
      DoumentType: 'Passport',
      DoumentNo: 'EP1234567',
      ExpiryDate: '31-12-2030',
      IssueDate: '01-01-2020',
      Nationality: 'ET'
    }
  ]
];

function defaults(grand, extra = {}) {
  return {
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
    BookingStatusChk: 'BS',
    ...extra
  };
}

async function trySave(label, selected, grand, contact, pax, defExtra) {
  try {
    const save = await call('SaveBooking', [
      [
        'SelectedRowJson',
        typeof selected === 'string' ? selected : JSON.stringify(selected)
      ],
      ['ContactdetailJson', JSON.stringify([contact])],
      ['DefaultvalueJson', JSON.stringify([defaults(grand, defExtra)])],
      ['ReqPassangerJson', JSON.stringify([pax])]
    ]);
    const err =
      save.Error && !/^no error$/i.test(save.Error) ? save.Error : null;
    console.log(`✓ ${label} =>`, err || save.Result);
    return !err;
  } catch (e) {
    console.log(`✗ ${label} =>`, e.message.replace(/\s+/g, ' ').slice(0, 140));
    return false;
  }
}

const grand = grandOf(qrDet.FareSummary);
const [cName, contact] = contactVariants[0];
const [pName, pax] = paxVariants[0];

console.log('\n--- NDC save attempts ---');

// 1) Copy MS-shaped meta onto QR rows (force GDS-like fields)
await trySave(
  'QR with MS-like ProductOfferingID/FareType/CS',
  qrRows.map((r) => ({
    ...r,
    ConnectionIndex: 'GDS',
    FareType: ms.FareType,
    ProductOfferingID: ms.ProductOfferingID,
    ProductID: ms.ProductID,
    CatalogIdentifier: ms.CatalogIdentifier,
    BrandList: ms.BrandList,
    BrandRef: ms.BrandRef,
    BrandTier: ms.BrandTier
  })),
  grand,
  contact,
  pax
);

// 2) Reorder FD: Main first by longest/stop, unique segments
const uniqueFd = [];
const seenFn = new Set();
for (const r of qrFd) {
  const fn = String(r.FlightNumber);
  if (seenFn.has(fn)) continue;
  seenFn.add(fn);
  uniqueFd.push(r);
}
console.log(
  'unique FD FNs',
  uniqueFd.map((r) => r.FlightNumber)
);

// Build SelectedRowJson from search main + unique FD segments
const hybrid = [
  {
    ...qrRows[0],
    ItemId: qrFd[0].ItemId
  },
  ...uniqueFd.map((seg, i) => {
    const sub =
      qrRows.find((r) => String(r.FlightNumber) === String(seg.FlightNumber)) ||
      qrRows[i + 1] ||
      qrRows[0];
    return {
      ...sub,
      ...seg,
      RowType: 'SubRow',
      MainRowNumber: qr.MainRowNumber,
      AdultCount: 0,
      ChildCount: 0,
      InfantCount: 0,
      ProductOfferingID: qr.ProductOfferingID,
      ProductID: qr.ProductID,
      CatalogIdentifier: qr.CatalogIdentifier,
      BrandList: qr.BrandList,
      BrandRef: qr.BrandRef,
      BrandTier: qr.BrandTier,
      FareType: qr.FareType,
      ConnectionIndex: 'NDC',
      IsLCC: seg.IsLCC ?? null
    };
  })
];
// fix first row
hybrid[0] = {
  ...hybrid[0],
  RowType: 'MainRow',
  AdultCount: 1,
  ChildCount: 0,
  InfantCount: 0,
  FlightNumber: qr.FlightNumber,
  StopCount: qr.StopCount
};

await trySave('hybrid main+uniqueFD', hybrid, grand, contact, pax);

// 3) Exactly 1 main + 2 subs from search but ItemId from FD, ResultIndexID from FD
await trySave(
  'search rows + FD ItemId/ResultIndex',
  qrRows.map((r, i) => ({
    ...r,
    ItemId: qrFd[0].ItemId,
    ResultIndexID: qrFd[Math.min(i, qrFd.length - 1)].ResultIndexID,
    LegIndex: qrFd[Math.min(i, qrFd.length - 1)].LegIndex,
    IsLCC: qrFd[0].IsLCC,
    FareDetails: qrFd[Math.min(i, qrFd.length - 1)].FareDetails
  })),
  grand,
  contact,
  pax
);

// 4) Strip Brand* nulls / empty strings that might break IndexOf
await trySave(
  'search rows scrub empty strings to null',
  qrRows.map((r) => {
    const o = { ...r };
    for (const [k, v] of Object.entries(o)) {
      if (v === '') o[k] = null;
    }
    return o;
  }),
  grand,
  contact,
  pax
);

// 5) Remove BrandList/BrandRef/BrandTier/CatalogIdentifier entirely
await trySave(
  'search rows without brand fields',
  qrRows.map((r) => {
    const o = { ...r };
    delete o.BrandList;
    delete o.BrandRef;
    delete o.BrandTier;
    delete o.CatalogIdentifier;
    return o;
  }),
  grand,
  contact,
  pax
);

// 6) Passenger/contact matrix on raw search (quick)
for (const [cn, c] of contactVariants) {
  for (const [pn, p] of paxVariants) {
    await trySave(`raw + ${cn} + ${pn}`, qrRows, grand, c, p);
  }
}

// 7) BookingStatusChk variants
for (const bs of ['BS', 'B', '1', 'true', 'False', '']) {
  await trySave(`BookingStatusChk=${bs}`, qrRows, grand, contact, pax, {
    BookingStatusChk: bs
  });
}

// 8) Use same SelectedRowJson that GetBookingdetails accepted, but ensure DebitAmount matches FareSummary exactly as string from API
const fareObj = JSON.parse(qrDet.FareSummary);
console.log('fareObj', fareObj);
await trySave(
  'DebitAmount from fare string',
  qrRows,
  fareObj.GrandTotal ?? fareObj[0]?.GrandTotal,
  contact,
  pax
);

// 9) Inspect LastTicketingDate / dates on QR - maybe empty date causes StartIndex
console.log(
  'QR dates',
  qrRows.map((r) => ({
    FN: r.FlightNumber,
    Dep: r.DepartureDate,
    Arr: r.ArrivalDate,
    LTD: r.LastTicketingDate
  }))
);
console.log(
  'MS dates',
  msRows.map((r) => ({
    FN: r.FlightNumber,
    Dep: r.DepartureDate,
    Arr: r.ArrivalDate,
    LTD: r.LastTicketingDate
  }))
);
