# Mkash Travel — GuestAPI Integration Reference

**App:** Mkash Travel (`com.mkash.travel`)  
**Base URL:** `https://apitravel.afonestop.com/GuestAPI.asmx`  
**Protocol:** SOAP 1.1 over HTTP POST  
**Namespace:** `http://tempuri.org/`  
**Source code:** `src/services/guestApi/`  
**Last updated:** July 2026  

---

## Summary

| Category        | Count |
|-----------------|-------|
| General / Shared | 2    |
| Flights         | 5     |
| Bus             | 3     |
| Car Rental      | 3     |
| Hotels          | 4     |
| Booking History | 2     |
| **Total**       | **19** |

---

## All API Names (Quick List)

```
GetProductAccess
GetCountry
GetOnewayList
GetRoundwayList
GetMultiwayList
GetBookingdetails
SaveBooking
Bus1_CityList
Bus1_List
Bus2_SelecSeat
Car1_List
Car2_SelecCar
Car_Booking
Hotel1_List
Hotel2_HotelDetails
Hotel3_RoomDetails
Hotel4_Booking
BookingCardListGet
BookingCardViewGet
```

---

## 1. General / Shared

| # | SOAP Operation     | App Function           | File                         | Purpose |
|---|--------------------|------------------------|------------------------------|---------|
| 1 | `GetProductAccess` | `getProductAccess()`   | `productAccess.ts`           | Travel product categories on home screen |
| 2 | `GetCountry`       | `getCountry()`         | `country.ts`                 | Country picker (onboarding, nationality, contact country) |

---

## 2. Flights

| # | SOAP Operation      | App Function            | File        | Purpose |
|---|---------------------|-------------------------|-------------|---------|
| 3 | `GetOnewayList`     | `getOnewayList()`       | `flight.ts` | One-way flight search |
| 4 | `GetRoundwayList`   | `getRoundwayList()`     | `flight.ts` | Round-trip flight search |
| 5 | `GetMultiwayList`   | `getMultiwayList()`     | `flight.ts` | Multi-city flight search (up to 4 legs) |
| 6 | `GetBookingdetails` | `getBookingDetails()`   | `flight.ts` | Fare confirmation, segments, pricing, fare rules |
| 7 | `SaveBooking`       | `saveBooking()`         | `flight.ts` | Create flight PNR after payment |

**Supporting mappers:** `mapFlightToTrip.ts`, `mapFlightBooking.ts`, `mapSaveBooking.ts`

---

## 3. Bus

| # | SOAP Operation   | App Function          | File     | Purpose |
|---|------------------|-----------------------|----------|---------|
| 8 | `Bus1_CityList`  | `bus1CityList()`      | `bus.ts` | Search bus cities by name |
| 9 | `Bus1_List`      | `bus1List()`          | `bus.ts` | Bus trip search results |
| 10 | `Bus2_SelecSeat` | `bus2SelectSeat()`    | `bus.ts` | Seat layout and seat selection |

**Supporting mappers:** `mapBusToTrip.ts`, `mapBusSeats.ts`

---

## 4. Car Rental

| # | SOAP Operation  | App Function         | File     | Purpose |
|---|-----------------|----------------------|----------|---------|
| 11 | `Car1_List`     | `car1List()`         | `car.ts` | Available cars for location and dates |
| 12 | `Car2_SelecCar` | `car2SelectCar()`    | `car.ts` | Select car and get pricing |
| 13 | `Car_Booking`   | `carBooking()`       | `car.ts` | Confirm car rental booking |

**Supporting mappers:** `mapCarToRental.ts`, `mapCarSelection.ts`, `mapCarBooking.ts`

---

## 5. Hotels

| # | SOAP Operation        | App Function              | File       | Purpose |
|---|-----------------------|---------------------------|------------|---------|
| 14 | `Hotel1_List`         | `hotel1List()`            | `hotel.ts` | Hotel search results |
| 15 | `Hotel2_HotelDetails` | `hotel2HotelDetails()`    | `hotel.ts` | Hotel details page |
| 16 | `Hotel3_RoomDetails`  | `hotel3RoomDetails()`     | `hotel.ts` | Room types and pricing |
| 17 | `Hotel4_Booking`      | `hotel4Booking()`         | `hotel.ts` | Confirm hotel booking |

**Supporting mappers:** `mapHotelToListing.ts`, `mapHotelDetails.ts`, `mapHotelRoomDetails.ts`, `mapHotelBooking.ts`

---

## 6. Booking History

| # | SOAP Operation        | App Function              | File              | Purpose |
|---|-----------------------|---------------------------|-------------------|---------|
| 18 | `BookingCardListGet`  | `bookingCardListGet()`    | `bookingCards.ts` | List user bookings |
| 19 | `BookingCardViewGet`  | `bookingCardViewGet()`    | `bookingCards.ts` | Single booking detail view |

---

## Technical Notes

### Client
- All operations call `callGuestApi()` in `soapClient.ts`.
- Responses are parsed in `parseResponse.ts` (SOAP envelope, `<string>`, and `*Result` nodes).

### Dev vs Production
- **Development:** requests go through Vite proxy at `/api/guest` → production host (avoids CORS).
- **Production / APK:** requests go directly to `https://apitravel.afonestop.com/GuestAPI.asmx`.

### UI Components Using APIs
| Component            | APIs Used        |
|----------------------|------------------|
| `ApiCountrySelect`   | `GetCountry`     |
| `ApiCitySelect`      | `Bus1_CityList`  |
| `EthioFunnel`        | Flights, Bus, Car, Hotel, `GetCountry` |
| Onboarding           | `GetCountry`, `Bus1_CityList` |
| Booking cards screen | `BookingCardListGet`, `BookingCardViewGet` |

### Build Commands
```bash
npm run dev          # Web dev server with API proxy
npm run build        # Production web build
npm run cap:sync     # Build web + sync to Android
npm run cap:release  # Sync + assembleRelease + bundleRelease
```

### Release APK Output
```
android/app/build/outputs/apk/release/MkashTravel-v{version}-release.apk
android/app/build/outputs/bundle/release/app-release.aab
```

---

## API Documentation Links

Full SOAP docs for each operation:
`https://apitravel.afonestop.com/GuestAPI.asmx?op={OperationName}`

Example: `https://apitravel.afonestop.com/GuestAPI.asmx?op=GetCountry`
