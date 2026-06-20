'use client';

import { use, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  DetailCard,
  DetailError,
  DetailGrid,
  DetailList,
  DetailLoading,
  DetailRow,
  DetailStat,
  DetailText,
} from '@/components/ui/detail';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiFetch } from '@/libs/api';
import type { ListingOutput } from '@/types/marketplace';

/**
 * Collects the displayable image URLs for a listing's property.
 * @param property - The listing's property record.
 * @returns A list of image URLs (possibly empty).
 */
function listingImages(property: ListingOutput['property']): string[] {
  if (property.image_urls && property.image_urls.length > 0) {
    return property.image_urls;
  }
  return property.image_url ? [property.image_url] : [];
}

/**
 * Read-only detail view for a single marketplace listing.
 * @param props - Page props containing the route params.
 * @returns Listing detail page.
 */
export default function ListingDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [listing, setListing] = useState<ListingOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<ListingOutput>(`/marketplace/listings/${params.id}/`)
      .then(setListing)
      .catch(() => {
        void 0;
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return <DetailLoading />;
  }
  if (!listing) {
    return <DetailError message="Listing not found" />;
  }

  const images = listingImages(listing.property);

  return (
    <>
      <PageHeader
        title={listing.property.name}
        backHref="/marketplace"
        actions={
          <div className="flex gap-2">
            <Badge variant={listing.is_active ? 'success' : 'default'}>
              {listing.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {listing.is_featured ? <Badge variant="info">Featured</Badge> : null}
          </div>
        }
      />
      {images.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-3">
          {images.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={listing.property.name}
              className="h-40 w-56 rounded-lg object-cover"
            />
          ))}
        </div>
      ) : null}
      <DetailGrid>
        <DetailCard title="Property">
          <DetailList>
            <DetailRow label="Address" value={listing.property.address} />
            <DetailRow label="District" value={listing.property.district_name} />
            <DetailRow label="Rooms" value={listing.property.rooms} />
            <DetailRow label="Area" value={`${listing.property.area_sqm} m²`} />
            <DetailRow
              label="Floor"
              value={`${listing.property.floor}${
                listing.property.total_floors ? ` / ${listing.property.total_floors}` : ''
              }`}
            />
            <DetailRow label="Tariff" value={listing.property.tariff} />
          </DetailList>
        </DetailCard>
        <DetailCard title="Listing">
          <DetailGrid columns={1}>
            <DetailStat
              label="Listed Price"
              value={`${listing.listed_price} ${listing.property.ask_currency}`}
            />
            <DetailStat
              label="Ask Price"
              value={`${listing.property.ask_price} ${listing.property.ask_currency}`}
            />
          </DetailGrid>
        </DetailCard>
      </DetailGrid>
      {listing.description ? (
        <DetailCard title="Description" className="mt-6">
          <DetailText>{listing.description}</DetailText>
        </DetailCard>
      ) : null}
    </>
  );
}
