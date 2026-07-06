'use client';

import type { CSSProperties } from 'react';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { Header } from '@/components/ui/Header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { AuthProvider, roleDashboardMap, roleRouteMap, useAuth } from '@/libs/auth';
import { usePathname, useRouter } from '@/libs/I18nNavigation';

function DashboardContent(props: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const routeMatch = roleRouteMap.find((entry) => pathname.startsWith(entry.path));

  if (routeMatch && !routeMatch.roles.includes(user.role)) {
    router.push(roleDashboardMap[user.role]);
    return null;
  }

  const isManagement = pathname.startsWith('/management');

  return (
    <SidebarProvider style={{ '--sidebar-width': '252px' } as CSSProperties}>
      <AppSidebar role={user.role} />
      <SidebarInset>
        {isManagement ? null : <Header />}
        <main className={isManagement ? 'flex-1' : 'flex-1 p-4 lg:p-6'}>{props.children}</main>
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
