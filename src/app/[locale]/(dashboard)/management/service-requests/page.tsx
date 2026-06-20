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
import { maintenanceStatusVariant, priorityVariant } from '@/libs/badges';
import type { PaginatedData } from '@/types/api';
import type { ManagementServiceRequestOutput } from '@/types/management';

const STATUSES = ['', 'open', 'in_progress', 'resolved', 'cancelled'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical'];

const columns: ColumnDef<ManagementServiceRequestOutput>[] = [
  { accessorKey: 'property_name', header: 'Property' },
  { accessorKey: 'tenant_name', header: 'Tenant' },
  { accessorKey: 'title', header: 'Title' },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => (
      <Badge variant={priorityVariant(row.original.priority)}>{row.original.priority}</Badge>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={maintenanceStatusVariant(row.original.status)}>
        {row.original.status.replace('_', ' ')}
      </Badge>
    ),
  },
  {
    accessorKey: 'assigned_to_name',
    header: 'Assigned To',
    cell: ({ row }) => row.original.assigned_to_name ?? '—',
  },
];

/**
 * Management service requests page — lists all service requests with filtering.
 * @returns The management service requests page component.
 */
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
      <Alert variant="danger">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('service_requests')} description={t('service_requests_desc')} />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No service requests found"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
                    {s.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={priorityFilter || 'all'}
              onValueChange={(v) => {
                setPriorityFilter(v === 'all' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-auto min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {PRIORITIES.filter(Boolean).map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
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
