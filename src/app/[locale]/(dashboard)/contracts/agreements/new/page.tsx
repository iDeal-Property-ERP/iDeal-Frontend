'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { OwnerSelect, PropertySelect } from '@/components/ui/entity-selects';
import { Form } from '@/components/ui/form';
import {
  DateField,
  EntityField,
  SelectField,
  TextareaField,
  TextField,
} from '@/components/ui/form-fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { createApiSubmit } from '@/libs/forms';
import { useRouter } from '@/libs/I18nNavigation';
import type { OwnerAgreementOutput } from '@/types/contract';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'terminated', label: 'Terminated' },
];

const schema = z
  .object({
    owner_id: z.coerce.number().min(1),
    property_id: z.coerce.number().min(1),
    agreement_number: z.string().min(1),
    signed_date: z.string().min(1),
    start_date: z.string().min(1),
    end_date: z.string().min(1),
    status: z.string().optional(),
    terms: z.string().optional().nullable(),
    commission_rate: z
      .string()
      .min(1, 'Required')
      .refine((v) => {
        const n = Number(v);
        return !Number.isNaN(n) && n >= 0 && n <= 100;
      }, 'Must be between 0 and 100'),
  })
  .refine((d) => new Date(d.end_date) > new Date(d.start_date), {
    message: 'End date must be after start date',
    path: ['end_date'],
  })
  .refine((d) => new Date(d.signed_date) <= new Date(d.start_date), {
    message: 'Signed date must be on or before start date',
    path: ['signed_date'],
  });

/**
 * Renders the new owner agreement creation form and submits it to the API.
 * @returns New agreement form page element.
 */
export default function NewAgreementPage() {
  const t = useTranslations('Pages');
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = createApiSubmit(form, {
    submit:  async (values) =>
      apiFetch<OwnerAgreementOutput>('/contracts/owner-agreements/', {
        method: 'POST',
        body: values,
      }),
    success: 'Agreement created',
    error: 'Failed to create agreement',
    onSuccess: (created) => router.push(`/contracts/agreements/${created.id}`),
  });

  const { isSubmitting } = form.formState;

  return (
    <>
      <PageHeader title={t('new_agreement')} backHref="/contracts/agreements" />
      <Form {...form}>
        <form onSubmit={onSubmit} className="max-w-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <EntityField control={form.control} name="owner_id" label="Owner" required>
              {(field, invalid) => (
                <OwnerSelect
                  id="owner_id"
                  value={field.value as number | null | undefined}
                  onChange={field.onChange}
                  aria-invalid={invalid}
                />
              )}
            </EntityField>
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
          </div>
          <TextField
            control={form.control}
            name="agreement_number"
            label="Agreement Number"
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <DateField control={form.control} name="signed_date" label="Signed Date" required />
            <DateField control={form.control} name="start_date" label="Start Date" required />
            <DateField control={form.control} name="end_date" label="End Date" required />
          </div>
          <TextField
            control={form.control}
            name="commission_rate"
            label="Commission Rate"
            required
          />
          <SelectField
            control={form.control}
            name="status"
            label="Status"
            options={STATUS_OPTIONS}
            placeholder="Select status"
          />
          <TextareaField control={form.control} name="terms" label="Terms" rows={3} />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {isSubmitting ? 'Saving…' : 'Create Agreement'}
          </Button>
        </form>
      </Form>
    </>
  );
}
