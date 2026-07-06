'use client';

import type { ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { RowId } from '@/hooks/management/useRowSelection';
import { cn } from '@/libs/utils';

export type WorkbenchColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Fixed pixel width from Figma; omit for the flexible primary column. */
  width?: number;
  align?: 'left' | 'right';
  /** Secondary columns are dropped when the table is dense (record panel open). */
  secondary?: boolean;
  headerClassName?: string;
  cellClassName?: string;
};

/**
 * The header checkbox tri-state value.
 * @param all - Whether all page rows are selected.
 * @param some - Whether some (but not all) page rows are selected.
 * @returns `true`, `'indeterminate'`, or `false`.
 */
function headerCheckboxValue(all: boolean, some: boolean): boolean | 'indeterminate' {
  if (all) {
    return true;
  }
  if (some) {
    return 'indeterminate';
  }
  return false;
}

/**
 * The background class for a row given its active/selected state.
 * @param active - Whether the row's record panel is open.
 * @param selected - Whether the row is checked.
 * @returns The Tailwind background class.
 */
function rowStateClass(active: boolean, selected: boolean): string {
  if (active) {
    return 'bg-primary-subtle/50';
  }
  if (selected) {
    return 'bg-primary-subtle/40';
  }
  return 'hover:bg-muted/40';
}

/**
 * The generic workbench table — checkbox selection (with a page select-all and
 * an indeterminate header state), whole-row click to open the record panel,
 * hover-revealed row actions, and keyboard navigation (↑/↓ move focus, Enter
 * opens). Column widths mirror the Figma spec. Reused by every list screen; it
 * holds no entity-specific logic.
 * @param props - Columns, rows, selection state/handlers, and open/actions slots.
 * @returns The table element.
 */
export function WorkbenchTable<T>(props: {
  columns: WorkbenchColumn<T>[];
  rows: T[];
  getRowId: (row: T) => RowId;
  isSelected: (id: RowId) => boolean;
  onToggleRow: (id: RowId, checked: boolean, index: number, shiftKey: boolean) => void;
  allChecked: boolean;
  someChecked: boolean;
  onToggleAll: (checked: boolean) => void;
  onOpenRecord: (row: T) => void;
  activeId?: RowId | null;
  rowActions?: (row: T) => ReactNode;
  /** When true, drops secondary columns (used while the record panel is open). */
  dense?: boolean;
  labels: { selectAll: string; selectRow: string };
}) {
  const columns = props.dense ? props.columns.filter((column) => !column.secondary) : props.columns;
  const headerCheckboxState = headerCheckboxValue(props.allChecked, props.someChecked);

  return (
    <div className="overflow-x-auto rounded-[16px] border border-border bg-card shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th scope="col" className="w-[52px] py-0 pr-2 pl-4">
              <Checkbox
                checked={headerCheckboxState}
                onCheckedChange={(checked) => props.onToggleAll(checked === true)}
                aria-label={props.labels.selectAll}
              />
            </th>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  'px-3 py-2.5 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase',
                  column.align === 'right' ? 'text-right' : 'text-left',
                  column.headerClassName,
                )}
              >
                {column.header}
              </th>
            ))}
            {props.rowActions ? <th scope="col" className="w-[120px] pr-4" /> : null}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row, index) => {
            const id = props.getRowId(row);
            const selected = props.isSelected(id);
            const active = props.activeId === id;
            return (
              <tr
                key={id}
                tabIndex={0}
                aria-selected={selected}
                onClick={() => props.onOpenRecord(row)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    props.onOpenRecord(row);
                  } else if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    (event.currentTarget.nextElementSibling as HTMLElement | null)?.focus();
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    (event.currentTarget.previousElementSibling as HTMLElement | null)?.focus();
                  }
                }}
                className={cn(
                  'group h-[60px] cursor-pointer border-b border-border transition-colors last:border-b-0',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  rowStateClass(active, selected),
                )}
              >
                <td
                  className="py-0 pr-2 pl-4 align-middle"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Checkbox
                    checked={selected}
                    onClick={(event) => props.onToggleRow(id, !selected, index, event.shiftKey)}
                    aria-label={props.labels.selectRow}
                  />
                </td>
                {columns.map((column) => (
                  <td
                    key={column.id}
                    style={column.width ? { width: column.width } : undefined}
                    className={cn(
                      'px-3 align-middle text-sm text-foreground',
                      column.align === 'right' && 'text-right',
                      column.cellClassName,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
                {props.rowActions ? (
                  <td className="pr-4 align-middle" onClick={(event) => event.stopPropagation()}>
                    {props.rowActions(row)}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
