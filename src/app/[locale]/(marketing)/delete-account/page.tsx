import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DeleteAccountForm } from '@/components/marketing/DeleteAccountForm';

/**
 * Generates non-indexed metadata for the delete account page.
 * @param props - The locale route params.
 * @returns Non-indexed metadata object for search engine exclusion.
 */
export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'DeleteAccountPage' });
  return {
    title: t('meta_title'),
    description: t('meta_description'),
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

/**
 * Public account and personal data deletion request page satisfying Google Play Data Safety requirements.
 * @param props - The locale route params.
 * @returns The localized deletion page.
 */
export default async function DeleteAccountPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'DeleteAccountPage' });

  const policyItems = [
    {
      key: 'deleted_data',
      title: t('deleted_data_title'),
      body: t('deleted_data_body'),
    },
    {
      key: 'retained_data',
      title: t('retained_data_title'),
      body: t('retained_data_body'),
    },
    {
      key: 'timeline',
      title: t('timeline_title'),
      body: t('timeline_body'),
    },
  ] as const;

  return (
    <article className="container-page max-w-3xl py-8 sm:py-14">
      <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
        {t('eyebrow')}
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-5xl">
        {t('title')}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{t('intro')}</p>

      <div className="mt-8">
        <DeleteAccountForm />
      </div>

      <div className="mt-12 space-y-6 rounded-2xl border border-border bg-muted/20 p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold tracking-[-0.02em] text-foreground sm:text-xl">
          {t('info_title')}
        </h2>
        <div className="space-y-5">
          {policyItems.map((item) => (
            <div key={item.key} className="space-y-1.5">
              <h3 className="text-sm font-semibold text-foreground sm:text-base">{item.title}</h3>
              <p className="text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-8 border-t border-border pt-5 text-xs text-muted-foreground">
        {t('support_notice')}
      </p>
    </article>
  );
}
