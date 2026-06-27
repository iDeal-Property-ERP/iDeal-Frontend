'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useRouter } from '@/libs/I18nNavigation';

/**
 * Client helper for the URL-driven Discovery filters: read current params and push updates to
 * `/listings`. Empty/undefined values are removed; changing a filter always resets `page`.
 * @returns `get(key)`, `set(overrides)`, and the raw `params`.
 */
export function useListingParams() {
  const params = useSearchParams();
  const router = useRouter();

  const get = useCallback((key: string) => params.get(key) ?? '', [params]);

  const set = useCallback(
    (overrides: Record<string, string | undefined | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(overrides)) {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      }
      if (!('page' in overrides)) {
        next.delete('page');
      }
      const qs = next.toString();
      router.push(qs ? `/listings?${qs}` : '/listings');
    },
    [params, router],
  );

  return { get, set, params };
}
