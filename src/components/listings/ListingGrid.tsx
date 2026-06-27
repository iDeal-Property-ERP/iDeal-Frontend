'use client';

import { useTranslations } from 'next-intl';
import { ListingCard } from '@/components/listings/ListingCard';
import { cn } from '@/libs/utils';
import type { ListingOutput } from '@/types/marketplace';

const COLUMN_CLASS: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

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

  if (listings.length === 0) {
    return <p className="py-16 text-center text-muted-foreground">{t('no_listings')}</p>;
  }

  return (
    <div className={cn('grid gap-6', COLUMN_CLASS[columns], className)}>
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
