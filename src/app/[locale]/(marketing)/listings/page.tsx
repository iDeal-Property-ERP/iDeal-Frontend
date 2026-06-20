import { LayoutGrid, MapIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingsMapView } from '@/components/listings/ListingsMapView';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';
import { fetchListings, fetchListingsPage } from '@/libs/marketplace';
import type { PagedListings } from '@/libs/marketplace';
import type { ListingOutput } from '@/types/marketplace';

const PER_PAGE = 12;
const MAP_LIMIT = 200;

const FILTER_FIELDS = [
  { name: 'district', type: 'text', label: 'filter_district', wide: true },
  { name: 'rooms', type: 'number', label: 'filter_rooms', wide: false },
  { name: 'price_min', type: 'number', label: 'filter_price_min', wide: false },
  { name: 'price_max', type: 'number', label: 'filter_price_max', wide: false },
  { name: 'area_min', type: 'number', label: 'filter_area_min', wide: false },
  { name: 'area_max', type: 'number', label: 'filter_area_max', wide: false },
] as const;

const INPUT_CLASS =
  'rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';

type ListingsSearchParams = {
  district?: string;
  rooms?: string;
  price_min?: string;
  price_max?: string;
  area_min?: string;
  area_max?: string;
  view?: string;
  page?: string;
};

function buildFilters(sp: ListingsSearchParams): Record<string, string> {
  return {
    district_id: sp.district ?? '',
    rooms: sp.rooms ?? '',
    price_min: sp.price_min ?? '',
    price_max: sp.price_max ?? '',
    area_min: sp.area_min ?? '',
    area_max: sp.area_max ?? '',
  };
}

function withParams(
  sp: ListingsSearchParams,
  overrides: Record<string, string | undefined>,
): string {
  const merged = { ...sp, ...overrides };
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) {
      qs.set(key, value);
    }
  }
  const str = qs.toString();
  return str ? `/listings?${str}` : '/listings';
}

/**
 * Filter form for the listings page (district, rooms, price and area ranges).
 * @param props - Locale, current search params, and whether the map view is active.
 * @returns The filter form.
 */
async function ListingsFilters(props: {
  locale: string;
  sp: ListingsSearchParams;
  isMap: boolean;
}) {
  const { locale, sp, isMap } = props;
  const t = await getTranslations({ locale, namespace: 'Listings' });
  return (
    <form
      className="mb-8 grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3 lg:grid-cols-6"
      method="GET"
    >
      {isMap && <input name="view" type="hidden" value="map" />}
      {FILTER_FIELDS.map((field) => (
        <input
          className={field.wide ? `col-span-2 ${INPUT_CLASS} sm:col-span-1` : INPUT_CLASS}
          defaultValue={sp[field.name] ?? ''}
          key={field.name}
          name={field.name}
          placeholder={t(field.label)}
          type={field.type}
        />
      ))}
      <div className="col-span-2 flex gap-2 sm:col-span-3 lg:col-span-6">
        <Button size="sm" type="submit">
          {t('search')}
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={isMap ? '/listings?view=map' : '/listings'}>{t('clear')}</Link>
        </Button>
      </div>
    </form>
  );
}

/**
 * Renders the listings results — empty state, map view, or paginated grid.
 * @param props - Locale, listings, view mode, pagination data, and search params.
 * @returns The results section.
 */
async function ListingsResults(props: {
  locale: string;
  listings: ListingOutput[];
  isMap: boolean;
  paged: PagedListings | null;
  page: number;
  sp: ListingsSearchParams;
}) {
  const { locale, listings, isMap, paged, page, sp } = props;
  const t = await getTranslations({ locale, namespace: 'Listings' });

  if (listings.length === 0) {
    return <p className="py-16 text-center text-muted-foreground">{t('no_listings')}</p>;
  }
  if (isMap) {
    return <ListingsMapView listings={listings} />;
  }
  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing, index) => (
          <ListingCard key={listing.id} listing={listing} priority={index < 3} />
        ))}
      </div>
      {paged && paged.numPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button asChild disabled={page <= 1} size="sm" variant="outline">
            <Link href={withParams(sp, { page: String(page - 1) })}>{t('previous')}</Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('page_of', { page: paged.page, total: paged.numPages })}
          </span>
          <Button asChild disabled={page >= paged.numPages} size="sm" variant="outline">
            <Link href={withParams(sp, { page: String(page + 1) })}>{t('next')}</Link>
          </Button>
        </div>
      )}
    </>
  );
}

/**
 * Listings browse page with filters and a toggle between grid and interactive map views.
 * @param props - Page props containing locale params and search params.
 * @returns The listings page layout.
 */
export default async function ListingsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<ListingsSearchParams>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const sp = await props.searchParams;
  const t = await getTranslations({ locale, namespace: 'Listings' });

  const isMap = sp.view === 'map';
  const filters = buildFilters(sp);
  const page = Math.max(1, Number(sp.page ?? '1') || 1);

  const paged = isMap ? null : await fetchListingsPage(filters, page, PER_PAGE);
  const mapListings = isMap ? await fetchListings({ ...filters, per_page: String(MAP_LIMIT) }) : [];
  const listings = isMap ? mapListings : (paged?.items ?? []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        <div className="inline-flex rounded-lg border border-border p-0.5">
          <Button asChild size="sm" variant={isMap ? 'ghost' : 'default'}>
            <Link href={withParams(sp, { view: undefined, page: undefined })}>
              <LayoutGrid className="size-4" />
              {t('view_grid')}
            </Link>
          </Button>
          <Button asChild size="sm" variant={isMap ? 'default' : 'ghost'}>
            <Link href={withParams(sp, { view: 'map', page: undefined })}>
              <MapIcon className="size-4" />
              {t('view_map')}
            </Link>
          </Button>
        </div>
      </div>

      <ListingsFilters isMap={isMap} locale={locale} sp={sp} />
      <ListingsResults
        isMap={isMap}
        listings={listings}
        locale={locale}
        paged={paged}
        page={page}
        sp={sp}
      />
    </div>
  );
}
