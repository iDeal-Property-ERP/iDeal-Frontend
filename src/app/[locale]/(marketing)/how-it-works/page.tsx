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
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="flex flex-col items-start gap-5 pt-14 pb-12 md:pt-20">
        <p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">
          {t('hero_eyebrow')}
        </p>
        <h1 className="max-w-3xl font-display text-4xl font-bold tracking-[-0.03em] text-foreground sm:text-[46px] sm:leading-[1.1]">
          {t('hero_title')}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">{t('hero_subtitle')}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/listings" className={cn(buttonVariants())}>
            {t('cta_browse')}
          </Link>
          <Link href="/list-your-property" className={cn(buttonVariants({ variant: 'outline' }))}>
            {t('cta_list')}
          </Link>
        </div>
      </section>

      {/* Audience toggle + steps */}
      <AudienceSteps />

      {/* Trust band */}
      <section className="pb-10">
        <div className="grid gap-5 rounded-[20px] bg-primary-subtle p-7 md:grid-cols-3">
          {TRUST.map(({ icon: Icon, key }) => (
            <div key={key} className="flex flex-col gap-2">
              <span className="grid size-9 place-items-center rounded-[10px] bg-primary text-primary-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="font-sans text-base font-semibold text-primary-subtle-foreground">
                {t(`${key}_title`)}
              </h3>
              <p className="text-sm text-muted-foreground">{t(`${key}_desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="py-6">
          <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground">
            {t('faq_title')}
          </h2>
          <p className="mt-1 mb-6 text-muted-foreground">{t('faq_subtitle')}</p>
          <FaqAccordion items={faqs} />
        </section>
      )}

      {/* CTA band */}
      <section className="py-12">
        <div className="flex flex-col items-center gap-[18px] rounded-3xl bg-primary-subtle px-6 py-14 text-center md:px-10">
          <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-primary-subtle-foreground">
            {t('cta_band_title')}
          </h2>
          <p className="max-w-xl text-[17px] text-muted-foreground">{t('cta_band_desc')}</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/listings" className={cn(buttonVariants())}>
              {t('cta_browse')}
            </Link>
            <Link href="/list-your-property" className={cn(buttonVariants({ variant: 'outline' }))}>
              {t('cta_list')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
