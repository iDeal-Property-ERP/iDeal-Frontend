'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Link } from '@/libs/I18nNavigation';
import { fetchOwnerListings } from '@/libs/ownerListings';
import type { OwnerListing } from '@/types/marketplace';

type Tone = 'warning' | 'success' | 'default' | 'danger';

const LISTING_TONE = {
  pending_review: 'warning',
  published: 'success',
  rejected: 'danger',
} satisfies Record<string, Tone>;

const statusTone = (status: string): Tone =>
  (status in LISTING_TONE
    ? // SAFETY: Status string validated against LISTING_TONE keys
      LISTING_TONE[status as keyof typeof LISTING_TONE]
    : undefined) ?? 'default';

/**
 * Owner "My Listings" — surfaces the draft/pending listings created via the
 * List-Your-Property wizard (`GET /owner/listings/`) so an owner can see status
 * and resume an unfinished draft. Closes the gap where drafts dead-ended.
 * @returns The owner listings page.
 */
export default function OwnerListingsPage() {
  const t = useTranslations('Pages');
  // SAFETY: Listing status string mapped to localized status key
  const listingStatusLabel = (status: string): string =>
    t(`listing_status_${status}` as 'listing_status_draft');
  const [rows, setRows] = useState<OwnerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchOwnerListings()
      .then(setRows)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const body = ((): ReactNode => {
    if (loading) {
      return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
    }
    if (error) {
      return <p className="text-sm text-danger">{t('load_error')}</p>;
    }
    if (rows.length === 0) {
      return <p className="text-sm text-muted-foreground">{t('my_listings_empty')}</p>;
    }
    return (
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {row.name || t('my_listings_untitled')}
                </span>
                <Badge variant={statusTone(row.status)}>{listingStatusLabel(row.status)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{row.address}</p>
              {row.status === 'rejected' && row.rejection_reason ? (
                <p className="text-sm text-danger">{row.rejection_reason}</p>
              ) : null}
            </div>
            {row.status === 'rejected' ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/list-your-property?listing=${row.id}`}>
                  {t('my_listings_resume')}
                </Link>
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    );
  })();

  return (
    <>
      <PageHeader
        title={t('my_listings_title')}
        description={t('my_listings_desc')}
        actions={
          <Button asChild>
            <Link href="/list-your-property">{t('my_listings_new')}</Link>
          </Button>
        }
      />
      {body}
    </>
  );
}
