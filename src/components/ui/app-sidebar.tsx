'use client';

import {
  Briefcase,
  Building2,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  FilePlus,
  FileText,
  HandCoins,
  HelpCircle,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Map,
  Moon,
  ScrollText,
  Search,
  Sparkles,
  Sun,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { LogoMark } from '@/components/ui/Logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { roleDashboardMap, useAuth } from '@/libs/auth';
import { Link, usePathname } from '@/libs/I18nNavigation';
import { cn } from '@/libs/utils';
import type { Role } from '@/types/enums';

type NavItemLabel =
  | 'nav_dashboard'
  | 'nav_users'
  | 'nav_properties'
  | 'nav_leases'
  | 'nav_agreements'
  | 'nav_payments'
  | 'nav_payouts'
  | 'nav_service_requests'
  | 'nav_agents'
  | 'nav_my_properties'
  | 'nav_earnings'
  | 'nav_pnl'
  | 'nav_portfolio_map'
  | 'nav_leads'
  | 'nav_maintenance'
  | 'nav_how_it_works'
  | 'nav_browse_homes'
  | 'nav_marketplace'
  | 'nav_map_search'
  | 'nav_onboardings'
  | 'nav_inventory'
  | 'nav_submit_property'
  | 'nav_my_bookings'
  | 'nav_services';

type SectionLabel =
  | 'sec_overview'
  | 'sec_leasing'
  | 'sec_portfolio'
  | 'sec_finance'
  | 'sec_operations'
  | 'sec_people'
  | 'sec_my_account'
  | 'sec_my_home'
  | 'sec_explore'
  | 'sec_find_a_home';

/** Which severity a queue-count badge uses. */
type BadgeTone = 'brand' | 'danger';

type NavItem = {
  href: string;
  icon: LucideIcon;
  labelKey: NavItemLabel;
  /** Key into the queue-counts map; renders a count badge when present. */
  countKey?: string;
  badgeTone?: BadgeTone;
};

type NavSection = {
  sectionKey: SectionLabel;
  items: NavItem[];
};

const mgmtSections: NavSection[] = [
  {
    sectionKey: 'sec_overview',
    items: [
      { labelKey: 'nav_dashboard', href: '/management', icon: LayoutDashboard },
      { labelKey: 'nav_pnl', href: '/management/pnl', icon: TrendingUp },
      { labelKey: 'nav_portfolio_map', href: '/management/map', icon: Map },
    ],
  },
  {
    sectionKey: 'sec_leasing',
    items: [
      {
        labelKey: 'nav_leads',
        href: '/management/viewing-requests',
        icon: Inbox,
        countKey: 'leads',
      },
      {
        labelKey: 'nav_onboardings',
        href: '/management/onboardings',
        icon: ClipboardCheck,
        countKey: 'onboardings',
      },
    ],
  },
  {
    sectionKey: 'sec_portfolio',
    items: [
      { labelKey: 'nav_properties', href: '/management/properties', icon: Building2 },
      { labelKey: 'nav_leases', href: '/management/leases', icon: FileText },
      { labelKey: 'nav_agreements', href: '/management/agreements', icon: ScrollText },
      { labelKey: 'nav_inventory', href: '/management/inventory', icon: ClipboardList },
    ],
  },
  {
    sectionKey: 'sec_finance',
    items: [
      {
        labelKey: 'nav_payments',
        href: '/management/payments',
        icon: DollarSign,
        countKey: 'payments',
        badgeTone: 'danger',
      },
      {
        labelKey: 'nav_payouts',
        href: '/management/payouts',
        icon: HandCoins,
        countKey: 'payouts',
      },
    ],
  },
  {
    sectionKey: 'sec_operations',
    items: [
      {
        labelKey: 'nav_maintenance',
        href: '/management/service-requests',
        icon: Wrench,
        countKey: 'maintenance',
      },
      { labelKey: 'nav_services', href: '/management/vas-orders', icon: Sparkles },
    ],
  },
  {
    sectionKey: 'sec_people',
    items: [
      { labelKey: 'nav_users', href: '/management/users', icon: Users },
      { labelKey: 'nav_agents', href: '/management/agents', icon: Briefcase },
    ],
  },
];

const ownerSections: NavSection[] = [
  {
    sectionKey: 'sec_my_account',
    items: [
      { labelKey: 'nav_dashboard', href: '/owner', icon: LayoutDashboard },
      { labelKey: 'nav_my_properties', href: '/owner/properties', icon: Building2 },
      { labelKey: 'nav_submit_property', href: '/owner/onboarding', icon: FilePlus },
      { labelKey: 'nav_earnings', href: '/owner/earnings', icon: DollarSign },
      { labelKey: 'nav_how_it_works', href: '/owner/how-it-works', icon: HelpCircle },
    ],
  },
];

const tenantSections: NavSection[] = [
  {
    sectionKey: 'sec_my_home',
    items: [
      { labelKey: 'nav_dashboard', href: '/tenant', icon: Home },
      { labelKey: 'nav_payments', href: '/tenant/payments', icon: DollarSign },
      { labelKey: 'nav_service_requests', href: '/tenant/service-requests', icon: Wrench },
      { labelKey: 'nav_services', href: '/tenant/services', icon: Sparkles },
      { labelKey: 'nav_my_bookings', href: '/tenant/bookings', icon: ClipboardCheck },
    ],
  },
  {
    sectionKey: 'sec_explore',
    items: [{ labelKey: 'nav_browse_homes', href: '/tenant/browse', icon: Search }],
  },
];

const listingsSections: NavSection[] = [
  {
    sectionKey: 'sec_find_a_home',
    items: [
      { labelKey: 'nav_marketplace', href: '/marketplace', icon: Search },
      { labelKey: 'nav_map_search', href: '/marketplace/map', icon: Map },
    ],
  },
];

const roleNavMap: Record<Exclude<Role, 'agent'>, NavSection[]> = {
  mgmt: mgmtSections,
  owner: ownerSections,
  tenant: tenantSections,
  listings: listingsSections,
};

function isItemActive(href: string, pathname: string): boolean {
  if (href === '/management' || href === '/owner' || href === '/tenant') {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

function initials(first: string | null, last: string | null, fallback: string): string {
  const letters = `${first?.charAt(0) ?? ''}${last?.charAt(0) ?? ''}`.trim();
  return (letters || fallback.charAt(0) || '?').toUpperCase();
}

function displayName(first: string | null, last: string | null, fallback: string): string {
  return `${first ?? ''} ${last ?? ''}`.trim() || fallback;
}

/**
 * Resolves the display label for a role via literal translation keys.
 * @param t - The Dashboard-namespace translator.
 * @param role - The user's role.
 * @returns The localized role label.
 */
function roleLabel(t: ReturnType<typeof useTranslations<'Dashboard'>>, role: Role): string {
  switch (role) {
    case 'mgmt': {
      return t('role_management');
    }
    case 'owner': {
      return t('role_owner');
    }
    case 'tenant': {
      return t('role_tenant');
    }
    case 'agent': {
      return t('role_agent');
    }
    default: {
      return t('role_guest');
    }
  }
}

/**
 * Theme toggle rendered as a sidebar footer control.
 * @returns Theme toggle button, or null before hydration.
 */
function SidebarThemeToggle() {
  const t = useTranslations('Dashboard');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SidebarMenuButton
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      tooltip={t('theme_toggle')}
    >
      {theme === 'dark' ? <Sun strokeWidth={1.5} /> : <Moon strokeWidth={1.5} />}
      <span>{t('theme_toggle')}</span>
    </SidebarMenuButton>
  );
}

/**
 * Role-aware application sidebar built on the shadcn Sidebar system.
 * @param props - The current user role and optional queue counts for badges.
 * @returns Sidebar element.
 */
export function AppSidebar(props: { role: Role; counts?: Record<string, number> }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const t = useTranslations('Dashboard');
  const { setOpenMobile } = useSidebar();

  const sections = props.role === 'agent' ? [] : roleNavMap[props.role];
  const counts = props.counts ?? {};

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href={roleDashboardMap[props.role]} className="flex items-center gap-2.5 px-2 py-2">
          <LogoMark className="size-8" />
          <span className="text-lg font-semibold text-foreground group-data-[collapsible=icon]:hidden">
            {t('app_name')}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.sectionKey}>
            <SidebarGroupLabel className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              {t(section.sectionKey)}
            </SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
                const Icon = item.icon;
                const count = item.countKey ? counts[item.countKey] : undefined;
                return (
                  <SidebarMenuItem key={`${item.href}-${item.labelKey}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={isItemActive(item.href, pathname)}
                      tooltip={t(item.labelKey)}
                    >
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <Icon strokeWidth={1.5} />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                    {count !== undefined && count > 0 ? (
                      <SidebarMenuBadge
                        className={cn(
                          'rounded-full',
                          item.badgeTone === 'danger'
                            ? 'bg-danger-subtle text-danger-subtle-foreground'
                            : 'bg-primary-subtle text-primary-subtle-foreground',
                        )}
                      >
                        {count}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarThemeToggle />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip={t('nav_logout')}>
              <LogOut strokeWidth={1.5} />
              <span>{t('nav_logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {user !== null && (
            <SidebarMenuItem>
              <div className="flex items-center gap-2.5 rounded-lg px-3 py-1.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-medium text-primary-subtle-foreground">
                  {initials(user.first_name, user.last_name, user.username)}
                </span>
                <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-medium text-foreground">
                    {displayName(user.first_name, user.last_name, user.username)}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {roleLabel(t, user.role)}
                  </span>
                </div>
              </div>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
