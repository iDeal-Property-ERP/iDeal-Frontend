import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/libs/utils';

const alertVariants = cva('relative w-full rounded-lg border px-4 py-3 text-sm', {
  variants: {
    variant: {
      default: 'bg-muted text-foreground border-border',
      success: 'bg-success-subtle border-success/30 text-success-subtle-foreground',
      warning: 'bg-warning-subtle border-warning/30 text-warning-subtle-foreground',
      danger: 'bg-danger-subtle border-danger/30 text-danger-subtle-foreground',
      info: 'bg-info-subtle border-info/30 text-info-subtle-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

type AlertProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>;

/**
 * Inline alert / banner with semantic color variants.
 * @param props - Div HTML attributes plus variant.
 * @returns Alert container.
 */
export function Alert(props: AlertProps) {
  const { className, variant, ...rest } = props;
  return <div role="alert" {...rest} className={cn(alertVariants({ variant }), className)} />;
}

/**
 * Title text inside an Alert.
 * @param props - Paragraph HTML attributes.
 * @returns Alert title paragraph.
 */
export function AlertTitle(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cn('mb-1 font-medium', props.className)} />;
}

/**
 * Description text inside an Alert.
 * @param props - Paragraph HTML attributes.
 * @returns Alert description paragraph.
 */
export function AlertDescription(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cn('text-sm', props.className)} />;
}
