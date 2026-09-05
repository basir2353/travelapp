import { jsPDF } from 'jspdf';
import type {
  BookingDetailResult,
  BookingDetailSegment
} from '../services/guestApi/bookingCards';

/** Trigger a file download into the device Downloads folder (browser / WebView). */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
}

export function downloadObjectUrl(url: string, fileName: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Download PDF with Web Share fallback (needed on Android WebView). */
export async function downloadPdfFile(
  blob: Blob,
  fileName: string,
  fallbackUrl?: string | null
) {
  try {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] }) &&
      typeof navigator.share === 'function'
    ) {
      await navigator.share({ files: [file], title: fileName });
      return;
    }
  } catch {
    /* user cancelled share or unsupported — fall through */
  }
  downloadBlob(blob, fileName);
  if (fallbackUrl) {
    try {
      downloadObjectUrl(fallbackUrl, fileName);
    } catch {
      /* ignore */
    }
  }
}

function money(currency: string, amount: number | string | null | undefined): string {
  if (amount == null || amount === '') return '—';
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (Number.isFinite(n)) {
    return `${currency} ${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  const raw = String(amount).trim();
  return /[A-Za-z]/.test(raw) ? raw : `${currency} ${raw}`;
}

function ensureSpace(doc: jsPDF, y: number, need = 24): number {
  if (y + need < 280) return y;
  doc.addPage();
  return 20;
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  y = ensureSpace(doc, y, 14);
  doc.setTextColor(26, 29, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title, 14, y);
  doc.setDrawColor(13, 123, 62);
  doc.setLineWidth(0.6);
  doc.line(14, y + 2, 50, y + 2);
  return y + 8;
}

function kvRow(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  opts?: { boldValue?: boolean }
): number {
  if (!value || value === '—') return y;
  y = ensureSpace(doc, y, 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(label, 14, y);
  doc.setTextColor(26, 29, 38);
  doc.setFont('helvetica', opts?.boldValue ? 'bold' : 'normal');
  doc.text(String(value), 196, y, { align: 'right', maxWidth: 110 });
  return y + 6;
}

function routeSummary(segments: BookingDetailSegment[]): string {
  const codes: string[] = [];
  for (const seg of segments) {
    if (seg.depAirport && codes[codes.length - 1] !== seg.depAirport) {
      codes.push(seg.depAirport);
    }
    if (seg.arrAirport && codes[codes.length - 1] !== seg.arrAirport) {
      codes.push(seg.arrAirport);
    }
  }
  return codes.join(' → ');
}

function drawSegmentCard(
  doc: jsPDF,
  seg: BookingDetailSegment,
  yStart: number
): number {
  let y = ensureSpace(doc, yStart, 36);
  doc.setFillColor(247, 248, 250);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(14, y, 182, 30, 2.5, 2.5, 'FD');

  const flight =
    [seg.airline, seg.flightNumber].filter(Boolean).join(' ') || 'Flight';
  const leg = seg.flightLeg || '';

  doc.setTextColor(13, 123, 62);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  if (leg) {
    doc.setFillColor(13, 123, 62);
    doc.roundedRect(18, y + 3, Math.min(28, leg.length * 2.4 + 8), 5.5, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(leg.toUpperCase(), 20, y + 7);
  }

  doc.setTextColor(26, 29, 38);
  doc.setFontSize(10);
  doc.text(flight, leg ? 50 : 18, y + 7);
  if (seg.className) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text(seg.className, 190, y + 7, { align: 'right' });
  }

  doc.setTextColor(26, 29, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(seg.depAirport || '—', 20, y + 18);
  doc.text(seg.arrAirport || '—', 150, y + 18);

  doc.setDrawColor(209, 213, 219);
  doc.setLineDashPattern([1.2, 1.2], 0);
  doc.line(55, y + 16, 135, y + 16);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(seg.duration || '', 95, y + 15, { align: 'center' });
  doc.text(
    [seg.depDate, seg.depTime].filter(Boolean).join(' '),
    20,
    y + 25
  );
  doc.text(
    [seg.arrDate, seg.arrTime].filter(Boolean).join(' '),
    150,
    y + 25
  );

  return y + 36;
}

/** Booking receipt PDF for My Bookings → Download receipt. */
export function buildBookingReceiptPdf(
  detail: BookingDetailResult,
  fallbackRef?: string
): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const summary = detail.summary;
  const fare = detail.fare;
  const currency = fare?.currency || 'ETB';
  const ref = (
    summary?.bookingNumber ||
    summary?.bookingId ||
    fallbackRef ||
    'PENDING'
  ).replace(/^#/, '');
  const status = summary?.bookingStatus || summary?.confirmStatus || '';

  // Header
  doc.setFillColor(13, 123, 62);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Mkash Travel', 14, 14);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Official booking receipt', 14, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`#${ref}`, 196, 14, { align: 'right' });
  if (status) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(status, 196, 23, { align: 'right' });
  }

  let y = 42;
  doc.setTextColor(26, 29, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`${summary?.bookingType || 'Travel'} booking`, 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  const subtitle = [
    summary?.tripType,
    detail.travelStart && detail.travelEnd ?
      detail.travelStart === detail.travelEnd ?
        detail.travelStart :
        `${detail.travelStart} – ${detail.travelEnd}` :
      detail.travelStart
  ].
  filter(Boolean).
  join(' · ');
  if (subtitle) doc.text(subtitle, 14, y);
  y += 10;

  y = sectionTitle(doc, 'Overview', y);
  y = kvRow(doc, 'Booking number', summary?.bookingNumber || ref, y);
  y = kvRow(doc, 'Ticket no.', summary?.ticketNo || 'None', y);
  y = kvRow(doc, 'PNR', summary?.pnr || '', y);
  y = kvRow(doc, 'Booked on', summary?.bookedOn || '', y);
  y = kvRow(doc, 'Due date', summary?.dueDate || '', y);
  y = kvRow(
    doc,
    'Payment',
    summary?.paidStatus || summary?.payStatus || '',
    y
  );
  y = kvRow(doc, 'Status', summary?.bookingStatus || '', y);
  if (detail.policy?.isRefundable) {
    y = kvRow(doc, 'Refundable', detail.policy.isRefundable, y);
  }
  y = kvRow(
    doc,
    'Total amount',
    summary?.totalAmount || money(currency, fare?.grandTotal),
    y,
    { boldValue: true }
  );
  y += 4;

  if (detail.segments.length > 0) {
    y = sectionTitle(doc, 'Flight itinerary', y);
    const route = routeSummary(detail.segments);
    if (route) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(26, 29, 38);
      doc.text(route, 14, y);
      y += 8;
    }
    for (const seg of detail.segments) {
      y = drawSegmentCard(doc, seg, y);
    }
    y += 2;
  }

  if (detail.hotel) {
    y = sectionTitle(doc, detail.hotel.hotelName || 'Hotel', y);
    y = kvRow(doc, 'Address', detail.hotel.address || '', y);
    y = kvRow(doc, 'Check-in', detail.hotel.checkIn || '', y);
    y = kvRow(doc, 'Check-out', detail.hotel.checkOut || '', y);
    y = kvRow(doc, 'Room', detail.hotel.roomType || '', y);
    y += 2;
  }

  if (detail.passengers.length > 0) {
    y = sectionTitle(doc, 'Travellers', y);
    for (const p of detail.passengers) {
      y = ensureSpace(doc, y, 16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(26, 29, 38);
      doc.text(p.name || 'Traveller', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(
        [p.type, p.phone, p.email].filter(Boolean).join(' · '),
        14,
        y + 5,
        { maxWidth: 182 }
      );
      y += 8;
      if (p.identityNo) y = kvRow(doc, 'ID', p.identityNo, y);
      if (p.dob) y = kvRow(doc, 'Date of birth', p.dob, y);
      y += 2;
    }
  }

  if (fare) {
    y = sectionTitle(doc, 'Fare breakdown', y);
    y = kvRow(doc, 'Base fare', money(currency, fare.baseFare), y);
    if (fare.taxAmount > 0) {
      y = kvRow(doc, 'Tax', money(currency, fare.taxAmount), y);
    }
    if ((fare.gstAmount ?? 0) > 0) {
      y = kvRow(doc, 'GST', money(currency, fare.gstAmount), y);
    }
    if (fare.serviceTaxAmount > 0) {
      y = kvRow(doc, 'Service tax', money(currency, fare.serviceTaxAmount), y);
    }
    if (Number(fare.discountAmount) > 0) {
      y = kvRow(doc, 'Discount', money(currency, fare.discountAmount), y);
    }
    y = ensureSpace(doc, y, 10);
    doc.setDrawColor(229, 231, 235);
    doc.line(14, y, 196, y);
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(26, 29, 38);
    doc.text('Grand total', 14, y);
    doc.setTextColor(13, 123, 62);
    doc.text(money(currency, fare.grandTotal), 196, y, { align: 'right' });
    y += 10;
  }

  if (detail.payments.length > 0) {
    y = sectionTitle(doc, 'Payment', y);
    for (const p of detail.payments) {
      y = kvRow(doc, p.mode || 'Payment', money(p.currency, p.amount), y, {
        boldValue: true
      });
      const meta = [p.receiptNo, p.status].filter(Boolean).join(' · ');
      if (meta) {
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(meta, 14, y);
        y += 5;
      }
    }
    if (detail.balance && detail.balance.balanceAmount > 0) {
      y = kvRow(
        doc,
        'Balance due',
        money(detail.balance.currency, detail.balance.balanceAmount),
        y,
        { boldValue: true }
      );
    }
    y += 2;
  }

  if (detail.corporate) {
    y = sectionTitle(doc, 'Issued by', y);
    y = kvRow(doc, 'Agency', detail.corporate.name || '', y);
    y = kvRow(doc, 'Phone', detail.corporate.phone || '', y);
    y = kvRow(doc, 'Email', detail.corporate.email || '', y);
    y = kvRow(doc, 'Address', detail.corporate.address || '', y);
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      'Mkash Travel · Official booking receipt · Present with a valid ID at check-in',
      105,
      287,
      { align: 'center' }
    );
    doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
  }

  return doc.output('blob');
}

export function downloadBookingReceipt(
  detail: BookingDetailResult,
  fallbackRef?: string
) {
  const ref = (
    detail.summary?.bookingNumber ||
    detail.summary?.bookingId ||
    fallbackRef ||
    'receipt'
  ).replace(/^#/, '');
  const blob = buildBookingReceiptPdf(detail, fallbackRef);
  downloadBlob(blob, `mkash-receipt-${ref}.pdf`);
}
