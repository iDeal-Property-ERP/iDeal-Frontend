'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { ManagementServiceRequestOutput } from '@/types/management';

const STATUS_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  cancelled: 'danger',
};

const PRIORITY_VARIANT: Record<string, 'default' | 'warning' | 'danger'> = {
  low: 'default',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

const STATUSES = ['', 'open', 'in_progress', 'resolved', 'cancelled'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical'];

export default function ManagementServiceRequestsPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<ManagementServiceRequestOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [tenantId, setTenantId] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const query: Record<string, string | number> = { page };
    if (statusFilter) {
      query.status = statusFilter;
    }
    if (priorityFilter) {
      query.priority = priorityFilter;
    }
    if (propertyId) {
      query.property_id = propertyId;
    }
    if (tenantId) {
      query.tenant_id = tenantId;
    }

    apiFetch<PaginatedData<ManagementServiceRequestOutput>>('/management/service-requests/', {
      query,
    })
      .then((res) => {
        setData(res.page.object_list);
        setTotalPages(res.num_pages);
      })
      .catch((caughtError: unknown) => {
        setError(
          caughtError instanceof Error ? caughtError.message : 'Failed to load service requests',
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [page, statusFilter, priorityFilter, propertyId, tenantId]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('service_requests')} description={t('service_requests_desc')} />

      <DataTable
        columns={[
          { key: 'property_name', header: 'Property' },
          { key: 'tenant_name', header: 'Tenant' },
          { key: 'title', header: 'Title' },
          {
            key: 'priority',
            header: 'Priority',
            render: (sr: ManagementServiceRequestOutput) => (
              <Badge variant={PRIORITY_VARIANT[sr.priority]}>{sr.priority}</Badge>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (sr: ManagementServiceRequestOutput) => (
              <Badge variant={STATUS_VARIANT[sr.status]}>{sr.status.replace('_', ' ')}</Badge>
            ),
          },
          {
            key: 'assigned_to_name',
            header: 'Assigned To',
            render: (sr: ManagementServiceRequestOutput) => sr.assigned_to_name ?? '—',
          },
        ]}
        data={data}
        isLoading={isLoading}
        emptyMessage="No service requests found"
        keyExtractor={(item) => item.id}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s ? s.replace('_', ' ') : 'All statuses'}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p || 'All priorities'}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Property ID..."
              value={propertyId}
              onChange={(e) => {
                setPropertyId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-36"
            />
            <input
              type="text"
              placeholder="Tenant ID..."
              value={tenantId}
              onChange={(e) => {
                setTenantId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-36"
            />
          </div>
        }
      />
    </div>
  );
}
