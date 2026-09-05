import React, {
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode
} from 'react';
import type {
  TravellerDashboardData,
  TravellerLoginSession,
  TravellerProfile
} from '../services/guestApi';

export type AuthStatus = 'unauthenticated' | 'locked' | 'authenticated';

export interface User {
  name: string;
  phone: string;
  walletNumber: string;
  email?: string;
  username?: string;
  travellerId?: number;
  userId?: number;
  userTypeId?: number;
  userType?: string;
}

export type TravellerSessionState = {
  profile?: TravellerProfile | null;
  session?: TravellerLoginSession | null;
  dashboard?: TravellerDashboardData | null;
};

interface AuthState {
  status: AuthStatus;
  user: User | null;
  pin: string | null;
  traveller: TravellerSessionState;
}

interface AuthContextType extends AuthState {
  register: (user: User, pin: string) => void;
  login: (phone: string, pin: string) => boolean;
  /** Persist GuestAPI traveller login + dashboard and enter the app. */
  loginTraveller: (
    user: User,
    traveller: TravellerSessionState,
    pin?: string
  ) => void;
  unlock: (pin: string) => boolean;
  biometricUnlock: () => void;
  resetPin: (newPin: string) => void;
  lock: () => void;
  logout: () => void;
  setTravellerDashboard: (dashboard: TravellerDashboardData | null) => void;
}

const TRAVELLER_KEY = 'mkash-traveller-session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadTravellerSession(): TravellerSessionState {
  try {
    const raw = localStorage.getItem(TRAVELLER_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TravellerSessionState;
  } catch {
    return {};
  }
}

function saveTravellerSession(traveller: TravellerSessionState) {
  try {
    localStorage.setItem(TRAVELLER_KEY, JSON.stringify(traveller));
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const saved = localStorage.getItem('mkash-auth');
    const traveller = loadTravellerSession();
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AuthState;
        if (parsed.status === 'authenticated') {
          parsed.status = 'locked';
        }
        return {
          ...parsed,
          traveller: parsed.traveller || traveller
        };
      } catch {
        // ignore
      }
    }
    return {
      status: 'unauthenticated',
      user: null,
      pin: null,
      traveller
    };
  });

  useEffect(() => {
    localStorage.setItem('mkash-auth', JSON.stringify(state));
    saveTravellerSession(state.traveller || {});
  }, [state]);

  const register = (user: User, pin: string) => {
    setState((s) => ({
      status: 'authenticated',
      user,
      pin,
      traveller: s.traveller || {}
    }));
  };

  const login = (phone: string, pin: string) => {
    if (state.user && state.user.phone === phone && state.pin === pin) {
      setState({
        ...state,
        status: 'authenticated'
      });
      return true;
    }
    if (!state.user && phone && pin) {
      setState({
        status: 'authenticated',
        user: {
          name: 'Demo User',
          phone,
          walletNumber: '1000' + phone
        },
        pin,
        traveller: {}
      });
      return true;
    }
    return false;
  };

  const loginTraveller = (
    user: User,
    traveller: TravellerSessionState,
    pin?: string
  ) => {
    setState((s) => ({
      status: 'authenticated',
      user,
      pin: pin ?? s.pin ?? '0000',
      traveller
    }));
    try {
      localStorage.setItem(
        'mkash-profile',
        JSON.stringify({
          firstName: traveller.profile?.firstName || user.name.split(' ')[0],
          middleName: traveller.profile?.middleName || '',
          lastName:
            traveller.profile?.lastName ||
            user.name.split(' ').slice(1).join(' '),
          phone: user.phone,
          email: user.email || traveller.profile?.email || '',
          username: user.username || traveller.session?.username || '',
          travellerId: user.travellerId || traveller.profile?.travellerId,
          userId: user.userId || traveller.session?.userId,
          userTypeId: user.userTypeId || traveller.session?.userTypeId
        })
      );
    } catch {
      // ignore
    }
  };

  const unlock = (pin: string) => {
    if (state.pin === pin) {
      setState({
        ...state,
        status: 'authenticated'
      });
      return true;
    }
    return false;
  };

  const biometricUnlock = () => {
    setState((s) => ({
      ...s,
      status: 'authenticated'
    }));
  };

  const resetPin = (newPin: string) => {
    setState((s) => ({
      ...s,
      pin: newPin,
      status: 'authenticated'
    }));
  };

  const lock = () =>
    setState((s) => ({
      ...s,
      status: 'locked'
    }));

  const logout = () => {
    try {
      localStorage.removeItem(TRAVELLER_KEY);
    } catch {
      // ignore
    }
    setState({
      status: 'unauthenticated',
      user: null,
      pin: null,
      traveller: {}
    });
  };

  const setTravellerDashboard = (
    dashboard: TravellerDashboardData | null
  ) => {
    setState((s) => ({
      ...s,
      traveller: {
        ...s.traveller,
        dashboard
      }
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        login,
        loginTraveller,
        unlock,
        biometricUnlock,
        resetPin,
        lock,
        logout,
        setTravellerDashboard
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
