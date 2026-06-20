'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { AgreementSelect, PropertySelect, TenantSelect } from '@/components/ui/entity-selects';
import { Form } from '@/components/ui/form';
import { DateField, EntityField, SelectField, TextField } from '@/components/ui/form-fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { createApiSubmit } from '@/libs/forms';
import { useRouter } from '@/libs/I18nNavigation';
import type { LeaseOutput } from '@/types/contract';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'renewed', label: 'Renewed' },
  { value: 'terminated', label: 'Terminated' },
];

const schema = z
  .object({
    property_id: z.coerce.number().min(1),
    owner_agreement_id: z.coerce.number().min(1),
    tenant_id: z.coerce.number().min(1),
    start_date: z.string().min(1),
    end_date: z.string().min(1),
    monthly_rent: z
      .string()
      .min(1, 'Required')
      .refine((v) => Number(v) > 0, 'Must be a positive number'),
    deposit: z
      .string()
      .min(1, 'Required')
      .refine((v) => Number(v) > 0, 'Must be a positive number'),
    status: z.string().optional(),
  })
  .refine((d) => new Date(d.end_date) > new Date(d.start_date), {
    message: 'End date must be after start date',
    path: ['end_date'],
  });

/**
 * Renders the new lease creation form and submits it to the API.
 * @returns New lease form page element.
 */
export default function NewLeasePage() {
  const t = useTranslations('Pages');
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = createApiSubmit(form, {
    submit:  async (values) =>
      apiFetch<LeaseOutput>('/contracts/leases/', { method: 'POST', body: values }),
    success: 'Lease created',
    error: 'Failed to create lease',
    onSuccess: (created) => router.push(`/contracts/leases/${created.id}`),
  });

  const { isSubmitting } = form.formState;

  return (
    <>
      <PageHeader title={t('new_lease')} backHref="/contracts/leases" />
      <Form {...form}>
        <form onSubmit={onSubmit} className="max-w-xl space-y-4">
          <div className="grid grid-cols-3 gap-4">
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
            <EntityField
              control={form.control}
              name="owner_agreement_id"
              label="Agreement"
              required
            >
              {(field, invalid) => (
                <AgreementSelect
                  id="owner_agreement_id"
                  value={field.value as number | null | undefined}
                  onChange={field.onChange}
                  aria-invalid={invalid}
                />
              )}
            </EntityField>
            <EntityField control={form.control} name="tenant_id" label="Tenant" required>
              {(field, invalid) => (
                <TenantSelect
                  id="tenant_id"
                  value={field.value as number | null | undefined}
                  onChange={field.onChange}
                  aria-invalid={invalid}
                />
              )}
            </EntityField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DateField control={form.control} name="start_date" label="Start Date" required />
            <DateField control={form.control} name="end_date" label="End Date" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField control={form.control} name="monthly_rent" label="Monthly Rent" required />
            <TextField control={form.control} name="deposit" label="Deposit" required />
          </div>
          <SelectField
            control={form.control}
            name="status"
            label="Status"
            options={STATUS_OPTIONS}
            placeholder="Select status"
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {isSubmitting ? 'Saving…' : 'Create Lease'}
          </Button>
        </form>
      </Form>
    </>
  );
}
