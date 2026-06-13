'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { PayoutOutput } from '@/types/finance-extras';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default'> = {
  scheduled: 'warning',
  paid: 'success',
  cancelled: 'default',
};

export default function PayoutsPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<PayoutOutput[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await apiFetch<PaginatedData<PayoutOutput>>('/payouts/', { query: { page: p } });
      setData(res.page.object_list);
      setTotalPages(res.num_pages);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page).catch(() => {
      void 0;
    });
  }, [page, fetchData]);

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'owner_id', header: 'Owner' },
    { key: 'amount', header: 'Amount' },
    { key: 'currency', header: 'Currency' },
    { key: 'scheduled_date', header: 'Scheduled', sortable: true },
    { key: 'paid_date', header: 'Paid On' },
    {
      key: 'status',
      header: 'Status',
      render: (item: PayoutOutput) => (
        <Badge variant={STATUS_VARIANT[item.status] ?? 'default'}>{item.status}</Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('payouts')}
        description={t('payouts_finance_desc')}
        actions={
          <button
            onClick={() => {
              router.push('/finance');
            }}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Back to Finance
          </button>
        }
      />
      {loading ? (
        <p className="text-sm text-neutral-400">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          keyExtractor={(item) => String(item.id)}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
