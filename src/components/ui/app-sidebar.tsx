'use client';

import {
  BarChart3,
  Building2,
  CalendarCheck,
  CalendarSearch,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  FilePlus,
  FileText,
  HandCoins,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Map,
  Plus,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  | 'nav_vacancy_cost'
  | 'nav_add_property'
  | 'nav_how_it_works'
  | 'nav_browse_homes'
  | 'nav_marketplace'
  | 'nav_map_search'
  | 'nav_onboardings'
  | 'nav_inventory'
  | 'nav_bookings'
  | 'nav_viewing_requests'
  | 'nav_vas_catalog'
  | 'nav_vas_orders'
  | 'nav_submit_property'
  | 'nav_my_bookings'
  | 'nav_services';

type SectionLabel =
  | 'sec_overview'
  | 'sec_portfolio'
  | 'sec_operations'
  | 'sec_my_account'
  | 'sec_my_home'
  | 'sec_explore'
  | 'sec_find_a_home';

type NavItem = {
  href: string;
  icon: LucideIcon;
  labelKey: NavItemLabel;
  badge?: number;
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
    sectionKey: 'sec_portfolio',
    items: [
      { labelKey: 'nav_properties', href: '/management/properties', icon: Building2 },
      { labelKey: 'nav_leases', href: '/management/leases', icon: FileText },
      { labelKey: 'nav_agreements', href: '/management/agreements', icon: Settings },
      { labelKey: 'nav_onboardings', href: '/management/onboardings', icon: ClipboardCheck },
      { labelKey: 'nav_inventory', href: '/management/inventory', icon: ClipboardList },
      { labelKey: 'nav_vacancy_cost', href: '/management/vacancy', icon: BarChart3 },
      { labelKey: 'nav_add_property', href: '/properties/new', icon: Plus },
    ],
  },
  {
    sectionKey: 'sec_operations',
    items: [
      { labelKey: 'nav_users', href: '/management/users', icon: Users },
      { labelKey: 'nav_payments', href: '/management/payments', icon: DollarSign },
      { labelKey: 'nav_payouts', href: '/management/payouts', icon: HandCoins },
      { labelKey: 'nav_bookings', href: '/management/bookings', icon: CalendarCheck },
      {
        labelKey: 'nav_viewing_requests',
        href: '/management/viewing-requests',
        icon: CalendarSearch,
      },
      { labelKey: 'nav_service_requests', href: '/management/service-requests', icon: Wrench },
      { labelKey: 'nav_vas_catalog', href: '/management/vas-catalog', icon: Sparkles },
      { labelKey: 'nav_vas_orders', href: '/management/vas-orders', icon: ClipboardList },
      { labelKey: 'nav_agents', href: '/agents', icon: Users },
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
      { labelKey: 'nav_my_bookings', href: '/tenant/bookings', icon: CalendarCheck },
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

/**
 * Role-aware application sidebar built on the shadcn Sidebar system.
 * @param props - The current user role.
 * @returns Sidebar element.
 */
export function AppSidebar(props: { role: Role }) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const t = useTranslations('Dashboard');
  const { setOpenMobile } = useSidebar();

  const sections = props.role === 'agent' ? [] : roleNavMap[props.role];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href={roleDashboardMap[props.role]}
          className="flex h-8 items-center px-2 text-xl font-bold text-foreground group-data-[collapsible=icon]:hidden"
        >
          {t('app_name')}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.sectionKey}>
            <SidebarGroupLabel>{t(section.sectionKey)}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
                const Icon = item.icon;
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
                    {item.badge !== undefined && item.badge > 0 ? (
                      <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
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
            <SidebarMenuButton onClick={logout} tooltip={t('nav_logout')}>
              <LogOut strokeWidth={1.5} />
              <span>{t('nav_logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
