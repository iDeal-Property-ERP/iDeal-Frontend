'use client';

import type { ColumnDef } from '@tanstack/react-table';
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
      const res = await apiFetch<PaginatedData<PaymentOutput>>('/finance/payments/', {
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

  const columns: ColumnDef<PaymentOutput>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'tenant_name', header: 'Tenant' },
    { accessorKey: 'amount', header: 'Amount' },
    { accessorKey: 'currency', header: 'Currency' },
    { accessorKey: 'payment_date', header: 'Paid On' },
    { accessorKey: 'due_date', header: 'Due' },
    { accessorKey: 'method', header: 'Method' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={paymentStatusVariant(row.original.status)}>{row.original.status}</Badge>
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
              variant="outline"
              onClick={() => {
                router.push('/finance');
              }}
            >
              Back to Finance
            </Button>
            <Button
              variant="default"
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
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
