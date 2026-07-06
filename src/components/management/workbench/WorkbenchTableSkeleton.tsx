import { Skeleton } from '@/components/ui/skeleton';

/**
 * A loading skeleton that mirrors the workbench table's final layout — a muted
 * header strip and rows with a thumbnail, two text lines, and trailing chips —
 * so content cross-fades in without a layout jump. Never a bare spinner.
 * @param props - Optional row count (defaults to 8).
 * @returns The table skeleton element.
 */
export function WorkbenchTableSkeleton(props: { rows?: number }) {
  const rows = props.rows ?? 8;
  return (
    <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-sm">
      <div className="flex h-10 items-center gap-4 border-b border-border bg-muted/40 px-4">
        <Skeleton className="size-4 rounded-[4px]" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={`skeleton-row-${index}`}
          className="flex h-[60px] items-center gap-4 border-b border-border px-4 last:border-b-0"
        >
          <Skeleton className="size-4 rounded-[4px]" />
          <Skeleton className="size-10 rounded-[8px]" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <Skeleton className="hidden h-3 w-20 md:block" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="hidden h-3 w-14 lg:block" />
        </div>
      ))}
    </div>
  );
}
