'use client';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { DraftState } from '@/hooks/management/usePropertyDraft';
import { cn } from '@/libs/utils';

type DraftSavedChipProps = {
  state: DraftState;
  labels: { saving: string; saved: string; error: string };
};

const TONE: Record<Exclude<DraftState, 'idle'>, string> = {
  saving: 'text-muted-foreground',
  saved: 'text-success',
  error: 'text-danger',
};

/**
 * The "Draft saved just now" status chip shown in the create form header. Cycles
 * idle → saving (spinner) → saved (check) → error, matching the Figma treatment.
 * @param props - The draft state and localized labels.
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
      {state === 'error' ? <AlertCircle className="size-3.5" /> : null}
      <span>{labels[state]}</span>
    </div>
  );
}
