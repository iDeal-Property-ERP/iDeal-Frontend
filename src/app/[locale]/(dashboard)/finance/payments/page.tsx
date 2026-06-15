'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { paymentStatusVariant } from '@/libs/badges';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { PaymentOutput } from '@/types/finance';

/**
 * Renders the paginated payments list with status badges and navigation.
 * @returns Payments list page element.
 */
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
        <Badge variant={paymentStatusVariant(item.status)}>{item.status}</Badge>
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
            <Button
              intent="outline"
              onClick={() => {
                router.push('/finance');
              }}
            >
              Back to Finance
            </Button>
            <Button
              intent="primary"
              onClick={() => {
                router.push('/finance/payments/new');
              }}
            >
              New Payment
            </Button>
          </div>
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
