import { setRequestLocale } from 'next-intl/server';
import { Env } from '@/libs/Env';
import { Link } from '@/libs/I18nNavigation';
import type { Currency, Tariff } from '@/types/enums';
import type { ListingOutput } from '@/types/marketplace';

async function fetchListings(params: Record<string, string>): Promise<ListingOutput[]> {
  const url = new URL(`${Env.NEXT_PUBLIC_API_URL}/marketplace/listings/`);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      return [];
    }
    const json = (await res.json()) as { success: boolean; data: ListingOutput[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

function formatPrice(price: string, currency: Currency): string {
  if (currency === 'USD') {
    return `$${price}`;
  }
  return `${price} UZS`;
}

function tariffLabel(tariff: Tariff): string {
  return tariff.charAt(0).toUpperCase() + tariff.slice(1);
}

/**
 * Listings browse page with filter form and paginated property cards.
 * @param props - Page props containing locale params and search params.
 * @returns Listings page layout.
 */
export default async function ListingsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    district?: string;
    rooms?: string;
    price_min?: string;
    price_max?: string;
  }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const searchParams = await props.searchParams;

  const listings = await fetchListings({
    district_id: searchParams.district ?? '',
    rooms: searchParams.rooms ?? '',
    price_min: searchParams.price_min ?? '',
    price_max: searchParams.price_max ?? '',
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Property listings</h1>

      <form
        method="GET"
        className="mb-8 flex flex-wrap gap-4 rounded-xl border border-border bg-card p-4"
      >
        <input
          type="text"
          name="district"
          placeholder="Search..."
          defaultValue={searchParams.district ?? ''}
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
        <input
          type="number"
          name="rooms"
          placeholder="Min rooms"
          defaultValue={searchParams.rooms ?? ''}
          className="w-28 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
        {Object.keys(searchParams).length > 0 && (
          <Link
            href="/listings"
            className="flex items-center rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Clear
          </Link>
        )}
      </form>

      {listings.length === 0 ? (
        <p className="text-center text-muted-foreground">No listings found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <h2 className="text-lg font-semibold text-foreground group-hover:text-foreground/80">
                  {listing.property.name}
                </h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {tariffLabel(listing.property.tariff)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{listing.property.address}</p>
              <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                <span>{listing.property.rooms} rooms</span>
                <span>{listing.property.area_sqm} m²</span>
              </div>
              <p className="mt-3 text-lg font-bold text-foreground">
                {formatPrice(listing.listed_price, listing.property.ask_currency)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
