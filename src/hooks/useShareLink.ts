import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Returns a handler that shares the current page URL via the Web Share API,
 * falling back to copying the link to the clipboard (with a toast).
 * @returns A `share(title)` callback.
 */
export function useShareLink() {
  const t = useTranslations('ListingDetail');
  return useCallback(
    async (title: string) => {
      const url = typeof window === 'undefined' ? '' : window.location.href;
      try {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title, url });
        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          toast.success(t('link_copied'));
        }
      } catch {
        // user cancelled the share sheet, or clipboard was blocked — no-op
      }
    },
    [t],
  );
}
