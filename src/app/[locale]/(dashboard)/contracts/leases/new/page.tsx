'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { LeaseOutput } from '@/types/contract';

const schema = z.object({
  property_id: z.coerce.number().min(1),
  owner_agreement_id: z.coerce.number().min(1),
  tenant_id: z.coerce.number().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  monthly_rent: z.string().min(1),
  deposit: z.string().min(1),
  status: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewLeasePage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError(null);
    try {
      const created = await apiFetch<LeaseOutput>('/leases/', { method: 'POST', body: data });
      router.push(`/contracts/leases/${created.id}`);
    } catch (_error) {
      setError(_error instanceof Error ? _error.message : 'Failed to create lease');
    }
    setSubmitting(false);
  };

  return (
    <>
      <PageHeader title={t('new_lease')} backHref="/contracts/leases" />
      {error ? <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p> : null}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Property ID" error={errors.property_id?.message} required>
            <input
              type="number"
              {...register('property_id')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Agreement ID" error={errors.owner_agreement_id?.message} required>
            <input
              type="number"
              {...register('owner_agreement_id')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Tenant ID" error={errors.tenant_id?.message} required>
            <input
              type="number"
              {...register('tenant_id')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Date" error={errors.start_date?.message} required>
            <input
              type="date"
              {...register('start_date')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="End Date" error={errors.end_date?.message} required>
            <input
              type="date"
              {...register('end_date')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Monthly Rent" error={errors.monthly_rent?.message} required>
            <input
              {...register('monthly_rent')}
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
        <FormField label="Status" error={errors.status?.message}>
          <select
            {...register('status')}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">--</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="renewed">Renewed</option>
            <option value="terminated">Terminated</option>
          </select>
        </FormField>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Lease'}
        </button>
      </form>
    </>
  );
}
