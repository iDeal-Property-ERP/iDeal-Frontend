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

type Get = (key: string) => string;
type RemovableChip = { key: string; label: string; clear: Record<string, undefined> };

/**
 * Builds the active, removable filter chips (those not represented by a quick-toggle).
 * @param get - Reads a current URL param.
 * @param tx - Loose translator for dynamic keys.
 * @param rooms - The localized "rooms" word.
 * @param districts - Districts for resolving the district label.
 * @param amenities - Amenities for resolving amenity labels.
 * @returns The removable chip descriptors.
 */
function buildRemovable(
  get: Get,
  tx: (key: string) => string,
  rooms: string,
  districts: DistrictOption[],
  amenities: AmenityOption[],
): RemovableChip[] {
  const out: RemovableChip[] = [];
  const districtName = districts.find((d) => String(d.id) === get('district_id'))?.name;
  if (districtName) {
    out.push({ key: 'district', label: districtName, clear: { district_id: undefined } });
  }
  if (get('price_min') || get('price_max')) {
    out.push({
      key: 'price',
      label: `$${get('price_min') || '0'} – $${get('price_max') || '∞'}`,
      clear: { price_min: undefined, price_max: undefined },
    });
  }
  if (get('rooms_min') || get('rooms_max')) {
    out.push({
      key: 'rooms',
      label: `${get('rooms_min') || '1'}–${get('rooms_max') || '∞'} ${rooms}`,
      clear: { rooms_min: undefined, rooms_max: undefined },
    });
  }
  if (get('area_min') || get('area_max')) {
    out.push({
      key: 'area',
      label: `${get('area_min') || '0'}–${get('area_max') || '∞'} m²`,
      clear: { area_min: undefined, area_max: undefined },
    });
  }
  if (get('property_type')) {
    out.push({
      key: 'ptype',
      label: tx(`type_${get('property_type')}`),
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
  const tx = t as unknown as (key: string) => string;
  const { get, set } = useListingParams();

  const toggle = (key: string, value: string) =>
    set({ [key]: get(key) === value ? undefined : value });
  const removable = buildRemovable(get, tx, t('sb_rooms'), districts, amenities);

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
