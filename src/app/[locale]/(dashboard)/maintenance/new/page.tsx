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
import type { ServiceRequestOutput } from '@/types/maintenance';

const schema = z.object({
  property_id: z.coerce.number().min(1),
  tenant_id: z.coerce.number().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewServiceRequestPage() {
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
      const created = await apiFetch<ServiceRequestOutput>('/service-requests/', {
        method: 'POST',
        body: data,
      });
      router.push(`/maintenance/${created.id}`);
    } catch (_error) {
      setError(_error instanceof Error ? _error.message : 'Failed to create request');
    }
    setSubmitting(false);
  };

  return (
    <>
      <PageHeader title={t('new_service_request')} backHref="/maintenance" />
      {error ? <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p> : null}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Property ID" error={errors.property_id?.message} required>
            <input
              type="number"
              {...register('property_id')}
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
        <FormField label="Title" error={errors.title?.message} required>
          <input
            {...register('title')}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </FormField>
        <FormField label="Description" error={errors.description?.message} required>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </FormField>
        <FormField label="Priority" error={errors.priority?.message}>
          <select
            {...register('priority')}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">--</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </FormField>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Request'}
        </button>
      </form>
    </>
  );
}
