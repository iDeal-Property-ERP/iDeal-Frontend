'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

export default function ListingError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { error, reset } = props;
  const t = useTranslations('ListingDetail');

  useEffect(() => {
    // Log error for diagnostics
    console.error('Listing detail error:', error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="size-7" />
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
        {t('error_title')}
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('error_description')}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()} type="button">
          <RefreshCw className="size-4" />
          {t('retry')}
        </Button>
        <Button asChild variant="outline">
          <Link href="/listings">{t('back')}</Link>
        </Button>
      </div>
    </div>
  );
}
