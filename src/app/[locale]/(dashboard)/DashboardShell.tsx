'use client';

import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { CommandPalette } from '@/components/management/CommandPalette';
import { MobileTabBar } from '@/components/management/mobile/MobileTabBar';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { Header } from '@/components/ui/Header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { useQueueCounts } from '@/hooks/management/useQueueCounts';
import { useIsMobile } from '@/hooks/use-mobile';
import { AuthProvider, roleDashboardMap, roleRouteMap, useAuth } from '@/libs/auth';
import { usePathname, useRouter } from '@/libs/I18nNavigation';
import { cn } from '@/libs/utils';

function DashboardContent(props: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const queueCounts = useQueueCounts(user?.role === 'mgmt', pathname);

  const routeMatch = roleRouteMap.find((entry) => pathname.startsWith(entry.path));
  const roleMismatch = Boolean(user && routeMatch && !routeMatch.roles.includes(user.role));

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!user) {
      router.push('/login');
      return;
    }
    // Invited users on a temporary password cannot use the app until they set one.
    if (user.must_change_password) {
      router.push('/set-password');
      return;
    }
    if (roleMismatch) {
      router.push(roleDashboardMap[user.role]);
    }
  }, [isLoading, user, roleMismatch, router]);

  if (isLoading || !user || roleMismatch || user.must_change_password) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-6" />
      </div>
    );
  }

  const isManagement = pathname.startsWith('/management');
  const showTabBar = isManagement && isMobile;

  return (
    // SAFETY: Custom CSS variable assigned to CSSProperties object
    <SidebarProvider style={{ '--sidebar-width': '252px' } as CSSProperties}>
      <AppSidebar role={user.role} counts={queueCounts} />
      <SidebarInset>
        {isManagement ? null : <Header />}
        <main
          className={cn(
            isManagement ? 'flex-1' : 'flex-1 p-4 lg:p-6',
            showTabBar ? 'pb-20' : undefined,
          )}
        >
          {props.children}
        </main>
        {showTabBar ? <MobileTabBar counts={queueCounts} /> : null}
        {isManagement ? <CommandPalette /> : null}
      </SidebarInset>
    </SidebarProvider>
  );
}

/**
 * Dashboard layout shell providing auth guard, role routing, sidebar, and header.
 * @param props - Children to render inside the authenticated layout.
 * @returns Dashboard shell wrapper.
 */
export function DashboardShell(props: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardContent>{props.children}</DashboardContent>
    </AuthProvider>
  );
}
