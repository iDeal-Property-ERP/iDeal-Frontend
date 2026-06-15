import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Env } from '@/libs/Env';
import { Link } from '@/libs/I18nNavigation';
import type { ListingOutput } from '@/types/marketplace';

type IndexPageProps = {
  params: Promise<{ locale: string }>;
};

async function fetchFeaturedListings(): Promise<ListingOutput[]> {
  try {
    const res = await fetch(`${Env.NEXT_PUBLIC_API_URL}/marketplace/listings/?per_page=6`);
    if (!res.ok) {
      return [];
    }
    const json = (await res.json()) as { success: boolean; data: ListingOutput[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

function formatPrice(price: string, currency: string): string {
  if (currency === 'USD') {
    return `$${price}`;
  }
  return `${price} UZS`;
}

/**
 * Generates page metadata for the marketing index page.
 * @param props - Page props containing locale params.
 * @returns Metadata object with title and description.
 */
export async function generateMetadata(props: IndexPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Index' });
  return { title: t('meta_title'), description: t('meta_description') };
}

/**
 * Marketing home page with hero, features, listings preview, and CTA sections.
 * @param props - Page props containing locale params.
 * @returns Full marketing page layout.
 */
export default async function IndexPage(props: IndexPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Index' });
  const listings = await fetchFeaturedListings();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-24 sm:pt-28">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t('heading')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t('description')}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/listings"
              className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              {t('browse_listings')}
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              {t('sign_in')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">{t('features_title')}</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-3 text-lg font-semibold text-foreground">{t('feature_1_title')}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t('feature_1_desc')}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-3 text-lg font-semibold text-foreground">{t('feature_2_title')}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t('feature_2_desc')}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-3 text-lg font-semibold text-foreground">{t('feature_3_title')}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t('feature_3_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Listings Preview */}
      {listings.length > 0 && (
        <section className="bg-muted/50 px-4 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">{t('listings_title')}</h2>
                <p className="mt-2 text-muted-foreground">{t('listings_subtitle')}</p>
              </div>
              <Link
                href="/listings"
                className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
              >
                {t('view_all')} →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.slice(0, 6).map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="group rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
                >
                  <h3 className="font-semibold text-foreground group-hover:text-foreground/80">
                    {listing.property.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{listing.property.address}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {listing.property.rooms} rooms · {listing.property.area_sqm} m²
                    </span>
                    <span className="font-bold text-foreground">
                      {formatPrice(listing.listed_price, listing.property.ask_currency)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/listings"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {t('view_all')} →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground">{t('cta_title')}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{t('cta_desc')}</p>
          <div className="mt-8">
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              {t('get_started')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
