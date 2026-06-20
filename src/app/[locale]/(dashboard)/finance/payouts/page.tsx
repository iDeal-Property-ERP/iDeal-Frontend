'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { paymentStatusVariant } from '@/libs/badges';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { PayoutOutput } from '@/types/finance-extras';

/**
 * Renders the paginated payouts list with status badges and navigation.
 * @returns Payouts list page element.
 */
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
      const res = await apiFetch<PaginatedData<PayoutOutput>>('/finance/payouts/', {
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

  async function markPaid(id: number) {
    try {
      await apiFetch(`/finance/payouts/${id}/mark-paid/`, { method: 'POST' });
      await fetchData(page);
    } catch {
      // handled silently
    }
  }

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
        <Badge variant={paymentStatusVariant(item.status)}>{item.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: PayoutOutput) =>
        item.status === 'scheduled' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              markPaid(item.id).catch(() => {
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
    <>
      <PageHeader
        title={t('payouts')}
        description={t('payouts_finance_desc')}
        actions={
          <Button
            variant="outline"
            onClick={() => {
              router.push('/finance');
            }}
          >
            Back to Finance
          </Button>
        }
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
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
