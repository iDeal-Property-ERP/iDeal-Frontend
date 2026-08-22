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
  Tag,
  Trees,
  Utensils,
  Wifi,
} from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ListingAbout } from '@/components/listings/ListingAbout';
import { ListingBooking } from '@/components/listings/ListingBooking';
import { ListingGallery } from '@/components/listings/ListingGallery';
import { ListingHeaderActions } from '@/components/listings/ListingHeaderActions';
import { ListingNeighborhoodMobile } from '@/components/listings/ListingNeighborhoodMobile';
import { YandexMap } from '@/components/map/YandexMap';
import { Link } from '@/libs/I18nNavigation';
import { fetchListing } from '@/libs/marketplace';

const AMENITY_ICONS = {
  wifi: Wifi,
  snowflake: Snowflake,
  car: Car,
  elevator: ArrowUpDown,
  balcony: Trees,
  kitchen: Utensils,
  shield: Shield,
  flame: Flame,
  paw: PawPrint,
} satisfies Record<string, React.ComponentType<{ className?: string }>>;

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

/**
 * A compact spec chip in the mobile wrapping chip row (Figma 116:2): icon + value.
 * @param props - The icon and the chip label.
 * @returns The spec chip.
 */
function SpecChip(props: { icon: React.ReactNode; label: string }) {
  const { icon, label } = props;
  return (
    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-muted px-[11px] py-[7px] text-[13px] font-semibold text-foreground">
      {icon}
      {label}
    </span>
  );
}

export default async function ListingDetailPage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ListingDetail' });
  // SAFETY: Checklist item key mapped to localized verification item key
  const verifiedCheckLabel = (key: string): string =>
    t(`verified_check_${key}` as 'verified_check_ownership');

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
          <div className="max-md:w-full">
            {/* Mobile rating + Verified row above the title (Figma 116:2) */}
            <div className="mb-2 flex items-center justify-between gap-2 md:hidden">
              <span className="flex items-center gap-1.5 text-[15px]">
                {score > 0 && (
                  <>
                    <Star className="size-[15px] fill-accent-brand text-accent-brand" />
                    <span className="font-semibold text-foreground">{score.toFixed(1)}</span>
                    <span className="text-[13px] text-muted-foreground">
                      {t('reviews', { count: property.review_count })}
                    </span>
                  </>
                )}
              </span>
              {verification.is_verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-2.5 py-[5px] text-[12px] font-semibold text-primary-subtle-foreground">
                  <Check className="size-3" />
                  {t('verified')}
                </span>
              )}
            </div>
            <h1 className="font-display text-[22px] leading-[29px] font-semibold tracking-[-0.36px] text-foreground md:text-[36px] md:leading-[42px] md:font-bold">
              {property.name}
            </h1>
            {/* Mobile location line (Figma 116:2) */}
            <div className="mt-1.5 flex items-center gap-1.5 text-[14px] text-muted-foreground md:hidden">
              <MapPin className="size-[15px] shrink-0" />
              {district}
            </div>
            <div className="mt-2 hidden flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[14px] md:flex">
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

        <div className="order-1 max-md:-mt-6 max-sm:-mx-4 sm:max-md:-mx-6 lg:order-2">
          <ListingGallery
            listingId={listing.id}
            name={property.name}
            photos={photos}
            verified={verification.is_verified}
          />
        </div>
      </div>

      {/* Body */}
      <div className="mt-6 grid gap-8 max-md:mt-3.5 lg:mt-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6 max-md:space-y-3.5">
          {/* Specs — mobile: wrapping chip row (Figma 116:2) */}
          <div className="flex flex-wrap gap-2 md:hidden">
            <SpecChip
              icon={<Bed className="size-4" />}
              label={t('rooms_value', { count: specs.rooms })}
            />
            <SpecChip icon={<Maximize className="size-4" />} label={`${specs.area_sqm} m²`} />
            <SpecChip
              icon={<Building2 className="size-4" />}
              label={`${t('floor')} ${specs.floor}${specs.total_floors ? `/${specs.total_floors}` : ''}`}
            />
            <SpecChip icon={<Tag className="size-4" />} label={t(`tariff_${specs.tariff}`)} />
          </div>

          {/* Specs (desktop fact cards) */}
          <div className="hidden grid-cols-2 gap-3 md:grid md:grid-cols-4">
            <SpecCard
              icon={<Bed className="size-[19px]" />}
              label={t('rooms')}
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

          {/* Deposit reassurance (tablet only — desktop shows it in the side panel,
              phones fold it into the trust checklist per Figma 116:2) */}
          <div className="hidden items-center gap-2.5 md:flex lg:hidden">
            <ShieldCheck className="size-[18px] shrink-0 text-primary" />
            <span className="flex flex-col text-[14px] leading-5">
              <span className="font-medium text-foreground">{t('deposit_protected')}</span>
              <span className="text-muted-foreground">{t('deposit_protected_sub')}</span>
            </span>
          </div>

          {/* Verification */}
          {verification.is_verified && (
            <div className="rounded-[18px] bg-primary-subtle p-6 text-primary-subtle-foreground max-md:rounded-2xl max-md:p-3">
              <div className="flex items-center gap-3 max-md:gap-2.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground max-md:hidden">
                  <ShieldCheck className="size-6" />
                </span>
                <ShieldCheck className="size-[22px] shrink-0 md:hidden" />
                <div>
                  <p className="text-[18px] leading-[26px] font-semibold max-md:text-[15px] max-md:leading-5">
                    {t('verified_title')}
                  </p>
                  <p className="text-[14px] leading-5 max-md:hidden">{t('verified_subtitle')}</p>
                </div>
              </div>
              <ul className="mt-4 grid gap-3 max-md:mt-3 max-md:gap-2 sm:grid-cols-2">
                {verification.checklist.map((item) => (
                  <li
                    className="flex items-center gap-2 text-[14px] max-md:text-[13px] max-md:font-medium max-md:text-foreground"
                    key={item.key}
                  >
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground max-md:hidden">
                      <Check className="size-3" />
                    </span>
                    <Check className="size-4 shrink-0 md:hidden" />
                    {verifiedCheckLabel(item.key)}
                  </li>
                ))}
                {/* Deposit folded into the checklist on phones (Figma 116:2) */}
                <li className="flex items-start gap-2 text-[13px] font-medium text-foreground md:hidden">
                  <Check className="mt-0.5 size-4 shrink-0" />
                  {t('verified_check_deposit')}
                </li>
              </ul>
            </div>
          )}

          {/* Description */}
          {listing.description && <ListingAbout text={listing.description} />}

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div>
              <h2 className="text-[18px] font-semibold text-foreground max-md:text-[16px]">
                {t('amenities')}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3.5 max-md:mt-3 max-md:gap-x-3 max-md:gap-y-3 md:grid-cols-3">
                {property.amenities.map((a) => {
                  const Icon =
                    a.icon in AMENITY_ICONS
                      ? // SAFETY: Amenity icon checked against AMENITY_ICONS lookup
                        AMENITY_ICONS[a.icon as keyof typeof AMENITY_ICONS]
                      : Check;
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

          {/* Neighborhood — collapsed disclosure on phones (Figma 116:2) */}
          {hasCoords && (
            <>
              <div className="hidden md:block">
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
              <ListingNeighborhoodMobile district={district} points={mapPoints} />
            </>
          )}

          {/* Booking reassurance caption above the sticky bar (Figma 116:2) */}
          <p className="text-center text-[12px] leading-4 text-muted-foreground md:hidden">
            {t('book_footer')}
          </p>
        </div>

        {/* Booking panel (desktop side card + mobile sticky bar) */}
        <ListingBooking
          currency={price_card.currency}
          engagementType={property.engagement_type}
          listingId={listing.id}
          monthlyPrice={price_card.monthly_price}
        />
      </div>
    </div>
  );
}
