/**
 * SOAP parameter names for GuestAPI operations.
 * Sourced from https://apitravel.afonestop.com/GuestAPI.asmx?op=*
 * Names are case-sensitive — do not rename without checking the WSDL page.
 */

/** SaveBooking — https://apitravel.afonestop.com/GuestAPI.asmx?op=SaveBooking */
export const SAVE_BOOKING_PARAMS = {
  selectedRowJson: 'SelectedRowJson',
  contactdetailJson: 'ContactdetailJson',
  defaultvalueJson: 'DefaultvalueJson',
  reqPassangerJson: 'ReqPassangerJson'
} as const;

/** Hotel2/3 use lowercase "json"; Hotel4 uses uppercase "Json". */
export const HOTEL_SELECT_HOTEL_JSON = {
  hotel2Hotel3: 'SelectHoteljson',
  hotel4: 'SelectHotelJson'
} as const;
