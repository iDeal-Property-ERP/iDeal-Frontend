import { cn } from '@/libs/utils';

/**
 * Circular loading spinner.
 * @param props - SVG props; className controls size and color.
 * @returns Spinning SVG icon.
 */
export function Spinner(props: React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={cn('size-5 animate-spin text-muted-foreground', props.className)}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
