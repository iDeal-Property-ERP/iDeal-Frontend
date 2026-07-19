'use client';

import type { useTranslations } from 'next-intl';
import type { Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { SelectField, TextField } from '@/components/ui/form-fields';
import type { ManagementPropertyFormData } from '@/libs/schemas/managementProperty';
import { FormSectionCard } from './FormSectionCard';

type Translator = ReturnType<typeof useTranslations>;

type OneOffBrokerageCardProps = {
  control: Control<ManagementPropertyFormData>;
  t: Translator;
  disabled?: boolean;
};

/**
 * The brokerage-only fields rendered inside the shared property form.
 * @param props Form control, translator, and immutable-state flag.
 * @returns The seller, channel, and commission section.
 */
export function OneOffBrokerageCard(props: OneOffBrokerageCardProps) {
  const { control, t, disabled = false } = props;
  const commissionType = useWatch({ control, name: 'commission_type' });
  return (
    <FormSectionCard title={t('property_create_one_off')} description={t('brokerage_new_subtitle')}>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          control={control}
          name="seller_name"
          label={t('brokerage_seller_name')}
          required
          disabled={disabled}
        />
        <TextField
          control={control}
          name="seller_phone"
          label={t('brokerage_seller_phone')}
          required
          disabled={disabled}
        />
        <TextField
          control={control}
          name="seller_email"
          label={t('brokerage_seller_email')}
          type="email"
          disabled={disabled}
        />
        <SelectField
          control={control}
          name="channel"
          label={t('brokerage_channel_field')}
          required
          disabled={disabled}
          options={[
            { value: 'marketplace', label: t('brokerage_channel_marketplace') },
            { value: 'off_market', label: t('brokerage_channel_off_market') },
          ]}
        />
        <SelectField
          control={control}
          name="commission_type"
          label={t('brokerage_commission_type')}
          required
          disabled={disabled}
          options={[
            { value: 'none', label: t('brokerage_commission_none') },
            { value: 'fixed', label: t('brokerage_commission_fixed') },
            { value: 'percentage', label: t('brokerage_commission_percentage') },
          ]}
        />
        {commissionType === 'fixed' ? (
          <TextField
            control={control}
            name="commission_fixed_amount"
            label={t('brokerage_commission_amount')}
            inputMode="decimal"
            disabled={disabled}
          />
        ) : null}
        {commissionType === 'percentage' ? (
          <TextField
            control={control}
            name="commission_percentage"
            label={t('brokerage_commission_percent')}
            inputMode="decimal"
            disabled={disabled}
          />
        ) : null}
        <SelectField
          control={control}
          name="commission_currency"
          label={t('brokerage_currency')}
          disabled={disabled}
          options={[
            { value: 'USD', label: 'USD' },
            { value: 'UZS', label: 'UZS' },
          ]}
        />
      </div>
    </FormSectionCard>
  );
}
