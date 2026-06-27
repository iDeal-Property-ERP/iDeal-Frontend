'use client';

import { useTranslations } from 'next-intl';
import { useListingParams } from '@/hooks/useListingParams';

type PaginationProps = {
  page: number;
  numPages: number;
};

/**
 * Page navigation for the discovery results (prev / "page X of Y" / next). Renders nothing when
 * there is a single page or fewer.
 * @param props - The current page and total page count.
 * @returns The pagination controls, or null.
 */
export function Pagination(props: PaginationProps) {
  const { page, numPages } = props;
  const t = useTranslations('Listings');
  const { set } = useListingParams();

  if (numPages <= 1) {
    return null;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <button
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => set({ page: String(page - 1) })}
        type="button"
      >
        {t('previous')}
      </button>
      <span className="text-sm text-muted-foreground">
        {t('page_of', { page, total: numPages })}
      </span>
      <button
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-40"
        disabled={page >= numPages}
        onClick={() => set({ page: String(page + 1) })}
        type="button"
      >
        {t('next')}
      </button>
    </div>
  );
}
