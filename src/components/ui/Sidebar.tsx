'use client';

import { useTranslations } from 'next-intl';
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
  | 'nav_map_search';

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
  icon: string;
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
      {
        labelKey: 'nav_dashboard',
        href: '/management',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1',
      },
      {
        labelKey: 'nav_pnl',
        href: '/management/pnl',
        icon: 'M3 3v18h18M18 9l-5 5-3-3-4 4',
      },
      {
        labelKey: 'nav_portfolio_map',
        href: '/management/map',
        icon: 'M9 20l-6 3V6l6-3 6 3 6-3v17l-6 3-6-3zM9 3v17M15 6v17',
      },
    ],
  },
  {
    sectionKey: 'sec_portfolio',
    items: [
      {
        labelKey: 'nav_properties',
        href: '/management/properties',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      },
      {
        labelKey: 'nav_leases',
        href: '/management/leases',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        labelKey: 'nav_agreements',
        href: '/management/agreements',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      },
      {
        labelKey: 'nav_vacancy_cost',
        href: '/management/vacancy',
        icon: 'M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01',
      },
      {
        labelKey: 'nav_add_property',
        href: '/properties/new',
        icon: 'M12 5v14M5 12h14',
      },
    ],
  },
  {
    sectionKey: 'sec_operations',
    items: [
      {
        labelKey: 'nav_users',
        href: '/management/users',
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      },
      {
        labelKey: 'nav_payments',
        href: '/management/payments',
        icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      },
      {
        labelKey: 'nav_payouts',
        href: '/management/payouts',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        labelKey: 'nav_service_requests',
        href: '/management/service-requests',
        icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
      },
      {
        labelKey: 'nav_agents',
        href: '/agents',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      },
    ],
  },
];

const ownerSections: NavSection[] = [
  {
    sectionKey: 'sec_my_account',
    items: [
      {
        labelKey: 'nav_dashboard',
        href: '/owner',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1',
      },
      {
        labelKey: 'nav_my_properties',
        href: '/owner/properties',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      },
      {
        labelKey: 'nav_earnings',
        href: '/owner/earnings',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        labelKey: 'nav_how_it_works',
        href: '/owner/how-it-works',
        icon: 'M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z',
      },
    ],
  },
];

const tenantSections: NavSection[] = [
  {
    sectionKey: 'sec_my_home',
    items: [
      {
        labelKey: 'nav_dashboard',
        href: '/tenant',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1',
      },
      {
        labelKey: 'nav_payments',
        href: '/tenant/payments',
        icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      },
      {
        labelKey: 'nav_service_requests',
        href: '/tenant/service-requests',
        icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
      },
    ],
  },
  {
    sectionKey: 'sec_explore',
    items: [
      {
        labelKey: 'nav_browse_homes',
        href: '/tenant/browse',
        icon: 'M11 11m-8 0a8 8 0 1016 0 8 8 0 10-16 0M21 21l-4.3-4.3',
      },
    ],
  },
];

const listingsSections: NavSection[] = [
  {
    sectionKey: 'sec_find_a_home',
    items: [
      {
        labelKey: 'nav_marketplace',
        href: '/marketplace',
        icon: 'M11 11m-8 0a8 8 0 1016 0 8 8 0 10-16 0M21 21l-4.3-4.3',
      },
      {
        labelKey: 'nav_map_search',
        href: '/marketplace/map',
        icon: 'M9 20l-6 3V6l6-3 6 3 6-3v17l-6 3-6-3zM9 3v17M15 6v17',
      },
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

export function Sidebar(props: SidebarProps) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const t = useTranslations('Dashboard');

  const sections = props.role === 'agent' ? [] : roleNavMap[props.role];

  return (
    <>
      {props.isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={props.onClose}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              props.onClose();
            }
          }}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform lg:translate-x-0 dark:border-zinc-800 dark:bg-zinc-950 ${props.isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
          <Link
            href={roleDashboardMap[props.role]}
            className="text-xl font-bold text-zinc-900 dark:text-zinc-100"
          >
            {t('app_name')}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.sectionKey} className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
                {t(section.sectionKey)}
              </p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/management' || item.href === '/owner' || item.href === '/tenant'
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <li key={`${item.href}-${item.labelKey}`}>
                      <Link
                        href={item.href}
                        onClick={props.onClose}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                        }`}
                      >
                        <svg
                          className="size-5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d={item.icon}
                          />
                        </svg>
                        <span className="flex-1">{t(item.labelKey)}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-auto rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-900 dark:text-red-300">
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

        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-950 dark:hover:text-red-400"
          >
            <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {t('nav_logout')}
          </button>
        </div>
      </aside>
    </>
  );
}
