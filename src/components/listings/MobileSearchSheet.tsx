'use client';

import { Check, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AllFiltersSheet } from '@/components/listings/AllFiltersSheet';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useListingParams } from '@/hooks/useListingParams';
import { cn } from '@/libs/utils';
import type { AmenityOption, DistrictOption } from '@/types/marketplace';

const PRICE_STEPS = ['', '200', '300', '400', '500', '700', '1000', '1500', '2000'];
const ROOM_STEPS = ['', '1', '2', '3', '4', '5'];
const SELECT =
  'w-full appearance-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

/**
 * Mobile collapsed search bar (Figma 94:14): a single pill summarizing Location/Price/Rooms that
 * opens a bottom sheet to edit them, plus a filter icon opening the full "All filters" sheet. Shown
 * only below `md`; desktop keeps the segmented `DiscoverySearchBar`.
 * @param props - Districts (location picker) and amenities (for the filters sheet).
 * @returns The mobile search pill and its bottom sheet.
 */
export function MobileSearchSheet(props: {
  districts: DistrictOption[];
  amenities: AmenityOption[];
}) {
  const { districts, amenities } = props;
  const t = useTranslations('Listings');
  const { get, set } = useListingParams();
  const [open, setOpen] = useState(false);

  const [districtId, setDistrictId] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [roomsMin, setRoomsMin] = useState('');
  const [roomsMax, setRoomsMax] = useState('');

  const sync = () => {
    setDistrictId(get('district_id'));
    setPriceMin(get('price_min'));
    setPriceMax(get('price_max'));
    setRoomsMin(get('rooms_min'));
    setRoomsMax(get('rooms_max'));
  };

  const apply = () => {
    set({
      district_id: districtId || undefined,
      price_min: priceMin || undefined,
      price_max: priceMax || undefined,
      rooms_min: roomsMin || undefined,
      rooms_max: roomsMax || undefined,
    });
    setOpen(false);
  };

  const clear = () => {
    setDistrictId('');
    setPriceMin('');
    setPriceMax('');
    setRoomsMin('');
    setRoomsMax('');
  };

  // Pill summary reflects the live URL params (Location · Price · Rooms).
  const districtName = districts.find((d) => String(d.id) === get('district_id'))?.name;
  const pMin = get('price_min');
  const pMax = get('price_max');
  const rMin = get('rooms_min');
  const rMax = get('rooms_max');
  const priceText = (() => {
    if (pMin && pMax) {
      return `$${pMin}–${pMax}`;
    }
    if (pMin) {
      return `$${pMin}+`;
    }
    return pMax ? `${t('sb_up_to')} $${pMax}` : '';
  })();
  const roomsText = (() => {
    if (rMin && rMax) {
      return rMin === rMax ? `${rMin} ${t('sb_rooms')}` : `${rMin}–${rMax} ${t('sb_rooms')}`;
    }
    if (rMin) {
      return `${rMin}+ ${t('sb_rooms')}`;
    }
    return rMax ? `${t('sb_up_to')} ${rMax}` : '';
  })();
  const sDate = get('start_date');
  const eDate = get('end_date');
  const dateText =
    sDate && eDate
      ? `${new Date(sDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}–${new Date(eDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
      : '';
  const parts = [districtName, dateText, priceText, roomsText].filter(Boolean);
  const summary = parts.length > 0 ? parts.join(' · ') : t('search_placeholder');

  return (
    <div className="flex items-center gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
      <Sheet
        onOpenChange={(o) => {
          setOpen(o);
          if (o) {
            sync();
          }
        }}
        open={open}
      >
        <SheetTrigger asChild>
          <button
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-muted"
            type="button"
          >
            <Search className="size-[18px] shrink-0 text-muted-foreground" />
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-sm font-medium',
                parts.length > 0 ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {summary}
            </span>
          </button>
        </SheetTrigger>
        <SheetContent className="gap-0" side="bottom">
          <SheetHeader>
            <SheetTitle>{t('search_title')}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 pt-1 pb-4">
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">{t('sb_location')}</p>
              <Command className="rounded-xl border border-border">
                <CommandInput placeholder={t('sb_location_search')} />
                <CommandList className="max-h-44">
                  <CommandEmpty>{t('sb_no_district')}</CommandEmpty>
                  <CommandGroup>
                    <CommandItem onSelect={() => setDistrictId('')} value={t('sb_anywhere')}>
                      <MapPin className="size-4 text-muted-foreground" />
                      {t('sb_anywhere')}
                      {!districtId && <Check className="ml-auto size-4 text-primary" />}
                    </CommandItem>
                    {districts.map((d) => (
                      <CommandItem
                        key={d.id}
                        onSelect={() => setDistrictId(String(d.id))}
                        value={d.name}
                      >
                        <MapPin className="size-4 text-muted-foreground" />
                        {d.name}
                        {districtId === String(d.id) && (
                          <Check className="ml-auto size-4 text-primary" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">{t('sb_price')}</p>
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label={t('range_min')}
                  className={SELECT}
                  onChange={(e) => setPriceMin(e.target.value)}
                  value={priceMin}
                >
                  {PRICE_STEPS.map((s) => (
                    <option key={s || 'any'} value={s}>
                      {s ? `$${s}` : t('sb_no_min')}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={t('range_max')}
                  className={SELECT}
                  onChange={(e) => setPriceMax(e.target.value)}
                  value={priceMax}
                >
                  {PRICE_STEPS.map((s) => (
                    <option key={s || 'any'} value={s}>
                      {s ? `$${s}` : t('sb_no_max')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">{t('sb_rooms_label')}</p>
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label={t('range_min')}
                  className={SELECT}
                  onChange={(e) => setRoomsMin(e.target.value)}
                  value={roomsMin}
                >
                  {ROOM_STEPS.map((s) => (
                    <option key={s || 'any'} value={s}>
                      {s || t('sb_any')}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={t('range_max')}
                  className={SELECT}
                  onChange={(e) => setRoomsMax(e.target.value)}
                  value={roomsMax}
                >
                  {ROOM_STEPS.map((s) => (
                    <option key={s || 'any'} value={s}>
                      {s || t('sb_any')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row gap-2 border-t border-border">
            <Button className="flex-1" onClick={clear} type="button" variant="outline">
              {t('clear')}
            </Button>
            <Button className="flex-1" onClick={apply} type="button">
              <Search className="size-4" />
              {t('search')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AllFiltersSheet
        amenities={amenities}
        districts={districts}
        trigger={
          <button
            aria-label={t('all_filters')}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted"
            type="button"
          >
            <SlidersHorizontal className="size-[18px]" />
          </button>
        }
      />
    </div>
  );
}
