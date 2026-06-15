import { cn } from '@/libs/utils';

/**
 * Surface container with card background and border.
 * @param props - Div HTML attributes.
 * @returns Card container.
 */
export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground',
        props.className,
      )}
    />
  );
}

/**
 * Padded content area inside a Card.
 * @param props - Div HTML attributes.
 * @returns Card content wrapper.
 */
export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('p-5', props.className)} />;
}

/**
 * Header area inside a Card, typically holds title + actions.
 * @param props - Div HTML attributes.
 * @returns Card header wrapper.
 */
export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        'flex items-center justify-between border-b border-border px-5 py-4',
        props.className,
      )}
    />
  );
}

/**
 * Footer area inside a Card.
 * @param props - Div HTML attributes.
 * @returns Card footer wrapper.
 */
export function CardFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('border-t border-border px-5 py-4', props.className)} />;
}
