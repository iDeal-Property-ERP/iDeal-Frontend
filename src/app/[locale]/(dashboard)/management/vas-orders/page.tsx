'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import type { VASOrderStatus } from '@/types/enums';
import type { ServiceOrderOutput } from '@/types/vas';

const STATUSES: VASOrderStatus[] = [
  'requested',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];

/**
 * Management value-added service orders with status transitions.
 * @returns VAS orders page.
 */
export default function VASOrdersPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<ServiceOrderOutput[]>([]);
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
    apiFetch<PaginatedData<ServiceOrderOutput>>('/management/vas-orders/', { query })
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

  async function updateStatus(id: number, status: string) {
    try {
      await apiFetch(`/management/vas-orders/${id}/status/`, {
        method: 'POST',
        body: { status },
      });
      setReload((n) => n + 1);
    } catch {
      void 0;
    }
  }

  const columns: ColumnDef<ServiceOrderOutput>[] = [
    { accessorKey: 'catalog_item_name', header: 'Service' },
    { accessorKey: 'tenant_id', header: 'Tenant' },
    { accessorKey: 'cost', header: 'Cost' },
    { accessorKey: 'commission_earned', header: 'Commission' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge>{row.original.status}</Badge>,
    },
    {
      id: 'actions',
      header: 'Set status',
      enableSorting: false,
      cell: ({ row }) => (
        <Select
          value={row.original.status}
          onValueChange={(v) => {
            updateStatus(row.original.id, v).catch(() => {
              void 0;
            });
          }}
        >
          <SelectTrigger className="w-auto min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('vas_orders')} description={t('vas_orders_desc')} />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No orders found"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
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
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
