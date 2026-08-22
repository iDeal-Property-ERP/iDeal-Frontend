'use client';

import { format } from 'date-fns';
import { ArrowLeft, CalendarDays, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import {
  DEFAULT_FLEXIBILITY_DAYS,
  RentDatesEditor,
  formatDateRangeLabel,
  parseDateParam,
} from '@/components/listings/MarketplaceDateRangePicker';
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

const PROPERTY_TYPE_LABEL_KEYS = {
  apartment: 'type_apartment',
  house: 'type_house',
  studio: 'type_studio',
  room: 'type_room',
} satisfies Record<PropertyType, 'type_apartment' | 'type_house' | 'type_studio' | 'type_room'>;

const FURNISHING_LABEL_KEYS = {
  furnished: 'furnishing_furnished',
  semi_furnished: 'furnishing_semi_furnished',
  unfurnished: 'furnishing_unfurnished',
} satisfies Record<
  Furnishing,
  'furnishing_furnished' | 'furnishing_semi_furnished' | 'furnishing_unfurnished'
>;

const TARIFF_LABEL_KEYS = {
  standard: 'tariff_standard',
  comfort: 'tariff_comfort',
  premium: 'tariff_premium',
} satisfies Record<Tariff, 'tariff_standard' | 'tariff_comfort' | 'tariff_premium'>;

type MobilePage = 'filters' | 'dates';

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
  start_date: string;
  end_date: string;
  flexibility_days: string;
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
  const { get, set } = useListingParams();
  const [open, setOpen] = useState(false);
  const [mobilePage, setMobilePage] = useState<MobilePage>('filters');
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
    start_date: get('start_date'),
    end_date: get('end_date'),
    flexibility_days: get('flexibility_days'),
  });
  const [draft, setDraft] = useState<Draft>(initial);
  const [dateDraft, setDateDraft] = useState<DateRange | undefined>(() => {
    const start = parseDateParam(get('start_date'));
    const end = parseDateParam(get('end_date'));
    return start && end ? { from: start, to: end } : undefined;
  });
  const [flexDraft, setFlexDraft] = useState(() =>
    get('flexibility_days') ? Number(get('flexibility_days')) : DEFAULT_FLEXIBILITY_DAYS,
  );

  const resetDraftsFromUrl = () => {
    const next = initial();
    const start = parseDateParam(next.start_date);
    const end = parseDateParam(next.end_date);
    setDraft(next);
    setDateDraft(start && end ? { from: start, to: end } : undefined);
    setFlexDraft(next.flexibility_days ? Number(next.flexibility_days) : DEFAULT_FLEXIBILITY_DAYS);
    setMobilePage('filters');
  };

  const upd = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const toggleAmenity = (slug: string) =>
    upd({
      amenities: draft.amenities.includes(slug)
        ? draft.amenities.filter((s) => s !== slug)
        : [...draft.amenities, slug],
    });

  // The URL payload intentionally mirrors every discovery filter in one submit action.
  // eslint-disable-next-line complexity
  const apply = () => {
    const hasDateRange = Boolean(dateDraft?.from && dateDraft?.to);
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
      start_date:
        hasDateRange && dateDraft?.from ? format(dateDraft.from, 'yyyy-MM-dd') : undefined,
      end_date: hasDateRange && dateDraft?.to ? format(dateDraft.to, 'yyyy-MM-dd') : undefined,
      flexibility_days: hasDateRange ? String(flexDraft) : undefined,
    });
    setOpen(false);
  };

  const clearAll = () => {
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
      start_date: '',
      end_date: '',
      flexibility_days: '',
    });
    setDateDraft(undefined);
    setFlexDraft(DEFAULT_FLEXIBILITY_DAYS);
  };

  const dateSummary =
    dateDraft?.from && dateDraft?.to
      ? formatDateRangeLabel(
          format(dateDraft.from, 'yyyy-MM-dd'),
          format(dateDraft.to, 'yyyy-MM-dd'),
          t('sb_any_dates'),
        )
      : t('sb_any_dates');

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          resetDraftsFromUrl();
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
        {isMobile && mobilePage === 'dates' ? (
          <>
            <SheetHeader className="flex-row items-center gap-3">
              <button
                aria-label={t('back')}
                className="flex size-10 items-center justify-center rounded-full text-primary transition hover:bg-muted"
                onClick={() => setMobilePage('filters')}
                type="button"
              >
                <ArrowLeft className="size-5" />
              </button>
              <SheetTitle className="text-2xl">{t('rent_dates')}</SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <RentDatesEditor
                compactFlex
                date={dateDraft}
                flex={flexDraft}
                numberOfMonths={1}
                onDateChange={setDateDraft}
                onFlexChange={setFlexDraft}
              />
            </div>

            <SheetFooter className="flex-row gap-2 border-t border-border">
              <Button
                className="flex-1"
                onClick={() => {
                  setDateDraft(undefined);
                  setFlexDraft(DEFAULT_FLEXIBILITY_DAYS);
                }}
                type="button"
                variant="outline"
              >
                {t('sb_clear')}
              </Button>
              <Button
                className="flex-1"
                disabled={Boolean(dateDraft?.from && !dateDraft?.to)}
                onClick={() => setMobilePage('filters')}
                type="button"
              >
                {t('set_dates')}
              </Button>
            </SheetFooter>
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>{t('all_filters')}</SheetTitle>
            </SheetHeader>

            <div className={cn('flex-1 space-y-6 px-4 py-4', isMobile && 'overflow-y-auto')}>
              {isMobile ? (
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">
                    {t('preferred_rent_dates')}
                  </p>
                  <button
                    className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left transition hover:bg-muted"
                    onClick={() => setMobilePage('dates')}
                    type="button"
                  >
                    <CalendarDays className="size-5 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold text-foreground">
                        {dateSummary}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {dateDraft?.from && dateDraft?.to
                          ? t('dates_with_flexibility', { flexibility: flexDraft })
                          : t('date_filter_hint_short')}
                      </span>
                    </span>
                    <ChevronRight className="size-5 text-primary" />
                  </button>
                </div>
              ) : (
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">
                    {t('preferred_rent_dates')}
                  </p>
                  <RentDatesEditor
                    compactFlex
                    date={dateDraft}
                    flex={flexDraft}
                    numberOfMonths={1}
                    onDateChange={setDateDraft}
                    onFlexChange={setFlexDraft}
                  />
                </div>
              )}

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
                options={PROPERTY_TYPES.map((pt) => ({
                  value: pt,
                  label: t(PROPERTY_TYPE_LABEL_KEYS[pt]),
                }))}
                onChange={(v) => upd({ property_type: v })}
              />
              <ChoiceGroup
                label={t('filter_furnishing')}
                value={draft.furnishing}
                options={FURNISHINGS.map((f) => ({
                  value: f,
                  label: t(FURNISHING_LABEL_KEYS[f]),
                }))}
                onChange={(v) => upd({ furnishing: v })}
              />
              <ChoiceGroup
                label={t('filter_tariff')}
                value={draft.tariff}
                options={TARIFFS.map((tr) => ({
                  value: tr,
                  label: t(TARIFF_LABEL_KEYS[tr]),
                }))}
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
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
