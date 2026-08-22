import { getTranslations, setRequestLocale } from 'next-intl/server';

const SECTIONS = [
  { key: 'data', titleKey: 'data_title', bodyKey: 'data_body' },
  { key: 'use', titleKey: 'use_title', bodyKey: 'use_body' },
  { key: 'sharing', titleKey: 'sharing_title', bodyKey: 'sharing_body' },
  { key: 'retention', titleKey: 'retention_title', bodyKey: 'retention_body' },
  { key: 'security', titleKey: 'security_title', bodyKey: 'security_body' },
  { key: 'rights', titleKey: 'rights_title', bodyKey: 'rights_body' },
  { key: 'deletion', titleKey: 'deletion_title', bodyKey: 'deletion_body' },
  { key: 'contact', titleKey: 'contact_title', bodyKey: 'contact_body' },
] as const;

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'PrivacyPolicyPage' });
  return { title: t('meta_title'), description: t('meta_description') };
}

/**
 * Public privacy policy with provisional copy pending legal approval.
 * @param props - The locale route params.
 * @returns The localized privacy-policy page.
 */
export default async function PrivacyPolicyPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'PrivacyPolicyPage' });

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
        {SECTIONS.map((section) => (
          <section key={section.key}>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              {t(section.titleKey)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              {t(section.bodyKey)}
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
