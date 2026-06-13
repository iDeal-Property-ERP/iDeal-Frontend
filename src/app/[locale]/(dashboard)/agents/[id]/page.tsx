'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { AgentOutput, DealOutput } from '@/types/agent';
import type { PaginatedData } from '@/types/api';

const DEAL_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default'> = {
  closed: 'success',
  pending: 'warning',
  cancelled: 'default',
};

const dealSchema = z.object({
  property_id: z.coerce.number().min(1),
  deal_date: z.string().min(1),
  rent_amount: z.string().min(1),
  status: z.string().min(1),
});

type DealForm = z.infer<typeof dealSchema>;

export default function AgentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [agent, setAgent] = useState<AgentOutput | null>(null);
  const [deals, setDeals] = useState<DealOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(dealSchema),
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      apiFetch<AgentOutput>(`/agents/${params.id}/`),
      apiFetch<PaginatedData<DealOutput>>('/deals/', { query: { agent_id: params.id } }),
    ])
      .then(([agentData, dealsData]) => {
        setAgent(agentData);
        setDeals(dealsData.page.object_list);
      })
      .catch(() => {
        setError('Failed to load agent');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const onCreateDeal = async (data: DealForm) => {
    setError(null);
    try {
      await apiFetch<DealOutput>(`/agents/${params.id}/deals/`, { method: 'POST', body: data });
      reset();
      fetchData();
    } catch (_error) {
      setError(_error instanceof Error ? _error.message : 'Failed to create deal');
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-400">Loading...</p>;
  }
  if (!agent) {
    return <p className="text-sm text-red-500">Agent not found</p>;
  }

  const dealColumns = [
    { key: 'property_name', header: 'Property', sortable: true },
    { key: 'deal_date', header: 'Date', sortable: true },
    { key: 'rent_amount', header: 'Rent' },
    { key: 'commission_amount', header: 'Commission' },
    {
      key: 'status',
      header: 'Status',
      render: (item: DealOutput) => (
        <Badge variant={DEAL_STATUS_VARIANT[item.status] ?? 'default'}>{item.status}</Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={agent.user_name} backHref="/agents" />
      {error ? <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p> : null}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Total Deals</p>
          <p className="text-xl font-bold">{agent.total_deals}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Total Revenue</p>
          <p className="text-xl font-bold">{agent.total_revenue}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Commission Rate</p>
          <p className="text-xl font-bold">{agent.commission_rate}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs text-neutral-500">Active</p>
          <Badge variant={agent.is_active ? 'success' : 'default'}>
            {agent.is_active ? 'Yes' : 'No'}
          </Badge>
        </div>
      </div>
      <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-medium text-neutral-500">Create Deal</h3>
        <form onSubmit={handleSubmit(onCreateDeal)} className="flex items-end gap-4">
          <FormField label="Property ID" error={errors.property_id?.message} required>
            <input
              type="number"
              {...register('property_id')}
              className="w-32 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Deal Date" error={errors.deal_date?.message} required>
            <input
              type="date"
              {...register('deal_date')}
              className="w-40 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Rent Amount" error={errors.rent_amount?.message} required>
            <input
              {...register('rent_amount')}
              className="w-32 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Status" error={errors.status?.message} required>
            <select
              {...register('status')}
              className="w-32 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">--</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </FormField>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Deal
          </button>
        </form>
      </div>
      <DataTable
        columns={dealColumns}
        data={deals}
        keyExtractor={(item) => String(item.id)}
        emptyMessage="No deals yet"
      />
    </>
  );
}
