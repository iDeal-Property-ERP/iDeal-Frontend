'use client';

import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Link } from '@/libs/I18nNavigation';
import { cn } from '@/libs/utils';

type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  /** Optional row navigation — wraps each cell in a Link. */
  rowHref?: (row: T) => string;
  onRowClick?: (row: T) => void;
  filters?: ReactNode;
  /** Server-side pagination (1-indexed). */
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};

/**
 * Generic TanStack-powered data table: client-side sorting, server pagination,
 * optional row linking, filters slot, and a loading skeleton.
 * @param props - Column defs, data, and optional pagination/filter/linking props.
 * @returns Data table element.
 */
export function DataTable<T>(props: DataTableProps<T>) {
  'use no memo';
  const t = useTranslations('DataTable');
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: props.data,
    columns: props.columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    state: { sorting },
    onSortingChange: setSorting,
  });

  if (props.isLoading) {
    return (
      <div className="space-y-4">
        {props.filters}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={`row-skeleton-${i}`} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const colCount = table.getAllLeafColumns().length;

  return (
    <div className="space-y-4">
      {props.filters}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const label = header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext());
                  return (
                    <TableHead key={header.id} className="px-4 text-muted-foreground">
                      {canSort ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-2 h-8 px-2 font-medium hover:bg-transparent"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {label}
                          {sorted === 'asc' && <ArrowUpIcon className="ml-1 size-3.5" />}
                          {sorted === 'desc' && <ArrowDownIcon className="ml-1 size-3.5" />}
                          {!sorted && <ChevronsUpDownIcon className="ml-1 size-3.5 opacity-50" />}
                        </Button>
                      ) : (
                        label
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={colCount}
                  className="h-24 px-4 text-center text-muted-foreground"
                >
                  {props.emptyMessage ?? t('no_data')}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const href = props.rowHref?.(row.original);
                return (
                  <TableRow
                    key={row.id}
                    onClick={href ? undefined : () => props.onRowClick?.(row.original)}
                    className={cn(props.onRowClick && !href && 'cursor-pointer')}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const content = flexRender(cell.column.columnDef.cell, cell.getContext());
                      if (!href) {
                        return (
                          <TableCell key={cell.id} className="px-4">
                            {content}
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={cell.id} className="p-0">
                          <Link href={href} className="block px-4 py-2">
                            {content}
                          </Link>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {props.page !== undefined && props.totalPages !== undefined && props.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {t('page_of', { page: props.page, total: props.totalPages })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={props.page <= 1}
                onClick={() => props.onPageChange?.((props.page ?? 1) - 1)}
              >
                {t('previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={props.page >= props.totalPages}
                onClick={() => props.onPageChange?.((props.page ?? 1) + 1)}
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
