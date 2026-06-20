import {
  ArrowRight,
  Building2,
  CalendarCheck,
  KeyRound,
  MapPin,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ListingCard } from '@/components/listings/ListingCard';
import { YandexMap } from '@/components/map/YandexMap';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';
import { fetchListings, fetchListingsMap } from '@/libs/marketplace';

type IndexPageProps = {
  params: Promise<{ locale: string }>;
};

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
 * Marketing home page: hero, how-it-works, value props, interactive map, featured listings, CTA.
 * @param props - Page props containing locale params.
 * @returns Full marketing page layout.
 */
export default async function IndexPage(props: IndexPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Index' });

  const [listings, mapPoints] = await Promise.all([
    fetchListings({ per_page: '6' }),
    fetchListingsMap(),
  ]);

  const homesAvailable = mapPoints.length;

  const steps = [
    { icon: Search, title: t('step_1_title'), desc: t('step_1_desc') },
    { icon: CalendarCheck, title: t('step_2_title'), desc: t('step_2_desc') },
    { icon: KeyRound, title: t('step_3_title'), desc: t('step_3_desc') },
  ];

  const valueProps = [
    { icon: Users, title: t('feature_1_title'), desc: t('feature_1_desc') },
    { icon: Wallet, title: t('feature_2_title'), desc: t('feature_2_desc') },
    { icon: ShieldCheck, title: t('feature_3_title'), desc: t('feature_3_desc') },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-20 pb-24 sm:pt-28 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <MapPin className="size-3.5" />
              {t('hero_badge')}
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t('heading')}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {t('description')}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg">
                <Link href="/listings">
                  {t('browse_listings')}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">{t('list_property')}</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              <div>
                <dt className="text-2xl font-bold text-foreground">{homesAvailable}+</dt>
                <dd className="text-xs text-muted-foreground">{t('stat_homes')}</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold text-foreground">3</dt>
                <dd className="text-xs text-muted-foreground">{t('stat_languages')}</dd>
              </div>
              <div>
                <dt className="text-2xl font-bold text-foreground">24/7</dt>
                <dd className="text-xs text-muted-foreground">{t('stat_support')}</dd>
              </div>
            </dl>
          </div>

          {/* Hero visual: photo collage from featured listings */}
          <div className="relative hidden gap-4 lg:grid lg:grid-cols-2">
            {listings.slice(0, 4).map((listing, index) => (
              <div
                key={listing.id}
                className={`overflow-hidden rounded-2xl border border-border bg-muted shadow-sm ${
                  index % 2 === 0 ? 'aspect-[3/4]' : 'mt-8 aspect-[3/4]'
                }`}
              >
                {listing.property.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.property.image_url}
                    alt={listing.property.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
                    <Building2 className="size-10 text-primary/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">{t('how_title')}</h2>
            <p className="mt-3 text-muted-foreground">{t('how_subtitle')}</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <step.icon className="size-6" />
                </div>
                <div className="mt-2 text-xs font-semibold text-primary">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="bg-muted/40 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">{t('features_title')}</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {valueProps.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="size-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive map teaser */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground">{t('map_title')}</h2>
              <p className="mt-2 text-muted-foreground">{t('map_subtitle')}</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/listings?view=map">
                {t('map_open_full')}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <YandexMap points={mapPoints} className="h-[420px] border border-border" />
        </div>
      </section>

      {/* Featured listings */}
      {listings.length > 0 && (
        <section className="bg-muted/40 px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground">{t('listings_title')}</h2>
                <p className="mt-2 text-muted-foreground">{t('listings_subtitle')}</p>
              </div>
              <Link
                href="/listings"
                className="hidden text-sm font-medium text-primary hover:underline sm:block"
              >
                {t('view_all')} →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.slice(0, 6).map((listing, index) => (
                <ListingCard key={listing.id} listing={listing} priority={index < 3} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link href="/listings" className="text-sm font-medium text-primary hover:underline">
                {t('view_all')} →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-3xl rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground shadow-sm">
          <h2 className="text-3xl font-bold">{t('cta_title')}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
            {t('cta_desc')}
          </p>
          <div className="mt-8">
            <Button asChild size="lg" variant="secondary">
              <Link href="/login">{t('get_started')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
