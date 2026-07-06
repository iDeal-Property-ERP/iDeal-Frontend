import type { LucideIcon } from 'lucide-react';
import { cn } from '@/libs/utils';

/**
 * Empty-state block: an icon in a primary-subtle disc, a one-line title, an
 * optional description, and an optional primary action. Used for "no data yet"
 * and (with a muted tone) filtered-empty results.
 * @param props - Icon, title, description, action, and layout tone.
 * @returns The empty-state element.
 */
export function EmptyState(props: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  tone?: 'brand' | 'muted';
  className?: string;
}) {
  const Icon = props.icon;
  const muted = props.tone === 'muted';
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-14 text-center',
        props.className,
      )}
    >
      <span
        className={cn(
          'flex size-14 items-center justify-center rounded-full',
          muted
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary-subtle text-primary-subtle-foreground',
        )}
      >
        <Icon className="size-6" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{props.title}</h3>
        {props.description ? (
          <p className="max-w-sm text-sm text-muted-foreground">{props.description}</p>
        ) : null}
      </div>
      {props.action ? <div className="mt-1">{props.action}</div> : null}
    </div>
  );
}
