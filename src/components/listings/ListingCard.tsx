import { Bed, MapPin, Maximize, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
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
 * Property listing card with photo, key specs, district, and price.
 * @param props - The listing plus optional selection/hover state for the map view.
 * @returns A clickable card linking to the listing detail page.
 */
export function ListingCard(props: ListingCardProps) {
  const { listing, selected, priority, onMouseEnter, onMouseLeave } = props;
  const t = useTranslations('Listings');
  const { property } = listing;

  return (
    <Link
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md',
        selected && 'ring-2 ring-primary',
      )}
      href={`/listings/${listing.id}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
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
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
            <Building2 className="size-10 text-primary/40" />
          </div>
        )}
        {listing.is_featured && (
          <Badge variant="primary" className="absolute top-3 left-3 shadow-sm">
            {t('featured')}
          </Badge>
        )}
        <Badge variant="secondary" className="absolute top-3 right-3 capitalize shadow-sm">
          {property.tariff}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-foreground group-hover:text-primary">{property.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{property.district_name ?? property.address}</span>
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bed className="size-4" />
            {t('rooms_count', { count: property.rooms })}
          </span>
          <span className="flex items-center gap-1">
            <Maximize className="size-4" />
            {t('area_sqm', { area: property.area_sqm })}
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="size-4" />
            {t('floor_of', { floor: property.floor, total: property.total_floors ?? '—' })}
          </span>
        </div>

        <p className="mt-auto pt-3 text-lg font-bold text-foreground">
          {formatPrice(listing.listed_price, property.ask_currency)}
        </p>
      </div>
    </Link>
  );
}
