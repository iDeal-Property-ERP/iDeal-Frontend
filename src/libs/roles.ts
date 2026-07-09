import type { Role } from '@/types/enums';

/** Default landing route per role (post-login + role-mismatch redirects). */
export const roleDashboardMap: Record<Role, string> = {
  mgmt: '/management',
  owner: '/owner',
  tenant: '/tenant',
  agent: '/agents',
  listings: '/marketplace',
};

/** Which roles may access each protected route prefix. */
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

/** Authenticated routes that any signed-in user may reach (no role gate). */
export const AUTHED_ONLY_PREFIXES = ['/set-password'];

/**
 * A locale-stripped pathname requires authentication when it hits a protected
 * area. Everything not matched here is public (landing, listings, login, …).
 * @param path - The pathname with any locale prefix removed.
 * @returns The matching route entry, or undefined for public paths.
 */
export function protectedRouteFor(path: string): { path: string; roles: Role[] } | undefined {
  return roleRouteMap.find((entry) => path === entry.path || path.startsWith(`${entry.path}/`));
}

/**
 * Whether the given path is authenticated-but-not-role-gated (e.g. set-password).
 * @param path - The locale-stripped pathname.
 * @returns True when the path only requires being signed in.
 */
export function isAuthedOnly(path: string): boolean {
  return AUTHED_ONLY_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}
