'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { apiFetch, SESSION_EXPIRED_EVENT } from '@/libs/api';
import { logger } from '@/libs/Logger';
// Re-exported from the framework-agnostic module so the Edge middleware can share
// the same maps (a 'use client' module can't be imported there).
import type { AuthUser, LoginPayload } from '@/types/auth';
import type { Role } from '@/types/enums';

export { roleDashboardMap, roleRouteMap } from '@/libs/roles';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider(props: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Mirrors `user` for the (non-React) session-expired event handler, and guards
  // against firing the forced logout more than once per expiry.
  const userRef = useRef<AuthUser | null>(null);
  const expiringRef = useRef(false);

  useEffect(() => {
    userRef.current = user;
  });

  const fetchUser = useCallback(async () => {
    try {
      const data = await apiFetch<AuthUser>('/users/me/');
      setUser(data);
      expiringRef.current = false;
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await apiFetch<AuthUser>('/users/me/');
        if (!cancelled) {
          setUser(data);
          expiringRef.current = false;
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // When any API call 401s after a failed refresh, the session is dead. Clear the
  // user and send them to /login — but only if they were actually signed in, so
  // the anonymous `/users/me/` probe doesn't bounce visitors off public pages.
  useEffect(() => {
    const onSessionExpired = () => {
      if (userRef.current === null || expiringRef.current) {
        return;
      }
      expiringRef.current = true;
      logger.info('Session expired — logging out');
      setUser(null);
      router.replace('/login');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [router]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      // The backend sets httpOnly auth cookies on this response; nothing to store
      // client-side.
      await apiFetch('/auth/login/', { method: 'POST', body: payload });
      await fetchUser();
      logger.info('User logged in');
    },
    [fetchUser],
  );

  const logout = useCallback(() => {
    // Server-side revocation clears the httpOnly cookies + blacklists the tokens.
    apiFetch('/auth/logout/', { method: 'POST', body: {} }).catch(() => {
      // Ignore network/expiry errors — local logout still proceeds.
    });
    setUser(null);
    router.push('/login');
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      refreshUser: fetchUser,
    }),
    [user, isLoading, login, logout, fetchUser],
  );

  return <AuthContext value={value}>{props.children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function useRoleGuard(allowedRoles: Role[]): boolean {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return false;
  }
  if (!user) {
    return false;
  }
  return allowedRoles.includes(user.role);
}
