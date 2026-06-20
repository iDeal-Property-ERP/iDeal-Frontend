'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { paymentStatusVariant } from '@/libs/badges';
import type { PaginatedData } from '@/types/api';
import type { ManagementPayoutOutput } from '@/types/management';

const STATUSES = ['', 'scheduled', 'paid', 'cancelled'];

/**
 * Management payouts page — lists all owner payouts with filtering.
 * @returns The management payouts page component.
 */
export default function ManagementPayoutsPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<ManagementPayoutOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const query: Record<string, string | number> = { page };
    if (statusFilter) {
      query.status = statusFilter;
    }
    if (ownerId) {
      query.owner_id = ownerId;
    }

    apiFetch<PaginatedData<ManagementPayoutOutput>>('/management/payouts/', {
      query,
    })
      .then((res) => {
        setData(res.page.object_list);
        setTotalPages(res.num_pages);
      })
      .catch((caughtError: unknown) => {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load payouts');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [page, statusFilter, ownerId, reload]);

  async function markPaid(id: number) {
    try {
      await apiFetch(`/finance/payouts/${id}/mark-paid/`, { method: 'POST' });
      setReload((n) => n + 1);
    } catch {
      // handled silently
    }
  }

  if (error) {
    return (
      <Alert variant="danger">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const columns: ColumnDef<ManagementPayoutOutput>[] = [
    { accessorKey: 'owner_name', header: 'Owner' },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => `${row.original.amount} ${row.original.currency}`,
    },
    { accessorKey: 'scheduled_date', header: 'Scheduled Date' },
    {
      accessorKey: 'paid_date',
      header: 'Paid Date',
      cell: ({ row }) => row.original.paid_date ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={paymentStatusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.status === 'scheduled' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              markPaid(row.original.id).catch(() => {
                void 0;
              });
            }}
          >
            {t('mark_paid')}
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('payouts')} description={t('payouts_desc')} />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No payouts found"
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
              placeholder="Owner ID..."
              value={ownerId}
              onChange={(e) => {
                setOwnerId(e.target.value);
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
