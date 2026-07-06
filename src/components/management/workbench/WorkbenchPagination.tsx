'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/libs/utils';

type PageItem = number | 'ellipsis';

/**
 * Builds a compact page list: first, last, the current page and its neighbours,
 * with ellipses filling the gaps.
 * @param page - The current 1-indexed page.
 * @param total - The total number of pages.
 * @returns The ordered page items to render.
 */
function getPageItems(page: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const items: PageItem[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) {
    items.push('ellipsis');
  }
  for (let value = start; value <= end; value += 1) {
    items.push(value);
  }
  if (end < total - 1) {
    items.push('ellipsis');
  }
  items.push(total);
  return items;
}

/**
 * Workbench pagination — a "1–8 of 128" summary and an optional page-size select
 * on the left, numbered pages with prev/next on the right.
 * @param props - Page state, handlers, the localized summary, and labels.
 * @returns The pagination row (or null when there is a single page and no size
 *   control).
 */
export function WorkbenchPagination(props: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  summary: string;
  labels: { previous: string; next: string; perPage: string };
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
}) {
  const items = getPageItems(props.page, props.totalPages);
  const showSizes = props.pageSize && props.pageSizeOptions && props.onPageSizeChange;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground tabular-nums">{props.summary}</span>
        {showSizes ? (
          <Select
            value={String(props.pageSize)}
            onValueChange={(value) => props.onPageSizeChange?.(Number(value))}
          >
            <SelectTrigger className="h-8 w-auto gap-1 text-xs" aria-label={props.labels.perPage}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {props.pageSizeOptions?.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / {props.labels.perPage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {props.totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={props.labels.previous}
            disabled={props.page <= 1}
            onClick={() => props.onPageChange(props.page - 1)}
            className="flex size-9 items-center justify-center rounded-[8px] border border-border bg-card text-muted-foreground transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          {items.map((item, index) =>
            item === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="flex size-9 items-center justify-center text-sm text-muted-foreground"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-current={item === props.page ? 'page' : undefined}
                onClick={() => props.onPageChange(item)}
                className={cn(
                  'flex size-9 items-center justify-center rounded-[8px] border text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  item === props.page
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:bg-muted/60',
                )}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            aria-label={props.labels.next}
            disabled={props.page >= props.totalPages}
            onClick={() => props.onPageChange(props.page + 1)}
            className="flex size-9 items-center justify-center rounded-[8px] border border-border bg-card text-muted-foreground transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
