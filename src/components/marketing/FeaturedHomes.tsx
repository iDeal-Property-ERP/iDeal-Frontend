import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ListingCard } from '@/components/listings/ListingCard';
import { Link } from '@/libs/I18nNavigation';
import { fetchListings } from '@/libs/marketplace';

/**
 * "Homes in Tashkent" — a horizontal carousel of marketplace listings (Figma 208:28).
 * @param props - The active locale.
 * @returns The featured-homes section, or null when there are no listings.
 */
export async function FeaturedHomes(props: { locale: string }) {
  const t = await getTranslations({ locale: props.locale, namespace: 'Landing' });
  const listings = await fetchListings({ per_page: '10' });
  if (listings.length === 0) {
    return null;
  }
  return (
    <section className="py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] leading-[34px] font-bold tracking-[-0.018em] text-foreground">
            {t('featured_title')}
          </h2>
          <p className="mt-1.5 text-[15px] text-muted-foreground">{t('featured_subtitle')}</p>
        </div>
        <Link
          href="/listings"
          className="inline-flex shrink-0 items-center gap-1.5 text-[15px] font-semibold text-accent-brand hover:underline"
        >
          {t('featured_view_all')}
          <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory [scrollbar-width:none] gap-6 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {listings.map((listing, i) => (
          <div key={listing.id} className="w-[320px] shrink-0 snap-start sm:w-[360px] lg:w-[388px]">
            <ListingCard listing={listing} priority={i < 3} />
          </div>
        ))}
      </div>
    </section>
  );
}
