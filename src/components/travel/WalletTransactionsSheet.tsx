import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { KTA } from './ethioTravelData';
import {
  buildGuestApiUrl,
  GUEST_API_NAMESPACE
} from '../../services/guestApi/config';

export type WalletTxRow = {
  slNo: number;
  id: number;
  credit: number;
  debit: number;
  transferFrom: string;
  dateCreated: string;
};

function Sheet({
  open,
  onClose,
  children,
  height = '85vh'
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string;
}) {
  return (
    <AnimatePresence>
      {open &&
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 glass-overlay z-[55]" />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 glass-sheet rounded-t-ios-xl z-[56] flex flex-col pb-safe"
          style={{ maxHeight: height }}>
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-9 h-1 rounded-full bg-gray-300/80" />
          </div>
          {children}
        </motion.div>
      </>
      }
    </AnimatePresence>
  );
}

function SheetHeader({
  title,
  onClose
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 shrink-0">
      <h2 className="text-[17px] font-bold text-text-primary">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="w-9 h-9 rounded-full glass-btn-ghost flex items-center justify-center"
        aria-label="Close">
        <X className="w-4 h-4 text-text-secondary" />
      </button>
    </div>
  );
}

function formatReportDate(d: Date): string {
  // GuestAPI TransactionReport requires dd/MM/yyyy
  // (sample: FromDate=01/08/2026, ToDate=05/08/2026).
  // MM/dd/yyyy returns an empty list.
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** First day of the month, N months before `d` (dd/MM/yyyy). */
function formatReportFromDateMonthsAgo(d: Date, monthsAgo: number): string {
  const from = new Date(d.getFullYear(), d.getMonth() - monthsAgo, 1);
  return formatReportDate(from);
}

function escapeXml(value: string): string {
  return value.
    replace(/&/g, '&amp;').
    replace(/</g, '&lt;').
    replace(/>/g, '&gt;').
    replace(/"/g, '&quot;').
    replace(/'/g, '&apos;');
}

function decodeXml(value: string): string {
  return value.
    replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').
    replace(/&quot;/g, '"').
    replace(/&lt;/g, '<').
    replace(/&gt;/g, '>').
    replace(/&apos;/g, "'").
    replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).
    replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    ).
    replace(/&amp;/g, '&').
    trim();
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseTxRows(jsonText: string): WalletTxRow[] {
  const trimmed = decodeXml(String(jsonText || '').trim());
  if (!trimmed || trimmed === '[]') return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed.trim());
    }
  } catch {
    const start = trimmed.indexOf('[');
    const end = trimmed.lastIndexOf(']');
    if (start < 0 || end <= start) return [];
    try {
      parsed = JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.
    map((row) => {
      if (!row || typeof row !== 'object') return null;
      const r = row as Record<string, unknown>;
      const credit = toNumber(r.Credit ?? r.credit);
      const debit = toNumber(r.Debit ?? r.debit);
      const id = toNumber(r.Id ?? r.ID ?? r.TransactionId);
      const slNo = toNumber(r.SlNo ?? r.slNo);
      const transferFrom = String(
        r.TransferFrom ?? r.transferFrom ?? r.Narration ?? 'Wallet'
      ).trim() || 'Wallet';
      const dateCreated = String(
        r.Datecreated ?? r.DateCreated ?? r.dateCreated ?? ''
      ).trim();
      if (!(id > 0 || credit > 0 || debit > 0 || slNo > 0)) return null;
      return { slNo, id, credit, debit, transferFrom, dateCreated };
    }).
    filter((row): row is WalletTxRow => row != null);
}

/**
 * Direct SOAP TransactionReport — bypasses shared extractors that were
 * dropping rows before the sheet could render them.
 */
async function fetchTransactionReport(input: {
  userId: number;
  userTypeId: number;
  fromDate: string;
  toDate: string;
  signal?: AbortSignal;
}): Promise<{ rows: WalletTxRow[]; raw: string; userId: number }> {
  const envelope =
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">` +
    `<soap:Body>` +
    `<TransactionReport xmlns="${GUEST_API_NAMESPACE}">` +
    `<UserId>${escapeXml(String(input.userId))}</UserId>` +
    `<UserTypeId>${escapeXml(String(input.userTypeId))}</UserTypeId>` +
    `<FromDate>${escapeXml(input.fromDate)}</FromDate>` +
    `<ToDate>${escapeXml(input.toDate)}</ToDate>` +
    `</TransactionReport>` +
    `</soap:Body>` +
    `</soap:Envelope>`;

  const response = await fetch(buildGuestApiUrl('TransactionReport'), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      Accept: 'text/xml, application/soap+xml, */*',
      SOAPAction: `"${GUEST_API_NAMESPACE}TransactionReport"`
    },
    body: envelope,
    signal: input.signal
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`TransactionReport failed (${response.status})`);
  }

  const match = raw.match(
    /<TransactionReportResult(?:\s[^>]*)?>([\s\S]*?)<\/TransactionReportResult>/i
  );
  const resultText = match?.[1] ? decodeXml(match[1]) : '';
  const rows = parseTxRows(resultText || raw);

  return { rows, raw: resultText || raw, userId: input.userId };
}

/** GuestAPI TransactionReport — live wallet statement for the signed-in member.
 * API amounts are always ETB; display converts with currencyRate (1 ETB = rate).
 */
export function WalletTransactionsSheet({
  open,
  onClose,
  userId,
  userTypeId,
  currencyCode = 'ETB',
  currencyRate = 1
}: {
  open: boolean;
  onClose: () => void;
  userId?: number | null;
  userTypeId?: number | null;
  currencyCode?: string;
  /** 1 ETB = currencyRate display units (from GetCurrencyExchangerate). */
  currencyRate?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<WalletTxRow[]>([]);
  const [loadedForUserId, setLoadedForUserId] = useState<number | null>(null);
  // Freeze the member id used for this open session so mid-flight auth
  // patches cannot replace a good report with an empty one.
  const frozenUserIdRef = useRef<number | null>(null);

  const displayCode = String(currencyCode || 'ETB')
    .trim()
    .toUpperCase() || 'ETB';
  const rateNum = Number(currencyRate);
  const convertRate =
    displayCode === 'ETB' || !Number.isFinite(rateNum) || rateNum <= 0 ?
      1 :
      rateNum;

  useEffect(() => {
    if (!open) {
      frozenUserIdRef.current = null;
      return;
    }

    const incoming = Number(userId);
    if (!Number.isFinite(incoming) || incoming <= 0) {
      setTransactions([]);
      setLoading(false);
      setLoadedForUserId(null);
      setError('Sign in with your password to view wallet transactions.');
      return;
    }

    if (frozenUserIdRef.current == null) {
      frozenUserIdRef.current = Math.trunc(incoming);
    }
    const resolvedUserId = frozenUserIdRef.current;
    const resolvedTypeId =
      Number(userTypeId) > 0 ? Math.trunc(Number(userTypeId)) : 5;

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setTransactions([]);
    setLoadedForUserId(resolvedUserId);

    // Match GuestAPI sample style: dd/MM/yyyy, FromDate on the 1st of a past
    // month, ToDate = today (inclusive of today's debit slips).
    const toDate = new Date();
    const fromDateStr = formatReportFromDateMonthsAgo(toDate, 12);
    const toDateStr = formatReportDate(toDate);

    void fetchTransactionReport({
      userId: resolvedUserId,
      userTypeId: resolvedTypeId,
      fromDate: fromDateStr,
      toDate: toDateStr,
      signal: controller.signal
    }).
      then(({ rows, raw, userId: reportUserId }) => {
        setLoading(false);
        setLoadedForUserId(reportUserId);
        setTransactions(rows);
        if (rows.length === 0 && /"SlNo"|TransferFrom|Datecreated/i.test(raw)) {
          setError('Could not parse wallet transactions from the server response.');
          return;
        }
        setError(null);
      }).
      catch((err) => {
        if (controller.signal.aborted) return;
        setLoading(false);
        setTransactions([]);
        setLoadedForUserId(resolvedUserId);
        setError(
          err instanceof Error ?
            err.message :
            'Could not load wallet transactions'
        );
      });

    return () => {
      controller.abort();
    };
    // Re-run only when the sheet opens or the first valid userId arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId && Number(userId) > 0 ? Math.trunc(Number(userId)) : 0]);

  const money = (amountEtb: number) => {
    const converted = Math.abs(amountEtb) * convertRate;
    return `${displayCode} ${converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: displayCode === 'ETB' ? 2 : 2
    })}`;
  };

  return (
    <Sheet open={open} onClose={onClose} height="75vh">
      <SheetHeader title="Wallet Transactions" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-[18px] pb-4">
        {loadedForUserId != null &&
        <p
          className="text-[11px] mb-2"
          style={{ color: KTA.textSecondary }}>
          Member #{loadedForUserId} · UserTypeId 5
          {transactions.length > 0 ?
            ` · ${transactions.length} transaction${transactions.length === 1 ? '' : 's'}` :
            ''}
          {displayCode !== 'ETB' ?
            ` · shown in ${displayCode}` :
            ' · ETB'}
        </p>}

        {loading &&
        <div
          className="py-14 text-center text-[13px]"
          style={{ color: KTA.textSecondary }}>
          Loading transactions…
        </div>}

        {!loading && error &&
        <div
          className="py-14 text-center text-[13px]"
          style={{ color: KTA.textSecondary }}>
          {error}
        </div>}

        {!loading && !error && transactions.length === 0 &&
        <div
          className="py-10 text-center text-[13px] px-2"
          style={{ color: KTA.textSecondary }}>
          <p>No transactions for Member #{loadedForUserId ?? '—'}.</p>
          <p className="mt-2 text-[12px] leading-relaxed">
            TransactionReport only returns slips for this UserId. New signups
            start empty until a BookingDebit posts to this account.
          </p>
        </div>}

        {!loading &&
          transactions.map((tx) =>
          <div
            key={`${tx.id}-${tx.slNo}-${tx.dateCreated}-${tx.debit}-${tx.credit}`}
            className="flex items-center justify-between py-3 border-b last:border-b-0"
            style={{ borderColor: KTA.border }}>
            <div className="min-w-0 pr-3">
              <p
                className="text-[14px] font-semibold truncate"
                style={{ color: KTA.textPrimary }}>
                {tx.transferFrom || 'Wallet'}
              </p>
              <p className="text-[12px]" style={{ color: KTA.textSecondary }}>
                {tx.dateCreated || '—'}
              </p>
            </div>
            <p
              className="text-[14px] font-bold shrink-0"
              style={{ color: tx.debit > 0 ? KTA.red : KTA.green }}>
              {tx.debit > 0 ? `− ${money(tx.debit)}` : `+ ${money(tx.credit)}`}
            </p>
          </div>
          )}
      </div>
    </Sheet>
  );
}
