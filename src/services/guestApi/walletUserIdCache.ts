/**
 * Remember TravellerLogin UserID per email/username so OTP login can still
 * call TravellerDashboard / TransactionReport with the correct dynamic id.
 * Never use TravellerUserValidation.userId (often wrongly "1000").
 */

const KEY = 'mkash-wallet-user-ids';

type WalletIdMap = Record<string, number>;

function readMap(): WalletIdMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as WalletIdMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: WalletIdMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function normKey(value?: string | null): string {
  return String(value || '').trim().toLowerCase();
}

export function rememberWalletUserId(input: {
  userId: number;
  email?: string | null;
  username?: string | null;
  phone?: string | null;
}): void {
  if (!input.userId || input.userId <= 0) return;
  const map = readMap();
  const email = normKey(input.email);
  const username = normKey(input.username);
  const phone = String(input.phone || '').replace(/\D/g, '');
  if (email) map[`email:${email}`] = input.userId;
  if (username) map[`user:${username}`] = input.userId;
  if (phone.length >= 9) map[`phone:${phone}`] = input.userId;
  writeMap(map);
}

export function recallWalletUserId(input: {
  email?: string | null;
  username?: string | null;
  phone?: string | null;
}): number | null {
  const map = readMap();
  const email = normKey(input.email);
  const username = normKey(input.username);
  const phone = String(input.phone || '').replace(/\D/g, '');
  const id =
    (email && map[`email:${email}`]) ||
    (username && map[`user:${username}`]) ||
    (phone.length >= 9 && map[`phone:${phone}`]) ||
    0;
  return id && id > 0 ? id : null;
}
