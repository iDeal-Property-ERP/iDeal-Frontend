'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { apiFetch } from '@/libs/api';
import { leaseStatusVariant } from '@/libs/badges';
import type { PaginatedData } from '@/types/api';
import type { ManagementLeaseOutput } from '@/types/management';

const STATUSES = ['', 'active', 'expired', 'renewed', 'terminated'];

/**
 * Management leases page — lists all leases with filtering.
 * @returns The management leases page component.
 */
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
      <div className="rounded-lg border border-danger/30 bg-danger-subtle p-4 text-danger">
        {error}
      </div>
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
              <Badge variant={leaseStatusVariant(lease.status)}>{lease.status}</Badge>
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
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-auto"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s || 'All statuses'}
                </option>
              ))}
            </Select>
            <Input
              type="text"
              placeholder="Property ID..."
              value={propertyId}
              onChange={(e) => {
                setPropertyId(e.target.value);
                setPage(1);
              }}
              className="sm:w-36"
            />
            <Input
              type="text"
              placeholder="Tenant ID..."
              value={tenantId}
              onChange={(e) => {
                setTenantId(e.target.value);
                setPage(1);
              }}
              className="sm:w-36"
            />
          </div>
        }
      />
    </div>
  );
}
