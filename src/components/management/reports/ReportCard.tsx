import type { ReactNode } from 'react';
import { cn } from '@/libs/utils';

/**
 * A titled report surface — the shared 16px-radius card shell used across the
 * P&L report (monthly table, growth chart, breakdown). An overline title, an
 * optional right-aligned action/note slot, and the body.
 * @param props - The title, optional action node, body children, and class.
 * @returns The report card element.
 */
export function ReportCard(props: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn('rounded-[16px] border border-border bg-card p-5 shadow-sm', props.className)}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {props.title}
        </h3>
        {props.action}
      </header>
      {props.children}
    </section>
  );
}
