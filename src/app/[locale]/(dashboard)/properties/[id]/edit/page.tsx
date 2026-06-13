'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormField } from '@/components/ui/FormField';
import { PageHeader } from '@/components/ui/PageHeader';
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
    return <p className="text-sm text-neutral-400">Loading...</p>;
  }

  return (
    <>
      <PageHeader title={t('edit_property')} backHref={`/properties/${params.id}`} />
      {error ? <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</p> : null}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" error={errors.name?.message} required>
            <input
              {...register('name')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Address" error={errors.address?.message} required>
            <input
              {...register('address')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="District ID" error={errors.district_id?.message} required>
            <input
              type="number"
              {...register('district_id')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Owner ID" error={errors.owner_id?.message} required>
            <input
              type="number"
              {...register('owner_id')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Rooms" error={errors.rooms?.message} required>
            <input
              type="number"
              step="1"
              {...register('rooms')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Area (m\u00B2)" error={errors.area_sqm?.message} required>
            <input
              type="number"
              step="0.01"
              {...register('area_sqm')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Floor" error={errors.floor?.message} required>
            <input
              type="number"
              step="1"
              {...register('floor')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Total Floors" error={errors.total_floors?.message}>
            <input
              type="number"
              step="1"
              {...register('total_floors')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Ask Price" error={errors.ask_price?.message} required>
            <input
              {...register('ask_price')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField
            label="Owner Guaranteed Price"
            error={errors.owner_guaranteed_price?.message}
            required
          >
            <input
              {...register('owner_guaranteed_price')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField
            label="Tenant Charge Price"
            error={errors.tenant_charge_price?.message}
            required
          >
            <input
              {...register('tenant_charge_price')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Status" error={errors.status?.message}>
            <select
              {...register('status')}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">--</option>
              <option value="vacant">Vacant</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </FormField>
          <FormField label="Tariff" error={errors.tariff?.message}>
            <select
              {...register('tariff')}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">--</option>
              <option value="standard">Standard</option>
              <option value="comfort">Comfort</option>
              <option value="premium">Premium</option>
            </select>
          </FormField>
          <FormField label="Score" error={errors.score?.message}>
            <input
              {...register('score')}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
          </FormField>
        </div>
        <FormField label="Description" error={errors.description?.message}>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </FormField>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </>
  );
}
