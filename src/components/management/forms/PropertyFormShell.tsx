'use client';

import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from '@/libs/I18nNavigation';

type PropertyFormShellProps = {
  backHref: string;
  /** When set, the back arrow runs this (e.g. to confirm discard) instead of navigating. */
  onBack?: () => void;
  breadcrumb: ReactNode;
  title: string;
  /** Right side of the header row (e.g. the DraftSavedChip). */
  headerAside?: ReactNode;
  /** Main-column form sections. */
  children: ReactNode;
  /** Right-rail cards (checklist, owner, map). */
  rail: ReactNode;
  /** Sticky footer bar. */
  footer: ReactNode;
};

/**
 * Two-column property form layout: a back arrow + breadcrumb + title header, a
 * main form column with a 320px right rail, and a sticky footer. Mirrors the
 * Figma Create/Edit page frame.
 * @param props - Header, breadcrumb, main content, rail, and footer slots.
 * @returns The form shell.
 */
export function PropertyFormShell(props: PropertyFormShellProps) {
  const { backHref, onBack, breadcrumb, title, headerAside, children, rail, footer } = props;
  const backClassName =
    'flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {onBack ? (
            <button type="button" onClick={onBack} aria-label="Back" className={backClassName}>
              <ArrowLeft className="size-4" />
            </button>
          ) : (
            <Link href={backHref} aria-label="Back" className={backClassName}>
              <ArrowLeft className="size-4" />
            </Link>
          )}
          <div>
            <div className="text-sm text-muted-foreground">{breadcrumb}</div>
            <h1 className="font-display text-[28px] leading-[34px] font-bold tracking-[-0.14px] text-foreground">
              {title}
            </h1>
          </div>
        </div>
        {headerAside}
      </div>

      <div className="mt-6 grid flex-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">{children}</div>
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">{rail}</aside>
      </div>

      <div className="sticky bottom-0 mt-6">{footer}</div>
    </div>
  );
}
