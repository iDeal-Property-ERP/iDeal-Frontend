'use client';

import { ArrowUpRight, CheckCircle2, ChevronRight, Plus } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import type {
  AttentionItem,
  AttentionTone,
} from '@/components/management/dashboard/NeedsAttention';
import type { KpiItem } from '@/components/management/KpiStrip';
import { EmptyState } from '@/components/management/states/EmptyState';
import { useAuth } from '@/libs/auth';
import { Link } from '@/libs/I18nNavigation';
import { cn } from '@/libs/utils';
import type { ManagementDashboardOutput } from '@/types/management';

type Translator = ReturnType<typeof useTranslations>;

const toneClass: Record<AttentionTone, string> = {
  danger: 'bg-danger-subtle text-danger-subtle-foreground',
  accent: 'bg-accent-brand-subtle text-accent-brand-subtle-foreground',
  brand: 'bg-primary-subtle text-primary-subtle-foreground',
  warning: 'bg-warning-subtle text-warning-subtle-foreground',
};

const deltaToneClass = {
  success: 'text-success',
  danger: 'text-danger',
  muted: 'text-muted-foreground',
} as const;

/**
 * A compact mobile KPI tile (Figma 375:3): overline label, a mid-size numeric
 * value, and an optional delta line. Half-width, so four tiles form a 2×2 grid.
 * @param props - The KPI item to render.
 * @returns The tile.
 */
function MobileKpiTile(props: KpiItem) {
  const tone = props.deltaTone ?? 'success';
  return (
    <div className="flex flex-col gap-1 rounded-[16px] border border-border bg-card px-3 py-2.5 shadow-sm">
      <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {props.label}
      </span>
      <p className="font-display text-[26px] leading-[30px] font-bold tracking-[-0.4px] text-foreground tabular-nums">
        {props.value}
      </p>
      {props.delta || props.sublabel ? (
        <p className="flex items-center gap-1 text-[12px]">
          {props.delta ? (
            <span className={cn('font-medium', deltaToneClass[tone])}>{props.delta}</span>
          ) : null}
          {props.sublabel ? <span className="text-muted-foreground">{props.sublabel}</span> : null}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The mobile "Needs attention" block (Figma 375:3): a section title with a count,
 * and a single card of hairline-divided, severity-coded rows.
 * @param props - Title, the attention items, and empty-state copy.
 * @returns The grouped attention block.
 */
function MobileNeedsAttention(props: {
  title: string;
  items: AttentionItem[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <h2 className="text-[18px] font-semibold text-foreground">{props.title}</h2>
        {props.items.length > 0 && (
          <span className="text-[12px] font-medium text-muted-foreground">
            {props.items.length}
          </span>
        )}
      </div>
      {props.items.length === 0 ? (
        <div className="rounded-[14px] border border-border bg-card shadow-sm">
          <EmptyState
            className="py-8"
            description={props.emptyDescription}
            icon={CheckCircle2}
            title={props.emptyTitle}
            tone="muted"
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-sm">
          {props.items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                className="flex items-center gap-3 px-3.5 py-2.5 not-first:border-t not-first:border-border"
                key={item.id}
              >
                <span
                  className={cn(
                    'flex size-[38px] shrink-0 items-center justify-center rounded-[10px]',
                    toneClass[item.tone],
                  )}
                >
                  <Icon className="size-[17px]" strokeWidth={1.75} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[14px] font-medium text-foreground">
                    {item.primary}
                  </span>
                  <span className="truncate text-[12px] text-muted-foreground">
                    {item.secondary}
                  </span>
                </div>
                <ChevronRight className="size-[18px] shrink-0 text-muted-foreground" />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/**
 * The mobile "Portfolio" card (Figma 375:3): a title with a "view all" link, a
 * horizontal stacked occupancy bar, and a rented/vacant/maintenance legend.
 * @param props - The occupancy counts, title, "view all" label, and legend labels.
 * @returns The portfolio card.
 */
function MobilePortfolio(props: {
  title: string;
  viewAllLabel: string;
  rented: number;
  vacant: number;
  maintenance: number;
  rentedLabel: string;
  vacantLabel: string;
  maintenanceLabel: string;
}) {
  const total = props.rented + props.vacant + props.maintenance;
  const pct = (n: number) => (total > 0 ? `${(n / total) * 100}%` : '0%');
  const legend = [
    { label: props.rentedLabel, value: props.rented, dot: 'bg-success' },
    { label: props.vacantLabel, value: props.vacant, dot: 'bg-warning' },
    { label: props.maintenanceLabel, value: props.maintenance, dot: 'bg-danger' },
  ];
  return (
    <section className="flex flex-col gap-2.5 rounded-[16px] border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-semibold text-foreground">{props.title}</h2>
        <Link
          className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-primary-subtle-foreground"
          href="/management/properties"
        >
          {props.viewAllLabel} {total}
          <ArrowUpRight className="size-3" />
        </Link>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="bg-success" style={{ width: pct(props.rented) }} />
        <div className="bg-warning" style={{ width: pct(props.vacant) }} />
        <div className="bg-danger" style={{ width: pct(props.maintenance) }} />
      </div>
      <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[12px] text-muted-foreground">
        {legend.map((l) => (
          <span className="flex items-center gap-1.5" key={l.label}>
            <span className={cn('size-[7px] rounded-full', l.dot)} />
            {l.label} {l.value}
          </span>
        ))}
      </div>
    </section>
  );
}

/**
 * The mobile Management dashboard (Figma 375:3) — a dense single-column rethink:
 * a greeting header with the primary "Add property" action, a 2×2 grid of compact
 * KPI tiles, a grouped "Needs attention" card, and a stacked-bar portfolio card.
 * Mobile-only (chosen via `useIsMobile`), so it renders its own compact primitives
 * rather than the desktop-shaped shared dashboard cards; light/dark stay token-driven.
 * @param props - Translator, the dashboard payload, and the derived KPI/attention data.
 * @returns The mobile dashboard view.
 */
export function HomeMobileView(props: {
  t: Translator;
  dashboard: ManagementDashboardOutput;
  kpiItems: KpiItem[];
  attention: AttentionItem[];
}) {
  const { t, dashboard } = props;
  const { occupancy } = dashboard;
  const { user } = useAuth();
  // Build the greeting client-side via next-intl instead of the backend's baked
  // Uzbek string, so it follows the active locale.
  const greeting = t('mgmt_greeting', { name: user?.first_name ?? '' });

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="font-display text-[22px] leading-[28px] font-bold tracking-[-0.3px] text-foreground">
            {greeting}
          </h1>
          <p className="truncate text-[12px] text-muted-foreground">
            {[dashboard.location, dashboard.date].filter(Boolean).join(' · ')}
          </p>
        </div>
        <Link
          aria-label={t('add_property')}
          className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-primary text-primary-foreground shadow-sm transition hover:opacity-90"
          href="/management/properties/new"
        >
          <Plus className="size-5" />
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-2.5">
        {props.kpiItems.map((item) => (
          <MobileKpiTile key={item.id} {...item} />
        ))}
      </div>

      <MobileNeedsAttention
        emptyDescription={t('empty_attention_desc')}
        emptyTitle={t('empty_attention')}
        items={props.attention}
        title={t('needs_attention')}
      />

      <MobilePortfolio
        maintenance={occupancy.maintenance}
        maintenanceLabel={t('occ_maintenance')}
        rented={occupancy.rented}
        rentedLabel={t('occ_rented')}
        title={t('occupancy')}
        vacant={occupancy.vacant}
        vacantLabel={t('occ_vacant')}
        viewAllLabel={t('view_all')}
      />
    </div>
  );
}
