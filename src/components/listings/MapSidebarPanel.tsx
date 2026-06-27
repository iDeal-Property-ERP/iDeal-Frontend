'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { Pagination } from '@/components/listings/Pagination';
import { cn } from '@/libs/utils';
import type { ListingOutput } from '@/types/marketplace';

type MapSidebarPanelProps = {
  listings: ListingOutput[];
  count: number;
  page: number;
  numPages: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

/**
 * Collapsible left sidebar for the full-map view (Figma 241:2): a "{count} homes on map" header with
 * a collapse toggle, then a single-column scrollable list of cards. The header, toggle, and scroll
 * area are desktop-only, so on mobile this renders as a plain vertical list (the full-map desktop
 * chrome degrades to the mobile list).
 * @param props - Paginated listings, totals, map-selection sync, and the collapse state.
 * @returns The sidebar panel (full list + an optional collapsed rail).
 */
export function MapSidebarPanel(props: MapSidebarPanelProps) {
  const { listings, count, page, numPages, selectedId, onSelect, collapsed, onToggleCollapse } =
    props;
  const t = useTranslations('Listings');

  return (
    <>
      {/* Collapsed rail — desktop only, shown when the list is collapsed. */}
      <button
        aria-label={t('expand_list')}
        className={cn(
          'hidden size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition hover:text-foreground',
          collapsed ? 'lg:flex' : 'lg:hidden',
        )}
        onClick={onToggleCollapse}
        type="button"
      >
        <PanelLeftOpen className="size-[18px]" />
      </button>

      {/* Full panel — always shown on mobile; hidden on desktop when collapsed. */}
      <div className={cn('flex h-full flex-col', collapsed && 'lg:hidden')}>
        <div className="mb-4 hidden items-center justify-between lg:flex">
          <p className="text-base font-semibold text-foreground">{t('homes_on_map', { count })}</p>
          <button
            aria-label={t('collapse_list')}
            className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition hover:text-foreground"
            onClick={onToggleCollapse}
            type="button"
          >
            <PanelLeftClose className="size-[18px]" />
          </button>
        </div>
        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          <ListingGrid
            columns={1}
            listings={listings}
            onSelect={onSelect}
            selectedId={selectedId}
          />
          <Pagination numPages={numPages} page={page} />
        </div>
      </div>
    </>
  );
}
