import { CreditCard, FileText, ShieldCheck } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AudienceSteps } from '@/components/marketing/AudienceSteps';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';
import { fetchFaqs } from '@/libs/marketplace';
import { cn } from '@/libs/utils';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'HowItWorks' });
  return { title: t('meta_title'), description: t('meta_description') };
}

const TRUST = [
  { icon: ShieldCheck, key: 'trust_1' },
  { icon: FileText, key: 'trust_2' },
  { icon: CreditCard, key: 'trust_3' },
] as const;

/**
 * Owner-focused "How it works" marketing page (Figma frame 80:241).
 * @param props - The route params (locale).
 * @returns The How It Works page.
 */
export default async function HowItWorksPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'HowItWorks' });
  const faqs = await fetchFaqs();

  return (
    <div className="container-page">
      {/* Hero */}
      <section className="flex flex-col items-start gap-2.5 pt-6 pb-6 sm:gap-5 sm:pt-14 sm:pb-12 md:pt-20">
        <p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">
          {t('hero_eyebrow')}
        </p>
        <h1 className="max-w-3xl font-display text-[26px] leading-9 font-bold tracking-[-0.03em] text-foreground sm:text-[46px] sm:leading-[1.1]">
          {t('hero_title')}
        </h1>
        <p className="max-w-xl text-[15px] text-muted-foreground sm:text-lg">
          {t('hero_subtitle')}
        </p>
        <div className="flex w-full flex-wrap gap-2.5 pt-1 sm:w-auto sm:gap-3 sm:pt-2">
          <Link
            className={cn(buttonVariants(), 'h-12 flex-1 sm:h-10 sm:flex-none')}
            href="/listings"
          >
            {t('cta_browse')}
          </Link>
          <Link
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-12 flex-1 sm:h-10 sm:flex-none',
            )}
            href="/list-your-property"
          >
            {t('cta_list')}
          </Link>
        </div>
      </section>

      {/* Audience toggle + steps */}
      <AudienceSteps />

      {/* Trust band — horizontal scroll on phones, one grid card on desktop */}
      <section className="pb-6 sm:pb-10">
        <div className="-mx-4 flex [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:rounded-[20px] sm:bg-primary-subtle sm:px-7 sm:py-7 [&::-webkit-scrollbar]:hidden">
          {TRUST.map(({ icon: Icon, key }) => (
            <div
              className="flex w-[266px] shrink-0 items-start gap-3 rounded-[14px] bg-primary-subtle p-4 sm:w-auto sm:flex-col sm:gap-2 sm:rounded-none sm:bg-transparent sm:p-0"
              key={key}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-primary text-primary-foreground">
                <Icon className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col gap-1 sm:gap-2">
                <h3 className="font-sans text-[15px] font-semibold text-primary-subtle-foreground sm:text-base">
                  {t(`${key}_title`)}
                </h3>
                <p className="text-[13px] text-muted-foreground sm:text-sm">{t(`${key}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="py-4 sm:py-6">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
            {t('faq_title')}
          </h2>
          <p className="mt-1 mb-4 hidden text-muted-foreground sm:mb-6 sm:block">
            {t('faq_subtitle')}
          </p>
          <div className="mt-3 sm:mt-0">
            <FaqAccordion items={faqs} />
          </div>
        </section>
      )}

      {/* CTA band */}
      <section className="py-6 sm:py-12">
        <div className="flex flex-col items-center gap-2.5 rounded-[20px] bg-primary-subtle p-5 text-center sm:gap-[18px] sm:rounded-3xl sm:px-6 sm:py-14 md:px-10">
          <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-primary-subtle-foreground sm:text-3xl">
            {t('cta_band_title')}
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-[17px]">
            {t('cta_band_desc')}
          </p>
          <div className="flex w-full flex-col justify-center gap-2.5 pt-1 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3 sm:pt-2">
            <Link
              className={cn(buttonVariants(), 'h-12 w-full sm:h-10 sm:w-auto')}
              href="/listings"
            >
              {t('cta_browse')}
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'outline' }), 'hidden sm:inline-flex')}
              href="/list-your-property"
            >
              {t('cta_list')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
