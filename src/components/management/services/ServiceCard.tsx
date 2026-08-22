'use client';

import type { LucideIcon } from 'lucide-react';
import { Brush, Package, Sparkles, Wifi, Wrench, Zap } from 'lucide-react';
import { cn } from '@/libs/utils';
import type { ServiceCatalogItemOutput } from '@/types/vas';

const TYPE_ICONS = {
  cleaning: Brush,
  handyman: Wrench,
  utility: Zap,
  internet: Wifi,
  moving: Package,
  other: Sparkles,
} satisfies Record<string, LucideIcon>;

/**
 * Resolves the lucide icon for a VAS service type (brush, wrench, zap, wifi…).
 * @param serviceType - The backend service type.
 * @returns The matching icon component.
 */
export function serviceTypeIcon(serviceType: string): LucideIcon {
  if (serviceType in TYPE_ICONS) {
    // SAFETY: Service type validated against TYPE_ICONS lookup
    return TYPE_ICONS[serviceType as keyof typeof TYPE_ICONS];
  }
  return Sparkles;
}

/**
 * A catalog service card for the horizontal strip on the Services workbench —
 * type icon chip, name, and a price · partner · commission meta line, per the
 * Figma catalog strip. Inactive items render dimmed.
 * @param props - The catalog item, click handler, and meta line.
 * @returns The service card element.
 */
export function ServiceCard(props: {
  item: ServiceCatalogItemOutput;
  meta: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        'flex min-w-[240px] items-center gap-3 rounded-[12px] border border-border bg-card px-3.5 py-3 text-left transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        !props.item.is_active && 'opacity-60',
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-subtle text-primary-subtle-foreground">
        {serviceTypeIcon(props.item.service_type)({ className: 'size-4' })}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-foreground">{props.item.name}</span>
        <span className="truncate text-xs text-muted-foreground">{props.meta}</span>
      </span>
    </button>
  );
}
