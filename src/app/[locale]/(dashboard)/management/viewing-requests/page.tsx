'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/select';
import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { ManagementViewingRequestOutput } from '@/types/marketplace';

const STATUSES = ['', 'pending', 'confirmed', 'cancelled'];

/**
 * Management viewing-requests queue: confirm or cancel public tour requests.
 * @returns Management viewing requests page.
 */
export default function ManagementViewingRequestsPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<ManagementViewingRequestOutput[]>([]);
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
    apiFetch<PaginatedData<ManagementViewingRequestOutput>>('/management/viewing-requests/', {
      query,
    })
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

  async function act(id: number, action: 'confirm' | 'cancel') {
    try {
      await apiFetch(`/management/viewing-requests/${id}/${action}/`, { method: 'POST' });
      setReload((n) => n + 1);
    } catch {
      void 0;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader description={t('viewing_requests_desc')} title={t('viewing_requests')} />

      <DataTable
        columns={[
          { key: 'full_name', header: t('viewing_name') },
          { key: 'phone', header: t('viewing_phone') },
          { key: 'email', header: t('viewing_email') },
          { key: 'property_name', header: t('viewing_property') },
          { key: 'preferred_date', header: t('viewing_date') },
          {
            key: 'status',
            header: t('viewing_status'),
            render: (v: ManagementViewingRequestOutput) => <Badge>{v.status}</Badge>,
          },
          {
            key: 'actions',
            header: '',
            render: (v: ManagementViewingRequestOutput) =>
              v.status === 'pending' ? (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      act(v.id, 'confirm').catch(() => {
                        void 0;
                      });
                    }}
                    size="sm"
                  >
                    {t('viewing_confirm')}
                  </Button>
                  <Button
                    onClick={() => {
                      act(v.id, 'cancel').catch(() => {
                        void 0;
                      });
                    }}
                    size="sm"
                    variant="destructive"
                  >
                    {t('viewing_cancel')}
                  </Button>
                </div>
              ) : null,
          },
        ]}
        data={data}
        emptyMessage={t('viewing_empty')}
        filters={
          <Select
            className="w-auto"
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            value={statusFilter}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s || t('viewing_all_statuses')}
              </option>
            ))}
          </Select>
        }
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        onPageChange={setPage}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
