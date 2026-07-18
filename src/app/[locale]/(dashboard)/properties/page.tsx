'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { startTransition, useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { propertyStatusVariant } from '@/libs/badges';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { PropertyOutput } from '@/types/property';

const TARIFF_LABEL: Record<string, string> = {
  standard: 'Standard',
  comfort: 'Comfort',
  premium: 'Premium',
};

/**
 * Renders the paginated properties list with navigation to create a new property.
 * @returns Properties list page.
 */
export default function PropertiesPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<PropertyOutput[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: number) => {
    try {
      const res = await apiFetch<PaginatedData<PropertyOutput>>('/properties/', {
        query: { page: p },
      });
      setData(res.page.object_list);
      setTotalPages(res.num_pages);
    } catch {
      // handled silently
    }
    setLoading(false);
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

  const columns: ColumnDef<PropertyOutput>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'address', header: 'Address' },
    { accessorKey: 'rooms', header: 'Rooms' },
    { accessorKey: 'area_sqm', header: 'Area (m²)' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={propertyStatusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: 'tariff',
      header: 'Tariff',
      cell: ({ row }) => TARIFF_LABEL[row.original.tariff] ?? row.original.tariff,
    },
    { accessorKey: 'vacant_days', header: 'Vacant Days' },
  ];

  return (
    <>
      <PageHeader
        title={t('properties')}
        description={t('properties_desc')}
        actions={
          <Button
            variant="default"
            onClick={() => {
              router.push('/properties/new');
            }}
          >
            Add Property
          </Button>
        }
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
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
