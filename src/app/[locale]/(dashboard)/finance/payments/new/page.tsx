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
      {error ? <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p> : null}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Lease ID" error={errors.lease_id?.message} required>
            <input
              type="number"
              {...register('lease_id')}
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
          <FormField label="Paid By ID" error={errors.paid_by_id?.message} required>
            <input
              type="number"
              {...register('paid_by_id')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Amount" error={errors.amount?.message} required>
            <input
              {...register('amount')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Currency" error={errors.currency?.message} required>
            <select
              {...register('currency')}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">--</option>
              <option value="USD">USD</option>
              <option value="UZS">UZS</option>
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Payment Date" error={errors.payment_date?.message} required>
            <input
              type="date"
              {...register('payment_date')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Due Date" error={errors.due_date?.message} required>
            <input
              type="date"
              {...register('due_date')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Status" error={errors.status?.message} required>
            <select
              {...register('status')}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">--</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </FormField>
          <FormField label="Method" error={errors.method?.message} required>
            <select
              {...register('method')}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">--</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="online">Online</option>
            </select>
          </FormField>
        </div>
        <FormField label="Notes" error={errors.notes?.message}>
          <textarea
            {...register('notes')}
            rows={2}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </FormField>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Payment'}
        </button>
      </form>
    </>
  );
}
