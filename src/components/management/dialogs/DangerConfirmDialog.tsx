'use client';

import { AlertTriangle, CircleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * The shared destructive-confirm dialog (Figma 362:2 "Destructive flow") — a
 * danger-toned header, a quantified list of consequences, and an optional
 * type-to-confirm gate: when `confirmPhrase` is set, the danger action stays
 * disabled until the typed text matches exactly. Reusable across every
 * irreversible or high-impact management action. The caller owns the async work
 * and closes the dialog on success (pass `loading` while it runs).
 * @param props - Open state, copy, consequences, the confirm phrase/labels, and
 *   the confirm handler.
 * @returns The destructive confirm dialog.
 */
export function DangerConfirmDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Quantified consequences, listed in a danger-subtle box. */
  consequences?: string[];
  /** When set, the user must type this exact phrase to enable the danger action. */
  confirmPhrase?: string;
  /** Label above the type-to-confirm input. */
  typeLabel?: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState('');

  // Reset the typed phrase whenever the dialog re-opens for a new target.
  useEffect(() => {
    if (props.open) {
      setTyped('');
    }
  }, [props.open]);

  const gated = props.confirmPhrase !== undefined;
  const matches = !gated || typed.trim() === props.confirmPhrase;
  const disabled = props.loading || !matches;

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-danger-subtle text-danger">
              <AlertTriangle className="size-[18px]" />
            </span>
            {props.title}
          </AlertDialogTitle>
          <AlertDialogDescription>{props.description}</AlertDialogDescription>
        </AlertDialogHeader>

        {props.consequences && props.consequences.length > 0 ? (
          <ul className="flex flex-col gap-2 rounded-[12px] bg-danger-subtle px-3.5 py-3">
            {props.consequences.map((line) => (
              <li
                key={line}
                className="flex items-start gap-2 text-sm text-danger-subtle-foreground"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" />
                {line}
              </li>
            ))}
          </ul>
        ) : null}

        {gated ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">{props.typeLabel}</span>
            <Input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={props.confirmPhrase}
              autoComplete="off"
            />
          </label>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.loading}>{props.cancelLabel}</AlertDialogCancel>
          <Button variant="destructive" disabled={disabled} onClick={props.onConfirm}>
            {props.confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
