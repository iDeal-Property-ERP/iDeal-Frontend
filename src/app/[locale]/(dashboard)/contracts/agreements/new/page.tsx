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
import type { OwnerAgreementOutput } from '@/types/contract';

const schema = z.object({
  owner_id: z.coerce.number().min(1),
  property_id: z.coerce.number().min(1),
  agreement_number: z.string().min(1),
  signed_date: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  status: z.string().optional(),
  terms: z.string().optional().nullable(),
  commission_rate: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

/**
 * Renders the new owner agreement creation form and submits it to the API.
 * @returns New agreement form page element.
 */
export default function NewAgreementPage() {
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
      const created = await apiFetch<OwnerAgreementOutput>('/owner-agreements/', {
        method: 'POST',
        body: data,
      });
      router.push(`/contracts/agreements/${created.id}`);
    } catch (_error) {
      setError(_error instanceof Error ? _error.message : 'Failed to create agreement');
    }
    setSubmitting(false);
  };

  return (
    <>
      <PageHeader title={t('new_agreement')} backHref="/contracts/agreements" />
      {error ? (
        <p className="mb-4 rounded bg-danger-subtle p-3 text-sm text-danger">{error}</p>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Owner ID" error={errors.owner_id?.message} required>
            <Input type="number" {...register('owner_id')} />
          </FormField>
          <FormField label="Property ID" error={errors.property_id?.message} required>
            <Input type="number" {...register('property_id')} />
          </FormField>
        </div>
        <FormField label="Agreement Number" error={errors.agreement_number?.message} required>
          <Input {...register('agreement_number')} />
        </FormField>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Signed Date" error={errors.signed_date?.message} required>
            <Input type="date" {...register('signed_date')} />
          </FormField>
          <FormField label="Start Date" error={errors.start_date?.message} required>
            <Input type="date" {...register('start_date')} />
          </FormField>
          <FormField label="End Date" error={errors.end_date?.message} required>
            <Input type="date" {...register('end_date')} />
          </FormField>
        </div>
        <FormField label="Commission Rate" error={errors.commission_rate?.message} required>
          <Input {...register('commission_rate')} />
        </FormField>
        <FormField label="Status" error={errors.status?.message}>
          <Select {...register('status')}>
            <option value="">--</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
          </Select>
        </FormField>
        <FormField label="Terms" error={errors.terms?.message}>
          <Textarea {...register('terms')} rows={3} />
        </FormField>
        <Button type="submit" intent="primary" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Agreement'}
        </Button>
      </form>
    </>
  );
}
