'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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

/**
 * New service request page — form for creating a maintenance request.
 * @returns The new service request page component.
 */
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
      const created = await apiFetch<ServiceRequestOutput>('/maintenance/requests/', {
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
      {error ? (
        <p className="mb-4 rounded-lg border border-danger/30 bg-danger-subtle p-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Property ID" error={errors.property_id?.message} required>
            <Input type="number" {...register('property_id')} />
          </FormField>
          <FormField label="Tenant ID" error={errors.tenant_id?.message} required>
            <Input type="number" {...register('tenant_id')} />
          </FormField>
        </div>
        <FormField label="Title" error={errors.title?.message} required>
          <Input {...register('title')} />
        </FormField>
        <FormField label="Description" error={errors.description?.message} required>
          <Textarea {...register('description')} rows={4} />
        </FormField>
        <FormField label="Priority" error={errors.priority?.message}>
          <Select {...register('priority')}>
            <option value="">--</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
        </FormField>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Request'}
        </Button>
      </form>
    </>
  );
}
