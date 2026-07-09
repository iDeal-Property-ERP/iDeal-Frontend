'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type { ListingOutput } from '@/types/marketplace';

/**
 * Tenant-facing marketplace browse with inline booking requests.
 * @returns Tenant browse page.
 */
export default function BrowseHomesPage() {
  const t = useTranslations('Pages');
  const [listings, setListings] = useState<ListingOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<number | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // /marketplace/listings/ always returns the paginated shape; it is never
      // a bare array. Read the object_list off the page.
      const data = await apiFetch<PaginatedData<ListingOutput>>('/marketplace/listings/', {
        query: { page: 1 },
      });
      setListings(data.page.object_list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => {
      void 0;
    });
  }, [load]);

  async function requestBooking(listingId: number) {
    setMessage(null);
    try {
      await apiFetch('/tenant/bookings/', {
        method: 'POST',
        body: {
          listing_id: listingId,
          requested_start_date: start,
          requested_end_date: end,
        },
      });
      setMessage(t('booking_request_success'));
      setActive(null);
      setStart('');
      setEnd('');
    } catch {
      setMessage(t('booking_request_error'));
    }
  }

  return (
    <>
      <PageHeader
        title={t('browse_homes')}
        description={t('browse_homes_desc')}
        backHref="/tenant"
      />
      {message ? <p className="mb-4 text-sm text-muted-foreground">{message}</p> : null}

      {loading ? <p className="text-sm text-muted-foreground">{t('loading')}</p> : null}
      {!loading && error ? <p className="text-sm text-danger">{t('load_error')}</p> : null}
      {!loading && !error ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <div key={listing.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">{listing.property.name}</h2>
              <p className="text-sm text-muted-foreground">{listing.property.address}</p>
              <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                <span>{t('rooms_count', { count: listing.property.rooms })}</span>
                <span>{t('area_sqm', { value: listing.property.area_sqm })}</span>
              </div>
              <p className="mt-3 text-lg font-bold text-foreground">
                {listing.listed_price} {listing.property.ask_currency}
              </p>
              {active === listing.id ? (
                <div className="mt-4 space-y-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor={`booking_start_${listing.id}`}>{t('booking_start')}</Label>
                    <Input
                      id={`booking_start_${listing.id}`}
                      type="date"
                      value={start}
                      onChange={(e) => {
                        setStart(e.target.value);
                      }}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`booking_end_${listing.id}`}>{t('booking_end')}</Label>
                    <Input
                      id={`booking_end_${listing.id}`}
                      type="date"
                      value={end}
                      onChange={(e) => {
                        setEnd(e.target.value);
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={!start || !end}
                      onClick={() => {
                        requestBooking(listing.id).catch(() => {
                          void 0;
                        });
                      }}
                    >
                      {t('request_booking')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActive(null);
                      }}
                    >
                      {t('onboarding_cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => {
                    setActive(listing.id);
                  }}
                >
                  {t('request_booking')}
                </Button>
              )}
            </div>
          ))}
          {listings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('browse_no_listings')}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
