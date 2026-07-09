import { Camera, ImageOff } from 'lucide-react';

/**
 * A horizontal thumbnail strip for record-panel attachments (onboarding photos,
 * maintenance-request photos). Shows up to `max` thumbnails with a count chip;
 * falls back to a muted empty tile when there are no photos.
 * @param props - The photo URLs, an alt prefix, an empty-state label, and the max shown.
 * @returns The photo strip element.
 */
export function PhotoStrip(props: {
  urls: string[];
  altPrefix: string;
  emptyLabel: string;
  max?: number;
}) {
  const max = props.max ?? 6;
  const shown = props.urls.slice(0, max);

  if (shown.length === 0) {
    return (
      <div className="flex h-[88px] w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-border bg-muted text-muted-foreground">
        <ImageOff className="size-4" />
        <span className="text-sm">{props.emptyLabel}</span>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-2 overflow-x-auto">
      {shown.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- attachment thumbnails come from arbitrary remote hosts; next/image adds no value at 72px
        <img
          key={url}
          src={url}
          alt={`${props.altPrefix} ${i + 1}`}
          className="size-[72px] shrink-0 rounded-[10px] border border-border object-cover"
        />
      ))}
      {props.urls.length > max ? (
        <span className="flex size-[72px] shrink-0 items-center justify-center gap-1 rounded-[10px] border border-border bg-muted text-xs font-medium text-muted-foreground">
          <Camera className="size-3.5" />+{props.urls.length - max}
        </span>
      ) : null}
    </div>
  );
}
