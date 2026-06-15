'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
    setLoading(true);
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

  useEffect(() => {
    fetchData(page).catch(() => {
      void 0;
    });
  }, [page, fetchData]);

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'address', header: 'Address' },
    { key: 'rooms', header: 'Rooms' },
    { key: 'area_sqm', header: 'Area (m²)' },
    {
      key: 'status',
      header: 'Status',
      render: (item: PropertyOutput) => (
        <Badge variant={propertyStatusVariant(item.status)}>{item.status}</Badge>
      ),
    },
    {
      key: 'tariff',
      header: 'Tariff',
      render: (item: PropertyOutput) => TARIFF_LABEL[item.tariff] ?? item.tariff,
    },
    { key: 'vacant_days', header: 'Vacant Days', sortable: true },
  ];

  return (
    <>
      <PageHeader
        title={t('properties')}
        description={t('properties_desc')}
        actions={
          <Button
            intent="primary"
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
          keyExtractor={(item) => String(item.id)}
          rowHref={(item) => `/properties/${item.id}`}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
