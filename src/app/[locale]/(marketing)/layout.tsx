import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/libs/I18nNavigation';

export default async function MarketingLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'RootLayout' });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
            iDeal
          </Link>
          <nav>
            <ul className="flex items-center gap-6 text-sm font-medium">
              <li>
                <Link
                  href="/listings"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Listings
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Sign in
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main>{props.children}</main>
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        {t('home_link')}
      </footer>
    </div>
  );
}
