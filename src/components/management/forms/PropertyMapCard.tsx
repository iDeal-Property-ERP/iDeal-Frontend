'use client';

import { Map as MapIcon } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import type { Control } from 'react-hook-form';
import { TextField } from '@/components/ui/form-fields';
import type { ManagementPropertyFormData } from '@/libs/schemas/managementProperty';

type Translator = ReturnType<typeof useTranslations>;

type PropertyMapCardProps = {
  control: Control<ManagementPropertyFormData>;
  t: Translator;
};

/**
 * The right-rail Map card — lat/lon inputs beneath a map placeholder tile.
 * BACKEND-GAP: there is no interactive map picker component yet; the pin is set
 * by entering coordinates. The tile stands in for the draggable-pin preview.
 * @param props - Form control and translator.
 * @returns The map card.
 */
export function PropertyMapCard(props: PropertyMapCardProps) {
  const { control, t } = props;
  return (
    <div className="rounded-[16px] border border-border bg-card p-5 shadow-sm">
      <div className="flex h-28 items-center justify-center rounded-[12px] bg-muted text-muted-foreground">
        <MapIcon className="size-6" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t('form_map_hint')}</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <TextField control={control} name="map_lat" label={t('form_lat')} inputMode="decimal" />
        <TextField control={control} name="map_lon" label={t('form_lon')} inputMode="decimal" />
      </div>
    </div>
  );
}
