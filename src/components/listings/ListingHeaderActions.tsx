'use client';

import { Heart, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFavorites } from '@/hooks/useFavorites';
import { useShareLink } from '@/hooks/useShareLink';
import { cn } from '@/libs/utils';

const PILL =
  'inline-flex items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-2.5 font-medium text-[15px] text-foreground transition hover:bg-muted';

/**
 * Desktop header Share + Save actions for the listing detail page (Figma 32:49).
 * @param props - The listing id (for favorites) and name (for the share title).
 * @returns The share/save button group.
 */
export function ListingHeaderActions(props: { listingId: number; name: string }) {
  const { listingId, name } = props;
  const t = useTranslations('ListingDetail');
  const { isFavorite, toggle } = useFavorites();
  const share = useShareLink();
  const saved = isFavorite(listingId);

  return (
    <div className="flex items-center gap-2.5">
      <button className={PILL} onClick={() => void share(name)} type="button">
        <Share2 className="size-4" />
        {t('share')}
      </button>
      <button aria-pressed={saved} className={PILL} onClick={() => toggle(listingId)} type="button">
        <Heart className={cn('size-4', saved && 'fill-accent-brand text-accent-brand')} />
        {t('save')}
      </button>
    </div>
  );
}
