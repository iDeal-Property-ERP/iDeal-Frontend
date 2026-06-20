'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { ListingOutput } from '@/types/marketplace';

/**
 * Marketplace listings grid for the listings role.
 * @returns Marketplace page.
 */
export default function MarketplacePage() {
  const t = useTranslations('Pages');
  const [listings, setListings] = useState<ListingOutput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<ListingOutput[]>('/marketplace/listings/')
      .then(setListings)
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title={t('marketplace')} description={t('marketplace_desc')} />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <div key={listing.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">{listing.property.name}</h2>
              <p className="text-sm text-muted-foreground">{listing.property.address}</p>
              <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                <span>{listing.property.rooms} rooms</span>
                <span>{listing.property.area_sqm} m²</span>
                <span>{listing.property.floor} fl.</span>
              </div>
              <p className="mt-3 text-lg font-bold text-foreground">
                {listing.listed_price} {listing.property.ask_currency}
              </p>
            </div>
          ))}
          {listings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('browse_no_listings')}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
