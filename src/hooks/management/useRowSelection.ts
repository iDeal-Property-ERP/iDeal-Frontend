'use client';

import { useRef, useState } from 'react';

export type RowId = string | number;

/**
 * Row-selection state for workbench tables: a selected-id set with single toggle,
 * shift-range toggle, page select-all, and clear — plus derived `allChecked` /
 * `someChecked` flags for the header checkbox's indeterminate state. Reusable by
 * every list screen.
 * @param pageIds - The ordered ids currently rendered on the page.
 * @returns Selection state and mutators.
 */
export function useRowSelection(pageIds: RowId[]) {
  const [selected, setSelected] = useState<Set<RowId>>(new Set());
  const lastIndexRef = useRef<number | null>(null);

  /**
   * Toggles one row; a shift-click extends the range from the last toggled row.
   * @param id - The row id.
   * @param checked - The new checked state.
   * @param index - The row's index in the current page.
   * @param shiftKey - Whether shift was held (range select).
   */
  function toggle(id: RowId, checked: boolean, index: number, shiftKey: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      const lastIndex = lastIndexRef.current;
      if (shiftKey && lastIndex !== null) {
        const [start, end] = lastIndex < index ? [lastIndex, index] : [index, lastIndex];
        for (let i = start; i <= end; i += 1) {
          const rangeId = pageIds[i];
          if (rangeId !== undefined) {
            if (checked) {
              next.add(rangeId);
            } else {
              next.delete(rangeId);
            }
          }
        }
      } else if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
    lastIndexRef.current = index;
  }

  /**
   * Selects or clears every row on the current page.
   * @param checked - Whether to select all page rows.
   */
  function toggleAll(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
    lastIndexRef.current = null;
  }

  /** Clears the whole selection across all pages. */
  function clear() {
    setSelected(new Set());
    lastIndexRef.current = null;
  }

  const selectedOnPage = pageIds.filter((id) => selected.has(id)).length;
  const allChecked = pageIds.length > 0 && selectedOnPage === pageIds.length;
  const someChecked = selectedOnPage > 0 && !allChecked;

  return {
    selected,
    count: selected.size,
    isSelected: (id: RowId) => selected.has(id),
    toggle,
    toggleAll,
    clear,
    allChecked,
    someChecked,
  };
}
