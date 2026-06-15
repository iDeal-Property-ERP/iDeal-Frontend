import { cn } from '@/libs/utils';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Styled textarea consistent with Input styling.
 * @param props - Textarea HTML attributes.
 * @returns Textarea element.
 */
export function Textarea(props: TextareaProps) {
  return (
    <textarea
      {...props}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
        props.className,
      )}
    />
  );
}
