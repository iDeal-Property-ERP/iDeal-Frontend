import { cn } from '@/libs/utils';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Styled select element consistent with Input styling.
 * @param props - Select HTML attributes.
 * @returns Select element.
 */
export function Select(props: SelectProps) {
  return (
    <select
      {...props}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
        props.className,
      )}
    />
  );
}
