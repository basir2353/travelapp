import { jsPDF } from 'jspdf';
import type { Trip } from '../components/travel/ethioTravelData';

export type TicketPdfInput = {
  bookingRef: string;
  pnr?: string;
  className: string;
  seatLabel?: string;
  passengers?: string[];
  totalAmount?: string;
  paymentStatus?: string;
  outbound: Trip | null;
  returnTrip?: Trip | null | undefined;
  holidayTour?: {
    name: string;
    location: string;
    packageName: string;
    travelFrom: string;
    travelTo: string;
    adults: string;
  };
};

export type TicketPdfResult = {
  blobUrl: string;
  dataUri: string;
  blob: Blob;
};

export type TicketPdfPreview = {
  title: string;
  subtitle?: string;
  bookingRef: string;
  pnr?: string;
  rows: { label: string; value: string }[];
  totalAmount?: string;
  paymentStatus?: string;
  passengers?: string[];
};

function stopLabel(transfers: number | undefined): string {
  if (transfers == null || transfers === 0) return 'Non-stop';
  if (transfers === 1) return '1 Stop';
  return `${transfers} Stops`;
}

function cityLine(trip: Trip, side: 'from' | 'to'): string {
  const city = side === 'from' ? trip.fromCity : trip.toCity;
  const code =
    side === 'from' ? trip.departCityCode : trip.arriveCityCode;
  const bare = (city || '').replace(/\s*\([^)]*\)\s*/g, '').trim();
  const resolved =
    (code || '').trim().toUpperCase() ||
    city?.match(/\(([A-Za-z]{3})\)/)?.[1]?.toUpperCase() ||
    '';
  if (resolved && bare && bare.toUpperCase() === resolved) return resolved;
  if (resolved && bare) return `${bare} (${resolved})`;
  if (resolved) return resolved;
  return city || '—';
}

function drawLeg(
  doc: jsPDF,
  title: string,
  trip: Trip,
  yStart: number
): number {
  let y = yStart;
  doc.setFillColor(13, 123, 62);
  doc.roundedRect(14, y, 28, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 16, y + 5);

  doc.setTextColor(26, 29, 38);
  doc.setFontSize(11);
  doc.text(trip.flightNo ? `Flight ${trip.flightNo}` : trip.operator, 46, y + 5);

  y += 16;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(trip.departTime || '—', 20, y);
  doc.text(trip.arriveTime || '—', 150, y);

  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(cityLine(trip, 'from'), 20, y, { maxWidth: 55 });
  doc.text(cityLine(trip, 'to'), 150, y, { maxWidth: 40 });

  doc.setDrawColor(209, 213, 219);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(78, y - 8, 140, y - 8);
  doc.setLineDashPattern([], 0);

  doc.setTextColor(26, 29, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(trip.duration || '', 109, y - 11, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(stopLabel(trip.transfers), 109, y - 4, { align: 'center' });

  y += 12;
  doc.setTextColor(26, 29, 38);
  doc.setFontSize(10);
  doc.text(trip.operator, 20, y);

  return y + 10;
}

function renderTicketDoc(input: TicketPdfInput): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const ref = input.bookingRef || input.pnr || 'PENDING';

  doc.setFillColor(13, 123, 62);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Mkash Travel', 14, 12);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('E-Ticket / Boarding pass', 14, 20);

  doc.setTextColor(26, 29, 38);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Booking reference', 14, 40);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${ref.replace(/^#/, '')}`, 196, 40, { align: 'right' });

  if (input.pnr && input.pnr !== ref) {
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`PNR ${input.pnr}`, 196, 46, { align: 'right' });
  }

  let y = 54;
  doc.setDrawColor(229, 231, 235);

  if (input.holidayTour) {
    const tour = input.holidayTour;
    doc.roundedRect(12, y, 186, 52, 3, 3, 'S');
    y += 10;
    doc.setTextColor(26, 29, 38);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(tour.name, 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(tour.location, 20, y);
    y += 8;
    doc.setTextColor(26, 29, 38);
    doc.text(`Package: ${tour.packageName}`, 20, y);
    y += 6;
    doc.text(`Travel: ${tour.travelFrom} → ${tour.travelTo}`, 20, y);
    y += 6;
    doc.text(`Guests: ${tour.adults}`, 20, y);
    y += 14;
  } else {
    doc.roundedRect(12, y, 186, input.returnTrip ? 78 : 42, 3, 3, 'S');

    y += 8;
    if (input.outbound) {
      y = drawLeg(doc, 'DEPARTURE', input.outbound, y);
    }
    if (input.returnTrip) {
      doc.setDrawColor(229, 231, 235);
      doc.line(20, y - 2, 190, y - 2);
      y += 4;
      y = drawLeg(doc, 'RETURN', input.returnTrip, y);
    }

    y = Math.max(y, input.returnTrip ? 140 : 105);
  }

  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(12, y, 186, 42, 3, 3, 'S');
  y += 10;
  doc.setTextColor(26, 29, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  if (input.holidayTour) {
    doc.text(`Package: ${input.holidayTour.packageName}`, 20, y);
  } else {
    doc.text(`Class: ${input.className || 'Economy'}`, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Seat: ${input.seatLabel || '—'}`, 110, y);
  }

  y += 8;
  if (input.passengers && input.passengers.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Passenger(s): ${input.passengers.join(', ')}`, 20, y, {
      maxWidth: 170
    });
    y += 8;
  }
  if (input.totalAmount) {
    doc.setTextColor(26, 29, 38);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${input.totalAmount}`, 20, y);
    if (input.paymentStatus) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Payment: ${input.paymentStatus}`, 110, y);
    }
    y += 8;
  }

  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(
    "Cancellation policies apply as per the operator's terms. Refunds may be subject to an admin fee. Ticket is non-transferable.",
    20,
    y,
    { maxWidth: 170 }
  );

  doc.setFontSize(8);
  doc.text('Generated by Mkash Travel · Present this e-ticket at check-in', 105, 285, {
    align: 'center'
  });

  return doc;
}

/** Build PDF outputs for preview + download (data URI works better on Android). */
export function buildTicketPdf(input: TicketPdfInput): TicketPdfResult {
  const doc = renderTicketDoc(input);
  const blob = doc.output('blob');
  const dataUri = doc.output('datauristring');
  const blobUrl = URL.createObjectURL(blob);
  return { blobUrl, dataUri, blob };
}

/** Prefer data URI so Android WebView / download links can open the file. */
export function buildTicketPdfUrl(input: TicketPdfInput): string {
  return buildTicketPdf(input).dataUri;
}

/** Structured preview used in-app (Android cannot reliably iframe blob PDFs). */
export function buildTicketPdfPreview(input: TicketPdfInput): TicketPdfPreview {
  const ref = (input.bookingRef || input.pnr || 'PENDING').replace(/^#/, '');
  const rows: TicketPdfPreview['rows'] = [];

  if (input.holidayTour) {
    const tour = input.holidayTour;
    return {
      title: tour.name,
      subtitle: tour.location,
      bookingRef: ref,
      pnr: input.pnr,
      rows: [
        { label: 'Package', value: tour.packageName },
        { label: 'Travel from', value: tour.travelFrom },
        { label: 'Travel to', value: tour.travelTo },
        { label: 'Guests', value: tour.adults }
      ],
      totalAmount: input.totalAmount,
      paymentStatus: input.paymentStatus,
      passengers: input.passengers
    };
  }

  if (input.outbound) {
    const t = input.outbound;
    rows.push({
      label: 'Route',
      value: `${cityLine(t, 'from')} → ${cityLine(t, 'to')}`
    });
    rows.push({
      label: 'Departure',
      value: `${t.departTime || '—'} · ${t.operator || ''}`.trim()
    });
    if (t.arriveTime) {
      rows.push({ label: 'Arrival', value: t.arriveTime });
    }
    if (t.duration) {
      rows.push({ label: 'Duration', value: t.duration });
    }
    if (t.flightNo) {
      rows.push({ label: 'Flight / Bus', value: t.flightNo });
    }
  }

  if (input.returnTrip) {
    const t = input.returnTrip;
    rows.push({
      label: 'Return',
      value: `${cityLine(t, 'from')} → ${cityLine(t, 'to')}`
    });
    rows.push({
      label: 'Return time',
      value: `${t.departTime || '—'} → ${t.arriveTime || '—'}`
    });
  }

  rows.push({ label: 'Class / Type', value: input.className || '—' });
  rows.push({ label: 'Seat', value: input.seatLabel || '—' });

  return {
    title: input.outbound?.operator || 'E-Ticket',
    subtitle: input.outbound
      ? `${input.outbound.fromCity || ''} → ${input.outbound.toCity || ''}`.trim()
      : undefined,
    bookingRef: ref,
    pnr: input.pnr,
    rows,
    totalAmount: input.totalAmount,
    paymentStatus: input.paymentStatus,
    passengers: input.passengers
  };
}

export function revokeTicketPdfUrl(url: string | null | undefined) {
  if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
}
