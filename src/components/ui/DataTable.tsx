'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Link } from '@/libs/I18nNavigation';
import { cn } from '@/libs/utils';

type Column<T> = {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  rowHref?: (item: T) => string;
  filters?: ReactNode;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};

/**
 * Generic data table with optional pagination, filters, row linking, and loading skeleton.
 * @param props - Columns, data, key extractor, and optional pagination/filter props.
 * @returns Data table element.
 */
export function DataTable<T>(props: DataTableProps<T>) {
  const t = useTranslations('DataTable');

  if (props.isLoading) {
    return (
      <div className="space-y-4">
        {props.filters}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {props.filters}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {props.columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn('px-4 py-3 font-medium text-muted-foreground', col.className)}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.data.length === 0 ? (
                <tr>
                  <td
                    colSpan={props.columns.length}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {props.emptyMessage ?? t('no_data')}
                  </td>
                </tr>
              ) : (
                props.data.map((item, index) => {
                  const href = props.rowHref?.(item);
                  return (
                    <tr
                      key={props.keyExtractor(item, index)}
                      onClick={href ? undefined : () => props.onRowClick?.(item)}
                      className={cn(
                        'border-b border-border/60 last:border-0',
                        props.onRowClick &&
                          !href &&
                          'cursor-pointer hover:bg-muted/50 transition-colors',
                      )}
                    >
                      {props.columns.map((col) => {
                        const cellContent = col.render
                          ? col.render(item)
                          : String((item as Record<string, unknown>)[col.key] ?? '');

                        if (!href) {
                          return (
                            <td key={col.key} className={cn('px-4 py-3', col.className)}>
                              {cellContent}
                            </td>
                          );
                        }

                        return (
                          <td key={col.key} className={cn('p-0', col.className)}>
                            <Link
                              href={href}
                              className="block px-4 py-3 transition-colors hover:bg-muted/50"
                            >
                              {cellContent}
                            </Link>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {props.page !== undefined && props.totalPages !== undefined && props.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {t('page_of', { page: props.page, total: props.totalPages })}
            </span>
            <div className="flex gap-2">
              <Button
                intent="outline"
                size="sm"
                disabled={props.page <= 1}
                onClick={() => {
                  props.onPageChange?.(props.page! - 1);
                }}
              >
                {t('previous')}
              </Button>
              <Button
                intent="outline"
                size="sm"
                disabled={
                  props.page !== undefined &&
                  props.totalPages !== undefined &&
                  props.page >= props.totalPages
                }
                onClick={() => {
                  props.onPageChange?.(props.page! + 1);
                }}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
