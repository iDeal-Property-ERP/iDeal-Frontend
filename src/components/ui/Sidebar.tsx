'use client';

import {
  BarChart3,
  Building2,
  CalendarCheck,
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
  | 'nav_vacancy_cost'
  | 'nav_add_property'
  | 'nav_how_it_works'
  | 'nav_browse_homes'
  | 'nav_marketplace'
  | 'nav_map_search'
  | 'nav_onboardings'
  | 'nav_inventory'
  | 'nav_bookings'
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

type SidebarProps = {
  role: Role;
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Role-aware side navigation with collapsible mobile overlay.
 * @param props - User role, open state, and close handler.
 * @returns Sidebar element.
 */
export function Sidebar(props: SidebarProps) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const t = useTranslations('Dashboard');

  const sections = props.role === 'agent' ? [] : roleNavMap[props.role];

  return (
    <>
      {props.isOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 cursor-default bg-black/50 lg:hidden"
          onClick={props.onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform lg:translate-x-0',
          props.isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
          <Link href={roleDashboardMap[props.role]} className="text-xl font-bold text-foreground">
            {t('app_name')}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.sectionKey} className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                {t(section.sectionKey)}
              </p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/management' || item.href === '/owner' || item.href === '/tenant'
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <li key={`${item.href}-${item.labelKey}`}>
                      <Link
                        href={item.href}
                        onClick={props.onClose}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary-muted text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <Icon className="size-5 shrink-0" strokeWidth={1.5} />
                        <span className="flex-1">{t(item.labelKey)}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-auto rounded-full bg-danger-subtle px-1.5 py-0.5 text-[10px] font-bold text-danger-subtle-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-danger-subtle hover:text-danger-subtle-foreground"
          >
            <LogOut className="size-5 shrink-0" strokeWidth={1.5} />
            {t('nav_logout')}
          </button>
        </div>
      </aside>
    </>
  );
}
