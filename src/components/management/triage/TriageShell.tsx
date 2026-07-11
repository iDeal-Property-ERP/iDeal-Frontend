import type { ReactNode } from 'react';

/**
 * The reusable split-view triage layout — the shared spine for the Leads and
 * Onboardings queues. Stacks the page header + status tabs above a two-column
 * body: a fixed 380px left rail (search + scrollable queue list + keyboard-hint
 * footer) and a flexible detail column. Entirely slot-based: it owns layout,
 * never entity logic. Desktop-only — the page branches to a mobile view below
 * the `lg` breakpoint.
 * @param props - The header/tabs slots plus the rail and detail slots.
 * @returns The triage layout element.
 */
export function TriageShell(props: {
  header: ReactNode;
  tabs: ReactNode;
  /** Optional rail search box; omitted on queues that have no rail search (e.g. Onboardings). */
  search?: ReactNode;
  rail: ReactNode;
  railFooter?: ReactNode;
  detail: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      {props.header}
      {props.tabs}
      <div className="flex min-h-[600px] items-stretch gap-6">
        <div className="flex w-[380px] shrink-0 flex-col gap-3">
          {props.search ?? null}
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
            {props.rail}
          </div>
          {props.railFooter ? (
            <div className="shrink-0 pt-1 text-xs text-muted-foreground">{props.railFooter}</div>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 rounded-[16px] border border-border bg-card">
          {props.detail}
        </div>
      </div>
    </div>
  );
}
