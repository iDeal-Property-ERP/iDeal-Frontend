'use client';

import { BadgeCheck, Building2, ChevronLeft, Heart, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ListingImageViewer } from '@/components/listings/ListingImageViewer';
import { DeferredImage } from '@/components/ui/DeferredImage';
import { useFavorites } from '@/hooks/useFavorites';
import { useShareLink } from '@/hooks/useShareLink';
import { Link } from '@/libs/I18nNavigation';
import { cn } from '@/libs/utils';
import type { ListingPhoto } from '@/types/marketplace';

const MORE_OVERLAY =
  'absolute inset-0 grid place-items-center bg-[rgba(4,18,13,0.55)] font-semibold text-white';
const HERO_CTRL =
  'inline-flex size-9 items-center justify-center rounded-full bg-[rgba(8,13,26,0.45)] text-white backdrop-blur-sm transition hover:bg-[rgba(8,13,26,0.6)]';

/**
 * "Verified by iDeal" pill shown over the gallery hero (Figma 32:69).
 * @param props - The translated label.
 * @returns The verified badge.
 */
function VerifiedBadge(props: { label: string }) {
  return (
    <span className="pointer-events-none absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-card/95 py-[7px] pr-3 pl-[11px] text-sm font-medium text-success shadow-sm">
      <BadgeCheck className="size-3.5" />
      {props.label}
    </span>
  );
}

/**
 * Listing photo gallery (Figma 32:60 desktop hero + 2×2 grid; mobile hero + thumbnail strip).
 * Opens the fullscreen {@link ListingImageViewer} at the clicked photo.
 * @param props - The ordered photos, property name, verified flag and listing id.
 * @returns The gallery with its image viewer.
 */
export function ListingGallery(props: {
  photos: ListingPhoto[];
  name: string;
  verified: boolean;
  listingId: number;
}) {
  const { photos, name, verified, listingId } = props;
  const t = useTranslations('ListingDetail');
  const { isFavorite, toggle } = useFavorites();
  const share = useShareLink();
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-muted">
        <Building2 className="size-12 text-muted-foreground" />
      </div>
    );
  }

  const openAt = (i: number) => {
    setStartIndex(i);
    setOpen(true);
  };

  const [hero] = photos;
  const tiles = photos.slice(1, 5);
  const moreCount = photos.length - 4;
  const showMore = photos.length > 5;
  const saved = isFavorite(listingId);

  return (
    <>
      {/* Desktop: hero + 2×2 thumbnail grid */}
      <div className="hidden grid-cols-[868fr_480fr] gap-3 md:grid">
        <button
          className="relative aspect-[868/464] overflow-hidden rounded-[20px] bg-muted"
          onClick={() => openAt(0)}
          type="button"
        >
          {hero && <DeferredImage alt={name} priority sizes="62vw" src={hero.image_url} />}
          {verified && <VerifiedBadge label={t('verified_by')} />}
        </button>
        <div className="grid grid-cols-2 grid-rows-2 gap-3">
          {tiles.map((p, i) => (
            <button
              className="relative overflow-hidden rounded-[14px] bg-muted"
              key={p.id}
              onClick={() => openAt(i + 1)}
              type="button"
            >
              <DeferredImage alt={name} sizes="18vw" src={p.image_url} />
              {i === 3 && showMore && (
                <span className={cn(MORE_OVERLAY, 'text-base')}>
                  {t('more_photos', { count: moreCount })}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile + small tablet: full-bleed hero + thumbnail strip (Figma 116:2) */}
      <div className="md:hidden">
        <div className="relative aspect-[13/10] overflow-hidden bg-muted">
          {hero && <DeferredImage alt={name} priority sizes="100vw" src={hero.image_url} />}
          <button
            aria-label={name}
            className="absolute inset-0"
            onClick={() => openAt(0)}
            type="button"
          />
          <Link
            aria-label={t('back')}
            className={cn(HERO_CTRL, 'absolute top-3 left-3 z-10')}
            href="/listings"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <button
              aria-label={t('share')}
              className={HERO_CTRL}
              onClick={() => void share(name)}
              type="button"
            >
              <Share2 className="size-4" />
            </button>
            <button
              aria-label={t('save')}
              aria-pressed={saved}
              className={HERO_CTRL}
              onClick={() => toggle(listingId)}
              type="button"
            >
              <Heart className={cn('size-4', saved && 'fill-current')} />
            </button>
          </div>
          <span className="pointer-events-none absolute right-3 bottom-3 z-10 inline-flex items-center rounded-full bg-[rgba(8,13,26,0.62)] px-3 py-1.5 text-xs font-semibold text-white">
            1 / {photos.length}
          </span>
        </div>
        <div className="mt-3 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 sm:px-6 [&::-webkit-scrollbar]:hidden">
          {tiles.map((p, i) => (
            <button
              className="relative h-[60px] w-[84px] shrink-0 overflow-hidden rounded-[10px] bg-muted"
              key={p.id}
              onClick={() => openAt(i + 1)}
              type="button"
            >
              <DeferredImage alt={name} sizes="84px" src={p.image_url} />
              {i === 3 && showMore && (
                <span className={cn(MORE_OVERLAY, 'text-sm')}>+{moreCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <ListingImageViewer
        listingId={listingId}
        name={name}
        onOpenChange={setOpen}
        open={open}
        photos={photos}
        startIndex={startIndex}
      />
    </>
  );
}
