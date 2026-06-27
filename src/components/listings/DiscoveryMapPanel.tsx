'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { YandexMap } from '@/components/map/YandexMap';
import { cn } from '@/libs/utils';
import type { MapPoint } from '@/types/marketplace';

type DiscoveryMapPanelProps = {
  points: MapPoint[];
  selectedId: number | null;
  onMarkerClick: (id: number) => void;
  onSearchArea: (bbox: string) => void;
  rounded?: boolean;
  className?: string;
  searchAreaClassName?: string;
};

/**
 * The interactive map region shared by the Split, Map, and mobile-overlay views: a Yandex map with
 * brand price pins plus a floating "Search this area" button that reports the current bounds. Owns
 * the bbox ref so the bounds plumbing lives in one place.
 * @param props - Map points, selection sync, the search-area callback, and styling flags.
 * @returns The map panel.
 */
export function DiscoveryMapPanel(props: DiscoveryMapPanelProps) {
  const {
    points,
    selectedId,
    onMarkerClick,
    onSearchArea,
    rounded,
    className,
    searchAreaClassName,
  } = props;
  const t = useTranslations('Listings');
  const bboxRef = useRef<string | null>(null);

  return (
    <div
      className={cn('relative h-full w-full', rounded && 'overflow-hidden rounded-xl', className)}
    >
      <YandexMap
        className="h-full"
        onBoundsChange={(bbox) => {
          bboxRef.current = bbox;
        }}
        onMarkerClick={onMarkerClick}
        points={points}
        selectedId={selectedId}
      />
      <button
        className={cn(
          'absolute left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-md transition hover:bg-muted',
          searchAreaClassName ?? 'top-4',
        )}
        onClick={() => {
          if (bboxRef.current) {
            onSearchArea(bboxRef.current);
          }
        }}
        type="button"
      >
        <Search className="size-4" />
        {t('search_this_area')}
      </button>
    </div>
  );
}
