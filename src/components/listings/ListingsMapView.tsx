'use client';

import { useState } from 'react';
import { ListingCard } from '@/components/listings/ListingCard';
import { YandexMap } from '@/components/map/YandexMap';
import { listingsToPoints } from '@/libs/marketplace';
import type { ListingOutput } from '@/types/marketplace';

type ListingsMapViewProps = {
  listings: ListingOutput[];
};

/**
 * Split view pairing a scrollable list of listing cards with an interactive map.
 * Hovering a card or clicking a marker keeps both sides in sync.
 * @param props - The listings to display.
 * @returns The synchronized list + map layout.
 */
export function ListingsMapView(props: ListingsMapViewProps) {
  const { listings } = props;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const points = listingsToPoints(listings);

  function handleMarkerClick(id: number) {
    setSelectedId(id);
    const el = document.querySelector(`#listing-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="order-2 max-h-[72vh] space-y-4 overflow-y-auto pr-1 lg:order-1">
        {listings.map((listing, index) => (
          <div id={`listing-${listing.id}`} key={listing.id}>
            <ListingCard
              listing={listing}
              priority={index < 2}
              selected={selectedId === listing.id}
              onMouseEnter={() => setSelectedId(listing.id)}
            />
          </div>
        ))}
      </div>
      <div className="order-1 lg:order-2">
        <YandexMap
          points={points}
          selectedId={selectedId}
          onMarkerClick={handleMarkerClick}
          className="sticky top-20 h-[55vh] lg:h-[72vh]"
        />
      </div>
    </div>
  );
}
