'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { cn } from '@/libs/utils';

/**
 * "About this home" section — full text on desktop, a 3-line clamp with a
 * "Read more" toggle on mobile (Figma 116:2 density redesign).
 * @param props - The listing description.
 * @returns The about section.
 */
export function ListingAbout(props: { text: string }) {
  const t = useTranslations('ListingDetail');
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <h2 className="text-[18px] font-semibold text-foreground max-md:text-[16px]">{t('about')}</h2>
      <p
        className={cn(
          'mt-2 leading-relaxed text-muted-foreground max-md:text-[14px] max-md:leading-[21px]',
          !expanded && 'max-md:line-clamp-3',
        )}
      >
        {props.text}
      </p>
      <button
        className="mt-1.5 flex min-h-8 items-center text-[13px] font-medium text-accent-brand md:hidden"
        onClick={() => setExpanded((v) => !v)}
        type="button"
      >
        {expanded ? t('read_less') : t('read_more')}
      </button>
    </div>
  );
}
