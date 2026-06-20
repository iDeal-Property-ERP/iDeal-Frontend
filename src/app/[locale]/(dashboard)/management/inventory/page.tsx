'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/select';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaginatedData } from '@/types/api';
import type { InventoryActListOutput } from '@/types/inventory';

const STATUSES = ['', 'draft', 'finalized'];

/**
 * Inventory acts list for management/agents.
 * @returns Inventory acts page.
 */
export default function InventoryActsPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [data, setData] = useState<InventoryActListOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setIsLoading(true);
    const query: Record<string, string | number> = { page };
    if (statusFilter) {
      query.status = statusFilter;
    }
    apiFetch<PaginatedData<InventoryActListOutput>>('/inventory/acts/', { query })
      .then((res) => {
        setData(res.page.object_list);
        setTotalPages(res.num_pages);
      })
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [page, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('inventory_acts')}
        description={t('inventory_desc')}
        actions={
          <Button
            onClick={() => {
              router.push('/management/inventory/new');
            }}
          >
            {t('inventory_new')}
          </Button>
        }
      />
      <DataTable
        columns={[
          { key: 'property_name', header: 'Property' },
          { key: 'act_type', header: 'Type' },
          { key: 'item_count', header: 'Items' },
          { key: 'photo_count', header: 'Photos' },
          {
            key: 'status',
            header: 'Status',
            render: (a: InventoryActListOutput) => <Badge>{a.status}</Badge>,
          },
          {
            key: 'actions',
            header: '',
            render: (a: InventoryActListOutput) => (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push(`/management/inventory/${a.id}`);
                }}
              >
                {t('inventory_open')}
              </Button>
            ),
          },
        ]}
        data={data}
        isLoading={isLoading}
        emptyMessage="No inventory acts found"
        keyExtractor={(item) => item.id}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        filters={
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-auto"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s || 'All statuses'}
              </option>
            ))}
          </Select>
        }
      />
    </div>
  );
}
