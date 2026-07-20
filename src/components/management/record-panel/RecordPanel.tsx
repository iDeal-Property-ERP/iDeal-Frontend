'use client';

import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * The reusable record-panel container (archetype D) — a 560px right panel that
 * opens in-flow beside a workbench (scrim-free, so the list stays visible and
 * simply compresses) on desktop, and a full-screen overlay on mobile. On mobile
 * it leads with a back-appbar (chevron + entity-type title) matching the Figma
 * mobile-detail idiom, so the desktop close-X can hide below `lg`. Owns the
 * scroll region, the sticky footer, and Escape-to-close; the header, body, and
 * footer are slots so any entity can fill them.
 * @param props - Open state, close handler, mobile title, and header/body/footer slots.
 * @returns The record panel element, or null when closed.
 */
export function RecordPanel(props: {
  open: boolean;
  onClose: () => void;
  /** Entity-type label shown centered in the mobile back-appbar (e.g. "Lease"). */
  title?: string;
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  const isMobile = useIsMobile();
  const t = useTranslations('Management');

  const { open, onClose } = props;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (open && event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!props.open) {
    return null;
  }

  const body = (
    <>
      <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-6 pt-[22px] pb-4">
        {props.header}
        {props.children}
      </div>
      <div className="shrink-0 border-t border-border bg-card px-5 py-3 lg:px-6 lg:py-3.5">
        {props.footer}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <dialog
        open
        aria-modal="true"
        className="fixed inset-0 z-50 m-0 flex size-full max-h-none max-w-none flex-col bg-card text-foreground motion-safe:animate-in motion-safe:duration-200 motion-safe:slide-in-from-bottom-4"
      >
        <div className="flex h-14 shrink-0 items-center gap-1 border-b border-border px-2">
          <button
            type="button"
            onClick={props.onClose}
            aria-label={t('record_back')}
            className="flex size-11 items-center justify-center rounded-full text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="flex-1 truncate text-center text-base font-semibold text-foreground">
            {props.title}
          </span>
          <span aria-hidden className="size-11 shrink-0" />
        </div>
        {body}
      </dialog>
    );
  }

  return (
    <aside className="sticky top-0 -mt-7 -mr-8 -mb-8 hidden h-svh w-[560px] shrink-0 flex-col border-l border-border bg-card shadow-lg lg:flex">
      {body}
    </aside>
  );
}
