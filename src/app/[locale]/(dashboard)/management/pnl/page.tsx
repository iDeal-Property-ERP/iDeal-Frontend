'use client';

import { Banknote, Download, Landmark, TrendingUp, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { ExportDialog } from '@/components/management/dialogs/ExportDialog';
import type { ExportScope } from '@/components/management/dialogs/ExportDialog';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { MethodSegmented } from '@/components/management/MethodSegmented';
import { PnlMobileView } from '@/components/management/mobile/PnlMobileView';
import type { PnlMobileTile } from '@/components/management/mobile/PnlMobileView';
import { AnalyticsChart } from '@/components/management/reports/AnalyticsChart';
import { CategoryBreakdown } from '@/components/management/reports/CategoryBreakdown';
import { MetricTile } from '@/components/management/reports/MetricTile';
import { ReportCard } from '@/components/management/reports/ReportCard';
import { SourcesFilter } from '@/components/management/reports/SourcesFilter';
import { ErrorState } from '@/components/management/states/ErrorState';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ExportFormat } from '@/libs/management/exportFile';
import { downloadTable } from '@/libs/management/exportFile';
import { buildPnlExportRows, getPnl } from '@/libs/management/pnlAdapter';
import type { PnlOutput } from '@/types/management';

const ALL_SOURCES = ['lease', 'vas', 'payouts', 'maintenance'];
const CURRENT_YEAR = 2026;
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

/**
 * Formats an amount as UZS. Tax is always accrued in UZS on the backend
 * regardless of the display currency, so it renders with a fixed UZS suffix.
 * @param amount - The decimal string amount.
 * @returns The formatted `"1,234 UZS"` string.
 */
function formatUzs(amount: string): string {
  return `${Math.round(Number.parseFloat(amount) || 0).toLocaleString('en-US')} UZS`;
}

/**
 * Computes a whole-number percentage of `part` over `whole`.
 * @param part - The numerator decimal string.
 * @param whole - The denominator decimal string.
 * @returns The rounded percentage, or 0 when `whole` is 0.
 */
function percentOf(part: string, whole: string): number {
  const w = Number.parseFloat(whole);
  return w > 0 ? Math.round((Number.parseFloat(part) / w) * 100) : 0;
}

export default function PnlPage() {
  const t = useTranslations('Management');
  const isMobile = useIsMobile();

  const [year, setYear] = useState(CURRENT_YEAR);
  const [currency, setCurrency] = useState('USD');
  const [sources, setSources] = useState<string[]>(ALL_SOURCES);
  const [data, setData] = useState<PnlOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    getPnl({ year, currency, sources })
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((caughtError: unknown) => {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : t('pnl_error'));
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [year, currency, sources, t]);

  const money = (amount: string): string => {
    const n = Number.parseFloat(amount);
    const rounded = Number.isNaN(n) ? 0 : Math.round(n);
    const formatted = rounded.toLocaleString('en-US');
    return currency === 'UZS' ? `${formatted} UZS` : `$${formatted}`;
  };

  const sourceLabel = (source: string) => t(`pnl_source_${source}` as never);

  const controls = (
    <div className="flex flex-wrap items-center gap-2.5">
      <SourcesFilter
        options={ALL_SOURCES.map((s) => ({ value: s, label: sourceLabel(s) }))}
        selected={sources}
        onChange={setSources}
        labels={{
          title: t('pnl_sources'),
          all: t('pnl_sources_all'),
          count: (n) => t('pnl_sources_count', { count: n }),
        }}
      />
      <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
        <SelectTrigger className="h-9 w-auto rounded-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y} · {t('pnl_ytd')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <MethodSegmented
        value={currency}
        onChange={setCurrency}
        options={[
          { value: 'USD', label: 'USD' },
          { value: 'UZS', label: 'UZS' },
        ]}
      />
      <Button variant="outline" onClick={() => setExportOpen(true)} disabled={!data}>
        <Download className="size-4" />
        {t('pnl_export')}
      </Button>
    </div>
  );

  const header = (
    <ManagementPageHeader
      title={t('nav_pnl')}
      subtitle={t('pnl_subtitle', { year, currency })}
      showBell={false}
      actions={controls}
    />
  );

  if (error) {
    return (
      <ErrorState
        title={t('pnl_error')}
        message={error}
        onRetry={() => setYear((y) => y)}
        retryLabel={t('retry')}
      />
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-[16px] border border-border bg-card"
            />
          ))}
        </div>
      </div>
    );
  }

  const { summary, monthly, growth, investor, breakdown } = data;
  const tiles: PnlMobileTile[] = [
    {
      label: t('pnl_kpi_revenue'),
      value: money(summary.gross_revenue),
      icon: Banknote,
      caption: t('pnl_kpi_revenue_caption'),
      captionTone: 'success',
    },
    {
      label: t('pnl_kpi_payouts'),
      value: money(summary.owner_payouts),
      icon: Wallet,
      caption: t('pnl_kpi_payouts_caption', {
        pct: percentOf(summary.owner_payouts, summary.gross_revenue),
      }),
    },
    {
      label: t('pnl_kpi_profit'),
      value: money(summary.net_profit),
      icon: TrendingUp,
      caption: t('pnl_kpi_profit_caption', {
        pct: percentOf(summary.net_profit, summary.gross_revenue),
      }),
      captionTone: 'success',
    },
    {
      label: t('pnl_kpi_tax'),
      value: formatUzs(summary.tax),
      icon: Landmark,
      caption: t('pnl_kpi_tax_caption'),
    },
  ];
  const onExport = async (_scope: ExportScope, format: ExportFormat) => {
    await downloadTable(
      buildPnlExportRows(data, {
        section: t('pnl_export_section'),
        metric: t('pnl_export_metric'),
        value: t('pnl_export_value'),
        share: t('pnl_export_share'),
        month: t('pnl_col_month'),
        revenue: t('pnl_col_revenue'),
        payouts: t('pnl_col_payouts'),
        profit: t('pnl_col_profit'),
        tax: t('pnl_col_tax'),
        grossRevenue: t('pnl_kpi_revenue'),
        ownerPayouts: t('pnl_kpi_payouts'),
        netProfit: t('pnl_kpi_profit'),
        taxAccrued: t('pnl_kpi_tax'),
        monthlyBreakdown: t('pnl_monthly_title'),
        revenueBySource: t('pnl_revenue_by_source'),
        expensesBySource: t('pnl_expenses_by_source'),
        sourceLabel,
      }),
      format,
      'profit-and-loss',
      t('nav_pnl'),
    );
  };

  const exportDialog = (
    <ExportDialog
      open={exportOpen}
      onOpenChange={setExportOpen}
      title={t('pnl_export_title')}
      currentViewLabel={t('pnl_subtitle', { year, currency })}
      counts={{ filtered: monthly.length, all: monthly.length, selected: 0 }}
      onExport={onExport}
      labels={{
        scopeTitle: t('export_scope'),
        filtered: () => t('pnl_export_scope_report'),
        all: () => t('pnl_export_scope_report'),
        selected: () => t('pnl_export_scope_report'),
        formatTitle: t('export_format'),
        footnote: t('export_footnote'),
        cancel: t('cancel'),
        submit: () => t('pnl_export'),
        failed: t('export_failed'),
      }}
    />
  );

  if (isMobile) {
    return (
      <>
        <PnlMobileView
          t={t}
          title={t('nav_pnl')}
          subtitle={t('pnl_subtitle', { year, currency })}
          sourceLabels={sources.map(sourceLabel)}
          yearLabel={`${year} · ${t('pnl_ytd')}`}
          tiles={tiles}
          data={data}
          money={money}
          sourceLabel={sourceLabel}
          onExport={() => setExportOpen(true)}
          canExport
        />
        {exportDialog}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile
          label={t('pnl_kpi_revenue')}
          value={money(summary.gross_revenue)}
          icon={Banknote}
          caption={t('pnl_kpi_revenue_caption')}
          captionTone="success"
        />
        <MetricTile
          label={t('pnl_kpi_payouts')}
          value={money(summary.owner_payouts)}
          icon={Wallet}
          caption={t('pnl_kpi_payouts_caption', {
            pct: percentOf(summary.owner_payouts, summary.gross_revenue),
          })}
        />
        <MetricTile
          label={t('pnl_kpi_profit')}
          value={money(summary.net_profit)}
          icon={TrendingUp}
          caption={t('pnl_kpi_profit_caption', {
            pct: percentOf(summary.net_profit, summary.gross_revenue),
          })}
          captionTone="success"
        />
        <MetricTile
          label={t('pnl_kpi_tax')}
          value={formatUzs(summary.tax)}
          icon={Landmark}
          caption={t('pnl_kpi_tax_caption')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ReportCard
          title={t('pnl_monthly_title')}
          action={
            <span className="text-xs text-muted-foreground">
              {t('pnl_all_figures', { currency })}
            </span>
          }
          className="lg:col-span-2"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['month', 'revenue', 'payouts', 'profit', 'tax'].map((col) => (
                    <th
                      key={col}
                      className="py-2.5 pr-4 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase last:pr-0"
                    >
                      {t(`pnl_col_${col}` as never)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthly.map((row) => (
                  <tr key={row.month} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 font-medium text-foreground">{row.month}</td>
                    <td className="py-3 pr-4 text-foreground tabular-nums">{money(row.revenue)}</td>
                    <td className="py-3 pr-4 text-muted-foreground tabular-nums">
                      {money(row.owner_payouts)}
                    </td>
                    <td className="py-3 pr-4 font-medium text-foreground tabular-nums">
                      {money(row.profit)}
                    </td>
                    <td className="py-3 text-muted-foreground tabular-nums">
                      {formatUzs(row.tax)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportCard>

        <div className="flex flex-col gap-4">
          <ReportCard title={t('pnl_growth_title')}>
            <AnalyticsChart
              actual={growth.actual}
              projected={growth.projected}
              labels={{
                actual: t('pnl_actual'),
                projected: t('pnl_projected'),
                projectedSuffix: t('pnl_projected_suffix'),
              }}
            />
          </ReportCard>
          <div className="rounded-[16px] bg-primary p-5 text-primary-foreground">
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase opacity-80">
              {t('pnl_investor_title')}
            </span>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="flex flex-col">
                <span className="font-display text-2xl font-bold tabular-nums">
                  {money(investor.monthly)}
                </span>
                <span className="text-xs opacity-80">{t('pnl_investor_monthly')}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-display text-2xl font-bold tabular-nums">
                  {money(investor.annual)}
                </span>
                <span className="text-xs opacity-80">{t('pnl_investor_annual')}</span>
              </div>
            </div>
            <p className="mt-3 border-t border-primary-foreground/20 pt-3 text-xs opacity-80">
              {t('pnl_investor_scaled', { amount: money(investor.scaled_50) })}
            </p>
          </div>
        </div>
      </div>

      {breakdown ? (
        <CategoryBreakdown
          breakdown={breakdown}
          revenueTitle={t('pnl_revenue_by_source')}
          expensesTitle={t('pnl_expenses_by_source')}
          revenueCenter={money(summary.gross_revenue)}
          sourceLabel={sourceLabel}
        />
      ) : null}

      {exportDialog}
    </div>
  );
}
