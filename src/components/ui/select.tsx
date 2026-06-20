import type * as React from 'react';
import { cn } from '@/libs/utils';

/**
 * Styled native select element. Matches Input styling and stays compatible
 * with react-hook-form's `register()` spread and native <option> children.
 * (A Radix-based rich select can be layered in later where search/grouping is needed.)
 * @param props - Native select HTML attributes.
 * @returns Select element.
 */
function Select(props: React.ComponentProps<'select'>) {
  return (
    <select
      {...props}
      className={cn(
        'h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        props.className,
      )}
      data-slot="select"
    />
  );
}

export { Select };
