'use client';

import type { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Control } from 'react-hook-form';
import { SelectField, TextareaField, TextField } from '@/components/ui/form-fields';
import type { DistrictOption } from '@/libs/management/propertiesAdapter';
import type { ManagementPropertyFormData } from '@/libs/schemas/managementProperty';
import { cn } from '@/libs/utils';
import { FormSectionCard } from './FormSectionCard';

type Translator = ReturnType<typeof useTranslations>;

type PropertyBasicsCardProps = {
  control: Control<ManagementPropertyFormData>;
  t: Translator;
  districts: DistrictOption[];
};

const LOCALES = [
  { code: 'en', label: 'English (EN)' },
  { code: 'uz', label: "O'zbekcha (UZ)" },
  { code: 'ru', label: 'Русский (RU)' },
] as const;

/**
 * The Basics section: name, district, address, rooms, area, both floor values,
 * and tariff with multilingual tabs for EN, UZ, and RU.
 * @param props - Form control, translator, and district options.
 * @returns The Basics section card.
 */
export function PropertyBasicsCard(props: PropertyBasicsCardProps) {
  const { control, t, districts } = props;
  const [activeLang, setActiveLang] = useState<'en' | 'uz' | 'ru'>('en');

  const districtOptions = districts.map((district) => ({
    value: String(district.id),
    label: district.name,
  }));
  const tariffOptions = [
    { value: 'standard', label: t('tariff_standard') },
    { value: 'comfort', label: t('tariff_comfort') },
    { value: 'premium', label: t('tariff_premium') },
  ];
  return (
    <FormSectionCard title={t('form_basics')}>
      <div className="space-y-5">
        {/* Language Tabs for Title and Description */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <span className="mr-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Language:
          </span>
          {LOCALES.map((loc) => (
            <button
              key={loc.code}
              type="button"
              onClick={() => setActiveLang(loc.code)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                activeLang === loc.code
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
              )}
            >
              {loc.label}
            </button>
          ))}
        </div>

        <div className={activeLang !== 'en' ? 'hidden' : undefined}>
          <TextField
            control={control}
            name="name"
            label={`${t('form_property_name')} (EN)`}
            required
            description={t('form_property_name_hint')}
          />
        </div>
        <div className={activeLang !== 'uz' ? 'hidden' : undefined}>
          <TextField
            control={control}
            name="translations.uz.name"
            label={`${t('form_property_name')} (UZ)`}
            description={t('form_property_name_hint')}
          />
        </div>
        <div className={activeLang !== 'ru' ? 'hidden' : undefined}>
          <TextField
            control={control}
            name="translations.ru.name"
            label={`${t('form_property_name')} (RU)`}
            description={t('form_property_name_hint')}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            control={control}
            name="district_id"
            label={t('form_district')}
            required
            options={districtOptions}
            placeholder={t('form_district_placeholder')}
          />
          <TextField control={control} name="address" label={t('form_address')} required />
        </div>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-5">
          <TextField
            control={control}
            name="rooms"
            label={t('form_rooms')}
            type="number"
            inputMode="numeric"
            required
          />
          <TextField
            control={control}
            name="area_sqm"
            label={t('form_area')}
            type="number"
            inputMode="numeric"
            required
          />
          <TextField
            control={control}
            name="floor"
            label={t('form_apartment_floor')}
            type="number"
            required
          />
          <TextField
            control={control}
            name="total_floors"
            label={t('form_total_floors')}
            type="number"
            inputMode="numeric"
            required
          />
          <div className="col-span-2 lg:col-span-1">
            <SelectField
              control={control}
              name="tariff"
              label={t('form_tariff')}
              options={tariffOptions}
              placeholder={t('form_tariff')}
            />
          </div>
        </div>

        <div className={activeLang !== 'en' ? 'hidden' : undefined}>
          <TextareaField
            control={control}
            name="description"
            label={`${t('form_description')} (EN)`}
            rows={3}
          />
        </div>
        <div className={activeLang !== 'uz' ? 'hidden' : undefined}>
          <TextareaField
            control={control}
            name="translations.uz.description"
            label={`${t('form_description')} (UZ)`}
            rows={3}
          />
        </div>
        <div className={activeLang !== 'ru' ? 'hidden' : undefined}>
          <TextareaField
            control={control}
            name="translations.ru.description"
            label={`${t('form_description')} (RU)`}
            rows={3}
          />
        </div>
      </div>
    </FormSectionCard>
  );
}
