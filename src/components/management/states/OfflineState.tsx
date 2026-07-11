'use client';

import { RotateCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/libs/utils';

/**
 * Offline block shown when the network is unreachable — a wifi-off icon, a
 * short explanation, and a Retry button that re-runs the failed load.
 * @param props - Title, message, the retry handler and label, and extra classes.
 * @returns The offline-state element.
 */
export function OfflineState(props: {
  title: string;
  message: string;
  retryLabel: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-14 text-center',
        props.className,
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <WifiOff className="size-6" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{props.title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{props.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={props.onRetry} className="mt-1">
        <RotateCw className="size-4" />
        {props.retryLabel}
      </Button>
    </div>
  );
}
