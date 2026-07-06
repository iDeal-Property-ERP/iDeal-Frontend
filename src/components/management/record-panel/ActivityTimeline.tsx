import { cn } from '@/libs/utils';

export type ActivityTone = 'accent' | 'success' | 'warning' | 'muted';

export type ActivityEvent = {
  id: string;
  title: string;
  time: string;
  tone?: ActivityTone;
};

const toneClass: Record<ActivityTone, string> = {
  accent: 'bg-accent-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  muted: 'bg-muted-foreground/50',
};

/**
 * A dot-timeline of record events under an overline heading — each row a colored
 * dot, a title line, and a muted timestamp.
 * @param props - The section heading and the ordered events.
 * @returns The activity timeline element.
 */
export function ActivityTimeline(props: { heading: string; events: ActivityEvent[] }) {
  return (
    <div className="flex w-full flex-col gap-3">
      <span className="text-[11px] leading-[14px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {props.heading}
      </span>
      {props.events.map((event) => (
        <div key={event.id} className="flex items-start gap-2.5">
          <span
            className={cn(
              'mt-1.5 size-[7px] shrink-0 rounded-full',
              toneClass[event.tone ?? 'muted'],
            )}
          />
          <div className="flex flex-col gap-px">
            <p className="text-sm leading-5 text-foreground">{event.title}</p>
            <p className="text-xs leading-4 text-muted-foreground">{event.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
