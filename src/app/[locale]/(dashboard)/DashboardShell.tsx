'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { Sidebar } from '@/components/ui/Sidebar';
import { AuthProvider, roleDashboardMap, roleRouteMap, useAuth } from '@/libs/auth';
import { useRouter, usePathname } from '@/libs/I18nNavigation';

function DashboardContent(props: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <span className="text-sm text-zinc-500">{t('redirecting')}</span>
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
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

export function DashboardShell(props: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardContent>{props.children}</DashboardContent>
    </AuthProvider>
  );
}
