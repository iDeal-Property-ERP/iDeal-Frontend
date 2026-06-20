import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/libs/utils';

const COLUMN_CLASS: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
};

type DetailGridProps = {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
};

/**
 * Responsive grid wrapper for detail-page sections.
 * @param props - Children, optional column count (default 2), and className.
 * @returns Grid container.
 */
export function DetailGrid(props: DetailGridProps) {
  return (
    <div className={cn('grid gap-6', COLUMN_CLASS[props.columns ?? 2], props.className)}>
      {props.children}
    </div>
  );
}

type DetailCardProps = {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

/**
 * Card section with an optional title and right-aligned action slot.
 * @param props - Title, action node, className, and children.
 * @returns Card section.
 */
export function DetailCard(props: DetailCardProps) {
  const hasHeader = Boolean(props.title) || Boolean(props.action);
  return (
    <Card className={cn('gap-4', props.className)}>
      {hasHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          {props.title ? (
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {props.title}
            </CardTitle>
          ) : (
            <span />
          )}
          {props.action}
        </CardHeader>
      )}
      <CardContent>{props.children}</CardContent>
    </Card>
  );
}

type DetailListProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Description-list wrapper for label/value rows.
 * @param props - Children rows and className.
 * @returns Description list.
 */
export function DetailList(props: DetailListProps) {
  return <dl className={cn('space-y-2 text-sm', props.className)}>{props.children}</dl>;
}

type DetailRowProps = {
  label: string;
  value: React.ReactNode;
  emphasized?: boolean;
  hideEmpty?: boolean;
};

/**
 * Single label/value row. Renders a `--` placeholder for empty values unless hidden.
 * @param props - Label, value node, emphasis flag, and hideEmpty flag.
 * @returns Row element, or null when empty and hideEmpty is set.
 */
export function DetailRow(props: DetailRowProps) {
  const isEmpty = props.value === null || props.value === undefined || props.value === '';
  if (isEmpty && props.hideEmpty) {
    return null;
  }
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{props.label}</dt>
      <dd className={cn('text-right', props.emphasized && 'font-semibold')}>
        {isEmpty ? '--' : props.value}
      </dd>
    </div>
  );
}

type DetailTextProps = {
  title?: string;
  children: React.ReactNode;
};

/**
 * Labeled free-text block that preserves whitespace (descriptions, notes, terms).
 * @param props - Optional title and text children.
 * @returns Text block.
 */
export function DetailText(props: DetailTextProps) {
  return (
    <div>
      {props.title && (
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">{props.title}</h3>
      )}
      <p className="text-sm whitespace-pre-wrap text-foreground">{props.children}</p>
    </div>
  );
}

type DetailStatProps = {
  label: string;
  value: React.ReactNode;
};

/**
 * Bordered stat tile for compact metric groups (pricing, agent KPIs).
 * @param props - Label and value node.
 * @returns Stat tile.
 */
export function DetailStat(props: DetailStatProps) {
  return (
    <div className="rounded-lg border border-border p-3 text-sm">
      <p className="text-muted-foreground">{props.label}</p>
      <p className="mt-1 font-semibold">{props.value}</p>
    </div>
  );
}

type DetailLoadingProps = {
  cards?: number;
};

/**
 * Uniform skeleton placeholder shown while a detail page loads.
 * @param props - Optional number of skeleton cards (default 2).
 * @returns Skeleton grid.
 */
export function DetailLoading(props: DetailLoadingProps) {
  const count = props.cards ?? 2;
  return (
    <DetailGrid>
      {Array.from({ length: count }, (_card, i) => (
        <Card key={`detail-skeleton-${i}`} className="gap-4">
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }, (_row, j) => (
              <Skeleton key={`detail-skeleton-${i}-${j}`} className="h-4 w-full" />
            ))}
          </CardContent>
        </Card>
      ))}
    </DetailGrid>
  );
}

type DetailErrorProps = {
  message: string;
};

/**
 * Uniform not-found / load-error state for detail pages.
 * @param props - Pre-translated message to display.
 * @returns Error message element.
 */
export function DetailError(props: DetailErrorProps) {
  return <p className="text-sm text-danger">{props.message}</p>;
}

type FormLoadingProps = {
  fields?: number;
};

/**
 * Uniform skeleton placeholder shown while an edit form loads its data.
 * @param props - Optional number of field skeletons (default 6).
 * @returns Skeleton stack.
 */
export function FormLoading(props: FormLoadingProps) {
  const count = props.fields ?? 6;
  return (
    <div className="max-w-2xl space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={`form-skeleton-${i}`} className="h-9 w-full" />
      ))}
    </div>
  );
}
