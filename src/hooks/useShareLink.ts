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
      const url = globalThis.window ? window.location.href : '';
      try {
        if (globalThis.navigator && 'share' in navigator) {
          await navigator.share({ title, url });
        } else if (globalThis.navigator && 'clipboard' in navigator) {
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
