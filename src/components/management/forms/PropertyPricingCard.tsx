'use client';

import type { useTranslations } from 'next-intl';
import type { Control } from 'react-hook-form';
import { TextField } from '@/components/ui/form-fields';
import type { ManagementPropertyFormData } from '@/libs/schemas/managementProperty';
import { cn } from '@/libs/utils';
import { FormSectionCard } from './FormSectionCard';

type Translator = ReturnType<typeof useTranslations>;

type PropertyPricingCardProps = {
  control: Control<ManagementPropertyFormData>;
  t: Translator;
  engagement?: 'managed' | 'one_off';
  askPriceLocked?: boolean;
};

/**
 * Listing price is market-facing only. Contractual floor and commission are set
 * on the owner agreement, where the settlement preview makes the calculation clear.
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
      <div className={cn('grid gap-5', 'sm:max-w-[calc(33.333%-0.875rem)]')}>
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
          <p className="max-w-xl text-sm text-muted-foreground">
            {t('form_pricing_agreement_hint')}
          </p>
        ) : null}
      </div>
    </FormSectionCard>
  );
}
