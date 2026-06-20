import { Loader2Icon } from 'lucide-react';
import type * as React from 'react';
import { cn } from '@/libs/utils';

function Spinner({ className, ...props }: React.ComponentProps<typeof Loader2Icon>) {
  return (
    <Loader2Icon aria-label="Loading" className={cn('size-4 animate-spin', className)} {...props} />
  );
}

export { Spinner };
