'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { leaseStatusVariant } from '@/libs/badges';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { LeaseOutput } from '@/types/contract';

/**
 * Displays the paginated list of leases with navigation to create or view a lease.
 * @returns Leases list page element.
 */
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
        <Badge variant={leaseStatusVariant(item.status)}>{item.status}</Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('leases')}
        description={t('leases_desc')}
        actions={
          <Button
            intent="primary"
            onClick={() => {
              router.push('/contracts/leases/new');
            }}
          >
            New Lease
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
          rowHref={(item) => `/contracts/leases/${item.id}`}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
