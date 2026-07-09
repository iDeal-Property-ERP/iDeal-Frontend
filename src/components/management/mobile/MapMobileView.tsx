'use client';

import { MapLegendPill } from '@/components/management/map/MapLegend';
import type { MapLegendItem } from '@/components/management/map/MapLegend';
import { MapPopupSheet } from '@/components/management/map/MapPopup';
import type { MapPopupLabels } from '@/components/management/map/MapPopup';
import { PortfolioMap } from '@/components/management/map/PortfolioMap';
import type { ManagementPropertyMapRow } from '@/types/management';

/**
 * The mobile portfolio map — a full-viewport map with a floating legend pill and
 * a bottom-sheet popup for the selected property, per the Figma mobile map frame.
 * The parent owns data, selection, and the record-panel handoff.
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
  return (
    <div className="relative">
      <PortfolioMap
        properties={props.properties}
        onMarkerClick={props.onMarkerClick}
        className="h-[calc(100vh-13rem)] w-full"
      />
      <MapLegendPill items={props.legend} className="absolute top-3 left-3 z-10" />
      <MapPopupSheet
        property={props.selected}
        labels={props.popupLabels}
        onOpenRecord={props.onOpenRecord}
        onClose={props.onClosePopup}
      />
    </div>
  );
}
