'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { AgentOutput } from '@/types/agent';
import type { PaginatedData } from '@/types/api';

/**
 * Agents list page showing all agents with their stats.
 * @returns Agents page element.
 */
export default function AgentsPage() {
  const t = useTranslations('Pages');
  const [data, setData] = useState<AgentOutput[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await apiFetch<PaginatedData<AgentOutput>>('/agents/', { query: { page: p } });
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
    { key: 'user_name', header: 'Name', sortable: true },
    { key: 'total_deals', header: 'Total Deals', sortable: true },
    { key: 'total_revenue', header: 'Revenue' },
    { key: 'commission_rate', header: 'Commission' },
    {
      key: 'is_active',
      header: 'Active',
      render: (item: AgentOutput) => (
        <Badge variant={item.is_active ? 'success' : 'default'}>
          {item.is_active ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    { key: 'created_at', header: 'Joined', sortable: true },
  ];

  return (
    <>
      <PageHeader title={t('agents')} description={t('agents_desc')} />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          keyExtractor={(item) => String(item.id)}
          rowHref={(item) => `/agents/${item.id}`}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
