'use client';

import {
  Bell,
  Briefcase,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  HandCoins,
  LogOut,
  Map as MapIcon,
  ScrollText,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AvatarInitials } from '@/components/management/columns/AvatarInitials';
import { useQueueCounts } from '@/hooks/management/useQueueCounts';
import { useAuth } from '@/libs/auth';
import { Link, usePathname } from '@/libs/I18nNavigation';

type Translator = ReturnType<typeof useTranslations<'Dashboard'>>;

const GROUPS = [
  {
    titleKey: 'more_group_workspace',
    rows: [
      { labelKey: 'nav_pnl', href: '/management/pnl', icon: TrendingUp },
      { labelKey: 'nav_portfolio_map', href: '/management/map', icon: MapIcon },
      {
        labelKey: 'nav_onboardings',
        href: '/management/onboardings',
        icon: ClipboardCheck,
        badgeKey: 'onboardings',
      },
      { labelKey: 'nav_leases', href: '/management/leases', icon: FileText },
      { labelKey: 'nav_agreements', href: '/management/agreements', icon: ScrollText },
      { labelKey: 'nav_inventory', href: '/management/inventory', icon: ClipboardList },
      { labelKey: 'nav_payouts', href: '/management/payouts', icon: HandCoins },
      {
        labelKey: 'nav_maintenance',
        href: '/management/maintenance',
        icon: Wrench,
        badgeKey: 'maintenance',
      },
      { labelKey: 'nav_services', href: '/management/services', icon: Sparkles },
    ],
  },
  {
    titleKey: 'more_group_people',
    rows: [
      { labelKey: 'nav_users', href: '/management/users', icon: Users },
      { labelKey: 'nav_agents', href: '/management/agents', icon: Briefcase },
    ],
  },
] as const;

/**
 * Renders one grouped section of navigation rows with optional queue badges.
 * @param props - The group, translator, and queue counts.
 * @returns The group section.
 */
function MoreGroup(props: {
  group: (typeof GROUPS)[number];
  t: Translator;
  counts: Record<string, number>;
}) {
  const { group, t, counts } = props;
  return (
    <div>
      <p className="mb-2 px-1 text-[11px] font-semibold tracking-[0.4px] text-muted-foreground uppercase">
        {t(group.titleKey)}
      </p>
      <div className="overflow-hidden rounded-[16px] border border-border bg-card">
        {group.rows.map((row, index) => {
          const Icon = row.icon;
          const badge = 'badgeKey' in row ? counts[row.badgeKey] : undefined;
          return (
            <Link
              key={row.href}
              href={row.href}
              className={`flex items-center gap-3 px-4 py-3.5 ${index > 0 ? 'border-t border-border' : ''}`}
            >
              <Icon className="size-5 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium text-foreground">{t(row.labelKey)}</span>
              {badge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-subtle px-1.5 text-xs font-semibold text-primary-subtle-foreground">
                  {badge}
                </span>
              ) : null}
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The mobile "More" menu — the profile card and three groups matching the Figma
 * More frame: WORKSPACE (every module that isn't a bottom-bar tab, with queue
 * badges), PEOPLE (users + agents), and ACCOUNT (notifications, settings, and
 * log out).
 * @returns The More menu screen.
 */
export function MoreMenu() {
  const t = useTranslations('Dashboard');
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const counts = useQueueCounts(true, pathname);

  const displayName = user ? `${user.first_name} ${user.last_name}`.trim() || user.email : '';

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex items-center gap-3 rounded-[16px] border border-border bg-card p-4">
        <AvatarInitials name={displayName || 'ID'} size={44} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {t('more_role_management')} · {user?.email}
          </p>
        </div>
      </div>

      {GROUPS.map((group) => (
        <MoreGroup key={group.titleKey} group={group} t={t} counts={counts} />
      ))}

      <div>
        <p className="mb-2 px-1 text-[11px] font-semibold tracking-[0.4px] text-muted-foreground uppercase">
          {t('more_group_account')}
        </p>
        <div className="overflow-hidden rounded-[16px] border border-border bg-card">
          <Link href="/management/notifications" className="flex items-center gap-3 px-4 py-3.5">
            <Bell className="size-5 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">
              {t('nav_notifications')}
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Link
            href="/management/settings"
            className="flex items-center gap-3 border-t border-border px-4 py-3.5"
          >
            <Settings className="size-5 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">{t('nav_settings')}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 border-t border-border px-4 py-3.5 text-left"
          >
            <LogOut className="size-5 shrink-0 text-danger" />
            <span className="flex-1 text-sm font-medium text-danger">{t('nav_logout')}</span>
          </button>
        </div>
      </div>

      <p className="px-1 text-xs text-muted-foreground">{t('more_footnote')}</p>
    </div>
  );
}
