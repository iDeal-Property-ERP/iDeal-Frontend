'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * The reusable record-panel container (archetype D) — a 560px right panel that
 * opens in-flow beside a workbench (scrim-free, so the list stays visible and
 * simply compresses) on desktop, and a full-screen overlay on mobile. Owns the
 * scroll region, the sticky footer, and Escape-to-close; the header, body, and
 * footer are slots so any entity can fill them.
 * @param props - Open state, close handler, and the header/body/footer slots.
 * @returns The record panel element, or null when closed.
 */
export function RecordPanel(props: {
  open: boolean;
  onClose: () => void;
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  const isMobile = useIsMobile();
  const closeRef = useRef(props.onClose);
  closeRef.current = props.onClose;

  const { open } = props;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (open && event.key === 'Escape') {
        closeRef.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!props.open) {
    return null;
  }

  const body = (
    <>
      <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-6 pt-[22px] pb-4">
        {props.header}
        {props.children}
      </div>
      <div className="shrink-0 border-t border-border bg-card px-6 py-3.5">{props.footer}</div>
    </>
  );

  if (isMobile) {
    return (
      <dialog
        open
        aria-modal="true"
        className="fixed inset-0 z-50 m-0 flex size-full max-h-none max-w-none flex-col bg-card text-foreground motion-safe:animate-in motion-safe:duration-200 motion-safe:slide-in-from-bottom-4"
      >
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
