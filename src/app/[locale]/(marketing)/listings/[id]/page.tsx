import {
  ArrowUpDown,
  BadgeCheck,
  Bed,
  Building2,
  Car,
  Check,
  ChevronRight,
  Flame,
  MapPin,
  Maximize,
  PawPrint,
  Shield,
  ShieldCheck,
  Snowflake,
  Star,
  Trees,
  Utensils,
  Wifi,
} from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ListingBooking } from '@/components/listings/ListingBooking';
import { ListingGallery } from '@/components/listings/ListingGallery';
import { ListingHeaderActions } from '@/components/listings/ListingHeaderActions';
import { YandexMap } from '@/components/map/YandexMap';
import { Link } from '@/libs/I18nNavigation';
import { fetchListing } from '@/libs/marketplace';

const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  snowflake: Snowflake,
  car: Car,
  elevator: ArrowUpDown,
  balcony: Trees,
  kitchen: Utensils,
  shield: Shield,
  flame: Flame,
  paw: PawPrint,
};

/**
 * A single fact card in the specs row (Figma 34:5): icon box + value + label.
 * @param props - The icon, value and label.
 * @returns The spec card.
 */
function SpecCard(props: { icon: React.ReactNode; value: string; label: string }) {
  const { icon, value, label } = props;
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-[18px]">
      <span className="grid size-[38px] place-items-center rounded-[10px] bg-primary-subtle text-primary-subtle-foreground">
        {icon}
      </span>
      <span className="text-[18px] leading-[26px] font-semibold text-foreground">{value}</span>
      <span className="text-[14px] text-muted-foreground">{label}</span>
    </div>
  );
}

export default async function ListingDetailPage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ListingDetail' });

  const listing = await fetchListing(id);
  if (!listing) {
    notFound();
  }

  const { property, specs, price_card, verification, photos } = listing;
  const score = Number(property.score);
  const district = property.district_name ?? property.address;
  const hasCoords = property.map_lat && property.map_lon;
  const mapPoints = hasCoords
    ? [
        {
          id: listing.id,
          lat: Number(property.map_lat),
          lon: Number(property.map_lon),
          name: property.name,
          address: property.address,
          price: price_card.monthly_price ?? property.ask_price,
          currency: price_card.currency,
          image_url: property.image_url,
        },
      ]
    : [];

  return (
    <div className="container-page pt-6 pb-28 lg:pb-12">
      {/* Breadcrumb (desktop) */}
      <nav className="mb-5 hidden items-center gap-2 text-[14px] text-muted-foreground lg:flex">
        <Link className="hover:text-foreground" href="/listings">
          {t('breadcrumb_rent')}
        </Link>
        <ChevronRight className="size-3.5" />
        <span>{district}</span>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{property.name}</span>
      </nav>

      {/* Title row + gallery (mobile shows the gallery first) */}
      <div className="flex flex-col gap-5">
        <div className="order-2 flex flex-wrap items-start justify-between gap-4 lg:order-1">
          <div>
            <h1 className="font-display text-[28px] font-bold tracking-[-0.36px] text-foreground sm:text-[36px] sm:leading-[42px]">
              {property.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[14px]">
              <span className="flex items-center gap-1.5 text-[16px] text-muted-foreground">
                <MapPin className="size-4" />
                {district}
              </span>
              {score > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-foreground">{score.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    {t('reviews', { count: property.review_count })}
                  </span>
                </span>
              )}
              {verification.is_verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-2.5 py-1 text-[12px] font-medium text-primary-subtle-foreground">
                  <BadgeCheck className="size-3.5" />
                  {t('verified')}
                </span>
              )}
            </div>
          </div>
          <div className="hidden lg:block">
            <ListingHeaderActions listingId={listing.id} name={property.name} />
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <ListingGallery
            listingId={listing.id}
            name={property.name}
            photos={photos}
            verified={verification.is_verified}
          />
        </div>
      </div>

      {/* Body */}
      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Specs */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SpecCard
              icon={<Bed className="size-[19px]" />}
              label={t('bedrooms')}
              value={t('rooms_value', { count: specs.rooms })}
            />
            <SpecCard
              icon={<Maximize className="size-[19px]" />}
              label={t('living_area')}
              value={`${specs.area_sqm} m²`}
            />
            <SpecCard
              icon={<Building2 className="size-[19px]" />}
              label={t('floor')}
              value={`${specs.floor}${specs.total_floors ? ` / ${specs.total_floors}` : ''}`}
            />
            <SpecCard
              icon={<Star className="size-[19px]" />}
              label={t('tariff_label')}
              value={t(`tariff_${specs.tariff}`)}
            />
          </div>

          {/* Deposit reassurance (mobile only — desktop shows it in the side panel) */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <ShieldCheck className="size-[18px] shrink-0 text-primary" />
            <span className="flex flex-col text-[14px] leading-5">
              <span className="font-medium text-foreground">{t('deposit_protected')}</span>
              <span className="text-muted-foreground">{t('deposit_protected_sub')}</span>
            </span>
          </div>

          {/* Verification */}
          {verification.is_verified && (
            <div className="rounded-[18px] bg-primary-subtle p-6 text-primary-subtle-foreground">
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <ShieldCheck className="size-6" />
                </span>
                <div>
                  <p className="text-[18px] leading-[26px] font-semibold">{t('verified_title')}</p>
                  <p className="text-[14px] leading-5">{t('verified_subtitle')}</p>
                </div>
              </div>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {verification.checklist.map((item) => (
                  <li className="flex items-center gap-2 text-[14px]" key={item.key}>
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                    {t(`verified_check_${item.key}` as 'verified_check_ownership')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <div>
              <h2 className="text-[18px] font-semibold text-foreground">{t('about')}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{listing.description}</p>
            </div>
          )}

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div>
              <h2 className="text-[18px] font-semibold text-foreground">{t('amenities')}</h2>
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3.5 md:grid-cols-3">
                {property.amenities.map((a) => {
                  const Icon = AMENITY_ICONS[a.icon] ?? Check;
                  return (
                    <div
                      className="flex items-center gap-2.5 text-[14px] text-foreground"
                      key={a.slug}
                    >
                      <Icon className="size-[18px] text-muted-foreground" />
                      {a.name}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Neighborhood */}
          {hasCoords && (
            <div>
              <h2 className="mb-3 text-[18px] font-semibold text-foreground">
                {t('neighborhood')}
              </h2>
              <YandexMap
                center={[mapPoints[0]!.lat, mapPoints[0]!.lon]}
                className="h-72 rounded-2xl"
                points={mapPoints}
                zoom={14}
              />
            </div>
          )}
        </div>

        {/* Booking panel (desktop side card + mobile sticky bar) */}
        <ListingBooking
          currency={price_card.currency}
          listingId={listing.id}
          monthlyPrice={price_card.monthly_price}
        />
      </div>
    </div>
  );
}
