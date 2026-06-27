'use client';

import { useEffect, useRef } from 'react';
import { MobileMiniCard } from '@/components/listings/MobileMiniCard';
import type { ListingOutput } from '@/types/marketplace';

type MobileListingCarouselProps = {
  listings: ListingOutput[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

/**
 * Horizontal snap carousel of mini-cards at the bottom of the mobile map overlay (Figma 245:2). When
 * a map pin is selected, the matching card is scrolled into the center; tapping a card opens its
 * detail page (and marks it selected).
 * @param props - The map listings, the selected pin id, and the selection callback.
 * @returns The carousel, or null when there are no listings.
 */
export function MobileListingCarousel(props: MobileListingCarouselProps) {
  const { listings, selectedId, onSelect } = props;
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (selectedId === null) {
      return;
    }
    cardRefs.current
      .get(selectedId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedId]);

  if (listings.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-auto flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-4 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {listings.map((listing) => (
        <div
          className="w-[80vw] max-w-[340px] shrink-0 snap-center"
          key={listing.id}
          ref={(node) => {
            if (node) {
              cardRefs.current.set(listing.id, node);
            } else {
              cardRefs.current.delete(listing.id);
            }
          }}
        >
          <MobileMiniCard
            listing={listing}
            onSelect={() => onSelect(listing.id)}
            selected={selectedId === listing.id}
          />
        </div>
      ))}
    </div>
  );
}
