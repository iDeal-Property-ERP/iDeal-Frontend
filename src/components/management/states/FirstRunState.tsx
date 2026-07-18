import type { LucideIcon } from 'lucide-react';
import { cn } from '@/libs/utils';

export type FirstRunStep = {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  /** When set, the step row renders as a button and invokes this on tap. */
  onClick?: () => void;
};

/**
 * First-run "getting started" card shown when a module is truly empty (zero
 * records, no filters) — a welcome title, a short checklist of setup steps
 * (each optionally tappable), and one primary CTA. Distinct from the filtered
 * no-results state.
 * @param props - Title, description, the checklist steps, and the primary action.
 * @returns The first-run state element.
 */
export function FirstRunState(props: {
  title: string;
  description?: string;
  steps: FirstRunStep[];
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-6 px-6 py-14 text-center',
        props.className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-xl font-bold text-foreground">{props.title}</h3>
        {props.description ? (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{props.description}</p>
        ) : null}
      </div>

      <ul className="flex w-full max-w-md flex-col overflow-hidden rounded-[16px] border border-border bg-card text-left shadow-sm">
        {props.steps.map((step, index) => {
          const Icon = step.icon;
          const content = (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary-subtle-foreground">
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-foreground">{step.title}</span>
                {step.description ? (
                  <span className="text-xs text-muted-foreground">{step.description}</span>
                ) : null}
              </span>
            </>
          );
          return (
            <li key={step.id} className={cn(index > 0 && 'border-t border-border')}>
              {step.onClick ? (
                <button
                  type="button"
                  onClick={() => step.onClick?.()}
                  className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {content}
                </button>
              ) : (
                <div className="flex items-center gap-3.5 px-4 py-3.5">{content}</div>
              )}
            </li>
          );
        })}
      </ul>

      {props.action ? <div>{props.action}</div> : null}
    </div>
  );
}
