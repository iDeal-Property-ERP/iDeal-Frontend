import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import Link from 'next/link';
import { selectPaymentReturnLocale } from '@/libs/PaymentReturnLocale';

async function paymentReturnLocale() {
  const requestHeaders = await headers();
  return selectPaymentReturnLocale(requestHeaders.get('accept-language'));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await paymentReturnLocale();
  const t = await getTranslations({ locale, namespace: 'PaymentReturnPage' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
    robots: { index: false, follow: false },
  };
}

/**
 * Provides a safe browser fallback when an app-linked payment return is not
 * opened by the mobile application.
 * @returns The payment return fallback page.
 */
export default async function PaymentReturnPage() {
  const locale = await paymentReturnLocale();
  const t = await getTranslations({ locale, namespace: 'PaymentReturnPage' });

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border bg-card p-6 text-card-foreground shadow-lg sm:p-10">
        <p className="font-display text-xl font-bold text-primary">iDeal</p>
        <div
          aria-hidden="true"
          className="mt-8 flex size-12 items-center justify-center rounded-full bg-info-subtle text-xl font-bold text-info-subtle-foreground"
        >
          …
        </div>
        <h1 className="mt-5 text-3xl font-bold">{t('title')}</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">{t('description')}</p>
        <div className="mt-6 rounded-xl border border-info/25 bg-info-subtle p-4 text-sm leading-6 text-info-subtle-foreground">
          {t('verification_notice')}
        </div>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t('back_to_website')}
        </Link>
      </section>
    </main>
  );
}
