'use client';

import { Building2, X } from 'lucide-react';
import { propertyStatusTone, StatusPill } from '@/components/management/columns/StatusPill';
import { cn } from '@/libs/utils';
import type { ManagementPropertyMapRow } from '@/types/management';

export type MapPopupLabels = {
  meta: (row: ManagementPropertyMapRow) => string;
  status: (status: string) => string;
  tenantLine: (row: ManagementPropertyMapRow) => string;
  price: (row: ManagementPropertyMapRow) => string;
  openRecord: string;
  close: string;
};

/**
 * The shared property popup body — thumbnail, name, meta line, status pill,
 * tenant/vacancy line, price, and an "Open record" action, per the Figma map
 * popup. Used as a floating card on desktop and inside a bottom sheet on mobile.
 * @param props - The property row, labels, and open-record/close callbacks.
 * @returns The popup body element.
 */
function MapPopupBody(props: {
  property: ManagementPropertyMapRow;
  labels: MapPopupLabels;
  onOpenRecord: () => void;
  onClose?: () => void;
}) {
  const { property, labels } = props;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex h-24 items-center justify-center rounded-[8px] bg-muted">
        <Building2 className="size-8 text-muted-foreground" />
        {props.onClose ? (
          <button
            type="button"
            onClick={props.onClose}
            aria-label={labels.close}
            className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-card/80 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-foreground">{property.name}</span>
        <span className="text-xs text-muted-foreground">{labels.meta(property)}</span>
        <div className="flex items-center justify-between gap-2 pt-1">
          <StatusPill
            tone={propertyStatusTone(property.status)}
            label={labels.status(property.status)}
          />
          <span className="text-sm font-semibold text-foreground">{labels.price(property)}</span>
        </div>
        <span className="text-xs text-muted-foreground">{labels.tenantLine(property)}</span>
      </div>
      <button
        type="button"
        onClick={props.onOpenRecord}
        className="text-left text-sm font-medium text-accent-brand"
      >
        {labels.openRecord} →
      </button>
    </div>
  );
}

/**
 * The desktop floating map popup — an elevated card pinned inside the map canvas
 * (top-left) for the selected property.
 * @param props - The property, labels, and callbacks; null property renders nothing.
 * @returns The floating popup element or null.
 */
export function MapPopup(props: {
  property: ManagementPropertyMapRow | null;
  labels: MapPopupLabels;
  onOpenRecord: () => void;
  onClose: () => void;
  className?: string;
}) {
  if (!props.property) {
    return null;
  }
  return (
    <div
      className={cn(
        'absolute top-4 left-4 z-10 w-[280px] rounded-[12px] border border-border bg-card p-3 shadow-xl',
        props.className,
      )}
    >
      <MapPopupBody
        property={props.property}
        labels={props.labels}
        onOpenRecord={props.onOpenRecord}
        onClose={props.onClose}
      />
    </div>
  );
}

/**
 * The mobile map popup — the same body inside a bottom sheet anchored to the
 * viewport foot, per the Figma mobile map frame.
 * @param props - The property, labels, and callbacks; null property renders nothing.
 * @returns The bottom-sheet popup element or null.
 */
export function MapPopupSheet(props: {
  property: ManagementPropertyMapRow | null;
  labels: MapPopupLabels;
  onOpenRecord: () => void;
  onClose: () => void;
}) {
  if (!props.property) {
    return null;
  }
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 rounded-t-[16px] border-t border-border bg-card p-4 shadow-2xl">
      <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-muted-foreground/40" />
      <MapPopupBody
        property={props.property}
        labels={props.labels}
        onOpenRecord={props.onOpenRecord}
        onClose={props.onClose}
      />
    </div>
  );
}
