import { cn } from '@/libs/utils';

export type LegendItem = {
  label: string;
  /** CSS color value for the dot (e.g. "var(--color-primary)"). */
  color: string;
  /** Optional trailing value, e.g. a count. */
  value?: string;
};

/**
 * A compact legend row of colored dots + labels, optionally with trailing values.
 * @param props - The legend items and layout direction.
 * @returns The legend element.
 */
export function ChartLegend(props: { items: LegendItem[]; direction?: 'row' | 'col' }) {
  const isCol = props.direction === 'col';
  return (
    <div className={cn('flex gap-3.5', isCol ? 'flex-col gap-2' : 'flex-row items-center')}>
      {props.items.map((item) => (
        <div
          key={item.label}
          className={cn('flex items-center gap-1.5', isCol && 'w-full justify-between')}
        >
          <span className="flex items-center gap-1.5">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className={cn('text-muted-foreground', isCol ? 'text-sm' : 'text-xs leading-4')}>
              {item.label}
            </span>
          </span>
          {item.value ? (
            <span className="text-sm font-medium text-foreground tabular-nums">{item.value}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
