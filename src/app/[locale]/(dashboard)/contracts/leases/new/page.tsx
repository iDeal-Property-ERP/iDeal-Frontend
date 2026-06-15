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
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { LeaseOutput } from '@/types/contract';

const schema = z.object({
  property_id: z.coerce.number().min(1),
  owner_agreement_id: z.coerce.number().min(1),
  tenant_id: z.coerce.number().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  monthly_rent: z.string().min(1),
  deposit: z.string().min(1),
  status: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

/**
 * Renders the new lease creation form and submits it to the API.
 * @returns New lease form page element.
 */
export default function NewLeasePage() {
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
      const created = await apiFetch<LeaseOutput>('/leases/', { method: 'POST', body: data });
      router.push(`/contracts/leases/${created.id}`);
    } catch (_error) {
      setError(_error instanceof Error ? _error.message : 'Failed to create lease');
    }
    setSubmitting(false);
  };

  return (
    <>
      <PageHeader title={t('new_lease')} backHref="/contracts/leases" />
      {error ? (
        <p className="mb-4 rounded bg-danger-subtle p-3 text-sm text-danger">{error}</p>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Property ID" error={errors.property_id?.message} required>
            <Input type="number" {...register('property_id')} />
          </FormField>
          <FormField label="Agreement ID" error={errors.owner_agreement_id?.message} required>
            <Input type="number" {...register('owner_agreement_id')} />
          </FormField>
          <FormField label="Tenant ID" error={errors.tenant_id?.message} required>
            <Input type="number" {...register('tenant_id')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Date" error={errors.start_date?.message} required>
            <Input type="date" {...register('start_date')} />
          </FormField>
          <FormField label="End Date" error={errors.end_date?.message} required>
            <Input type="date" {...register('end_date')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Monthly Rent" error={errors.monthly_rent?.message} required>
            <Input {...register('monthly_rent')} />
          </FormField>
          <FormField label="Deposit" error={errors.deposit?.message} required>
            <Input {...register('deposit')} />
          </FormField>
        </div>
        <FormField label="Status" error={errors.status?.message}>
          <Select {...register('status')}>
            <option value="">--</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="renewed">Renewed</option>
            <option value="terminated">Terminated</option>
          </Select>
        </FormField>
        <Button type="submit" intent="primary" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Lease'}
        </Button>
      </form>
    </>
  );
}
