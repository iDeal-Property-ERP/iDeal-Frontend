'use client';

import { toast } from 'sonner';

export type UndoableAction = {
  /** Toast message, e.g. "3 properties moved to Maintenance". */
  message: string;
  /** Undo action label. */
  undoLabel: string;
  /** How long the undo window stays open (defaults to 30s per the spec). */
  durationMs?: number;
  /** Applies the change to the UI immediately (optimistic). */
  onOptimistic?: () => void;
  /** Runs the real, irreversible mutation once the undo window closes. */
  onCommit: () => Promise<void> | void;
  /** Rolls the optimistic change back (on undo or on commit failure). */
  onRevert?: () => void;
  /** Called when the committed mutation fails. */
  onError?: (error: unknown) => void;
};

/**
 * Starts one reversible action with a 30s undo toast: the change is applied
 * optimistically and shown in a toast; the real mutation fires only after the
 * window closes, and an undo click reverts it before any API call is made.
 * @param action - The optimistic/commit/revert handlers and toast copy.
 */
function runUndoableAction(action: UndoableAction) {
  let undone = false;
  let settled = false;

  action.onOptimistic?.();

  const finalize = async () => {
    if (settled) {
      return;
    }
    settled = true;
    if (undone) {
      return;
    }
    try {
      await action.onCommit();
    } catch (error) {
      action.onRevert?.();
      action.onError?.(error);
    }
  };

  toast(action.message, {
    duration: action.durationMs ?? 30_000,
    action: {
      label: action.undoLabel,
      onClick: () => {
        undone = true;
        action.onRevert?.();
      },
    },
    onAutoClose: () => {
      void finalize();
    },
    onDismiss: () => {
      void finalize();
    },
  });
}

/**
 * Exposes the undoable-action runner. Matches the desktop toast semantics in the
 * Management spec (optimistic apply, commit on close, revert on undo).
 * @returns A `run` function that starts one undoable action.
 */
export function useUndoableAction() {
  return { run: runUndoableAction };
}
