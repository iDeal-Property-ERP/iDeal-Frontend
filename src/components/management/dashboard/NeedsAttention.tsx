import { CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/management/states/EmptyState';
import { cn } from '@/libs/utils';

export type AttentionTone = 'danger' | 'accent' | 'brand' | 'warning';

export type AttentionItem = {
  id: string;
  icon: LucideIcon;
  tone: AttentionTone;
  primary: string;
  secondary: string;
};

const toneClass: Record<AttentionTone, string> = {
  danger: 'bg-danger-subtle text-danger-subtle-foreground',
  accent: 'bg-accent-brand-subtle text-accent-brand-subtle-foreground',
  brand: 'bg-primary-subtle text-primary-subtle-foreground',
  warning: 'bg-warning-subtle text-warning-subtle-foreground',
};

/**
 * The dashboard "Needs attention" card — a severity-coded list of items that
 * need action, or an "all clear" empty state.
 * @param props - The attention items, title, and empty-state copy.
 * @returns The needs-attention panel.
 */
export function NeedsAttention(props: {
  title: string;
  items: AttentionItem[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <section className="flex flex-col gap-3.5 rounded-[16px] border border-border bg-card p-[22px] shadow-sm lg:w-[360px]">
      <h2 className="text-[18px] leading-[26px] font-semibold text-foreground">{props.title}</h2>
      {props.items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={props.emptyTitle}
          description={props.emptyDescription}
          tone="muted"
          className="py-8"
        />
      ) : (
        <ul className="flex flex-col gap-3.5">
          {props.items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-[10px]',
                    toneClass[item.tone],
                  )}
                >
                  <Icon className="size-[17px]" strokeWidth={1.75} />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{item.primary}</span>
                  <span className="text-sm text-muted-foreground">{item.secondary}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
