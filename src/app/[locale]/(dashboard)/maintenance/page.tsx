'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/select';
import { apiFetch } from '@/libs/api';
import { maintenanceStatusVariant, priorityVariant } from '@/libs/badges';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { ServiceRequestOutput } from '@/types/maintenance';

/**
 * Maintenance page — lists the current user's service requests.
 * @returns The maintenance page component.
 */
export default function MaintenancePage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<ServiceRequestOutput[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async (p: number, status: string) => {
    setLoading(true);
    try {
      const query: Record<string, string | number> = { page: p };
      if (status) {
        query.status = status;
      }
      const res = await apiFetch<PaginatedData<ServiceRequestOutput>>('/maintenance/requests/', {
        query,
      });
      setData(res.page.object_list);
      setTotalPages(res.num_pages);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page, statusFilter).catch(() => {
      void 0;
    });
  }, [page, statusFilter, fetchData]);

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'title', header: 'Title', sortable: true },
    { key: 'property_id', header: 'Property' },
    {
      key: 'priority',
      header: 'Priority',
      render: (item: ServiceRequestOutput) => (
        <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: ServiceRequestOutput) => (
        <Badge variant={maintenanceStatusVariant(item.status)}>{item.status}</Badge>
      ),
    },
    { key: 'created_at', header: 'Created', sortable: true },
  ];

  return (
    <>
      <PageHeader
        title={t('maintenance')}
        description={t('maintenance_desc')}
        actions={
          <Button
            onClick={() => {
              router.push('/maintenance/new');
            }}
          >
            New Request
          </Button>
        }
      />
      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground">
          Filter:
        </label>
        <Select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-auto"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          keyExtractor={(item) => String(item.id)}
          rowHref={(item) => `/maintenance/${item.id}`}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
