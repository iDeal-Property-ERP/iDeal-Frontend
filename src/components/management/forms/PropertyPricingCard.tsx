'use client';

import { Check } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import type { Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { TextField } from '@/components/ui/form-fields';
import type { ManagementPropertyFormData } from '@/libs/schemas/managementProperty';
import { cn } from '@/libs/utils';
import { FormSectionCard } from './FormSectionCard';

type Translator = ReturnType<typeof useTranslations>;

/**
 * Computes the trust-model margin (tenant charge − owner guaranteed) and shows it
 * live, tinted success when positive and danger when negative.
 * @param props - Form control and translator.
 * @returns The margin indicator line.
 */
function MarginIndicator(props: { control: Control<ManagementPropertyFormData>; t: Translator }) {
  const { control, t } = props;
  const owner = useWatch({ control, name: 'owner_guaranteed_price' });
  const tenant = useWatch({ control, name: 'tenant_charge_price' });
  const ownerValue = owner === undefined || owner === '' ? Number.NaN : Number(owner);
  const tenantValue = tenant === undefined || tenant === '' ? Number.NaN : Number(tenant);
  if (Number.isNaN(ownerValue) || Number.isNaN(tenantValue) || tenantValue <= 0) {
    return <p className="text-sm text-muted-foreground">{t('form_margin_hint')}</p>;
  }
  const margin = tenantValue - ownerValue;
  const pct = Math.round((margin / tenantValue) * 100);
  const healthy = margin >= 0;
  return (
    <p
      className={cn('flex items-center gap-1.5 text-sm', healthy ? 'text-success' : 'text-danger')}
    >
      {healthy ? <Check className="size-4" /> : null}
      {t('form_margin', { amount: `$${margin}`, pct })}
    </p>
  );
}

type PropertyPricingCardProps = {
  control: Control<ManagementPropertyFormData>;
  t: Translator;
  engagement?: 'managed' | 'one_off';
  askPriceLocked?: boolean;
};

/**
 * The Pricing section: the trust-model trio (ask / owner-guaranteed / tenant
 * charge) with a live-computed margin. Matches the Figma three-column layout.
 * @param props - Form control and translator.
 * @returns The Pricing section card.
 */
export function PropertyPricingCard(props: PropertyPricingCardProps) {
  const { control, t, engagement = 'managed', askPriceLocked = false } = props;
  const oneOff = engagement === 'one_off';
  return (
    <FormSectionCard
      title={t('form_pricing')}
      description={oneOff ? t('form_ask_price_hint') : t('form_pricing_hint')}
    >
      <div
        className={cn(
          'grid gap-5',
          oneOff ? 'sm:max-w-[calc(33.333%-0.875rem)]' : 'sm:grid-cols-3',
        )}
      >
        <TextField
          control={control}
          name="ask_price"
          label={t('form_ask_price')}
          required
          inputMode="decimal"
          description={t('form_ask_price_hint')}
          disabled={askPriceLocked}
        />
        {!oneOff ? (
          <>
            <TextField
              control={control}
              name="owner_guaranteed_price"
              label={t('form_owner_guaranteed')}
              required
              inputMode="decimal"
              description={t('form_owner_guaranteed_hint')}
            />
            <div className="space-y-2">
              <TextField
                control={control}
                name="tenant_charge_price"
                label={t('form_tenant_charge')}
                required
                inputMode="decimal"
              />
              <MarginIndicator control={control} t={t} />
            </div>
          </>
        ) : null}
      </div>
    </FormSectionCard>
  );
}
