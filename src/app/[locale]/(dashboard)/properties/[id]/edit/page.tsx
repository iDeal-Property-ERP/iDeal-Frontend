'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState, useEffect, use } from 'react';
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
import type { PropertyOutput } from '@/types/property';

const schema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  district_id: z.coerce.number().min(1),
  rooms: z.coerce.number().min(0),
  area_sqm: z.coerce.number().min(0),
  floor: z.coerce.number().min(0),
  total_floors: z.coerce.number().min(0).optional(),
  owner_id: z.coerce.number().min(1),
  status: z.string().optional(),
  tariff: z.string().optional(),
  ask_price: z.string().min(1),
  ask_currency: z.string().optional(),
  owner_guaranteed_price: z.string().min(1),
  owner_guaranteed_currency: z.string().optional(),
  tenant_charge_price: z.string().min(1),
  tenant_charge_currency: z.string().optional(),
  description: z.string().optional(),
  score: z.string().optional(),
  vacant_since: z.string().optional(),
  vacant_days: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

/**
 * Renders the edit form for an existing property and submits the update to the API.
 * @param props - Page props containing the route params.
 * @returns Edit property form page.
 */
export default function EditPropertyPage(props: { params: Promise<{ id: string }> }) {
  const t = useTranslations('Pages');
  const params = use(props.params);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    apiFetch<PropertyOutput>(`/properties/${params.id}/`)
      .then((p) => {
        reset({
          name: p.name,
          address: p.address,
          district_id: p.district.id,
          rooms: p.rooms,
          area_sqm: p.area_sqm,
          floor: p.floor,
          total_floors: p.total_floors ?? undefined,
          owner_id: p.owner.id,
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
        });
      })
      .catch(() => {
        setError('Failed to load property');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.id, reset]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/properties/${params.id}/`, { method: 'PATCH', body: data });
      await router.push(`/properties/${params.id}`);
    } catch (_error) {
      setError(_error instanceof Error ? _error.message : 'Failed to update property');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <>
      <PageHeader title={t('edit_property')} backHref={`/properties/${params.id}`} />
      {error ? (
        <p className="mb-4 rounded bg-danger-subtle p-3 text-sm text-danger">{error}</p>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" error={errors.name?.message} required>
            <Input {...register('name')} />
          </FormField>
          <FormField label="Address" error={errors.address?.message} required>
            <Input {...register('address')} />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="District ID" error={errors.district_id?.message} required>
            <Input type="number" {...register('district_id')} />
          </FormField>
          <FormField label="Owner ID" error={errors.owner_id?.message} required>
            <Input type="number" {...register('owner_id')} />
          </FormField>
          <FormField label="Rooms" error={errors.rooms?.message} required>
            <Input type="number" step="1" {...register('rooms')} />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Area (m²)" error={errors.area_sqm?.message} required>
            <Input type="number" step="0.01" {...register('area_sqm')} />
          </FormField>
          <FormField label="Floor" error={errors.floor?.message} required>
            <Input type="number" step="1" {...register('floor')} />
          </FormField>
          <FormField label="Total Floors" error={errors.total_floors?.message}>
            <Input type="number" step="1" {...register('total_floors')} />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Ask Price" error={errors.ask_price?.message} required>
            <Input {...register('ask_price')} />
          </FormField>
          <FormField
            label="Owner Guaranteed Price"
            error={errors.owner_guaranteed_price?.message}
            required
          >
            <Input {...register('owner_guaranteed_price')} />
          </FormField>
          <FormField
            label="Tenant Charge Price"
            error={errors.tenant_charge_price?.message}
            required
          >
            <Input {...register('tenant_charge_price')} />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Status" error={errors.status?.message}>
            <Select {...register('status')}>
              <option value="">--</option>
              <option value="vacant">Vacant</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
            </Select>
          </FormField>
          <FormField label="Tariff" error={errors.tariff?.message}>
            <Select {...register('tariff')}>
              <option value="">--</option>
              <option value="standard">Standard</option>
              <option value="comfort">Comfort</option>
              <option value="premium">Premium</option>
            </Select>
          </FormField>
          <FormField label="Score" error={errors.score?.message}>
            <Input {...register('score')} />
          </FormField>
        </div>
        <FormField label="Description" error={errors.description?.message}>
          <Textarea {...register('description')} rows={3} />
        </FormField>
        <Button type="submit" intent="primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </>
  );
}
