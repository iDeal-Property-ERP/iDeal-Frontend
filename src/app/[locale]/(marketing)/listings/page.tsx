import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DiscoveryFilterChips } from '@/components/listings/DiscoveryFilterChips';
import { DiscoveryResults } from '@/components/listings/DiscoveryResults';
import { DiscoverySearchBar } from '@/components/listings/DiscoverySearchBar';
import { MobileSearchSheet } from '@/components/listings/MobileSearchSheet';
import { ViewSwitch } from '@/components/listings/ViewSwitch';
import {
  fetchAmenities,
  fetchDistricts,
  fetchListings,
  fetchListingsPage,
  normalizeView,
} from '@/libs/marketplace';
import type { ListingFilters, ListingOutput } from '@/types/marketplace';

const PER_PAGE = 12;
const MAP_LIMIT = 200;

type ListingsSearchParams = {
  district_id?: string;
  price_min?: string;
  price_max?: string;
  rooms_min?: string;
  rooms_max?: string;
  area_min?: string;
  area_max?: string;
  verified?: string;
  furnishing?: string;
  tariff?: string;
  property_type?: string;
  amenities?: string;
  sort?: string;
  q?: string;
  bbox?: string;
  page?: string;
  view?: string;
};

function buildFilters(sp: ListingsSearchParams): ListingFilters {
  return {
    district_id: sp.district_id ?? '',
    price_min: sp.price_min ?? '',
    price_max: sp.price_max ?? '',
    rooms_min: sp.rooms_min ?? '',
    rooms_max: sp.rooms_max ?? '',
    area_min: sp.area_min ?? '',
    area_max: sp.area_max ?? '',
    verified: sp.verified ?? '',
    furnishing: sp.furnishing ?? '',
    tariff: sp.tariff ?? '',
    property_type: sp.property_type ?? '',
    amenities: sp.amenities ?? '',
    sort: sp.sort ?? '',
    q: sp.q ?? '',
    bbox: sp.bbox ?? '',
  };
}

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Listings' });
  return { title: t('title'), description: t('subtitle') };
}

/**
 * Discovery / listings page (Figma 76:2 / 237:2 / 237:380): header, segmented search bar, filter
 * chips + a List/Split/Map view switch, and the view-aware results region (card grid and/or
 * interactive map). The view is URL-driven via `?view=`; the map dataset is only fetched when a map
 * is shown (Split/Map).
 * @param props - Route params (locale) and the URL search params (filters + view).
 * @returns The discovery page.
 */
export default async function ListingsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<ListingsSearchParams>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const sp = await props.searchParams;
  const t = await getTranslations({ locale, namespace: 'Listings' });

  const filters = buildFilters(sp);
  const page = Math.max(1, Number(sp.page ?? '1') || 1);
  const view = normalizeView(sp.view);
  const needsServerMap = view !== 'list';

  const [paged, mapListings, districts, amenities] = await Promise.all([
    fetchListingsPage(filters, page, PER_PAGE),
    needsServerMap
      ? fetchListings({ ...filters, per_page: String(MAP_LIMIT) })
      : Promise.resolve<ListingOutput[]>([]),
    fetchDistricts(),
    fetchAmenities(),
  ]);

  return (
    <div className="container-page pt-4 pb-8 md:pt-8">
      {/* Title stack is the mobile density offender — hidden visually on mobile (kept for
          a11y/SEO via sr-only), restored at md+ where the desktop header keeps it. */}
      <div className="mb-6 max-md:sr-only">
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-foreground">{t('title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="hidden md:block">
        <DiscoverySearchBar districts={districts} />
      </div>
      <div className="md:hidden">
        <MobileSearchSheet amenities={amenities} districts={districts} />
      </div>

      <div className="mt-3 mb-4 flex items-center justify-between gap-3 md:mt-4 md:mb-6">
        <div className="min-w-0 flex-1">
          <DiscoveryFilterChips amenities={amenities} districts={districts} />
        </div>
        <ViewSwitch view={view} />
      </div>

      <DiscoveryResults
        amenities={amenities}
        count={paged.count}
        districts={districts}
        listings={paged.items}
        mapListings={mapListings}
        numPages={paged.numPages}
        page={page}
        view={view}
      />
    </div>
  );
}
