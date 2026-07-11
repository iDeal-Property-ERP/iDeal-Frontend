import { Lock } from 'lucide-react';
import { cn } from '@/libs/utils';

/**
 * Permission-denied block shown when the current role cannot view a module or
 * record — a lock icon, a "no access" title, and a contact-your-admin hint.
 * The surrounding chrome stays; only the content area shows this.
 * @param props - Title, the contact-admin hint, and optional extra classes.
 * @returns The permission-denied state element.
 */
export function PermissionDeniedState(props: { title: string; hint: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-14 text-center',
        props.className,
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="size-6" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{props.title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{props.hint}</p>
      </div>
    </div>
  );
}
