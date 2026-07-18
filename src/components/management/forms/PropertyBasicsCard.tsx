'use client';

import type { useTranslations } from 'next-intl';
import type { Control } from 'react-hook-form';
import { SelectField, TextareaField, TextField } from '@/components/ui/form-fields';
import type { DistrictOption } from '@/libs/management/propertiesAdapter';
import type { ManagementPropertyFormData } from '@/libs/schemas/managementProperty';
import { FormSectionCard } from './FormSectionCard';

type Translator = ReturnType<typeof useTranslations>;

type PropertyBasicsCardProps = {
  control: Control<ManagementPropertyFormData>;
  t: Translator;
  districts: DistrictOption[];
};

/**
 * The Basics section: name, district, address, rooms, area, both floor values,
 * and tariff. Mirrors the Figma create-form layout (full-width name, then the
 * paired rows).
 * @param props - Form control, translator, and district options.
 * @returns The Basics section card.
 */
export function PropertyBasicsCard(props: PropertyBasicsCardProps) {
  const { control, t, districts } = props;
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
        <TextField
          control={control}
          name="name"
          label={t('form_property_name')}
          required
          description={t('form_property_name_hint')}
        />
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
        <TextareaField
          control={control}
          name="description"
          label={t('form_description')}
          rows={3}
        />
      </div>
    </FormSectionCard>
  );
}
