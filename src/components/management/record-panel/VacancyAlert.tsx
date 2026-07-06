'use client';

import { Inbox, TriangleAlert } from 'lucide-react';

/**
 * The vacancy alert — a warning-toned banner surfacing how long a property has
 * been vacant and the accruing loss, with an optional link to related leads.
 * Shown only for vacant properties.
 * @param props - Title, detail line, and an optional action button.
 * @returns The vacancy alert element.
 */
export function VacancyAlert(props: {
  title: string;
  detail: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex w-full items-start gap-3 rounded-[12px] bg-warning-subtle px-4 py-3.5 text-warning-subtle-foreground">
      <TriangleAlert className="mt-0.5 size-[18px] shrink-0" strokeWidth={1.75} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm leading-5 font-medium">{props.title}</p>
        <p className="text-xs leading-4">{props.detail}</p>
      </div>
      {props.actionLabel ? (
        <button
          type="button"
          onClick={props.onAction}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Inbox className="size-3.5" />
          {props.actionLabel}
        </button>
      ) : null}
    </div>
  );
}
