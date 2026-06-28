import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FeaturedHomes } from '@/components/marketing/FeaturedHomes';
import { LandingHero } from '@/components/marketing/LandingHero';
import { OwnersCta } from '@/components/marketing/OwnersCta';
import { RenterSteps } from '@/components/marketing/RenterSteps';
import { TrustBand } from '@/components/marketing/TrustBand';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Landing' });
  return { title: t('meta_title'), description: t('meta_description') };
}

/**
 * Public landing page (Figma frame 204:3): hero + trust + featured + how-it-works + owners CTA.
 * @param props - The route params (locale).
 * @returns The landing page.
 */
export default async function LandingPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return (
    <>
      <div className="container-page">
        <LandingHero />
        <TrustBand />
        <FeaturedHomes locale={locale} />
      </div>
      <RenterSteps />
      <div className="container-page">
        <OwnersCta />
      </div>
    </>
  );
}
