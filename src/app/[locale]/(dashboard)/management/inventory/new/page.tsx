'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { InventoryActOutput } from '@/types/inventory';

const schema = z.object({
  property_id: z.coerce.number().min(1),
  lease_id: z.coerce.number().optional(),
  act_type: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

/**
 * Create a draft inventory act.
 * @returns New inventory act form.
 */
export default function NewInventoryActPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        property_id: data.property_id,
        act_type: data.act_type,
        notes: data.notes,
      };
      if (data.lease_id) {
        body.lease_id = data.lease_id;
      }
      const created = await apiFetch<InventoryActOutput>('/inventory/acts/', {
        method: 'POST',
        body,
      });
      router.push(`/management/inventory/${created.id}`);
    } catch (_error) {
      setError(_error instanceof Error ? _error.message : t('inventory_create_error'));
    }
    setSubmitting(false);
  };

  return (
    <>
      <PageHeader title={t('inventory_new')} backHref="/management/inventory" />
      {error ? (
        <p className="mb-4 rounded bg-danger-subtle p-3 text-sm text-danger">{error}</p>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label={t('inventory_property_id')}
            error={errors.property_id?.message}
            required
          >
            <Input type="number" {...register('property_id')} />
          </FormField>
          <FormField label={t('inventory_lease_id')} error={errors.lease_id?.message}>
            <Input type="number" {...register('lease_id')} />
          </FormField>
        </div>
        <FormField label={t('inventory_act_type')}>
          <Select {...register('act_type')}>
            <option value="general">general</option>
            <option value="handover">handover</option>
            <option value="return">return</option>
          </Select>
        </FormField>
        <FormField label={t('inventory_notes')}>
          <Textarea {...register('notes')} rows={3} />
        </FormField>
        <Button type="submit" disabled={submitting}>
          {submitting ? t('inventory_creating') : t('inventory_create')}
        </Button>
      </form>
    </>
  );
}
