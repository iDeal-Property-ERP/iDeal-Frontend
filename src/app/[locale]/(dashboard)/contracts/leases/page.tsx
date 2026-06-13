'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { LeaseOutput } from '@/types/contract';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'success',
  expired: 'danger',
  renewed: 'info',
  terminated: 'warning',
};

export default function LeasesPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<LeaseOutput[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await apiFetch<PaginatedData<LeaseOutput>>('/leases/', { query: { page: p } });
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
    { key: 'property_id', header: 'Property' },
    { key: 'tenant_id', header: 'Tenant' },
    { key: 'start_date', header: 'Start', sortable: true },
    { key: 'end_date', header: 'End', sortable: true },
    { key: 'monthly_rent', header: 'Monthly Rent' },
    {
      key: 'status',
      header: 'Status',
      render: (item: LeaseOutput) => (
        <Badge variant={STATUS_VARIANT[item.status] ?? 'default'}>{item.status}</Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('leases')}
        description={t('leases_desc')}
        actions={
          <button
            onClick={() => {
              router.push('/contracts/leases/new');
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Lease
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
          rowHref={(item) => `/contracts/leases/${item.id}`}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
