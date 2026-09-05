import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Send, X } from 'lucide-react';

const GREEN = '#0D7B3E';
const BORDER = '#E5E7EB';
const TEXT = '#1A1D26';
const MUTED = '#6B7280';

type ChatRole = 'assistant' | 'user';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  time: string;
};

const QUICK_CHIPS = [
  'Cancel a booking',
  'Baggage allowance',
  'Refund status'
] as const;

function formatChatTime(date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildAssistantReply(input: string): string {
  const text = input.toLowerCase();

  if (text.includes('cancel')) {
    return "To cancel a booking, open the Trips tab, select your upcoming trip and tap 'Cancel booking'. Any applicable fees depend on your fare rules. Want me to open your trips?";
  }
  if (text.includes('baggage') || text.includes('luggage')) {
    return 'Baggage allowance depends on your airline and fare class. Check your booking details in My Trips for included bags, or tell me your airline and route for a quick summary.';
  }
  if (text.includes('refund')) {
    return 'Refunds are usually processed within 5–10 business days after cancellation approval. You can track status under My Trips → Past → booking details → Payments.';
  }
  if (text.includes('change') || text.includes('date') || text.includes('reschedule')) {
    return 'To change your flight date, open My Trips, select the booking, and choose Change flight. Date change fees may apply based on your ticket rules.';
  }
  if (text.includes('hotel')) {
    return 'For hotel changes, open the booking in My Trips and use Modify stay, or contact us with your booking reference and new dates.';
  }
  if (text.includes('car') || text.includes('rental')) {
    return 'Car rental changes can be made from My Trips → your rental → Modify booking. Pick-up and return times may affect the price.';
  }
  if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
    return "Hello! I'm here to help with bookings, cancellations, baggage, and refunds. What would you like to know?";
  }

  return "Thanks for your message. A support specialist will follow up shortly. For urgent help, use Call Support on the Help page — we're available 24/7.";
}

const GREETING: ChatMessage = {
  id: 'greeting',
  role: 'assistant',
  text: "Hi! I'm Selam, your Mkash Travel assistant. How can I help you today?",
  time: formatChatTime()
};

export function LiveChatSheet({
  open,
  onClose,
  onOpenTrips
}: {
  open: boolean;
  onClose: () => void;
  onOpenTrips?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setMessages([{ ...GREETING, time: formatChatTime() }]);
    setDraft('');
    setTyping(false);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const canSend = draft.trim().length > 0 && !typing;

  const sendUserMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      text: trimmed,
      time: formatChatTime()
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setTyping(true);

    window.setTimeout(() => {
      const reply = buildAssistantReply(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'assistant',
          text: reply,
          time: formatChatTime()
        }
      ]);
      setTyping(false);

      if (trimmed.toLowerCase().includes('cancel') && onOpenTrips) {
        // Offer trips navigation after cancel guidance.
      }
    }, 900);
  };

  const showTripsPrompt = useMemo(
    () => messages.some((m) => m.role === 'user' && m.text.toLowerCase().includes('cancel')),
    [messages]
  );

  return createPortal(
    <AnimatePresence>
      {open &&
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}>
          <button type="button" className="h-[60px] shrink-0" aria-label="Close chat" onClick={onClose} />
          <motion.div
          className="relative w-full flex-1 min-h-0 flex flex-col rounded-t-[24px] bg-[#F7F8FA] shadow-2xl overflow-hidden"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}>

            <div className="shrink-0 bg-white px-5 pt-4 pb-4 border-b" style={{ borderColor: BORDER }}>
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${GREEN}18` }}>
                    <Bot className="w-6 h-6" style={{ color: GREEN }} strokeWidth={2} />
                  </div>
                  <span
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                  style={{ backgroundColor: '#22C55E' }}
                />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-bold leading-tight truncate" style={{ color: TEXT }}>
                    Selam – Travel Support
                  </p>
                  <p className="text-[12px] font-medium mt-0.5" style={{ color: GREEN }}>
                    Online · replies in a few minutes
                  </p>
                </div>
                <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
              {messages.map((message) =>
            <div
              key={message.id}
              className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                message.role === 'user' ?
                'rounded-br-md text-white' :
                'rounded-bl-md bg-white border text-left'}`
                }
                style={
                message.role === 'user' ?
                { backgroundColor: GREEN } :
                { borderColor: BORDER, color: TEXT }
                }>
                    {message.text}
                  </div>
                  <span className="text-[11px] mt-1 px-1" style={{ color: MUTED }}>
                    {message.time}
                  </span>
                </div>
            )}

              {typing &&
            <div className="flex items-start">
                  <div
                className="rounded-2xl rounded-bl-md bg-white border px-4 py-3"
                style={{ borderColor: BORDER }}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
            }

              {showTripsPrompt && onOpenTrips &&
            <button
              type="button"
              onClick={() => {
                onOpenTrips();
                onClose();
              }}
              className="w-full h-11 rounded-xl text-[14px] font-semibold border"
              style={{ borderColor: GREEN, color: GREEN, backgroundColor: `${GREEN}10` }}>
                  Open My Trips
                </button>
            }
            </div>

            <div className="shrink-0 border-t bg-white px-4 pt-3 pb-4" style={{ borderColor: BORDER }}>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
                {QUICK_CHIPS.map((chip) =>
              <button
                key={chip}
                type="button"
                onClick={() => sendUserMessage(chip)}
                disabled={typing}
                className="shrink-0 h-9 px-3.5 rounded-full border text-[13px] font-semibold disabled:opacity-50"
                style={{ borderColor: GREEN, color: GREEN, backgroundColor: 'white' }}>
                    {chip}
                  </button>
              )}
              </div>

              <form
              className="flex items-center gap-2 pb-3"
              onSubmit={(event) => {
                event.preventDefault();
                sendUserMessage(draft);
              }}>
                <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type your message…"
                className="flex-1 h-12 rounded-full border bg-[#F9FAFB] px-4 text-[14px] outline-none focus:ring-2 focus:ring-[#0D7B3E33]"
                style={{ borderColor: BORDER, color: TEXT }}
              />
                <button
                type="submit"
                disabled={!canSend}
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
                style={{ backgroundColor: canSend ? GREEN : '#E5E7EB' }}>
                  <Send className="w-5 h-5 text-white" />
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>,
    document.body
  );
}
