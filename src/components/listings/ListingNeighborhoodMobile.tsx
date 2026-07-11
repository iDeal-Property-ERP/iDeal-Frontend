'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { YandexMap } from '@/components/map/YandexMap';
import { cn } from '@/libs/utils';
import type { MapPoint } from '@/types/marketplace';

/**
 * Collapsed Neighborhood disclosure for mobile (Figma 116:2): a 44px header row
 * with the district as inline meta; the map mounts only when expanded so it
 * initializes at its real size.
 * @param props - The map points and the district label.
 * @returns The mobile neighborhood section.
 */
export function ListingNeighborhoodMobile(props: { points: MapPoint[]; district: string }) {
  const { points, district } = props;
  const t = useTranslations('ListingDetail');
  const [open, setOpen] = useState(false);
  const [first] = points;

  if (!first) {
    return null;
  }

  return (
    <div className="md:hidden">
      <button
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className="text-[16px] font-semibold text-foreground">{t('neighborhood')}</span>
        <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          {district}
          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
        </span>
      </button>
      {open && (
        <YandexMap
          center={[first.lat, first.lon]}
          className="mt-2 h-64 rounded-2xl"
          points={points}
          zoom={14}
        />
      )}
    </div>
  );
}
