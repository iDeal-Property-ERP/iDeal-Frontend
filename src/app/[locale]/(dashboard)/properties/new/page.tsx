'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { OwnerSelect } from '@/components/ui/entity-selects';
import { Form } from '@/components/ui/form';
import { EntityField, SelectField, TextareaField, TextField } from '@/components/ui/form-fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { createApiSubmit } from '@/libs/forms';
import { useRouter } from '@/libs/I18nNavigation';
import {
  CURRENCY_OPTIONS,
  PROPERTY_STATUS_OPTIONS,
  propertySchema,
  TARIFF_OPTIONS,
} from '@/libs/schemas/property';
import type { PropertyOutput } from '@/types/property';

/**
 * Renders the form to create a new property and submits it to the API.
 * @returns New property form page.
 */
export default function NewPropertyPage() {
  const t = useTranslations('Pages');
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(propertySchema),
  });

  const onSubmit = createApiSubmit(form, {
    submit: async (values) =>
      await apiFetch<PropertyOutput>('/properties/', { method: 'POST', body: values }),
    success: 'Property created',
    error: 'Failed to create property',
    onSuccess: (created) => router.push(`/properties/${created.id}`),
  });

  const { isSubmitting } = form.formState;

  return (
    <>
      <PageHeader title={t('new_property')} backHref="/properties" />
      <Form {...form}>
        <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField control={form.control} name="name" label="Name" required />
            <TextField control={form.control} name="address" label="Address" required />
          </div>
          <div className="grid grid-cols-3 gap-4">
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
            <TextField
              control={form.control}
              name="district_id"
              label="District ID"
              type="number"
              required
            />
            <TextField
              control={form.control}
              name="rooms"
              label="Rooms"
              type="number"
              step="1"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <TextField
              control={form.control}
              name="area_sqm"
              label="Area (m²)"
              type="number"
              step="0.01"
              required
            />
            <TextField
              control={form.control}
              name="floor"
              label="Floor"
              type="number"
              step="1"
              required
            />
            <TextField
              control={form.control}
              name="total_floors"
              label="Total Floors"
              type="number"
              step="1"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <TextField control={form.control} name="ask_price" label="Ask Price" required />
            <TextField
              control={form.control}
              name="owner_guaranteed_price"
              label="Owner Guaranteed Price"
              required
            />
            <TextField
              control={form.control}
              name="tenant_charge_price"
              label="Tenant Charge Price"
              required
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <SelectField
              control={form.control}
              name="status"
              label="Status"
              options={PROPERTY_STATUS_OPTIONS}
              placeholder="Select status"
            />
            <SelectField
              control={form.control}
              name="tariff"
              label="Tariff"
              options={TARIFF_OPTIONS}
              placeholder="Select tariff"
            />
            <SelectField
              control={form.control}
              name="ask_currency"
              label="Currency (Ask)"
              options={CURRENCY_OPTIONS}
              placeholder="Currency"
            />
            <TextField control={form.control} name="score" label="Score" />
          </div>
          <TextareaField control={form.control} name="description" label="Description" rows={3} />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {isSubmitting ? 'Creating…' : 'Create Property'}
          </Button>
        </form>
      </Form>
    </>
  );
}
