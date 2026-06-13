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
import type { OwnerAgreementOutput } from '@/types/contract';

const schema = z.object({
  owner_id: z.coerce.number().min(1),
  property_id: z.coerce.number().min(1),
  agreement_number: z.string().min(1),
  signed_date: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  status: z.string().optional(),
  terms: z.string().optional().nullable(),
  commission_rate: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export default function NewAgreementPage() {
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
      const created = await apiFetch<OwnerAgreementOutput>('/owner-agreements/', {
        method: 'POST',
        body: data,
      });
      router.push(`/contracts/agreements/${created.id}`);
    } catch (_error) {
      setError(_error instanceof Error ? _error.message : 'Failed to create agreement');
    }
    setSubmitting(false);
  };

  return (
    <>
      <PageHeader title={t('new_agreement')} backHref="/contracts/agreements" />
      {error ? <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p> : null}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Owner ID" error={errors.owner_id?.message} required>
            <input
              type="number"
              {...register('owner_id')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Property ID" error={errors.property_id?.message} required>
            <input
              type="number"
              {...register('property_id')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
        </div>
        <FormField label="Agreement Number" error={errors.agreement_number?.message} required>
          <input
            {...register('agreement_number')}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </FormField>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Signed Date" error={errors.signed_date?.message} required>
            <input
              type="date"
              {...register('signed_date')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
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
        <FormField label="Commission Rate" error={errors.commission_rate?.message} required>
          <input
            {...register('commission_rate')}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </FormField>
        <FormField label="Status" error={errors.status?.message}>
          <select
            {...register('status')}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">--</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
          </select>
        </FormField>
        <FormField label="Terms" error={errors.terms?.message}>
          <textarea
            {...register('terms')}
            rows={3}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </FormField>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Agreement'}
        </button>
      </form>
    </>
  );
}
