'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { LeaseOutput } from '@/types/contract';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  active: 'success',
  expired: 'danger',
  renewed: 'info',
  terminated: 'warning',
};

const renewSchema = z.object({
  new_start_date: z.string().min(1),
  new_end_date: z.string().min(1),
  new_monthly_rent: z.string().min(1),
  deposit: z.string().min(1),
});

type RenewForm = z.infer<typeof renewSchema>;

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
    return <p className="text-sm text-neutral-400">Loading...</p>;
  }
  if (!lease) {
    return <p className="text-sm text-red-500">Lease not found</p>;
  }

  return (
    <>
      <PageHeader title={`Lease #${lease.id}`} backHref="/contracts/leases" />
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-medium text-neutral-500">Lease Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Property</dt>
              <dd>{lease.property_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Tenant</dt>
              <dd>{lease.tenant_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Agreement</dt>
              <dd>{lease.owner_agreement_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Status</dt>
              <dd>
                <Badge variant={STATUS_VARIANT[lease.status] ?? 'default'}>{lease.status}</Badge>
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-medium text-neutral-500">Dates &amp; Payments</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Start</dt>
              <dd>{lease.start_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">End</dt>
              <dd>{lease.end_date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Monthly Rent</dt>
              <dd className="font-semibold">{lease.monthly_rent}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Deposit</dt>
              <dd>{lease.deposit}</dd>
            </div>
          </dl>
        </div>
      </div>
      {lease.status === 'active' || lease.status === 'renewed' ? (
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-medium text-neutral-500">Renew Lease</h3>
          {renewError ? (
            <p className="mb-3 rounded bg-red-50 p-2 text-xs text-red-600">{renewError}</p>
          ) : null}
          <form onSubmit={handleSubmit(onRenew)} className="max-w-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="New Start Date" error={errors.new_start_date?.message} required>
                <input
                  type="date"
                  {...register('new_start_date')}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </FormField>
              <FormField label="New End Date" error={errors.new_end_date?.message} required>
                <input
                  type="date"
                  {...register('new_end_date')}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="New Monthly Rent" error={errors.new_monthly_rent?.message} required>
                <input
                  {...register('new_monthly_rent')}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </FormField>
              <FormField label="Deposit" error={errors.deposit?.message} required>
                <input
                  {...register('deposit')}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </FormField>
            </div>
            <button
              type="submit"
              disabled={renewing}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {renewing ? 'Renewing...' : 'Renew Lease'}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
