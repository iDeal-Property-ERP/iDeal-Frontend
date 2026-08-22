'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/libs/utils';

/**
 * Fills an already-sized media container with a skeleton until its image has
 * decoded, then fades the image in without changing the container's geometry.
 * @param props - The image source, accessible label, responsive size and optional priority.
 * @returns A fill-mode image with an in-place loading placeholder.
 */
export function DeferredImage(props: {
  alt: string;
  className?: string;
  priority?: boolean;
  sizes: string;
  src: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-muted motion-safe:animate-pulse motion-reduce:animate-none transition-opacity duration-200',
          loaded && 'opacity-0',
        )}
      />
      <Image
        alt={props.alt}
        className={cn(
          'object-cover transition-opacity duration-200 motion-reduce:transition-none',
          loaded ? 'opacity-100' : 'opacity-0',
          props.className,
        )}
        fill
        onLoad={() => setLoaded(true)}
        priority={props.priority}
        sizes={props.sizes}
        src={props.src}
      />
    </>
  );
}
