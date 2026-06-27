'use client';

import { Bed, Building2, Heart, MapPin, Maximize, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useFavorites } from '@/hooks/useFavorites';
import { Link } from '@/libs/I18nNavigation';
import { formatPrice } from '@/libs/marketplace';
import { cn } from '@/libs/utils';
import type { ListingOutput } from '@/types/marketplace';

type ListingCardProps = {
  listing: ListingOutput;
  selected?: boolean;
  priority?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

/**
 * Property listing card — exact Figma discovery/featured card (208:37): photo with a favorite
 * overlay, title + score, location, specs, divider, price and tariff.
 * @param props - The listing plus optional selection/hover state for the map view.
 * @returns A clickable card linking to the listing detail page.
 */
export function ListingCard(props: ListingCardProps) {
  const { listing, selected, priority, onMouseEnter, onMouseLeave } = props;
  const t = useTranslations('Listings');
  const { isFavorite, toggle } = useFavorites();
  const { property } = listing;
  const price = listing.monthly_price ?? listing.listed_price;
  const favorite = isFavorite(listing.id);

  return (
    <Link
      className={cn(
        'group flex flex-col overflow-hidden rounded-[18px] border border-border bg-card shadow-sm transition hover:shadow-md',
        selected && 'border-primary shadow-md ring-1 ring-primary',
      )}
      href={`/listings/${listing.id}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative aspect-[388/210] w-full overflow-hidden bg-muted">
        {property.image_url ? (
          <Image
            alt={property.name}
            className="object-cover transition duration-300 group-hover:scale-105"
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            src={property.image_url}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/25">
            <Building2 className="size-10 text-primary/40" />
          </div>
        )}

        <button
          aria-label={t('save')}
          className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_1px_3px_0_rgba(10,13,31,0.12)] transition"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle(listing.id);
          }}
          type="button"
        >
          <Heart
            className={cn('size-5 transition-colors', favorite && 'fill-primary text-primary')}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
            {property.name}
          </p>
          {Number(property.score) > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground">
              <Star className="size-3.5 fill-warning text-warning" />
              {property.score}
            </span>
          )}
        </div>

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{property.district_name ?? property.address}</span>
        </p>

        <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Bed className="size-[15px]" />
            {t('rooms_count', { count: property.rooms })}
          </span>
          <span className="flex items-center gap-1.5">
            <Maximize className="size-[15px]" />
            {t('area_sqm', { area: property.area_sqm })}
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 className="size-[15px]" />
            {t('floor_of', { floor: property.floor, total: property.total_floors ?? '—' })}
          </span>
        </div>

        <div className="mt-auto h-px w-full bg-border" />

        <div className="flex items-center justify-between">
          <p className="flex items-baseline gap-1">
            <span className="font-display text-[26px] font-bold tracking-[-0.01em] text-foreground">
              {formatPrice(price, property.ask_currency)}
            </span>
            <span className="text-sm text-muted-foreground">{t('per_month')}</span>
          </p>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground capitalize">
            {property.tariff}
          </span>
        </div>
      </div>
    </Link>
  );
}
