'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useListingParams } from '@/hooks/useListingParams';
import { cn } from '@/libs/utils';
import type { Furnishing, PropertyType, Tariff } from '@/types/enums';
import type { AmenityOption, DistrictOption } from '@/types/marketplace';

const INPUT =
  'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

const FURNISHINGS: Furnishing[] = ['furnished', 'semi_furnished', 'unfurnished'];
const TARIFFS: Tariff[] = ['standard', 'comfort', 'premium'];
const PROPERTY_TYPES: PropertyType[] = ['apartment', 'house', 'studio', 'room'];

type Draft = {
  district_id: string;
  price_min: string;
  price_max: string;
  rooms_min: string;
  rooms_max: string;
  area_min: string;
  area_max: string;
  furnishing: string;
  tariff: string;
  property_type: string;
  amenities: string[];
};

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{props.label}</span>
      {props.children}
    </label>
  );
}

function TwoCol(props: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-foreground">{props.label}</p>
      <div className="grid grid-cols-2 gap-2">{props.children}</div>
    </div>
  );
}

function ChoiceGroup(props: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">{props.label}</p>
      <div className="flex flex-wrap gap-2">
        {props.options.map((opt) => {
          const active = props.value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => props.onChange(active ? '' : opt.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition',
                active
                  ? 'border-primary bg-primary-subtle text-primary-subtle-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * "All filters" sheet (Figma chips → full filter panel): every backend discovery filter, applied
 * to the URL on submit.
 * @param props - Districts and amenities for the pickers.
 * @returns The trigger pill + sheet.
 */
export function AllFiltersSheet(props: {
  districts: DistrictOption[];
  amenities: AmenityOption[];
  trigger?: React.ReactNode;
}) {
  const { districts, amenities, trigger } = props;
  const t = useTranslations('Listings');
  // Loose alias for dynamically-built keys (`type_${x}`, `furnishing_${x}`, `tariff_${x}`).
  const tx = t as unknown as (key: string) => string;
  const { get, set } = useListingParams();
  const [open, setOpen] = useState(false);
  // Mobile rises from the bottom (Figma); desktop keeps the right-side drawer.
  const isMobile = useIsMobile();

  const initial = (): Draft => ({
    district_id: get('district_id'),
    price_min: get('price_min'),
    price_max: get('price_max'),
    rooms_min: get('rooms_min'),
    rooms_max: get('rooms_max'),
    area_min: get('area_min'),
    area_max: get('area_max'),
    furnishing: get('furnishing'),
    tariff: get('tariff'),
    property_type: get('property_type'),
    amenities: get('amenities') ? get('amenities').split(',') : [],
  });
  const [draft, setDraft] = useState<Draft>(initial);

  const upd = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const toggleAmenity = (slug: string) =>
    upd({
      amenities: draft.amenities.includes(slug)
        ? draft.amenities.filter((s) => s !== slug)
        : [...draft.amenities, slug],
    });

  const apply = () => {
    set({
      district_id: draft.district_id || undefined,
      price_min: draft.price_min || undefined,
      price_max: draft.price_max || undefined,
      rooms_min: draft.rooms_min || undefined,
      rooms_max: draft.rooms_max || undefined,
      area_min: draft.area_min || undefined,
      area_max: draft.area_max || undefined,
      furnishing: draft.furnishing || undefined,
      tariff: draft.tariff || undefined,
      property_type: draft.property_type || undefined,
      amenities: draft.amenities.length > 0 ? draft.amenities.join(',') : undefined,
    });
    setOpen(false);
  };

  const clearAll = () =>
    setDraft({
      district_id: '',
      price_min: '',
      price_max: '',
      rooms_min: '',
      rooms_max: '',
      area_min: '',
      area_max: '',
      furnishing: '',
      tariff: '',
      property_type: '',
      amenities: [],
    });

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setDraft(initial());
        }
      }}
    >
      <SheetTrigger asChild>
        {trigger ?? (
          <button
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            type="button"
          >
            <SlidersHorizontal className="size-4" />
            {t('all_filters')}
          </button>
        )}
      </SheetTrigger>
      <SheetContent
        className={cn('flex flex-col gap-0', isMobile ? '' : 'w-full overflow-y-auto sm:max-w-md')}
        side={isMobile ? 'bottom' : 'right'}
      >
        <SheetHeader>
          <SheetTitle>{t('all_filters')}</SheetTitle>
        </SheetHeader>

        <div className={cn('flex-1 space-y-6 px-4 py-4', isMobile && 'overflow-y-auto')}>
          <Field label={t('filter_district')}>
            <select
              className={INPUT}
              value={draft.district_id}
              onChange={(e) => upd({ district_id: e.target.value })}
            >
              <option value="">{t('sb_anywhere')}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>

          <TwoCol label={t('filter_price')}>
            <input
              className={INPUT}
              placeholder={t('range_min')}
              type="number"
              value={draft.price_min}
              onChange={(e) => upd({ price_min: e.target.value })}
            />
            <input
              className={INPUT}
              placeholder={t('range_max')}
              type="number"
              value={draft.price_max}
              onChange={(e) => upd({ price_max: e.target.value })}
            />
          </TwoCol>

          <TwoCol label={t('filter_rooms')}>
            <input
              className={INPUT}
              placeholder={t('range_min')}
              type="number"
              value={draft.rooms_min}
              onChange={(e) => upd({ rooms_min: e.target.value })}
            />
            <input
              className={INPUT}
              placeholder={t('range_max')}
              type="number"
              value={draft.rooms_max}
              onChange={(e) => upd({ rooms_max: e.target.value })}
            />
          </TwoCol>

          <TwoCol label={t('filter_area')}>
            <input
              className={INPUT}
              placeholder={t('range_min')}
              type="number"
              value={draft.area_min}
              onChange={(e) => upd({ area_min: e.target.value })}
            />
            <input
              className={INPUT}
              placeholder={t('range_max')}
              type="number"
              value={draft.area_max}
              onChange={(e) => upd({ area_max: e.target.value })}
            />
          </TwoCol>

          <ChoiceGroup
            label={t('filter_property_type')}
            value={draft.property_type}
            options={PROPERTY_TYPES.map((pt) => ({ value: pt, label: tx(`type_${pt}`) }))}
            onChange={(v) => upd({ property_type: v })}
          />
          <ChoiceGroup
            label={t('filter_furnishing')}
            value={draft.furnishing}
            options={FURNISHINGS.map((f) => ({ value: f, label: tx(`furnishing_${f}`) }))}
            onChange={(v) => upd({ furnishing: v })}
          />
          <ChoiceGroup
            label={t('filter_tariff')}
            value={draft.tariff}
            options={TARIFFS.map((tr) => ({ value: tr, label: tx(`tariff_${tr}`) }))}
            onChange={(v) => upd({ tariff: v })}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">{t('filter_amenities')}</p>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => {
                const active = draft.amenities.includes(a.slug);
                return (
                  <button
                    key={a.slug}
                    type="button"
                    onClick={() => toggleAmenity(a.slug)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition',
                      active
                        ? 'border-primary bg-primary-subtle text-primary-subtle-foreground'
                        : 'border-border text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2 border-t border-border">
          <Button className="flex-1" onClick={clearAll} type="button" variant="outline">
            {t('clear_all')}
          </Button>
          <Button className="flex-1" onClick={apply} type="button">
            {t('apply')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
