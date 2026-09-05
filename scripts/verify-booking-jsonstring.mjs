/**
 * Offline check: round/multi GetBookingdetails jsonstring must include
 * MainRow + SubRows for the same ItemId (per GuestAPI spec).
 *
 * node scripts/verify-booking-jsonstring.mjs
 */

function belongsToSameItem(item, main) {
  const itemId = main.ItemId;
  if (!itemId) return true;
  return item.ItemId === itemId;
}

function isRoundway(item) {
  return item.TripType === 'Roundway' || item.RowTypeForward != null;
}

function isMultiway(item) {
  if (isRoundway(item)) return false;
  return item.TripType === 'Multiway' || item.RowTypeFirst != null;
}

function matchesMultiwayLegMainNumbers(item, main) {
  if (item.MainRowNumberFirst !== main.MainRowNumberFirst) return false;

  const legPairs = [
    ['MainRowNumberSecond', main.MainRowNumberSecond],
    ['MainRowNumberThird', main.MainRowNumberThird],
    ['MainRowNumberFourth', main.MainRowNumberFourth]
  ];

  for (const [key, expected] of legPairs) {
    if (expected == null || expected === 0) continue;
    if (item[key] !== expected) return false;
  }

  return true;
}

function collectBookingRows(main, allItems) {
  const catalog = allItems.filter((item) => belongsToSameItem(item, main));

  if (isRoundway(main)) {
    const fwd = main.MainRowNumberForward;
    const ret = main.MainRowNumberReturn;
    return catalog.filter((item) => {
      const forwardMatch = fwd == null || item.MainRowNumberForward === fwd;
      const returnMatch = ret == null || item.MainRowNumberReturn === ret;
      return forwardMatch && returnMatch;
    });
  }

  if (isMultiway(main)) {
    const n = main.MainRowNumberFirst;
    if (n == null) return [main];
    return catalog.filter(
      (item) =>
        item.MainRowNumberFirst === n &&
        matchesMultiwayLegMainNumbers(item, main)
    );
  }

  const n = main.MainRowNumber;
  return catalog.filter((item) => item.MainRowNumber === n);
}

// Minimal fixtures mirroring GuestAPI round/multi booking payloads.
const roundSample = [
  {
    ItemId: 'e67b74da-b3f2-4cb7-b0e0-8cae996d7338',
    RowTypeForward: 'MainRow',
    RowTypeReturn: 'MainRow',
    MainRowNumberForward: 79,
    MainRowNumberReturn: 220,
    TripType: 'Roundway',
    FlightNumberForward: '852 | 910',
    FlightNumberReturn: '906 | 851'
  },
  {
    ItemId: 'e67b74da-b3f2-4cb7-b0e0-8cae996d7338',
    RowTypeForward: 'SubRow',
    RowTypeReturn: 'SubRow',
    MainRowNumberForward: 79,
    MainRowNumberReturn: 220,
    FlightNumberForward: '852',
    FlightNumberReturn: null
  },
  {
    ItemId: 'e67b74da-b3f2-4cb7-b0e0-8cae996d7338',
    RowTypeForward: 'SubRow',
    RowTypeReturn: 'SubRow',
    MainRowNumberForward: 79,
    MainRowNumberReturn: 220,
    FlightNumberForward: '910',
    FlightNumberReturn: null
  },
  {
    ItemId: 'e67b74da-b3f2-4cb7-b0e0-8cae996d7338',
    RowTypeForward: 'SubRow',
    RowTypeReturn: 'SubRow',
    MainRowNumberForward: 79,
    MainRowNumberReturn: 220,
    FlightNumberForward: null,
    FlightNumberReturn: '906'
  },
  {
    ItemId: 'e67b74da-b3f2-4cb7-b0e0-8cae996d7338',
    RowTypeForward: 'SubRow',
    RowTypeReturn: 'SubRow',
    MainRowNumberForward: 79,
    MainRowNumberReturn: 220,
    FlightNumberForward: null,
    FlightNumberReturn: '851'
  },
  {
    ItemId: 'other-item-id',
    RowTypeForward: 'SubRow',
    MainRowNumberForward: 79,
    MainRowNumberReturn: 220,
    FlightNumberForward: '999'
  }
];

const multiSample = [
  {
    ItemId: '693b00ef-5b7e-4e37-91f6-a08d133e2825',
    RowTypeFirst: 'MainRow',
    RowTypeSecond: 'MainRow',
    RowTypeThird: 'MainRow',
    MainRowNumberFirst: 488,
    MainRowNumberSecond: 496,
    MainRowNumberThird: 512,
    MainRowNumberFourth: 0,
    TripType: 'Multiway',
    FlightNumberFirst: '210'
  },
  {
    ItemId: '693b00ef-5b7e-4e37-91f6-a08d133e2825',
    RowTypeSecond: 'SubRow',
    MainRowNumberFirst: 488,
    MainRowNumberSecond: 496,
    MainRowNumberThird: 512,
    MainRowNumberFourth: 0,
    FlightNumberSecond: '227'
  },
  {
    ItemId: '693b00ef-5b7e-4e37-91f6-a08d133e2825',
    RowTypeSecond: 'SubRow',
    MainRowNumberFirst: 488,
    MainRowNumberSecond: 496,
    MainRowNumberThird: 512,
    MainRowNumberFourth: 0,
    FlightNumberSecond: '600'
  },
  {
    ItemId: '693b00ef-5b7e-4e37-91f6-a08d133e2825',
    RowTypeSecond: 'SubRow',
    MainRowNumberFirst: 488,
    MainRowNumberSecond: 999,
    MainRowNumberThird: 512,
    FlightNumberSecond: 'alt-leg'
  },
  {
    ItemId: 'other-item-id',
    RowTypeSecond: 'SubRow',
    MainRowNumberFirst: 488,
    MainRowNumberSecond: 496,
    FlightNumberSecond: '999'
  }
];

const roundMain = roundSample[0];
const multiMain = multiSample[0];

const roundRows = collectBookingRows(roundMain, roundSample);
const multiRows = collectBookingRows(multiMain, multiSample);

console.log('Round sample rows:', roundRows.length, '(expected 5)');
console.log('Multi sample rows:', multiRows.length, '(expected 3)');

if (roundRows.length !== 5 || multiRows.length !== 3) {
  console.error('FAIL — row counts do not match GuestAPI examples');
  process.exit(1);
}

const roundJson = JSON.stringify(roundRows);
const multiJson = JSON.stringify(multiRows);

if (!roundJson.includes('"RowTypeForward":"SubRow"')) {
  console.error('FAIL — round jsonstring missing SubRow');
  process.exit(1);
}

if (!multiJson.includes('"RowTypeSecond":"SubRow"')) {
  console.error('FAIL — multi jsonstring missing SubRow');
  process.exit(1);
}

console.log('OK — jsonstring arrays include MainRow + SubRows for same ItemId');
