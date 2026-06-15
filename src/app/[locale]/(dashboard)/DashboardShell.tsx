'use client';

import { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { Sidebar } from '@/components/ui/Sidebar';
import { Spinner } from '@/components/ui/Spinner';
import { AuthProvider, roleDashboardMap, roleRouteMap, useAuth } from '@/libs/auth';
import { useRouter, usePathname } from '@/libs/I18nNavigation';

function DashboardContent(props: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        role={user.role}
        isOpen={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
        }}
      />
      <div className="flex flex-col lg:pl-64">
        <Header
          pageTitle="iDeal"
          onMenuToggle={() => {
            setSidebarOpen(!sidebarOpen);
          }}
        />
        <main className="flex-1 p-4 lg:p-6">{props.children}</main>
      </div>
    </div>
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
