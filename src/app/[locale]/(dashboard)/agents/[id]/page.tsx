'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { Loader2Icon } from 'lucide-react';
import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { DetailCard, DetailError, DetailLoading, DetailStat } from '@/components/ui/detail';
import { PropertySelect } from '@/components/ui/entity-selects';
import { Form } from '@/components/ui/form';
import { DateField, EntityField, SelectField, TextField } from '@/components/ui/form-fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { createApiSubmit } from '@/libs/forms';
import type { AgentOutput, DealOutput } from '@/types/agent';
import type { PaginatedData } from '@/types/api';

const DEAL_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default'> = {
  closed: 'success',
  pending: 'warning',
  cancelled: 'default',
};

const dealSchema = z.object({
  property_id: z.coerce.number().min(1, 'Property is required'),
  deal_date: z.string().min(1, 'Deal date is required'),
  rent_amount: z.coerce.number().positive('Rent amount must be greater than 0'),
  status: z.string().min(1, 'Status is required'),
});

const DEAL_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

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

  const form = useForm({
    resolver: zodResolver(dealSchema),
  });

  const fetchData = async () => {
    setLoading(true);
    return await Promise.all([
      apiFetch<AgentOutput>(`/agents/${params.id}/`),
      apiFetch<PaginatedData<DealOutput>>(`/agents/${params.id}/deals/`, { query: { page: 1 } }),
    ])
      .then(([agentData, dealsData]) => {
        setAgent(agentData);
        setDeals(dealsData.page.object_list);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const onCreateDeal = createApiSubmit(form, {
    submit: async (values) =>
      await apiFetch<DealOutput>(`/agents/${params.id}/deals/`, { method: 'POST', body: values }),
    success: 'Deal created',
    error: 'Failed to create deal',
    onSuccess: async () => {
      form.reset();
      await fetchData();
    },
  });

  const { isSubmitting } = form.formState;

  if (loading) {
    return <DetailLoading />;
  }
  if (!agent) {
    return <DetailError message="Agent not found" />;
  }

  const dealColumns: ColumnDef<DealOutput>[] = [
    { accessorKey: 'property_name', header: 'Property' },
    { accessorKey: 'deal_date', header: 'Date' },
    { accessorKey: 'rent_amount', header: 'Rent' },
    { accessorKey: 'commission_amount', header: 'Commission' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={DEAL_STATUS_VARIANT[row.original.status] ?? 'default'}>
          {row.original.status}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={agent.user_name}
        backHref="/agents"
        actions={
          <Badge variant={agent.is_active ? 'success' : 'default'}>
            {agent.is_active ? 'Active' : 'Inactive'}
          </Badge>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <DetailStat label="Total Deals" value={agent.total_deals} />
        <DetailStat label="Total Revenue" value={agent.total_revenue} />
        <DetailStat label="Commission Rate" value={agent.commission_rate} />
        <DetailStat
          label="Active"
          value={
            <Badge variant={agent.is_active ? 'success' : 'default'}>
              {agent.is_active ? 'Yes' : 'No'}
            </Badge>
          }
        />
      </div>
      <DetailCard title="Create Deal" className="mb-6">
        <Form {...form}>
          <form onSubmit={onCreateDeal} className="grid grid-cols-4 items-start gap-4">
            <EntityField control={form.control} name="property_id" label="Property" required>
              {(field, invalid) => (
                <PropertySelect
                  id="property_id"
                  value={field.value as number | null | undefined}
                  onChange={field.onChange}
                  aria-invalid={invalid}
                />
              )}
            </EntityField>
            <DateField control={form.control} name="deal_date" label="Deal Date" required />
            <TextField
              control={form.control}
              name="rent_amount"
              label="Rent Amount"
              type="number"
              step="0.01"
              required
            />
            <SelectField
              control={form.control}
              name="status"
              label="Status"
              options={DEAL_STATUS_OPTIONS}
              placeholder="Select status"
            />
            <Button
              type="submit"
              variant="default"
              className="col-span-4 w-fit"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
              {isSubmitting ? 'Creating…' : 'Create Deal'}
            </Button>
          </form>
        </Form>
      </DetailCard>
      <DataTable columns={dealColumns} data={deals} emptyMessage="No deals yet" />
    </>
  );
}
