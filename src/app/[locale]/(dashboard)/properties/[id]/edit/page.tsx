'use client';

import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import { FormLoading } from '@/components/ui/detail';
import { OwnerSelect } from '@/components/ui/entity-selects';
import { Form } from '@/components/ui/form';
import { EntityField, SelectField, TextareaField, TextField } from '@/components/ui/form-fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { useEntityForm } from '@/hooks/useEntityForm';
import { apiFetch } from '@/libs/api';
import { createApiSubmit } from '@/libs/forms';
import { useRouter } from '@/libs/I18nNavigation';
import { PROPERTY_STATUS_OPTIONS, propertySchema, TARIFF_OPTIONS } from '@/libs/schemas/property';
import type { PropertyOutput } from '@/types/property';

/**
 * Renders the edit form for an existing property and submits the update to the API.
 * @param props - Page props containing the route params.
 * @returns Edit property form page.
 */
export default function EditPropertyPage(props: { params: Promise<{ id: string }> }) {
  const t = useTranslations('Pages');
  const params = use(props.params);
  const router = useRouter();

  const { form, loading, data } = useEntityForm({
    path: `/properties/${params.id}/`,
    schema: propertySchema,
    errorMessage: 'Failed to load property',
    toFormValues: (p: PropertyOutput) => ({
      name: p.name,
      address: p.address,
      district_id: p.district.id,
      owner_id: p.owner.id,
      rooms: p.rooms,
      area_sqm: p.area_sqm,
      floor: p.floor,
      total_floors: p.total_floors ?? undefined,
      status: p.status,
      tariff: p.tariff,
      ask_price: p.ask_price,
      ask_currency: p.ask_currency,
      owner_guaranteed_price: p.owner_guaranteed_price,
      owner_guaranteed_currency: p.owner_guaranteed_currency,
      tenant_charge_price: p.tenant_charge_price,
      tenant_charge_currency: p.tenant_charge_currency,
      description: p.description ?? undefined,
      score: p.score,
      vacant_since: p.vacant_since ?? undefined,
      vacant_days: p.vacant_days,
    }),
  });

  const ownerLabel = data ? `${data.owner.first_name} ${data.owner.last_name}`.trim() : undefined;

  const onSubmit = createApiSubmit(form, {
    submit: async (values) =>
      await apiFetch(`/properties/${params.id}/`, { method: 'PATCH', body: values }),
    success: 'Property updated',
    error: 'Failed to update property',
    onSuccess: () => router.push(`/properties/${params.id}`),
  });

  const { isSubmitting } = form.formState;

  if (loading) {
    return (
      <>
        <PageHeader title={t('edit_property')} backHref={`/properties/${params.id}`} />
        <FormLoading />
      </>
    );
  }

  return (
    <>
      <PageHeader title={t('edit_property')} backHref={`/properties/${params.id}`} />
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
                  initialLabel={ownerLabel}
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
          <div className="grid grid-cols-3 gap-4">
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
            <TextField control={form.control} name="score" label="Score" />
          </div>
          <TextareaField control={form.control} name="description" label="Description" rows={3} />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </Form>
    </>
  );
}
