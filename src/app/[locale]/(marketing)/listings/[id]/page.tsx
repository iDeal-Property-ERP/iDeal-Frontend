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

/**
 * Listing detail page showing property info, specs, and a booking call-to-action.
 * @param props - Page props containing locale and listing id params.
 * @returns Listing detail layout or 404 if not found.
 */
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
        className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to listings
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6 flex aspect-video items-center justify-center rounded-xl bg-muted">
            <span className="text-muted-foreground">Property image</span>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-foreground">{listing.property.name}</h1>
          <p className="mb-6 text-muted-foreground">{listing.property.address}</p>

          {listing.description && (
            <div className="mb-8">
              <h2 className="mb-2 text-lg font-semibold text-foreground">Description</h2>
              <p className="leading-relaxed text-muted-foreground">{listing.description}</p>
            </div>
          )}
        </div>

        <div>
          <div className="sticky top-8 rounded-xl border border-border bg-card p-6">
            <p className="mb-4 text-3xl font-bold text-foreground">
              {formatPrice(listing.listed_price, listing.property.ask_currency)}
            </p>

            <div className="mb-6 space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Rooms</span>
                <span className="font-medium text-foreground">{listing.property.rooms}</span>
              </div>
              <div className="flex justify-between">
                <span>Area</span>
                <span className="font-medium text-foreground">{listing.property.area_sqm} m²</span>
              </div>
              <div className="flex justify-between">
                <span>Floor</span>
                <span className="font-medium text-foreground">
                  {listing.property.floor} / {listing.property.total_floors}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tariff</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {tariffBadge(listing.property.tariff)}
                </span>
              </div>
            </div>

            <Link
              href={`/listings/${listing.id}/book`}
              className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Book a viewing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
