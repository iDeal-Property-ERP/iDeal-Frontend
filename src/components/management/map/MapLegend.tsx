import { cn } from '@/libs/utils';

export type MapLegendItem = {
  status: string;
  label: string;
  count: number;
  color: string;
};

/**
 * The floating map legend — a card listing each property status with its swatch
 * colour and count, per the Figma design. Rendered as an overlay by the map
 * page (bottom-left on desktop, a collapsed pill on mobile).
 * @param props - The legend items and an optional class for positioning.
 * @returns The legend card element.
 */
export function MapLegend(props: { items: MapLegendItem[]; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 rounded-[12px] border border-border bg-card/95 p-4 shadow-lg backdrop-blur',
        props.className,
      )}
    >
      {props.items.map((item) => (
        <div key={item.status} className="flex items-center justify-between gap-6 text-sm">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground">{item.label}</span>
          </span>
          <span className="font-medium text-foreground tabular-nums">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The compact mobile legend pill — status swatches with counts inline, per the
 * Figma mobile map frame.
 * @param props - The legend items and an optional class for positioning.
 * @returns The legend pill element.
 */
export function MapLegendPill(props: { items: MapLegendItem[]; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-full border border-border bg-card/95 px-3.5 py-2 shadow-lg backdrop-blur',
        props.className,
      )}
    >
      {props.items.map((item) => (
        <span key={item.status} className="flex items-center gap-1.5 text-sm">
          <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="font-medium text-foreground tabular-nums">{item.count}</span>
        </span>
      ))}
    </div>
  );
}
