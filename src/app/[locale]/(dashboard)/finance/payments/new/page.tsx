'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { PaymentOutput } from '@/types/finance';

const schema = z.object({
  lease_id: z.coerce.number().min(1),
  tenant_id: z.coerce.number().min(1),
  paid_by_id: z.coerce.number().min(1),
  amount: z.string().min(1),
  currency: z.string().min(1),
  payment_date: z.string().min(1),
  due_date: z.string().min(1),
  status: z.string().min(1),
  method: z.string().min(1),
  notes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

/**
 * Renders the new payment creation form with validation and submission.
 * @returns New payment form page element.
 */
export default function NewPaymentPage() {
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
      await apiFetch<PaymentOutput>('/payments/', { method: 'POST', body: data });
      router.push('/finance/payments');
    } catch (_error) {
      setError(_error instanceof Error ? _error.message : 'Failed to create payment');
    }
    setSubmitting(false);
  };

  return (
    <>
      <PageHeader title={t('new_payment')} backHref="/finance/payments" />
      {error ? (
        <p className="mb-4 rounded bg-danger-subtle p-3 text-sm text-danger">{error}</p>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Lease ID" error={errors.lease_id?.message} required>
            <Input type="number" {...register('lease_id')} />
          </FormField>
          <FormField label="Tenant ID" error={errors.tenant_id?.message} required>
            <Input type="number" {...register('tenant_id')} />
          </FormField>
          <FormField label="Paid By ID" error={errors.paid_by_id?.message} required>
            <Input type="number" {...register('paid_by_id')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Amount" error={errors.amount?.message} required>
            <Input {...register('amount')} />
          </FormField>
          <FormField label="Currency" error={errors.currency?.message} required>
            <Select {...register('currency')}>
              <option value="">--</option>
              <option value="USD">USD</option>
              <option value="UZS">UZS</option>
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Payment Date" error={errors.payment_date?.message} required>
            <Input type="date" {...register('payment_date')} />
          </FormField>
          <FormField label="Due Date" error={errors.due_date?.message} required>
            <Input type="date" {...register('due_date')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Status" error={errors.status?.message} required>
            <Select {...register('status')}>
              <option value="">--</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </FormField>
          <FormField label="Method" error={errors.method?.message} required>
            <Select {...register('method')}>
              <option value="">--</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="online">Online</option>
            </Select>
          </FormField>
        </div>
        <FormField label="Notes" error={errors.notes?.message}>
          <Textarea {...register('notes')} rows={2} />
        </FormField>
        <Button type="submit" intent="primary" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Payment'}
        </Button>
      </form>
    </>
  );
}
