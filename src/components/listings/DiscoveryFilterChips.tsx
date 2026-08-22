'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AllFiltersSheet } from '@/components/listings/AllFiltersSheet';
import { useListingParams } from '@/hooks/useListingParams';
import { cn } from '@/libs/utils';
import type { AmenityOption, DistrictOption } from '@/types/marketplace';

const ACTIVE = 'border-primary bg-primary-subtle text-primary-subtle-foreground';
const INACTIVE = 'border-border bg-card text-foreground hover:bg-muted';
const CHIP =
  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition';

const PROPERTY_TYPE_LABEL_KEYS = {
  apartment: 'type_apartment',
  house: 'type_house',
  studio: 'type_studio',
  room: 'type_room',
} as const;

function isPropertyType(val: string): val is keyof typeof PROPERTY_TYPE_LABEL_KEYS {
  return val in PROPERTY_TYPE_LABEL_KEYS;
}

type Get = (key: string) => string;
type RemovableChip = { key: string; label: string; clear: Record<string, undefined> };

/**
 * Builds the active, removable filter chips (those not represented by a quick-toggle).
 * @param get - Reads a current URL param.
 * @param t - Translation function.
 * @param amenities - Amenities for resolving amenity labels.
 * @returns The removable chip descriptors.
 */
function buildRemovable(
  get: Get,
  t: ReturnType<typeof useTranslations<'Listings'>>,
  amenities: AmenityOption[],
): RemovableChip[] {
  const out: RemovableChip[] = [];
  if (get('area_min') || get('area_max')) {
    out.push({
      key: 'area',
      label: `${get('area_min') || '0'}–${get('area_max') || '∞'} m²`,
      clear: { area_min: undefined, area_max: undefined },
    });
  }
  const propertyType = get('property_type');
  if (propertyType) {
    const label = isPropertyType(propertyType)
      ? t(PROPERTY_TYPE_LABEL_KEYS[propertyType])
      : propertyType;
    out.push({
      key: 'ptype',
      label,
      clear: { property_type: undefined },
    });
  }
  for (const slug of get('amenities') ? get('amenities').split(',') : []) {
    out.push({
      key: `am-${slug}`,
      label: amenities.find((a) => a.slug === slug)?.name ?? slug,
      clear: {},
    });
  }
  return out;
}

/**
 * Discovery filter chips row (Figma 76:52): "All filters" + quick toggles + active removable chips.
 * @param props - Districts and amenities to resolve active-chip labels.
 * @returns The chips row.
 */
export function DiscoveryFilterChips(props: {
  districts: DistrictOption[];
  amenities: AmenityOption[];
}) {
  const { districts, amenities } = props;
  const t = useTranslations('Listings');
  const { get, set } = useListingParams();

  const toggle = (key: string, value: string) =>
    set({ [key]: get(key) === value ? undefined : value });
  const removable = buildRemovable(get, t, amenities);

  const removeAmenity = (slug: string) => {
    const next = (get('amenities') ? get('amenities').split(',') : []).filter((s) => s !== slug);
    set({ amenities: next.length > 0 ? next.join(',') : undefined });
  };

  return (
    <div className="flex [scrollbar-width:none] flex-nowrap items-center gap-2.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <AllFiltersSheet amenities={amenities} districts={districts} />

      <button
        className={cn(CHIP, get('verified') === 'true' ? ACTIVE : INACTIVE)}
        onClick={() => toggle('verified', 'true')}
        type="button"
      >
        {t('chip_verified')}
      </button>
      <button
        className={cn(CHIP, get('furnishing') === 'furnished' ? ACTIVE : INACTIVE)}
        onClick={() => toggle('furnishing', 'furnished')}
        type="button"
      >
        {t('chip_furnished')}
      </button>
      <button
        className={cn(CHIP, get('tariff') === 'comfort' ? ACTIVE : INACTIVE)}
        onClick={() => toggle('tariff', 'comfort')}
        type="button"
      >
        {t('chip_comfort')}
      </button>
      <button
        className={cn(CHIP, get('tariff') === 'premium' ? ACTIVE : INACTIVE)}
        onClick={() => toggle('tariff', 'premium')}
        type="button"
      >
        {t('chip_premium')}
      </button>

      {removable.map((chip) => (
        <button
          key={chip.key}
          className={cn(CHIP, ACTIVE)}
          onClick={() =>
            chip.key.startsWith('am-') ? removeAmenity(chip.key.slice(3)) : set(chip.clear)
          }
          type="button"
        >
          {chip.label}
          <X className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
