import type { ReactNode } from 'react';

/**
 * The reusable Workbench layout — the shared spine for every Management list
 * screen (Properties, Leases, Agreements, Inventory, Users, Agents…). It stacks
 * the page header, KPI strip, saved-view tabs, a sticky toolbar, the table/state
 * body, and pagination in the Figma 20px rhythm, and hosts an optional in-flow
 * record panel that compresses the content column (scrim-free) plus a floating
 * bulk bar. Entirely slot-based: it owns layout, never entity logic.
 * @param props - The section slots plus the optional record panel and bulk bar.
 * @returns The workbench layout element.
 */
export function WorkbenchShell(props: {
  header: ReactNode;
  kpi: ReactNode;
  tabs: ReactNode;
  toolbar: ReactNode;
  children: ReactNode;
  pagination?: ReactNode;
  panel?: ReactNode;
  bulkBar?: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-stretch">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          {props.header}
          {props.kpi}
          {props.tabs}
          <div className="sticky top-0 z-20 bg-background py-1">{props.toolbar}</div>
          {props.children}
          {props.pagination}
        </div>
        {props.panel}
      </div>
      {props.bulkBar}
    </div>
  );
}
