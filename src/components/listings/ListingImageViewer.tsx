'use client';

import { ChevronLeft, ChevronRight, Heart, LayoutGrid, Share2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { useShareLink } from '@/hooks/useShareLink';
import { cn } from '@/libs/utils';
import type { ListingPhoto } from '@/types/marketplace';

const TOOLBAR_BTN =
  'inline-flex items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-2.5 text-[15px] font-medium text-foreground transition hover:bg-muted';
const ICON_BTN =
  'inline-flex size-10 items-center justify-center rounded-full text-foreground transition hover:bg-muted';
const ARROW_BTN =
  'absolute top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-md transition hover:bg-muted lg:size-12';
const SWIPE_THRESHOLD = 40;

/**
 * Fullscreen "Image Open" viewer for a listing's photos (Figma 183:2 desktop split-viewer,
 * 192:2 mobile). Desktop: toolbar + large stage + vertical thumbnail rail; mobile: top bar +
 * stage + bottom strip. Supports arrow/Escape keys, touch swipe, Save (favorites) and Share.
 * @param props - Photos, listing name + id, and controlled open state with a start index.
 * @returns The viewer dialog (renders nothing when there are no photos).
 */
export function ListingImageViewer(props: {
  photos: ListingPhoto[];
  name: string;
  listingId: number;
  open: boolean;
  startIndex: number;
  onOpenChange: (open: boolean) => void;
}) {
  const { photos, name, listingId, open, startIndex, onOpenChange } = props;
  const t = useTranslations('ListingDetail');
  const { isFavorite, toggle } = useFavorites();
  const share = useShareLink();
  const [active, setActive] = useState(startIndex);
  const [showGrid, setShowGrid] = useState(false);
  const railRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stripRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchX = useRef<number | null>(null);

  const count = photos.length;
  const current = photos[active] ?? photos[0];
  const saved = isFavorite(listingId);

  const go = useCallback(
    (delta: number) => {
      setActive((i) => Math.min(Math.max(i + delta, 0), count - 1));
    },
    [count],
  );

  useEffect(() => {
    if (open) {
      setActive(startIndex);
      setShowGrid(false);
    }
  }, [open, startIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        go(-1);
      } else if (e.key === 'ArrowRight') {
        go(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go]);

  useEffect(() => {
    const opts = { behavior: 'smooth', block: 'nearest', inline: 'nearest' } as const;
    railRefs.current[active]?.scrollIntoView(opts);
    stripRefs.current[active]?.scrollIntoView(opts);
  }, [active]);

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) {
      return;
    }
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      go(dx < 0 ? 1 : -1);
    }
    touchX.current = null;
  };

  if (count === 0) {
    return null;
  }

  const counter = `${active + 1} / ${count}`;

  return (
    <DialogPrimitive.Root onOpenChange={onOpenChange} open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col bg-background outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <DialogPrimitive.Title className="sr-only">{name}</DialogPrimitive.Title>

          {/* Desktop toolbar */}
          <div className="hidden shrink-0 items-center justify-between gap-4 border-b border-border px-10 py-[18px] lg:flex">
            <div className="flex min-w-0 items-center gap-3">
              <DialogPrimitive.Close aria-label={t('close')} className={ICON_BTN}>
                <X className="size-[18px]" />
              </DialogPrimitive.Close>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground">{name}</p>
                <p className="text-[13px] text-muted-foreground">
                  {t('gallery_photos', { count })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button className={TOOLBAR_BTN} onClick={() => setShowGrid((v) => !v)} type="button">
                <LayoutGrid className="size-4" />
                {t('all_photos')}
              </button>
              <button className={TOOLBAR_BTN} onClick={() => void share(name)} type="button">
                <Share2 className="size-4" />
                {t('share')}
              </button>
              <button
                aria-pressed={saved}
                className={TOOLBAR_BTN}
                onClick={() => toggle(listingId)}
                type="button"
              >
                <Heart className={cn('size-4', saved && 'fill-accent-brand text-accent-brand')} />
                {t('save')}
              </button>
            </div>
          </div>

          {/* Mobile top bar */}
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 lg:hidden">
            <DialogPrimitive.Close aria-label={t('close')} className={ICON_BTN}>
              <X className="size-5" />
            </DialogPrimitive.Close>
            <span className="text-sm font-semibold text-foreground">{counter}</span>
            <div className="flex items-center gap-1">
              <button
                aria-label={t('share')}
                className={ICON_BTN}
                onClick={() => void share(name)}
                type="button"
              >
                <Share2 className="size-5" />
              </button>
              <button
                aria-label={t('save')}
                aria-pressed={saved}
                className={ICON_BTN}
                onClick={() => toggle(listingId)}
                type="button"
              >
                <Heart className={cn('size-5', saved && 'fill-accent-brand text-accent-brand')} />
              </button>
            </div>
          </div>

          {/* Body */}
          {showGrid ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-10 pb-10">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((p, i) => (
                  <button
                    className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
                    key={p.id}
                    onClick={() => {
                      setActive(i);
                      setShowGrid(false);
                    }}
                    type="button"
                  >
                    <Image
                      alt={p.caption ?? name}
                      className="object-cover"
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      src={p.image_url}
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 lg:flex-row lg:gap-5 lg:px-10 lg:pt-6 lg:pb-10">
              {/* Stage */}
              <div
                className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-muted"
                onTouchEnd={onTouchEnd}
                onTouchStart={(e) => {
                  touchX.current = e.touches[0]?.clientX ?? null;
                }}
              >
                {current && (
                  <Image
                    alt={current.caption ?? name}
                    className="object-cover"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 80vw"
                    src={current.image_url}
                  />
                )}
                {active > 0 && (
                  <button
                    aria-label={t('prev_photo')}
                    className={cn(ARROW_BTN, 'left-3 lg:left-4')}
                    onClick={() => go(-1)}
                    type="button"
                  >
                    <ChevronLeft className="size-5 lg:size-6" />
                  </button>
                )}
                {active < count - 1 && (
                  <button
                    aria-label={t('next_photo')}
                    className={cn(ARROW_BTN, 'right-3 lg:right-4')}
                    onClick={() => go(1)}
                    type="button"
                  >
                    <ChevronRight className="size-5 lg:size-6" />
                  </button>
                )}
                {current?.caption && (
                  <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-card px-3.5 py-2 text-[13px] font-medium text-foreground shadow-sm lg:bottom-4 lg:left-4">
                    {current.caption}
                  </span>
                )}
                <span className="absolute right-4 bottom-4 hidden items-center rounded-full bg-[rgba(8,13,26,0.62)] px-3.5 py-2 text-[13px] font-semibold text-white lg:inline-flex">
                  {counter}
                </span>
              </div>

              {/* Desktop vertical rail */}
              <div className="hidden w-[196px] shrink-0 [scrollbar-width:thin] flex-col gap-3 overflow-y-auto lg:flex">
                {photos.map((p, i) => (
                  <button
                    className={cn(
                      'relative aspect-[196/124] w-full shrink-0 overflow-hidden rounded-xl bg-muted transition',
                      i === active
                        ? 'border-[3px] border-accent-brand'
                        : 'opacity-90 hover:opacity-100',
                    )}
                    key={p.id}
                    onClick={() => setActive(i)}
                    ref={(el) => {
                      railRefs.current[i] = el;
                    }}
                    type="button"
                  >
                    <Image
                      alt={p.caption ?? name}
                      className="object-cover"
                      fill
                      sizes="196px"
                      src={p.image_url}
                    />
                  </button>
                ))}
              </div>

              {/* Mobile bottom strip */}
              <div className="flex shrink-0 [scrollbar-width:none] gap-2 overflow-x-auto pb-1 lg:hidden [&::-webkit-scrollbar]:hidden">
                {photos.map((p, i) => (
                  <button
                    className={cn(
                      'relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg bg-muted transition',
                      i === active ? 'border-2 border-accent-brand' : 'opacity-80',
                    )}
                    key={p.id}
                    onClick={() => setActive(i)}
                    ref={(el) => {
                      stripRefs.current[i] = el;
                    }}
                    type="button"
                  >
                    <Image
                      alt={p.caption ?? name}
                      className="object-cover"
                      fill
                      sizes="80px"
                      src={p.image_url}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
