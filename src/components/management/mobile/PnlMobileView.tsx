'use client';

import { Download } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import { MetricTile } from '@/components/management/reports/MetricTile';
import { Button } from '@/components/ui/button';
import type { PnlOutput } from '@/types/management';

type Translator = ReturnType<typeof useTranslations>;

/** One summary KPI tile, pre-resolved by the page so the P&L math stays in one place. */
export type PnlMobileTile = {
  label: string;
  value: string;
  caption?: string;
  icon: LucideIcon;
  captionTone?: 'muted' | 'success';
};

type PnlMobileViewProps = {
  t: Translator;
  title: string;
  subtitle: string;
  sourceLabels: string[];
  yearLabel: string;
  tiles: PnlMobileTile[];
  data: PnlOutput;
  money: (amount: string) => string;
  sourceLabel: (source: string) => string;
  onExport: () => void;
  canExport: boolean;
};

/**
 * A read-only pill chip used for the active Sources / YTD filters on mobile,
 * where the desktop filter controls collapse into a compact summary row.
 * @param props - The chip label.
 * @returns The chip element.
 */
function FilterChip(props: { label: string }) {
  return (
    <span className="flex h-8 items-center rounded-full border border-border bg-muted px-3 text-xs font-medium text-muted-foreground">
      {props.label}
    </span>
  );
}

/**
 * A single monthly revenue row rendered as a label, a proportional mini bar,
 * and the formatted amount — the mobile stand-in for the desktop monthly table.
 * @param props - The month label, bar fraction (0–1), and formatted amount.
 * @returns The monthly bar row.
 */
function MonthlyBarRow(props: { month: string; fraction: number; amount: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 shrink-0 text-xs font-medium text-muted-foreground">{props.month}</span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-primary"
          style={{ width: `${Math.round(props.fraction * 100)}%` }}
        />
      </span>
      <span className="w-24 shrink-0 text-right text-sm text-foreground tabular-nums">
        {props.amount}
      </span>
    </div>
  );
}

/**
 * A single expenses-by-source row — a source label, a share bar, and the
 * formatted amount with its percentage share.
 * @param props - The label, share percent, and formatted amount.
 * @returns The expenses row.
 */
function ExpenseRow(props: { label: string; share: string; amount: string }) {
  const pct = Math.min(Number.parseFloat(props.share) || 0, 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{props.label}</span>
        <span className="text-foreground tabular-nums">
          {props.amount} · {props.share}%
        </span>
      </div>
      <span className="block h-2 w-full overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full bg-accent-brand" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

/**
 * The mobile P&L report — a title with an Export affordance, the active
 * Sources / YTD filter chips, a 2×2 grid of summary KPI tiles, a compact monthly
 * revenue mini-bar list, and an expenses-by-source breakdown. The parent owns
 * data fetching, currency formatting, and export; this view is presentational.
 * @param props - Title/subtitle, filter chips, resolved tiles, data, formatters, and the export handler.
 * @returns The mobile P&L view.
 */
export function PnlMobileView(props: PnlMobileViewProps) {
  const { t } = props;
  const { monthly } = props.data;
  const expenses = props.data.breakdown?.expenses ?? [];
  const maxRevenue = Math.max(...monthly.map((row) => Number.parseFloat(row.revenue) || 0), 1);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-display text-2xl font-bold text-foreground">{props.title}</h1>
            <p className="text-sm text-muted-foreground">{props.subtitle}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={props.onExport}
            disabled={!props.canExport}
            className="shrink-0"
          >
            <Download className="size-4" />
            {t('pnl_export')}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip label={props.yearLabel} />
          {props.sourceLabels.map((label) => (
            <FilterChip key={label} label={label} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {props.tiles.map((tile) => (
          <MetricTile
            key={tile.label}
            label={tile.label}
            value={tile.value}
            icon={tile.icon}
            caption={tile.caption}
            captionTone={tile.captionTone}
          />
        ))}
      </div>

      <section className="flex flex-col gap-4 rounded-[16px] border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">{t('pnl_monthly_title')}</h2>
        <div className="flex flex-col gap-3">
          {monthly.map((row) => (
            <MonthlyBarRow
              key={row.month}
              month={row.month}
              fraction={(Number.parseFloat(row.revenue) || 0) / maxRevenue}
              amount={props.money(row.revenue)}
            />
          ))}
        </div>
      </section>

      {expenses.length > 0 ? (
        <section className="flex flex-col gap-4 rounded-[16px] border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">{t('pnl_expenses_by_source')}</h2>
          <div className="flex flex-col gap-4">
            {expenses.map((row) => (
              <ExpenseRow
                key={row.source}
                label={props.sourceLabel(row.source)}
                share={row.share}
                amount={props.money(row.amount)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
