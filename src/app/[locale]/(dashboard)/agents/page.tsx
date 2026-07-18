'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { startTransition, useState, useEffect, useCallback } from 'react';
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

  const columns: ColumnDef<AgentOutput>[] = [
    { accessorKey: 'user_name', header: 'Name' },
    { accessorKey: 'total_deals', header: 'Total Deals' },
    { accessorKey: 'total_revenue', header: 'Revenue' },
    { accessorKey: 'commission_rate', header: 'Commission' },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'success' : 'default'}>
          {row.original.is_active ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    { accessorKey: 'created_at', header: 'Joined' },
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
          rowHref={(item) => `/agents/${item.id}`}
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}
