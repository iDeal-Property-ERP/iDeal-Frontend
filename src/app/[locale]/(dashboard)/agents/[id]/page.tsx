'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/select';
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

/**
 * Agent detail page showing stats and deal management for a single agent.
 * @param props - Page props containing the agent id route param.
 * @returns Agent detail page element.
 */
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
      apiFetch<PaginatedData<DealOutput>>(`/agents/${params.id}/deals/`, { query: { page: 1 } }),
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
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }
  if (!agent) {
    return <p className="text-sm text-danger">Agent not found</p>;
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
      {error ? (
        <p className="mb-4 rounded bg-danger-subtle p-3 text-sm text-danger">{error}</p>
      ) : null}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Deals</p>
          <p className="text-xl font-bold">{agent.total_deals}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-xl font-bold">{agent.total_revenue}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Commission Rate</p>
          <p className="text-xl font-bold">{agent.commission_rate}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active</p>
          <Badge variant={agent.is_active ? 'success' : 'default'}>
            {agent.is_active ? 'Yes' : 'No'}
          </Badge>
        </div>
      </div>
      <div className="mb-6 rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Create Deal</h3>
        <form onSubmit={handleSubmit(onCreateDeal)} className="flex items-end gap-4">
          <FormField label="Property ID" error={errors.property_id?.message} required>
            <Input type="number" {...register('property_id')} className="w-32" />
          </FormField>
          <FormField label="Deal Date" error={errors.deal_date?.message} required>
            <Input type="date" {...register('deal_date')} className="w-40" />
          </FormField>
          <FormField label="Rent Amount" error={errors.rent_amount?.message} required>
            <Input {...register('rent_amount')} className="w-32" />
          </FormField>
          <FormField label="Status" error={errors.status?.message} required>
            <Select {...register('status')} className="w-32">
              <option value="">--</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </FormField>
          <Button type="submit" variant="default">
            Create Deal
          </Button>
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
