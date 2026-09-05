import { callGuestApi, callGuestApiWithBody, GuestApiError } from './soapClient';
import { parseGuestJsonRecords } from './parseJsonStrings';

export type SupportTicketInput = {
  ticketId?: number;
  roleId: number;
  agentId: number;
  subject: string;
  status?: number;
  priority?: number;
  source?: number;
  helpTopic?: number;
  description: string;
};

export type SupportTicket = {
  SlNo?: number;
  TicketID: number;
  RoleID?: number;
  AgentID?: number;
  Subject: string;
  Description: string;
  DateCreated?: string;
  Reply?: string;
  Assign?: string;
  RecentlyUpdated?: string | null;
  UserType?: string;
  Agent?: string;
  StaffName?: string;
  Status?: string;
  Priority?: string;
  Source?: string;
  HelpTopic?: string;
};

export type SupportTicketListResult = {
  tickets: SupportTicket[];
  totalRecords: number;
  totalPages: number;
  fromCache?: boolean;
};

/** Defaults for a bus booking support ticket (HelpTopic 2 = booking). */
export const BUS_SUPPORT_TICKET = {
  subject: 'Bus booking not confirmed',
  description:
    'I booked a bus (Addis Ababa to destination) but the ticket is missing or not confirmed. Please check my bus booking.',
  helpTopic: 2,
  status: 1,
  priority: 1,
  source: 2
} as const;

function cacheKey(userId: number): string {
  return `mkash-support-tickets:${userId}`;
}

function readTicketCache(userId: number): SupportTicket[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = window.sessionStorage.getItem(cacheKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SupportTicket[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTicketCache(userId: number, tickets: SupportTicket[]) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    window.sessionStorage.setItem(cacheKey(userId), JSON.stringify(tickets));
  } catch {
    // ignore quota / private mode
  }
}

export function rememberCreatedTicket(
  userId: number,
  ticket: SupportTicket
): SupportTicket[] {
  const existing = readTicketCache(userId);
  const next = [
    ticket,
    ...existing.filter((row) => row.TicketID !== ticket.TicketID)
  ];
  writeTicketCache(userId, next);
  return next;
}

export function loadCachedTickets(userId: number): SupportTicket[] {
  return readTicketCache(userId);
}

function pickRowString(
  row: Record<string, unknown>,
  names: string[]
): string {
  const lookup = new Map(
    Object.keys(row).map((key) => [key.toLowerCase(), key])
  );
  for (const name of names) {
    const key = lookup.get(name.toLowerCase());
    if (!key) continue;
    const value = row[key];
    if (value == null) continue;
    const text = String(value).trim();
    if (text && text !== 'null') return text;
  }
  return '';
}

function mapTicketRow(row: Record<string, unknown>): SupportTicket | null {
  const id = Number(
    pickRowString(row, ['TicketID', 'TicketId', 'Id']) || row.TicketID
  );
  const subject = pickRowString(row, ['Subject', 'Title']);
  if (!Number.isFinite(id) || id <= 0) return null;
  return {
    SlNo: Number(pickRowString(row, ['SlNo']) || 0) || undefined,
    TicketID: id,
    RoleID: Number(pickRowString(row, ['RoleID', 'RoleId']) || 0) || undefined,
    AgentID: Number(pickRowString(row, ['AgentID', 'AgentId']) || 0) || undefined,
    Subject: subject || `Ticket #${id}`,
    Description: pickRowString(row, ['Description', 'Details']),
    DateCreated: pickRowString(row, ['DateCreated', 'CreatedDate']) || undefined,
    Reply: pickRowString(row, ['Reply']) || undefined,
    Assign: pickRowString(row, ['Assign']) || undefined,
    RecentlyUpdated: pickRowString(row, ['RecentlyUpdated']) || null,
    UserType: pickRowString(row, ['UserType']) || undefined,
    Agent: pickRowString(row, ['Agent']) || undefined,
    StaffName: pickRowString(row, ['StaffName']) || undefined,
    Status: pickRowString(row, ['Status']) || 'Open',
    Priority: pickRowString(row, ['Priority']) || undefined,
    Source: pickRowString(row, ['Source']) || undefined,
    HelpTopic: pickRowString(row, ['HelpTopic']) || undefined
  };
}

function parseTicketList(
  strings: string[],
  rawXml?: string
): SupportTicketListResult {
  const records = parseGuestJsonRecords(strings, rawXml);
  const wrapped = records.find((row) => Array.isArray(row.Table));
  const rawRows = Array.isArray(wrapped?.Table) ?
    (wrapped.Table as Record<string, unknown>[]) :
    records.filter(
      (row) => row.TicketID != null || row.Subject != null || row.Id != null
    );
  const tickets = rawRows.
  map((row) => mapTicketRow(row)).
  filter((row): row is SupportTicket => row != null);
  const meta = Array.isArray(wrapped?.Table1) ?
    (wrapped.Table1[0] as Record<string, unknown> | undefined) :
    undefined;
  return {
    tickets,
    totalRecords: Number(meta?.TotalRecords) || tickets.length,
    totalPages: Number(meta?.TotalPage) || (tickets.length > 0 ? 1 : 0)
  };
}

function mergeTickets(
  primary: SupportTicket[],
  extra: SupportTicket[]
): SupportTicket[] {
  const seen = new Set<number>();
  const out: SupportTicket[] = [];
  for (const ticket of [...primary, ...extra]) {
    if (!ticket?.TicketID || seen.has(ticket.TicketID)) continue;
    seen.add(ticket.TicketID);
    out.push(ticket);
  }
  return out;
}

/**
 * SupportTicket — create (TicketID 0) or update.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=SupportTicket
 */
export async function createSupportTicket(
  input: SupportTicketInput
): Promise<{ success: boolean; message: string; ticket?: SupportTicket }> {
  const strings = await callGuestApi('SupportTicket', [
    { name: 'TicketID', value: String(input.ticketId ?? 0) },
    { name: 'RoleID', value: String(input.roleId) },
    { name: 'AgentId', value: String(input.agentId) },
    { name: 'Subject', value: input.subject.trim() },
    { name: 'Status', value: String(input.status ?? BUS_SUPPORT_TICKET.status) },
    { name: 'Priority', value: String(input.priority ?? BUS_SUPPORT_TICKET.priority) },
    { name: 'Source', value: String(input.source ?? BUS_SUPPORT_TICKET.source) },
    { name: 'HelpTopic', value: String(input.helpTopic ?? BUS_SUPPORT_TICKET.helpTopic) },
    { name: 'Description', value: input.description.trim() }
  ]);

  const message = strings.join('\n').trim() || 'Success';
  const success =
    /^success$/i.test(message) || !/error|fail|invalid/i.test(message);
  const idMatch = message.match(/(\d{2,})/);
  const ticket: SupportTicket = {
    TicketID:
      input.ticketId && input.ticketId > 0 ?
        input.ticketId :
        Number(idMatch?.[1]) || Date.now(),
    RoleID: input.roleId,
    AgentID: input.agentId,
    Subject: input.subject.trim(),
    Description: input.description.trim(),
    Status: 'Open',
    Priority: String(input.priority ?? 1),
    HelpTopic: 'Bus booking',
    DateCreated: new Date().toISOString()
  };
  if (success && input.agentId > 0) {
    rememberCreatedTicket(input.agentId, ticket);
  }
  return { success, message, ticket: success ? ticket : undefined };
}

/**
 * SupportTicketGet — list tickets for a traveller.
 * Server currently 500s on this op (SQL connection leak). We retry Status
 * 1 / 0 / 2 and fall back to tickets created in this session.
 * @see https://apitravel.afonestop.com/GuestAPI.asmx?op=SupportTicketGet
 */
export async function getSupportTickets(params: {
  userTypeId: number;
  userId: number;
  status?: number;
}): Promise<SupportTicketListResult> {
  const cached = loadCachedTickets(params.userId);
  const statuses = Array.from(
    new Set(
      [params.status ?? 1, 1, 0, 2].filter((value) => Number.isFinite(value))
    )
  );

  for (const status of statuses) {
    try {
      const { strings, body } = await callGuestApiWithBody('SupportTicketGet', [
        { name: 'UserTypeId', value: String(params.userTypeId) },
        { name: 'UserId', value: String(params.userId) },
        { name: 'Status', value: String(status) }
      ]);
      const parsed = parseTicketList(strings, body);
      const tickets = mergeTickets(parsed.tickets, cached);
      if (tickets.length > 0) writeTicketCache(params.userId, tickets);
      return {
        tickets,
        totalRecords: tickets.length,
        totalPages: tickets.length > 0 ? 1 : 0,
        fromCache: parsed.tickets.length === 0 && cached.length > 0
      };
    } catch (error) {
      const body = error instanceof GuestApiError ? error.body : '';
      if (body) {
        const parsed = parseTicketList([], body);
        if (parsed.tickets.length > 0) {
          const tickets = mergeTickets(parsed.tickets, cached);
          writeTicketCache(params.userId, tickets);
          return {
            tickets,
            totalRecords: tickets.length,
            totalPages: 1
          };
        }
      }
    }
  }

  return {
    tickets: cached,
    totalRecords: cached.length,
    totalPages: cached.length > 0 ? 1 : 0,
    fromCache: cached.length > 0
  };
}
