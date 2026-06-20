'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
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
import type { PaginatedData } from '@/types/api';
import type { ManagementViewingRequestOutput } from '@/types/marketplace';

const STATUSES = ['', 'pending', 'confirmed', 'cancelled'];

/**
 * Management viewing-requests queue: confirm or cancel public tour requests.
 * @returns Management viewing requests page.
 */
export default function ManagementViewingRequestsPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<ManagementViewingRequestOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    const query: Record<string, string | number> = { page };
    if (statusFilter) {
      query.status = statusFilter;
    }
    apiFetch<PaginatedData<ManagementViewingRequestOutput>>('/management/viewing-requests/', {
      query,
    })
      .then((res) => {
        setData(res.page.object_list);
        setTotalPages(res.num_pages);
      })
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [page, statusFilter, reload]);

  async function act(id: number, action: 'confirm' | 'cancel') {
    try {
      await apiFetch(`/management/viewing-requests/${id}/${action}/`, { method: 'POST' });
      setReload((n) => n + 1);
    } catch {
      void 0;
    }
  }

  const columns: ColumnDef<ManagementViewingRequestOutput>[] = [
    { accessorKey: 'full_name', header: t('viewing_name') },
    { accessorKey: 'phone', header: t('viewing_phone') },
    { accessorKey: 'email', header: t('viewing_email') },
    { accessorKey: 'property_name', header: t('viewing_property') },
    { accessorKey: 'preferred_date', header: t('viewing_date') },
    {
      accessorKey: 'status',
      header: t('viewing_status'),
      cell: ({ row }) => <Badge>{row.original.status}</Badge>,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.status === 'pending' ? (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                act(row.original.id, 'confirm').catch(() => {
                  void 0;
                });
              }}
              size="sm"
            >
              {t('viewing_confirm')}
            </Button>
            <Button
              onClick={() => {
                act(row.original.id, 'cancel').catch(() => {
                  void 0;
                });
              }}
              size="sm"
              variant="destructive"
            >
              {t('viewing_cancel')}
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader description={t('viewing_requests_desc')} title={t('viewing_requests')} />

      <DataTable
        columns={columns}
        data={data}
        emptyMessage={t('viewing_empty')}
        filters={
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
              <SelectItem value="all">{t('viewing_all_statuses')}</SelectItem>
              {STATUSES.filter(Boolean).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        isLoading={isLoading}
        onPageChange={setPage}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
