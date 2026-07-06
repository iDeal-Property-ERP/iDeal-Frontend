'use client';

import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { MethodSegmented } from '@/components/management/MethodSegmented';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export type MarkPaidLine = { id: number; name: string; detail: string };

/**
 * The mobile "Mark paid" bottom sheet (Figma M · Mark paid) — a grabber sheet
 * listing the chosen payments, a Cash/Bank/Click/Payme method segmented control
 * with the "Cash needs no reference…" hint, and a full-width "Confirm · $sum"
 * action. Confirms with the picked method; the caller runs the undoable bulk
 * mark-paid so the top undo toast still applies.
 * @param props - Open state, the payment lines, total, method options, labels,
 *   and the confirm handler.
 * @returns The mark-paid bottom sheet.
 */
export function MarkPaidSheet(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  lines: MarkPaidLine[];
  methodOptions: { value: string; label: string }[];
  methodLabel: string;
  cashHint: string;
  confirmLabel: string;
  onConfirm: (method: string) => void;
}) {
  const [method, setMethod] = useState('cash');

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="bottom" className="gap-0 rounded-t-[20px] px-4 pt-3 pb-6">
        <span className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
        <SheetHeader className="gap-1 p-0 text-left">
          <SheetTitle className="font-display text-[22px] font-bold tracking-[-0.3px]">
            {props.title}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">{props.subtitle}</p>
        </SheetHeader>

        <ul className="mt-4 flex flex-col gap-2 rounded-[12px] bg-muted/60 px-3.5 py-3">
          {props.lines.map((line) => (
            <li key={line.id} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 shrink-0 text-success" />
              <span className="text-foreground">{line.name}</span>
              <span className="text-muted-foreground">— {line.detail}</span>
            </li>
          ))}
        </ul>

        <MethodSegmented
          label={props.methodLabel}
          options={props.methodOptions}
          value={method}
          onChange={setMethod}
          className="mt-5"
        />
        <p className="mt-2 text-xs text-muted-foreground">{props.cashHint}</p>

        <Button
          className="mt-6 h-12 w-full gap-2 rounded-[12px] text-[15px]"
          onClick={() => {
            props.onConfirm(method);
            props.onOpenChange(false);
          }}
        >
          <CheckCircle2 className="size-[18px]" />
          {props.confirmLabel}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
