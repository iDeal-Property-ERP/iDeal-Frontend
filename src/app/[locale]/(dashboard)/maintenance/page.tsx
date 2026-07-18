'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { startTransition, useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
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

  const onPageChange = (p: number) => {
    setPage(p);
    setLoading(true);
  };

  useEffect(() => {
    startTransition(() => {
      fetchData(page, statusFilter).catch(() => {
        void 0;
      });
    });
  }, [page, statusFilter, fetchData]);

  const columns: ColumnDef<ServiceRequestOutput>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'property_id', header: 'Property' },
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
        <Badge variant={maintenanceStatusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
    { accessorKey: 'created_at', header: 'Created' },
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
          value={statusFilter || 'all'}
          onValueChange={(v) => {
            setStatusFilter(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger id="status-filter" className="w-auto min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          rowHref={(item) => `/maintenance/${item.id}`}
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}
