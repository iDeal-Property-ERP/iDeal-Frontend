import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Env } from '@/libs/Env';
import { Link } from '@/libs/I18nNavigation';
import type { Currency, Tariff } from '@/types/enums';
import type { ListingOutput } from '@/types/marketplace';

async function fetchListing(id: string): Promise<ListingOutput | null> {
  try {
    const res = await fetch(`${Env.NEXT_PUBLIC_API_URL}/marketplace/listings/${id}/`);
    if (!res.ok) {
      return null;
    }
    const json = (await res.json()) as { success: boolean; data: ListingOutput };
    return json.data ?? null;
  } catch {
    return null;
  }
}

function formatPrice(price: string, currency: Currency): string {
  if (currency === 'USD') {
    return `$${price}`;
  }
  return `${price} UZS`;
}

function tariffBadge(tariff: Tariff): string {
  return tariff.charAt(0).toUpperCase() + tariff.slice(1);
}

export default async function ListingDetailPage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await props.params;
  setRequestLocale(locale);

  const listing = await fetchListing(id);

  if (!listing) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/listings"
        className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
      >
        &larr; Back to listings
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6 flex aspect-video items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <span className="text-zinc-400 dark:text-zinc-600">Property image</span>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {listing.property.name}
          </h1>
          <p className="mb-6 text-zinc-500 dark:text-zinc-400">{listing.property.address}</p>

          {listing.description && (
            <div className="mb-8">
              <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Description
              </h2>
              <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
                {listing.description}
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="sticky top-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatPrice(listing.listed_price, listing.property.ask_currency)}
            </p>

            <div className="mb-6 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>Rooms</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {listing.property.rooms}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Area</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {listing.property.area_sqm} m²
                </span>
              </div>
              <div className="flex justify-between">
                <span>Floor</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {listing.property.floor} / {listing.property.total_floors}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tariff</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                  {tariffBadge(listing.property.tariff)}
                </span>
              </div>
            </div>

            <Link
              href={`/listings/${listing.id}/book`}
              className="block w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Book a viewing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
