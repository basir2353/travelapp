import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LoaderCircle, Plus, RefreshCw, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  BUS_SUPPORT_TICKET,
  createSupportTicket,
  getSupportTickets,
  loadCachedTickets,
  type SupportTicket
} from '../../services/guestApi';

type Props = {
  open: boolean;
  userTypeId: number;
  userId: number;
  onClose: () => void;
};

export function SupportTicketsSheet({
  open,
  userTypeId,
  userId,
  onClose
}: Props) {
  const [tickets, setTickets] = useState<SupportTicket[]>(() =>
    loadCachedTickets(userId)
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState(BUS_SUPPORT_TICKET.subject);
  const [description, setDescription] = useState(BUS_SUPPORT_TICKET.description);

  const loadTickets = useCallback(async () => {
    const cached = loadCachedTickets(userId);
    if (cached.length > 0) setTickets(cached);
    setLoading(true);
    try {
      const result = await getSupportTickets({
        userTypeId,
        userId,
        status: 1
      });
      setTickets(result.tickets);
    } catch (error) {
      if (cached.length === 0) {
        toast.error(
          error instanceof Error ? error.message : 'Could not load support tickets'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [userId, userTypeId]);

  useEffect(() => {
    if (open) void loadTickets();
  }, [loadTickets, open]);

  if (!open) return null;

  const submit = async () => {
    if (!userId || userId <= 0) {
      toast.error('Log in to create a support ticket');
      return;
    }
    if (!subject.trim() || !description.trim()) {
      toast.error('Enter a subject and description');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createSupportTicket({
        roleId: userTypeId || 5,
        agentId: userId,
        subject,
        description,
        helpTopic: BUS_SUPPORT_TICKET.helpTopic,
        status: BUS_SUPPORT_TICKET.status,
        priority: BUS_SUPPORT_TICKET.priority,
        source: BUS_SUPPORT_TICKET.source
      });
      if (!result.success) throw new Error(result.message);
      if (result.ticket) {
        setTickets((prev) => [
          result.ticket!,
          ...prev.filter((row) => row.TicketID !== result.ticket!.TicketID)
        ]);
      }
      toast.success('Bus support ticket created');
      setSubject(BUS_SUPPORT_TICKET.subject);
      setDescription(BUS_SUPPORT_TICKET.description);
      setShowForm(false);
      await loadTickets();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not create support ticket'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end bg-black/30">
      <button
        type="button"
        aria-label="Close support tickets"
        className="absolute inset-0"
        onClick={onClose}
      />
      <section className="relative z-10 flex max-h-[90dvh] w-full flex-col rounded-t-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900">Support tickets</h2>
            <p className="text-[12px] text-gray-500">Open requests for your account</p>
          </div>
          <button type="button" onClick={onClose} className="ui-icon-btn">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {showForm &&
          <div className="mb-4 space-y-3 rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Bus booking not confirmed"
              className="ui-input h-11"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the bus booking issue"
              rows={4}
              className="ui-input h-auto resize-none py-3"
            />
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className="ui-btn-primary flex h-11 w-full items-center justify-center gap-2 disabled:opacity-50">
              {submitting ?
                <LoaderCircle className="h-4 w-4 animate-spin" /> :
                <Send className="h-4 w-4" />}
              Submit ticket
            </button>
          </div>
          }

          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-gray-700">
              {tickets.length} open ticket{tickets.length === 1 ? '' : 's'}
            </p>
            <button type="button" onClick={() => void loadTickets()} className="p-2 text-teal-700">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading && tickets.length === 0 ?
            <div className="flex justify-center py-10">
              <LoaderCircle className="h-6 w-6 animate-spin text-teal-600" />
            </div> :
            tickets.length === 0 ?
              <p className="rounded-2xl bg-gray-50 p-5 text-center text-[13px] text-gray-500">
                No open support tickets.
              </p> :
              <div className="space-y-3">
                {tickets.map((ticket) =>
                <article key={ticket.TicketID} className="rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold text-gray-900">{ticket.Subject}</p>
                      <p className="mt-1 text-[12px] text-gray-500">Ticket #{ticket.TicketID}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      {ticket.Status || 'Open'}
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-gray-600">{ticket.Description}</p>
                  {ticket.Reply &&
                  <p className="mt-3 rounded-xl bg-blue-50 p-3 text-[12px] text-blue-800">
                    {ticket.Reply}
                  </p>}
                </article>
                )}
              </div>
          }
        </div>

        <div className="border-t border-gray-100 px-5 pb-safe pt-3">
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="ui-btn-primary mb-2 flex h-12 w-full items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            {showForm ? 'Hide form' : 'Create bus support ticket'}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}
