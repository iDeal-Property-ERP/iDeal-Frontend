import { Clock, HelpCircle, Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import { SupportContactForm } from '@/components/marketing/SupportContactForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/libs/I18nNavigation';

/**
 * Generates SEO and App Store review metadata for the support page.
 * @param props - The locale route params.
 * @returns Metadata object.
 */
export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'SupportPage' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: {
      canonical: 'https://ideal.uz/support',
    },
  };
}

/**
 * Public support and contact landing page fulfilling App Store & Google Play Store publishing requirements.
 * @param props - The locale route params.
 * @returns The localized Support page.
 */
export default async function SupportPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SupportPage' });

  const faqs = [
    {
      id: 1,
      question: t('faq_1_q'),
      answer: t('faq_1_a'),
      sort_order: 1,
    },
    {
      id: 2,
      question: t('faq_2_q'),
      answer: t('faq_2_a'),
      sort_order: 2,
    },
    {
      id: 3,
      question: t('faq_3_q'),
      answer: t('faq_3_a'),
      sort_order: 3,
    },
    {
      id: 4,
      question: t('faq_4_q'),
      answer: t('faq_4_a'),
      sort_order: 4,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'iDeal Support',
    url: 'https://ideal.uz/support',
    mainEntity: {
      '@type': 'Organization',
      name: 'iDeal',
      url: 'https://ideal.uz',
      email: 'support@ideal.uz',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'support@ideal.uz',
        availableLanguage: ['English', 'Uzbek', 'Russian'],
      },
    },
  };

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      <div className="container-page py-8 sm:py-14">
        {/* Header / Hero */}
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
            {t('eyebrow')}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{t('intro')}</p>
        </div>

        {/* 2-Column: Form + Channels */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-7">
            <SupportContactForm />
          </div>

          {/* Direct Support Channels */}
          <div className="space-y-6 lg:col-span-5">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="font-display text-lg font-bold text-foreground sm:text-xl">
                  {t('direct_channels_title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email Support */}
                <a
                  href="mailto:support@ideal.uz"
                  className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {t('channel_email_title')}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">support@ideal.uz</p>
                    <p className="mt-1 text-xs font-medium text-primary">
                      {t('channel_email_desc')}
                    </p>
                  </div>
                </a>

                {/* Telegram Support */}
                <a
                  href="https://t.me/ideal_support_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <MessageCircle className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {t('channel_telegram_title')}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">@ideal_support_bot</p>
                    <p className="mt-1 text-xs font-medium text-primary">
                      {t('channel_telegram_desc')}
                    </p>
                  </div>
                </a>

                {/* Operating Hours & SLA */}
                <div className="flex items-start gap-3.5 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {t('channel_hours_title')}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t('channel_hours_desc')}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{t('channel_sla_desc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links Card */}
            <Card className="border-border bg-muted/20 shadow-sm">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  <span>{t('quick_links_title')}</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li>
                    <Link
                      href="/privacy-policy"
                      className="font-medium text-primary hover:underline"
                    >
                      {t('link_privacy_policy')}
                    </Link>
                    {' — '}
                    {t('link_privacy_policy_desc')}
                  </li>
                  <li>
                    <Link href="/tos" className="font-medium text-primary hover:underline">
                      {t('link_terms')}
                    </Link>
                    {' — '}
                    {t('link_terms_desc')}
                  </li>
                  <li>
                    <Link
                      href="/delete-account"
                      className="font-medium text-primary hover:underline"
                    >
                      {t('link_delete_account')}
                    </Link>
                    {' — '}
                    {t('link_delete_account_desc')}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-16 sm:mt-20">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-primary uppercase">
            <HelpCircle className="size-4" />
            <span>{t('faq_eyebrow')}</span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em] text-foreground sm:text-3xl">
            {t('faq_title')}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">{t('faq_subtitle')}</p>

          <div className="mt-6 max-w-3xl">
            <FaqAccordion items={faqs} />
          </div>
        </section>

        {/* Footer Note */}
        <p className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          {t('footer_support_notice')}
        </p>
      </div>
    </>
  );
}
