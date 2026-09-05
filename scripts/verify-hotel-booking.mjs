/**
 * Verify Hotel1 → Hotel2 → Hotel3 → Hotel4 booking flow.
 * Run: npm run dev, then node scripts/verify-hotel-booking.mjs
 */

const API = 'http://localhost:5174/api/guest';
const NS = 'http://tempuri.org/';

function escapeXml(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function callApi(op, params) {
  const body = Object.entries(params)
    .map(([name, value]) => `<${name}>${escapeXml(value)}</${name}>`)
    .join('');
  const env = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body><${op} xmlns="${NS}">${body}</${op}></soap:Body>
</soap:Envelope>`;
  const res = await fetch(`${API}/${op}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `"${NS}${op}"`
    },
    body: env
  });
  const text = await res.text();
  const fault = text.match(/<faultstring[^>]*>([^<]+)/i)?.[1];
  if (fault) throw new Error(`${op}: ${fault}`);
  return [...text.matchAll(/<string[^>]*>([^<]*)<\/string>/gi)].map((m) => m[1]);
}

async function main() {
  const rg =
    '[{"Roomno":"1","Adult":"1","Child":"0","Child1Age":"0","Child2Age":"0"}]';
  const ci = '23-07-2026';
  const co = '24-07-2026';

  const list = await callApi('Hotel1_List', {
    CheckInDate: ci,
    CheckOutDate: co,
    CityName: 'chennai',
    CountryCode: 'IN',
    RoomCount: '1',
    CurrencyCode: 'ETB',
    HotelMarkup: '0',
    DefaultCurrencyValue: '1',
    RoomGuestJson: rg
  });
  const hotels = JSON.parse(list.find((s) => s.startsWith('[')));
  const pick = hotels.find((h) => h.Hotelcode === 'HI-C7425') || hotels[0];

  const h2 = await callApi('Hotel2_HotelDetails', {
    CheckInDate: ci,
    CheckOutDate: co,
    HotelMarkup: '0',
    DefaultCurrencyValue: '1',
    RoomGuestJson: rg,
    SelectHoteljson: JSON.stringify([pick])
  });
  const rooms = JSON.parse(h2.find((s) => JSON.parse(s)[0]?.RoomCode));
  const room = rooms[0];

  const h3 = await callApi('Hotel3_RoomDetails', {
    UserTypeId: '2',
    UserId: '1000',
    CheckInDate: ci,
    CheckOutDate: co,
    HotelMarkup: '0',
    DefaultCurrencyValue: '1',
    TotalDays: String(pick.TotalDays || '1'),
    JsonSelectRoom: JSON.stringify([room]),
    RoomGuestJson: rg,
    SelectHoteljson: JSON.stringify([pick])
  });

  const pricing = JSON.parse(h3[1])[0];
  const bookingJson = JSON.stringify([pricing]);
  const selectRoomJson = JSON.stringify([room]);
  const selectHotelJson = JSON.stringify([pick]);

  const contactDetailJson = JSON.stringify([
    {
      Email: 'seenu@gmail.com',
      MobileNo: '9600179409',
      Address: 'Nagercoil',
      City: 'Nagercoil',
      Country: 'India-IN'
    }
  ]);

  const reqPassangerJson = JSON.stringify([
    {
      PassID: '1',
      PaxType: 'Adult',
      Title: 'Mr',
      FirstName: 'Srinivasan',
      LastName: 'Muthuraj',
      Gender: 'Male',
      DateOfBirth: '1988-05-10',
      DoumentType: 'Passport',
      DoumentNo: '987654321001',
      ExpiryDate: '2030-12-31',
      IssueDate: '2024-12-31',
      Nationality: 'Indians-IN',
      BaseFare: String(pricing.RoomFare ?? '0'),
      TaxFare: String(pricing.HotelTax ?? '0')
    }
  ]);

  const h4 = await callApi('Hotel4_Booking', {
    UserTypeId: '2',
    UserId: '1000',
    CheckInDate: ci,
    CheckOutDate: co,
    DefaultCurrencyValue: '1',
    RegionID: '',
    HotelStatus: '2',
    CurrencyCode: 'ETB',
    HotelMarkup: '1',
    FrontCurrencyCode: 'ETB',
    FrontCurrencyValue: '1',
    JsonRoomGuest: rg,
    SelectHotelJson: selectHotelJson,
    SelectRoomJson: selectRoomJson,
    BookingJson: bookingJson,
    ContactDetailJson: contactDetailJson,
    ReqPassangerJson: reqPassangerJson
  });

  const message = h4.join(' ').trim();
  console.log(`Hotel4 response: ${message}`);
  const idMatch = message.match(/ID\s*is\s*:?\s*(\d+)/i);
  if (!idMatch) {
    throw new Error(`Expected booking ID in response: ${message}`);
  }
  console.log(`Hotel4 OK — booking ID ${idMatch[1]}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
