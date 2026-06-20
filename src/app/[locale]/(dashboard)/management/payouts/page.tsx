'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
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
      <div className="rounded-lg border border-danger/30 bg-danger-subtle p-4 text-danger">
        {error}
      </div>
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
              <Badge variant={paymentStatusVariant(po.status)}>{po.status}</Badge>
            ),
          },
          {
            key: 'actions',
            header: '',
            render: (po: ManagementPayoutOutput) =>
              po.status === 'scheduled' ? (
                <Button
                  intent="outline"
                  size="sm"
                  onClick={() => {
                    markPaid(po.id).catch(() => {
                      void 0;
                    });
                  }}
                >
                  {t('mark_paid')}
                </Button>
              ) : null,
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
                  {s || 'All statuses'}
                </option>
              ))}
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
