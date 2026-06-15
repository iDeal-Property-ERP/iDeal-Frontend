import { cn } from '@/libs/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Styled text input that integrates with react-hook-form via ref forwarding.
 * @param props - Input HTML attributes.
 * @returns Input element.
 */
export function Input(props: InputProps) {
  return (
    <input
      {...props}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
        props.className,
      )}
    />
  );
}
