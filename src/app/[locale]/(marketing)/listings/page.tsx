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
      <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        Property listings
      </h1>

      <form
        method="GET"
        className="mb-8 flex flex-wrap gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <input
          type="text"
          name="district"
          placeholder="Search..."
          defaultValue={searchParams.district ?? ''}
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        <input
          type="number"
          name="rooms"
          placeholder="Min rooms"
          defaultValue={searchParams.rooms ?? ''}
          className="w-28 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Search
        </button>
        {Object.keys(searchParams).length > 0 && (
          <Link
            href="/listings"
            className="flex items-center rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            Clear
          </Link>
        )}
      </form>

      {listings.length === 0 ? (
        <p className="text-center text-zinc-500">No listings found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-3 flex items-start justify-between">
                <h2 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-300">
                  {listing.property.name}
                </h2>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {tariffLabel(listing.property.tariff)}
                </span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{listing.property.address}</p>
              <div className="mt-3 flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                <span>{listing.property.rooms} rooms</span>
                <span>{listing.property.area_sqm} m²</span>
              </div>
              <p className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {formatPrice(listing.listed_price, listing.property.ask_currency)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
