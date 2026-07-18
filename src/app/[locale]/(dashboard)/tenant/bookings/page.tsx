'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { startTransition, useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { TenantBookingOutput } from '@/types/marketplace';

/**
 * Tenant's own booking requests with the ability to cancel.
 * @returns Tenant bookings page.
 */
export default function TenantBookingsPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<TenantBookingOutput[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: number) => {
    try {
      const res = await apiFetch<PaginatedData<TenantBookingOutput>>('/tenant/bookings/', {
        query: { page: p },
      });
      setData(res.page.object_list);
      setTotalPages(res.num_pages);
    } catch {
      void 0;
    } finally {
      setLoading(false);
    }
  }, []);

  const onPageChange = (p: number) => {
    setPage(p);
    setLoading(true);
  };

  useEffect(() => {
    startTransition(() => {
      fetchData(page).catch(() => {
        void 0;
      });
    });
  }, [page, fetchData]);

  async function cancel(id: number) {
    try {
      await apiFetch(`/tenant/bookings/${id}/cancel/`, { method: 'POST' });
      await fetchData(page);
    } catch {
      void 0;
    }
  }

  const columns: ColumnDef<TenantBookingOutput>[] = [
    { accessorKey: 'property_name', header: t('col_property') },
    { accessorKey: 'requested_start_date', header: t('col_from') },
    { accessorKey: 'requested_end_date', header: t('col_to') },
    {
      accessorKey: 'status',
      header: t('col_status'),
      cell: ({ row }) => <Badge>{row.original.status}</Badge>,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.status === 'requested' || row.original.status === 'approved' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              cancel(row.original.id).catch(() => {
                void 0;
              });
            }}
          >
            {t('booking_cancel')}
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title={t('my_bookings')}
        backHref="/tenant"
        actions={
          <Button
            onClick={() => {
              router.push('/tenant/browse');
            }}
          >
            {t('browse_homes_cta')}
          </Button>
        }
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}
