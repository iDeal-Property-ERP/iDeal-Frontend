'use client';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { DraftState } from '@/hooks/management/usePropertyDraft';
import { cn } from '@/libs/utils';

/** The chip renders the autosave lifecycle plus an edit-mode "unsaved" state. */
type ChipState = DraftState | 'unsaved';

type DraftSavedChipProps = {
  state: ChipState;
  labels: { saving: string; saved: string; error: string; unsaved: string };
};

const TONE: Record<Exclude<ChipState, 'idle'>, string> = {
  saving: 'text-muted-foreground',
  saved: 'text-success',
  error: 'text-danger',
  unsaved: 'text-warning',
};

/**
 * The status chip shown in the property form header. In create it tracks the
 * autosave lifecycle (idle → saving → saved → error); in edit it surfaces the
 * "Unsaved changes" indicator (warning alert) while the form is dirty. Matches
 * the Figma field-states board treatment.
 * @param props - The chip state and localized labels.
 * @returns The chip, or null when idle.
 */
export function DraftSavedChip(props: DraftSavedChipProps) {
  const { state, labels } = props;
  if (state === 'idle') {
    return null;
  }
  return (
    <div className={cn('flex items-center gap-1.5 text-sm', TONE[state])}>
      {state === 'saving' ? <Loader2 className="size-3.5 animate-spin" /> : null}
      {state === 'saved' ? <CheckCircle2 className="size-3.5" /> : null}
      {state === 'error' || state === 'unsaved' ? <AlertCircle className="size-3.5" /> : null}
      <span>{labels[state]}</span>
    </div>
  );
}
