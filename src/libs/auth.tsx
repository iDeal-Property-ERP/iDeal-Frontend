'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch, clearTokens, storeTokens } from '@/libs/api';
import { logger } from '@/libs/Logger';
import type { AuthUser, LoginPayload, TokenResponse } from '@/types/auth';
import type { Role } from '@/types/enums';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const roleDashboardMap: Record<Role, string> = {
  mgmt: '/management',
  owner: '/owner',
  tenant: '/tenant',
  agent: '/agents',
  listings: '/marketplace',
};

export const roleRouteMap: { path: string; roles: Role[] }[] = [
  { path: '/management', roles: ['mgmt'] },
  { path: '/owner', roles: ['owner'] },
  { path: '/tenant', roles: ['tenant'] },
  { path: '/agents', roles: ['agent', 'mgmt'] },
  { path: '/marketplace', roles: ['listings'] },
  { path: '/properties', roles: ['mgmt', 'owner'] },
  { path: '/contracts', roles: ['mgmt'] },
  { path: '/finance', roles: ['mgmt'] },
  { path: '/maintenance', roles: ['mgmt', 'tenant'] },
];

export function AuthProvider(props: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const data = await apiFetch<AuthUser>('/users/me');
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
      const data = await apiFetch<TokenResponse>('/auth/login/', {
        method: 'POST',
        body: payload,
      });
      storeTokens(data.access_token, data.refresh_token);
      await fetchUser();
      logger.info('User logged in');
    },
    [fetchUser],
  );

  const logout = useCallback(() => {
    clearTokens();
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
