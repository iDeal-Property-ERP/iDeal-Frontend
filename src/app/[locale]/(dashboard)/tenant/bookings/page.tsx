'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
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
    setLoading(true);
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

  useEffect(() => {
    fetchData(page).catch(() => {
      void 0;
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
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <DataTable
          columns={[
            { key: 'property_name', header: 'Property' },
            { key: 'requested_start_date', header: 'From' },
            { key: 'requested_end_date', header: 'To' },
            {
              key: 'status',
              header: 'Status',
              render: (b: TenantBookingOutput) => <Badge>{b.status}</Badge>,
            },
            {
              key: 'actions',
              header: '',
              render: (b: TenantBookingOutput) =>
                b.status === 'requested' || b.status === 'approved' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      cancel(b.id).catch(() => {
                        void 0;
                      });
                    }}
                  >
                    {t('booking_cancel')}
                  </Button>
                ) : null,
            },
          ]}
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
