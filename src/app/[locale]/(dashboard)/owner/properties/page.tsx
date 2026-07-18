'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { startTransition, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { OwnerPropertyOutput } from '@/types/owner';

/**
 * Owner properties list page with pagination.
 * @returns Properties page element.
 */
export default function OwnerPropertiesPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<OwnerPropertyOutput[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: number) => {
    try {
      const res = await apiFetch<PaginatedData<OwnerPropertyOutput>>('/owner/properties/', {
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

  const columns: ColumnDef<OwnerPropertyOutput>[] = [
    { accessorKey: 'name', header: t('col_name') },
    { accessorKey: 'address', header: t('col_address') },
    { accessorKey: 'rooms', header: t('col_rooms') },
    { accessorKey: 'area_sqm', header: t('col_area') },
    { accessorKey: 'status', header: t('col_status') },
    { accessorKey: 'tariff', header: t('col_tariff') },
    { accessorKey: 'ask_price', header: t('col_ask_price') },
    { accessorKey: 'vacant_days', header: t('col_vacant_days') },
  ];

  return (
    <>
      <PageHeader
        title={t('my_properties')}
        backHref="/owner"
        actions={
          <Button
            variant="outline"
            onClick={() => {
              router.push('/owner');
            }}
          >
            {t('owner_dashboard')}
          </Button>
        }
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          rowHref={(item) => `/properties/${item.id}`}
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}
