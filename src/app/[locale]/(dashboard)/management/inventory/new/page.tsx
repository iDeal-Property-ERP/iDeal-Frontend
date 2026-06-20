'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { LeaseSelect, PropertySelect } from '@/components/ui/entity-selects';
import { Form } from '@/components/ui/form';
import { EntityField, SelectField, TextareaField } from '@/components/ui/form-fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { createApiSubmit } from '@/libs/forms';
import { useRouter } from '@/libs/I18nNavigation';
import type { InventoryActOutput } from '@/types/inventory';

const schema = z.object({
  property_id: z.coerce.number().min(1),
  lease_id: z.coerce.number().optional(),
  act_type: z.string().optional(),
  notes: z.string().optional(),
});

const ACT_TYPE_OPTIONS = [
  { value: 'handover', label: 'handover' },
  { value: 'return', label: 'return' },
  { value: 'general', label: 'general' },
];

/**
 * Create a draft inventory act.
 * @returns New inventory act form.
 */
export default function NewInventoryActPage() {
  const t = useTranslations('Pages');
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = createApiSubmit(form, {
    submit:  async (data) => {
      const body: Record<string, unknown> = {
        property_id: data.property_id,
        act_type: data.act_type,
        notes: data.notes,
      };
      if (data.lease_id) {
        body.lease_id = data.lease_id;
      }
      return apiFetch<InventoryActOutput>('/inventory/acts/', { method: 'POST', body });
    },
    success: t('inventory_create'),
    error: t('inventory_create_error'),
    onSuccess: (created) => router.push(`/management/inventory/${created.id}`),
  });

  const { isSubmitting } = form.formState;

  return (
    <>
      <PageHeader title={t('inventory_new')} backHref="/management/inventory" />
      <Form {...form}>
        <form onSubmit={onSubmit} className="max-w-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <EntityField
              control={form.control}
              name="property_id"
              label={t('inventory_property_id')}
              required
            >
              {(field, invalid) => (
                <PropertySelect
                  id="property_id"
                  value={field.value as number | null | undefined}
                  onChange={field.onChange}
                  aria-invalid={invalid}
                />
              )}
            </EntityField>
            <EntityField control={form.control} name="lease_id" label={t('inventory_lease_id')}>
              {(field, invalid) => (
                <LeaseSelect
                  id="lease_id"
                  value={field.value as number | null | undefined}
                  onChange={field.onChange}
                  aria-invalid={invalid}
                />
              )}
            </EntityField>
          </div>
          <SelectField
            control={form.control}
            name="act_type"
            label={t('inventory_act_type')}
            options={ACT_TYPE_OPTIONS}
            placeholder="Select act type"
          />
          <TextareaField
            control={form.control}
            name="notes"
            label={t('inventory_notes')}
            rows={3}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {isSubmitting ? t('inventory_creating') : t('inventory_create')}
          </Button>
        </form>
      </Form>
    </>
  );
}
