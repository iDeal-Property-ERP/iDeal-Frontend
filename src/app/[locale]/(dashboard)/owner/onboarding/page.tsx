'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/libs/api';
import { useRouter } from '@/libs/I18nNavigation';
import type { OwnerOnboardingOutput, PublicOfferOutput } from '@/types/owner';

const schema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  district_id: z.coerce.number().min(1),
  rooms: z.coerce.number().min(0),
  area_sqm: z.coerce.number().min(0),
  floor: z.coerce.number().min(0),
  total_floors: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
  ask_price: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

/**
 * Owner self-service onboarding: submit a property and accept the public offer.
 * @returns Onboarding wizard page.
 */
export default function OwnerOnboardingPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [offer, setOffer] = useState<PublicOfferOutput | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    apiFetch<PublicOfferOutput>('/owner/public-offer/')
      .then(setOffer)
      .catch(() => {
        void 0;
      });
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!accepted) {
      setError(t('onboarding_must_accept'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch<OwnerOnboardingOutput>('/owner/onboarding/', {
        method: 'POST',
        body: { ...data, accept_offer: true },
      });
      router.push('/owner');
    } catch (_error) {
      setError(_error instanceof Error ? _error.message : t('onboarding_error'));
    }
    setSubmitting(false);
  };

  return (
    <>
      <PageHeader
        title={t('submit_property')}
        description={t('onboarding_desc')}
        backHref="/owner"
      />
      {error ? (
        <p className="mb-4 rounded bg-danger-subtle p-3 text-sm text-danger">{error}</p>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('onboarding_name')} error={errors.name?.message} required>
            <Input {...register('name')} />
          </FormField>
          <FormField label={t('onboarding_address')} error={errors.address?.message} required>
            <Input {...register('address')} />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField
            label={t('onboarding_district_id')}
            error={errors.district_id?.message}
            required
          >
            <Input type="number" {...register('district_id')} />
          </FormField>
          <FormField label={t('onboarding_rooms')} error={errors.rooms?.message} required>
            <Input type="number" step="1" {...register('rooms')} />
          </FormField>
          <FormField label={t('onboarding_area')} error={errors.area_sqm?.message} required>
            <Input type="number" step="1" {...register('area_sqm')} />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label={t('onboarding_floor')} error={errors.floor?.message} required>
            <Input type="number" step="1" {...register('floor')} />
          </FormField>
          <FormField label={t('onboarding_total_floors')} error={errors.total_floors?.message}>
            <Input type="number" step="1" {...register('total_floors')} />
          </FormField>
          <FormField label={t('onboarding_ask_price')} error={errors.ask_price?.message} required>
            <Input {...register('ask_price')} />
          </FormField>
        </div>
        <FormField label={t('onboarding_description')} error={errors.description?.message}>
          <Textarea {...register('description')} rows={3} />
        </FormField>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            {t('onboarding_offer_title')}
            {offer?.version ? ` (${offer.version})` : ''}
          </h3>
          <div className="mb-3 max-h-40 overflow-y-auto text-sm whitespace-pre-wrap text-muted-foreground">
            {offer?.body ?? t('onboarding_offer_unavailable')}
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked);
              }}
            />
            {t('onboarding_accept_offer')}
          </label>
        </div>

        <Button type="submit" variant="default" disabled={submitting || !accepted}>
          {submitting ? t('onboarding_submitting') : t('onboarding_submit')}
        </Button>
      </form>
    </>
  );
}
