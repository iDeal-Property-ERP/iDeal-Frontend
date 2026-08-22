'use client';

import { CheckCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/libs/utils';
import type { ChatMessageOutput } from '@/types/chat';

/**
 * Reserves the rendered image footprint in a chat message before its remote media arrives.
 * @param props - The image URL, source dimensions, translated labels, and load callback.
 * @returns A message image with an in-place loading placeholder and fullscreen preview.
 */
function ChatImageMessage(props: {
  imageAlt: string;
  imageHeight: number | null;
  imageUrl: string;
  imageWidth: number | null;
  isMine: boolean;
  onMediaLoad?: () => void;
  openLabel: string;
  previewLabel: string;
}) {
  const [imageOpen, setImageOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageWidth = props.imageWidth && props.imageWidth > 0 ? props.imageWidth : 320;
  const imageHeight = props.imageHeight && props.imageHeight > 0 ? props.imageHeight : 240;
  const displayedImageWidth = Math.min(imageWidth, (imageWidth / imageHeight) * 256);

  return (
    <>
      <button
        aria-label={props.openLabel}
        className={cn(
          'relative max-w-full overflow-hidden rounded-[14px] border border-border bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          props.isMine ? 'rounded-br-[4px]' : 'rounded-bl-[4px]',
        )}
        onClick={() => setImageOpen(true)}
        style={{ aspectRatio: `${imageWidth} / ${imageHeight}`, width: displayedImageWidth }}
        type="button"
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-0 bg-muted motion-safe:animate-pulse motion-reduce:animate-none transition-opacity duration-200',
            imageLoaded && 'opacity-0',
          )}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- chat media is served by the backend host. */}
        <img
          alt={props.imageAlt}
          className={cn(
            'size-full object-contain transition-opacity duration-200 motion-reduce:transition-none',
            imageLoaded ? 'opacity-100' : 'opacity-0',
          )}
          onLoad={() => {
            setImageLoaded(true);
            props.onMediaLoad?.();
          }}
          src={props.imageUrl}
        />
      </button>
      <Dialog onOpenChange={setImageOpen} open={imageOpen}>
        <DialogContent className="max-w-4xl border-0 bg-black/90 p-2">
          <DialogTitle className="sr-only">{props.previewLabel}</DialogTitle>
          <DialogDescription className="sr-only">{props.imageAlt}</DialogDescription>
          {/* eslint-disable-next-line @next/next/no-img-element -- chat media is served by the backend host. */}
          <img
            alt={props.imageAlt}
            className="max-h-[80vh] w-full object-contain"
            src={props.imageUrl}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Renders one left/right message bubble and derives the staff read tick from
 * the peer's conversation watermark.
 * @param props - Message data, read watermark, and optional media callback.
 * @returns The message bubble.
 */
export function ChatMessageBubble(props: {
  message: ChatMessageOutput;
  /** Called when the thumbnail finishes loading. */
  onMediaLoad?: () => void;
  peerLastReadMessageId: number | null;
}) {
  const t = useTranslations('ChatsPage');
  const locale = useLocale();
  const { message } = props;
  const isRead =
    message.is_mine &&
    message.id > 0 &&
    props.peerLastReadMessageId !== null &&
    message.id <= props.peerLastReadMessageId;
  const time = Number.isFinite(Date.parse(message.created_at))
    ? new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(
        Date.parse(message.created_at),
      )
    : '';

  return (
    <div className={cn('flex', message.is_mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'flex max-w-[78%] flex-col gap-1',
          message.is_mine ? 'items-end' : 'items-start',
        )}
      >
        {message.sender_side === 'staff' && message.sender_name ? (
          <span className="px-1 text-[11px] font-medium text-muted-foreground">
            {message.sender_name}
          </span>
        ) : null}
        {message.kind === 'image' && message.image_url ? (
          <ChatImageMessage
            imageAlt={t('image_alt')}
            imageHeight={message.image_height}
            imageUrl={message.image_url}
            imageWidth={message.image_width}
            isMine={message.is_mine}
            onMediaLoad={props.onMediaLoad}
            openLabel={t('open_image')}
            previewLabel={t('image_preview')}
          />
        ) : (
          <div
            className={cn(
              'rounded-[14px] px-3.5 py-2.5 text-sm leading-5',
              message.is_mine
                ? 'rounded-br-[4px] bg-primary text-primary-foreground'
                : 'rounded-bl-[4px] border border-border bg-card text-foreground',
            )}
          >
            {message.text ? (
              <p className="break-words whitespace-pre-wrap">{message.text}</p>
            ) : null}
          </div>
        )}
        <span className="flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
          {time}
          {message.is_mine ? (
            <span aria-label={isRead ? t('message_read') : t('message_sent')}>
              <CheckCheck
                className={cn('size-3.5', isRead ? 'text-primary' : 'text-muted-foreground')}
              />
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
