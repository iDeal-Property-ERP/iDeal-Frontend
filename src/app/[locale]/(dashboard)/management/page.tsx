'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { apiFetch } from '@/libs/api';
import type {
  MaintenanceRequestItem,
  ManagementDashboardOutput,
  RecentPaymentItem,
} from '@/types/management';

function paymentBadge(status: string): {
  variant: 'success' | 'warning' | 'danger' | 'default';
  label: string;
} {
  if (status === 'paid') {
    return { variant: 'success', label: 'Paid' };
  }
  if (status === 'pending') {
    return { variant: 'warning', label: 'Pending' };
  }
  if (status === 'overdue') {
    return { variant: 'danger', label: 'Overdue' };
  }
  return { variant: 'default', label: status };
}

function priorityBadge(priority: string): {
  variant: 'success' | 'warning' | 'danger' | 'default';
  label: string;
} {
  if (priority === 'low') {
    return { variant: 'success', label: 'Low' };
  }
  if (priority === 'medium') {
    return { variant: 'warning', label: 'Medium' };
  }
  if (priority === 'high' || priority === 'critical') {
    return { variant: 'danger', label: 'High' };
  }
  return { variant: 'default', label: priority };
}

function maintStatusBadge(status: string): {
  variant: 'success' | 'warning' | 'danger' | 'default';
  label: string;
} {
  if (status === 'resolved') {
    return { variant: 'success', label: 'Resolved' };
  }
  if (status === 'in_progress') {
    return { variant: 'warning', label: 'In progress' };
  }
  if (status === 'open') {
    return { variant: 'danger', label: 'Open' };
  }
  return { variant: 'default', label: status };
}

function DonutChart(props: { rented: number; vacant: number; maintenance: number }) {
  const total = props.rented + props.vacant + props.maintenance || 1;
  const segments = [
    { value: props.rented, color: '#14b8a6' },
    { value: props.vacant, color: '#f59e0b' },
    { value: props.maintenance, color: '#ef4444' },
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
        <circle cx={cx} cy={cy} r={r - sw / 2 - 1} fill="white" className="dark:fill-zinc-900" />
      </svg>
      <div className="flex-1 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <span className="size-2.5 rounded-sm bg-teal-500" />
            Rented
          </span>
          <span className="font-semibold text-teal-600 dark:text-teal-400">{props.rented}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <span className="size-2.5 rounded-sm bg-amber-500" />
            Vacant
          </span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">{props.vacant}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <span className="size-2.5 rounded-sm bg-red-500" />
            Maint.
          </span>
          <span className="font-semibold text-red-600 dark:text-red-400">{props.maintenance}</span>
        </div>
      </div>
    </div>
  );
}

function SectionLabel(props: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
      <span className="block h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      {props.children}
    </h3>
  );
}

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
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
        {error}
      </div>
    );
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
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
            />
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
      render: (item: RecentPaymentItem) => {
        const b = paymentBadge(item.status);
        return <Badge variant={b.variant}>{b.label}</Badge>;
      },
    },
  ];

  const maintenanceColumns = [
    { key: 'title', header: 'Request' },
    { key: 'property_name', header: 'Property' },
    { key: 'tenant_name', header: 'Tenant' },
    {
      key: 'priority',
      header: 'Priority',
      render: (item: MaintenanceRequestItem) => {
        const b = priorityBadge(item.priority);
        return <Badge variant={b.variant}>{b.label}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: MaintenanceRequestItem) => {
        const b = maintStatusBadge(item.status);
        return <Badge variant={b.variant}>{b.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('management_dashboard')} description={t('management_dashboard_desc')} />

      <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="absolute top-0 left-0 h-full w-1 bg-teal-500" />
        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {data.greeting}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {data.date} · {data.location} · {data.total_properties} properties
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-0.5 text-xs font-medium text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-400">
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
            keyExtractor={(item) => `${item.tenant_name}-${item.property_name}`}
            emptyMessage="No recent payments"
          />
        </div>
        <div>
          <SectionLabel>Occupancy</SectionLabel>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {occupancy.rate}%
            </p>
            <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">occupied</p>
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
          keyExtractor={(item) => `${item.title}-${item.property_name}`}
          emptyMessage="No open maintenance requests"
        />
      </div>
    </div>
  );
}
