'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { OwnerPropertyOutput } from '@/types/owner';

export default function OwnerPropertiesPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<OwnerPropertyOutput[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
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

  useEffect(() => {
    fetchData(page).catch(() => {
      void 0;
    });
  }, [page, fetchData]);

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'address', header: 'Address' },
    { key: 'rooms', header: 'Rooms' },
    { key: 'area_sqm', header: 'Area (m\u00B2)' },
    { key: 'status', header: 'Status' },
    { key: 'tariff', header: 'Tariff' },
    { key: 'ask_price', header: 'Ask Price' },
    { key: 'vacant_days', header: 'Vacant Days' },
  ];

  return (
    <>
      <PageHeader
        title={t('my_properties')}
        backHref="/owner"
        actions={
          <button
            onClick={() => {
              router.push('/owner');
            }}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Dashboard
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
          rowHref={(item) => `/properties/${item.id}`}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
