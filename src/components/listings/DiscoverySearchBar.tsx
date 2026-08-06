'use client';

import { MapPin, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useListingParams } from '@/hooks/useListingParams';
import { cn } from '@/libs/utils';
import type { DistrictOption } from '@/types/marketplace';
import { MarketplaceDateRangePicker } from './MarketplaceDateRangePicker';

const PRICE_STEPS = ['', '200', '300', '400', '500', '700', '1000', '1500', '2000'];
const ROOM_STEPS = ['', '1', '2', '3', '4', '5'];

const SELECT_CLASS =
  'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

function RangeSelect(props: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  format: (v: string) => string;
}) {
  const [value, setValue] = useState(props.value);
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{props.label}</span>
      <select
        className={cn(SELECT_CLASS)}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          props.onChange(e.target.value);
        }}
      >
        {props.options.map((opt) => (
          <option key={opt || 'any'} value={opt}>
            {props.format(opt)}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Segmented search bar (Figma 76:29): Location | Price | Rooms | Search, each a popover that
 * writes its params to the URL.
 * @param props - The available districts for the location picker.
 * @returns The search bar.
 */
export function DiscoverySearchBar(props: { districts: DistrictOption[] }) {
  const { districts } = props;
  const t = useTranslations('Listings');
  const { get, set } = useListingParams();

  const districtId = get('district_id');
  const districtName = districts.find((d) => String(d.id) === districtId)?.name;
  const priceMin = get('price_min');
  const priceMax = get('price_max');
  const roomsMin = get('rooms_min');
  const roomsMax = get('rooms_max');

  const priceLabel = (() => {
    if (priceMin && priceMax) {
      return `$${priceMin} – $${priceMax}`;
    }
    if (priceMin) {
      return `$${priceMin}+`;
    }
    if (priceMax) {
      return `${t('sb_up_to')} $${priceMax}`;
    }
    return t('sb_any_price');
  })();

  const roomsLabel = (() => {
    if (roomsMin && roomsMax) {
      return roomsMin === roomsMax
        ? t('rooms_count', { count: Number(roomsMin) })
        : `${roomsMin}–${roomsMax} ${t('sb_rooms')}`;
    }
    if (roomsMin) {
      return `${roomsMin}+ ${t('sb_rooms')}`;
    }
    if (roomsMax) {
      return `${t('sb_up_to')} ${roomsMax}`;
    }
    return t('sb_any_rooms');
  })();

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm sm:flex-row sm:items-center">
      {/* Location */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex flex-1 items-center gap-2.5 rounded-xl px-4 py-2 text-left transition hover:bg-muted"
            type="button"
          >
            <MapPin className="size-[18px] shrink-0 text-muted-foreground" />
            <span className="flex min-w-0 flex-col">
              <span className="text-xs font-medium text-muted-foreground">{t('sb_location')}</span>
              <span className="truncate text-sm font-medium text-foreground">
                {districtName ?? t('sb_anywhere')}
              </span>
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0">
          <Command>
            <CommandInput placeholder={t('sb_location_search')} />
            <CommandList>
              <CommandEmpty>{t('sb_no_district')}</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => set({ district_id: undefined })}
                  value={t('sb_anywhere')}
                >
                  {t('sb_anywhere')}
                </CommandItem>
                {districts.map((d) => (
                  <CommandItem
                    key={d.id}
                    value={d.name}
                    onSelect={() => set({ district_id: String(d.id) })}
                  >
                    {d.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="hidden h-8 w-px bg-border sm:block" />

      {/* Dates */}
      <MarketplaceDateRangePicker />

      <div className="hidden h-8 w-px bg-border sm:block" />

      {/* Price */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex items-center rounded-xl px-4 py-2 text-left transition hover:bg-muted"
            type="button"
          >
            <span className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">{t('sb_price')}</span>
              <span className="text-sm font-medium text-foreground">{priceLabel}</span>
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 space-y-3 p-3">
          <RangeSelect
            label={t('range_min')}
            value={priceMin}
            options={PRICE_STEPS}
            onChange={(v) => set({ price_min: v || undefined })}
            format={(v) => (v ? `$${v}` : t('sb_no_min'))}
          />
          <RangeSelect
            label={t('range_max')}
            value={priceMax}
            options={PRICE_STEPS}
            onChange={(v) => set({ price_max: v || undefined })}
            format={(v) => (v ? `$${v}` : t('sb_no_max'))}
          />
        </PopoverContent>
      </Popover>

      <span className="hidden h-8 w-px bg-border sm:block" />

      {/* Rooms */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex items-center rounded-xl px-4 py-2 text-left transition hover:bg-muted"
            type="button"
          >
            <span className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">
                {t('sb_rooms_label')}
              </span>
              <span className="text-sm font-medium text-foreground">{roomsLabel}</span>
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 space-y-3 p-3">
          <RangeSelect
            label={t('range_min')}
            value={roomsMin}
            options={ROOM_STEPS}
            onChange={(v) => set({ rooms_min: v || undefined })}
            format={(v) => v || t('sb_any')}
          />
          <RangeSelect
            label={t('range_max')}
            value={roomsMax}
            options={ROOM_STEPS}
            onChange={(v) => set({ rooms_max: v || undefined })}
            format={(v) => v || t('sb_any')}
          />
        </PopoverContent>
      </Popover>

      <Button className="h-[52px] rounded-xl px-[22px]" onClick={() => set({})} type="button">
        <Search className="size-[18px]" />
        {t('search')}
      </Button>
    </div>
  );
}
