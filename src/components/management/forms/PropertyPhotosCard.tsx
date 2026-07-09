'use client';

import { Loader2, Star, Upload, X } from 'lucide-react';
import type { useTranslations } from 'next-intl';
import { useRef } from 'react';
import type { UsePropertyPhotosResult } from '@/hooks/management/usePropertyPhotos';
import { MIN_PUBLISH_PHOTOS } from '@/hooks/management/usePublishChecklist';
import { cn } from '@/libs/utils';
import { FormSectionCard } from './FormSectionCard';

type Translator = ReturnType<typeof useTranslations>;

type PropertyPhotosCardProps = {
  t: Translator;
  photos: UsePropertyPhotosResult;
  /** Camera-first capture on mobile. */
  capture?: boolean;
};

/**
 * The Photos section: a grid of uploaded photos with cover-star and delete, plus
 * an Add tile. Enforces the 5-photo publish minimum in its subtitle. Photos need a
 * persisted draft, so the hook no-ops (with a toast) until one exists.
 * @param props - Translator, the photos hook, and an optional capture flag.
 * @returns The Photos section card.
 */
export function PropertyPhotosCard(props: PropertyPhotosCardProps) {
  const { t, photos, capture } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? [...event.target.files] : [];
    if (files.length > 0) {
      void photos.upload(files);
    }
    event.target.value = '';
  };

  return (
    <FormSectionCard
      title={t('form_photos')}
      description={t('form_photos_hint', { min: MIN_PUBLISH_PHOTOS })}
    >
      <div className="flex flex-wrap gap-3">
        {photos.photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative size-24 overflow-hidden rounded-[12px] border border-border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.image_url} alt="" className="size-full object-cover" />
            {photo.is_primary ? (
              <span className="absolute top-1 left-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                {t('form_photo_cover')}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void photos.setCover(photo.id)}
                aria-label={t('form_photo_set_cover')}
                className="absolute top-1 left-1 rounded-full bg-card/90 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
              >
                <Star className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => void photos.remove(photo.id)}
              aria-label={t('form_photo_remove')}
              className="absolute top-1 right-1 rounded-full bg-card/90 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger focus-visible:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={photos.uploading}
          className={cn(
            'flex size-24 flex-col items-center justify-center gap-1 rounded-[12px] border border-dashed border-border text-muted-foreground',
            'transition-colors hover:border-ring hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          )}
        >
          {photos.uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <Upload className="size-5" />
              <span className="text-xs">{t('form_photo_add')}</span>
            </>
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        {...(capture ? { capture: 'environment' } : {})}
        onChange={onPick}
        className="hidden"
      />
    </FormSectionCard>
  );
}
