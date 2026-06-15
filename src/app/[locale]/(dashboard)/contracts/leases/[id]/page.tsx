'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { leaseStatusVariant } from '@/libs/badges';
import type { LeaseOutput } from '@/types/contract';

const renewSchema = z.object({
  new_start_date: z.string().min(1),
  new_end_date: z.string().min(1),
  new_monthly_rent: z.string().min(1),
  deposit: z.string().min(1),
});

type RenewForm = z.infer<typeof renewSchema>;

/**
 * Displays lease detail, and renders the renewal form when the lease is active or renewed.
 * @param props - Page route params with lease ID.
 * @returns Lease detail page element.
 */
export default function LeaseDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);

  const [lease, setLease] = useState<LeaseOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(renewSchema),
  });

  useEffect(() => {
    apiFetch<LeaseOutput>(`/leases/${params.id}/`)
      .then(setLease)
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.id]);

  const onRenew = async (data: RenewForm) => {
    setRenewing(true);
    setRenewError(null);
    try {
      await apiFetch(`/leases/${params.id}/renew/`, { method: 'POST', body: data });
      const updated = await apiFetch<LeaseOutput>(`/leases/${params.id}/`);
      setLease(updated);
    } catch (_error) {
      setRenewError(_error instanceof Error ? _error.message : 'Failed to renew');
    }
    setRenewing(false);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }
  if (!lease) {
    return <p className="text-sm text-danger">Lease not found</p>;
  }

  return (
    <>
      <PageHeader title={`Lease #${lease.id}`} backHref="/contracts/leases" />
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Lease Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Property</dt>
              <dd>{lease.property_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tenant</dt>
              <dd>{lease.tenant_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Agreement</dt>
              <dd>{lease.owner_agreement_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={leaseStatusVariant(lease.status)}>{lease.status}</Badge>
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Dates &amp; Payments</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Start</dt>
              <dd>{lease.start_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">End</dt>
              <dd>{lease.end_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Monthly Rent</dt>
              <dd className="font-semibold">{lease.monthly_rent}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Deposit</dt>
              <dd>{lease.deposit}</dd>
            </div>
          </dl>
        </div>
      </div>
      {lease.status === 'active' || lease.status === 'renewed' ? (
        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">Renew Lease</h3>
          {renewError ? (
            <p className="mb-3 rounded bg-danger-subtle p-2 text-xs text-danger">{renewError}</p>
          ) : null}
          <form onSubmit={handleSubmit(onRenew)} className="max-w-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="New Start Date" error={errors.new_start_date?.message} required>
                <Input type="date" {...register('new_start_date')} />
              </FormField>
              <FormField label="New End Date" error={errors.new_end_date?.message} required>
                <Input type="date" {...register('new_end_date')} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="New Monthly Rent" error={errors.new_monthly_rent?.message} required>
                <Input {...register('new_monthly_rent')} />
              </FormField>
              <FormField label="Deposit" error={errors.deposit?.message} required>
                <Input {...register('deposit')} />
              </FormField>
            </div>
            <Button type="submit" intent="primary" disabled={renewing}>
              {renewing ? 'Renewing...' : 'Renew Lease'}
            </Button>
          </form>
        </div>
      ) : null}
    </>
  );
}
