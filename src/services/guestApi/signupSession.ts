/**
 * Temporary signup credentials so TravellerLogin can resolve the real UserID
 * after SignupTraveller. TravellerUserValidation.userId is unreliable (often 1000).
 */

const KEY = 'mkash-signup-creds';

export type SignupCreds = {
  username: string;
  password: string;
  email?: string;
};

export function saveSignupCreds(creds: SignupCreds): void {
  try {
    const username = String(creds.username || '').trim();
    const password = String(creds.password || '');
    if (!username || !password) return;
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
        username,
        password,
        email: String(creds.email || '').trim().toLowerCase() || undefined
      })
    );
  } catch {
    // ignore
  }
}

export function loadSignupCreds(): SignupCreds | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SignupCreds;
    if (!parsed?.username || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSignupCreds(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Retry TravellerLogin a few times — credentials are sometimes not ready instantly after SignupTraveller. */
export async function loginWithRetry(
  loginFn: (input: {
    username: string;
    password: string;
  }) => Promise<{ success: boolean; session?: { userId: number }; dashboard?: unknown; message: string }>,
  username: string,
  password: string,
  attempts = 3
): Promise<{
  success: boolean;
  session?: { userId: number; [key: string]: unknown };
  dashboard?: unknown;
  message: string;
}> {
  let last: {
    success: boolean;
    session?: { userId: number; [key: string]: unknown };
    dashboard?: unknown;
    message: string;
  } = { success: false, message: 'Login failed' };

  for (let i = 0; i < attempts; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, 600 * i));
    }
    last = (await loginFn({ username, password })) as typeof last;
    if (last.success && last.session?.userId && last.session.userId > 0) {
      return last;
    }
  }
  return last;
}
