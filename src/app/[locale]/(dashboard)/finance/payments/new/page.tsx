'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { LeaseSelect, TenantSelect, UserSelect } from '@/components/ui/entity-selects';
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
import type { PaymentOutput } from '@/types/finance';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'UZS', label: 'UZS' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'online', label: 'Online' },
];

const schema = z.object({
  lease_id: z.coerce.number().min(1),
  tenant_id: z.coerce.number().min(1),
  paid_by_id: z.coerce.number().min(1),
  amount: z
    .string()
    .min(1, 'Required')
    .refine((v) => Number(v) > 0, 'Must be a positive number'),
  currency: z.string().min(1),
  payment_date: z.string().min(1),
  due_date: z.string().min(1),
  status: z.string().min(1),
  method: z.string().min(1),
  notes: z.string().optional().nullable(),
});

/**
 * Renders the new payment creation form with validation and submission.
 * @returns New payment form page element.
 */
export default function NewPaymentPage() {
  const t = useTranslations('Pages');
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = createApiSubmit(form, {
    submit: async (values) =>
      await apiFetch<PaymentOutput>('/finance/payments/', { method: 'POST', body: values }),
    success: 'Payment created',
    error: 'Failed to create payment',
    onSuccess: () => router.push('/finance/payments'),
  });

  const { isSubmitting } = form.formState;

  return (
    <>
      <PageHeader title={t('new_payment')} backHref="/finance/payments" />
      <Form {...form}>
        <form onSubmit={onSubmit} className="max-w-xl space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <EntityField control={form.control} name="lease_id" label="Lease" required>
              {(field, invalid) => (
                <LeaseSelect
                  id="lease_id"
                  // SAFETY: Form field value for lease_id is number, null, or undefined
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
            <EntityField control={form.control} name="paid_by_id" label="Paid By" required>
              {(field, invalid) => (
                <UserSelect
                  id="paid_by_id"
                  // SAFETY: Form field value for paid_by_id is number, null, or undefined
                  value={field.value as number | null | undefined}
                  onChange={(v) => field.onChange(v)}
                  aria-invalid={invalid}
                />
              )}
            </EntityField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField control={form.control} name="amount" label="Amount" required />
            <SelectField
              control={form.control}
              name="currency"
              label="Currency"
              required
              options={CURRENCY_OPTIONS}
              placeholder="Currency"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DateField control={form.control} name="payment_date" label="Payment Date" required />
            <DateField control={form.control} name="due_date" label="Due Date" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              control={form.control}
              name="status"
              label="Status"
              required
              options={STATUS_OPTIONS}
              placeholder="Select status"
            />
            <SelectField
              control={form.control}
              name="method"
              label="Method"
              required
              options={METHOD_OPTIONS}
              placeholder="Select method"
            />
          </div>
          <TextareaField control={form.control} name="notes" label="Notes" rows={2} />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {isSubmitting ? 'Saving…' : 'Create Payment'}
          </Button>
        </form>
      </Form>
    </>
  );
}
