'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatsCard } from '@/components/ui/StatsCard';
import { apiFetch } from '@/libs/api';
import { maintenanceStatusVariant, paymentStatusVariant, priorityVariant } from '@/libs/badges';
import type {
  MaintenanceRequestItem,
  ManagementDashboardOutput,
  RecentPaymentItem,
} from '@/types/management';

function DonutChart(props: { rented: number; vacant: number; maintenance: number }) {
  const total = props.rented + props.vacant + props.maintenance || 1;
  const segments = [
    { value: props.rented, color: 'var(--color-primary)' },
    { value: props.vacant, color: 'var(--color-warning)' },
    { value: props.maintenance, color: 'var(--color-danger)' },
  ].filter((s) => s.value > 0);

  if (segments.length === 0) {
    return null;
  }

  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 44;
  const sw = 22;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-6">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0 -rotate-90"
      >
        {(() => {
          let currentOffset = 0;
          return segments.map((seg, i) => {
            const dash = (seg.value / total) * circumference;
            const el = (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={sw}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-currentOffset}
              />
            );
            currentOffset += dash;
            return el;
          });
        })()}
        <circle cx={cx} cy={cy} r={r - sw / 2 - 1} fill="var(--color-card)" />
      </svg>
      <div className="flex-1 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2.5 rounded-sm bg-primary" />
            Rented
          </span>
          <span className="font-semibold text-primary">{props.rented}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2.5 rounded-sm bg-warning" />
            Vacant
          </span>
          <span className="font-semibold text-warning">{props.vacant}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2.5 rounded-sm bg-danger" />
            Maint.
          </span>
          <span className="font-semibold text-danger">{props.maintenance}</span>
        </div>
      </div>
    </div>
  );
}

function SectionLabel(props: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
      <span className="block h-px flex-1 bg-border" />
      {props.children}
    </h3>
  );
}

/**
 * Management dashboard page showing KPIs, occupancy, recent payments, and maintenance requests.
 * @returns The management dashboard page element.
 */
export default function ManagementDashboardPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<ManagementDashboardOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      try {
        const result = await apiFetch<ManagementDashboardOutput>('/management/dashboard/');
        setData(result);
      } catch (caughtError: unknown) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('management_dashboard')}
          description={t('management_dashboard_desc')}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const { kpi, occupancy, recent_payments, maintenance_requests } = data;

  const paymentColumns = [
    {
      key: 'tenant_name',
      header: 'Tenant',
      render: (item: RecentPaymentItem) => (
        <span>
          {item.nationality ? `${item.nationality} ` : ''}
          {item.tenant_name}
        </span>
      ),
    },
    { key: 'property_name', header: 'Property' },
    { key: 'amount', header: 'Amount', render: (item: RecentPaymentItem) => `$${item.amount}` },
    {
      key: 'status',
      header: 'Status',
      render: (item: RecentPaymentItem) => (
        <Badge variant={paymentStatusVariant(item.status)}>{item.status}</Badge>
      ),
    },
  ];

  const maintenanceColumns = [
    { key: 'title', header: 'Request' },
    { key: 'property_name', header: 'Property' },
    { key: 'tenant_name', header: 'Tenant' },
    {
      key: 'priority',
      header: 'Priority',
      render: (item: MaintenanceRequestItem) => (
        <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: MaintenanceRequestItem) => (
        <Badge variant={maintenanceStatusVariant(item.status)}>{item.status}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('management_dashboard')} description={t('management_dashboard_desc')} />

      <div className="relative overflow-hidden rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="absolute top-0 left-0 h-full w-1 bg-primary" />
        <h2 className="text-lg font-bold tracking-tight text-foreground">{data.greeting}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.date} · {data.location} · {data.total_properties} properties
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-muted px-3 py-0.5 text-xs font-medium text-primary">
          {data.payment_status === 'good' ? 'All payments on track' : 'Payments need attention'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Occupied"
          value={`${kpi.occupied.value}/${kpi.occupied.total}`}
          subtitle={kpi.occupied.change > 0 ? `+${kpi.occupied.change} this month` : undefined}
          variant="success"
        />
        <StatsCard
          title="Net Profit"
          value={`$${kpi.net_profit.value}`}
          subtitle={kpi.net_profit.change !== '0.00' ? `+$${kpi.net_profit.change}` : undefined}
          variant="success"
        />
        <StatsCard
          title="Payments Received"
          value={`$${kpi.payments_received.amount}`}
          subtitle={`${kpi.payments_received.on_time_pct}% on time`}
          variant="success"
        />
        <StatsCard
          title="Vacant"
          value={`${kpi.vacant.value} unit${kpi.vacant.value !== 1 ? 's' : ''}`}
          subtitle={`$${kpi.vacant.loss_per_day}/day loss`}
          variant="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionLabel>Recent Payments</SectionLabel>
          <DataTable
            columns={paymentColumns}
            data={recent_payments}
            keyExtractor={(item, i) => `${item.tenant_name}-${item.property_name}-${i}`}
            emptyMessage="No recent payments"
          />
        </div>
        <div>
          <SectionLabel>Occupancy</SectionLabel>
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <p className="text-3xl font-bold tracking-tight text-foreground">{occupancy.rate}%</p>
            <p className="mb-4 text-xs text-muted-foreground">occupied</p>
            <DonutChart
              rented={occupancy.rented}
              vacant={occupancy.vacant}
              maintenance={occupancy.maintenance}
            />
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>Maintenance Requests</SectionLabel>
        <DataTable
          columns={maintenanceColumns}
          data={maintenance_requests}
          keyExtractor={(item, i) => `${item.title}-${item.property_name}-${i}`}
          emptyMessage="No open maintenance requests"
        />
      </div>
    </div>
  );
}
