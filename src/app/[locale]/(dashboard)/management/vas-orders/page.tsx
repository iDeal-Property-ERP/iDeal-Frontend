'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { VASOrderStatus } from '@/types/enums';
import type { ServiceOrderOutput } from '@/types/vas';

const STATUSES: VASOrderStatus[] = [
  'requested',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];

/**
 * Management value-added service orders with status transitions.
 * @returns VAS orders page.
 */
export default function VASOrdersPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<ServiceOrderOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    const query: Record<string, string | number> = { page };
    if (statusFilter) {
      query.status = statusFilter;
    }
    apiFetch<PaginatedData<ServiceOrderOutput>>('/management/vas-orders/', { query })
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
  }, [page, statusFilter, reload]);

  async function updateStatus(id: number, status: string) {
    try {
      await apiFetch(`/management/vas-orders/${id}/status/`, {
        method: 'POST',
        body: { status },
      });
      setReload((n) => n + 1);
    } catch {
      void 0;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('vas_orders')} description={t('vas_orders_desc')} />
      <DataTable
        columns={[
          { key: 'catalog_item_name', header: 'Service' },
          { key: 'tenant_id', header: 'Tenant' },
          { key: 'cost', header: 'Cost' },
          { key: 'commission_earned', header: 'Commission' },
          {
            key: 'status',
            header: 'Status',
            render: (o: ServiceOrderOutput) => <Badge>{o.status}</Badge>,
          },
          {
            key: 'actions',
            header: 'Set status',
            render: (o: ServiceOrderOutput) => (
              <Select
                value={o.status}
                onChange={(e) => {
                  updateStatus(o.id, e.target.value).catch(() => {
                    void 0;
                  });
                }}
                className="w-auto"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            ),
          },
        ]}
        data={data}
        isLoading={isLoading}
        emptyMessage="No orders found"
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
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />
    </div>
  );
}
