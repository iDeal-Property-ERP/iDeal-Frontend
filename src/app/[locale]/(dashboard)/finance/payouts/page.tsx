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

  const columns: ColumnDef<PayoutOutput>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'owner_id', header: 'Owner' },
    { accessorKey: 'amount', header: 'Amount' },
    { accessorKey: 'currency', header: 'Currency' },
    { accessorKey: 'scheduled_date', header: 'Scheduled' },
    { accessorKey: 'paid_date', header: 'Paid On' },
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
          rowHref={(row) => `/finance/payouts/${row.id}`}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
