import { cn } from '@/libs/utils';

/**
 * Animated loading placeholder that matches the width/height of absent content.
 * @param props - Div HTML attributes for sizing/positioning.
 * @returns Skeleton shimmer element.
 */
export function Skeleton(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('animate-pulse rounded-md bg-muted', props.className)} />;
}
