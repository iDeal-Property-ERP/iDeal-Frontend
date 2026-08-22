import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './libs/I18nRouting';
import { isAuthedOnly, protectedRouteFor, roleDashboardMap } from './libs/roles';
import type { Role } from './types/enums';

const handleI18nRouting = createMiddleware(routing);

const ACCESS_COOKIE = 'ideal_access';
const REFRESH_COOKIE = 'ideal_refresh';

type LocaleSegments = { prefix: string; rest: string };

/**
 * Split a leading locale segment (e.g. `/ru`) off the pathname.
 * @param pathname - The request pathname.
 * @returns The locale prefix (or '') and the remaining path.
 */
function stripLocale(pathname: string): LocaleSegments {
  for (const locale of routing.locales) {
    const seg = `/${locale}`;
    if (pathname === seg || pathname.startsWith(`${seg}/`)) {
      return { prefix: seg, rest: pathname.slice(seg.length) || '/' };
    }
  }
  return { prefix: '', rest: pathname };
}

/**
 * Decode the JWT payload WITHOUT verifying (UX gating only; the API is the boundary).
 * @param token - The access-token JWT string.
 * @returns The `role` + first-login flag, or null if undecodable.
 */
function decodeClaims(token: string): { role?: Role; mustChange?: boolean } | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }
    // SAFETY: Base64-decoded JWT claims parsed to extract role and mustChange fields
    const json = JSON.parse(atob(payload.replaceAll('-', '+').replaceAll('_', '/'))) as {
      extras?: { role?: Role; must_change_password?: boolean };
    };
    return { role: json.extras?.role, mustChange: json.extras?.must_change_password };
  } catch {
    return null;
  }
}

/**
 * Locale routing + server-side auth/role gating. Protected routes are redirected
 * before the page renders when the browser has no session (refresh cookie) or the
 * role/first-login state doesn't fit. Cookies are httpOnly so only the middleware
 * (and the backend) can read the tokens.
 * @param request - The incoming request.
 * @returns A redirect or the i18n-routed response.
 */
export default function proxy(request: NextRequest) {
  const { rest, prefix } = stripLocale(request.nextUrl.pathname);
  const to = (path: string) => NextResponse.redirect(new URL(`${prefix}${path}`, request.url));

  const protectedRoute = protectedRouteFor(rest);
  if (protectedRoute || isAuthedOnly(rest)) {
    if (!request.cookies.has(REFRESH_COOKIE)) {
      return to('/login');
    }
    const access = request.cookies.get(ACCESS_COOKIE)?.value;
    const claims = access ? decodeClaims(access) : null;
    if (claims) {
      if (claims.mustChange && rest !== '/set-password') {
        return to('/set-password');
      }
      if (protectedRoute && claims.role && !protectedRoute.roles.includes(claims.role)) {
        return to(roleDashboardMap[claims.role]);
      }
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: '/((?!_next|_vercel|monitoring|api|payment-return|.*\\..*).*)',
};
