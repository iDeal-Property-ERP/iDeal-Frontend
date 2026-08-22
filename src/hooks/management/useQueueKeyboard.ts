'use client';

import { useEffect, useRef } from 'react';

type Options = {
  /** Ordered ids of the visible queue (the navigation order). */
  ids: string[];
  /** The currently selected id, or null. */
  selectedId: string | null;
  /** Move selection to an id (↑/↓). */
  onSelect: (id: string) => void;
  /** Open / act on the selected id (Enter). */
  onOpen?: (id: string) => void;
  /** Single-letter hotkeys, e.g. `{ c: () => confirm() }` (Linear-style). */
  hotkeys?: Record<string, () => void>;
  /** Disable all handling (e.g. while a dialog is open). */
  enabled?: boolean;
};

/**
 * Whether a keydown should be ignored: disabled, a modifier is held, or focus is
 * in a text-entry element (so the rail search never triggers a shortcut).
 * @param event - The keyboard event.
 * @param enabled - Whether the hook is active.
 * @returns True when the event must be ignored.
 */
function shouldIgnore(event: KeyboardEvent, enabled: boolean | undefined): boolean {
  if (enabled === false) {
    return true;
  }
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return true;
  }
  const target = event.target instanceof HTMLElement ? event.target : null;
  const tag = target?.tagName;
  return (
    tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(target?.isContentEditable)
  );
}

/**
 * Linear-style keyboard navigation for a triage queue: ↑/↓ move the selection
 * through `ids`, Enter opens the selected row, and single letters fire `hotkeys`.
 * Guards against firing while a dialog is open, while a modifier key is held, or
 * while focus is in a text input — so typing in the rail search never triggers a
 * shortcut.
 * @param options - The queue ids, selection state, and handlers.
 */
export function useQueueKeyboard(options: Options) {
  const ref = useRef(options);
  useEffect(() => {
    ref.current = options;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const opts = ref.current;
      if (shouldIgnore(event, opts.enabled)) {
        return;
      }
      const { ids, selectedId } = opts;
      if (ids.length === 0) {
        return;
      }
      const index = selectedId ? ids.indexOf(selectedId) : -1;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        opts.onSelect(ids[index < 0 ? 0 : Math.min(index + 1, ids.length - 1)]!);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        opts.onSelect(ids[index < 0 ? 0 : Math.max(index - 1, 0)]!);
      } else if (event.key === 'Enter' && selectedId) {
        opts.onOpen?.(selectedId);
      } else {
        const hotkey = opts.hotkeys?.[event.key.toLowerCase()];
        if (hotkey) {
          event.preventDefault();
          hotkey();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
