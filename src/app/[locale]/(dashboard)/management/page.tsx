'use client';

import { Building2, DollarSign, HandCoins, PieChart, Plus, TrendingUp, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import type { BarGroup } from '@/components/management/charts/GroupedBarChart';
import type { AttentionItem } from '@/components/management/dashboard/NeedsAttention';
import { NeedsAttention } from '@/components/management/dashboard/NeedsAttention';
import { OccupancyPanel } from '@/components/management/dashboard/OccupancyPanel';
import { PropertiesPreview } from '@/components/management/dashboard/PropertiesPreview';
import { RevenuePayoutsPanel } from '@/components/management/dashboard/RevenuePayoutsPanel';
import { formatMoney, formatMonthLabel } from '@/components/management/format';
import type { KpiItem } from '@/components/management/KpiStrip';
import { KpiStrip } from '@/components/management/KpiStrip';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { HomeMobileView } from '@/components/management/mobile/HomeMobileView';
import { ErrorState } from '@/components/management/states/ErrorState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiFetch } from '@/libs/api';
import { Link } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type {
  ManagementDashboardOutput,
  ManagementPropertyOutput,
  PnlOutput,
} from '@/types/management';

type DashboardData = {
  dashboard: ManagementDashboardOutput;
  pnl: PnlOutput | null;
  properties: ManagementPropertyOutput[];
};

/**
 * Builds the "needs attention" list from maintenance requests + overdue payments.
 * @param dashboard - The management dashboard payload.
 * @param paymentStatusLabel - Maps a payment status to a localized label.
 * @returns The severity-ordered attention items (capped at five).
 */
function buildAttention(
  dashboard: ManagementDashboardOutput,
  paymentStatusLabel: (status: string) => string,
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const request of dashboard.maintenance_requests.slice(0, 3)) {
    const urgent = /high|urgent/iu.test(request.priority);
    items.push({
      id: `maint-${request.title}-${request.property_name}`,
      icon: Wrench,
      tone: urgent ? 'danger' : 'accent',
      primary: request.title,
      secondary: [request.property_name, request.tenant_name].filter(Boolean).join(' · '),
    });
  }

  for (const payment of dashboard.recent_payments) {
    if (!/overdue|pending|late/iu.test(payment.status)) {
      continue;
    }
    items.push({
      id: `pay-${payment.tenant_name}-${payment.property_name}`,
      icon: HandCoins,
      tone: 'brand',
      primary: `${paymentStatusLabel(payment.status)} · ${formatMoney(payment.amount)}`,
      secondary: [payment.tenant_name, payment.property_name].filter(Boolean).join(' · '),
    });
    if (items.length >= 5) {
      break;
    }
  }

  return items.slice(0, 5);
}

/**
 * Management dashboard — KPIs, revenue-vs-payouts chart, occupancy donut, a
 * properties preview, and a needs-attention feed, wired to the live backend.
 * @returns The management dashboard page element.
 */
export default function ManagementDashboardPage() {
  const t = useTranslations('Management');
  const isMobile = useIsMobile();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setError(false);
      try {
        const dashboard = await apiFetch<ManagementDashboardOutput>('/management/dashboard/');
        const [pnl, properties] = await Promise.all([
          apiFetch<PnlOutput>('/management/pnl/').catch(() => null),
          apiFetch<PaginatedData<ManagementPropertyOutput>>('/management/properties/', {
            query: { page: 1 },
          })
            .then((res) => res.page.object_list.slice(0, 5))
            .catch(() => [] as ManagementPropertyOutput[]),
        ]);
        if (active) {
          setData({ dashboard, pnl, properties });
        }
      } catch {
        if (active) {
          setError(true);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const header = (
    <ManagementPageHeader
      title={t('dashboard_title')}
      subtitle={data ? t('dashboard_subtitle', { period: data.dashboard.date }) : undefined}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: t('search_placeholder'),
        ariaLabel: t('search_aria'),
      }}
      actions={
        <Button
          asChild
          className="h-10 gap-2 rounded-[10px] px-4 text-[15px] font-medium shadow-sm"
        >
          <Link href="/management/properties/new">
            <Plus className="size-[17px]" />
            {t('add_property')}
          </Link>
        </Button>
      }
    />
  );

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <ErrorState
          title={t('error_title')}
          message={t('error_dashboard')}
          retryLabel={t('retry')}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="grid grid-cols-2 gap-4 lg:flex lg:flex-row">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[130px] flex-1 rounded-[16px]" />
          ))}
        </div>
        <div className="flex flex-col gap-4 lg:flex-row">
          <Skeleton className="h-[262px] flex-1 rounded-[16px]" />
          <Skeleton className="h-[262px] rounded-[16px] lg:w-[340px]" />
        </div>
        <div className="flex flex-col gap-4 lg:flex-row">
          <Skeleton className="h-[320px] flex-1 rounded-[16px]" />
          <Skeleton className="h-[320px] rounded-[16px] lg:w-[360px]" />
        </div>
      </div>
    );
  }

  const { dashboard, pnl, properties } = data;
  const { kpi, occupancy } = dashboard;

  const kpiItems: KpiItem[] = [
    {
      id: 'occupancy',
      label: t('kpi_occupancy'),
      value: `${occupancy.rate}%`,
      icon: PieChart,
      delta:
        kpi.occupied.change !== 0
          ? `${kpi.occupied.change > 0 ? '+' : ''}${kpi.occupied.change}`
          : undefined,
      deltaDirection: kpi.occupied.change >= 0 ? 'up' : 'down',
      deltaTone: kpi.occupied.change >= 0 ? 'success' : 'danger',
      sublabel: kpi.occupied.change !== 0 ? t('kpi_vs_last_month') : undefined,
    },
    {
      id: 'revenue',
      label: t('kpi_revenue'),
      value: formatMoney(kpi.payments_received.amount),
      icon: DollarSign,
      sublabel: `${kpi.payments_received.on_time_pct}% on time`,
    },
    {
      id: 'margin',
      label: t('kpi_net_margin'),
      value: formatMoney(kpi.net_profit.value),
      icon: TrendingUp,
      delta:
        kpi.net_profit.change !== '0.00' ? `+${formatMoney(kpi.net_profit.change)}` : undefined,
      deltaTone: 'success',
      deltaDirection: 'up',
      sublabel: kpi.net_profit.change !== '0.00' ? t('kpi_vs_last_month') : undefined,
    },
    {
      id: 'vacancy',
      label: t('kpi_vacancy_cost'),
      value: formatMoney(kpi.vacant.loss_per_day),
      icon: Building2,
      sublabel: `${kpi.vacant.value} ${t('occ_vacant').toLowerCase()}`,
    },
  ];

  const barData: BarGroup[] = (pnl?.monthly ?? []).slice(-9).map((month) => ({
    label: formatMonthLabel(month.month),
    primary: Number.parseFloat(month.revenue) || 0,
    secondary: Number.parseFloat(month.owner_payouts) || 0,
  }));

  const statusLabel = (status: string): string => {
    const normalized = status.toLowerCase();
    if (/rent|active|occupied/u.test(normalized)) {
      return t('status_rented');
    }
    if (/maintenance|repair/u.test(normalized)) {
      return t('status_maintenance');
    }
    if (/pending|review/u.test(normalized)) {
      return t('status_pending');
    }
    if (/vacant|available/u.test(normalized)) {
      return t('status_vacant');
    }
    return status.replaceAll('_', ' ');
  };

  const attention = buildAttention(dashboard, statusLabel);

  if (isMobile) {
    return <HomeMobileView t={t} dashboard={dashboard} kpiItems={kpiItems} attention={attention} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      <KpiStrip items={kpiItems} />

      <div className="flex flex-col gap-4 lg:flex-row">
        <RevenuePayoutsPanel
          title={t('chart_revenue_payouts')}
          data={barData}
          revenueLabel={t('legend_revenue')}
          payoutsLabel={t('legend_payouts')}
        />
        <OccupancyPanel
          title={t('occupancy')}
          rate={occupancy.rate}
          rented={occupancy.rented}
          vacant={occupancy.vacant}
          maintenance={occupancy.maintenance}
          rentedLabel={t('occ_rented')}
          vacantLabel={t('occ_vacant')}
          maintenanceLabel={t('occ_maintenance')}
        />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <PropertiesPreview
          rows={properties}
          labels={{
            title: t('properties'),
            viewAll: t('view_all'),
            property: t('col_property'),
            district: t('col_district'),
            status: t('col_status'),
            rent: t('col_rent'),
            occupancy: t('col_occupancy'),
            statusLabel,
            occupancyText: (row) => (row.vacant_days > 0 ? `${row.vacant_days}d` : '—'),
          }}
        />
        <NeedsAttention
          title={t('needs_attention')}
          items={attention}
          emptyTitle={t('empty_attention')}
          emptyDescription={t('empty_attention_desc')}
        />
      </div>
    </div>
  );
}
