'use client';

import { Loader2Icon } from 'lucide-react';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import { FormLoading } from '@/components/ui/detail';
import { Form } from '@/components/ui/form';
import { SelectField, TextareaField, TextField } from '@/components/ui/form-fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { useEntityForm } from '@/hooks/useEntityForm';
import { apiFetch } from '@/libs/api';
import { createApiSubmit } from '@/libs/forms';
import { useRouter } from '@/libs/I18nNavigation';
import { PAYMENT_METHOD_OPTIONS, paymentEditSchema } from '@/libs/schemas/payment';
import { CURRENCY_OPTIONS } from '@/libs/schemas/property';
import type { PaymentOutput } from '@/types/finance';

/**
 * Edit form for an existing payment.
 * @param props - Page props containing the route params.
 * @returns Payment edit page.
 */
export default function EditPaymentPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();

  const { form, loading } = useEntityForm({
    path: `/finance/payments/${params.id}/`,
    schema: paymentEditSchema,
    errorMessage: 'Failed to load payment',
    toFormValues: (p: PaymentOutput) => ({
      amount: p.amount,
      currency: p.currency,
      payment_date: p.payment_date,
      due_date: p.due_date,
      method: p.method,
      notes: p.notes ?? undefined,
    }),
  });

  const onSubmit = createApiSubmit(form, {
    submit: async (values) =>
      await apiFetch(`/finance/payments/${params.id}/`, { method: 'PATCH', body: values }),
    success: 'Payment updated',
    error: 'Failed to update payment',
    onSuccess: () => router.push(`/finance/payments/${params.id}`),
  });

  const { isSubmitting } = form.formState;

  if (loading) {
    return (
      <>
        <PageHeader title="Edit Payment" backHref={`/finance/payments/${params.id}`} />
        <FormLoading fields={5} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Edit Payment" backHref={`/finance/payments/${params.id}`} />
      <Form {...form}>
        <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField control={form.control} name="amount" label="Amount" required />
            <SelectField
              control={form.control}
              name="currency"
              label="Currency"
              options={CURRENCY_OPTIONS}
              placeholder="Select currency"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              control={form.control}
              name="payment_date"
              label="Payment Date"
              type="date"
              required
            />
            <TextField
              control={form.control}
              name="due_date"
              label="Due Date"
              type="date"
              required
            />
          </div>
          <SelectField
            control={form.control}
            name="method"
            label="Method"
            options={PAYMENT_METHOD_OPTIONS}
            placeholder="Select method"
          />
          <TextareaField control={form.control} name="notes" label="Notes" rows={3} />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </Form>
    </>
  );
}
