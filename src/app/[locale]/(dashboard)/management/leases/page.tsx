'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
      <Alert variant="danger">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const columns: ColumnDef<ManagementLeaseOutput>[] = [
    { accessorKey: 'property_name', header: 'Property' },
    { accessorKey: 'tenant_name', header: 'Tenant' },
    { accessorKey: 'start_date', header: 'Start Date' },
    { accessorKey: 'end_date', header: 'End Date' },
    {
      accessorKey: 'monthly_rent',
      header: 'Monthly Rent',
      cell: ({ row }) => `$${row.original.monthly_rent}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={leaseStatusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('leases')} description={t('leases_desc')} />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No leases found"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select
              value={statusFilter || 'all'}
              onValueChange={(v) => {
                setStatusFilter(v === 'all' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-auto min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.filter(Boolean).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
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
