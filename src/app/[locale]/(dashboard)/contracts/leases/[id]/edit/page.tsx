'use client';

import { Loader2Icon } from 'lucide-react';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import { FormLoading } from '@/components/ui/detail';
import { Form } from '@/components/ui/form';
import { DateField, SelectField, TextField } from '@/components/ui/form-fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { useEntityForm } from '@/hooks/useEntityForm';
import { apiFetch } from '@/libs/api';
import { createApiSubmit } from '@/libs/forms';
import { useRouter } from '@/libs/I18nNavigation';
import { LEASE_STATUS_OPTIONS, leaseEditSchema } from '@/libs/schemas/lease';
import type { LeaseOutput } from '@/types/contract';

/**
 * Edit form for an existing lease (dates, rent, deposit, status).
 * @param props - Page props containing the route params.
 * @returns Lease edit page.
 */
export default function EditLeasePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();

  const { form, loading } = useEntityForm({
    path: `/contracts/leases/${params.id}/`,
    schema: leaseEditSchema,
    errorMessage: 'Failed to load lease',
    toFormValues: (l: LeaseOutput) => ({
      start_date: l.start_date,
      end_date: l.end_date,
      monthly_rent: l.monthly_rent,
      deposit: l.deposit,
      status: l.status,
    }),
  });

  const onSubmit = createApiSubmit(form, {
    submit: async (values) =>
      await apiFetch(`/contracts/leases/${params.id}/`, { method: 'PATCH', body: values }),
    success: 'Lease updated',
    error: 'Failed to update lease',
    onSuccess: () => router.push(`/contracts/leases/${params.id}`),
  });

  const { isSubmitting } = form.formState;

  if (loading) {
    return (
      <>
        <PageHeader title="Edit Lease" backHref={`/contracts/leases/${params.id}`} />
        <FormLoading fields={5} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Edit Lease" backHref={`/contracts/leases/${params.id}`} />
      <Form {...form}>
        <form onSubmit={onSubmit} className="max-w-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <DateField control={form.control} name="start_date" label="Start Date" required />
            <DateField control={form.control} name="end_date" label="End Date" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              control={form.control}
              name="monthly_rent"
              label="Monthly Rent"
              type="number"
              step="0.01"
              required
            />
            <TextField
              control={form.control}
              name="deposit"
              label="Deposit"
              type="number"
              step="0.01"
              required
            />
          </div>
          <SelectField
            control={form.control}
            name="status"
            label="Status"
            options={LEASE_STATUS_OPTIONS}
            placeholder="Select status"
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </Form>
    </>
  );
}
