'use client';

import { Map as MapIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DiscoveryMapPanel } from '@/components/listings/DiscoveryMapPanel';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { MapSidebarPanel } from '@/components/listings/MapSidebarPanel';
import { MobileMapOverlay } from '@/components/listings/MobileMapOverlay';
import { Pagination } from '@/components/listings/Pagination';
import { SortDropdown } from '@/components/listings/SortDropdown';
import { useListingParams } from '@/hooks/useListingParams';
import { listingsToPoints } from '@/libs/marketplace';
import { cn } from '@/libs/utils';
import type {
  AmenityOption,
  DiscoveryView,
  DistrictOption,
  ListingOutput,
} from '@/types/marketplace';

type DiscoveryResultsProps = {
  view: DiscoveryView;
  listings: ListingOutput[];
  mapListings: ListingOutput[];
  count: number;
  page: number;
  numPages: number;
  districts: DistrictOption[];
  amenities: AmenityOption[];
};

/**
 * Discovery results orchestrator: renders the active desktop view (List / Split / Map) and the
 * universal mobile layer (a floating "Map" pill + full-screen overlay). Holds the shared
 * `selectedId` so card hover and map pins stay in sync, and the full-map collapse state.
 * @param props - The active view, the paginated listings, the larger map dataset, and pagination.
 * @returns The view-aware results region.
 */
export function DiscoveryResults(props: DiscoveryResultsProps) {
  const { view, listings, mapListings, count, page, numPages, districts, amenities } = props;
  const t = useTranslations('Listings');
  const { set } = useListingParams();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const points = listingsToPoints(mapListings);

  const selectCard = (id: number) => setSelectedId(id);
  const onMarkerClick = (id: number) => {
    setSelectedId(id);
    document
      .querySelector(`#listing-${id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const searchThisArea = (bbox: string) => set({ bbox });

  const header = (
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="font-display text-xl font-bold tracking-[-0.01em] text-foreground">
        {t('result_count', { count })}
      </p>
      <SortDropdown />
    </div>
  );

  return (
    <div>
      {view === 'list' && (
        <div>
          {header}
          <ListingGrid columns={3} listings={listings} />
          <Pagination numPages={numPages} page={page} />
        </div>
      )}

      {view === 'split' && (
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_516px] lg:gap-6">
          <div>
            {header}
            <ListingGrid
              columns={2}
              listings={listings}
              onSelect={selectCard}
              selectedId={selectedId}
            />
            <Pagination numPages={numPages} page={page} />
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-24 h-[78vh]">
              <DiscoveryMapPanel
                onMarkerClick={onMarkerClick}
                onSearchArea={searchThisArea}
                points={points}
                rounded
                selectedId={selectedId}
              />
            </div>
          </div>
        </div>
      )}

      {view === 'map' && (
        <div className="lg:flex lg:h-[80vh] lg:gap-6">
          <div
            className={cn(
              'lg:shrink-0 lg:transition-[width]',
              collapsed ? 'lg:w-12' : 'lg:w-[380px]',
            )}
          >
            <MapSidebarPanel
              collapsed={collapsed}
              count={count}
              listings={listings}
              numPages={numPages}
              onSelect={selectCard}
              onToggleCollapse={() => setCollapsed((c) => !c)}
              page={page}
              selectedId={selectedId}
            />
          </div>
          <div className="hidden min-w-0 flex-1 lg:block">
            <DiscoveryMapPanel
              onMarkerClick={onMarkerClick}
              onSearchArea={searchThisArea}
              points={points}
              rounded
              selectedId={selectedId}
            />
          </div>
        </div>
      )}

      {/* Mobile: floating Map pill + full-screen overlay (universal across views). */}
      <button
        className="fixed bottom-6 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg lg:hidden"
        onClick={() => setMapOpen(true)}
        type="button"
      >
        <MapIcon className="size-4" />
        {t('view_map')}
      </button>

      <MobileMapOverlay
        amenities={amenities}
        districts={districts}
        mapListings={mapListings}
        onClose={() => setMapOpen(false)}
        onSearchArea={searchThisArea}
        onSelect={selectCard}
        open={mapOpen}
        selectedId={selectedId}
      />
    </div>
  );
}
