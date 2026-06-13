'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { ManagementPayoutOutput } from '@/types/management';

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'danger'> = {
  scheduled: 'info',
  paid: 'success',
  cancelled: 'danger',
};

const STATUSES = ['', 'scheduled', 'paid', 'cancelled'];

export default function ManagementPayoutsPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<ManagementPayoutOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [ownerId, setOwnerId] = useState('');

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
  }, [page, statusFilter, ownerId]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('payouts')} description={t('payouts_desc')} />

      <DataTable
        columns={[
          { key: 'owner_name', header: 'Owner' },
          {
            key: 'amount',
            header: 'Amount',
            render: (po: ManagementPayoutOutput) => `${po.amount} ${po.currency}`,
          },
          { key: 'scheduled_date', header: 'Scheduled Date' },
          {
            key: 'paid_date',
            header: 'Paid Date',
            render: (po: ManagementPayoutOutput) => po.paid_date ?? '—',
          },
          {
            key: 'status',
            header: 'Status',
            render: (po: ManagementPayoutOutput) => (
              <Badge variant={STATUS_VARIANT[po.status]}>{po.status}</Badge>
            ),
          },
        ]}
        data={data}
        isLoading={isLoading}
        emptyMessage="No payouts found"
        keyExtractor={(item) => item.id}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s || 'All statuses'}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Owner ID..."
              value={ownerId}
              onChange={(e) => {
                setOwnerId(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:w-36"
            />
          </div>
        }
      />
    </div>
  );
}
