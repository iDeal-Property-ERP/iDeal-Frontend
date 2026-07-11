'use client';

import { List, MapIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { propertyStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import { MapLegendPill } from '@/components/management/map/MapLegend';
import type { MapLegendItem } from '@/components/management/map/MapLegend';
import { MapPopupSheet } from '@/components/management/map/MapPopup';
import type { MapPopupLabels } from '@/components/management/map/MapPopup';
import { PortfolioMap } from '@/components/management/map/PortfolioMap';
import type { ManagementPropertyMapRow } from '@/types/management';

/**
 * The mobile portfolio map — a full-viewport map with a bottom-left legend pill,
 * a bottom-center List/Map toggle pill, and a bottom-sheet popup for the selected
 * property, per Figma 508:2936. The List pill swaps the map for a card list of the
 * same properties (Map pill returns); tapping a card selects it and opens the
 * shared popup. The parent owns data, selection, and the record-panel handoff.
 * @param props - Properties, legend items, selection, and the popup labels/actions.
 * @returns The mobile map view.
 */
export function MapMobileView(props: {
  properties: ManagementPropertyMapRow[];
  legend: MapLegendItem[];
  selected: ManagementPropertyMapRow | null;
  onMarkerClick: (id: number) => void;
  onOpenRecord: () => void;
  onClosePopup: () => void;
  popupLabels: MapPopupLabels;
}) {
  const t = useTranslations('Management');
  const [mode, setMode] = useState<'map' | 'list'>('map');
  const { popupLabels } = props;

  return (
    <div className="relative">
      {mode === 'map' ? (
        <>
          <PortfolioMap
            properties={props.properties}
            onMarkerClick={props.onMarkerClick}
            className="h-[calc(100vh-13rem)] w-full"
          />
          <MapLegendPill items={props.legend} className="absolute bottom-20 left-3 z-10" />
        </>
      ) : (
        <div className="flex h-[calc(100vh-13rem)] flex-col gap-2.5 overflow-y-auto pb-24">
          {props.properties.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => props.onMarkerClick(row.id)}
              className="flex flex-col gap-1.5 rounded-[14px] border border-border bg-card px-3.5 py-3 text-left"
            >
              <span className="text-sm font-semibold text-foreground">{row.name}</span>
              <span className="text-xs text-muted-foreground">{popupLabels.meta(row)}</span>
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <StatusPill
                  tone={propertyStatusTone(row.status)}
                  label={popupLabels.status(row.status)}
                />
                <span className="text-sm font-semibold text-foreground">
                  {popupLabels.price(row)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setMode((current) => (current === 'map' ? 'list' : 'map'))}
        className="absolute bottom-6 left-1/2 z-20 flex h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg"
      >
        {mode === 'map' ? <List className="size-4" /> : <MapIcon className="size-4" />}
        {mode === 'map' ? t('map_toggle_list') : t('map_toggle_map')}
      </button>

      <MapPopupSheet
        property={props.selected}
        labels={popupLabels}
        onOpenRecord={props.onOpenRecord}
        onClose={props.onClosePopup}
      />
    </div>
  );
}
