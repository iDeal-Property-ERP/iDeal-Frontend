'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { PaymentOutput } from '@/types/finance';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  cancelled: 'default',
};

export default function PaymentsListPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<PaymentOutput[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await apiFetch<PaginatedData<PaymentOutput>>('/payments/', {
        query: { page: p },
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
    fetchData(page).catch(() => {
      void 0;
    });
  }, [page, fetchData]);

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'tenant_name', header: 'Tenant', sortable: true },
    { key: 'amount', header: 'Amount' },
    { key: 'currency', header: 'Currency' },
    { key: 'payment_date', header: 'Paid On', sortable: true },
    { key: 'due_date', header: 'Due' },
    { key: 'method', header: 'Method' },
    {
      key: 'status',
      header: 'Status',
      render: (item: PaymentOutput) => (
        <Badge variant={STATUS_VARIANT[item.status] ?? 'default'}>{item.status}</Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('payments')}
        description={t('payments_all_desc')}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => {
                router.push('/finance');
              }}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              Back to Finance
            </button>
            <button
              onClick={() => {
                router.push('/finance/payments/new');
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              New Payment
            </button>
          </div>
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
