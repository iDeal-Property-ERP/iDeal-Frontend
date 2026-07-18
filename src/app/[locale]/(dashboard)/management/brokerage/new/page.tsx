'use client';

import { useEffect } from 'react';
import { useRouter } from '@/libs/I18nNavigation';

/** Legacy brokerage create URL. Creation now happens in the shared property form.
 * @returns The page element (null — redirects immediately).
 */
export default function NewBrokerageDealPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/management/properties/new?engagement=one_off');
  }, [router]);

  return null;
}
