'use client';

import { useTranslations } from 'next-intl';
import { LogoMark } from '@/components/ui/Logo';
import { SidebarTrigger } from '@/components/ui/sidebar';

/**
 * Shared chrome for every Management screen: a compact mobile top bar carrying
 * the sidebar trigger (the desktop top band is intentionally omitted so the
 * page's own header row matches Figma), plus the Figma content padding
 * (32px sides, 28px top, 32px bottom on desktop).
 * @param props - The page content.
 * @returns The padded management content region.
 */
export function ManagementPageContainer(props: { children: React.ReactNode }) {
  const t = useTranslations('Dashboard');

  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="flex items-center gap-2">
          <LogoMark className="size-6" />
          <span className="text-base font-semibold text-foreground">{t('app_name')}</span>
        </div>
      </div>
      <div className="flex-1 px-4 pt-4 pb-8 sm:px-6 lg:px-8 lg:pt-7">{props.children}</div>
    </div>
  );
}
