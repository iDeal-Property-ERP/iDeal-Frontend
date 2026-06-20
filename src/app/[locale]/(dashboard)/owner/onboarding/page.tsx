'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form } from '@/components/ui/form';
import { TextareaField, TextField } from '@/components/ui/form-fields';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import { createApiSubmit } from '@/libs/forms';
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

/**
 * Owner self-service onboarding: submit a property and accept the public offer.
 * @returns Onboarding wizard page.
 */
export default function OwnerOnboardingPage() {
  const t = useTranslations('Pages');
  const router = useRouter();
  const [offer, setOffer] = useState<PublicOfferOutput | null>(null);
  const [accepted, setAccepted] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    apiFetch<PublicOfferOutput>('/owner/public-offer/')
      .then(setOffer)
      .catch(() => {
        void 0;
      });
  }, []);

  const onSubmit = createApiSubmit(form, {
    submit: async (values) =>
      await apiFetch<OwnerOnboardingOutput>('/owner/onboarding/', {
        method: 'POST',
        body: { ...values, accept_offer: true },
      }),
    success: t('onboarding_submit'),
    error: t('onboarding_error'),
    onSuccess: () => router.push('/owner'),
  });

  const { isSubmitting } = form.formState;

  return (
    <>
      <PageHeader
        title={t('submit_property')}
        description={t('onboarding_desc')}
        backHref="/owner"
      />
      <Form {...form}>
        <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField control={form.control} name="name" label={t('onboarding_name')} required />
            <TextField
              control={form.control}
              name="address"
              label={t('onboarding_address')}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <TextField
              control={form.control}
              name="district_id"
              label={t('onboarding_district_id')}
              type="number"
              required
            />
            <TextField
              control={form.control}
              name="rooms"
              label={t('onboarding_rooms')}
              type="number"
              step="1"
              required
            />
            <TextField
              control={form.control}
              name="area_sqm"
              label={t('onboarding_area')}
              type="number"
              step="1"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <TextField
              control={form.control}
              name="floor"
              label={t('onboarding_floor')}
              type="number"
              step="1"
              required
            />
            <TextField
              control={form.control}
              name="total_floors"
              label={t('onboarding_total_floors')}
              type="number"
              step="1"
            />
            <TextField
              control={form.control}
              name="ask_price"
              label={t('onboarding_ask_price')}
              required
            />
          </div>
          <TextareaField
            control={form.control}
            name="description"
            label={t('onboarding_description')}
            rows={3}
          />

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              {t('onboarding_offer_title')}
              {offer?.version ? ` (${offer.version})` : ''}
            </h3>
            <div className="mb-3 max-h-40 overflow-y-auto text-sm whitespace-pre-wrap text-muted-foreground">
              {offer?.body ?? t('onboarding_offer_unavailable')}
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={accepted}
                onCheckedChange={(checked) => {
                  setAccepted(checked === true);
                }}
              />
              {t('onboarding_accept_offer')}
            </label>
          </div>

          <Button type="submit" variant="default" disabled={isSubmitting || !accepted}>
            {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
            {isSubmitting ? t('onboarding_submitting') : t('onboarding_submit')}
          </Button>
        </form>
      </Form>
    </>
  );
}
