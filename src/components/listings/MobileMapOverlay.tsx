'use client';

import { ArrowLeft, List, Search, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AllFiltersSheet } from '@/components/listings/AllFiltersSheet';
import { DiscoveryMapPanel } from '@/components/listings/DiscoveryMapPanel';
import { MobileListingCarousel } from '@/components/listings/MobileListingCarousel';
import { fetchListings, filtersFromSearchParams, listingsToPoints } from '@/libs/marketplace';
import type { AmenityOption, DistrictOption, ListingOutput } from '@/types/marketplace';

type MobileMapOverlayProps = {
  open: boolean;
  onClose: () => void;
  mapListings: ListingOutput[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onSearchArea: (bbox: string) => void;
  districts: DistrictOption[];
  amenities: AmenityOption[];
};

/**
 * Full-screen mobile map overlay (Figma 244:2): a floating top bar (back + search summary + filter),
 * the interactive map with "Search this area", a "List" pill to return, and a bottom carousel of
 * mini-cards synced to the map pins. When the List view skipped the server map fetch, the dataset is
 * lazily fetched on first open using the current URL filters.
 * @param props - Open state, close handler, the map dataset, selection sync, and filter pickers.
 * @returns The overlay, or null when closed.
 */
export function MobileMapOverlay(props: MobileMapOverlayProps) {
  const { open, onClose, mapListings, selectedId, onSelect, onSearchArea, districts, amenities } =
    props;
  const t = useTranslations('Listings');
  const params = useSearchParams();
  const [extra, setExtra] = useState<ListingOutput[]>([]);
  const data = mapListings.length > 0 ? mapListings : extra;

  useEffect(() => {
    let cancelled = false;
    if (open && mapListings.length === 0 && extra.length === 0) {
      fetchListings({ ...filtersFromSearchParams(params), per_page: '200' }).then((res) => {
        if (!cancelled) {
          setExtra(res);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [open, mapListings.length, extra.length, params]);

  const summary = useMemo(() => {
    const parts: string[] = [];
    const district = districts.find((d) => String(d.id) === params.get('district_id'));
    if (district) {
      parts.push(district.name);
    }
    const priceMin = params.get('price_min');
    const priceMax = params.get('price_max');
    if (priceMin || priceMax) {
      parts.push(`$${priceMin ?? '0'}–$${priceMax ?? '∞'}`);
    }
    const roomsMin = params.get('rooms_min');
    const roomsMax = params.get('rooms_max');
    if (roomsMin || roomsMax) {
      parts.push(`${roomsMin ?? '1'}–${roomsMax ?? '∞'} ${t('sb_rooms')}`);
    }
    return parts.join(' · ');
  }, [params, districts, t]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <DiscoveryMapPanel
        className="absolute inset-0"
        onMarkerClick={onSelect}
        onSearchArea={onSearchArea}
        points={listingsToPoints(data)}
        searchAreaClassName="top-20"
        selectedId={selectedId}
      />

      {/* Top bar — back + search summary + filter. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 p-4">
        <button
          aria-label={t('close_map')}
          className="pointer-events-auto inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md"
          onClick={onClose}
          type="button"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="pointer-events-auto flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-card px-3.5 shadow-md">
          <button
            className="flex min-w-0 flex-1 items-center gap-2"
            onClick={onClose}
            type="button"
          >
            <Search className="size-[18px] shrink-0 text-muted-foreground" />
            <span className="truncate text-[14px] text-foreground">{summary || t('where_to')}</span>
          </button>
          <AllFiltersSheet
            amenities={amenities}
            districts={districts}
            trigger={
              <button
                aria-label={t('open_filters')}
                className="shrink-0 text-muted-foreground"
                type="button"
              >
                <SlidersHorizontal className="size-[18px]" />
              </button>
            }
          />
        </div>
      </div>

      {/* Bottom — "List" pill + synced carousel. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 pb-4">
        <button
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg"
          onClick={onClose}
          type="button"
        >
          <List className="size-4" />
          {t('view_list')}
        </button>
        <div className="w-full">
          <MobileListingCarousel listings={data} onSelect={onSelect} selectedId={selectedId} />
        </div>
      </div>
    </div>
  );
}
