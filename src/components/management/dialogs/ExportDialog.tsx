'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { MethodSegmented } from '@/components/management/MethodSegmented';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ExportFormat } from '@/libs/management/exportFile';
import { cn } from '@/libs/utils';

export type ExportScope = 'filtered' | 'all' | 'selected';

type ScopeOption = { value: ExportScope; label: string; count: number };

/**
 * The shared Export dialog (Figma `dialog/export`) — scope radios
 * (filtered view / all / selected) plus an XLSX / CSV / PDF format segmented
 * control, with the "visible columns only · money in original currency"
 * footnote. Entity-agnostic: the page provides the scope counts, labels, and the
 * async `onExport(scope, format)` handler that actually fetches + downloads.
 * @param props - Open state, scope counts, labels, and the export handler.
 * @returns The export dialog element.
 */
export function ExportDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  currentViewLabel: string;
  counts: { filtered: number; all: number; selected: number };
  onExport: (scope: ExportScope, format: ExportFormat) => Promise<void>;
  labels: {
    scopeTitle: string;
    filtered: (count: number) => string;
    all: (count: number) => string;
    selected: (count: number) => string;
    formatTitle: string;
    footnote: string;
    cancel: string;
    submit: (count: number) => string;
    failed: string;
  };
}) {
  const [scope, setScope] = useState<ExportScope>('filtered');
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [busy, setBusy] = useState(false);

  const scopeOptions: ScopeOption[] = [
    {
      value: 'filtered',
      label: props.labels.filtered(props.counts.filtered),
      count: props.counts.filtered,
    },
    { value: 'all', label: props.labels.all(props.counts.all), count: props.counts.all },
    {
      value: 'selected',
      label: props.labels.selected(props.counts.selected),
      count: props.counts.selected,
    },
  ];

  const activeCount = scopeOptions.find((option) => option.value === scope)?.count ?? 0;

  const submit = async () => {
    setBusy(true);
    try {
      await props.onExport(scope, format);
      props.onOpenChange(false);
    } catch {
      toast.error(props.labels.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.currentViewLabel}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
              {props.labels.scopeTitle}
            </span>
            {scopeOptions.map((option) => {
              const active = option.value === scope;
              const disabled = option.value === 'selected' && option.count === 0;
              return (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-[10px] px-1 py-1.5 text-left text-sm outline-none',
                    disabled && 'cursor-not-allowed opacity-40',
                  )}
                >
                  <input
                    type="radio"
                    name="export-scope"
                    value={option.value}
                    checked={active}
                    disabled={disabled}
                    onChange={() => setScope(option.value)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      'flex size-[18px] shrink-0 items-center justify-center rounded-full border-2',
                      active ? 'border-primary' : 'border-border',
                    )}
                  >
                    {active ? <span className="size-2 rounded-full bg-primary" /> : null}
                  </span>
                  <span className="text-foreground">{option.label}</span>
                </label>
              );
            })}
          </div>
          <MethodSegmented
            label={props.labels.formatTitle}
            options={[
              { value: 'xlsx', label: 'XLSX' },
              { value: 'csv', label: 'CSV' },
              { value: 'pdf', label: 'PDF' },
            ]}
            value={format}
            // SAFETY: Options list only offers supported ExportFormat values
            onChange={(value) => setFormat(value as ExportFormat)}
          />
          <p className="text-xs text-muted-foreground">{props.labels.footnote}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {props.labels.cancel}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {props.labels.submit(activeCount)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
