'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { PropertySelect, TenantSelect } from '@/components/ui/entity-selects';
import { Form } from '@/components/ui/form';
import { EntityField, SelectField, TextareaField, TextField } from '@/components/ui/form-fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { createApiSubmit } from '@/libs/forms';
import { useRouter } from '@/libs/I18nNavigation';
import type { ServiceRequestOutput } from '@/types/maintenance';

const schema = z.object({
  property_id: z.coerce.number().min(1),
  tenant_id: z.coerce.number().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.string().optional(),
});

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

/**
 * New service request page — form for creating a maintenance request.
 * @returns The new service request page component.
 */
export default function NewServiceRequestPage() {
  const t = useTranslations('Pages');
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = createApiSubmit(form, {
    submit: async (values) =>
      await apiFetch<ServiceRequestOutput>('/maintenance/requests/', {
        method: 'POST',
        body: values,
      }),
    success: 'Request created',
    error: 'Failed to create request',
    onSuccess: (created) => router.push(`/maintenance/${created.id}`),
  });

  const { isSubmitting } = form.formState;

  return (
    <>
      <PageHeader title={t('new_service_request')} backHref="/maintenance" />
      <Form {...form}>
        <form onSubmit={onSubmit} className="max-w-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <EntityField control={form.control} name="property_id" label="Property" required>
              {(field, invalid) => (
                <PropertySelect
                  id="property_id"
                  // SAFETY: Form field value for property_id is number, null, or undefined
                  value={field.value as number | null | undefined}
                  onChange={(v) => field.onChange(v)}
                  aria-invalid={invalid}
                />
              )}
            </EntityField>
            <EntityField control={form.control} name="tenant_id" label="Tenant" required>
              {(field, invalid) => (
                <TenantSelect
                  id="tenant_id"
                  // SAFETY: Form field value for tenant_id is number, null, or undefined
                  value={field.value as number | null | undefined}
                  onChange={(v) => field.onChange(v)}
                  aria-invalid={invalid}
                />
              )}
            </EntityField>
          </div>
          <TextField control={form.control} name="title" label="Title" required />
          <TextareaField
            control={form.control}
            name="description"
            label="Description"
            rows={4}
            required
          />
          <SelectField
            control={form.control}
            name="priority"
            label="Priority"
            options={PRIORITY_OPTIONS}
            placeholder="Select priority"
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {isSubmitting ? 'Creating…' : 'Create Request'}
          </Button>
        </form>
      </Form>
    </>
  );
}
