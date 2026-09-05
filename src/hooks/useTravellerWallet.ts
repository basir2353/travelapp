import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../components/AuthContext';
import {
  travellerDashboard,
  loginWithUsernamePassword,
  loadSignupCreds,
  clearSignupCreds,
  loginWithRetry,
  recallWalletUserId,
  rememberWalletUserId
} from '../services/guestApi';
import {
  formatWalletCreditLabel,
  parseWalletCredit,
  type ParsedWalletCredit
} from '../utils/walletCredit';

/**
 * Live mKash wallet from TravellerDashboard(UserTypeId, UserId).
 * Always resolves a real UserID (TravellerLogin or remembered map) before calling.
 */
export function useTravellerWallet(options?: {
  refreshOnMount?: boolean;
  /** Poll TravellerDashboard on this interval (ms). Omit/0 = no poll. */
  pollMs?: number;
  /** Selected UI currency (e.g. ETB, AUD) — used for wallet label. */
  currencyCode?: string | null;
  /** 1 ETB = rate display units when converting wallet amount. */
  currencyRate?: number | null;
}) {
  const { user, traveller, setTravellerDashboard, loginTraveller } = useAuth();
  const refreshOnMount = options?.refreshOnMount !== false;
  const pollMs = options?.pollMs && options.pollMs > 0 ? options.pollMs : 0;
  const displayCurrency = options?.currencyCode || 'ETB';
  const displayRate = options?.currencyRate ?? 1;
  const refreshingRef = useRef(false);
  const hydratingRef = useRef(false);

  const sessionUserId = user?.userId ?? traveller.session?.userId ?? null;
  const userTypeId = user?.userTypeId ?? traveller.session?.userTypeId ?? 5;
  const rememberedId = recallWalletUserId({
    email: user?.email || traveller.session?.email || traveller.profile?.email,
    username:
      user?.username || traveller.session?.username || traveller.profile?.username,
    phone: user?.phone || traveller.session?.mobile || traveller.profile?.mobile
  });
  const walletUserId =
    sessionUserId && sessionUserId > 0 ?
      sessionUserId :
      rememberedId && rememberedId > 0 ?
        rememberedId :
        null;

  const rawCredit = traveller.dashboard?.availableCredit || 'ETB 0.00';
  const parsed: ParsedWalletCredit = parseWalletCredit(rawCredit);
  const label = formatWalletCreditLabel(rawCredit, {
    currencyCode: displayCurrency,
    rate: displayRate
  });
  const compactLabel = formatWalletCreditLabel(rawCredit, {
    currencyCode: displayCurrency,
    rate: displayRate,
    compact: true
  });

  const creditRef = useRef(traveller.dashboard?.availableCredit);
  creditRef.current = traveller.dashboard?.availableCredit;

  const refreshDashboard = useCallback(async (): Promise<ParsedWalletCredit | null> => {
    if (!walletUserId) return null;
    if (refreshingRef.current) {
      return parseWalletCredit(creditRef.current);
    }
    refreshingRef.current = true;
    try {
      const dash = await travellerDashboard(userTypeId || 5, walletUserId);
      if (dash.success && dash.dashboard) {
        setTravellerDashboard(dash.dashboard);
        rememberWalletUserId({
          userId: walletUserId,
          email: user?.email || traveller.session?.email,
          username: user?.username || traveller.session?.username,
          phone: user?.phone || traveller.session?.mobile
        });
        return parseWalletCredit(dash.dashboard.availableCredit);
      }
      return parseWalletCredit(creditRef.current);
    } finally {
      refreshingRef.current = false;
    }
  }, [
    walletUserId,
    userTypeId,
    setTravellerDashboard,
    user?.email,
    user?.username,
    user?.phone,
    traveller.session?.email,
    traveller.session?.username,
    traveller.session?.mobile
  ]);

  // Patch session when we only have a remembered UserID (e.g. OTP login left userId 0).
  const patchedRef = useRef(false);
  useEffect(() => {
    if (patchedRef.current) return;
    if (!rememberedId || (sessionUserId && sessionUserId > 0)) return;
    if (!user) return;
    patchedRef.current = true;
    loginTraveller(
      {
        ...user,
        userId: rememberedId,
        travellerId: rememberedId,
        walletNumber: `TC-${rememberedId}`,
        userTypeId: userTypeId || 5
      },
      {
        profile: traveller.profile || null,
        session: {
          userType: 'TRA',
          userTypeId: userTypeId || 5,
          userId: rememberedId,
          username: user.username || traveller.session?.username || '',
          name: user.name || traveller.session?.name || 'Traveller',
          email: user.email || traveller.session?.email,
          mobile: user.phone || traveller.session?.mobile,
          loginStatus: 'Allowed',
          isActive: true,
          raw: traveller.session?.raw || {}
        },
        dashboard: traveller.dashboard || null
      }
    );
  }, [
    rememberedId,
    sessionUserId,
    user,
    userTypeId,
    loginTraveller,
    traveller.profile,
    traveller.session,
    traveller.dashboard
  ]);

  // Hydrate via TravellerLogin when signup creds still exist (once per mount).
  useEffect(() => {
    if (walletUserId || hydratingRef.current) return;
    const creds = loadSignupCreds();
    const username = (user?.username || creds?.username || '').trim();
    const password = creds?.password || '';
    if (!username || !password) return;

    hydratingRef.current = true;
    void loginWithRetry(loginWithUsernamePassword, username, password, 3).
      then((result) => {
        if (!result.success || !result.session?.userId) {
          // Keep hydratingRef true so we do not spam TravellerLogin on every render.
          return;
        }
        const session = result.session as {
          userId: number;
          userTypeId?: number;
          userType?: string;
          username?: string;
          name?: string;
          email?: string;
          mobile?: string;
        };
        clearSignupCreds();
        rememberWalletUserId({
          userId: session.userId,
          email: session.email || user?.email,
          username: session.username || username,
          phone: session.mobile || user?.phone
        });
        loginTraveller(
          {
            name: user?.name || session.name || session.username || 'Traveller',
            phone: user?.phone || session.mobile || '',
            walletNumber: `TC-${session.userId}`,
            email: user?.email || session.email,
            username: session.username || username,
            travellerId: session.userId,
            userId: session.userId,
            userTypeId: session.userTypeId || 5,
            userType: session.userType || 'TRA'
          },
          {
            profile: traveller.profile || null,
            session: session as never,
            dashboard: (result.dashboard as never) || traveller.dashboard || null
          }
        );
        hydratingRef.current = false;
      }).
      catch(() => {
        // Leave hydratingRef true — avoid retry storms when login keeps failing.
      });
    // Only re-run when we gain/lose a wallet user id or auth user identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletUserId, user?.username, user?.email, user?.phone]);

  useEffect(() => {
    if (!refreshOnMount || !walletUserId) return;
    void refreshDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshOnMount, walletUserId]);

  // Soft realtime: re-fetch AvailableCredit on an interval while mounted.
  useEffect(() => {
    if (!pollMs || !walletUserId) return;
    const id = window.setInterval(() => {
      void refreshDashboard();
    }, pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, walletUserId, refreshDashboard]);

  // Refresh when the app/tab becomes visible again.
  useEffect(() => {
    if (!walletUserId) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshDashboard();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [walletUserId, refreshDashboard]);

  return {
    userId: walletUserId,
    userTypeId: userTypeId || 5,
    rawCredit,
    amountEtb: parsed.amount,
    label,
    compactLabel,
    refreshDashboard
  };
}
