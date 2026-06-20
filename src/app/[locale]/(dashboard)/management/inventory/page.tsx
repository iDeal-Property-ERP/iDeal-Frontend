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
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { InventoryActListOutput } from '@/types/inventory';

const STATUSES = ['', 'draft', 'finalized'];

/**
 * Inventory acts list for management/agents.
 * @returns Inventory acts page.
 */
export default function InventoryActsPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<InventoryActListOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setIsLoading(true);
    const query: Record<string, string | number> = { page };
    if (statusFilter) {
      query.status = statusFilter;
    }
    apiFetch<PaginatedData<InventoryActListOutput>>('/inventory/acts/', { query })
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
  }, [page, statusFilter]);

  const columns: ColumnDef<InventoryActListOutput>[] = [
    { accessorKey: 'property_name', header: 'Property' },
    { accessorKey: 'act_type', header: 'Type' },
    { accessorKey: 'item_count', header: 'Items' },
    { accessorKey: 'photo_count', header: 'Photos' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge>{row.original.status}</Badge>,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            router.push(`/management/inventory/${row.original.id}`);
          }}
        >
          {t('inventory_open')}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('inventory_acts')}
        description={t('inventory_desc')}
        actions={
          <Button
            onClick={() => {
              router.push('/management/inventory/new');
            }}
          >
            {t('inventory_new')}
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No inventory acts found"
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
              {STATUSES.filter(Boolean).map((s) => (
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
