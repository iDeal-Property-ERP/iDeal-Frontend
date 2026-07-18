'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { startTransition, useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    try {
      const res = await apiFetch<PaginatedData<LeaseOutput>>('/contracts/leases/', {
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

  const columns: ColumnDef<LeaseOutput>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'property_id', header: 'Property' },
    { accessorKey: 'tenant_id', header: 'Tenant' },
    { accessorKey: 'start_date', header: 'Start' },
    { accessorKey: 'end_date', header: 'End' },
    { accessorKey: 'monthly_rent', header: 'Monthly Rent' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={leaseStatusVariant(row.original.status)}>{row.original.status}</Badge>
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
            variant="default"
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
          rowHref={(item) => `/contracts/leases/${item.id}`}
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}
