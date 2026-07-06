'use client';

import { RotateCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/libs/utils';

/**
 * Inline error block with a danger icon, a message, and a Retry button. The
 * surrounding chrome (header, sidebar) stays; only the content area shows this.
 * @param props - Title, message, retry handler, and retry label.
 * @returns The error-state element.
 */
export function ErrorState(props: {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-[16px] border border-danger/30 bg-danger-subtle/40 px-6 py-14 text-center',
        props.className,
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-danger-subtle text-danger-subtle-foreground">
        <TriangleAlert className="size-6" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{props.title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{props.message}</p>
      </div>
      {props.onRetry ? (
        <Button variant="outline" size="sm" onClick={props.onRetry} className="mt-1">
          <RotateCw className="size-4" />
          {props.retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
