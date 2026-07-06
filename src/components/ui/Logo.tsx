import { cn } from '@/libs/utils';

/**
 * The iDeal monogram mark — a token-bound navy circle with a white "i" stem and
 * a signal-blue dot. Resolves from brand tokens so it themes with the UI
 * (navy circle in light, signal-blue in dark).
 * @param props - Optional className to size the mark (defaults to size-8).
 * @returns The monogram mark element.
 */
export function LogoMark(props: { className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full bg-primary',
        props.className ?? 'size-8',
      )}
      aria-hidden
    >
      <span className="block h-[45%] w-[11%] rounded-full bg-primary-foreground" />
      <span className="absolute top-[24%] size-[13%] rounded-full bg-accent-brand" />
    </span>
  );
}
