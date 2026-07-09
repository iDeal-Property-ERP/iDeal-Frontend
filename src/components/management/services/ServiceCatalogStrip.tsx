'use client';

import { Plus } from 'lucide-react';
import { ServiceCard } from '@/components/management/services/ServiceCard';
import type { ServiceCatalogItemOutput } from '@/types/vas';

/**
 * The horizontally-scrollable catalog strip above the orders table on the
 * Services workbench (per the Figma design): one ServiceCard per active item
 * plus a trailing "add item" tile.
 * @param props - The catalog items, meta builder, and edit/add handlers.
 * @returns The strip element (null while the catalog is empty and loading).
 */
export function ServiceCatalogStrip(props: {
  items: ServiceCatalogItemOutput[];
  buildMeta: (item: ServiceCatalogItemOutput) => string;
  onEdit: (item: ServiceCatalogItemOutput) => void;
  onAdd: () => void;
  addLabel: string;
}) {
  if (props.items.length === 0) {
    return null;
  }
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {props.items.map((item) => (
        <ServiceCard
          key={item.id}
          item={item}
          meta={props.buildMeta(item)}
          onClick={() => props.onEdit(item)}
        />
      ))}
      <button
        type="button"
        onClick={props.onAdd}
        className="flex min-w-[150px] items-center justify-center gap-2 rounded-[12px] border border-dashed border-border px-3.5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Plus className="size-4" />
        {props.addLabel}
      </button>
    </div>
  );
}
