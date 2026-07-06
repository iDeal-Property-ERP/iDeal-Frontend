import { Building2 } from 'lucide-react';
import { cn } from '@/libs/utils';

/**
 * A square entity thumbnail with the shared building-icon fallback used across
 * the product for missing images. Renders the image when a source is provided,
 * otherwise a muted icon tile.
 * @param props - Optional image source, alt text, pixel size, and class.
 * @returns The thumbnail element.
 */
export function PropertyThumbnail(props: {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
}) {
  const size = props.size ?? 40;
  const dimension = { width: size, height: size };

  if (props.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- entity thumbnails come from arbitrary remote hosts; next/image adds no value at 40px
      <img
        src={props.src}
        alt={props.alt ?? ''}
        style={dimension}
        className={cn('shrink-0 rounded-[8px] object-cover', props.className)}
      />
    );
  }

  return (
    <span
      style={dimension}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-[8px] bg-muted text-muted-foreground',
        props.className,
      )}
      aria-hidden="true"
    >
      <Building2 className="size-5" strokeWidth={1.75} />
    </span>
  );
}
