'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { ServiceRequestOutput } from '@/types/maintenance';

const STATUS_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  cancelled: 'default',
};

const PRIORITY_VARIANT: Record<string, 'default' | 'warning' | 'danger'> = {
  low: 'default',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

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
      const res = await apiFetch<PaginatedData<ServiceRequestOutput>>('/service-requests/', {
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
        <Badge variant={PRIORITY_VARIANT[item.priority] ?? 'default'}>{item.priority}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: ServiceRequestOutput) => (
        <Badge variant={STATUS_VARIANT[item.status] ?? 'default'}>{item.status}</Badge>
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
          <button
            onClick={() => {
              router.push('/maintenance/new');
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Request
          </button>
        }
      />
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-neutral-600">Filter:</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {loading ? (
        <p className="text-sm text-neutral-400">Loading...</p>
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
