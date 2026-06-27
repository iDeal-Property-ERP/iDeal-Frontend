'use client';

import { Building2, Heart, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useFavorites } from '@/hooks/useFavorites';
import { Link } from '@/libs/I18nNavigation';
import { formatPrice } from '@/libs/marketplace';
import { cn } from '@/libs/utils';
import type { ListingOutput } from '@/types/marketplace';

type MobileMiniCardProps = {
  listing: ListingOutput;
  selected: boolean;
  onSelect: () => void;
};

/**
 * Compact horizontal listing card (Figma 245:8) used in the mobile map carousel: a 112px thumbnail
 * plus the name, district and price. The selected card gets the accent border to match its map pin.
 * @param props - The listing, whether it is the selected pin, and the tap handler.
 * @returns The mini-card, linking to the listing detail.
 */
export function MobileMiniCard(props: MobileMiniCardProps) {
  const { listing, selected, onSelect } = props;
  const t = useTranslations('Listings');
  const { isFavorite, toggle } = useFavorites();
  const { property } = listing;
  const price = listing.monthly_price ?? listing.listed_price;
  const favorite = isFavorite(listing.id);

  return (
    <Link
      className={cn(
        'flex h-[104px] gap-3 overflow-hidden rounded-2xl border-2 bg-card pr-3 shadow-[0_4px_14px_0_rgba(11,18,32,0.16)] transition',
        selected ? 'border-accent-brand' : 'border-transparent',
      )}
      href={`/listings/${listing.id}`}
      onClick={onSelect}
    >
      <div className="relative h-full w-28 shrink-0 bg-muted">
        {property.image_url ? (
          <Image
            alt={property.name}
            className="object-cover"
            fill
            sizes="112px"
            src={property.image_url}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/25">
            <Building2 className="size-6 text-primary/40" />
          </div>
        )}
        <button
          aria-label={t('save')}
          className="absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle(listing.id);
          }}
          type="button"
        >
          <Heart className={cn('size-3.5', favorite && 'fill-primary text-primary')} />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-foreground">{property.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{property.district_name ?? property.address}</span>
          </p>
        </div>
        <p className="flex items-baseline gap-1">
          <span className="font-display text-[18px] font-bold text-foreground">
            {formatPrice(price, property.ask_currency)}
          </span>
          <span className="text-[12px] text-muted-foreground">{t('per_month')}</span>
        </p>
      </div>
    </Link>
  );
}
