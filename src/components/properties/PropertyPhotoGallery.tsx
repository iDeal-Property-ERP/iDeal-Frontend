'use client';

import { useState } from 'react';
import { cn } from '@/libs/utils';
import type { PropertyPhoto } from '@/types/property';

type PropertyPhotoGalleryProps = {
  photos: PropertyPhoto[];
  name: string;
};

/**
 * A simple, self-contained property photo gallery for the internal detail page: a
 * 16:9 hero plus a selectable thumbnail row. Photos are ordered primary-first,
 * then by sort_order. Renders nothing when there are no photos. Deliberately does
 * NOT reuse the marketplace `ListingGallery` (which is coupled to favorites/share
 * and the listing i18n namespace).
 * @param props - The photos and the property name (used as the image alt).
 * @returns The gallery, or null when there are no photos.
 */
export function PropertyPhotoGallery(props: PropertyPhotoGalleryProps) {
  const ordered = props.photos.toSorted(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  const [active, setActive] = useState(0);

  const hero = ordered[active] ?? ordered[0];
  if (!hero) {
    return null;
  }

  return (
    <div className="grid gap-3">
      <div className="aspect-[16/9] w-full overflow-hidden rounded-[16px] border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote media host; next/image adds no value here */}
        <img
          src={hero.image_url}
          alt={hero.caption ?? props.name}
          className="size-full object-cover"
        />
      </div>
      {ordered.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {ordered.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`${props.name} — photo ${index + 1}`}
              aria-current={index === active}
              className={cn(
                'size-16 overflow-hidden rounded-[10px] border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                index === active
                  ? 'border-ring ring-2 ring-ring'
                  : 'border-border hover:border-ring',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- remote media host; next/image adds no value at 64px */}
              <img src={photo.image_url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
