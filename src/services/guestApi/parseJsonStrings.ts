function decodeXmlEntities(value: string): string {
  return value.
  replace(/&quot;/g, '"').
  replace(/&apos;/g, "'").
  replace(/&lt;/g, '<').
  replace(/&gt;/g, '>').
  replace(/&amp;/g, '&');
}

function tryParseJson(value: string): unknown {
  const trimmed = decodeXmlEntities(value.trim());
  if (!trimmed) return null;
  try {
    let parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed === 'string') {
      const inner = parsed.trim();
      if (inner.startsWith('[') || inner.startsWith('{')) {
        parsed = JSON.parse(inner);
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

function collectRecords<T extends Record<string, unknown>>(
  parsed: unknown,
  items: T[],
  seen: Set<string>
) {
  const list = Array.isArray(parsed) ?
  parsed :
  parsed && typeof parsed === 'object' ?
  [parsed] :
  [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const key = JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item as T);
  }
}

/**
 * Parse JSON objects from SOAP `<string>` values, `{Op}Result` XML, or a raw
 * envelope. GetBusBoarding / GetBusDropping return JSON in the Result element
 * (not `<string>` wrappers), so a direct JSON.parse of the SOAP body fails.
 */
export function parseGuestJsonRecords<T extends Record<string, unknown>>(
  strings: string[],
  rawXml?: string
): T[] {
  const blobs = rawXml ? [...strings, rawXml] : strings;
  const items: T[] = [];
  const seen = new Set<string>();

  for (const blob of blobs) {
    if (!blob) continue;

    const direct = tryParseJson(blob);
    if (direct !== null) {
      collectRecords(direct, items, seen);
      if (items.length > 0) return items;
    }

    const resultMatch = blob.match(
      /<(?:[\w.]+:)?\w*Result[^>]*>([\s\S]*?)<\/(?:[\w.]+:)?\w*Result>/i
    );
    if (resultMatch?.[1]) {
      const inner = decodeXmlEntities(resultMatch[1].trim());
      const stringInner = inner.match(
        /<(?:[\w.]+:)?string[^>]*>([\s\S]*?)<\/(?:[\w.]+:)?string>/i
      );
      const jsonText = stringInner ?
      decodeXmlEntities(stringInner[1].trim()) :
      inner.replace(/<\/?string>/gi, '').trim();
      const parsed = tryParseJson(jsonText);
      if (parsed !== null) collectRecords(parsed, items, seen);
      if (items.length > 0) return items;
    }

    const arrayMatch = blob.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      const parsed = tryParseJson(arrayMatch[0]);
      if (parsed !== null) collectRecords(parsed, items, seen);
      if (items.length > 0) return items;
    }
  }

  return items;
}

/** Parse JSON array/object payloads returned inside SOAP `<string>` elements. */
export function parseJsonStringEntries<T extends Record<string, unknown>>(
  strings: string[]
): T[] {
  const items: T[] = [];

  for (const entry of strings) {
    if (!entry || entry === '[]') continue;
    try {
      const parsed = JSON.parse(entry) as T | T[];
      if (Array.isArray(parsed)) {
        items.push(...parsed.filter((item) => item && typeof item === 'object'));
      } else if (parsed && typeof parsed === 'object') {
        items.push(parsed);
      }
    } catch {
      // skip malformed entries
    }
  }

  return items;
}

/** GuestAPI sometimes returns a plain error instead of JSON, e.g. invalid JsonSelectBus. */
export function firstPlainApiMessage(strings: string[]): string | undefined {
  for (const entry of strings) {
    const trimmed = entry.trim();
    if (!trimmed || trimmed === '[]') continue;
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) continue;
    try {
      JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return undefined;
}

/** Ensure JsonSelectBus is a JSON array string — Bus2 rejects empty / non-array values. */
export function normalizeJsonSelectBus(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'string') {
    throw new Error('You passed InValid JSON string JsonSelectBus');
  }
  const parsed = JSON.parse(trimmed) as unknown;
  const list = Array.isArray(parsed) ? parsed : [parsed];
  if (list.length === 0 || typeof list[0] !== 'object' || list[0] == null) {
    throw new Error('You passed InValid JSON string JsonSelectBus');
  }
  return JSON.stringify(list);
}
