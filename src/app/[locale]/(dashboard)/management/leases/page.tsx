'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { ManagementLeaseOutput } from '@/types/management';

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'info' | 'default'> = {
  active: 'success',
  expired: 'danger',
  renewed: 'info',
  terminated: 'danger',
};

const STATUSES = ['', 'active', 'expired', 'renewed', 'terminated'];

export default function ManagementLeasesPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<ManagementLeaseOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [tenantId, setTenantId] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const query: Record<string, string | number> = { page };
    if (statusFilter) {
      query.status = statusFilter;
    }
    if (propertyId) {
      query.property_id = propertyId;
    }
    if (tenantId) {
      query.tenant_id = tenantId;
    }

    apiFetch<PaginatedData<ManagementLeaseOutput>>('/management/leases/', {
      query,
    })
      .then((res) => {
        setData(res.page.object_list);
        setTotalPages(res.num_pages);
      })
      .catch((caughtError: unknown) => {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load leases');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [page, statusFilter, propertyId, tenantId]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('leases')} description={t('leases_desc')} />

      <DataTable
        columns={[
          { key: 'property_name', header: 'Property' },
          { key: 'tenant_name', header: 'Tenant' },
          { key: 'start_date', header: 'Start Date' },
          { key: 'end_date', header: 'End Date' },
          {
            key: 'monthly_rent',
            header: 'Monthly Rent',
            render: (lease: ManagementLeaseOutput) => `$${lease.monthly_rent}`,
          },
          {
            key: 'status',
            header: 'Status',
            render: (lease: ManagementLeaseOutput) => (
              <Badge variant={STATUS_VARIANT[lease.status]}>{lease.status}</Badge>
            ),
          },
        ]}
        data={data}
        isLoading={isLoading}
        emptyMessage="No leases found"
        keyExtractor={(item) => item.id}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <div className="flex flex-col gap-3 sm:flex-row">
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
                  {s || 'All statuses'}
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
