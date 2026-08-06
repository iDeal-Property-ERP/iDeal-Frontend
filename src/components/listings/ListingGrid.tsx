'use client';

import { SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ListingCard } from '@/components/listings/ListingCard';
import { useListingParams } from '@/hooks/useListingParams';
import { cn } from '@/libs/utils';
import type { ListingOutput } from '@/types/marketplace';

const COLUMN_CLASS: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

const FILTER_KEYS = [
  'district_id',
  'start_date',
  'end_date',
  'flexibility_days',
  'price_min',
  'price_max',
  'rooms_min',
  'rooms_max',
  'area_min',
  'area_max',
  'property_type',
  'amenities',
  'verified',
  'furnishing',
  'tariff',
] as const;

type ListingGridProps = {
  listings: ListingOutput[];
  columns: 1 | 2 | 3;
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  className?: string;
};

/**
 * Responsive grid of listing cards, shared by every discovery view (List, Split, Map sidebar). Each
 * card is wrapped in a `#listing-${id}` anchor so the map can scroll the matching card into view —
 * this is the only place those ids exist in the DOM. Renders the empty state when there are none.
 * @param props - The listings, the desktop column count, and optional map-selection sync.
 * @returns The card grid, or the empty state.
 */
export function ListingGrid(props: ListingGridProps) {
  const { listings, columns, selectedId, onSelect, className } = props;
  const t = useTranslations('Listings');
  const { set } = useListingParams();

  if (listings.length === 0) {
    const clearFilters = Object.fromEntries(FILTER_KEYS.map((key) => [key, undefined]));

    return (
      <div className="flex min-h-[360px] items-center justify-center px-3 py-10">
        <div className="flex w-full max-w-xl flex-col items-center rounded-3xl border border-border bg-card px-6 py-8 text-center shadow-sm">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-subtle text-primary-subtle-foreground">
            <SearchX className="size-6" />
          </div>
          <h2 className="max-w-sm text-xl font-semibold text-foreground">
            {t('empty_filtered_title')}
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t('empty_filtered_subtitle')}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              className="inline-flex min-h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              onClick={() => set(clearFilters)}
              type="button"
            >
              {t('clear_filters')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-2.5 sm:gap-6', COLUMN_CLASS[columns], className)}>
      {listings.map((listing, index) => (
        <div id={`listing-${listing.id}`} key={listing.id}>
          <ListingCard
            listing={listing}
            onMouseEnter={onSelect ? () => onSelect(listing.id) : undefined}
            priority={index < 2}
            selected={selectedId === listing.id}
          />
        </div>
      ))}
    </div>
  );
}
