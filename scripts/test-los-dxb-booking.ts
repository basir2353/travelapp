import {
  getOnewayList,
  getBookingDetails,
  saveBooking,
  buildSaveBookingPayload,
  serializeBookingRows,
  collectBookingRowsForApi,
  resolveBookableNdcMain,
  sanitizeBookingRowsForSave
} from '../src/services/guestApi/index.ts';

async function main() {
  const list = await getOnewayList({
    origin: 'LOS',
    destination: 'DXB',
    departDate: '28-08-2026',
    adultCount: 1,
    childrenCount: 0,
    infantCount: 0,
    cabinClass: '2',
    currencyCode: 'ETB',
    currencyValue: 1,
    fromLabel: 'Lagos',
    toLabel: 'Dubai'
  });
  console.log(
    'trips',
    list.trips.length,
    'raw',
    list.raw.length,
    'msg',
    list.apiMessage
  );
  const mainRow = list.trips[0]?.apiPayload as Record<string, unknown> | undefined;
  if (!mainRow) {
    console.log('no main');
    process.exit(1);
  }
  const bookable = resolveBookableNdcMain(mainRow as never, list.raw);
  const rows = collectBookingRowsForApi(bookable, list.raw);
  const json = serializeBookingRows(bookable, rows, {
    adultCount: 1,
    childrenCount: 0,
    infantCount: 0
  });
  console.log(
    'json rows',
    JSON.parse(json).length,
    'product',
    bookable.ProductID,
    'conn',
    bookable.ConnectionIndex
  );

  const details = await getBookingDetails({
    traceId: String(bookable.ItemId || '').replace(/_PC$/i, ''),
    tripType: 'Oneway',
    contentSource: String(bookable.ConnectionIndex || 'GDS'),
    jsonstring: json,
    adultCount: 1,
    childrenCount: 0,
    infantCount: 0,
    currencyCode: 'ETB',
    currencyValue: 1,
    userTypeId: 2,
    userId: 1181
  });
  console.log(
    'bookingdetails pricing',
    details.pricing?.GrandTotal,
    'apiMessage',
    details.apiMessage,
    'details',
    details.details.length
  );

  const selected =
    details.details.length > 0 ?
      JSON.stringify(sanitizeBookingRowsForSave(details.details)) :
      json;
  const payload = buildSaveBookingPayload({
    selectedRowJson: selected,
    travellers: [
      {
        paxType: 'Adult',
        title: 'Mr',
        firstName: 'Test',
        lastName: 'Traveller',
        gender: 'Male',
        dob: '1990-01-15',
        nationality: 'ET',
        passport: 'A12345678',
        passportIssueDate: '2020-01-01',
        passportExpiry: '2030-09-30',
        email: 'test@mkash.et',
        mobile: '911000000'
      }
    ],
    debitAmount: details.pricing?.GrandTotal || String(mainRow.TotalPrice),
    paymentId: 'MKASH-TEST-1',
    userId: 1181,
    userTypeId: 2,
    currencyCode: 'ETB',
    currencyValue: 1,
    contact: {
      email: 'test@mkash.et',
      mobile: '911000000',
      city: 'Addis Ababa',
      country: 'Ethiopia - ET',
      phoneCode: '251'
    }
  });
  try {
    const result = await saveBooking(payload);
    console.log('save OK', result);
  } catch (e) {
    console.log('save FAIL', e instanceof Error ? e.message : e);
    try {
      const result2 = await saveBooking({ ...payload, selectedRowJson: json });
      console.log('save2 OK', result2);
    } catch (e2) {
      console.log('save2 FAIL', e2 instanceof Error ? e2.message : e2);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
