'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { apiFetch } from '@/libs/api';
import type { PnlBarItem, PnlOutput } from '@/types/management';

function fCurrency(amount: string): string {
  const n = Number.parseFloat(amount);
  if (Number.isNaN(n)) {
    return `$${amount}`;
  }
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function SectionLabel(props: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
      <span className="block h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      {props.children}
    </h3>
  );
}

function GrowthChart(props: { actual: PnlBarItem[]; projected: PnlBarItem[] }) {
  const months = props.actual.map((a) => a.month);
  const maxVal = Math.max(
    ...props.actual.map((a) => Number.parseFloat(a.revenue) || 0),
    ...props.projected.map((p) => Number.parseFloat(p.revenue) || 0),
    1,
  );

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-end gap-3" style={{ height: 160 }}>
        {months.map((m) => {
          const actual = props.actual.find((a) => a.month === m);
          const projected = props.projected.find((p) => p.month === m);
          const actualVal = actual ? Number.parseFloat(actual.revenue) || 0 : 0;
          const projectedVal = projected ? Number.parseFloat(projected.revenue) || 0 : 0;

          return (
            <div
              key={m}
              className="flex flex-1 flex-col items-center justify-end gap-1"
              style={{ height: '100%' }}
            >
              {actualVal > 0 && (
                <div
                  className="w-full max-w-[24px] rounded-t bg-teal-500"
                  style={{ height: `${(actualVal / maxVal) * 140}px` }}
                />
              )}
              {projectedVal > 0 && (
                <div
                  className="w-full max-w-[24px] rounded-t border-2 border-dashed border-zinc-300 bg-transparent dark:border-zinc-600"
                  style={{ height: `${(projectedVal / maxVal) * 140}px` }}
                />
              )}
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{m}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
          <span className="size-3 rounded bg-teal-500" />
          Actual
        </span>
        <span className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
          <span className="size-3 rounded border-2 border-dashed border-zinc-300 dark:border-zinc-600" />
          Projected
        </span>
      </div>
    </div>
  );
}

export default function PnlPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<PnlOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      try {
        const result = await apiFetch<PnlOutput>('/management/pnl/');
        setData(result);
      } catch (caughtError: unknown) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load P&L');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('profit_and_loss')} description={t('profit_and_loss_desc')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
            />
          ))}
        </div>
      </div>
    );
  }

  const { summary, monthly, growth, investor } = data;
  const netMargin =
    summary.gross_revenue !== '0.00'
      ? Math.round(
          (Number.parseFloat(summary.net_profit) / Number.parseFloat(summary.gross_revenue)) * 100,
        )
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader title={t('profit_and_loss')} description={t('profit_and_loss_desc')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Gross Revenue"
          value={fCurrency(summary.gross_revenue)}
          subtitle="Tenant payments"
          variant="success"
        />
        <StatsCard
          title="Owner Payouts"
          value={fCurrency(summary.owner_payouts)}
          subtitle="Monthly"
        />
        <StatsCard
          title={`Net Margin (${netMargin}%)`}
          value={fCurrency(summary.net_profit)}
          subtitle="After payouts"
          variant="success"
        />
        <StatsCard
          title="Tax (4%)"
          value={`${Math.round(Number.parseFloat(summary.tax) || 0).toLocaleString('en-US')} UZS`}
          subtitle="Estimated"
          variant="warning"
        />
      </div>

      <SectionLabel>Monthly Distribution</SectionLabel>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                Month
              </th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                Revenue
              </th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                Payouts
              </th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                Profit
              </th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                Tax 4%
              </th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((row) => (
              <tr
                key={row.month}
                className="border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50 dark:border-zinc-700/50 dark:hover:bg-zinc-800/50"
              >
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  {row.month}
                </td>
                <td className="px-4 py-3 text-teal-600 dark:text-teal-400">
                  {fCurrency(row.revenue)}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {fCurrency(row.owner_payouts)}
                </td>
                <td className="px-4 py-3 font-medium text-amber-600 dark:text-amber-400">
                  {fCurrency(row.profit)}
                </td>
                <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500">
                  {Math.round(Number.parseFloat(row.tax) || 0).toLocaleString('en-US')} UZS
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionLabel>Growth</SectionLabel>
      <GrowthChart actual={growth.actual} projected={growth.projected} />

      <div className="rounded-lg border border-teal-200 bg-teal-50 p-5 dark:border-teal-500/20 dark:bg-teal-500/10">
        <div className="flex items-start gap-3">
          <svg
            className="mt-1 size-5 shrink-0 text-teal-600 dark:text-teal-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">
              Investor Take-Home
            </p>
            <p className="mt-1 text-sm text-teal-700 dark:text-teal-300">
              <b>{fCurrency(investor.monthly)}/mo</b> after tax · annual:{' '}
              <b>{fCurrency(investor.annual)}</b> · based on {investor.property_count} properties.
            </p>
            <p className="text-xs text-teal-600 dark:text-teal-400">
              At 50 properties: ~{fCurrency(investor.scaled_50)}/yr
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
