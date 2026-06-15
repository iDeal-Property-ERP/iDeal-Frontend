'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { apiFetch } from '@/libs/api';
import { maintenanceStatusVariant, priorityVariant } from '@/libs/badges';
import type { PaginatedData } from '@/types/api';
import type { ManagementServiceRequestOutput } from '@/types/management';

const STATUSES = ['', 'open', 'in_progress', 'resolved', 'cancelled'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical'];

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
      <div className="rounded-lg border border-danger/30 bg-danger-subtle p-4 text-danger">
        {error}
      </div>
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
              <Badge variant={priorityVariant(sr.priority)}>{sr.priority}</Badge>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (sr: ManagementServiceRequestOutput) => (
              <Badge variant={maintenanceStatusVariant(sr.status)}>
                {sr.status.replace('_', ' ')}
              </Badge>
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
                  {s ? s.replace('_', ' ') : 'All statuses'}
                </option>
              ))}
            </Select>
            <Select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-auto"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p || 'All priorities'}
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
