import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'TermsOfServicePage' });
  return { title: t('meta_title'), description: t('meta_description') };
}

/**
 * Public terms of service with provisional copy pending legal approval.
 * @param props - The locale route params.
 * @returns The localized terms of service page.
 */
export default async function TermsOfServicePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TermsOfServicePage' });
  const sections = [
    {
      key: 'general',
      title: t('general_title'),
      body: t('general_body'),
    },
    {
      key: 'owners',
      title: t('owners_title'),
      body: t('owners_body'),
    },
    {
      key: 'bookings',
      title: t('bookings_title'),
      body: t('bookings_body'),
    },
    {
      key: 'privacy',
      title: t('privacy_title'),
      body: t('privacy_body'),
    },
  ];

  return (
    <article className="container-page max-w-3xl py-8 sm:py-14">
      <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
        {t('eyebrow')}
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-5xl">
        {t('title')}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{t('intro')}</p>
      <aside className="mt-6 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-foreground">
        <strong>{t('draft_title')}</strong> {t('draft_body')}
      </aside>
      <div className="mt-8 space-y-7">
        {sections.map((section) => (
          <section key={section.key}>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              {section.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              {section.body}
            </p>
          </section>
        ))}
      </div>
      <p className="mt-10 border-t border-border pt-5 text-xs text-muted-foreground">
        {t('updated')}
      </p>
    </article>
  );
}
