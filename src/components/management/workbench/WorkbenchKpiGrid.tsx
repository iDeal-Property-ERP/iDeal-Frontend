import { KpiCard } from '@/components/management/KpiStrip';
import type { KpiItem } from '@/components/management/KpiStrip';

/**
 * The workbench KPI grid — four cards (or four skeleton tiles while stats load).
 * Collapses to two columns while a record panel is open so the strip keeps its
 * proportions beside the pushed-in panel. Shared by the Finance workbenches.
 * @param props - The KPI items (null while loading) and the compact flag.
 * @returns The KPI grid element.
 */
export function WorkbenchKpiGrid(props: { items: KpiItem[] | null; compact?: boolean }) {
  return (
    <div
      className={props.compact ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-2 gap-4 md:grid-cols-4'}
    >
      {props.items
        ? props.items.map((item) => <KpiCard key={item.id} {...item} />)
        : Array.from({ length: 4 }, (_, index) => (
            <div key={`kpi-skeleton-${index}`} className="h-[140px] rounded-[16px] bg-muted/40" />
          ))}
    </div>
  );
}
