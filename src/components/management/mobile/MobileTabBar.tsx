'use client';

import { Building2, DollarSign, Home, Inbox, MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/libs/I18nNavigation';
import { cn } from '@/libs/utils';

type NavKey = 'nav_home' | 'nav_leads' | 'nav_portfolio' | 'nav_money' | 'nav_more';

type TabDef = {
  id: string;
  href: string;
  icon: LucideIcon;
  labelKey: NavKey;
  badge?: number;
  /** Active only on an exact path match (Home), else prefix match. */
  exact?: boolean;
};

/**
 * The management mobile bottom tab bar — Home · Leads (badged) · Portfolio ·
 * Money · More. Fixed to the bottom with a safe-area inset; the active tab uses
 * the primary tint. Shown only on mobile management routes.
 * @param props - The queue counts driving the Leads badge.
 * @returns The bottom tab bar.
 */
export function MobileTabBar(props: { counts: Record<string, number> }) {
  const t = useTranslations('Dashboard');
  const pathname = usePathname();

  const tabs: TabDef[] = [
    { id: 'home', href: '/management', icon: Home, labelKey: 'nav_home', exact: true },
    {
      id: 'leads',
      href: '/management/leads',
      icon: Inbox,
      labelKey: 'nav_leads',
      badge: props.counts.leads,
    },
    { id: 'portfolio', href: '/management/properties', icon: Building2, labelKey: 'nav_portfolio' },
    {
      id: 'money',
      href: '/management/payments',
      icon: DollarSign,
      labelKey: 'nav_money',
      badge: props.counts.payments,
    },
    { id: 'more', href: '/management/more', icon: MoreHorizontal, labelKey: 'nav_more' },
  ];

  const matchesTab = (tab: TabDef): boolean =>
    tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);

  const isActive = (tab: TabDef): boolean => {
    if (tab.id === 'more') {
      // "More" owns every route that isn't matched by one of the other tabs.
      return !tabs.some((other) => other.id !== 'more' && matchesTab(other));
    }
    return matchesTab(tab);
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur lg:hidden">
      <ul className="flex items-stretch pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <li key={tab.id} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <span className="relative">
                  <Icon className="size-[22px]" />
                  {tab.badge ? (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-danger-foreground">
                      {tab.badge}
                    </span>
                  ) : null}
                </span>
                {t(tab.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
