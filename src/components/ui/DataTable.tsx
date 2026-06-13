'use client';

import type { ReactNode } from 'react';
import { Link } from '@/libs/I18nNavigation';

type Column<T> = {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  rowHref?: (item: T) => string;
  filters?: ReactNode;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};

export function DataTable<T>(props: DataTableProps<T>) {
  if (props.isLoading) {
    return (
      <div className="space-y-4">
        {props.filters}
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <div className="animate-pulse p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="mb-3 h-8 rounded bg-neutral-200 dark:bg-zinc-700" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {props.filters}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-zinc-700 dark:bg-zinc-800/50">
              <tr>
                {props.columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 font-medium text-neutral-600 dark:text-zinc-400 ${col.className ?? ''}`}
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
                    className="px-4 py-8 text-center text-neutral-400 dark:text-zinc-500"
                  >
                    {props.emptyMessage ?? 'No data'}
                  </td>
                </tr>
              ) : (
                props.data.map((item) => {
                  const href = props.rowHref?.(item);
                  return (
                    <tr
                      key={props.keyExtractor(item)}
                      onClick={href ? undefined : () => props.onRowClick?.(item)}
                      className={
                        props.onRowClick && !href
                          ? 'cursor-pointer border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50 dark:border-zinc-700/50 dark:hover:bg-zinc-800/50'
                          : 'border-b border-neutral-100 last:border-0 dark:border-zinc-700/50'
                      }
                    >
                      {props.columns.map((col) => {
                        const cellContent = col.render
                          ? col.render(item)
                          : String((item as Record<string, unknown>)[col.key] ?? '');

                        if (!href) {
                          return (
                            <td key={col.key} className={`px-4 py-3 ${col.className ?? ''}`}>
                              {cellContent}
                            </td>
                          );
                        }

                        return (
                          <td key={col.key} className={`p-0 ${col.className ?? ''}`}>
                            <Link
                              href={href}
                              className="block px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-zinc-800/50"
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
          <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 dark:border-zinc-700">
            <span className="text-sm text-neutral-500 dark:text-zinc-400">
              Page {props.page} of {props.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={props.page <= 1}
                onClick={() => {
                  props.onPageChange?.(props.page! - 1);
                }}
                className="rounded border border-neutral-200 px-3 py-1 text-sm disabled:opacity-40 dark:border-zinc-700"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={
                  props.page !== undefined &&
                  props.totalPages !== undefined &&
                  props.page >= props.totalPages
                }
                onClick={() => {
                  props.onPageChange?.(props.page! + 1);
                }}
                className="rounded border border-neutral-200 px-3 py-1 text-sm disabled:opacity-40 dark:border-zinc-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
