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

export async function generateMetadata(props: IndexPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Index' });
  return { title: t('meta_title'), description: t('meta_description') };
}

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
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
            {t('heading')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-500 sm:text-xl dark:text-zinc-400">
            {t('description')}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/listings"
              className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {t('browse_listings')}
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
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
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {t('features_title')}
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {t('feature_1_title')}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t('feature_1_desc')}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {t('feature_2_title')}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t('feature_2_desc')}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {t('feature_3_title')}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t('feature_3_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Listings Preview */}
      {listings.length > 0 && (
        <section className="bg-zinc-50 px-4 py-24 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {t('listings_title')}
                </h2>
                <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t('listings_subtitle')}</p>
              </div>
              <Link
                href="/listings"
                className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 sm:block dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {t('view_all')} →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.slice(0, 6).map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100">
                    {listing.property.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {listing.property.address}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {listing.property.rooms} rooms · {listing.property.area_sqm} m²
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {formatPrice(listing.listed_price, listing.property.ask_currency)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/listings"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{t('cta_title')}</h2>
          <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400">{t('cta_desc')}</p>
          <div className="mt-8">
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-zinc-900 px-8 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {t('get_started')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
