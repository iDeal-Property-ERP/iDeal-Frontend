'use client';

import type { ReactNode } from 'react';
import { usePathname } from '@/libs/I18nNavigation';
import { cn } from '@/libs/utils';

type MarketingShellProps = {
  children: ReactNode;
};

/**
 * Marketing chrome wrapper. Applies the navy `theme-landing` palette override on
 * the home route only (Figma's Landing frame still uses the pre-v2 navy tokens),
 * leaving every other marketing route on the global brand-blue palette.
 * @param props - The marketing header, main content and footer to wrap.
 * @returns The marketing shell with the route-scoped palette class.
 */
export function MarketingShell(props: MarketingShellProps) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <div className={cn('flex min-h-screen flex-col bg-background', isLanding && 'theme-landing')}>
      {props.children}
    </div>
  );
}
