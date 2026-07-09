'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch } from '@/libs/api';
import { logger } from '@/libs/Logger';
// Re-exported from the framework-agnostic module so the Edge middleware can share
// the same maps (a 'use client' module can't be imported there).
import { roleDashboardMap, roleRouteMap } from '@/libs/roles';
import type { AuthUser, LoginPayload } from '@/types/auth';
import type { Role } from '@/types/enums';

export { roleDashboardMap, roleRouteMap };

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

  const fetchUser = useCallback(async () => {
    try {
      const data = await apiFetch<AuthUser>('/users/me/');
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUser().finally(() => {
      setIsLoading(false);
    });
  }, [fetchUser]);

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

  return (
    <AuthContext
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {props.children}
    </AuthContext>
  );
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
